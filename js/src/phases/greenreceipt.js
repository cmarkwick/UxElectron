// Constructor. Represents the receipt phase.
// If a user gets here, and green receipts are not enabled, it goes
// right to the Complete phase where the receipt will be printed.
function GreenReceipt(phaseParameters) {
    var self = this;
    self.timer = null;

    var HasPrinterErrorByPassed = false;//gets set to true if the printer is offline, but green receipts are enabled
    // Guard against missing parameters.
    if (!phaseParameters) {
        console.log("ERROR: GreenReceipt requires parameters");
    }
    if (!phaseParameters.theme) {
        console.log("ERROR: GreenReceipt requires parameters theme");
    }

    // Use the theme for checking if green receipts are enabled. Passed in like other phases.
    self._theme = phaseParameters.theme;

    var debugEnabled = false;
    self.debug = function () {
        if (debugEnabled) {
            console.debug("GreenReceipt", arguments);
        }
    };

    // Start the timer.
    self.startTimer = function () {
        self.debug("!!!Starting green receipt timer");
        var timeout = self._getTimeoutSeconds();
        self.debug("greenReceipt - setting timeout to " + timeout);
        if (self.timer) {
            self.timer.stop();
            self.timer = null;
        }
        self.timer = new TimeoutTimer(this, self.printReceipt, timeout);
        self.timer.start();
    };

    // Stop the timer.
    self.stopTimer = function () {
        if (self.timer) {
            console.log("!!!Stopping green receipt timer");
            self.timer.stop();
            self.timer = null;
        }
    };

    // Called when this phase begins.
    self.start = function () {
        console.debug("GreenReceipt: Start green receipt phase");
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.COMPLETING); 

        self.startTimer();

        // If green receipt is enabled:
        if (self._greenReceiptEnabled()) {
            // Bind the options.
            self._bindOptions();
        } else {
            // Go to the complete phase.
            self._gotoComplete();
        }
    };

    self.stop = function () {
        self.stopTimer();
    };

    //public enum ReceiptDelivery : int
    //{
    //    Print = 0,
    //    Email = 1,
    //    None = 2
    //}

    // Called when print receipt is pushed.
    self.printReceipt = function () {
        _nex.orderManager.currentOrder.receiptFormat = _nex.orderManager.receiptFormatType.PAPER;
        // Go to the complete phase.
        self._gotoComplete();
    };

    // Called when email receipt is pushed.
    self.emailReceipt = function () {
        self._hideReceiptChoices();
        self._popupEmail();
    };

    // Called when no receipt is pushed.
    self.noReceipt = function () {

        _nex.orderManager.currentOrder.receiptFormat = _nex.orderManager.receiptFormatType.NONE;
        // Go to the complete phase.
        self._gotoComplete();
    };

    // Called when asking the user for their email address.
    self._popupEmail = function () {

        // Get the popup object.
        var popupString = "emailPopup";
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString]);
        popup.buttons[0].clickEvent = "_nex.greenReceipt.saveEmail()";
        popup.buttons[1].clickEvent = "_nex.greenReceipt.cancelEmail()";

        // Show the popup.
        _nex.assets.popupManager.showPopup(popup);

        // Bind the keys.
        _nex.keyboard.keypad.bindKeys();

        //set initial email if it exists
        _nex.keyboard.keypad.updateText(_nex.orderManager.currentOrder.customer.email);
    };

    // User clicked 'save' on the email screen.
    self.saveEmail = function () {
        // console.debug("Saving email");
        _nex.orderManager.currentOrder.receiptFormat = _nex.orderManager.receiptFormatType.EMAIL;
        _nex.orderManager.currentOrder.customer.email = _nex.keyboard.keypad.data;
        // Go to the complete phase.
        self._gotoComplete();
    };

    // User clicked 'cancel' on the email screen.
    self.cancelEmail = function () {
        self._showReceiptChoices();
    };

    // Check whether or not green receipt is enabled.
    self._greenReceiptEnabled = function () {
        var result = false;
        var theme = self._theme;
        var system = theme.system;
        // console.debug("Checking green receipt");
        if (system && system.RECEIPT && system.RECEIPT.greenreceipt) {
            self.debug("green receipt element is present.");
            var greenReceiptFlag = system.RECEIPT.greenreceipt;
            if (greenReceiptFlag.toLowerCase() === "true") {
                self.debug("green receipt element is present and enabled.");
                result = true;
            } else {
                console.debug("Green receipt element is present and set to " + system.RECEIPT.greenreceipt);
            }
        }
        return result;
    };

    // Go to the complete phase.
    self._gotoComplete = function () {
        self.stop();
        self.debug("Changing phase to complete.");
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.COMPLETE, function () {
            _nex.complete.start();
        });
    };

    // Helper method common to all green receipt buttons being clicked.
    self._trackReceiptClick = function (selectedButtonText) {
        // Flash:
        // ButtonTracker.Track("", selectedButton, PhaseManager.CurrentPhase.PhaseId, "", "Receipt", 3, this);

        var BUTTON_ID = ""; // Following along with the Flash, the button id is always blank for green receipt phase.
        var MENU_ID = ""; // Menu id is not applicable in the green receipt phase.
        var BUTTON_CONTEXT = "Receipt";
        var BUTTON_TYPE = "green"; // The button type is green, which will be translated to 3.
        _nex.utility.buttonTracking.track(BUTTON_ID, selectedButtonText, MENU_ID, BUTTON_CONTEXT, BUTTON_TYPE);
    };
    // Button click handlers.
    self._noReceiptClicked = function ($button) {
        self._trackReceiptClick("No Receipt");
        self.noReceipt();
    };
    self._emailReceiptClicked = function ($button) {
        self._trackReceiptClick("Email Receipt");
        self.emailReceipt();
    };
    self._printReceiptClicked = function ($button) {
        self._trackReceiptClick("Paper Receipt");
        self.printReceipt();
    };

    // Helper to return the number of seconds before jumping to the next screen.
    self._getTimeoutSeconds = function () {
        var timeout = 11;
        if (self._theme && self._theme.system && self._theme.system.RECEIPT) {
            
                if (self._theme.system.RECEIPT.greenreceipttimeout) {
                    var newTimeout = parseInt(self._theme.system.RECEIPT.greenreceipttimeout);
                    if (!isNaN(newTimeout)) {
                        timeout = newTimeout;
                    }
                
            }
        }
        return timeout;
    };

    // Setup what happens when the user clicks the buttons.
    self._bindOptions = function () {
        // Update the text on the buttons to what is in kiosk text.
        self._updateReceiptText();

        // Send the user forward if they don't choose in a certain period of time.
        self.startTimer();

        // Setup the click events.
        $("#button0").unbind("click");
        $("#button0").click(function () {
            self.stopTimer();
            self._printReceiptClicked($("#button0"));
        });
        $("#button1").unbind("click");
        $("#button1").click(function () {
            self.stopTimer();
            self._emailReceiptClicked($("#button1"));
            
        });
        $("#button2").unbind("click");
        $("#button2").click(function () {
            self.stopTimer();
            self._noReceiptClicked($("#button2"));
        });
        //hide "print" button if the printer is offline,otherwise show it!  -Trey
        if (self.HasPrinterErrorByPassed) {           
            $("#button0").hide();
        }
        else {
            $("#button0").show();
        }
    };

    // Hide the receipt choices dialog.
    self._hideReceiptChoices = function () {
        var element = $("#clip-choices");
        element.hide();
    };

    // Show the receipt choices dialog.
    self._showReceiptChoices = function () {
        var element = $("#clip-choices");
        element.show();
    };

    // Get the text to use for the green receipt.
    self._updateReceiptText = function () {
        var kioskText = self._theme.kioskText;
        if (kioskText) {
            var receiptText = kioskText.RECEIPTTEXT;
            if (receiptText) {
                var greenreceiptheader = receiptText.greenreceiptheader ? receiptText.greenreceiptheader : "Consider the Environment";
                var greenreceiptno = receiptText.greenreceiptno ? receiptText.greenreceiptno : "No Receipt"; 
                var greenreceiptemail = receiptText.greenreceiptemail ? receiptText.greenreceiptemail : "Email Receipt";
                
                var greenreceiptpaper = receiptText.greenreceiptpaper ? receiptText.greenreceiptpaper : "Paper Receipt";
                $("#receiptText").html(greenreceiptheader);
                $("#button2").html(greenreceiptno);
                $("#button1").html(greenreceiptemail);
                $("#button0").html(greenreceiptpaper);

            }
        }
    };

}