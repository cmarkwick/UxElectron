/** 
 * Calculates all the totals for UX overrides commonJS version (taxes, fees, sub-totals, grand-totals).
 * @constructor 
 */

_nex.commands.CalculateTotal = function (order) {
    _nex.commands._BaseRequest.call(this);

    var self = this;

    self.name = "CALCULATETOTAL";
    self.subtotal = order.totals.subtotal().replace("$", "");
    self.togo = order.togo.toString();
    self.roundUpCharitySelected = order.roundUpCharitySelected.toString();

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "togo": self.togo,
            "subtotal": self.subtotal,
            "roundupcharityselected": self.roundUpCharitySelected,
            "sendtoserver" : "true"
        };

        return msg;
    };
};
_nex.commands.CalculateTotal.prototype = Object.create(_nex.commands._BaseRequest.prototype);