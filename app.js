const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const ejsLint = require("ejs-lint");
const _ = require("lodash");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));

// PASSWORD MATTERS

mongoose.connect("mongodb+srv://admin-jagan:" + process.env.MONGOPASSWORD + "@cluster0.yqwh1.mongodb.net/bankCustomersDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


const customerSchema = new mongoose.Schema({
  _id: Number,
  userID: String,
  name: String,
  balance: Number
});

const Customer = mongoose.model("Customer", customerSchema);
//
// const customer1 = new Customer({
//   _id: 10,
//   userID: "nattu44@epocket",
//   name: "T Natarajan",
//   balance: 459679
// });
//
// customer1.save();

const transactionSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  amount: Number,
  date: String,
  sno: Number
});

const Transaction = mongoose.model("Transaction", transactionSchema);

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/customers", function(req, res) {
  Customer.find(function(err, customerDetails) {
    if (err) {
      console.log(err);
    } else {
      res.render("customers", {
        customerDetails: customerDetails
      });
    }
  });
});

app.get("/customers/:detail", function(req, res) {
  Customer.find(function(err, customerDetails) {
    customerDetails.forEach(function(element) {
      if (_.lowerCase(req.params.detail) === _.lowerCase(element.name)) {
        res.render("details", {
          userID: element.userID,
          name: element.name,
          balance: element.balance
        });
      }
    });
  });
});

app.get("/transfer/:detail", function(req, res) {
  Customer.find(function(err, customerDetails) {
    customerDetails.forEach(function(element) {
      if (_.lowerCase(req.params.detail) === _.lowerCase(element.name)) {
        res.render("transaction", {
          name: element.name,
          balance: element.balance,
          customerDetails: customerDetails
        });
      }
    });
  });
});


app.get("/success", function(req, res) {
  res.render("success");
});

app.get("/failure", function(req, res) {
  res.render("failure");
});

app.get("/transaction-history", function(req, res) {
  Transaction.find(function(err, transactionDetails) {
    if (err) {
      console.log(err);
    } else {
      res.render("transaction-history", {
        transactionDetails: transactionDetails
      });
    }
  });
});

app.post("/processing", function(req, res) {
  const receiver = req.body.receiver;
  const sender = req.body.sender;
  const amount = parseInt(req.body.amount);

  Customer.find(function(err, customerDetails) {
    customerDetails.forEach(function(element) {
      if (element.name === sender) {
        const senderBalance = element.balance;
        if (amount > senderBalance) {
          res.redirect("failure");
        } else {
          const calculatedSender = senderBalance - amount;
          Customer.updateOne({
            name: sender
          }, {
            balance: calculatedSender
          }, function(err) {
            if (err) {
              console.log(err);
            }
          });
          Customer.find(function(err, customerDetails) {
            customerDetails.forEach(function(element) {
              if (element.name === receiver) {
                const receiverBalance = Number(element.balance);
                const calculatedReceiver = receiverBalance + amount;
                Customer.updateOne({
                  name: receiver
                }, {
                  balance: calculatedReceiver
                }, function(err) {
                  if (err) {
                    console.log(err);
                  }
                });
              }
            });
          });


          var date = new Date();

          var options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: "Asia/Kolkata"
          };

          var formattedDate = date.toLocaleString('en-US', options);
          const data = new Transaction({
            sender: sender,
            receiver: receiver,
            amount: amount,
            date: formattedDate,
          });
          Transaction.create(data, function(req, res) {
            if (err) {
              console.log(err);
            }
          });

          res.redirect("success");
        }
      }
    });
  });
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server running on port 3000");
});
