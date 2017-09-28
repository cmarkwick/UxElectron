// Constructor
function PaymentTenderFactory() {

    var createPaymentTender = function (tenderId) {
        var result = null;
        var constants = paymentConstants;
        switch (tenderId) {
            case constants.TENDER_CASH:
                result = new TenderCash();
                break;
            case constants.TENDER_COUNTER:
                result = new TenderCounter();
                break;
            case constants.TENDER_COUPON:
                result = new TenderCoupon();
                break;
            case constants.TENDER_CREDIT:
                result = new TenderCredit();
                break;
            case constants.TENDER_DEBIT:
                result = new TenderDebit();
                break;
            case constants.TENDER_DISCOUNT:
                result = new TenderDiscount();
                break;
            case constants.TENDER_EMPLOYEE:
                result = new TenderEmployee();
                break;
            case constants.TENDER_LOYALTY:
                result = new TenderLoyalty();
                break;
            case constants.TENDER_ROOMCHARGE:
                result = new TenderRoomCharge();
                break;
            default:
                throw "PaymentFactory: Unknown tender type " + tenderId;
        }
        return result;


    };

}