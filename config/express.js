var express = require("express");
var body_parser = require("body-parser");
var path = require('path');
module.exports = function () {
    var app = express();
    app.set('views', path.join(__dirname, '../view'));
    app.set('view engine', 'ejs');
    app.use(express.static(path.join(__dirname, '../view')));
    app.use(body_parser.json());
    app.use(body_parser.urlencoded());


    require("../app/routes/routes.order.server")(app);

    app.use(function (req, res ,next) {
        res.status(404);
        try {
            return res.json("Not Found!!!");
        } catch (e){
            console.log("Returned 404");
        }
    });

    app.use(function (err, req, res, next) {
        if(!err){ return next()}
        res.status(500);
        try{
            console.log(err.message);
            return res.json(err.message || "Server Error!!!");
        } catch (e){
            console.log("Returned 500");
        }
    });

    return app;
};
