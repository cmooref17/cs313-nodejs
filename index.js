function getItemsInDb(req, res) {
   const query = 'SELECT item_name FROM item WHERE id >= $1';
   const params = [ 0 ];
   
   pool.query(query, params, (err, data) => {
      if(err) {
         console.log(err);
         res.json({success: false,
                   err: err});
      }
      else if(!data.rows[0]) {
         console.log('Found no items in db');
         res.json({success: false,
                   err: 'Found no items in db'});
      }
      else {
         console.log("Num items: " + data.rows.length);
         res.json(data.rows);
      }
   });
}

function postTrade(req, res) {
   if(!req.session || !req.session.username) {
      console.log("User not signed in when posting trade");
      res.json({success: false,
                err: "User not signed in"});
      return false;
   }
   var username = req.session.username;
   var offeredItem = req.body.offer;
   var requestedItem = req.body.request;
   
   var offerId;
   var requestId;
   
   //Get offered item id
   pool.query('SELECT * FROM item WHERE item_name=$1', [ offeredItem ], (err, data) => {
      if(err || !data.rows[0]) {
         console.log(err);
         res.json({success: false,
                   err: err});
         return false;
      }
      offerId = data.rows[0].id;
      //Get requested item id
      pool.query('SELECT * FROM item WHERE item_name=$1', [ requestedItem ], (err, data) => {
         if(err || !data.rows[0]) {
            console.log(err);
            res.json({success: false,
                      err: err});
            return false;
         }
         requestId = data.rows[0].id;
         
         //Verify user has offered item
         pool.query('SELECT * FROM inventory WHERE owner=$1 AND item_id=$2 AND count>$3', [username, offerId, 0], (err, data) => {
            if(err || !data.rows[0]) {
               console.log(err);
               res.json({success: false,
                         err: err});
               return false;
            }
            
            //Create trade
            pool.query('INSERT INTO trade (owner, item_offered, item_requested) VALUES($1, $2, $3)', [username, offerId, requestId], (err, data) => {
               if(err) {
                  console.log(err);
                  res.json({success: false,
                            err: err});
                  return false;
               }
               console.log("Successfully created a trade offer for: " + username);
               res.json({success: true});
               return true;
            });
         });
      });
   });
}

function getTradeItems(req, res) {
   var offerId = -1;
   var requestId = -1;
   var showApplicable = req.query.showApplicable;
   console.log("applic: " + showApplicable);
   var username = null;
   if(req.session.username)
      username = req.session.username;
   
   //Get offer item id
   pool.query('SELECT * FROM item WHERE item_name=$1', [ req.query.offer ], (err, data) => {
      if(!err && data.rows[0]) {
         offerId = data.rows[0].id;
         console.log("Offerid: " + offerId);
      }
      else {
         offerId = -1;
         if(req.query.offer != "") {
            res.json([]);
            console.log("Found no item in db named: " + req.query.offer);
            return 0;
         }
      }
      //Get request item id
      pool.query('SELECT * FROM item WHERE item_name=$1', [ req.query.request ], (err, data) => {
         if(!err && data.rows[0]) {
            requestId = data.rows[0].id;
            console.log("Requestid: " + requestId);
         }
         else {
            requestId = -1;
            if(req.query.request != "") {
               res.json([]);
               console.log("Found no item in db named: " + req.query.request);
               return 0;
            }
         }
         
         var query = 'SELECT * FROM trade ';
         var params = [];
         var index = 1;
         if((showApplicable == true || showApplicable == 'true') && username != null) {
            console.log("Got here");
            query += `INNER JOIN inventory
                      ON trade.item_requested = inventory.item_id
                      WHERE inventory.owner=$` + index + ` AND trade_completed=$` + (index+1) + ` `;
            params.push(username);
            params.push(false);
            index += 2;
         }
         else {
            query += 'WHERE trade_completed=$' + index + ' ';
            params.push(false);
            index++;
         }
         
         if(offerId != -1) {
            query += 'AND item_offered=$' + index + ' ';
            params.push(offerId);
            index++;
         }
         if(requestId != -1) {
            query += 'AND item_requested=$' + index + ' ';
            params.push(requestId);
            index++;
         }
         console.log("Stuff: " + showApplicable, username);
         
         query += 'LIMIT $' + index + ' OFFSET $' + (index+1);
         params.push(req.query.limit);
         params.push(req.query.offset);
         
         console.log("ids:", offerId, requestId);
         console.log("query:", query);
         console.log("params:", params);
        
         pool.query(query, params, (err, data) => {
            if(err) {
               console.log("Error grabbing trade items: " + err);
               console.log("Offset: " + req.query.offset + " Limit: " + req.query.limit);
               res.json({success: false,
                         err: err});
               return false;
            }
            if(req.query.offer || req.query.request)
               console.log("Searching by item offered: " + req.query.offer + ". Item requested: " + req.query.request);
            console.log("Found " + data.rows.length + " items in trade db");
            for(var i = 0; i < data.rows.length; i++) {
               console.log(i + ": " + data.rows[i].item_offered, data.rows[i].item_requested);
            }
            res.json(data.rows);
            return true;
         });
      });
   });
}

