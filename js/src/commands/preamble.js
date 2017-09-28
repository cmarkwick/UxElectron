_nex.commands.Preamble = function () {

    _nex.commands._BaseRequest.call(this); // calls the constructor of the parent class

    var self = this;
    self.name = "PREAMBLE";
    self.pcstatus = "Offline";

    self.setStatus = function (status) {
        self.pcstatus = status;
    };

    self.write = function () {
        var msg = self.msgHeader();

        msg[self.name] = {
            "pcstatus": self.pcstatus
        };
        return msg;
    };
};
_nex.commands.Preamble.prototype = Object.create(_nex.commands._BaseRequest.prototype);