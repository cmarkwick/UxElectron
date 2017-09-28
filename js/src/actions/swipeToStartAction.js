// Constructor.
function SwipeToStartAction(theme) {
    var self = this;
    self._theme = theme;
    self._tenderStarted = null;
    self.tenderType = "";
    self.cardData = null;
    self._pinData = "";

    // Turn to true to enable debugging information for the swipe to start.
    var debugging = true;
    self._debug = function(message) {
        if (debugging) {
            // Use built in arguments object to pass all arguments to the console.debug method.
            console.debug("SwipeToStartAction", message);
        }
    };

    // Return the tender that was created when they swiped to start.
    self.getTenderAdded = function () {
        // If they swiped to start, then after payment, we want to process the tender as a final
        // tender.
        return self._tenderStarted;
    };

    // Return the pin data that was entered, if any, when they swiped to start with.
    self.getPinData = function() {
        return self._pinData;
    };

    // Restore original state of this action.
    self.reset = function () {
        self.stopListening();
        self._tenderStarted = null;
        self.cardData = null;
        self._pinData = "";
        _nex.splashPhase.userSwipedToStart = false;
    };

    // Start listening for card swipes.
    self.startListening = function (callback) {
        self._debug("startListening");
        self.reset();

        // Start listening for card swipes and other data to start an order.
        _nex.utility.deviceListener = new DeviceListener('ALL', callback);
        _nex.utility.deviceListener.start();
    };

    // Stop listening.
    self.stopListening = function () {
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop();
        }
    };

    // Called if the user made a valid swipe.
    self.goodSwipe = function (cardData) {
        self._debug("goodSwipe");
        self.cardData = cardData;
        self._debug(self.cardData);
        // If it is a good swipe, we must determine if it is a LOYALTY card or CREDIT card.
        // We support both for swipe to start in the Flash kiosk.
        if (cardData.isLoyalty()) {
            self._debug("goodSwipe", "User swiped a loyalty card.");
            self.tenderType = "loyalty";
            self.swipedLoyaltyCard();
        } else {
            self._debug("goodSwipe", "User swiped a credit card.");
            self.tenderType = "credit";
            self.data = cardData;
            self.swipedCreditCard();
        }
    };

    // Called if the user made a bad swipe.
    self.badSwipe = function (errorMessage) {
        self._debug("badSwipe", errorMessage);

        // Get the display text for a bad swipe.
        var displayText = self._theme.getTextAttribute("PAYMENT", "swipeerror",
            "There was a problem reading your card, please swipe again");

        // Setup a callback for when the user clicks a button.
        var callback = self.reset;
        self._showBadSwipe(displayText, callback);
    };

    // Helper method to show the bad swipe message on a popup.
    self._showBadSwipe = function (message, callback) {
        self._debug("showBadSwipe");
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
        popup.message = message;
        _nex.assets.popupManager.showPopup(popup, callback);
    };

    // Prompt the user to enter their pin.
    self._promptForPin = function (track1, track2) {
        self._debug("_promptForPin");
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup);
        popup.buttons[0].clickEvent = "_nex.splashPhase.swipeToStartAction.pinEntered()"; 
        popup.message = _nex.assets.theme.getTextAttribute("ORDER", "loyaltypin", "Please enter your PIN"); // TODO: Which attribute to check?
        _nex.assets.popupManager.showPopup(popup);
        _nex.keyboard.numpad.bindKeys();
    };

    // This is called after they enter a pin.
    self.pinEntered = function () {
        self._debug("pinEntered");
        self.pinData = _nex.keyboard.numpad.data;

        // Do a loyalty inquiry.
        var cardData = self.cardData.cardNumber;
        var cardType = self.cardData.cardType;
        var track1 = self.cardData.track1;
        var track2 = self.cardData.track2;
        var command = new _nex.commands.LoyaltyInquiry(cardData, self.pinData, cardType, track1, track2, false);

        _nex.communication.send(command, function (response) {
            self._debug("Loyalty inquiry response", response);
            // ischarged: "false" 
            // isoffline: "false"
            // name: "TEST USER"
            // number: "1234"
            // responseReceived: "true"
            // status: "Success"
            // usedphone: "false"
            // value: "4.49"

            // Put this data on the loyalty tender.
            var loyaltyTender = new TenderLoyalty();
            loyaltyTender.update(response);

            // If it is a valid account.... 
            if (loyaltyTender.isValidAccount()) {
                self._debug("We can accept this loyalty card for swipe to start! Valid account.");
                self._continueWithLoyalty();

            } else {
                self._debug("Can't accept this loyalty card for swipe to start! Invalid account");
                self._genericError(self.reset);
            }
        }, "LOYALTYRESPONSE");
    };

    // Continue to previous orders with the loyalty information found.
    self._continueWithLoyalty = function () {
        self._debug("continueWithLoyalty");
        self._gotoPreviousOrders(self.cardData);
    };

    // This is called if the user swiped to start with a credit card.
    self.swipedCreditCard = function() {
        var tenderCredit = new TenderCredit();
        tenderCredit.update(self.cardData.track1, self.cardData.track2);
        self._tenderStarted = tenderCredit;
        self._createCreditTender();
    };

    self._createCreditTender = function() {
        var requestObject = new _nex.commands.AddTender("credit");
        _nex.communication.send(requestObject, function (response) {
            if (response) {
                self._gotoPreviousOrders(self.cardData);
            }
        },"TENDERADDED");
    };

    self._createLoyaltyTender = function () {
        var requestObject = new _nex.commands.AddTender("loyalty");
        _nex.communication.send(requestObject, function (response) {
            if (response) {
                self._gotoPreviousOrders(self.cardData);
            }
        }, "TENDERADDED");
    };

    // This is called if the user swiped to start with a loyalty card.
    self.swipedLoyaltyCard = function () {
        self._debug("swipedLoyaltyCard");
        var tenderConfig = _nex.assets.theme.getTenderByType("loyalty");
        if (tenderConfig) {
            if (_nex.assets.theme.isValidationRequired(tenderConfig)) {
                // prompt for pin
                self._debug("validateLoyalty", "validation required; prompting for pin");
                self._promptForPin();
            } else {
                // no validation required, don't prompt for pin
                self._debug("validateLoyalty", "validation not required; not prompting for pin");
                self._createLoyaltyTender();
            }
        } else {
            // Missing the loyalty tneder in the computeration.
            self._debug("validateLoyalty", "Possible Configuration Error: No tender for loyalty found");
            self._genericError(self.reset);
        }
    };

    // Go to the ordering phase.
    self._gotoOrdering = function() {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function () {
            _nex.ordering.start();
        });
    };

    // Go to the previous orders phase.
    self._gotoPreviousOrders = function (cardData) {
        console.debug("_gotoPreviousOrders", "Going to previous orders");
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PREVIOUS_ORDERS, function () {
            _nex.previousOrders.start(cardData);
        });
    };

    // Show a generic error message.
    self._genericError = function (callback) {
        // Re-use the one from payment.
        var message = _nex.payment.textProcessingError();
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
        popup.message = message;
        _nex.assets.popupManager.showPopup(popup, callback);
    };
}
SwipeToStartAction.prototype = Object.create(_BaseAction.prototype);