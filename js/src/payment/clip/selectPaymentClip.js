function SelectPaymentClip() {
    var self = this;

    self._elementId = paymentConstants.SELECT_CLIP_ELEMENT_ID;

    self.enableDebugging = true;
    self._debug = function () {
        if (self.enableDebugging) {
            console.debug("SelectPaymentClip", arguments);
        }
    };

    self.show = function () {
        // At this point the clip should already be appended to the #targets tag...
        // We just need to change it from hidden to visible.
        console.debug("SelectPaymentClip.show with element " + self._elementId);
        var element = document.getElementById(self._elementId);
        if (!element) {
            throw "Missing element " + self._elementId;
        }
        $("#" + self._elementId).show();

        // If there is a credit tender or loyalty tender, allow swipe from this screen.
        // This logic was causing confusion in the lobby why it would accept a swipe if you didn't pick credit or loyalty
        // Commenting out for now
        //if (self._checkForCreditTender() || self._checkForLoyaltyTender()) {
        //    if (_nex.utility.deviceListener) {
        //        _nex.utility.deviceListener.stop();
        //    }
        //    _nex.utility.deviceListener = new DeviceListener("CARD", self._lastKeyFound, true);
        //    _nex.utility.deviceListener.start();
        //}
    };


    self._checkForCreditTender = function () {
        var result = true;
        var NOT_FOUND = -1; // jQuery returns -1 if it is not found in the array.
        var tendersAvailable = _nex.assets.theme.tendersAvailable();
        if ($.inArray('credit', tendersAvailable) === NOT_FOUND) {
            result = false;
        }
        return result;
    };

    self._checkForLoyaltyTender = function () {
        var result = true;
        var NOT_FOUND = -1; // jQuery returns -1 if it is not found in the array.
        var tendersAvailable = _nex.assets.theme.tendersAvailable();
        if ($.inArray('loyalty', tendersAvailable) === NOT_FOUND) {
            result = false;
        }
        return result;
    };

    self.hide = function () {
        $("#" + self._elementId).hide();
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop();
        }
    };

    // Called when the end of the card data is detected.
    self._lastKeyFound = function (cardData) {
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop();
        }
        self._debug(cardData);
        self._checkSwipeData(cardData.track1, cardData.track2);
    };

    // Checks the swipe data and hands processing over to the SwipeToStart action.
    self._checkSwipeData = function (track1, track2) {
        var cardParser = new CardParser(_nex.assets.theme);
        self._debug('_checkSwipeData, parsing card');
        cardParser.parse(track1, track2, self._goodSwipe, self._badSwipe);
    };

    // Called for a good swipe by the card parser.
    self._goodSwipe = function (cardData) {
        self._debug('goodSwipe method');
        // We support both loyalty and credit for the splash screen just like swipe to start
        if (cardData.isLoyalty()) {
            self._debug("goodSwipe", "User swiped a loyalty card.");
            self.tenderType = "loyalty";
            // Simulate the last key being found from the loyalty clip itself.
            var clip = new LoyaltyPaymentClip();
            clip._lastKeyFound(cardData);
        } else {
            self._debug('credit');
            self._debug("goodSwipe", "User swiped a credit card.");
            var tenderCredit = new TenderCredit();
            tenderCredit.update(cardData.track1, cardData.track2);
            if (tenderCredit.cardData) {
                // Pass the card data along.
                _nex.payment.processOrder(tenderCredit);
            } else {
                self._debug('bad');
            }
        }
    };

    // Called for a bad swipe by the card parser.
    self._badSwipe = function () {
        self._debug('badSwipe method');
        _nex.payment.showErrorPopup(_nex.payment.textSwipeError(), _nex.payment.start());
    };


}
SelectPaymentClip.prototype = Object.create(BasePaymentClip.prototype);