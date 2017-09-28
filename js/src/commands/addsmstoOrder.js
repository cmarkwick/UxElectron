// Following along with AddToOrderCmd.
_nex.commands.AddSMSToOrder = function (orderId, smsNumber) {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self._orderId = orderId || "";
    self._smsNumber = smsNumber || "";
    self.name = "ADDSMSTOORDER";

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "orderid": self._orderId,
            "smsnumber": self._smsNumber
        };
        return msg;
    };
};
_nex.commands.AddSMSToOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype);