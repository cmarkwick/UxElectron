_nex.commands.MenuStackReset = function () {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = 'MENUSTACKRESET';

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
        };
        return msg;
    };
};
_nex.commands.MenuStackReset.prototype = Object.create(_nex.commands._BaseRequest.prototype);