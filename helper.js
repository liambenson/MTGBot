function asyncOrder (functions, callback) {
    var returns = [];
    var counter = 0;
    for (var i = 0; i < functions.length; i++) {
        returns.push(false);
        functions[i].call(this, function (i, returnValue) {
            returns[i] = returnValue;
            if (++counter == functions.length) callback(returns);
        }, i);
    }
}

module.exports = {
    asyncOrder: asyncOrder,
}