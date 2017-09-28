function TenderCash() {
    var self = this;
    self._tenderType = paymentConstants.TENDER_CASH;
    self._tenderTypeCode = "2";

    self._baseTender = new BaseTender();


}