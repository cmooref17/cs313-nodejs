
function getSession() {
   if (req.session && req.session.user) // Check if session exists
      res.end(req.session.user);
   else
      res.end('-1');
}

function logUserIn(username) {
   app.use(session({
      cookieName: 'session',
      secret: 'random_string_goes_here',
      duration: 30 * 60 * 1000,
      activeDuration: 5 * 60 * 1000,
   }));
}

function login(req, res) {
   var username = req.query.username;
   var password = req.query.password;
   
   //var db = new pg.Client(connectionString);
   //db.connect();
   
   console.log("Logging in user: " + username + " with password: " + password);
   
   var query  = 'SELECT username, password FROM "user" WHERE username = $1';
   var params = [ username ];
  
   pool.query(query, params, (err, result) => {
      if(err) {
         console.log(err);
         res.end(err);
      }
      const user = result.rows[0];
      
      if(passwordHash.verify(password, user.password)) {
         console.log("Correct password. Logging in");
         logUserIn(username);
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
   
   //var db = new pg.Client(connectionString);
   //db.connect();
   
   var query  = 'SELECT EXISTS(SELECT username FROM "user" WHERE username = $1)';
   var params = [ username ];
  
   pool.query(query, params, (err, result) => {
      console.log("Testing1");
      const exists = result.rows[0]['exists'];
      if (exists) {
         console.log("Username already exists!");
         res.end('-1'); //Username already exists
      } else {
         console.log("Username doesn't exist! Good"); //Good
      }
      
      var query1  = 'SELECT EXISTS(SELECT email FROM "user" WHERE email = $1)';
      var params1 = [ email ];
      
      pool.query(query1, params1, (err, result) => {
         const exists = result.rows[0]['exists'];
         if (exists) {
            console.log("Email already exists!");
            res.end('-2'); //Email already exists
         } else {
            console.log("Email doesn't exist! Good"); //Good
         }
      
         var query2 = 'INSERT INTO "user" (first_name, last_name, username, password, email) VALUES($1, $2, $3, $4, $5)';
         var params2 = [firstName, lastName, username, hashedPassword, email];
         pool.query(query2, params2, (err, result) => {
            if(err) {
               console.error(err);
               res.end(err);
            }
            else {
               console.error("No errors adding user to db");
               logUserIn(username);
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
const connectionString = process.env.DATABASE_URL || 'postgres://mekritpfsaierc:72aaf980673b4269d1801b6a1a9cc57cb4002133545a550c330d291d943f899c@ec2-54-83-0-158.compute-1.amazonaws.com:5432/d1lvra62cii5am?ssl=true' || 
'postgres://mekritpfsaierc:72aaf980673b4269d1801b6a1a9cc57cb4002133545a550c330d291d943f899c@localhost:5432/d1lvra62cii5am?ssl=true';

const { Pool } = require('pg');
const passwordHash = require('password-hash');
var pool = new Pool({connectionString: connectionString});

var session = require('client-sessions');

express()
   .use(express.json())
   .use(express.urlencoded({extended:true}))
   .use(express.static(path.join(__dirname, 'public')))
   .set('views', path.join(__dirname, 'views'))
   .set('view engine', 'ejs')
   .get('/', (req, res) => res.render('pages/index'))
   .get('/signIn', login)
   .get('/getSession', getSession)
   .post('/register', register)
   .listen(PORT, function() { console.log('Listening on ' + PORT);});

  