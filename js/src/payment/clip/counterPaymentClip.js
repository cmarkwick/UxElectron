// Constructor.
function CounterPaymentClip() { //clip:XML, paymentTarget:MovieClip, paymentText:XML) ) {
    //
    // Private properties
    //
    var self = this;
    self._elementId = "paymentclip-counter";

    //
    // Public methods
    //
    self.isAvailable = function () {
        return true;
    };

    self.isTracked = function () {
        return false;
    };

    self.backButtonVisible = function () {
        return false;
    };

    self.cancelButtonVisible = function () {
        return false;
    };

    self.continueButtonVisible = function () {
        return false;
    };

    self.load = function () {

    };

    self.dispose = function () {

    };

    // Standard 'show' method.
    self.show = function () {
        // Instead of showing a clip, just setup counter as the final tender.
        var finalTenderCounter = new TenderCounter();

        // Process the order that way.
        _nex.payment.processOrder(finalTenderCounter);
    };

    self.hide = function () {

    };

}
CounterPaymentClip.prototype = Object.create(CounterPaymentClip.prototype);

/*
package NEXTEP.Phase.Payment.PaymentClip 
{
	import flash.display.MovieClip;
	import NEXTEP.Phase.Payment.PaymentManager;
	import NEXTEP.Shared.IDisposable;

public class CounterPaymentClip extends BasePaymentClip implements IDisposable
{
		
    public function CounterPaymentClip(clip:XML, paymentTarget:MovieClip, paymentText:XML) 
{
        super(clip, paymentTarget, paymentText);		
}
		
    override public function IsAvailable():Boolean 
{
        return true;
}
		
    override public function IsTracked():Boolean 
{
        return false;
}
		
    override public function get BackButtonVisible():Boolean 
{ 
        return false; 
}
		
    override public function get CancelButtonVisible():Boolean 
{
        return false;
}
		
    override public function get ContinueButtonVisible():Boolean 
{ 
        return false; 
}
		
    override public function Load():void 
{
        PaymentManager.ProcessOrder();
}
		
    override public function Dispose():void 
{
        super.Dispose();
}
}
    }
    */