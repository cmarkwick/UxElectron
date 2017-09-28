_nex.commands.DeviceLookup = function (lookupType) {
    _nex.commands._BaseRequest.call(this);
    var self = this;
    self._lookupType = "";
    self.name = "DEVICELOOKUP";

    if (lookupType) {
        self._lookupType = lookupType;
    }

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "lookuptype": self._lookupType
        };

        return msg;
    };
};
_nex.commands.DeviceLookup.prototype = Object.create(_nex.commands._BaseRequest.prototype);
