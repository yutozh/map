var moment = require("moment");
var http =require("http");
var querystring = require('querystring');
var lat = 30.528149;
var lng = 114.363266;
function padNumber(num, fill) {
    //改自：http://blog.csdn.net/aimingoo/article/details/4492592
    var len = ('' + num).length;
    return (Array(
        fill > len ? fill - len + 1 || 0 : 0
    ).join(0) + num);
}

address1 = ["信息学部16-201","信息学部2-304","文理学部梅园4-108"];
address2 = ["杨冥羽黄焖鸡","快点便当","KFC"];

function create() {

    for (var i = 0; i < 3; i++) {
        var contents = querystring.stringify({
            destLoc: [lng + 0.05 - Math.random() * 0.1, lat + 0.05 - Math.random() * 0.1],
            restLoc: [lng + 0.05 - Math.random() * 0.1, lat + 0.05 - Math.random() * 0.1],

            Pay: 3,
            destAddress: address1[i % 3],
            restName: address2[(i + 1) % 3]
        });

        var contents = {
            destLoc: [lng + 0.05 - Math.random() * 0.1, lat + 0.05 - Math.random() * 0.1],
            restLoc: [lng + 0.05 - Math.random() * 0.1, lat + 0.05 - Math.random() * 0.1],

            Pay: 3,
            destAddress: address1[i % 3],
            restName: address2[(i + 1) % 3]
        };

        var options = {
            host: '127.0.0.1',
            port: '8880',
            path: '/getOrder',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // 'Content-Length': contents.length
            }
        };

        console.log();
        var req = http.request(options, function (res) {
            // res.setEncoding('uft8');

            res.on('data', function (data) {
                console.log(data.toString());
            });
        });

        req.write(JSON.stringify(contents));
        req.end();  //不能漏掉，结束请求，否则服务器将不会收到信息。
    }
}

setInterval(create,1000);