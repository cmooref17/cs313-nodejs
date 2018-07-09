function updateNewStore(username, callback) {
   var i;
   var query;
   var params;
   
   for(i = 0; i < 10; i++) {
      getRandomGift(true, (i >= 8), i, function(data) {
         query = 'UPDATE "user" SET shop_' + data.index + ' = $1 WHERE username=$2';
         params = [ data.id, username ];
         pool.query(query, params);
      });
   }
   //while(i < 10) {}
   callback(true);
}

function updateNewGifts(username, callback) {
   var j;
   var query;
   var params;
   
   for(j = 0; j < 4; j++) {
      getRandomGift(false, false, j, function(data) {
         query = 'UPDATE "user" SET gift_' + data.index + ' = $1 WHERE username=$2';
         params = [ data.id, username ];
         pool.query(query, params);
      });
   }
   //while(j < 4){}
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
         console.error(err);
         callback('-1');
         return '-1';
      }
      if(!data.rows[0]) {
         callback('-2');
         return '-2';
      }
      
		pool.query(query, params, (err, data) => {
			
			var json = {id: data.rows[0].id,
							firstName: data.rows[0].first_name,
							lastName: data.rows[0].last_name,
							username: data.rows[0].username,
							email: data.rows[0].email,
							bells: data.rows[0].bells,
							giftDate: data.rows[0].gift_date,
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
                     shop9: data.rows[0].shop_9
                     };
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
         res.end('-1');
         return false;
      }
      if(!data.rows[0]) {
         console.log("Couldn't find item with id: " + id);
         res.end('-2');
         return false;
      }
      var json = {id: data.rows[0].id,
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
      if(store == false)
         console.log(value1, value2);
      callback({id: item,
                index: tmp});
   }
   else if(type == "item" || type == "set") {
      var query = 'SELECT id FROM item WHERE rarity=$1 AND id>=0 AND id < 334';
      var params = [ rarity ];
      
      pool.query(query, params, (err, data) => {
         if(err) {
            console.log(err);
            callback(false);
         }
         else {
            item = randomItem(data.rows);
            item = item.id;
            if(store == false)
               console.log(value1, value2);
            callback({id: item,
                      index: tmp});
         }
      });
   }
}