function completeTrade(req, res) {
   if(!req.session || !req.session.username) {
      console.log("User not signed in when posting trade");
      res.json({success: false,
                err: "User not signed in"});
      return false;
   }
   console.log("Attempting trade...");
   var user = req.session.username;
   var tradeId = req.body.id;
   console.log("Trade id: " + tradeId);
   const query = 'SELECT * FROM trade WHERE id=$1';
   const params = [ tradeId ];
   pool.query(query, params, (err, data) => {
      if(err || !data.rows[0]) {
         console.log("Error loading trade with id: " + tradeId);
         console.log(err);
         res.json({success: false,
                   err: err});
         return false;
      }
      var trade = data.rows[0];
      var offer = trade.item_offered;
      var request = trade.item_requested;
      //Does owner still own offered item?
      pool.query('SELECT * FROM inventory WHERE owner=$1 AND item_id=$2', [ trade.owner, trade.item_offered ], (err, data) => {
         if(err || !data.rows[0] || data.rows[0].count == 0) {
            console.log("Error. Owner may not own that item anymore");
            console.log(err);
            res.json({success: false,
                      err: err});
            pool.query('UPDATE trade SET trade_completed=$1 WHERE id=$2', [ true, tradeId ]); //Close trade
            return false;
         }
         //Does user own requested item?
         pool.query('SELECT * FROM inventory WHERE owner=$1 AND item_id=$2', [ user, trade.item_requested], (err, data) => {
            if(err || !data.rows[0] || data.rows[0].count == 0) {
               console.log("Error. User may not own requested item.");
               console.log(err);
               res.json({success: false,
                         err: err});
               return false;
            }
            //Attempt to give trade owner requested item
            giveItem(trade.owner, trade.item_requested, (data) => {
               if(data.success == false) {
                  console.log("Error giving owner requested item: " + data.err);
                  res.json(data);
               }
               //Attempt to give user offered item
               giveItem(user, trade.item_offered, (data) => {
                  if(data.success == false) {
                     console.log("Error giving owner's offered item: " + data.err);
                     res.json(data);
                  }
                  //Remove offered item from trade owner
                  removeItem(trade.owner, trade.item_offered, (data) => {
                     if(data.success == false) {
                        console.log("Error in removing owner's offered item: " + data.err);
                        res.json(data);
                        return false;
                     }
                     //Remove requested item from user
                     removeItem(user, trade.item_requested, (data) => {
                        if(data.success == false) {
                           console.log("Error in removing owner's requested item: " + data.err);
                           res.json(data);
                           return false;
                        }
                        //Close trade
                        pool.query('UPDATE trade SET trade_completed=$1 WHERE id=$2', [ true, trade.id ], (err, data) => {
                           if(err) {
                              console.log(err);
                              res.json({success: false,
                                        err: err});
                              return false;
                           }
                           //Set trade completed by...
                           pool.query('UPDATE trade SET trade_completed_by=$1 WHERE id=$2', [ user, trade.id ], (err, data) => {
                              if(err) {
                                 console.log(err);
                                 res.json({success: false,
                                           err: err});
                                 return false;
                              }
                              console.log('Trade completed');
                              res.json({success: true});
                           });
                        });
                     });
                  });
               });
            });
         });
      });
   });
}

function sellItem(req, res) {
	if(!req.session || !req.session.username) {
		res.json({success: false,
					 err: 'User not logged in'});
		return false;
	}
	var username = req.session.username;
	var itemId = req.body.id;
	var inventoryCount = 0;
   console.log("Selling item with id: " + itemId);
	pool.query('SELECT * FROM inventory WHERE owner=$1', [username], (err, data) => {
		if(err) {
			console.log(err);
			res.json({success: false,
						 err: err});
			return false;
		}
      var i;
      for(i = 0; i < data.rows.length; i++) {
         inventoryCount += data.rows[i].count;
      }
      pool.query('SELECT * FROM inventory WHERE item_id = $1 AND owner=$2', [itemId, username], (err, data) => {
         if(err) {
            console.log(err);
            callback({success: false,
                      err: err});
         }
         if(!data.rows[0] || data.rows[0].count == 0) {
            console.log("No items exist to sell");
            res.json({success: false,
                      err: "No items exist to sell"});
            return false;
         }
         var count = data.rows[0].count;
         var sellPrice;
         var currentBells;
         pool.query('UPDATE inventory SET count=$1 WHERE item_id=$2 AND owner=$3', [count-1, itemId, username], (err, data) => {
            if(err) {
               console.log("Error updating item count in inventory");
               res.json({success: false,
                         err: err });
               return false;
            }
            getItemById(itemId, username, (item) => {
               if(item.success == false) {
                  res.json(item);
                  return false;
               }
               sellPrice = item.sellPrice;
               getUser(username, (user) => {
                  if(user.success == false) {
                     res.json(user);
                     return false;
                  }
                  currentBells = user.bells + sellPrice;
                  
                  pool.query('UPDATE "user" SET bells=$1 WHERE username=$2', [currentBells, username], (err, data) => {
                     if(err) {
                        console.log("Error setting user's new bells balance: " + err);
                        res.json(err);
                        return false;
                     }
                     console.log("User: " + username + " successfully sold item with id: " + itemId + " for " + sellPrice + " bells. New balance: " + currentBells);
                     count--;
                     inventoryCount--;
                     console.log("Count: " + count);
                     res.json({success: true,
                               set: item.set,
                               numItemsInSet: item.numItemsInSet,
                               count: count,
                               bells: currentBells,
                               inventoryCount: inventoryCount});
                     return true;
                  });
               });
				});
			});
		});
	});
}

