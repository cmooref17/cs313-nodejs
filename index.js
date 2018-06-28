

function login(req, res) {
   var username = req.query.username;
   var password = req.query.password;
   
   //var hashedPassword = passwordHash.
   
   console.log("Got user: " + username);
   console.log("Got password: " + password);
}

function register(req, res) {
   var firstName = req.body.firstName;
   var lastName = req.body.lastName;
   var username = req.body.username;
   var password = req.body.password1;
   var password2 = req.body.password2;
   var email = req.body.email;
   
   var client = new pg.Client(connectionString);
   client.connect();
   console.log("Got here");
}

const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const pg = require('pg');
const connectionString = process.env.DATABASE_URL 
|| 'postgres://mekritpfsaierc:72aaf980673b4269d1801b6a1a9cc57cb4002133545a550c330d291d943f899c@ec2-54-83-0-158.compute-1.amazonaws.com:5432/d1lvra62cii5am' 
|| 'postgres://localhost:5432/todo';

const passwordHash = require('password-hash');

const pool = new pg.Pool(connectionString);

express()
   .use(express.json())
   .use(express.urlencoded({extended:true}))
   .use(express.static(path.join(__dirname, 'public')))
   .set('views', path.join(__dirname, 'views'))
   .set('view engine', 'ejs')
   .get('/', (req, res) => res.render('pages/index'))
   .get('/signIn', login)
   .post('/signUp', register)
   .listen(PORT, function() { console.log('Listening on ' + PORT);});

  