function purchaseItem(req, res) {
   if(!req.session || !req.session.username) {
		req.end('-1');
		return false;
   }
   var username = req.session.username;
   var id;
	var shopNumber = req.body.shopNumber;
   var numShop;
   console.log("Purchasing item in shop slot: " + shopNumber + " for user: " + username);
   pool.query('SELECT * FROM "user" WHERE username=$1', [ username ], (error, d) => {
      if(error) {
         res.end('-1');
         return false;
      }
      
      if(shopNumber == 0) {
         if(d.rows[0].shop_0 == -1) {
            console.error("Already purchased this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].shop_0;
      }
      else if(shopNumber == 1) {
         if(d.rows[0].shop_1 == -1) {
            console.error("Already purchased this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].shop_1;
      }
      else if(shopNumber == 2) {
         if(d.rows[0].shop_2 == -1) {
            console.error("Already purchased this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].shop_2;
      }
      else if(shopNumber == 3) {
         if(d.rows[0].shop_3 == -1) {
            console.error("Already purchased this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].shop_3;
      }
      else if(shopNumber == 4) {
         if(d.rows[0].shop_4 == -1) {
            console.error("Already purchased this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].shop_4;
      }
      else if(shopNumber == 5) {
         if(d.rows[0].shop_5 == -1) {
            console.error("Already purchased this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].shop_5;
      }
      else if(shopNumber == 6) {
         if(d.rows[0].shop_6 == -1) {
            console.error("Already purchased this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].shop_6;
      }
      else if(shopNumber == 7) {
         if(d.rows[0].shop_7 == -1) {
            console.error("Already purchased this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].shop_7;
      }
      else if(shopNumber == 8) {
         if(d.rows[0].shop_8 == -1) {
            console.error("Already purchased this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].shop_8;
      }
      else if(shopNumber == 9) {
         if(d.rows[0].shop_9 == -1) {
            console.error("Already purchased this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].shop_9;
      }
      
      console.log("Item id: " + id);
      var remainingBells;
      pool.query('SELECT * FROM item WHERE id=$1', [ id ], (err, items) => {
         if(err) {
            res.end('-1');
            return false;
         }
         remainingBells = d.rows[0].bells - items.rows[0].buy_price;
         if(remainingBells < 0) {
            res.end('-1');
            return false;
         }
         
         pool.query('UPDATE "user" SET bells=$1 WHERE username=$2', [ remainingBells, username ]);
         
         var query = 'SELECT * FROM inventory WHERE owner=$1 and item_id=$2';
         var params = [ username, id ];
         
         pool.query(query, params, (err0, data0) => {
            if(err0) {
               res.end('-1');
               return false;
            }
            
            pool.query('SELECT * FROM "user" WHERE username=$1', [username], (errorUser, data) => {
               if(errorUser) {
                  console.error("User: " + username + " doesn't exist");
                  res.end('-1');
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
            res.json({numShop: numShop-1,
                      bells: remainingBells});
         });
      });
   });

}

function redeemGift(req, res) {
   if(!req.session || !req.session.username) {
		req.end('-1');
		return false;
   }
   var username = req.session.username;
   var id;
	var giftNumber = req.body.giftNumber;
   var numGifts;
   
   pool.query('SELECT * FROM "user" WHERE username=$1', [ username ], (error, d) => {
      if(error) {
         res.end('-1');
         return false;
      }
      numGifts = d.rows[0].num_gifts;
      if(giftNumber == 0) {
         if(d.rows[0].gift_0 == -1) {
            console.error("Already redeemed this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].gift_0;
      }
      else if(giftNumber == 1) {
         if(d.rows[0].gift_1 == -1) {
            console.error("Already redeemed this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].gift_1;
      }
      else if(giftNumber == 2) {
         if(d.rows[0].gift_2 == -1) {
            console.error("Already redeemed this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].gift_2;
      }
      else if(giftNumber == 3) {
         if(d.rows[0].gift_3 == -1) {
            console.error("Already redeemed this gift");
            res.end('-1');
            return false;
         }
         id = d.rows[0].gift_3;
      }
      
      console.log("Item id: " + id);
      
      if(id == 334) {
         pool.query('UPDATE "user" SET bells=$1 WHERE username=$2', [d.rows[0].bells+2500, username]);
         res.json({numGifts: numGifts-1,
                   bells: d.rows[0].bells+2500});
         return true;
      } else if(id == 335) {
         pool.query('UPDATE "user" SET bells=$1 WHERE username=$2', [d.rows[0].bells+5000, username]);
         res.json({numGifts: numGifts-1,
                   bells: d.rows[0].bells+5000});
         return true;
      } else if(id == 336) {
         pool.query('UPDATE "user" SET bells=$1 WHERE username=$2', [d.rows[0].bells+8000, username]);
         res.json({numGifts: numGifts-1,
                   bells: d.rows[0].bells+8000});
         return true;
      } else if(id == 337) {
         pool.query('UPDATE "user" SET bells=$1 WHERE username=$2', [d.rows[0].bells+15000, username]);
         res.json({numGifts: numGifts-1,
                   bells: d.rows[0].bells+15000});
         return true;
      }
      
      var query = 'SELECT * FROM inventory WHERE owner=$1 and item_id=$2';
      var params = [ username, id ];
      
      pool.query(query, params, (err0, data0) => {
         if(err0) {
            res.end('-1');
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
         res.json({numGifts: numGifts-1,
                   bells: d.rows[0].bells});
      });
   });
}

function canResetGifts(username, giftDate, callback) {
   var currentDate = getDate();
   callback(giftDate == null || giftDate == 'null' || giftDate == undefined || currentDate >= giftDate || username == 'flipf17');
}

function getSession(req, res) {
   if (!req.session || !req.session.username || req.session == null || req.session.username == null) { // Check if session exists
      res.end('-1');
      return false;
   }
   
   getUser(req.session.username, (returnValue) => {
      if(returnValue == '-1') {
         console.log("Unknown error grabbing user from db");
         res.end('-1');
         return '-1';
      }
      else if(returnValue == '-2') {
         console.log("User doesn't exist");
         res.end('-2');
         return '-2';
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

function login(req, res) {
   var username = req.query.username;
   var password = req.query.password;
   
   var query  = 'SELECT username, password FROM "user" WHERE username = $1';
   var params = [ username ];
  
   pool.query(query, params, (err, result) => {
      if(err) {
         console.log(err);
         res.end(err);
         return 0;
      }
      const user = result.rows[0];
      
      if(user && passwordHash.verify(password, user.password)) {
         console.log("Correct password. Logging in");
         req.session.username = username;
         res.end('1');
      }
      else {
         console.log("Failed to log in");
         res.end('-1');
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
         res.end('-1'); //Username already exists
      }       
      var query1  = 'SELECT EXISTS(SELECT email FROM "user" WHERE email = $1)';
      var params1 = [ email ];
      
      pool.query(query1, params1, (err, result) => {
         const exists = result.rows[0]['exists'];
         if (exists) {
            console.log("Email already exists!");
            res.end('-2'); //Email already exists
         }
         var date = getDate();
         var query2 = 'INSERT INTO "user" (first_name, last_name, username, password, email, gift_date) VALUES($1, $2, $3, $4, $5, $6)';
         var params2 = [firstName, lastName, username, hashedPassword, email, date];
         pool.query(query2, params2, (err, result) => {
            if(err) {
               console.error(err);
               res.end(err);
            }
            else {
               console.error("No errors adding user to db");
               req.session.username = username;
               res.end('1');
            }
            //db.end();
         });
      });
   });
}

const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
//const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://mekritpfsaierc:72aaf980673b4269d1801b6a1a9cc57cb4002133545a550c330d291d943f899c@ec2-54-83-0-158.compute-1.amazonaws.com:5432/d1lvra62cii5am?ssl=true' || 'postgres://mekritpfsaierc:72aaf980673b4269d1801b6a1a9cc57cb4002133545a550c330d291d943f899c@localhost:5432/d1lvra62cii5am?ssl=true';

const { Pool } = require('pg');
const passwordHash = require('password-hash');
var pool = new Pool({connectionString: connectionString});

const session = require('client-sessions');
const rn = require('random-number');
const randomItem = require('random-item');
const wait = require('wait.for');

express()
   .use(express.json())
   .use(express.urlencoded({extended:true}))
   .use(express.static(path.join(__dirname, 'public')))
   .use(session({
      cookieName: 'session',
      secret: 'random_string_goes_here',
      duration: 30 * 60 * 1000,
      activeDuration: 5 * 60 * 1000,
   }))
   .set('views', path.join(__dirname, 'views'))
   .set('view engine', 'ejs')
   .get('/', (req, res) => res.render('pages/index'))
   .get('/signIn', login)
   .get('/getSession', getSession)
   .get('/getDate', getDate)
   .get('/getGift', getGift)
   .post('/register', register)
   .post('/redeem', redeemGift)
   .post('/purchase', purchaseItem)
   .listen(PORT, function() { console.log('Listening on ' + PORT);});

  