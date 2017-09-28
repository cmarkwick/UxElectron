function TenderCoupon(paymentTypeId, accountNumber, pin) {
    var self = this;

    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(self);

    // Private properties.
    self._tenderType = paymentConstants.TENDER_COUPON;

    self._tenderTypeCode = "4";
    self._responseData = null;

    // Check if this is a valid account.
    self.isValidAccount = function () {
        if (self._responseData) {
            return self._responseData.success;
        }
        return false;
    };

    // Get the coupon amount by deduction type.
    self.deductionAmount = function (subTotal) {
        var amount = 0.0;

        if (self._responseData.deductiontype == 2) {
            amount = self._responseData.amount / 100 * subTotal;
        } else {
            amount = self._responseData.amount;
        }
        self._responseData.amount = amount;
        return amount;
    };

    // Call this method to update the coupon tender with what comes back from couponInquiry.
    self.update = function (response) {
        var data = {};
        data.success = response.status.toLowerCase() === "success" ? true : false;

        data.couponnumber = response.number ? response.number : "";
        data.amount = response.value ? response.value : "";
        data.deductiontype = response.type ? response.type : "";

        // Put the data on the tender object.
        self._responseData = data;
    };

    // The _write method is called by baseTenders write method.
    self._write = function (tender) {

        tender.COUPON = {};

        tender.COUPON.tendercode = self._responseData.couponnumber;
        tender.COUPON.amount = self._responseData.amount;
        tender.COUPON.deductiontype = self._responseData.deductiontype;
        tender.COUPON.paymenttypeid = self._tenderType;

        return tender;
    };
}
TenderCoupon.prototype = Object.create(_BaseTender.prototype);