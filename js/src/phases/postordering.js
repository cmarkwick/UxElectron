// Capture any additional information from the user before complete.
// Brings the user to the green receipt screen if they don't respond soon enough.
function PostOrdering() {

    var self = this;

    self.debugEnabled = true;
    self.debug = function () {
        if (self.debugEnabled) {
            console.debug("PostOrdering", arguments);
        }
    };

    // Check if 'previous orders' is enabled.
    self._isPreviousOrdersEnabled = function () {
        var result = false;
        var theme = _nex.assets.theme;
        if (theme && theme.system && theme.system.PREVIOUSORDERS && theme.system.PREVIOUSORDERS.hasOwnProperty("enabled")) {
            if (theme.system.PREVIOUSORDERS.enabled.toLowerCase() === 'true') {
                result = true;
            }
        }
        return result;
    };

    // Start.
    self.start = function () {
        self.debug("start");
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.POST_ORDERING);
        refreshOrderTimer();

        if (_nex.manager.theme.kiosk.PAYMENTPROFILE.ORDERTYPE.hasOwnProperty("drivethruflag") && _nex.manager.theme.kiosk.PAYMENTPROFILE.ORDERTYPE.drivethruflag === "true") {
            self.gotoNextPhase(false);
        } else if (!self._isPreviousOrdersEnabled()) {
            self.gotoNextPhase(false);
        } else {
            if ((_nex.orderManager.currentOrder.smsNumber) ||
                (_nex.orderManager.currentOrder.lookupData)) {
                self.debug("Phone number found at previous orders... Trying to apply it here.");
                if (_nex.orderManager.currentOrder.lookupData) {
                    var req = new _nex.commands.SavePreviousOrder(_nex.orderManager.currentOrder.orderid, _nex.orderManager.currentOrder.smsNumber, _nex.orderManager.currentOrder.lookupData);
                    _nex.communication.send(req); // SavePreviousOrder does not have a response...
                }
                self.gotoNextPhase(true);
            } else {
                self.debug("No phone number at previous orders.");
                self.showLookupOptions();
            }
        }
    };

    // Show the lookup options.
    self.showLookupOptions = function () {
        // Re-use what is in the repeatOrdersPhase... pass it true for postordering.
        _nex.repeatOrderPhase.showLookupOptions(true);
    };

    // Stop.
    self.stop = function () {
        // For future use
    };

    // Called if we already have everything we need.
    self.gotoNextPhase = function (saveHit) {
        self.stop();
        var phaseClips = _nex.assets.phaseManager.findPhaseClips(_nex.assets.phaseManager.phaseType.SMS);
        if (phaseClips !== undefined && phaseClips !== null && phaseClips.length > 0) {
            self.debug("SMS is enabled. Going to SMS.");
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.SMS, function () {
                _nex.sms.start();
            });
        }
        else {
            self.debug("SMS is not enabled. Going to green receipt.");
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.GREEN_RECEIPT, function () {
                _nex.greenReceipt.start();
            });

        }
    };

    // Tracking logic common to buttons in post orders.
    self._trackClick = function (text, context) {
        var buttonId = ""; // button id is left as empty string.
        var buttonText = text;
        var menuId = ""; // menu id is not applicable in this phase.
        var BUTTON_TYPE = "control";
        _nex.utility.buttonTracking.track(buttonId, buttonText, menuId, context, BUTTON_TYPE);
    };


}