function getInventory(req, res) {
   if(!req.session || !req.session.username) {
      console.log('Not logged in');
      res.json({success: false,
                err: 'Not logged in'});
      return false;
   }
   var username = req.session.username;
   if(req.query.user) {
      username = req.query.user;
      console.log("user:" + username);
   }
   
   const query = `SELECT * FROM inventory 
                  INNER JOIN item 
                  ON inventory.item_id = item.id 
                  WHERE owner=$1 AND count > 0
                  ORDER BY set, rarity ASC`;
   const params = [ username ];
   pool.query(query, params, (err, items) => {
      if(err) {
         console.log(err);
         res.json({success: false,
                   err: err});
         return false;
      }
      res.json(items.rows);
   });
}

function getItem(req, res) {
   var id = req.query.id;
   var username;
   if(!req.session || !req.session.username)
      username = null;
   else
      username = req.session.username;
   
   getItemById(id, username, (data) => {
      if(data.success == false) {
         console.log("Error grabbing item: " + data.err);
         res.json(data);
         return false;
      }
      else {
         res.json(data);
         return true;
      }
   });
}

function getItemById(id, username, callback) {
   const query = 'SELECT * FROM item WHERE id=$1';
   const params = [ id ];
   var maxNumInSet;
   var numItemsInSet = -1;
   pool.query(query, params, (err, items) => {
      if(err) {
         console.log(err);
         callback({success: false,
                   err: err});
      }
      if(!items.rows[0]) {
         console.log("Error finding item in db with id: " + id);
         callback({success: false,
                   err: "Couldn't find item in db with id: " + id});
      }
      
      pool.query('SELECT DISTINCT item_name FROM item WHERE set=$1', [ items.rows[0].set ], (err, data) => {
         if(err) {
            console.log(err);
            callback({success: false,
                      err: err});
         }
         maxNumInSet = data.rows.length;
         if(username != null) {
            const query0 = `SELECT *
                            FROM inventory 
                            INNER JOIN item 
                            ON inventory.item_id = item.id
                            WHERE set=$1 AND owner=$2 AND count>0`;
            const params0 = [ items.rows[0].set, username ];
            
            pool.query(query0, params0, (err, data) => {
               if(err) {
                  console.log("Error grabbing current number of items in set: " + err);
                  callback({success: false,
                            err: err});
               }
               numItemsInSet = data.rows.length;
               callback({success: true,
                         id: items.rows[0].id,
                         name: items.rows[0].item_name,
                         buyPrice: items.rows[0].buy_price,
                         sellPrice: items.rows[0].sell_price,
                         set: items.rows[0].set,
                         imgUrl: items.rows[0].img_url,
                         rarity: items.rows[0].rarity,
                         maxItemsInSet: maxNumInSet,
                         numItemsInSet: numItemsInSet});
            });
         }
         else {
            callback({success: true,
                      id: items.rows[0].id,
                      name: items.rows[0].item_name,
                      buyPrice: items.rows[0].buy_price,
                      sellPrice: items.rows[0].sell_price,
                      set: items.rows[0].set,
                      imgUrl: items.rows[0].img_url,
                      rarity: items.rows[0].rarity,
                      maxNumInSet: maxNumInSet,
                      numItemsInSet: numItemsInSet});
         }
      });
   });
}

function updateNewStore(username, callback) {
   var i;
   var query;
   var params;
   
   for(i = 0; i < 10; i++) {
      getRandomGift(true, (i >= 8), i, (data) => {
         if(data.success == true) {
            query = 'UPDATE "user" SET shop_' + data.index + ' = $1 WHERE username=$2';
            params = [ data.id, username ];
            pool.query(query, params);
         }
      });
   }
   callback(true);
}

function updateNewGifts(username, callback) {
   var j;
   var query;
   var params;
   
   for(j = 0; j < 4; j++) {
      getRandomGift(false, false, j, function(data) {
         if(data.success == true) {
            query = 'UPDATE "user" SET gift_' + data.index + ' = $1 WHERE username=$2';
            params = [ data.id, username ];
            pool.query(query, params);
         }
      });
   }
   callback(true);
}

function resetGifts(username, callback) {
   console.log("Resetting gifts for: " + username);
	updateNewGifts(username, (valid) => {
      if(valid == true) {
         updateNewStore(username, (valid) => {
            if(valid == true) {
               pool.query('UPDATE "user" SET num_gifts=4 WHERE username=$1', [username]);
               pool.query('UPDATE "user" SET num_shop=10 WHERE username=$1', [username]);
               var date = getDate();
               date.setDate(date.getDate() + 1);
               var query3 = 'UPDATE "user" SET gift_date = $1 WHERE username = $2';
               var params3 = [ date, username];
               pool.query(query3, params3, (err) => {
                  callback(true);
                  return true;
               });
            } else {
               callback(false);
               return false;
            }
         });
      } else {
         callback(false);
         return false;
      }
   });
}

function getUser(username, callback) {
   var query = 'SELECT * FROM "user" WHERE username=$1';
   var params = [ username ];
   
   pool.query(query, params, (err, data) => {
      if(err) {
         console.log(err);
         callback({success: false,
                   err: err});
         return false;
      }
      if(!data.rows[0]) {
         callback({success: false,
                   err: 'Error getting user. User might not exist'});
         return false;
      }
      var currentDate = new Date();
      console.log("Date: " + currentDate.getDate());
		pool.query(query, params, (err, data) => {
         var giftDate = data.rows[0].gift_date;
         var timeUntilReset = parseInt((giftDate - currentDate)/1000); //Time in seconds

			var json = {success: true,
                     id: data.rows[0].id,
							firstName: data.rows[0].first_name,
							lastName: data.rows[0].last_name,
							username: data.rows[0].username,
							email: data.rows[0].email,
							bells: data.rows[0].bells,
							giftDate: data.rows[0].gift_date,
                     timeUntilReset: timeUntilReset,
							numGifts: data.rows[0].num_gifts,
                     numShop: data.rows[0].num_shop,
							item0: data.rows[0].gift_0,
							item1: data.rows[0].gift_1,
							item2: data.rows[0].gift_2,
							item3: data.rows[0].gift_3,
                     shop0: data.rows[0].shop_0,
                     shop1: data.rows[0].shop_1,
                     shop2: data.rows[0].shop_2,
                     shop3: data.rows[0].shop_3,
                     shop4: data.rows[0].shop_4,
                     shop5: data.rows[0].shop_5,
                     shop6: data.rows[0].shop_6,
                     shop7: data.rows[0].shop_7,
                     shop8: data.rows[0].shop_8,
                     shop9: data.rows[0].shop_9};
			callback(json);
			return json;
		});
   });
}

function getGift(req, res) {
   var id = req.query.id;
   
   var query = "SELECT * FROM item WHERE id=$1";
   var params = [ id ];
   
   pool.query(query, params, (err, data) => {
      if(err) {
         console.log(err);
         res.json({success: false,
                   err: err});
         return false;
      }
      else if(!data.rows[0]) {
         console.log("Couldn't find item with id: " + id);
         res.json({success: false,
                   err: "Couldn't find item with id: " + id});
         return false;
      }
      var json = {success: true,
                  id: data.rows[0].id,
                  name: data.rows[0].item_name,
                  buyPrice: data.rows[0].buy_price,
                  sellPrice: data.rows[0].sell_price,
                  set: data.rows[0].set,
                  rarity: data.rows[0].rarity,
                  imgUrl: data.rows[0].img_url};
                
      res.json(json);
      return json;
   });
}

function getDate() {
   var today = new Date();
   return today;
}

