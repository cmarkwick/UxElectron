function TenderCounter() {
    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(this);

    var self = this;
    self._tenderType = paymentConstants.TENDER_COUNTER;
    self._tenderTypeCode = "0"; // counter is 0 in the Flash.

    self._write = function (tender) {
        tender.COUNTER = {};

        return tender;
    };
}
TenderCounter.prototype = Object.create(_BaseTender.prototype);
