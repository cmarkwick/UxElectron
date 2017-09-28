function TenderDebit() {
    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(this);

    var self = this;
    self._tenderType = paymentConstants.TENDER_DEBIT;
    self._tenderTypeCode = "3";


}
TenderDebit.prototype = Object.create(_BaseTender.prototype);
