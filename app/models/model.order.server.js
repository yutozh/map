var mongoose = require("mongoose");
var moment = require("moment");
var lltodd = require('../../algorithm/lltodd');

var OrderSchema = mongoose.Schema({
    restName: String,
    restAddress:String,
    restID:String,
    restLoc:{type:[Number], index:'2dsphere'},
    restBoss:String,
    restTele:String,

    destName:String,
    destAddress:String,
    destID:String,
    destLoc:{type:[Number], index:'2dsphere'},
    destUser:String,
    destTele:String,

    Distence: Number,
    createTime: {type: Date, default: Date.now()},
    expectDuration: {type: Number, default: 40},
    Weight : Number,
    Pay: Number,
    status: {type:Number, default:2},  // 2 unfinished, 1 sending, 0 finished, -1 locked, -2 canceled
    sendingBy: String,

    orderID:{type:String,unique:true}
});


// virtual property
OrderSchema.virtual("expectTime").get(function () {
    return moment(this.createTime).add(parseInt(this.expectDuration), 'm').format("HH:mm")
});
var Order = mongoose.model("Order", OrderSchema);
