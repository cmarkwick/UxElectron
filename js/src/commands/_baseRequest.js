/** 
 * Parent object to all the commands. Implements msgHeader.
 * @constructor 
 */
_nex.commands._BaseRequest = function () {
    // NOTE:  This code matches what is in nextep.common.js.
    // It is left here for now because commands like ADDTENDER rely on it being in a certain build order.
   
    var self = this;
    self.name = "";
    self.msgHeader = function () {
        var header = {};

        if (_nex.context !== 'UX') {
            header.authcode = _iorderfast.authToken.code;
        }

        header.name = this.name;

        if (_nex.context !== 'UX') {
            header.locationid = _iorderfast.loc.id;
        }

        header[this.name] = {};

        return header;
    };

    self.write = function () { };
};