// RepeatOrders phase (used to be called PreviousOrders).
function RepeatOrderPhase() {
    var self = this;

    // Optional debugging.
    self.debugEnabled = false;
    self.debug = function () {
        if (self.debugEnabled) {
            console.debug("RepeatOrderPhase", arguments);
        }
    };

    // Easy reset of all variables.
    self.reset = function () {
        // reset any local variables.

        // hide the phase
        self.hide();
    };


    // Entry point.
    self.start = function () {
        var repeatOrderPrompt = new RepeatOrderPrompt(self, self.theme, self.soundManager, self.popupManager);
        repeatOrderPrompt.updateUI();
        self.show();
    };

    // Exit point.
    self.stop = function () {
        self.reset();
    };

    // Hide the clip.
    self.hide = function () {
        // Hide the content of this clip.
        $("#repeatOrderphase").hide();
    };

    // Show the clip.
    self.show = function () {
        $("#repeatOrderphase").show();
    };

    // Returns the button list from the htmltheme.xml (if available);
    // otherwise, some defaults.
    self.getButtonList = function (isPostOrdering) {
        var buttonList = [];
        buttonList.push({ "type": "phone" });
        buttonList.push({ "type": "face" });
        buttonList.push({ "type": "credit" });
        buttonList.push({ "type": "cancel" });
        //<OPTION type="phone"  buttontextattribute="lookupphonebutton" popuptextattribute="lookupphonemessage" />
        //<OPTION type="face"  buttontextattribute="lookupfacebutton" popuptextattribute="lookupfacemessage" />
        //<OPTION type="credit"  buttontextattribute="lookupcreditbutton" popuptextattribute="lookupcreditmessage" />
        //<OPTION type="cancel" buttontextattribute="fullmenubutton" popuptextattribute="" />
        var theme = _nex.assets.theme.lastUpdate.THEMES.THEME;
        var phases = theme.PHASE;
        for (var phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
            // We want to look at the options setup in previous orders or post ordering phase depending on where we are at in the process.
            var phaseId = "previousorders";
            if (isPostOrdering) {
                phaseId = "postordering";
            }
            var phase = phases[phaseIndex];
            if (phase.id == phaseId) {
                var clips = phase.CLIP;
                for (var clipIndex = 0; clipIndex < clips.length; clipIndex++) {
                    var clip = clips[clipIndex];
                    if (clip.hasOwnProperty("OPTION")) {
                        buttonList = clip.OPTION;
                        return buttonList;
                    }
                }
            } 
        }

        self.debug(".getButtonList", buttonList);
        return buttonList;
    };

    // Returns the repeat order element from the payment profile (if available);
    // otherwise, some defualts.
    self.getRepeatOrderElement = function () {
        var element = null;
        if (_nex.assets.theme.kiosk.PAYMENTPROFILE.REPEATORDERS) {
            element = _nex.assets.theme.kiosk.PAYMENTPROFILE.REPEATORDERS;
        } else {
            element = {
                "phone": "true",
                "face": "false",
                "credit": "true",
                "cancel": "true"
            };
        }
        return element;
    };

    self.showLookupOptions = function (postOrdering) {
        var lookupButtonContainer = $("#lookupContainer");
        var cancelText = "Cancel";
        var optionMessage = "Option message";
        var buttonList = self.getButtonList(postOrdering);

        var repeatOrderOptions = new RepeatOrderOptions(postOrdering || false);
        repeatOrderOptions.init(lookupButtonContainer, cancelText, optionMessage, buttonList);
        repeatOrderOptions.bindButtons();
        repeatOrderOptions.show();

    };

    // Go to ordering. Optionally pass in an existing order to start ordering with.
    self.gotoOrdering = function (order) {
        // If we have a previous order that was selected ...
        if (order) {
            self._gotoOrderingWithOrder(order);
        } else {
            self._gotoOrderingWithoutOrder();
        }
    };

    // Go to ordering without an order.
    self._gotoOrderingWithoutOrder = function () {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function () {
            _nex.ordering.start();
        });
    };

    // Go to ordering with a previous order.
    self._gotoOrderingWithOrder = function (order) {

        // Show a popup to let the user know we are doing a round trip.
        self._popupProcessing();

        // Build and send the request object.
        var requestObject = new _nex.commands.LoadOrder(order);
        _nex.communication.send(requestObject, function (result) {

            // Once the response is received, hide the popup.
            self._popupProcessingHide();

            // Update the ordering object.
            _nex.orderManager.currentOrder.update(result.ORDER);

            // Change phases to the ordering phase; go to order review.
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function () {
                _nex.ordering.start();
                _nex.ordering.gotoOrderReview();
            });
        }, "LOADORDERRESPONSE");
    };

    // The processing popup. Optional parameters message and callback.
    self._popupProcessing = function (message, callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.processingPopup);
        popup.message = message ? message : _nex.assets.theme.getTextAttribute("PREVIOUSORDERS", "processing", "Processing ...");
        _nex.assets.popupManager.showPopup(popup, function () {
            if (callback) {
                callback();
            }
        });
    };


    // Hide processing popup.
    self._popupProcessingHide = function (callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.processingPopup);
        _nex.assets.popupManager.hidePopup(popup, function () {
            if (callback) {
                callback();
            }
        });
    };

    self.gotoSplash = function () {
        //alert('going to splash');
    };

}