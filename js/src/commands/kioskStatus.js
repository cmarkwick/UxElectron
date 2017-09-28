_nex.commands.KioskStatus = function (status) {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "KIOSKSTATUS";
    self.status = status;
    if (!self.status) {
        console.log("ERROR! Did not specify a valid status for KioskStatus command.");
    }

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {

            "pcstatus": self.status // TODO  (ThemeManager.KioskXml.@pcprefstatus == "PrinterError") ? ThemeManager.KioskXml.@pcprefstatus : MovieManager.CurrentStatus;
        };

        return msg;
    };
};
_nex.commands.KioskStatus.prototype = Object.create(_nex.commands._BaseRequest.prototype);