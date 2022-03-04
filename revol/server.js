const express = require('express');
//const userController = require('./controllers/userController')
const PORT = process.env.PORT || 5000;
 const app = express();
const bodyParser = require('body-parser');
 const mongoose = require('mongoose');
 const fileUpload = require('express-fileupload');
 //connect to db
mongoose.connect('mongodb://admin:admin@ds115350.mlab.com:15350/revol'
).then(con => {
    console.log("connected to db")
}).catch(err => {
    console.log("Unable to connect to db")
});

 //user bodyparser
 app.use(bodyParser.urlencoded({extended: false}));
 //be able to extract json data and do stuff like req.body.name
app.use(bodyParser.json());

//file uploader
app.use(fileUpload());
//CORS STUFF
app.use((req, res, next) => {
    //allow all clients
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Token, Usertype, Userid, Type');

    if(req.method === 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
        //return empty object.
        return res.status(200).json({})
    }
    //if not options, call next to allow the request to get to the routes
    next();

});
//serving public images and assets
app.use(express.static('public'));

const adminController = require('./controllers/adminController');
const permissionsController = require('./controllers/permissionsController')
const rolesController = require('./controllers/rolesController')
const staffController = require('./controllers/staffController')
const customerController = require('./controllers/customerController')
const productController = require('./controllers/productController')
const vendorController = require('./controllers/vendorController')
const orderController = require('./controllers/orderController')
const purchaseController = require('./controllers/purchaseController')
const stockAdjustmentController = require('./controllers/stockAdjustmentController')
const saleController = require('./controllers/saleController')

//any request starting with admin shd be forwarded to admin route
 app.use('/admin', adminController);
 app.use('/permissions', permissionsController);
 app.use('/roles', rolesController);
 app.use('/staff', staffController);
 app.use('/customers', customerController);
 app.use('/products', productController);
 app.use('/vendors', vendorController);
 app.use('/orders', orderController);
 app.use('/purchases', purchaseController);
 app.use('/stock', stockAdjustmentController);
 app.use('/sales', saleController);

 //due to some issues, we had to switch to php codeigniter for the backend.
 //that one had the endpoints like api_admin or api_vendors. to make the switching 
 //back to node less painless, we'll define more endpoints which will go to the same controllers

 app.use('/api_admin', staffController);
 app.use('/api_permissions', permissionsController);
 app.use('/api_roles', rolesController);
 app.use('/api_staff', staffController);
 app.use('/api_customer', customerController);
 app.use('/api_product', productController);
 app.use('/api_vendor', vendorController);
 app.use('/api_order', orderController);
 app.use('/api_purchase', purchaseController);
 app.use('/api_stock', stockAdjustmentController);
 app.use('/api_sales', saleController);

 app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
 //console.log("listening on port 3000");