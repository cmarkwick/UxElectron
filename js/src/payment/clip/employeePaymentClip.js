// Constructor.
function EmployeePaymentClip() {
    var self = this;
    
    //
    // PRIVATE PROPERTIES
    // 
    self._elementId = paymentConstants.EMPLOYEE_CLIP_ELEMENT_ID;
    self._cardListener = null;
    self._paymentDeviceFlow = null;

    //
    // PUBLIC METHODS
    //

    // Show the clip.
    self.show = function () {
        // Transition out the select payment clip.
        $("#" + paymentConstants.SELECT_CLIP_ELEMENT_ID).hide();

        // Update the message to be shown. The image will be set by creative as the background on the element with id of "swipeTarget"
        self._showSwipeMessage();

        // Update the swipe image.
        var hardwareType = _nex.assets.theme.getHardwareType();
        self._updateSwipeImage(hardwareType);

        // Show the loyalty payment HTML.
        $("#" + self._elementId).show();

        // Start listening for a card swipe.
        self._listenForSwipe();
    };

    self._showSwipeMessage = function () {
        // The swipe message is custom in the Flash.
        // For the UX Kiosk, we decided to have a default message at least.
        var msg = $("#txtSwipeCard");
        if (msg.length > 0) {
            msg.empty();
            // This uses a new attribute, employeeswipe.
            msg.append(_nex.assets.theme.getTextAttribute("PAYMENT", "employeeswipe", "Please Swipe Your Employee Card"));
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

    // Show the user a popup to enter their employee pin.
    self.showPinPrompt = function (track2) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup);
        popup.buttons[0].clickEvent = "_nex.payment.processEmployeeCard('" + htmlEscape(track2) + "');";
        popup.message = _nex.assets.theme.getTextAttribute("ORDER", "employeepin", "Please enter your PIN"); // TODO: Find out which attribute to use here. employeeverify is temporary
        _nex.assets.popupManager.showPopup(popup);
        _nex.keyboard.numpad.bindKeys();
    };

    // Hide the clip.
    self.hide = function () {
        $("#" + self._elementId).hide();

        // Stop listening for a MSR swipe.
        self._stopListening();
    };

    // Start listening for a card swipe.
    self._listenForSwipe = function () {
        self._cardListener = new CardListener(self._lastKeyFound);
        self._cardListener.startListening();
    };

    // Called when the end of the card data is detected.
    self._lastKeyFound = function (cardData) {
        self._cardListener.stopListening();

        // If it is configured to prompt for a pin, prompt for a pin.
        var employeeTenderConfig = _nex.assets.theme.getTenderByType("employee");
        var promptForPin = employeeTenderConfig.validate === "true" ? true : false;
        if (promptForPin) {
            self.showPinPrompt(cardData.track2);
        } else {
            // Process the employee card data.
            _nex.payment.processEmployeeCard(cardData.track2);
        }
    };

    // Stop listening for a card swipe.
    self._stopListening = function () {
        self._cardListener.stopListening();
    };

}
EmployeePaymentClip.prototype = Object.create(BasePaymentClip.prototype);