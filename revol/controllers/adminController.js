const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


//schema
const Admin = require('../models/adminModel');

router.get('/list', function (req, res) {
	Admin.find()
		.exec()
		.then(docs => {
			res.status(200).json(docs);
		})
		.catch(err => {
			res.status(500).json({
				error: err
			})
		})
})

router.post('/add', function (req, res) {
	var bcrypt = require('bcrypt');
	//hash password
	var password = req.body.password;
	var hash = bcrypt.hashSync(password, 10);
	//add new admin
	const ad = new Admin({
		_id: mongoose.Types.ObjectId(),
		username: req.body.username,
		display_name: req.body.display_name,
		password: hash
	});


	ad.save()
		.then(result => {
			res.json(result);
			console.log(result)
		})
		.catch(err => {
			console.log(err);
		});


});

router.post('/login', function (req, res) {
	var bcrypt = require('bcrypt');
	var username = req.body.username;
	var password = req.body.password;
	var token = "";
	const now = new Date();
	var hash = bcrypt.hashSync(username + now, 10);

	Admin.find().exec(function (err, users) {
		if (err) {
			res.json({ status: '-1' });
		}
		var real = false;
		var user = null;
		for (var i = 0; i < users.length; i++) {
			var item = users[i];
			if (item.username == username) {
				//check the password
				if (bcrypt.compareSync(password, item.password)) {
					// Passwords match
					// Passwords match 
					real = true;
					user = item;
					break;//break out of the loop
				} else {
					// Passwords don't match
				}


			}
		}

		if (real) {

			//generate the token using username and current timestamp
			user.token = bcrypt.hashSync(username + now, 10);
			//update the user with the new token. if successful, log the user in
			// Admin.update({id: user.id})
			// .set({token: user.token});
			Admin.update(
				{ id: user.id },
				{
					token: user.token
				}
			).exec(function (err, d) {
				if (err) {
					res.json({ status: '0' })
				}
				console.log(user)
				res.json({ status: '1', user_data: user });

			});
			// user.save(function(err){
			// 	if(err){res.json({status: '0'});}
			// 	else{

			// 	}
			// })

		}
		else { res.json({ status: '-2' }); }

	});
});

//export the whole thingy
module.exports = router;