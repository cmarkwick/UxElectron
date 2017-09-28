_nex.commands.UpdateTender = function (paid) {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.paid = paid;
    if (!self.paid) {
        self.paid = false;
    }

    self.name = "UPDATEORDERTENDER";

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "paid": self.paid
        };
        return msg;
    };
};
_nex.commands.UpdateTender.prototype = Object.create(_nex.commands._BaseRequest.prototype);