// Shows the complete screen.
// Brings the user back to the splash screen if they click ok, or 10 seconds goes by.
function Complete(completeParams) {

    var self = this;
    self.timer = null;

    self.debugEnabled = false;
    self.debug = function () {
        if (self.debugEnabled) {
            console.debug("Complete phase", arguments);
        }
    };

    self.orderIsDriveThruOrder = function () {
        return _nex.manager.theme.kiosk.PAYMENTPROFILE.ORDERTYPE.hasOwnProperty("drivethruflag") && _nex.manager.theme.kiosk.PAYMENTPROFILE.ORDERTYPE.drivethruflag === "true";
    };

    self.startTimer = function () {
        if (self.timer) {
            self.timer.stop();
            self.timer = null;
        }
        self.timer = new TimeoutTimer(this, this.gotoSplash, 10);
        self.timer.start();
    };
    
    self.stopTimer = function () {
        if (self.timer) {
            self.timer.stop();
            self.timer = null;
        }
    };

    self.start = function () {
        self.debug("Starting complete phase");
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.COMPLETE);
        _nex.communication.send(new _nex.commands.ProcessPrint(_nex.orderManager.currentOrder));

        self.startTimer();

        var completeScreen = $('#complete');
        if (completeScreen.length > 0) {

            var hitArea = $("#complete-hitarea");
            if (hitArea.length > 0) {
                hitArea.unbind("click");
                hitArea.click(function () {
                    self.debug("complete hitarea clicked");
                    self._completeClicked(hitArea);
                });
            }

            var orderNumber = _nex.ordering.order.ordernumber;
            var orderNumberMaxLength = (_nex.assets.theme.system.hasOwnProperty("ordernumberlength") && (_nex.assets.theme.system.ordernumberlength.toString().length > 0)) ? Number(_nex.assets.theme.system.ordernumberlength.toString()) : 2;
            var orderNumberLength = _nex.ordering.order.ordernumber.length;

            if (orderNumberLength > orderNumberMaxLength) {
                orderNumber = _nex.ordering.order.ordernumber.substr(orderNumberLength - orderNumberMaxLength, orderNumberMaxLength);
            }
            var attributetype = "COMPLETE";
            if (self.orderIsDriveThruOrder()) {
                attributetype = "DTCOMPLETE";
            }
            $("#ordernumbermessage").empty();
            $("#ordernumbermessage").append(_nex.assets.theme.getTextAttribute(attributetype, "ordernumber", "Your Order Number Is"));

            $("#ordernumber").empty();
            $("#ordernumber").append(orderNumber || "00");
            

            // set the message text based on the final tender
            var finalTenderType = (_nex.orderManager.currentOrder.tenderResults.length > 0) ? _nex.orderManager.currentOrder.tenderResults[_nex.orderManager.currentOrder.tenderResults.length - 1].tendertype : "";
            var tenderMessage = self._getTenderMessage(finalTenderType);

            var completeMessage = $("#completemessage");
            if (completeMessage.length > 0) {

                // determine the tender id of the final tender
                //not a bug, but a really interesting approach!  This just points at the ATTRIBUTE of "COMPLETE" so IE complete element,  "paymentmessage" attrib -Trey
                var tenderText = (tenderMessage !== null) ? tenderMessage.dineintext : "paymentmessage";

                var defaultText = "Pick Up Your Order When Your Number Is Called";

                if (finalTenderType.length === 0) {
                    tenderText = "localmessage";
                    tenderMessage = "WILL BE READY IN APPROXIMATELY";
                }
                else  if ((_nex.orderManager.currentOrder.togo) &&
                            (tenderMessage !== null)) {
                    tenderText = tenderMessage.togotext;
                    defaultText = "Please Take Your Receipt To The Cashier For Payment";
                }

                completeMessage.empty();
                attributetype = "COMPLETE";
                if (self.orderIsDriveThruOrder()) {
                    attributetype = "DTCOMPLETE";
                }
     
                completeMessage.append(_nex.assets.theme.getTextAttribute(attributetype, tenderText, defaultText));
                if (self.orderIsDriveThruOrder) completeMessage.append(_nex.assets.theme.getTextAttribute(attributetype, "drivethruendtext", ""));
                //TODO: Make a new message that does not say to get the receipt when there is none! -Trey
            }

            // play the voice over based on the final tender
            if(tenderMessage !== null) {
                var mp3 = tenderMessage.dineinvoiceover;
                if (_nex.orderManager.currentOrder.togo) {
                    mp3 = tenderMessage.togovoiceover;
                }
                _nex.assets.soundManager._playMP3(mp3);
            }
        }
    };

    self.stop = function () {
        self.stopTimer();
    };

    self._getTenderMessage = function (tenderType) {

        var tenderMessage = null;
        try {
            var phaseClips = _nex.assets.phaseManager.findPhaseClips(_nex.assets.phaseManager.phaseType.COMPLETE);

            for (var i = 0; (i < phaseClips.length) && (tenderMessage === null); i++) {
                if (phaseClips[i].hasOwnProperty("TENDER")) {
                    for (var t = 0; (t < phaseClips[i].TENDER.length) && (tenderMessage === null) ; t++) {
                        if (phaseClips[i].TENDER[t].id === tenderType) {
                            tenderMessage = phaseClips[i].TENDER[t];
                        }
                    }
                }
            }
        } catch (err) {
            console.log(err);
        }

        return tenderMessage;
    };

    self.gotoSplash = function () {
        self.debug("Leaving complete phase... Going to splash. Should stop the timer.");
        self.timer.stop();

        // If we are in the previewer, shortcut back tot eh splash screen.
        if (inPreviewer()) {
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.SPLASH, function () {
                // clean up
                self.timer = null;
            });
            return;
        }

        // Send the order usage command.
        _nex.communication.send(new _nex.commands.OrderUsage());

        // Reset button tracking.
        _nex.utility.buttonTracking.reset();

        _nex.ordering.resetOrder(function () {
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.SPLASH, function () {
                // clean up
                self.timer = null;
            });
        });

    };

    // Helper method common to all complete buttons being clicked.
    self._trackCompleteClick = function ($button) {
        // The Flash seemed to only track the Save Previous Order button. We are starting with this, but adding tracking for anytime
        // the user clicks the complete screen. If they don't click it, it will timeout, and the click won't be captured.
        // Flash:
        // ButtonTracker.Track("", "Save Previous Order", PhaseManager.CurrentPhase.PhaseId,  "", "Complete Order", 1, this);

        var COMPLETE_BUTTON_ID = ""; // Only one button currently.
        var COMPLETE_BUTTON_CONTEXT = "Complete order";
        var COMPLETE_BUTTON_TYPE = "complete"; // Will be translated to 1
        var MENU_ID = ""; // Menu id is not applicable.
        _nex.utility.buttonTracking.track(COMPLETE_BUTTON_ID, $button.text(), MENU_ID, COMPLETE_BUTTON_CONTEXT, COMPLETE_BUTTON_TYPE);
    };

    self._completeClicked = function ($button) {
        _nex.assets.soundManager.playButtonHit();
        self._trackCompleteClick($button);
        _nex.complete.gotoSplash();
    };

}