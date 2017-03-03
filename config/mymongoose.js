var mongoose = require("mongoose");
var config = require("./config");

module.exports = function () {
    var db = mongoose.connect(config.mongoConn);

    require("../app/models/model.order.server");
    require("../app/models/model.ordersCache.server");
    return db;
};