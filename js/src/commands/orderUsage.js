_nex.commands.OrderUsage = function () {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "ORDERUSAGE";

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "BUTTONUSAGE": _nex.utility.buttonTracking.writeButtonUsage()
        };
        return msg;
    };
};
_nex.commands.OrderUsage.prototype = Object.create(_nex.commands._BaseRequest.prototype);