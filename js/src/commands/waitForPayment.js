_nex.commands.WaitForPayment = function () {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = 'WAITFORPAYMENT';

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            //"POSIDS": self.posids
        };
        return msg;
    };
};
_nex.commands.WaitForPayment.prototype = Object.create(_nex.commands._BaseRequest.prototype);