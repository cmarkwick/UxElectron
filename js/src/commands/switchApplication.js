_nex.commands.SwitchApplication = function (launch) {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "SWITCHAPPLICATION";
    self.launch = launch;

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "launch":  launch
    };

        return msg;
    };
};
_nex.commands.SwitchApplication.prototype = Object.create(_nex.commands._BaseRequest.prototype);
