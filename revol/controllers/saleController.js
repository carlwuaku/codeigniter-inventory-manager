const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


//schema
const Model = require('../models/saleModel');
const Helper = require('../helpers/saleHelper');
const Constants = require("../constants");
const ActivitiesHelper = require('../helpers/activitiesHelper');

router.get('/getList', function (req, res) {
    var offset = req.query.offset == undefined ? 0 : parseInt(req.query.offset);
    var limit = req.query.limit == undefined ? 10 : parseInt(req.query.limit);
    var obj = Helper.prep_data(req.query)
    Model.find(obj)
        .populate("product")
        .populate("added_by")
        .skip(offset)
        .limit(limit)
        .sort("-date")
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
                ActivitiesHelper.save(req.body.display_name +" added new sale  "+ req.body.code);

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
                ActivitiesHelper.save(req.body.display_name +" edited  sale  "+ req.body.code);

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
    //convert them to arrays

    var product_array = products.split(",")
    var prices_array = prices.split(",")
    var quantities_array = quantities.split(",")
    var names_array = names.split(",")
    //save them individually
    let objects = []
    for (var i = 0; i < product_array.length; i++) {
        var obj = {
            product: product_array[i], price: prices_array[i],
            quantity: quantities_array[i],
            product_name: names_array[i],
            code: req.body.code,
            added_by: req.body.added_by,
            date: req.body.date
        }
        objects.push(obj);

    }
    var i = 0;
    var async = require('async');
    ActivitiesHelper.save(req.body.display_name +" added new sale  "+ req.body.code);

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
        .populate("added_by")
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
            ActivitiesHelper.save(req.body.display_name +" deleted  sale  "+ req.body.code);

            res.json({ status: "1" });
            //console.log(result)
        })
        .catch(err => {
            res.json({ status: "-1" });

        });


});

router.get('/count', function (req, res) {

    var obj = Helper.prep_data(req.query)
    Model.count(obj)
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
        .populate("customer")
        .skip(offset)
        .limit(limit)
        .exec()
        .then(docs => {
            Model.count().or(query).then(count => {
                res.status(200).json({ status: 1, data: docs, total: count, limit: limit });
            })

            // res.status(200).json({ status: 1, data: docs });
        })
        .catch(err => {
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

    Model.find(obj)
        .populate("product")
        .populate("added_by")
        .skip(offset)
        .limit(limit)
        .sort("-date")
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

router.get('/sales_summary', function (req, res) {
    var start_date = req.query.start_date;
    var end_date = req.query.end_date
    
    var obj = {
        date: {
            $gte: new Date(start_date),
            $lte: new Date(end_date)

        }
    }

    //$date refers to the date field in the db

    Model.aggregate([
        {
            $match:{obj}
        },
        {$group: {
            _id : { month: { $month: "$date" }, day: { $dayOfMonth: "$date" }, year: { $year: "$date" } },
           totalPrice: { $sum: { $multiply: [ "$price", "$quantity" ] } },
           averageQuantity: { $avg: "$quantity" },
           count: { $sum: 1 }
        }}
    ]).sort("-_id")
        .exec()
        .then(docs => {
            res.status(200).json({ status: 1, data: docs});
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});


//export the whole thingy
module.exports = router;