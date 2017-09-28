// Following along with AddToOrderCmd.
_nex.commands.AddTender = function (type, tenderSpecific) {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.type = type || "";
    self.tenderSpecific = tenderSpecific || {};

    self.name = "ADDTENDER";

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "type": self.type,
            "tenderSpecific": self.tenderSpecific
        };
        return msg;
    };
};
_nex.commands.AddTender.prototype = Object.create(_nex.commands._BaseRequest.prototype);