const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


//schema
const Model = require('../models/purchaseModel');
const Helper = require('../helpers/purchaseHelper');
const Constants = require("../constants");
const ActivitiesHelper = require('../helpers/activitiesHelper');

router.get('/getList', function (req, res) {
    var obj = {}
    var offset = req.query.offset == undefined ? 0 : parseInt(req.query.offset);
    var limit = req.query.limit == undefined ? 10 : parseInt(req.query.limit);
    if (req.query.status != undefined) {
        obj.status = req.query.status
    }
    if(req.query.vendor != undefined){
        obj.vendor = req.query.vendor
    }
    Model.find(obj)
        .populate("product")
        .populate("vendor")
        .skip(offset)
        .limit(limit)
        .exec()
        .then(docs => {
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

router.post('/save', function (req, res) {

    //add/update order
    var obj = Helper.prep_data(req.body);
    //if an id was submitted, update. else add
    var id = req.body._id;
    var query;
    if (id == undefined || id == null) {


        const ad = new Model(obj);
        ad.save()
            .then(result => {
                ActivitiesHelper.save(req.body.display_name +" added new purchase  "+ req.body.code+ " from "+ req.body.vendor_name);

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
                ActivitiesHelper.save(req.body.display_name +" edited purchase  "+ req.body.code+ " from "+ req.body.vendor_name);

                res.json({ status: '1', data: result });
            })
            .catch(err => {
                res.json({ status: '-1', message: err });
            })

    }



});

router.post('/saveBulk', function (req, res) {


    //add bulk sales items. things will be sent as an comma separated string
    var products = req.body.products;
    var prices = req.body.prices;
    var quantities = req.body.quantities;
    var names = req.body.product_names;
    var vendor = req.body.vendor;
    //convert them to arrays

    var product_array = products.split(",")
    var prices_array = prices.split(",")
    var quantities_array = quantities.split(",")
    var names_array = names.split(",");
    var delivery_point = req.body.delivery_point;
    //save them individually
    let objects = []
    for (var i = 0; i < product_array.length; i++) {
        var obj = {
            product: product_array[i],
             price: prices_array[i],
            quantity: quantities_array[i],
            product_name: names_array[i],
            code: req.body.code,
            added_by: req.body.created_by,
            // date: req.body.date,
            vendor: vendor,
            site: delivery_point,
            notes: req.body.notes
        }
        objects.push(obj);

    }
    var i = 0;
    var async = require('async');
    async.each(objects, function (obj, next) {

        let ad = new Model(obj);
        ad.save()
            .then(result => {
                
                next();

            })
            .catch(err => {
                console.log(err);
            });



    }, function (err) {
        ActivitiesHelper.save(req.body.display_name +" added new purchase  "+ req.body.code+ " from "+ req.body.vendor_name);

        res.json({ status: '1', data: {} });


    });

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
        .populate("vendor")
        .populate("product")
        .exec()
        .then(docs => {

            res.status(200).json({ status: 1, data: docs });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

router.post('/delete', function (req, res) {

    //remove a permission frmo a role
    var id = req.body._id;

    Model.remove({ "_id": id })
        .then(result => {
            ActivitiesHelper.save(req.body.display_name +" deleted purchase  "+ req.body.code+ " from "+ req.body.vendor_name);

            res.json({ status: "1" });
            //console.log(result)
        })
        .catch(err => {
            res.json({ status: "-1" });

        });


});

router.get('/count', function (req, res) {
    var obj = {}
    if (req.query.status != undefined) {
        obj.status = req.query.status
    }
    Model.count(obj)
        .then(result => {
            res.json({ status: "1", data: result });
            //console.log(result)
        })
        .catch(err => {
            res.json({ status: "-1" });

        });


});


router.get('/getSites', function (req, res) {

    Model.find().distinct("site")
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
    var offset = req.query.offset == undefined ? 0 : parseInt(req.query.offset);
    var limit = req.query.limit == undefined ? 10 : parseInt(req.query.limit);
    Model.find().or(query)
        .populate("product")
        .populate("vendor")
        .skip(offset)
        .limit(limit)
        .exec()
        .then(docs => {
            Model.count().or(query).then(count => {
                res.status(200).json({ status: 1, data: docs, total: count, limit: limit });
            })
            
            //res.status(200).json({ status: 1, data: docs });
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({
                error: err
            })
        })
});

//find the between some dates
/**
 * fxn to sum a field
 * Income.aggregate([{
    $match : { $and : [ owner: userId, date: { $gte: start, $lt: end } ] },
},{
    $group : {
        _id : null,
        total : {
            $sum : "$amount"
        }
    }
}],callback);
 */
router.get('/findBetweenDates', function (req, res) {
    var start_date = req.query.start_date;
    var end_date = req.query.end_date
    var offset = req.query.offset == undefined ? 0 : parseInt(req.query.offset);
    var limit = req.query.limit == undefined ? 10 : parseInt(req.query.limit);
    var obj = {
        date: {
            $gte: new Date(start_date),
            $lte: new Date(end_date)

        }
    }
    if (req.query.status != undefined) {
        obj.status = req.query.status
    }
    Model.find(obj)
        .populate("product")
        .populate("vendor")
        .skip(offset)
        .limit(limit)
        .exec()
        .then(docs => {
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

// router.post('/delete', function (req, res) {

//     var id = req.body._id;
//     var name = req.body.name;

//     Model.remove({ "_id": id })
//         .then(result => {
//             res.json({ status: "1" });
//             //console.log(result)
//         })
//         .catch(err => {
//             res.json({ status: "-1" });

//         });


// });

//export the whole thingy
module.exports = router;