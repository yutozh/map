var moment = require("moment");
var http =require("http");
var querystring = require('querystring');
var mymongoose = require("../config/mymongoose");

var db = mymongoose();
var mongoose = require("mongoose");
var Order = mongoose.model("Order");
var config = require("../config/config");

var lat = 30.53690;
var lng = 114.337127;
function padNumber(num, fill) {
    //改自：http://blog.csdn.net/aimingoo/article/details/4492592
    var len = ('' + num).length;
    return (Array(
        fill > len ? fill - len + 1 || 0 : 0
    ).join(0) + num);
}
function saveToDB(content) {
    var url = "http://api.map.baidu.com/geocoder/v2/?output=json&location="
        + content.restLoc[1].toString() + "," + content.restLoc[0].toString() + "&ak=" + config.ak;

    http.get(url, function (res) {
        var html='';
        res.on('data',function(data){
            html+=data;
        });
        res.on('end',function(){

            var result = JSON.parse(html).result.sematic_description;
            console.log(result);
            content.restAddress = result;
            url = "http://api.map.baidu.com/geocoder/v2/?output=json&location="
                + content.destLoc[1].toString() + "," + content.destLoc[0].toString() + "&ak=" + config.ak;
            http.get(url, function (res) {
                var html='';
                res.on('data',function(data){
                    html+=data;
                });
                res.on('end',function(){
                    var result = JSON.parse(html).result.sematic_description;
                    content.destAddress = result;

                    var order = new Order(content);
                    order.save(function (err,next) {
                        if(err) return next(err);
                    })
                });
            });
        });
    });


}

address1 = ["信息学部16-201","信息学部2-304","文理学部梅园4-108"];
address2 = ["杨冥羽黄焖鸡","慢点便当","KFG","周白鸭"];
user = ["张三","李四","王五","赵六","孙九"];
tele = ["123478521542","13948542155","13025258556"];
i = 1;
function start() {
    var contents = {
        title:"订单信息",
        latitude:lat + 0.03-Math.random()*0.06,
        longitude:lng + 0.03-Math.random()*0.06,
        coord_type:3,
        geotable_id:163864,
        ak:config.ak,
        orderID:moment().format("YYYYMMDDHHmmss") + padNumber(parseInt(Math.random() * 100), 3),
        Pay:i % 5 + (i % 2) / 2.0 + 1,
        destName: address1[i % 3],
        restName: address2[(i+1)% 4],
        expectTime: moment().add(parseInt(40), 'm').format("HH:mm")
    };

    var contentsForDb = {
        restName: contents.restName,
        restAddress:"",
        restID:"D001",
        restLoc:[contents.longitude,contents.latitude],
        restBoss:"老板",
        restTele:"021-68778855",

        destName:contents.destName,
        destAddress:"",
        destID:"U001",
        destLoc:[lng + 0.03-Math.random()*0.06,lat + 0.03-Math.random()*0.06],
        destUser:user[i % 5],
        destTele:tele[i % 3],

        Distence: 0.0,

        Weight : 500,
        Pay: contents.Pay,
        sendingBy:"",

        orderID:contents.orderID
    };
    saveToDB(contentsForDb);


    contents = querystring.stringify(contents);

    var options = {
        host: 'api.map.baidu.com',
        path: '/geodata/v3/poi/create',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length':contents.length
        }
    };

    console.log(contents);
    var req = http.request(options, function(res){
        // res.setEncoding('uft8');

        res.on('data', function(data){
            console.log(data.toString());
        });
    });

    req.write(contents);
    req.end();  //不能漏掉，结束请求，否则服务器将不会收到信息。
    i++;
    if(i > 20){
        clearInterval(end);
    }
}

var end = setInterval(start,1637);
