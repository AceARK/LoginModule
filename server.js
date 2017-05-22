var express = require("express");
var bodyParser = require("body-parser");
var expressValidator = require('express-validator');
var expressSession = require('express-session');

var app = express();
var PORT = process.env.PORT || 3000;

var db = require("./models");

// Set up Express app to handle data parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

// Use express Validator right after bodyparser
app.use(expressValidator());

// Static directory
app.use(express.static("./public"));

// Configuring express session
app.use(expressSession({
	secret: 'login secret',
	// save only if not initialized
	saveUninitialized: false,
	// setting resave to false i.e. save only in case of changes
	resave: false
}));

// Require controller
require("./controllers/user-controller.js")(app);

// Syncing sequelize models, then starting express app
db.sequelize.sync({force: false}).then(function() {
  app.listen(PORT, function() {
    console.log("App listening on PORT " + PORT);
  });
});