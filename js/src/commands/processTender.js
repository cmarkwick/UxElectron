// Update the order to reflect the amount that has been charged to this tender
_nex.commands.ProcessTender = function (tender, amount) {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "PROCESSTENDER";
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
_nex.commands.ProcessTender.prototype = Object.create(_nex.commands._BaseRequest.prototype);