_nex.commands.AddWeight = function (posid, weight, uom) {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "ADDWEIGHT";
    self.posid = posid;
    self.weight = weight;
    self.weight = uom;

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "posid": posid,
            "weight": weight,
            "uom": uom
        };

        return msg;
    };
};
_nex.commands.AddWeight.prototype = Object.create(_nex.commands._BaseRequest.prototype);
