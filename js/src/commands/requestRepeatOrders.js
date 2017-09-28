_nex.commands.RequestRepeatOrders = function (lookup) {
    var self = this;
    _nex.commands._BaseRequest.call(self);

    self.name = "REQUESTPREVIOUSORDERS";
    self._lookup = lookup;

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "lookuptype": self._lookup.lookupType,
            "lookupvalue": self._lookup.lookupValue,
        };

        if (self._lookup.lookupXML !== null) {
            msg[self.name].LOOKUPVALUES = self._lookup.lookupXML;
        }

        console.debug("RequestPreviousOrders2", "returning msg", msg);
        return msg;
    };
};
_nex.commands.RequestRepeatOrders.prototype = Object.create(_nex.commands._BaseRequest.prototype);