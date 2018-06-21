const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

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

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/math', math)
  .get('/shippingPrice', calculatePostage)
  .get('/mathJson', mathJson)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

  