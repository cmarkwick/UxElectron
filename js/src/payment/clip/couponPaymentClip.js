// Constructor.
function CouponPaymentClip() {
    var self = this;

    self._elementId = paymentConstants.COUPON_CLIP_ELEMENT_ID;

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
        // Transition out the coupon payment clip.
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
        _nex.utility.deviceListener  = new DeviceListener("BARCODE", self._lastKeyFound, true);
        _nex.utility.deviceListener.start();
    };

    self._showSwipeMessage = function () {
        var msg = $("#txtScanCoupon");
        if (msg.length > 0) {
            msg.empty();
            // The function will check the kiosktext.xml file for a scanCoupon attribute to get which text to show for this clip. 
            // If the attribute does not exist, the default text will be "Please Swipe your Coupon".
            msg.append(_nex.assets.theme.getTextAttribute("PAYMENT", "scanCoupon", "Please Scan Your Coupon"));
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

        var tenderConfig = _nex.assets.theme.getTenderByType("coupon");
        if (tenderConfig) {
            if (_nex.assets.theme.isValidationRequired(tenderConfig)) {
                // prompt for pin (which will call processCoupon)
                self._debug("validation required; prompting for pin");
                self._promptForPin();
            } else {
                self._debug("validation not required");
                // skip prompting for a pin; just process the coupon
                _nex.payment.couponInquiry("");
            }
        } else {
            // This looks like a configuration issue.
            console.log("Configuration Error: No tender for coupon found!");
            self._genericError(self.reset);
        }
    };

    // Prompt the user to enter their pin.
    self._promptForPin = function () {
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup);
        popup.buttons[0].clickEvent = "_nex.payment.couponInquiry(_nex.keyboard.numpad.data);";
        popup.message = _nex.assets.theme.getTextAttribute("ORDER", "couponpin", "Please enter your PIN"); // TODO: Which attribute to check?
        _nex.assets.popupManager.showPopup(popup);
        _nex.keyboard.numpad.bindKeys();
    };
}
CouponPaymentClip.prototype = Object.create(BasePaymentClip.prototype);
