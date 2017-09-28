// Constructor. 
function PaymentClipFactory() {

    // Make self synonymous with this.
    var self = this;

    // These payment clips are listed in the Flash.
    self.createPaymentClip = function (clipId, callback) {
        // Copy reference to the constants for a short-hand.
        var constants = paymentConstants;

        // Default the result to null.
        var result = null;

        // Depending on the clip id, create the corresponding object.
        switch (clipId) {
            case constants.CASH_CLIP: // 2
                //result = new CashPaymentClip(clipId, paymentTarget, paymentText);
                break;
            case constants.COUNTER_CLIP: // 1
                //result = new CounterPaymentClip(clipId, paymentTarget, paymentText);
                result = new CounterPaymentClip(callback);
                break;
            case constants.COUPON_CLIP: // 6
                result = new CouponPaymentClip(callback);
                break;
            case constants.CREDIT_CLIP: // 3 (or debit)
                //result = new CreditPaymentClip(clipId, paymentTarget, paymentText);
                result = new CreditPaymentClip(callback);
                break;
            case constants.LOYALTY_CLIP: // 4 (or gift card)
                // result = new LoyaltyPaymentClip(clipId, paymentTarget, paymentText);
                result = new LoyaltyPaymentClip(callback);
                break;
            case constants.PREPTIME_CLIP:
                //result = new PrepTime(clipId, paymentTarget, paymentText);
                break;
            case constants.PREPTIME_CLIP:
                //result = new Pager(clipId, paymentTarget, paymentText);
                break;
            case constants.PROCESSING_CLIP:  
                //result = new Processing(clipId, paymentTarget, paymentText);
                break;
            case constants.SELECTPAYMENT_CLIP: // The clip for showing payment information.
                //result = new SelectPaymentClip(clip, paymentTarget, paymentText);
                //result = new SelectPaymentClip(clipId);
                result = new SelectPaymentClip();
                break;
            case constants.LOYALTYSELECTBUCKET_CLIP: // similar to 4?
                //result = new LoyaltySelectBucketClip(clipId, paymentTarget, paymentText);
                break;
            case constants.ROOMCHARGE_CLIP: // 5
                //result = new RoomChargePaymentClip(clipId, paymentTarget, paymentText);
                break;
            case constants.SUBMITORDER_CLIP: // ?
                //result = new SubmitOrder(clipId, paymentTarget, paymentText);
                break;
            case constants.TAKECASH_CLIP: // ?
                //result = new TakeCashClip(clipId, paymentTarget, paymentText);
                break;
            case constants.EMPLOYEE_CLIP: // ?
                //result = new EmployeePaymentClip(clipId, paymentTarget, paymentText);
                result = new EmployeePaymentClip(callback);
                break;
            case constants.LOYALTYPROMPT_CLIP: // ?
                //result = new LoyaltyPromptClip(clipId, paymentTarget, paymentText);
                break;
            case constants.GENERICTENDER1_CLIP:
                result = new GenericPaymentClip(1);
                break;
            case constants.GENERICTENDER2_CLIP:
                result = new GenericPaymentClip(2);
                break;
            case constants.GENERICTENDER3_CLIP:
                result = new GenericPaymentClip(3);
                break;
            case constants.GENERICTENDER4_CLIP:
                result = new GenericPaymentClip(4);
                break;
            case constants.GENERICTENDER5_CLIP:
                result = new GenericPaymentClip(5);
                break;
            case constants.GENERICTENDER6_CLIP:
                result = new GenericPaymentClip(6);
                break;
            case constants.GENERICTENDER7_CLIP:
                result = new GenericPaymentClip(7);
                break;
            case constants.GENERICTENDER8_CLIP:
                result = new GenericPaymentClip(8);
                break;
            case constants.GENERICTENDER9_CLIP:
                result = new GenericPaymentClip(9);
                break;
            case constants.GENERICTENDER10_CLIP:
                result = new GenericPaymentClip(10);
                break;
			case constants.GAINCLININGBALANCETENDER1_CLIP:
				result = new GAIncliningBalancePaymentClip(1);
				break;
			case constants.GAINCLININGBALANCETENDER2_CLIP:
				result = new GAIncliningBalancePaymentClip(2);
				break;
			case constants.GAINCLININGBALANCETENDER3_CLIP:
				result = new GAIncliningBalancePaymentClip(3);
				break;
			case constants.GAINCLININGBALANCETENDER4_CLIP:
				result = new GAIncliningBalancePaymentClip(4);
				break;
			case constants.GAINCLININGBALANCETENDER5_CLIP:
				result = new GAIncliningBalancePaymentClip(5);
				break;
			case constants.GAINCLININGBALANCETENDER6_CLIP:
				result = new GAIncliningBalancePaymentClip(6);
				break;
			case constants.GAINCLININGBALANCETENDER7_CLIP:
				result = new GAIncliningBalancePaymentClip(7);
				break;
			case constants.GAINCLININGBALANCETENDER8_CLIP:
				result = new GAIncliningBalancePaymentClip(8);
				break;
			case constants.GAINCLININGBALANCETENDER9_CLIP:
				result = new GAIncliningBalancePaymentClip(9);
				break;
			case constants.GAINCLININGBALANCETENDER10_CLIP:
				result = new GAIncliningBalancePaymentClip(10);
				break;
            default:
                throw "PaymentFactory: Unknown payment type " + clipId;
        }
        return result;
    };

}