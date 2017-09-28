_nex.commands.EnableScale = function (enabled) {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "ENABLESCALE";
    self.enabled = enabled;

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "enabled": enabled
        };

        return msg;
    };
};
_nex.commands.EnableScale.prototype = Object.create(_nex.commands._BaseRequest.prototype);
