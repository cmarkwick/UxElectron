// removes the last tender on the tender stack
_nex.commands.RemoveTender = function () {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "REMOVETENDER";

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {};
        return msg;
    };
};
_nex.commands.RemoveTender.prototype = Object.create(_nex.commands._BaseRequest.prototype);