// Constructor. There is a BasePaymentClip and other Clip files in the Flash as well.
// We are using the naming convention of Clip, although these aren't technically movie clips,
// it keeps it consistent with the naming in different areas.
function BasePaymentClip(clip, paymentTarget, paymentText) { //clip:XML, paymentTarget:MovieClip, paymentText:XML
    var self = this;
    //self._paymentClipXml = ""; //XML;
    //self._paymentMedia = ""; //MediaFile;
    //self._paymentTarget = ""; //MovieClip;
    //self._paymentText = ""; //XML;

    self._allowCardSwipes = false; //Boolean = false;		
    self._waitingOnUpdate = false; //Boolean = false; ??
    self._createdTender = false; // Related to preauth and pay
    self._gratuityEnabled = false; //Boolean = false;
    self._gratuityShown = false; //Boolean = false;

    // This is from the Flash constructor.
    self._paymentClipXml = clip;
    self._paymentTarget = paymentTarget;
    self._paymentText = paymentText;
    self._paymentMedia = null;

    //var gratList = ThemeManager.CurrentTheme.SystemSettingsXml.GRATUITY;
    //if (gratList.length() > 0)
    //{
    //   _gratuityEnabled = (gratList[0].@enabled.toString().toLowerCase() == "true");
    //}

    // Default for whether or not the back control button is visible.
    self.backButtonVisible = function ()
    {
        return true;
    };

    // Default for whether or not the cancel button control is visible.
    self.cancelButtonVisible = function ()
    {
        return true;
    };

    // Continue navigation button.
    self.continueButtonVisible = function () //:Boolean
    {
        return false;
    };

    // By default show the 'request server' button.
    self.requestServerButtonVisible = function ()
    {
        return true;
    };

    // Default for the load method.
    self.load = function () {

    };
}