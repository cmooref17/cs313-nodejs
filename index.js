const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000


function login(req, res) {
   console.log('Called login function');
   var username = req.query.username;
   var password = req.query.password;
   var hashedPassword = passwordHash.generate(password);
   console.log(username);
   console.log(hashedPassword);
   
   var uri = "postgres://mekritpfsaierc:72aaf980673b4269d1801b6a1a9cc57cb4002133545a550c330d291d943f899c@localhost:5432/d1lvra62cii5am";
   
   const pg = require('pg');
   const pool = new pg.Pool();
   
   

   pool.query('SELECT username, password FROM "user" WHERE username = $1 AND password = $2', [username, password], (err, res) => {
      if (err) {
         throw err
      }

      console.log('user: ', res.rows[0])
   })
}

function register(req, res) {
   console.log("Attempting to register user");
   const data = req.query;
   const hashedPassword = passwordHash.generate(data.password);
   const text = 'INSERT INTO "user" (first_name, last_name, username, password, email) VALUES($1, $2, $3, $4, $5)';
   const values = [data.first_name, data.last_name, data.username, hashedPassword, data.email];
   
   const { Pool } = require('pg');
   const pool = new Pool();
   
   pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
   })
   
   // callback - checkout a client
   pool.connect((err, client, done) => {
      if (err) throw err
      client.query('SELECT * FROM "user" WHERE username = $1', [username], (err, res) => {
         done()
         if (err) {
            console.log(err.stack)
         } else {
            console.log(res.rows[0])
         }
      })
   })
   
   // promise - checkout a client
   pool.connect()
   .then(client => {
      return client.query('SELECT * FROM "user" WHERE username = $1', [username])
         .then(res => {
         client.release()
         console.log(res.rows[0])
      })
      .catch(e => {
         client.release()
         console.log(err.stack)
      })
   })
   
   // async/await - check out a client
   (async () => {
      const client = await pool.connect()
      try {
         const res = await client.query('SELECT * FROM "user" WHERE username = $1', [username])
         console.log(res.rows[0])
      } finally {
         client.release()
      }
   })().catch(e => console.log(e.stack))
}


function calculatePostage(req, res) {
   var weight = Number(req.query.weight);
   var type = req.query.type;
   
   var price;
   
   console.log(weight);
   console.log(type);

   if(type = "ls") { //Letters (stamped)
      if(weight < 1)
         price = .50;
      else if(weight < 2)
         price = .71;
      else if(weight < 3)
         price = .92;
      else if(weight < 3.5)
         price = 1.13;
      else
         price = -weight;
   }
   else if(type = "lm") { //Letter (metered)
      if(weight < 1)
         price = .47;
      else if(weight < 2)
         price = .68;
      else if(weight < 3)
         price = .89;
      else if(weight < 3.5)
         price = 1.10;
      else
         price = -weight;
   }
   else if(type = "le") { //Large envelope (flats)
      if(weight >= 13)
         price = -weight;
      else {
         price = 1.00 + Math.floor(weight) * .21;
      }
   }
   else if(type = "fc") { //First-class package service--retail
      if(weight < 4)
         price = 3.50;
      else if(weight < 8)
         price = 3.75;
      else if(weight < 9)
         weight = 4.10;
      else if(weight < 10)
         price = 4.45;
      else if(weight < 11)
         price = 4.80;
      else if(weight < 12)
         price = 5.15;
      else if(weight < 13)
         price = 5.50;
      else
         price = -1;
   }
   
   console.log("Price: " + price);
   res.render('shippingPrice', { price: price});
}
function math(req, res) {
   var value1 = Number(req.query.value1);
   var value2 = Number(req.query.value2);
   var operator = req.query.operator;
   var result;
   
   console.log(value1);
   console.log(value2);
   console.log(operator);
   
   if(operator == "Add") {
      result = value1 + value2;
   }
   else if(operator == "Subtract") {
      result = value1 - value2;
   }  
   else if(operator == "Multiply") {
      result = value1 * value2;
   }
   else if(operator == "Divide") {
      result = value1 / value2;
   }
   console.log(result + '\n');
   res.render('results', {result: result});
}
function mathJson(req, res) {
   var value1 = Number(req.query.value1);
   var value2 = Number(req.query.value2);
   var operator = req.query.operator;
   var result;
   
   console.log(value1);
   console.log(value2);
   console.log(operator);
   
   if(operator == "Add") {
      result = value1 + value2;
   }
   else if(operator == "Subtract") {
      result = value1 - value2;
   }  
   else if(operator == "Multiply") {
      result = value1 * value2;
   }
   else if(operator == "Divide") {
      result = value1 / value2;
   }
   console.log(result + '\n');
   res.json({ result: result });
}

//const express = require('express');
//const path = require('path');
const router = express.Router();
const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/todo';
var passwordHash = require('password-hash');



express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/math', math)
  .get('/shippingPrice', calculatePostage)
  .get('/mathJson', mathJson)
  .get('/login', login)
  .get('/register', register)
  .listen(PORT, () => console.log('Listening on ${ PORT }'))

  