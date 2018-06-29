

function login(req, res) {
   var username = req.query.username;
   var password = req.query.password;
   
   var db = new pg.Client(connectionString);
   db.connect();
   
   console.log("Logging in user: " + username + " with password: " + password);
   
   var query  = 'SELECT username, password FROM "user" WHERE username = $1';
   var params = [ username ];
  
   db.query(query, params, (err, result) => {
      const user = result.rows[0];
      
      if(passwordHash.verify(password, user.password)) {
         console.log("Correct password. Loggin in");
         res.writeHead(200);
         res.write("/project2/home.html");
         db.end();
         return res.end();
      }
      else {
         console.log("Failed to log in");
         res.end("Failed to log in. Invalid username and/or password");
      }
      db.end();
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
   
   var db = new pg.Client(connectionString);
   db.connect();
   
   console.log("Connected to db");
   
   var query  = 'SELECT EXISTS(SELECT username FROM "user" WHERE username = $1)';
   var params = [ username ];
  
   db.query(query, params, (err, result) => {
      console.log("Testing1");
      const exists = result.rows[0]['exists'];
      if (exists) {
         console.log("User already exists!");
         res.end("User already exists!");
      } else {
         console.log("User doesn't exist! Good"); //Good
      }
      
      var query2 = 'INSERT INTO "user" (first_name, last_name, username, password, email) VALUES($1, $2, $3, $4, $5)';
      var params2 = [firstName, lastName, username, hashedPassword, email];
      db.query(query2, params2, (err, result) => {
         if(err)
            console.error(err);
         else
            console.error("No errors adding user to db");
         res.end("Success!");
         db.end();
      });
   });
}

const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const pg = require('pg');
const connectionString = 'postgres://mekritpfsaierc:72aaf980673b4269d1801b6a1a9cc57cb4002133545a550c330d291d943f899c@ec2-54-83-0-158.compute-1.amazonaws.com:5432/d1lvra62cii5am?ssl=true';

const passwordHash = require('password-hash');

express()
   .use(express.json())
   .use(express.urlencoded({extended:true}))
   .use(express.static(path.join(__dirname, 'public')))
   .set('views', path.join(__dirname, 'views'))
   .set('view engine', 'ejs')
   .get('/', (req, res) => res.render('pages/index'))
   .get('/signIn', login)
   .post('/register', register)
   .listen(PORT, function() { console.log('Listening on ' + PORT);});

  