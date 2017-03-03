var mongoose = require("mongoose");

var OrdersCacheSchema = mongoose.Schema({
    createAt: {type:Date, default: Date.now()},
    senderID: String,
    orderID: String
});

var OrdersCache = mongoose.model("OrdersCache", OrdersCacheSchema);