var OrderControl = require("../controllers/controller.order.server");
var OrdersControl = require("../controllers/controller.orders.server");

module.exports = function (app) {
    // Search the whole order and create orders
    app.route("/")
        .get(function (req,res) {
            res.render('index');
        });
    app.route("/getOrder")
        .get(OrderControl.listOrder)
        .post(OrderControl.createOrder);

    // Get one of the orders by _id
    app.route("/getOrder/:oid")
        .get(OrderControl.getOrder);

    // Auto choose orders by server
    app.route("/autoOrders")
        .get(OrdersControl.autoChoose);

    // Post the selected orders to the server
    app.route("/postOrders")
        .post(OrdersControl.postChoose);

    app.param("oid",OrderControl.getOrderByID);

};