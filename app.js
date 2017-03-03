var express = require("./config/express");
var mongoose = require("./config/mymongoose");

var db = mongoose();
var app = express();

module.exports = app;