function getRandomGift(store, rarePlus, tmp, callback) {
   var options = {
      min:  0,
      max:  100,
      integer: true
   }
   
   var value1 = rn(options); //Random number from 1-100
   var value2;
   var common = 65;   //60% (60 total)
   var uncommon = 85; //20% (85 total)
   var rare = 95;     //10% (95 total)
   var ultra = 100;   //5%  (100 total)
   var rarity;
   var type = "item";
   var item;
   
   if(value1 <= common) { //0-65 Common
      value2 = value1 / common * 100;
      rarity = 0;
   }
   else if(value1 <= uncommon) {//65-85 Uncommon 
      value2 = (value1 - common) / (uncommon - common) * 100;
      rarity = 1;
   }
   else if(value1 <= rare) {//85-95 Rare
      value2 = (value1 - uncommon) / (rare - uncommon) * 100;
      rarity = 2;
   }
   else {//95-100 Ultra rare
      value2 = (value1 - rare) / (ultra - rare) * 100;
      rarity = 3;
   }
   if(rarePlus == true) {
      if(value1 <= 90) {
         value2 = 90/value1*100;
         rarity = 2;
      }
      else {
         value2 = 10/(100-value1)*100;
         rarity = 3;
      }
   }
   
   
   if(rarity < 3) {
      if(value2 <= 80 || store == true) //20% for bells
         type = "item";
      else
         type = "bells";
   }
   else {
      if(value2 <= 75 || store == true) //75%
         type = "item";
      else if(value2 <= 95) //20%
         type = "bells";
      else 
         type = "set"; //5% "set"
   } 
   if(type == "bells") {
      if(rarity == 0) {
         item = 334;
      }
      else if(rarity == 1) {
         item = 335;
      }
      else if(rarity == 2) {
         item = 336;
      }
      else {
         item = 337;
      }
      callback({success: true,
                id: item,
                index: tmp});
   }
   else if(type == "item" || type == "set") {
      var query = 'SELECT id FROM item WHERE rarity=$1 AND id>=0 AND id < 334';
      var params = [ rarity ];
      
      pool.query(query, params, (err, data) => {
         if(err) {
            console.log(err);
            callback({success: false,
                      err: err});
         }
         else {
            item = randomItem(data.rows);
            item = item.id;
            callback({success: true,
                      id: item,
                      index: tmp});
         }
      });
   }
}

function purchaseItem(req, res) {
   if(!req.session || !req.session.username) {
		res.json({success: false,
                err: "User isn't logged in"});
		return false;
   }
   var username = req.session.username;
   var id;
	var shopNumber = req.body.shopNumber;
   var numShop;
   console.log("Purchasing item in shop slot: " + shopNumber + " for user: " + username);
   pool.query('SELECT * FROM "user" WHERE username=$1', [ username ], (error, d) => {
      if(error) {
         console.log(error);
         res.json({success: false,
                   err: error});
         return false;
      }
      var user = d.rows[0];
      numShop = user.num_shop;
      
      if(shopNumber == 0) {
         if(user.shop_0 == -1) {
            console.error("Already purchased this gift");
            res.json({success: false,
                      err: 'Already purchased this gift'});
            return false;
         }
         id = user.shop_0;
      } else if(shopNumber == 1) {
         if(user.shop_1 == -1) {
            console.error("Already purchased this gift");
            res.json({success: false,
                      err: 'Already purchased this gift'});
            return false;
         }
         id = user.shop_1;
      } else if(shopNumber == 2) {
         if(user.shop_2 == -1) {
            console.error("Already purchased this gift");
            res.json({success: false,
                      err: 'Already purchased this gift'});
            return false;
         }
         id = user.shop_2;
      } else if(shopNumber == 3) {
         if(user.shop_3 == -1) {
            console.error("Already purchased this gift");
            res.json({success: false,
                      err: 'Already purchased this gift'});
            return false;
         }
         id = user.shop_3;
      } else if(shopNumber == 4) {
         if(user.shop_4 == -1) {
            console.error("Already purchased this gift");
            res.json({success: false,
                      err: 'Already purchased this gift'});
            return false;
         }
         id = user.shop_4;
      } else if(shopNumber == 5) {
         if(user.shop_5 == -1) {
            console.error("Already purchased this gift");
            res.json({success: false,
                      err: 'Already purchased this gift'});
            return false;
         }
         id = user.shop_5;
      } else if(shopNumber == 6) {
         if(user.shop_6 == -1) {
            console.error("Already purchased this gift");
            res.json({success: false,
                      err: 'Already purchased this gift'});
            return false;
         }
         id = user.shop_6;
      } else if(shopNumber == 7) {
         if(user.shop_7 == -1) {
            console.error("Already purchased this gift");
            res.json({success: false,
                      err: 'Already purchased this gift'});
            return false;
         }
         id = user.shop_7;
      } else if(shopNumber == 8) {
         if(user.shop_8 == -1) {
            console.error("Already purchased this gift");
            res.json({success: false,
                      err: 'Already purchased this gift'});
            return false;
         }
         id = user.shop_8;
      } else if(shopNumber == 9) {
         if(user.shop_9 == -1) {
            console.error("Already purchased this gift");
            res.json({success: false,
                      err: 'Already purchased this gift'});
            return false;
         }
         id = user.shop_9;
      } 
      
      console.log("Item id: " + id);
      
      var remainingBells;
      pool.query('SELECT * FROM item WHERE id=$1', [ id ], (err, items) => {
         if(err) {
            console.log(err);
            res.json({success: false,
                      err: err});
            return false;
         }
         console.log("Item name: " + items.rows[0].item_name);
         remainingBells = user.bells - items.rows[0].buy_price;
         console.log("User's bells: " + user.bells);
         console.log("Item price: " + items.rows[0].buy_price);
         
         if(remainingBells < 0) {
            console.log("Insufficient bells");
            res.json({success: false,
                      err: "Insufficient bells"});
            return false;
         }
         
         pool.query('UPDATE "user" SET bells=$1 WHERE username=$2', [ remainingBells, username ]);
         
         var query = 'SELECT * FROM inventory WHERE owner=$1 and item_id=$2';
         var params = [ username, id ];
         
         pool.query(query, params, (err0, data0) => {
            if(err0) {
               console.log(err0);
               res.json({success: false,
                         err: err0});
               return false;
            }
            
            pool.query('SELECT * FROM "user" WHERE username=$1', [username], (errorUser, data) => {
               if(errorUser) {
                  console.log(errorUser);
                  res.json({success: false,
                            err: errorUser});
                  return false;
               }
               numShop = data.rows[0].num_shop;
               pool.query('UPDATE "user" SET num_shop = $1 WHERE username=$2', [ numShop-1, username ]);
               if(!data0.rows[0]) {
                  var query1 = 'INSERT INTO inventory (owner, item_id) VALUES($1, $2)'
                  var params1 = [ username, id ];
                  
                  pool.query(query1, params1);
                  pool.query('UPDATE "user" SET shop_' + shopNumber + ' = -1 WHERE username=$1', [ username ]);
               }
               else {
                  var query2 = 'UPDATE inventory SET count = $1 WHERE owner=$2 and item_id=$3';
                  var params2 = [ (data0.rows[0].count + 1), username, id];
                  
                  pool.query(query2, params2);
                  pool.query('UPDATE "user" SET shop_' + shopNumber + ' = -1 WHERE username=$1', [ username ]);
               }
            });
            if(numShop == 10) {
               var date = getDate();
               date.setDate(date.getDate() + 1);
               var query3 = 'UPDATE "user" SET gift_date = $1 WHERE username = $2';
               var params3 = [ date, username];
               pool.query(query3, params3);
            }
            res.json({success: true,
                      numShop: numShop-1,
                      bells: remainingBells});
         });
      });
   });
}

function giveItem(user, itemId, callback) {
   const query = 'SELECT * FROM inventory WHERE owner=$1 AND item_id=$2';
   const params = [ user, itemId ];
   
   pool.query(query, params, (err, data) => {
      var inventory = data.rows[0];
      if(err) {
         console.log(err);
         callback({success: false,
                   err: err});
      }
      if(!inventory) { //Create new inventory
         pool.query('INSERT INTO inventory (owner, item_id) VALUES($1, $2)', [user, itemId], (err, data) => {
            if(err) {
               console.log(err);
               callback({success: false,
                         err: err});
            }
            callback({success: true}); //Inserted new item into inventory successfully
         });
      }
      else { //Increment count of item
         pool.query('UPDATE inventory SET COUNT=$1 WHERE owner=$2 AND item_id=$3', [(inventory.count+1), user, itemId], (err, data) => {
            if(err) {
               console.log(err);
               callback({success: false,
                         err: err});
            }
            callback({success: true}); //Incremented item count in inventory successfully
         });
      }
   });
}

function removeItem(user, itemId, callback) {
   const query = 'SELECT * FROM inventory WHERE owner=$1 AND item_id=$2 AND count>0';
   const params = [ user, itemId ];
   
   console.log(query, params);
   pool.query(query, params, (err, data) => {
      var inventory = data.rows[0];
      if(err && inventory) {
         console.log(err);
         callback({success: false,
                   err: err});
      }
      console.log("New item count: " + (inventory.count-1) + " of item: " + itemId);
      if(inventory.count>0) { //Create new inventory
         pool.query('UPDATE inventory SET count=$1 WHERE owner=$2 AND item_id=$3', [(inventory.count-1), user, itemId], (err, data) => {
            if(err) {
               console.log(err);
               callback({success: false,
                         err: err});
            }
            callback({success: true}); //Inserted new item into inventory successfully
         });
      }
      else {
         console.log("Failed to remove item with count: " + inventory.count);
         callback({success: false,
                   err: 'Item count: ' + inventory.count});
      }
   });
}

