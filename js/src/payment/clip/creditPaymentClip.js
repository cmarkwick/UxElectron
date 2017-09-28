// Constructor.
function CreditPaymentClip() {
    var self = this;
    
    //
    // PRIVATE PROPERTIES
    // 
    self._elementId = paymentConstants.CREDIT_CLIP_ELEMENT_ID;
    self._cardListener = null;
    self._paymentDeviceFlow = null;
    self.MAX_CARD_TYPE = 7;

    //
    // PUBLIC METHODS
    //

    // Show the clip.
    self.show = function () {
        $("#" + paymentConstants.SELECT_CLIP_ELEMENT_ID).hide();

        // At this point the clip should already be appended to the #targets tag...
        // We just need to change it from hidden to visible.
        $("#" + self._elementId).show();

        // Update the swipe image.
        var hardwareType = _nex.assets.theme.getHardwareType();
        self._updateSwipeImage(hardwareType);
        
        // If we are using a payment device, start the payment device flow as well.
        if (_nex.payment.usesPaymentDevice()) {
            self._paymentDeviceFlow = new PaymentDeviceFlow(_nex.payment.numAvailableTenders);
            self._paymentDeviceFlow.start();
        } else {
            // Otherwise, start listening for a MSR swipe.
            self._listenForSwipe();
            self._showSwipeMessage();
            self._showAcceptedCardTypes();
        }

    };

    // Called when the credit payment clip goes out of scope.
    self.hide = function () {
        var element = document.getElementById(self._elementId);
        if (element) {
            element.style.display = 'none';
        }

        // If we are using a payment device (not MSR device)....
        if (_nex.payment.usesPaymentDevice()) {
            // Cleanup any payment device related things.
            self._paymentDeviceFlow.stop();
        } else {
            // For regular (non-payment device) swipes.
            // Integrate not listening right into hiding the clip.
            // This way, if the clip is not showing, we should be not listening.
            self._stopListening();
        }
    };

    //
    // PRIVATE / HELPER METHODS
    //
    self._showSwipeMessage = function () {
        var msg = $("#swipeCard");
        if (msg.length > 0) {
            msg.empty();
            msg.append(_nex.assets.theme.getTextAttribute("PAYMENT", "swipe", "Please Swipe Your Credit Card"));
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

    self._showAcceptedCardTypes = function () {

        var acceptCardsMsg = $("#acceptedCards");
        if (acceptCardsMsg.length > 0) {
            acceptCardsMsg.empty();
            acceptCardsMsg.append(_nex.assets.theme.getTextAttribute("PAYMENT", "accepted", "Accepted Credit Cards"));
        }

        var cards = $("#cards");
        if (cards.length > 0)
        {
            // display card images
            var cardTypes = _nex.assets.theme.system.CREDITCARD;
            var cardId = 0;
            		
            for(var i =0;i<cardTypes.length;i++){

                if((cardTypes[i].accept.toString().toLowerCase() === "true") && 
                    (cardTypes[i].code.toString().toLowerCase().indexOf("loyalty") === -1)) {
                    
                    // create an html element to put in the 
                    var card = cards.find("#card" + cardId);
                    if (card.length > 0)
                    {
                        card.addClass(cardTypes[i].code.toLowerCase());
                        cardId++;
                    }
                }
            }

            for (var c = cardId; c < self.MAX_CARD_TYPE; c++) {
                var hideCard = cards.find("#card" + c);
                if (hideCard.length > 0) {
                    hideCard.css("display", "none");
                }
            }
        }
    };

    // Start listening for a card swipe.
    self._listenForSwipe = function () {

        if (self._cardListener !== null) {
            self._cardListener.stopListening();
        }

        self._cardListener = new CardListener(self._lastKeyFound);
        self._cardListener.startListening();
    };

    // Called when the end of the card data is detected.
    self._lastKeyFound = function (cardData) {
        self._cardListener.stopListening();

        // Create a credit tender. 
        var tenderCredit = new TenderCredit();
        tenderCredit.update(cardData.track1, cardData.track2);
        if (tenderCredit.cardData) {
            // Pass the card data along.
            _nex.payment.processOrder(tenderCredit);
        } else {
            // Error case.
            _nex.payment.showErrorPopup(_nex.payment.textSwipeError(), _nex.payment.start());
        }
        

    };

    // Stop listening for a card swipe.
    self._stopListening = function () {
        self._cardListener.stopListening();
    };

}
CreditPaymentClip.prototype = Object.create(BasePaymentClip.prototype);
CreditPaymentClip.prototype.constructor = BasePaymentClip;


// Helper for the payment device flow.
// This will only be used if the user picks credit, and it is setup so they use payment devices.
var PaymentDeviceFlow = function (numAvailableTenders, processingPopup) {

    // Make self synonymous with this.
    var self = this;

    // Store the number of available tenders for later.
    self._numAvailableTenders = numAvailableTenders;

    // Entry point to the payment device flow.
    self.start = function () {
        //console.clear();

        // Enable the payment device. Control has now been moved to the payment device.
        self._enablePaymentDevice();
    };

    // Leaving the payment device flow.
    self.stop = function () {


    };

    // Deep copy an object.
    var deepCopy = function (object) {
        // Uses jQuery to do a deep copy of an object, by using the $.extend method,
        // but passing the first object of empty.
        return $.extend(true, {}, object);
    };

    // Show the 'please swipe your card on the payment device' popup.
    // Shortly after this, control buttons will be blocked. Control is being
    // handed over to the device.
    self._showPaymentDevicePopup = function (messageText, callback) {
        // This is right along with the main Visio diagram for this project.
        var popup = deepCopy(_nex.assets.popupManager.processingPopup);
        popup.message = messageText;
        _nex.assets.popupManager.showPopup(popup, function () {
            if (callback) {
                callback();
            }
        });

        return popup;
    };

    // Hide the payment device popup.
    self._hidePaymentDevicePopup = function (popup, callback) {
        _nex.assets.popupManager.hidePopup(popup, function () {
            if (callback) {
                callback();
            }
        });
    };

    // Send the command to the TM to enable the payment device.
    self._enablePaymentDevice = function () {
        var popup = self._showPaymentDevicePopup(_nex.payment.textPaymentDeviceSwipe());

        var requestObject = new _nex.commands.WaitForPayment();
        _nex.communication.send(requestObject, function (msg) {
            self._hidePaymentDevicePopup(popup, function () {
                _nex.payment.handlePaymentResponse(msg);
            });
        }, "PAYMENTRESPONSE");

    };

    // Pause the timer for the 'need more time' popup.
    self.pauseTimer = function () {
        // This is not in the Visio explicitly, but makes sense to do, and is the
        // first thing the Flash does.
    };

    //// Was the payment successful for the payment device.
    //self.isPaymentSuccessful = function (paymentResult) {
    //    if (paymentResult) {
    //        gotoProcess();
    //    } else {
    //        if (numAvailableTenders() > 1) {
    //            gotoSelectPayment();
    //        } else if (numAvailableTenders() === 1) {
    //            gotoOrderingPhasing();
    //        }
    //    }
    //};

    //// Callback method after the card swipe.
    //self.usesPaymentDevice = function () {
    //    if (usesPaymentDevice(xmlAttribute)) {
    //        enablePaymentDevice();
    //        showPopup();
    //        pauseTimer();
    //        blockControlButtons();
    //    } else {
    //        // Enable card listener.

    //        // Valid swipe?
    //        if (!validSwipe) {
    //            displayErrorMessage();
    //            displayCreditHtml();
    //        } else {
    //            if (isCardTypeAccepted()) {
    //                gotoProcess();
    //            }
    //        }
    //    }
    //};
};



