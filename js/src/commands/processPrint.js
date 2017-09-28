_nex.commands.ProcessPrint = function (order) {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "PROCESSPRINT";
    self.customerEmail = order.customer.email;
    self.receiptFormat = order.receiptFormat;

    self.nutritionData = {};
    if ( _nex.nutritionData) {
        self.nutritionData = _nex.nutritionData;
    }

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "receiptemail": self.customerEmail,
            "receiptformat": self.receiptFormat,
            "CUSTOMER": {
                "email": self.customerEmail
            },
            "NUTRITIONINFO": self.nutritionData
        };

        return msg;
    };
};
_nex.commands.ProcessPrint.prototype = Object.create(_nex.commands._BaseRequest.prototype);