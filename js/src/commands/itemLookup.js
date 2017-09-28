_nex.commands.ItemLookup = function (lookupField, lookupValue) {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "ITEMLOOKUP";
    self.lookupField = lookupField;
    self.lookupValue = lookupValue;

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "lookupfield": lookupField,
            "lookupvalue" : lookupValue
        };

        return msg;
    };
};
_nex.commands.ItemLookup.prototype = Object.create(_nex.commands._BaseRequest.prototype);
