function updateNewGifts(username, callback) {
   getRandomGift(function(item_id) {
		const query = 'UPDATE "user" SET gift_0 = $1 WHERE username=$2';
		const params = [ item_id, username ];
		pool.query(query, params);
      getRandomGift(function(item_id) {
         const query = 'UPDATE "user" SET gift_1 = $1 WHERE username=$2';
         const params = [ item_id, username ];
         pool.query(query, params);
         getRandomGift(function(item_id) {
            const query = 'UPDATE "user" SET gift_2 = $1 WHERE username=$2';
            const params = [ item_id, username ];
            pool.query(query, params);
            getRandomGift(function(item_id) {
               const query = 'UPDATE "user" SET gift_3 = $1 WHERE username=$2';
               const params = [ item_id, username ];
               pool.query(query, params);
               const query0 = 'UPDATE "user" SET num_gifts = 4 WHERE username=$1'; //Set gifts count back to 4
               const params0 = [ username ];
               pool.query(query0, params0, (err) => {
                  var date = getDate(); //Set new date
                  date.setDate(date.getDate() + 1);
                  const query1 = 'UPDATE "user" SET gift_date = $1 WHERE username = $2';
                  const params1 = [ date, username];
                  pool.query(query1, params1, (err) => {
                     callback(true);
                  });
               });
            });
         });
      });
	});
}

function resetGifts(username, callback) {
   console.log("Resetting gifts for: " + username);
	updateNewGifts(username, (valid) => {
      if(valid) {
         callback(true);
      }
      else
         callback(false);
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
      
      canResetGifts(data.rows[0].gift_date, (valid0) => {
         resetGifts(username, (valid) => {
            if(valid) {
               var json = {id: data.rows[0].id,
                  firstName: data.rows[0].first_name,
                  lastName: data.rows[0].last_name,
                  username: data.rows[0].username,
                  email: data.rows[0].email,
                  bells: data.rows[0].bells,
                  giftDate: data.rows[0].gift_date,
                  numGifts: data.rows[0].num_gifts,
                  item0: data.rows[0].gift_0,
                  item1: data.rows[0].gift_1,
                  item2: data.rows[0].gift_2,
                  item3: data.rows[0].gift_3};
               callback(json);
               return json;
            }
            else {
               var json = {id: data.rows[0].id,
                  firstName: data.rows[0].first_name,
                  lastName: data.rows[0].last_name,
                  username: data.rows[0].username,
                  email: data.rows[0].email,
                  bells: data.rows[0].bells,
                  giftDate: data.rows[0].gift_date,
                  numGifts: data.rows[0].num_gifts,
                  item0: data.rows[0].gift_0,
                  item1: data.rows[0].gift_1,
                  item2: data.rows[0].gift_2,
                  item3: data.rows[0].gift_3};
               callback(json);
               return json;
            }
         });
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

function getRandomGift(callback) {
   var options = {
      min:  0,
      max:  100,
      integer: true
   }
   
   var value1 = rn(options); //Random number from 1-100
   var value2;
   var common = 50;   //50% (60 total)
   var uncommon = 80; //30% (85 total)
   var rare = 95;     //15% (95 total)
   var ultra = 100;   //5%  (100 total)
   var rarity;
   var type = "item";
   var item;
   
   if(value1 <= common) { //0-60 Common
      value2 = value1 / common * 100;
      rarity = 0;
      options = {
         min:  0,
         max:  1500,
         integer: true
      }
   }
   else if(value1 <= uncommon) {//60-85 Uncommon 
      value2 = (value1 - common) / (uncommon - common) * 100;
      rarity = 1;
      options = {
         min:  0,
         max:  2000,
         integer: true
      }
   }
   else if(value1 <= rare) {//85-95 Rare
      value2 = (value1 - uncommon) / (rare - uncommon) * 100;
      rarity = 2;
      options = {
         min:  0,
         max:  5000,
         integer: true
      }
   }
   else {//95-100 Ultra rare
      value2 = (value1 - rare) / (ultra - rare) * 100;
      rarity = 3;
      options = {
         min:  0,
         max:  10000,
         integer: true
      }
   }
   
   if(rarity < 3) {
      if(value2 <= 60)
         type = "item";
      else
         type = "bells";
   }
   else {
      if(value2 <= 50)
         type = "item";
      else if(value2 <= 95)
         type = "bells";
      else type = "set";
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
      callback(item);
   }
   else if(type == "item" || type == "set") {
      var query = 'SELECT id FROM item WHERE rarity=$1';
      var params = [ rarity ];
      
      pool.query(query, params, (err, data) => {
         if(err) {
            console.log(err);
            callback(false);
         }
         else {
            item = randomItem(data.rows);
            item = item.id;
            console.log("Item: " + item + ", rarity: " + rarity);
            callback(item);
         }
      });
   }
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
            numGifts = data.rows[0].num_gifts;
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
         });
         if(numGifts == 4) {
            var date = getDate();
            date.setDate(date.getDate() + 1);
            var query3 = 'UPDATE "user" SET gift_date = $1 WHERE username = $2';
            var params3 = [ date, username];
            pool.query(query3, params3);
         }
         res.json({numGifts: numGifts-1});
      });
   });
}

function canResetGifts(giftDate, callback) {
   var currentDate = getDate();
   callback(giftDate == null || currentDate >= giftDate);
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
         res.json(returnValue);
         return returnValue;
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
   .listen(PORT, function() { console.log('Listening on ' + PORT);});

  