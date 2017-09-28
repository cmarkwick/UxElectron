
// TenderGeneric relies on the generic inquiry to update its data.
function TenderGeneric(paymentTypeId, accountNumber, pin) {
    var self = this;

    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(self);
    
    // Private properties.
    var gi = Number(paymentTypeId) - 50;
    self._tenderType = "generictender" + gi.toString();
    
    self._tenderTypeCode = paymentTypeId;
    self._responseData = null;
    self._accountNumber = accountNumber;
    self._pin = pin;

    // Check if this is a valid account.
    self.isValidAccount = function () {
        if (self._responseData)
        {
            return self._responseData.success;
        }
        return false;
    };

    // Get the remaining balance on the card.
    self.remainingBalance = function () {
        return self._responseData.maxcharge;
    };

    // Has non-zero balance.
    self.hasBalance = function () {
        var result = false;
        if (self._responseData.maxcharge > 0.0) {
            result = true;
        }
        return result;
    };

  
    // Call this method to update the generic tender with what comes back from genericInquiry.
    self.update = function (response) {
        var data = {};
        data.success = response.success === "true" ? true : false;
        
        data.guestaccountid = response.guestaccountid ? response.guestaccountid : "";
        data.name = response.name ? response.name : "";
        data.email = response.email ? response.email : "";
        data.guestaccountlocalid = response.guestaccountlocalid ? response.guestaccountlocalid : "";
        data.usage = response.usage ? response.usage : "";
        data.usagebalance = response.usagebalance ? response.usagebalance : "";
        data.usagelimit = response.usagelimit ? response.usagelimit : "";
        data.maxcharge = response.maxcharge ? Number(response.maxcharge) : 0;
        data.totalmax = response.totalmax ? Number(response.totalmax) : 0;
        data.offline = response.offline ? response.offline.toString() : "";

        // Put the data on the tender object.
        self._responseData = data;
    };

    // The _write method is called by baseTenders write method.
    self._write = function (tender) {

        tender.GENERIC = {};

        tender.GENERIC.accountnumber = self._accountNumber;
        tender.GENERIC.guestaccountid = self._responseData.guestaccountid;
        tender.GENERIC.guestaccountlocalid = self._responseData.guestaccountlocalid;
        tender.GENERIC.name = self._responseData.name;
        tender.GENERIC.paymenttypeid = self._tenderType;
        tender.GENERIC.pin = self._pin;
        tender.GENERIC.usage = self._responseData.usage ? self._responseData.usage : "";
        tender.GENERIC.GENERICINQUIRYRESPONSE = self._responseData;

        return tender;
    };
}
TenderGeneric.prototype = Object.create(_BaseTender.prototype);
