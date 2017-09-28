// called to make a generic tender inquiry lookup
_nex.commands.GenericInquiry = function (accountNumber, pin, paymentTypeId, guestAccountLocalTypeId) {
    // Constructor logic.
    var self = this;

    _nex.commands._BaseRequest.call(self);


    self._guestAccountLocalTypeId = "";
    self._accountNumber = "";
    self._pin = "";
    self._paymentTypeId = "";

    if (guestAccountLocalTypeId) {
        self._guestAccountLocalTypeId = guestAccountLocalTypeId;
    }
    if (accountNumber) {
        self._accountNumber = accountNumber;
    }
    if (pin) {
        self._pin = pin;
    }
    if (paymentTypeId) {
        self._paymentTypeId = paymentTypeId;
    }

    self.name = "GENERICINQUIRY";

    // Write method.
    self.write = function () {
        var msg = self.msgHeader();

        msg[self.name] = {
            "guestaccountlocaltypeid": self._guestAccountLocalTypeId,
            "accountnumber": self._accountNumber,
            "pin": self._pin,
            "paymenttypeid": self._paymentTypeId
        };
        return msg;
    };
};
_nex.commands.CreateOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype);