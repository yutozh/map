var mongoose = require("mongoose");
var lltodd = require('../../algorithm/lltodd');
var moment = require("moment");
var Order = mongoose.model("Order");


module.exports = {
    listOrder: function (req, res, next) {
        var pagesize = parseInt(req.query.pagesize, 10) || 10;
        var pagestart = parseInt(req.query.pagestart, 10) || 1;
        var isAll = req.query.isAll || false;
        var longitude = parseFloat(req.query.longitude, 10) || null;
        var latitude = parseFloat(req.query.latitude, 10) || null;
        var range = parseFloat(req.query.range, 10) || 999999;

        if(!longitude || !latitude){
            return next(new Error("No location!"));
        }
        var status = [];
        if(isAll){
            status=[-1,0,1,2];
        }else {
            status=[2,-1];
        }
        Order.find({
            'restLoc': {
                $nearSphere: {
                    $geometry: {
                        type : "Point",
                        coordinates : [ longitude, latitude ]
                    },
                    $maxDistance: range
                }
            },
            'status':{
                $in:status
            }
        }
        ,["restName","destName","Pay","expectTime"])
            .skip(pagesize*(pagestart-1))
            .limit(pagesize)
            .exec(function (err, docs) {
                if(err){return next(err)}

                return res.json(docs);
            })

    },
    createOrder: function (req, res, next) {
        var order = new Order(req.body);
        order.orderID = moment().format("YYYYMMDDHHmmss") + parseInt(Math.random() * 100).toString();
        order.save(function (err) {
            if(err) return next(err);
            return res.json(order);
        })
    },

    getOrderByID: function (req, res, next, id) {
        if (!id) return next(new Error("Order NOT Found"));

        Order.findOne({"_id":id}, function (err, doc) {
            if (err) {
                return next(err);
            }

            if (!doc){
                return next(new Error("Not Found"));
            }
            req.orderContent = doc.toObject({virtuals: true});
            return next();
        });
    },
    
    getOrder: function (req, res, next) {
        return res.json(req.orderContent);
    }
};