function redeemGift(req, res) {
   if(!req.session || !req.session.username) {
		res.json({success: false,
                err: "User isn't logged in"});
		return false;
   }
   var username = req.session.username;
   var id;
	var giftNumber = req.body.giftNumber;
   var numGifts;
   
   pool.query('SELECT * FROM "user" WHERE username=$1', [ username ], (error, d) => {
      if(error) {
         res.json({success: false,
                   err: error});
         return false;
      }
      var user = d.rows[0];
      numGifts = user.num_gifts;
      
      if(giftNumber == 0) {
         if(user.gift_0 == -1) {
            console.error("Already redeemed this gift");
            res.json({success: false,
                      err: "Already redeemed this gift"});
            return false;
         }
         id = user.gift_0;
      }
      else if(giftNumber == 1) {
         if(user.gift_1 == -1) {
            console.error("Already redeemed this gift");
            res.json({success: false,
                      err: "Already redeemed this gift"});
            return false;
         }
         id = user.gift_1;
      }
      else if(giftNumber == 2) {
         if(user.gift_2 == -1) {
            console.error("Already redeemed this gift");
            res.json({success: false,
                      err: "Already redeemed this gift"});
            return false;
         }
         id = user.gift_2;
      }
      else if(giftNumber == 3) {
         if(user.gift_3 == -1) {
            console.error("Already redeemed this gift");
            res.json({success: false,
                      err: "Already redeemed this gift"});
            return false;
         }
         id = user.gift_3;
      }
      
      console.log("Item id: " + id);
      
      if(id == 334) {
         pool.query('UPDATE "user" SET bells=$1 WHERE username=$2', [user.bells+2500, username]);
         pool.query('UPDATE "user" SET num_gifts = $1 WHERE username=$2', [ numGifts-1, username ]);
         pool.query('UPDATE "user" SET gift_' + giftNumber + ' = -1 WHERE username=$1', [ username ]);
         res.json({success: true,
                   numGifts: numGifts-1,
                   bells: user.bells+2500});
         return true;
      } else if(id == 335) {
         pool.query('UPDATE "user" SET bells=$1 WHERE username=$2', [user.bells+5000, username]);
         pool.query('UPDATE "user" SET num_gifts = $1 WHERE username=$2', [ numGifts-1, username ]);
         pool.query('UPDATE "user" SET gift_' + giftNumber + ' = -1 WHERE username=$1', [ username ]);
         res.json({success: true,
                   numGifts: numGifts-1,
                   bells: user.bells+5000});
         return true;
      } else if(id == 336) {
         pool.query('UPDATE "user" SET bells=$1 WHERE username=$2', [user.bells+8000, username]);
         pool.query('UPDATE "user" SET num_gifts = $1 WHERE username=$2', [ numGifts-1, username ]);
         pool.query('UPDATE "user" SET gift_' + giftNumber + ' = -1 WHERE username=$1', [ username ]);
         res.json({success: true,
                   numGifts: numGifts-1,
                   bells: user.bells+8000});
         return true;
      } else if(id == 337) {
         pool.query('UPDATE "user" SET bells=$1 WHERE username=$2', [user.bells+15000, username]);
         pool.query('UPDATE "user" SET num_gifts = $1 WHERE username=$2', [ numGifts-1, username ]);
         pool.query('UPDATE "user" SET gift_' + giftNumber + ' = -1 WHERE username=$1', [ username ]);
         res.json({success: true,
                   numGifts: numGifts-1,
                   bells: user.bells+15000});
         return true;
      }
      
      var query = 'SELECT * FROM inventory WHERE owner=$1 and item_id=$2';
      var params = [ username, id ];
      
      pool.query(query, params, (err0, data0) => {
         if(err0) {
            res.json({success: false,
                      err: err0});
            return false;
         }
         pool.query('UPDATE "user" SET num_gifts = $1 WHERE username=$2', [ numGifts-1, username ]);
         if(!data0.rows[0]) {
            var query1 = 'INSERT INTO inventory (owner, item_id) VALUES($1, $2)'
            var params1 = [ username, id ];
            
            pool.query(query1, params1);
            pool.query('UPDATE "user" SET gift_' + giftNumber + ' = -1 WHERE username=$1', [ username ]);
         }
         else {
            var query2 = 'UPDATE inventory SET count = $1 WHERE owner=$2 and item_id=$3';
            var params2 = [ (data0.rows[0].count + 1), username, id];
            
            pool.query(query2, params2);
            pool.query('UPDATE "user" SET gift_' + giftNumber + ' = -1 WHERE username=$1', [ username ]);
         }
         if(numGifts == 4) {
            var date = getDate();
            date.setDate(date.getDate() + 1);
            var query3 = 'UPDATE "user" SET gift_date = $1 WHERE username = $2';
            var params3 = [ date, username];
            pool.query(query3, params3);
         }
         res.json({success: true,
                   numGifts: numGifts-1,
                   bells: user.bells});
      });
   });
}

function canResetGifts(username, giftDate, callback) {
   var currentDate = getDate();
   callback(giftDate == null || giftDate == 'null' || giftDate == undefined || currentDate >= giftDate);
}

function getSession(req, res) {
   if (!req.session || !req.session.username || req.session == null || req.session.username == null) { // Check if session exists
      res.json({success: false,
                err: "User not logged in"});
      return false;
   }
   getUser(req.session.username, (returnValue) => {
      if(returnValue.success == false) {
         console.log("Unknown error grabbing user from db");
         res.json({success: false,
                   err: "Unknown error grabbing user from db"});
         return false;
      }
      else {
			canResetGifts(req.session.username, returnValue.giftDate, (valid) => {
				if(valid == true) {
               resetGifts(req.session.username, (valid) => {
                  if(valid) {
                     getUser(req.session.username, (returnValue2) => {
                        res.json(returnValue2);
                        return returnValue2;
                     });        
                  }                  
               });
				}
				else {
					res.json(returnValue);
					return returnValue;
				}
			});
      }
   });
}

