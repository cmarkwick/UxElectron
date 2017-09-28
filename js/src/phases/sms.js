// Constructor. Represents the SMS phase.
// If a user gets here, and SMS is not enabled, it goes
// to the green receipts phase.
function sms(phaseParameters) {
    var self = this;
    self.timer = null;


    // Guard against missing parameters.
    if (!phaseParameters) {
        console.log("ERROR: SMS requires parameters");
    }
    if (!phaseParameters.theme) {
        console.log("ERROR: SMS requires parameter: theme");
    }


    self._theme = phaseParameters.theme;

    var debugEnabled = true;
    self._debug = function () {
        if (debugEnabled) {
            console.debug("SMS", arguments);
        }
    };

    // Start the timer.
    self.startTimer = function () {
        self._debug("!!!Starting SMS timer");
        var timeout = self._getTimeoutSeconds();
        if (self.timer) {
            self.timer.stop();
            self.timer = null;
        }
        self.timer = new TimeoutTimer(this, self._gotoNextPhase, timeout);
        self.timer.start();
        self.popupPhone();
    };

    // Stop the timer.
    self.stopTimer = function () {
        if (self.timer) {
            console.log("!!!Stopping SMS timer");
            self.timer.stop();
            self.timer = null;
        }
    };

    // Called when this phase begins.
    self.start = function () {
        console.debug("SMS: Phase started");
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.COMPLETING);

        // If green receipt is enabled:
        if (self._smsenabled() && (!_nex.orderManager.currentOrder.smsNumber)) {
            // Bind the options.
            console.debug("SMS: ENABLED");
            self.startTimer();
        } else {
            console.debug("SMS: DISABLED");
            // Go to the complete phase.
            self._gotoNextPhase();
        }
    };

    self.stop = function () {
        self.stopTimer();
    };

    // Popup for a phone.
    self.popupPhone = function () {
        // Get the popup object.
        var popupString = "phonepadPopup";
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString]);

        // For some reason, setting the message wipes out the rest of the page.
        popup.message = _nex.assets.theme.getTextAttribute("PREVIOUSORDERS", "instructions2", "Phone Number");
        // Bind methods to call when they hit the buttons.
        popup.buttons[0].clickEvent = "_nex.previousOrders.cancelFetchOrders();";
        popup.buttons[0].text = _nex.assets.theme.getTextAttribute("PREVIOUSORDERS", "popupclear", "CANCEL");

        // Show the popup.
        _nex.assets.popupManager.showPopup(popup);

        // When they hit the final digit of their phone number, continue on.
        var lastDigitCallback = function () {
            var lookup = new LookupData(_nex.types.lookup.PHONE, _nex.keyboard.phonepad.data);
            _nex.orderManager.currentOrder.smsNumber = lookup.lookupValue;
            var req = new _nex.commands.AddSMSToOrder(_nex.orderManager.currentOrder.orderid, _nex.orderManager.currentOrder.smsNumber);
            _nex.communication.send(req);
            _nex.assets.popupManager.hidePopup(popup, function () {
                self._gotoNextPhase();
            });
        };
        _nex.keyboard.phonepad.bindKeys(lastDigitCallback);
    };


    // Check whether or not green receipt is enabled.
    self._smsenabled = function () {
        var result = false;
        try{
            var theme = self._theme;
            var system = theme.system;
            if (system && system.ODS && system.ODS.smsnotification) {
                result = true;
            }
            if (_nex.orderManager.currentOrder.smsNumber) result = false;
            if (theme.disablesmsprompt) result = false;

        }
        catch(ex){}
        return result;
    };

    // Go to the complete phase.
    self._gotoNextPhase = function () {
        self.stop();

        self._debug("Changing phase to complete.");
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.GREEN_RECEIPT, function () {
            _nex.greenReceipt.start();
        });
    };




    // Helper to return the number of seconds before jumping to the next screen.
    self._getTimeoutSeconds = function () {
        var timeout = 30;
        return timeout;
    };



}