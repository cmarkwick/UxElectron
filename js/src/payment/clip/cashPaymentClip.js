// Constructor.
function CashPaymentClip(clip, paymentTarget, paymentText) {
    var self = this;
    BasePaymentClip.call(self, clip, paymentTarget, paymentText);
    self.someNewProperty = "test";

}
CashPaymentClip.prototype = Object.create(BasePaymentClip.prototype);
CashPaymentClip.prototype.constructor = BasePaymentClip;