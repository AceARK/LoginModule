var db = require("../models");
var sessions = require("express-session");
var crypto = require('crypto');

// Standard crypto hashing sha512 algorithm
const sha512 = (password, salt) => {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    let value = hash.digest('hex');
    return {
        salt: salt,
        passwordHash: value
    };
};

// Create hashString
const genRandomString = (length) => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};


module.exports = function(app) {

	// Handling login of user
	app.post("/login", function(req, res) { 
		console.log(req.body.email);
		console.log(req.body.password);
		// Initializing req session to access email role id and username
		var session = req.session;
        var email = req.body.email;
        var password = req.body.password;
       
        // Retrieve salt and hash to compare 
        db.User.findOne({
            where: {
                email: email
            }
        }).then(function(data) {
            var salt = data.salt;
            // remaking hashed password to compare
            var hashedPassword = sha512(req.body.password, salt).passwordHash;
            if (hashedPassword === data.hash) {
            	// Get session variables to use for display/validation purposes
                session.uniqueID = [data.email, data.role, data.id, data.username];
                if (data.role === "admin") {
                    res.json("Admin logged in.");
                } else if (data.role === "user") {
                    res.json("User " + data.username + " logged in successfully.");
                } else {
                    console.log('No role found');
                }
            }else {
                res.json("Illegal entry detected.");
                res.status(400).send();
            }
        
        }).catch(function(err) {
            console.log("The error is" + err);
            res.status(400).send();
        });
	}); 

	// Registering a new user
	app.post("/register", function(req, res) {
		console.log(req.body.email);
		console.log(req.body.password);
		console.log(req.body.username);
		req.checkBody('email', 'Email is required').notEmpty();
        req.checkBody('email', 'Email is not valid').isEmail();
        req.checkBody('username', 'Username is required').notEmpty();
        req.checkBody('password', 'Password is required').notEmpty();
        req.checkBody('passwordConfirm', 'Passwords do not match').equals(req.body.password);


        var errors = req.validationErrors();

        if (errors) { //if errors restart register page
            req.session.errors = errors;
            req.session.success = false;
            res.json(errors);
        }else { //else look if there is a current user with same username or same email address

        	db.User.findAll({
    	   	where: {
    	   		$or: [
    		   		{
    		   			username: req.body.username
    		   		},
    		   		{
    		   			email: req.body.email
    	   			}
    	   		]
    	   	}
    	   	}).then(function(userResults) {
    	   		if(userResults.length){ //if there is a match of same name, restart register page
    	   			res.json( "Username or e-mail already in use");
    	   		}else { //else hash password and create the user

                    var salt = genRandomString(32);
                    var hashedPassword = sha512(req.body.password, salt).passwordHash;

                    db.User.create({
                        email: req.body.email,
                        username: req.body.username,
                        hash: hashedPassword,
                        salt: salt
                    }).then(function(result) {
                        res.json("New user created");
                    });   		
                }

    	   	});
        }
	});
}