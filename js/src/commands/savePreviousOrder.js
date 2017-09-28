_nex.commands.SavePreviousOrder = function (orderId, phoneNumber, lookup) {
    var self = this;
    _nex.commands._BaseRequest.call(self);

    self.name = "SAVEPREVIOUSORDER";
    self._orderId = orderId || "";
    self._smsNumber = phoneNumber || "";
    self._lookup = lookup;

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "orderid": self._orderId,
            "smsnumber" : self._smsNumber,
            "LOOKUP" :{
                "type" : self._lookup.lookupType,
                "value" : self._lookup.lookupValue
            }
        };

        if (self._lookup.lookupXML !== null) {
            msg[self.name].LOOKUP.LOOKUPVALUES = self._lookup.lookupXML;
        }

        return msg;
    };
};
_nex.commands.SavePreviousOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype);