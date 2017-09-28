// Constructor.
function LoyaltyPaymentClip() {
    var self = this;

    self._elementId = paymentConstants.LOYALTY_CLIP_ELEMENT_ID;

    self._paymentDeviceFlow = null;
    self.tender = null;

    self.enableDebug = false;
    self._debug = function (message) {
        if (self.enableDebug) {
            console.debug(message);
        }
    };

    // Show the clip.
    self.show = function () {
        // Transition out the select payment clip.
        $("#" + paymentConstants.SELECT_CLIP_ELEMENT_ID).hide();

        // Set the swipe message. The image will be set as the background on the element with id of "swipeTarget"
        self._showSwipeMessage();

        // Update the swipe image.
        var hardwareType = _nex.assets.theme.getHardwareType();
        self._updateSwipeImage(hardwareType);

        // Show the new clip.
        $("#" + self._elementId).show();

        // Start listening for card swipes, barcode scans, RFIDs, etc.
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop();
        }
        _nex.utility.deviceListener  = new DeviceListener("ALL", self._lastKeyFound, true);
        _nex.utility.deviceListener.start();
    };

    self._showSwipeMessage = function () {
        var msg = $("#txtSwipeCard");
        if (msg.length > 0) {
            msg.empty();
            // Following along with the Flash, the UpdateClip method in LoyaltyPaymentClip uses the 'scan' attribute
            // to get which text to show for this clip. It also uses the default text of "Please Swipe your Loyalty Card".
            msg.append(_nex.assets.theme.getTextAttribute("PAYMENT", "scan", "Please Swipe Your Loyalty Card"));
        }
    };

    self._updateSwipeImage = function (hardwareType) {
        if (hardwareType.length > 0) {
            var div = $("#swipeTarget");
            if (div.length > 0) {
                div.addClass(hardwareType);
            }
        }
    };

    // Called when the credit payment clip goes out of scope.
    self.hide = function () {
        $("#" + self._elementId).hide();
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop();
        }
    };

    // Called to reset.
    self.reset = function () {
        self.hide();
        self.show();
    };

    // Called when the end of the card data is detected.
    self._lastKeyFound = function (deviceData) {

        // Store this data in the payment phase for later.
        _nex.payment.deviceData = deviceData;

        var tenderConfig = _nex.assets.theme.getTenderByType("loyalty");
        if (tenderConfig) {
            if (_nex.assets.theme.isValidationRequired(tenderConfig)) {
                // prompt for pin (which will call processLoyalty)
                self._debug("validation required; prompting for pin");
                self._promptForPin();
            } else {
                self._debug("validation not required");
                // skip prompting for a pin; just process the loyalty
                _nex.payment.loyaltyInquiry("");
            }
        } else {
            // This looks like a configuration issue.
            console.log("Configuration Error: No tender for loyalty found!");
            self._genericError(self.reset);
        }
    };

    // Prompt the user to enter their pin.
    self._promptForPin = function () {
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup);
        popup.buttons[0].clickEvent = "_nex.payment.loyaltyInquiry(_nex.keyboard.numpad.data);";
        popup.buttons[1].clickEvent = "_nex.payment._paymentManager._currentClip.show();";
        popup.message = _nex.assets.theme.getTextAttribute("ORDER", "loyaltypin", "Please enter your PIN"); // TODO: Which attribute to check?
        _nex.assets.popupManager.showPopup(popup);
        _nex.keyboard.numpad.bindKeys();
    };
}
LoyaltyPaymentClip.prototype = Object.create(BasePaymentClip.prototype);
