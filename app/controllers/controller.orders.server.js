var mongoose = require("mongoose");
var config = require("../../config/config");
var Order = mongoose.model("Order");
var OrdersCache = mongoose.model("OrdersCache");
var http =require("http");
var querystring = require('querystring');
var rp = require('request-promise');

module.exports = {
    autoChoose: function (req, res, next) {
        var longitude = parseFloat(req.query.longitude, 10) || null;
        var latitude = parseFloat(req.query.latitude, 10) || null;
        // var range = parseFloat(req.query.range, 10) || 999999;
        var range =  999999;
        var maxNumOfOrders = parseInt(req.query.maxNumOfOrders) || config.defaultAutoOrderLimit;

        if (!longitude || !latitude) {
            return next(new Error("No location!"));
        }
        Order.find({
            'restLoc': {
                $nearSphere: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: range
                }
            },
            'status':2
        }, ["restName", "restAddress","destAddress", "Pay", "expectDuration","orderID"])
            .limit(maxNumOfOrders)
            .exec(function (err, docs) {
                if (err) {
                    return next(err)
                }
                docs.forEach(function () {
                    // this.status = 1;
                    Order.update({_id:this._id},{$set:{status:1}},function(err){});
                });
                return res.json(docs);
            })
    },

    // Manual choose and auto choose should post selected orders to this function
    // Input: Array of orders; id
    // Output: Status and calculated routes
    postChoose: function (req, res, next) {
        var postOrders = req.body.ordersID;
        var longitude = parseFloat(req.body.longitude, 10) || null;
        var latitude = parseFloat(req.body.latitude, 10) || null;
        Order.find({
            'orderID':{$in:postOrders},
            'status':2
        }).exec(function (err,docs) {
            if(err){
                return next(err)
            }
            // When some of the posted orders are chosen by others before the user post.
            if(docs.length != postOrders.length){
                console.log("-1");
                return res.json({'status':'-1','str':'Orders have been chosen!'});
            }
            docs.forEach(function () {
                Order.update({_id:this._id},{$set:{'status':1}},function(err){
                    if(err)return next(err)
                });
            });

            // Calculate routes

            // 目标点 type:商家1, 用户2
            function POI(lat,lng,type,orderID) {
                this.lat = lat;
                this.lng = lng;
                this.type = type;
                this.orderID = orderID;
            }
            // 百度返回的路径集合中(result),找出最短的,返回index
            function whichMin(result) {
                var minIndex = 0;
                var minValue = 99999;
                result.forEach(function (e, index) {
                    if(e.distance.value < minValue){
                        minValue = e.distance.value;
                        minIndex = index;
                    }
                });
                return minIndex;
            }
            // 根据orderID找到用户点,并生成对应poi
            function getDestPoi(orderID){
                for(x in docs) {
                    if (docs[x].orderID == orderID) {

                        var poi = new POI(docs[x].destLoc[1], docs[x].destLoc[0], 1, orderID);
                        return poi;
                    }
                }
            }
            // 构造以orderID为键的docs字典
            var docDict = {};
            docs.forEach(function (d) {
                docDict[d.orderID] = d;
            });

            // 目标点集合,还未经过的目标点
            var poiList = [];

            // 目标点集合,按最优顺序排序,当前起点为第一个元素
            var routeList = [];
            var nowPoi = new POI(latitude, longitude, 0, 0);
            routeList.push(nowPoi);

            // 将所有选中订单对应的商家点放入集合
            docs.forEach(function (e) {
                var newpoi = new POI(e.restLoc[1], e.restLoc[0], 2, e.orderID);
                poiList.push(newpoi);
            });


            // 循环求解最优路径
            loop(poiList);

            function loop(poiList) {
                // 生成目的地址字符串
                destinations = [];
                poiList.forEach(function (p) {
                    destinations.push(p.lat.toString() + "," + p.lng.toString());
                });
                destinationsStr = destinations.join("|");

                var contents = querystring.stringify({
                    origins: nowPoi.lat.toString() + "," + nowPoi.lng.toString(),
                    destinations: destinationsStr,
                    ak: config.ak
                });

                var url = "http://" + config.routeMatrixHost + config.routeMatrixPath + "?" + contents;

                rp(url)
                    .then(function(baiduRes){
                        // 目标全部到达
                        if(poiList.length == 0){
                            console.log(routeList);
                            var routes = [];
                            for(var i=0; i<routeList.length-1; i++ ){
                                var routeUnit = {};
                                routeUnit.startP = [routeList[i].lng, routeList[i].lat];
                                routeUnit.endP = [routeList[i+1].lng, routeList[i+1].lat];
                                if(routeList[i+1].type == 1){
                                    routeUnit.endAdd = docDict[routeList[i+1].orderID].destAddress;
                                    routeUnit.telephone = docDict[routeList[i+1].orderID].destTele;
                                    routeUnit.name = docDict[routeList[i+1].orderID].destUser;
                                    routeUnit.type = "配送";
                                }else {
                                    routeUnit.endAdd = docDict[routeList[i+1].orderID].restAddress;
                                    routeUnit.telephone = docDict[routeList[i+1].orderID].restTele;
                                    routeUnit.name = docDict[routeList[i+1].orderID].restBoss;
                                    routeUnit.type = "取餐";
                                }
                                routes.push(routeUnit);
                            }
                            // var routes = [{
                            //     startP:[114.371343,30.535455],
                            //     endP:[114.369506,30.529957],
                            //     endAdd:"武汉大学南门12号dsaaaaaaaaaaaaaaaaaaaaaaa",
                            //     type:"配送",
                            //     telephone:186523516,
                            //     name:"tao"
                            // }]

                            // console.log(routes);
                            // 返回计算结果
                            return res.json({'status':'0','str':'Succeed!','orders':docs,'routes':routes});
                        }
                        else {
                            var result =  JSON.parse(baiduRes).result;
                            // console.log(result);
                            var minIndex = whichMin(result);
                            // console.log(poiList);
                            // 找出最近的点作为下一个目标,从poiList中弹出,放入routelist中
                            var deleted = poiList.splice(minIndex,1);
                            // console.log(minIndex);
                            routeList.push(deleted[0]);
                            // 将当前点设为弹出的点
                            nowPoi = deleted[0];
                            // 若是商家点,则将用户点放入
                            if(deleted[0].type == 2){
                                poiList.push(getDestPoi(deleted[0].orderID));
                            }
                            // console.log(poiList.length);
                            loop(poiList);
                        }
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            }
        })
    }
};