function logout(req, res) {
   if(!req.session || !req.session.username) {
      console.log("Not logged in. Aborting logout");
      res.json({success: false,
                err: 'Not logged in'});
   }
   req.session.destroy();
   res.json({success: true});
}

function login(req, res) {
   var username = req.query.username;
   var password = req.query.password;
   
   if(username == 'admin' && password == 'admin') {
      console.log("Logging in as admin");
   }
   
   var query  = 'SELECT username, password FROM "user" WHERE username = $1';
   var params = [ username ];
  
   pool.query(query, params, (err, result) => { 
      if(err) { //User doesn't exist in db
         console.log(err);
         res.json({success: false,
                   error: 'Invalid username and/or password'});
         return false;
      }
      const user = result.rows[0];
      
      if(user && passwordHash.verify(password, user.password)) { //Password matches
         console.log("Correct password. Logging in");
         req.session.username = username;
         res.json({success: true});
      }
      else { //Password doesn't match
         console.log("Failed to log in. Password doesn't match");
         res.json({success: false,
                   err: 'Invalid username and/or password'});
      }
   });
}

function register(req, res) {
   var firstName = req.body.firstName;
   var lastName = req.body.lastName;
   var username = req.body.username;
   var password = req.body.password;
   var email = req.body.email;
   
   console.log("Password: " + password);
   var hashedPassword = passwordHash.generate(password);
   console.log("Hashed password: " + hashedPassword);
   
   var query  = 'SELECT EXISTS(SELECT username FROM "user" WHERE username = $1)';
   var params = [ username ];
  
   pool.query(query, params, (err, result) => {
      const exists = result.rows[0]['exists'];
      if (exists) {
         res.json({success: false,
                   err: 'User already exists',
                   code: 1}); //Username already exists
      }       
      var query1  = 'SELECT EXISTS(SELECT email FROM "user" WHERE email = $1)';
      var params1 = [ email ];
      
      pool.query(query1, params1, (err, result) => {
         const exists = result.rows[0]['exists'];
         if (exists) {
            console.log("Email already exists!");
            res.json({success: false,
                      err: 'Email already taken',
                      code: 2}); //Email already exists
         }
         var date = getDate();
         var query2 = 'INSERT INTO "user" (first_name, last_name, username, password, email, gift_date) VALUES($1, $2, $3, $4, $5, $6)';
         var params2 = [firstName, lastName, username, hashedPassword, email, date];
         pool.query(query2, params2, (err, result) => {
            if(err) {
               console.error(err);
               res.json({success: false,
                         err: err,
                         code: 3});
            }
            else {
               console.error("Successfully registered user, and added user to database. Logging user in now.");
               req.session.username = username;
               res.json({success: true});
            }
         });
      });
   });
}

const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const connectionString = process.env.DATABASE_URL || 'postgres://mekritpfsaierc:72aaf980673b4269d1801b6a1a9cc57cb4002133545a550c330d291d943f899c@ec2-54-83-0-158.compute-1.amazonaws.com:5432/d1lvra62cii5am?ssl=true' || 'postgres://mekritpfsaierc:72aaf980673b4269d1801b6a1a9cc57cb4002133545a550c330d291d943f899c@localhost:5432/d1lvra62cii5am?ssl=true';

const { Pool } = require('pg');
const passwordHash = require('password-hash');
var pool = new Pool({connectionString: connectionString});

const session = require('client-sessions');
const rn = require('random-number');
const randomItem = require('random-item');

express()
   .use(express.json())
   .use(express.urlencoded({extended:true}))
   .use(express.static(path.join(__dirname, 'public')))
   .use(session({
      cookieName: 'session',
      secret: 'random_string_goes_here',
      duration: 24 * 60 * 60 * 1000, //24 hours
      activeDuration: 5 * 60 * 1000,
   }))
   .set('views', path.join(__dirname, 'views'))
   .set('view engine', 'ejs')
   .get('/', (req, res) => res.render('pages/index'))
   .get('/signIn', login)
   .get('/signOut', logout)
   .get('/getSession', getSession)
   .get('/getDate', getDate)
   .get('/getGift', getGift)
   .get('/showInventory', getInventory)
   .get('/getItem', getItem)
   .get('/getTradeItems', getTradeItems)
   .get('/getItemNames', getItemsInDb)
   .post('/register', register)
   .post('/redeem', redeemGift)
   .post('/purchase', purchaseItem)
	.post('/sell', sellItem)
   .post('/postTrade', postTrade)
   .post('/completeTrade', completeTrade)
   .listen(PORT, function() { console.log('Listening on ' + PORT);});

  