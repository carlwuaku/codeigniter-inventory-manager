const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


//schema
const Model = require('../models/productModel');
const Helper = require('../helpers/productHelper.js');
const Constants = require("../constants")
const ActivitiesHelper = require('../helpers/activitiesHelper');


router.get('/getList', function (req, res) {
    var obj = Helper.prep_data(req.query)
    var offset = req.query.offset == undefined ? 0 : parseInt(req.query.offset);
    var limit = req.query.limit == undefined ? 1000 : parseInt(req.query.limit);
    // if (req.query.status != undefined) {
    //     obj.status = req.query.status
    // }
    // if(req.query.customer != undefined){
    //     obj.customer = req.query.customer
    // }
    Model.find(obj)
        
        .skip(offset)
        .limit(limit)
        .sort("name")
        .exec()
        .then(docs => {
            docs.map(d => {
                d['id'] = d._id;
                if (d.picture != null) {
                    //get the thumbnail
                    d.picture = Constants.base_url + Constants.product_image_url + d.picture
                    d.thumbnail = Constants.base_url + Constants.product_image_thumbnail_url + d.thumbnail

                }
            })
            Model.count(obj).then(count => {
                res.status(200).json({ status: 1, data: docs, total: count, limit: limit });
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});


// router.get('/list', function (req, res) {
//     Model.find()
//         .sort("name")
//         .exec()
//         .then(docs => {
//             docs.map(d => {
//                 if (d.picture != null) {
//                     //get the thumbnail
//                     d.picture = Constants.base_url + Constants.product_image_url + d.picture
//                     d.thumbnail = Constants.base_url + Constants.product_image_thumbnail_url + d.thumbnail

//                 }
//             })
//             res.status(200).json({ status: 1, data: docs });
//         })
//         .catch(err => {
//             res.status(500).json({
//                 error: err
//             })
//         })
// });

router.post('/save', function (req, res) {

    //add/update Customer
    var obj = Helper.prep_data(req.body);
    //if an id was submitted, update. else add
    var id = req.body._id;
    var query;
    if (id == undefined || id == null) {
        const ad = new Model(obj);
        ad.save()
            .then(result => {
                ActivitiesHelper.save(req.body.display_name +" added new product "+ req.body.name);

                res.json({ status: '1', data: result });
                //console.log(result)
            })
            .catch(err => {
                console.log(err);
                res.json({ status: '-1', message: err });

            });
    }
    else {


        Model.update({ _id: req.body._id }, obj)
            .then(result => {
                ActivitiesHelper.save(req.body.display_name +" edited product "+ req.body.name);

                result['id'] = result._id;
                res.json({ status: '1', data: result });
            })
            .catch(err => {
                res.json({ status: '-1', message: err });
            })

    }



});


router.get('/count_by_field', function (req, res) {
    //get the counts by a field and value
    var field = req.query.field;
    var val = req.query.val;
    var obj = {}
    obj[field] = val;
    Model.count(obj)
        .then(result => {
            res.json({ status: "1", data: result });
            //console.log(result)
        })
        .catch(err => {
            res.json({ status: "-1" });

        });


});







router.get('/findById', function (req, res) {
    Model.findById(req.query.id)
        .exec()
        .then(docs => {
            docs['id'] = docs._id;
            if (docs.picture != null) {
                docs.picture = Constants.base_url + Constants.product_image_url + docs.picture
                docs.thumbnail = Constants.base_url + Constants.product_image_thumbnail_url + docs.thumbnail

            }
            res.status(200).json({ status: 1, data: docs });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

router.post('/delete', function (req, res) {

    var id = req.body._id;

    Model.remove({ "_id": id })
        .then(result => {
            ActivitiesHelper.save(req.body.display_name +" deleted product "+ req.body.name);

            res.json({ status: "1" });
            //console.log(result)
        })
        .catch(err => {
            res.json({ status: "-1" });

        });


});

router.get('/count', function (req, res) {

    Model.count()
        .then(result => {
            res.json({ status: "1", data: result });
            //console.log(result)
        })
        .catch(err => {
            res.json({ status: "-1" });

        });


});

router.get('/getCategories', function (req, res) {

    Model.find().distinct("category")
        .then(result => {
            res.json({ status: "1", data: result });
            //console.log(result)
        })
        .catch(err => {
            res.json({ status: "-1" });

        });




});

router.get('/search', function (req, res) {
    var param = req.query.param;
    var query = Helper.search(param);
    Model.find().or(query)
        .exec()
        .then(docs => {
            docs.map(d => {
                d['id'] = d._id;
                if (d.picture != null) {
                    //get the thumbnail
                    d.picture = Constants.base_url + Constants.product_image_url + d.picture
                    d.thumbnail = Constants.base_url + Constants.product_image_thumbnail_url + d.thumbnail

                }
            })
            res.status(200).json({ status: 1, data: docs });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
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
    let location = "public/assets/product_images/" + new_name;
    let thumb_location = "public/assets/product_images/thumbnails/";
    // Use the mv() method to place the file somewhere on your server
    let base_location = Constants.base_url + Constants.product_image_url + new_name;
    file.mv(location, function (err) {
        if (err)
            return res.status(500).send(err);
        //create a thumbnail 
        var thumb = require('node-thumbnail').thumb;
        thumb({
            source: location,
            destination: thumb_location
        }).then(function (file) {
            /** the file object is an array of objects
             * [{ srcPath: 'public\\assets\\customer_images\\1526546458704.jpg',
    width: 800,
    basename: undefined,
    dstPath: 'public\\assets\\product_images\\thumbnails\\1526546458704_thumb.jpg' }]
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

//get each category and its count
router.get('/getCategoryCounts', function (req, res) {
    

    Model.aggregate([
        
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 }
            }
        }
    ])
        .exec()
        .then(docs => {
            var items = [];
            docs.map(d => {
                d["category"] = d._id;
            })
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