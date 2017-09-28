// Update the order to reflect the amount that has been charged for loyalty.
_nex.commands.ProcessLoyalty = function (tender, amount) {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "PROCESSLOYALTY";
    self.tender = "";
    if (tender) {
        self.tender = tender;
    }
    self.amount = "";
    if (amount) {
        self.amount = amount;
    }
    // Write the message.
    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "amounttocharge": self.amount,
            "TENDER": self.tender.write()
        };
        return msg;
    };
};
_nex.commands.ProcessLoyalty.prototype = Object.create(_nex.commands._BaseRequest.prototype);