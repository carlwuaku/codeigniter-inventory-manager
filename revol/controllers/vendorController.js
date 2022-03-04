const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


//schema
const Model = require('../models/vendorModel');
const Helper = require('../helpers/vendorHelper');
const Constants = require("../constants")
const ActivitiesHelper = require('../helpers/activitiesHelper');

router.get('/getList', function (req, res) {
    Model.find()
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
                ActivitiesHelper.save(req.body.display_name +" added a new vendor "+ req.body.name);

                res.json({ status: '1', data: result });
                //console.log(result)
            })
            .catch(err => {
                console.log(err);
                res.json({ status: '-1', message: err});

            });
    }
    else {
        

        Model.update({_id: req.body._id}, obj)
            .then(result => {
                ActivitiesHelper.save(req.body.display_name +" edited vendor "+ req.body.name);

                res.json({ status: '1', data: result });
            })
            .catch(err => {
                res.json({ status: '-1', message: err});
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
            res.json({status: "1", data: result});
            //console.log(result)
        })
        .catch(err => {
            res.json({status: "-1"});

        });


});







router.get('/findById', function (req, res) {
    Model.findById(req.query.id)
        .exec()
        .then(docs => {
            
            res.status(200).json({status: 1, data:docs});
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
    var name = req.body.name;

    Model.remove({"_id": id})
        .then(result => {
            ActivitiesHelper.save(req.body.display_name +" deleted vendor "+ req.body.name);

            res.json({status: "1"});
            //console.log(result)
        })
        .catch(err => {
            res.json({status: "-1"});

        });


});

router.get('/count', function (req, res) {
    
    Model.count()
        .then(result => {
            res.json({status: "1", data: result});
            //console.log(result)
        })
        .catch(err => {
            res.json({status: "-1"});

        });


});



router.get('/search', function (req, res) {
    var param = req.query.param;
    var query = Helper.search(param);
    Model.find().or(query)
        .exec()
        .then(docs => {
            
            res.status(200).json({status: 1, data:docs});
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});



//export the whole thingy
module.exports = router;