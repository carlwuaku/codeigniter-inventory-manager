const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


//schema
const Staff = require('../models/staffModel');
const RolesModel = require('../models/RolesModel');
const ActivitiesHelper = require('../helpers/activitiesHelper');

router.get('/getList', function (req, res) {
	Staff.find().populate("role")
		.exec()
		.then(docs => {
			res.status(200).json({ status: 1, data: docs });
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
	//add new Staff
	const ad = new Staff({
		_id: mongoose.Types.ObjectId(),
		username: req.body.username,
		display_name: req.body.display_name,
		password: hash,
		contact: req.body.contact,
		email: req.body.email,
		role: req.body.role
	});


	ad.save()
		.then(result => {
			res.json(result);
			//console.log(result)
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

	Staff.find().populate("role").exec(function (err, users) {
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
				real = true;
				user = item;
				user.password = "";
				break;//break out of the loop


			}
		}

		if (real) {

			//generate the token using username and current timestamp
			user.token = bcrypt.hashSync(username + now, 10);
			//update the user with the new token. if successful, log the user in
			// Staff.update({id: user.id})
			// .set({token: user.token});
			Staff.update(
				{ _id: user._id },
				{
					token: user.token
				}
			).exec(function (err, d) {
				if (err) {
					res.json({ status: '0' })
				}

				user.id = user._id;
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

router.post('/upload', function (req, res) {
	if (!req.files)
		return res.status(500).send('No files were uploaded.');

	// The name of the input field (i.e. "uploadFile") is used to retrieve the uploaded file
	let file = req.files.uploadFile;
	let name_of_file = file.name;
	//break down the name to get the extension
	let split_name = name_of_file.split(".");
	let extension = split_name.pop();
	let new_name = Date.now() + "." + extension;
	let location = "public/assets/customer_images/" + new_name;
	let thumb_location = "public/assets/customer_images/thumbnails/";
	// Use the mv() method to place the file somewhere on your server
	let base_location = Constants.base_url + Constants.customer_image_url + new_name;
	file.mv(location, function (err) {
		if (err)
			return res.status(500).send(err);
		//create a thumbnail customer_image_thumbnail_url
		var thumb = require('node-thumbnail').thumb;
		thumb({
			source: location,
			destination: thumb_location
		}).then(function (file) {
			/** the file object is an array of objects
			 * [{ srcPath: 'public\\assets\\customer_images\\1526546458704.jpg',
	width: 800,
	basename: undefined,
	dstPath: 'public\\assets\\customer_images\\thumbnails\\1526546458704_thumb.jpg' }]
	to get the filename of the thumbnail, split the dstpath prop and pop that array
			 */
			var thumbarray = file[0].dstPath.split("\\");
			var thumbnail_name = thumbarray.pop()
			res.json({ status: "1", data: { filename: new_name, location: base_location, thumbnail: thumbnail_name } });
		}).catch(function (e) {
			console.log('Error', e.toString());
		});

	});
});


// router.get('/getBySchool', function (req, res) {
// 	Staff.find({school_id: req.query.id})
// 	.populate("role")
// 		.exec()

//         .then(docs => {
//             res.status(200).json({status: 1, data:docs});
//         })
//         .catch(err => {
//             res.status(500).json({
//                 error: err
//             })
//         })
// })
router.post('/addRole', function (req, res) {

	//add new role
	const ad = new RolesModel;
	ad.role_name = req.body.role_name;
	ad.description = req.body.description;
	//ad.permissions.push(req.body.permission)

	ad.save()
		.then(result => {
			ActivitiesHelper.save(req.body.display_name + " added new role  " + req.body.role_name);

			res.json({ status: "1", data: result });
			//console.log(result)
		})
		.catch(err => {
			console.error(err)
			res.json({ status: "-1" });

		});


});

router.get('/findById', function (req, res) {
	Staff.findById(req.query.id).populate("role")
		.exec()
		.then(docs => {
			docs['id'] = docs._id;

			res.status(200).json({ status: 1, data: docs });
		})
		.catch(err => {
			res.status(500).json({
				error: err
			})
		})
});
//export the whole thingy
module.exports = router;