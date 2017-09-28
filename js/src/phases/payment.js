// Main payment flow.
function Payment(paymentParams) {

    // Make self synonymous with this.
    var self = this;

    // Store the theme object.
    self._theme = paymentParams.theme;

    // Guard against missing required parameters.
    if (!self._theme) {
        console.log("ERROR: theme not passed into the payment phase.");
    }

    // Payment uses the payment manager to show and hide clips.
    self._paymentManager = null;

    // Keep track of the last selected tender.
    self.lastSelectedTender = "";

    // Whether or not to automatically charge the card that was swiped to start.
    self.autocharge = true; // TODO: Find out what the setting was to autocharge a card.

    // Payment related device data.
    self.deviceData = null;

    // Debugging for the payment phase.
    self._enableDebugging = true;
    self._debug = function () {
        if (self._enableDebugging) {
            console.debug("PaymentPhase", arguments);
        }
    };


    self.reset = function (route) {

        if ((route === undefined) || (route === null)) {
            route = true;
        }

        self.deviceData = null;
        self.autocharge = true;
        //self._removeSelectedTender(); // no longer needed
        _nex.utility.orderTimer.restart();

        if (route) {
            self._route(); // skip start and go to route... start will try to autocharge again for swipe to start.
        }
    };

    // Start/restart the payment phase.
    self.start = function ( ) {
        // Follows along with the Visio diagram for this project.
        // This is the main entry point to the payment process.
        self._debug("start");
        _nex.assets.popupManager.hideAllPopups(); // sometimes when coming back to the payment phase, a popup was still being shown for card swipe errors.

        // Setup the payment manager which will show and hide clips.
        if (!self._paymentManager) {
            self._paymentManager = new PaymentManager();
        }
        self._paymentManager.reset();

        // Remove any previously selected tender.
        // Commented out but left here for reference. Should not be needed.
        //if (self.lastSelectedTender !== "") {
        //self._removeSelectedTender();
            //self.lastSelectedTender = "";
        //}

        // Send an update of the current status.
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.PAYMENT);

        if (inPreviewer()) {
            self._gotoSelectPayment();
        } else {
            if (_nex.manager.theme.paymentProfile.roundupcharityenabled === "true")
            {
                self._popupRoundUpCharity();
            }
            else
            {
                self._sendCalculateTotal();
            }
        }
    };

    // Called when existing the payment phase if we go offline.
    self.stop = function () {
        if (_nex.utility.orderTimer) {
            _nex.utility.orderTimer.stop();
        }
    };

    // Logic for routing where the user goes to based on the number of tenders.
    self._route = function (swipedToStart) {
        // If swiped to start...
        if (swipedToStart) {
            self.swipedToStart();
            return;
        }

        // Check the number of tenders.
        // If they are >= 2, we go to select payment.
        // If they are 1, we just create that tender.
        // If they are 0, we return to order review.
        var availableTenders = self._getAvailableTenders();
        var numberOfTenders = availableTenders.length;
        if (numberOfTenders !== undefined && numberOfTenders !== null) {
            if (numberOfTenders === 0) {
                self._zeroPaymentOptions();
            } else if (numberOfTenders === 1) {
                self._onePaymentOption(availableTenders[0]);
            } else {
                self._multiplePaymentOptions();
            }
        } else {
            // This should never happen.
            // Just in case, simply treat this case the same as zero payment options.
            self._zeroPaymentOptions();
        }
    };

    // Called when the user swiped to start.
    self.swipedToStart = function () {
        // Support both credit and loyalty for swipe to start.
        var finalTender = _nex.splashPhase.swipeToStartAction.getTenderAdded();

        if (finalTender) {
            self._debug("swipedToStart", "Automatically charging the credit card that was swiped to start");
            if (self.autocharge) {
                // Process the order with the tender added as the final tender.
                self._debug("Process Order with tender: ", finalTender);
                self.processOrder(finalTender);
            }
        } else {
            self._debug("swipedToStart", "Automatically doing a loyalty inquiry. If preauthandpay is true, it will charge the card; otherwise, check first then charge the card if there are enough funds.");
            self.deviceData = _nex.splashPhase.swipeToStartAction.cardData;
            var pin = _nex.splashPhase.swipeToStartAction.getPinData();
            if (self.autocharge) {
                self.loyaltyInquiry(pin);
            }
        }
    };

    // Returns true if we are using a payment device.
    self.usesPaymentDevice = function () {
        var result = false;
        if (_nex.assets.theme.lastUpdate) {
            var lastUpdate = _nex.assets.theme.lastUpdate;
            if (lastUpdate.usepaymentdevice && lastUpdate.usepaymentdevice.length > 0) {
                result = _nex.assets.theme.lastUpdate.usepaymentdevice.toLowerCase() === "true";
            }
        }
        return result;
    };

    // Called when the user hits the 'back' button during payment.
    self.backButton = function () {

        if (self.lastSelectedTender.length > 0) {
            self._removeSelectedTender();
        }

        var routed = self._paymentManager.previousClip();
        if (!routed) {
            self._gotoOrderReview();
        }

    };

    // Called at the end.
    self.orderProcessed = function (result) {
        self._debug("enter orderProcessed with result ", result);
        self.hideProcessingPopup(function () {

            if (result.orderstatus.toLowerCase() === "success") {
                self._debug("result is success ");
                // set the order number for the complete phase and other phases to reference later
                _nex.ordering.order.ordernumber = result.ordernumber;
                _nex.ordering.order.orderid = result.orderid;
                if (result.TENDERRESULT !== undefined) {
                    _nex.ordering.order.tenderResults = result.TENDERRESULT;
                }

                //if this order doesn't currently have a guestaccount or email
                //and if the orderPRocessed
                if ((_nex.orderManager.currentOrder.customer.email === null || _nex.orderManager.currentOrder.customer.email === "") &&
                    (_nex.orderManager.currentOrder.customer.guestaccountid === null || _nex.orderManager.currentOrder.customer.guestaccountid === "") &&
                    result.email !== null && result.email !== "") {

                    _nex.orderManager.currentOrder.customer.email = result.email;
                    _nex.orderManager.currentOrder.customer.guestaccountid = result.guestaccountid;
                }

                self.gotoPostOrdering();
            } else {
                self._debug("result is error ");
                // remove the last tender added from the tender stack
                _nex.communication.send(new _nex.commands.RemoveTender());

                // show a generic error message.
                _nex.payment.showErrorPopup(self.textProcessingError(), function () {
                    self._gotoOrderReview();
                });
            }
        });

    };

    self.showTestPayment = function (show) {
        show = show || false;
        var payment = $("#payment");
        if (show && (payment.length > 0)) {
            var testPayment = payment.find("#testpayment");
            if (testPayment.length === 0) {
                payment.append('<div id="testpayment" class="test-payment" >test payment</div>');
            }
        }
    };

    self._trackPaymentClick = function ($button) {
        // Flash:
        // ButtonTracker.Track("", this.LabelText, PhaseManager.CurrentPhase.PhaseId,"", "Payment", 1, this);

        var PAYMENT_BUTTON_ID = "";
        var paymentButtonText = $button.text();
        var currentMenuId = "";
        var PAYMENT_CONTEXT = "Payment";
        var PAYMENT_BUTTON_TYPE = "control"; // The payment buttons are in payment/paymentButtons.js... These are the control buttons cancel and back.
        _nex.utility.buttonTracking.track(PAYMENT_BUTTON_ID, paymentButtonText, currentMenuId, PAYMENT_CONTEXT, PAYMENT_BUTTON_TYPE);
    };

    self._cancelButtonClicked = function ($button) {
        _nex.assets.soundManager.playButtonHit();
        self._trackPaymentClick($button);
        _nex.ordering.cancelOrderPrompt();
    };

    self._backButtonClicked = function ($button) {
        _nex.assets.soundManager.playButtonHit();
        self._trackPaymentClick($button);
        _nex.payment.backButton();
    };

    // Setup the cancel, back, and other control buttons.
    self._updateControlButtons = function () {

        // update cancel button
        var btnCancel = $('#ctrl-cancel');
        if (btnCancel.length > 0) {
            self._theme.setControlButtonText("ctrl-cancel", self._theme.getTextAttribute("ORDER", "cancel", "CANCEL"));
            btnCancel.removeClass('control-button-hidden');
            btnCancel.unbind("click");
            btnCancel.click(function () {
                self._cancelButtonClicked(btnCancel);
            });
        }

        // update back button
        var btnBack = $('#ctrl-back');
        if (btnBack.length > 0) {
            self._theme.setControlButtonText("ctrl-back", self._theme.getTextAttribute("ORDER", "back", "BACK"));
            btnBack.removeClass('control-button-hidden');
            btnBack.unbind("click");
            btnBack.click(function () {
                self._backButtonClicked(btnBack);
            });
        }
    };

    self._hideBackButton = function () {
        var btnBack = $('#ctrl-back');
        if (btnBack.length > 0) {
            btnBack.addClass('control-button-hidden');
        }
    };

    // Go to post ordering.
    self.gotoPostOrdering = function () {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.POST_ORDERING, function () {
            self.showTestPayment(false);
            _nex.postOrdering.start();
        });
    };

    // Go to select payment.
    self._gotoSelectPayment = function () {
        self._paymentManager.gotoClip(paymentConstants.SELECTPAYMENT_CLIP);
        self._paymentManager.updateReceipt();
    };

    // Go to order review.
    self._gotoOrderReview = function () {
        self.reset(false);
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function () {
            self.showTestPayment(false);
            _nex.ordering.gotoOrderReview();
            $("#ordering #controlbuttons").show();
        });
    };

    // Callback when a payment has been selected.
    // Examples:
    // Called when the user picks 'counter' for payment.
    // Called when credit is chosen, and there is an error.
    // Called when credit is chosen, and the data is valid.
    self.paymentSelected = function (result) {
        // Create the selected tender.
        self._debug('payment selected');
        if (inPreviewer()) {
            self._debug('Going right to complete.');
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.COMPLETE, function () {
                _nex.complete.start();
            });
        } else {
            self.createSelectedTender(result);
        }
    };

    // The Round up for charity popup.
    self._popupRoundUpCharity = function () {
        var popup = $.extend(true, {}, _nex.assets.popupManager.yesNoPopup);
        var roundUpPrompt = _nex.assets.theme.getTextAttribute("PAYMENT", "roundupcharityprompt", "Round-Up for Charity?");
        popup.message = roundUpPrompt;
        popup.buttons[0].clickEvent = "console.debug('yes clicked');_nex.payment._roundupcharity(true);";
        popup.buttons[1].clickEvent = "console.debug('no clicked');_nex.payment._roundupcharity(false);";
        _nex.assets.popupManager.showPopup(popup);
    };

    self._roundupcharity = function (roundup) {
        _nex.orderManager.currentOrder.roundUpCharitySelected = roundup;
        self._sendCalculateTotal();
    };

    self._sendCalculateTotal = function () {

        self.showProcessingPopup(self.textProcessingOrder());

        // Send the command to calculate the total for the current order. This will take into account tax on the previous balance.
        _nex.communication.send(new _nex.commands.CalculateTotal(_nex.orderManager.currentOrder), function (result) {
            self.hideProcessingPopup(function(){
                if (result.hasOwnProperty("subtotal") && (Number(result.subtotal) !== -1)) {
                    // If we get to here, invoke the routing logic to decide whether we go back to
                    // ordering (which should take us to order review), show select tender screen, etc.
                    self.showTestPayment(_nex.assets.theme.testMode);
                    var swipedToStart = _nex.splashPhase.userSwipedToStart;
                    self._route(swipedToStart);
                } else {
                    // Show an error popup if we fail to calculate the total; then return to ordering.
                    self.showErrorPopup(self.textCalculateTotalError(), function () {
                        _nex.payment.backButton();
                    });
                }
            });
        }, "ORDERTOTAL");
    };

    // Show a popup with an error message.
    self.showErrorPopup = function (message, callback) {
        self._debug("hiding all popups and showing error popup");
        _nex.assets.popupManager.hideAllPopups();
        window.setTimeout(function () {
            var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
            popup.message = message;
            _nex.assets.popupManager.showPopup(popup, callback);
        }, 1000);
    };

    //
    // PRIVATE / HELPER METHODS
    //

    // Called when there are zero payment options.
    self._zeroPaymentOptions = function () {
        self._debug("zero payment option detected - going to order review");
        // We want to go back to the ordering phase.
        // The ordering phase should deal with it appropriately.
        self._gotoOrderReview();
    };

    // Called when there is only one payment option.
    self._onePaymentOption = function (type) {
        self._debug("one payment option detected - skipping payment select screen");
        // When there is only one payment option, this is a special case, we want to just pick
        // the tender for the one payment option.
        var singleTenderType = type;
        if (!singleTenderType) {
            console.log("ERROR IN PAYMENT: Expected the single tender to be set.");
        } else {
            self._debug("Creating tender for type " + type);
            self.createSelectedTender(singleTenderType);
        }

        // Show the control buttons too.
        self._updateControlButtons();
    };

    // Called when there are more than one payment options.
    self._multiplePaymentOptions = function () {
        self._debug("multiple payment options detected - showing select payment screen");
        // When there are multiple payment options, the user needs to select which one.
        self._gotoSelectPayment();

        // Show the control buttons too.
        self._updateControlButtons();
    };

    // Show the processing popup.
    self.showProcessingPopup = function (message, callback) {
        self._debug("showing processing popup");
        var processingPopup = $.extend(true, {}, _nex.assets.popupManager.processingPopup);
        processingPopup.message = message ? message : "Processing ...";
        _nex.assets.popupManager.showPopup(processingPopup, callback);
    };

    // Hide the processing popup.
    self.hideProcessingPopup = function (callback) {
        self._debug("hiding processing popup");
        _nex.assets.popupManager.hidePopup(_nex.assets.popupManager.processingPopup, callback);
    };


    // Show the select tender popup
    self.showSelectTenderPopup = function (message, callback) {
        self._debug("showing select tender popup");
        var popup = $.extend(true, {}, _nex.assets.popupManager.messagePopup);
        popup.message = message ? message : "Processing ...";
        _nex.assets.popupManager.showPopup(popup, callback);
    };

    // Hide the add tender popup
    self.hideSelectTenderPopup = function (callback) {
        self._debug("hiding select tender popup");
        _nex.assets.popupManager.hidePopup(_nex.assets.popupManager.messagePopup, callback);
    };

    // Send the command to set the selected tender.
	self.createSelectedTender = function(type)
	{
		var tenderType;

		// If this a Guest Account Inclining Balance Generic Tender Account, then get the associated generic tender...
		if(type.startsWith("gaincliningbalancetender"))
		{
			var guestAccountLocal = _nex.guestAccount.getGuestAccountLocalByPaymentClipTenderType(type);

			tenderType = guestAccountLocal.genericTenderId;
		}
		else
		{
			tenderType = type;
		}

        // Set last selected tender.
        self.lastSelectedTender = type;

        // Send TENDERADDED. This does not put it on the tender stack, just sets the selected tender.
        console.log("Sending request to add tender with type " + type);
		var requestObject = new _nex.commands.AddTender(tenderType);
        _nex.communication.send(requestObject, self._tenderAdded, "TENDERADDED");
    };

    // Send the process order command. Optionally pass in a final tender to process.
	self.processOrder = function (finalTender) {
	    self.stop();
        self.showProcessingPopup(self.textProcessingPayment());
        var requestObject = new _nex.commands.ProcessOrder(_nex.ordering.orderManager.currentOrder, finalTender);
        _nex.communication.send(requestObject, self.orderProcessed, "ORDERPROCESSED");
    };

    // Remove a selected tender.
    self._removeSelectedTender = function () {
        // If a selected tender has been set, the way to remove it is to use the REMOVETENDER command.
        // This must be done when the user hits back, for example.
        var requestObject = new _nex.commands.RemoveTender(self.lastSelectedTender);
        _nex.communication.send(requestObject, self._tenderRemoved, "TENDERREMOVED");
    };

    // Callback after a tender is added.
	self._tenderAdded = function(result)
	{
        self._debug("Tender has been added");
        self._debug(result);
        if (result.responseReceived === "true") {
            self._paymentManager.gotoClip(self.lastSelectedTender);
        } else {
            throw "ERROR: MISSING CLIP FOR TENDER " + self.lastSelectedTender;
        }
    };

    // Callback after a tender is removed.
    self._tenderRemoved = function () {
        // TODO: Find out what we do if the tender fails to remove.
        self._debug("Tender removed callback");
    };

    // Check which tenders are available.
    self._getAvailableTenders = function () {
        // Default the result to an empty array.
        var result = [];

        // Use this helper method in the theme to get the tendersAvailable.
        // This uses the paymentProfile, which is updated from the UPDATEKIOSK command.
        var lastUpdateTenders = self._theme.tendersAvailable();
        if (lastUpdateTenders) {
            result = lastUpdateTenders;
        }

        // Return the result.
        self._debug("GET AVAILABLE TENDERS:");
        self._debug(result);
        return result;
    };

    // Return various kiosk text messages for this phase.
    self.textSwipe = function () {
        return self._theme.getTextAttribute("PAYMENT", "swipe", "Please Swipe Your Credit Card");
    };
    self.textSwipeError = function () {
        return self._theme.getTextAttribute("PAYMENT", "swipeerror", "There was a problem reading your card, please swipe again");
    };
    self.textProcessingPayment = function () {
        return self._theme.getTextAttribute("PAYMENT", "processingpayment", "Your Payment Is Being Processed");
    };
    self.textProcessingError = function () {
        return self._theme.getTextAttribute("PAYMENT", "processingerror", "Sorry.  Payment could not be processed.");
    };
    self.textCash = function () {
        return self._theme.getTextAttribute("PAYMENT", "cashtext", "CASH");
    };
    self.textCredit = function () {
        return self._theme.getTextAttribute("PAYMENT", "credittext", "CREDIT");
    };
    self.textDebit = function () {
        return self._theme.getTextAttribute("PAYMENT", "debittext", "DEBIT");
    };
    self.textPaymentType = function () {
        return self._theme.getTextAttribute("PAYMENT", "paymenttype", "Select a Payment Type");
    };
    self.textProcessingOrder = function () {
        return self._theme.getTextAttribute("PAYMENT", "processingorder", "Calculating Total");
    };
    self.textCounter = function () {
        return self._theme.getTextAttribute("PAYMENT", "countertext", "COUNTER"); // sometimes is cash
    };
    self.textCoupon = function () {
        return self._theme.getTextAttribute("PAYMENT", "coupontext", "COUPON");
    };
    self.textLoyalty = function () {
        return self._theme.getTextAttribute("PAYMENT", "loyaltytext", "GUEST EXPRESS");
    };
    self.textCalculateTotalError = function () {
        return self._theme.getTextAttribute("PAYMENT", "calculatetotalerror", "Error processing order");
    };
    self.textPaymentDeviceSwipe = function () {
        return self._theme.getTextAttribute("PAYMENT", "waitforpayment", "Swipe Card On The Payment Device");
    };
    self.textBalanceMessage = function () {
        return self._theme.getTextAttribute("PAYMENT", "amountauthorized", "Balance applied");
    };
    // Handle the response from payment
    self.handlePaymentResponse = function (msg) {
        // When payment devices process a payment, they come back with a payment response.
        self._debug("handlePaymentResponse");

        // Log a debug message for troubleshooting.
        self._debug("Response message: ");
        self._debug(msg);

        // Failure case ...
        if (msg.paymentstatus === "Failure") {
            // This indicates something went wrong with the payment device.
            // For example, the user didn't swipe in time.
            // Show an error to the user so they know something went wrong with the payment device.
            var messageText = self._theme.getTextAttribute("PAYMENT", "processingerror", "Sorry, your payment could not be processed.");

            _nex.payment.showErrorPopup(messageText, function () {

                // Following along with the Visio diagram for this project, change the flow of control.
                // There are 3 exit points.
                var numTenders = _nex.payment._getAvailableTenders().length;
                if (numTenders === 1) {
                    // Go to ordering phase
                    self._debug("Going back to the ordering phase ...");
                    self._gotoOrderReview();
                } else if (numTenders > 1) {
                    // Go to select payment
                    self._debug("Going back to the start of payment, which will bring us to select payment ...");
                    self.start();
                }
            });
        } else {
            // Payment was a success - calling process order (all payments are final currently).
            _nex.payment.processOrder();
        }
    };

    // Handly a loyalty process response. Similar to payment response, but for loyalty.
    self.handleLoyaltyResponse = function (response, tender) {
        self._debug("Handling response: ");
        self._debug(response);

        // Update the order.
        if (response.ORDER) {
            _nex.orderManager.currentOrder.update(response.ORDER);
        }

        // If enough has been collected.
        if (response.message === "ENOUGH_COLLECTED") {
            console.log("Payment: Enough has been collected... Going to process order.");
            self.processOrder();
        } else {
            // Let the user know what happened
            var amount = response.amount ? response.amount : 0.0;
            var remainingBalance = _nex.orderManager.currentOrder.totals.remainingbalance();

            var text = self.textBalanceMessage();
            text.replace("{0}", amount);
            text.replace("{1}", remainingBalance);
            if (tender._hasOffers) {
                tender._offersPopup(self._route, tender._availableOffers);
            } else {
                self._showBalanceMessage(self._route, text);
            }

            // Hide the back button now that a tender has been applied.
            self._hideBackButton();
        }
    };

    // Process a loyalty card, QR code, etc.. Called from the loyalty payment clip.
    // Device data should be a string and pindata should be some type of authentication if
    // authentication was required.
    self.loyaltyInquiry = function (pindata) {
        self._debug("processLoyalty");
        var carddata = "";
        var userdata = "";
        var cardtype = "LOYALTY";
        var track1 = "";
        var track2 = "";

        if (typeof self.deviceData === "string") {
            carddata = self.deviceData; // string for things like QR codes.
        } else if (typeof self.deviceData === "object") {
            carddata = self.deviceData.cardNumber; // object for cards.
        }

        if (pindata) {
            userdata = pindata;
        }

        // Get at the track data.
        if (self.deviceData.track1) {
            track1 = self.deviceData.track1;
        }
        if (self.deviceData.track2) {
            track2 = self.deviceData.track2;
        }

        // Get at the card type.
        if (track1 || track2) {
            var cardParser = new CardParser(_nex.assets.theme);
            cardParser.parse(track1, track2, function (data) {
                if (data) {
                    cardtype = data.cardType;
                }
            });
        }

        var tenderConfig = _nex.assets.theme.getTenderByType("loyalty");
        var preauthandpay = _nex.assets.theme.isPreAuthAndPay(tenderConfig);

        self._sendLoyaltyInquiry(carddata, userdata, cardtype, track1, track2, preauthandpay);
    };

    // Called if the employee inquiry fails for the card swiped or pin.
    self.showEmployeeCardError = function (callback) {
        var message = _nex.payment.textProcessingError();
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
        popup.message = message;
        _nex.assets.popupManager.showPopup(popup, callback);
    };

    // Send the loyalty inquiry.
    self._sendLoyaltyInquiry = function (cardnumber, userdata, cardtype, track1, track2, preauthandpay) {

        var command = new _nex.commands.LoyaltyInquiry(cardnumber, userdata, cardtype, track1, track2, preauthandpay);

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
                // if the guest has been charged (preAuthAndPay)
                if (loyaltyTender.isCharged()) {
                    // Make sure client and server have the tender information in sync.
                    self._updateTender(function () {
                        // Process the loyalty tender.
                        self._processLoyalty(loyaltyTender, loyaltyTender.value);
                    });
                } else if (loyaltyTender.hasMultipleValues()) {
                    // Multiple values should only be on if preAuthAndPay is off.
                    self._multipleOptions();
                } else if (loyaltyTender.hasBalance()) {
                    // (preauth case)
                    // Try to charge the remaining balance on the card.
                    var tenderConfig = _nex.assets.theme.getTenderByType("loyalty");
                    var amountToCharge = self._getAmountToCharge(loyaltyTender, tenderConfig);
                    if (amountToCharge > 0) {
                        self._processLoyalty(loyaltyTender, amountToCharge);
                    } else {
                        self._debug("There is $0.00 to be charged. Could be from rounding if usefullamount is turned off.");
                        self._genericError(self.reset);
                    }
                    //default for if using offers but nothing returned by inquiry
                } else if (loyaltyTender._noOffersReturnedFromInquiry)
                {
                    loyaltyTender._offersPopup(self._route, loyaltyTender._availableOffers);
                }
                else {
                    self._debug("No multiple values and no balance on the card");
                    self._genericError(self.reset);
                }
            } else {
                self._debug("Invalid account");
                self._genericError(self.reset);
            }
        }, "LOYALTYRESPONSE");
    };

    // Called if there are multiple values on the loyalty card...
    // which means the user can select from a screen of what to do next.
    // This is custom logic per customer.
    self._multipleOptions = function () {
        _nex.assets.theme.loadMedia("customloyalty.html", null, "customloyalty.js");
    };

    // Return the amount to charge.
    self._getAmountToCharge = function (tender, tenderConfig) {
        // Default to the remaining balance on the card.
        var result = tender.remainingBalance();

        // If we aren't using the full amount... Go down to the nearest dollar.
        // Used for cases where they only have whole bills to give for change.
        var useFullAmount = _nex.assets.theme.useFullAmount(tenderConfig);
        if (!useFullAmount) {
            result = Math.floor(result);
        }
        return result;
    };

    // Complete the loyalty flow.
    self._processLoyalty = function (tender, amount) {
        // End of the Visio process.
        // Add the tender to the tender stack.
        var command = new _nex.commands.ProcessLoyalty(tender, amount);
        _nex.communication.send(command, function (response) {
            // Have the payment phase decide where to route the user next based on the response.
            // If things are paid in full, it should go to the next phase.
            // If not, it should go back to selecting payment.
            self.handleLoyaltyResponse(response, tender);
        }, "PROCESSLOYALTYRESPONSE");
    };

    self.processEmployeeCard = function (track2) {
        var employeeNumber = track2.replace(/[^0-9]/g, ''); // strip out non-digits from track 2
        var employeePin = _nex.keyboard.numpad.data;
        var cmd = new _nex.commands.EmployeeInquiry(employeeNumber, employeePin);
        _nex.communication.send(cmd, function (response) {
            if (response && response.status && response.status.toLowerCase() === "success") {
                // Process as a final tender for now.
                console.debug(response);
                var employeeTender = new TenderEmployee();
                employeeTender.updateNumber(response.number);
                employeeTender.updatePin(response.pin);
                _nex.payment.processOrder(employeeTender);
            } else {
                self.showEmployeeCardError(_nex.payment.start);
            }
        }, "EMPLOYEERESPONSE");
    };

    // Show a generic error message.
    self._genericError = function (callback) {
        var message = _nex.payment.textProcessingError();
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
        popup.message = message;
        _nex.assets.popupManager.showPopup(popup, callback);
    };

    // Show a error popup message.
    self._showErrorMessage = function (callback, message) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
        popup.message = message;
        _nex.assets.popupManager.showPopup(popup, callback);
    };

    // Show a balance message.
    self._showBalanceMessage = function (callback, message) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.messagePopup);
        popup.message = message;
        _nex.assets.popupManager.showPopup(popup, callback);
    };

        // Update the selected tender to reflect that it has been paid.
    self._updateTender = function (callback) {
        var command = new _nex.commands.UpdateTender(true);
        _nex.communication.send(command, function (response) {
            // Update the current order object.
            _nex.orderManager.currentOrder.update(response.ORDER);

            if (callback) {
                callback();
            }

        }, "UPDATETENDERRESPONSE");
    };



    //GENERIC TENDER methods...
    // Process a generic tender account. Called from the genericpaymentclip.
	self.genericInquiry = function (pindata, guestAccountLocalTypeId, paymentTypeId, accountNumber) {
        self._debug("genericInquiry");
        var pin = "";

		//accountNumber is already populated if this request is sent from a Guest Account Inclining Balance Generic Tender Account, otherwise get the accountNumber from a device...
        if(accountNumber === undefined)
        {
            if(typeof self.deviceData === "string")
            {
                accountNumber = self.deviceData; // string for things like QR codes.
            }
            else if(typeof self.deviceData === "object" && self.deviceData !== null)
            {
                if (self.deviceData.cardNumber) {
                    accountNumber = self.deviceData.cardNumber; // object for cards.
                }
                else {
                    var track1 = "";
                    var track2 = "";

                    if (self.deviceData.track1) {
                        track1 = self.deviceData.track1;
                    }
                    if (self.deviceData.track2) {
                        track2 = self.deviceData.track2;
                    }

                    // Get at the card type.
                    if (track1 || track2) {
                        var cardParser = new CardParser(_nex.assets.theme);
                        cardParser.parse(track1, track2, function (data) {
                            if (data) {
                                cardtype = data.cardType;
                                accountNumber = data.cardNumber;
                            }
                        });
                    }

                }
            }
        }

        if (pindata) {
            pin = pindata;
        }

        self._sendGenericInquiry(accountNumber, pin, paymentTypeId, guestAccountLocalTypeId);
    };


    // Send the generic inquiry and handle the response
	self._sendGenericInquiry = function(accountNumber, pin, paymentTypeId, guestAccountLocalTypeId)
	{
		//alert("account number: " + accountNumber + " (pin: " + pin + ")\npayment type id: " + paymentTypeId + "\nguest account local type id: " + guestAccountLocalTypeId);

        var command = new _nex.commands.GenericInquiry(accountNumber, pin, paymentTypeId, guestAccountLocalTypeId);
        self.showTenderProcessingMessage();

        _nex.communication.send(command, function (response) {
            self._debug("generic inquiry response", response);
            self.hideProcessingPopup(function () {
                // Put this data on the loyalty tender.
                var genericTender = new TenderGeneric(paymentTypeId, accountNumber, pin);
                genericTender.update(response);

                var genericMessageAttr = genericTender._tenderType;

                // If it is a valid account....
                if (genericTender.isValidAccount()) {

                    var message = self._theme.getTextAttribute("PAYMENT", "nobalance" + genericMessageAttr, "No available balance. Select a different method of payment.");

                    if (genericTender.hasBalance()) {
                        // Try to charge the remaining balance on the card.
                        var tenderConfig = _nex.assets.theme.getGenericTenderByType(genericTender._tenderType);
                        var amountToCharge = self._getAmountToCharge(genericTender, tenderConfig);
                        if (amountToCharge > 0) {
                            self._processTender(genericTender, amountToCharge);
                        } else {
                            self._debug("There is $0.00 to be charged. Could be from rounding if usefullamount is turned off.");
                            self._showErrorMessage(self.reset, message);
                        }
                    } else {
                        self._debug("No balance on the account");
                        self._showErrorMessage(self.reset, message);
                    }
                } else {
                    self._debug("Invalid account");
                    self._genericError(self.reset);
                }
            });
        }, "GENERICINQUIRYRESPONSE");
    };

    // Complete the tender flow by telling the TM to push the tender onto the tender stack.
    self._processTender = function (tender, amount) {
        // End of the Visio process.
        // Add the tender to the tender stack.
        var command = new _nex.commands.ProcessTender(tender, amount);
        _nex.communication.send(command, function (response) {
            // Have the payment phase decide where to route the user next based on the response.
            // If things are paid in full, it should go to the next phase.
            // If not, it should go back to selecting payment.
            self.handleTenderResponse(response);
        }, "PROCESSTENDERRESPONSE");
    };

    // Handle a tender process response... at this point the tender on the TM has been pushed to the tender stack
    self.handleTenderResponse = function (response) {
        self._debug("Handling PROCESSTENDERRESPONSE response: ");
        self._debug(response);

        // Update the order.
        _nex.orderManager.currentOrder.update(response.ORDER);

        // If enough has been collected.
        if (response.message === "ENOUGH_COLLECTED") {
            self.processOrder();
        } else {

            // Let the user know what happened
            var amount = response.amount ? response.amount : 0.0;
            var remainingBalance = _nex.orderManager.currentOrder.totals.remainingbalance();

            var text = self.textBalanceMessage();
            text.replace("{0}", amount);
            text.replace("{1}", remainingBalance);
            self._showBalanceMessage(self._route, text);

            // Hide the back button now that a tender has been applied.
            self._hideBackButton();
        }
    };

    self.showTenderProcessingMessage = function () {
        var message = _nex.assets.theme.getTextAttribute("PAYMENT", "preauthmessage", "Authorizing...");
        self.showProcessingPopup(message);
    };

    self.couponInquiry = function (data) {
        self._debug("couponInquiry");
        var coupondata = "";
        var userdata = "";
        var tendertype = "COUPON";
        var track1 = "";
        var track2 = "";

        if (typeof self.deviceData === "string") {
            coupondata = self.deviceData; // string for things like QR codes.
        } else if (typeof self.deviceData === "object") {
            coupondata = self.deviceData.barcode; // object for coupons.
        }

        self._sendCouponInquiry(coupondata);
    };

    // Send the coupon inquiry.
    self._sendCouponInquiry = function (couponnumber) {
        self.showTenderProcessingMessage();

        _nex.communication.send(new _nex.commands.CouponInquiry(couponnumber), function (response) {
            self._debug("coupon inquiry response", response);
            self.hideProcessingPopup();

            // Put this data on the coupon tender.
            var couponTender = new TenderCoupon(couponnumber);
            couponTender.update(response);

            self._debug(response);

            // If it is a valid account....
            if (couponTender.isValidAccount()) {
                var deductionAmount = couponTender.deductionAmount(_nex.orderManager.currentOrder.totals.subtotal());
                if (deductionAmount > 0.0) {
                    self._processTender(couponTender, deductionAmount);
                } else {
                    self._debug("There is $0.00 to be deducted. Coupon amount could be invalid.");
                    self._genericError(self.reset);
                }
            } else {
                self._debug("Invalid account");
                self._genericError(self.reset);
            }

        }, "COUPONRESPONSE");

    };

    // Register custom logic to be executed once the select payment clip comes up.
    self.registerCallback = function (clipid, callback) {
        if (!self._paymentManager) {
            self._paymentManager = new PaymentManager();
        }
        self._paymentManager.registerCallback(clipid, callback);
    };
}