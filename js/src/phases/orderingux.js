/**
 * OrderingUX extends the common ordering phase with UX specific methods.
 * @constructor
 */
function OrderingUX(orderingParams) {
    var self = this;
    Ordering.call(self, orderingParams);

    self.currentPopover = null;
    self.isOrderReview = false;
    self._nudgeTimer = null;

    // Note: Other properties are in the common ordering class.

    // There is a start in UX and NEXTEP Mobile. It is different in UX though.
    self.start = function (tagName) {
        self.startMenu = 1;
        $("#ordering #controlbuttons").hide();
        // send kiosk status
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.ORDERING);

        if (self.addToOrderResponseListener) {
            _nex.communication.removeListener(self.addToOrderResponseListener);
        }
        self.addToOrderResponseListener = _nex.communication.createListener("ADDTOORDERRESPONSE", self.commandReceived);
        _nex.communication.addListener(self.addToOrderResponseListener);

        if (self.removeFromOrderResponseListener) {
            _nex.communication.removeListener(self.removeFromOrderResponseListener);
        }
        self.removeFromOrderResponseListener = _nex.communication.createListener("REMOVEFROMORDERRESPONSE", self.commandReceived);
        _nex.communication.addListener(self.removeFromOrderResponseListener);


        self.order = self.orderManager.currentOrder;
        self.menus = $.extend(true, [], self.theme.menus);

        // If a specific menu tag was not specified, load the start menu;
        // otherise, jump to the menu specified.
        if (!tagName) {
            self.loadMenu();
        } else {
            var menuId = self.findMenuByTag(tagName);
            self.loadMenu(menuId);
        }

        self.updateControlButtons();
        $("#ordering #controlbuttons").show();
    };

    // Stop is particular to UX.
    self.stop = function () {
        // Say we stop the phase early because we are going offline, for example.
        // Make sure we stop listening.
        if (self.addToOrderResponseListener !== null) {
            _nex.communication.removeListener(self.addToOrderResponseListener);
        }
        if (self.removeFromOrderResponseListener !== null) {
            _nex.communication.removeListener(self.removeFromOrderResponseListener);
        }
    };

    // Only in UX
    // Returns true if the string or number is numeric.
    function isNumeric(num) {
        // One way check if a variable (including a string) is a number, is to check check if it is not NaN.
        return !isNaN(num);
    }

    // Only in UX
    self.commandReceived = function (commandName, result) {
        if (commandName === "ADDTOORDERRESPONSE" || commandName === "REMOVEFROMORDERRESPONSE") {
            self.pending = false;
            // var result = (typeof data === "string") ? JSON.parse(data) : data; // TODO - update NEXTEP Mobile to pass in the parsed result
            if (result.responseReceived === "true") {

                self.order.update(result.ORDER);

                if (commandName === "REMOVEFROMORDERRESPONSE") {
                    // remove from the menu stack
                    for (var i = 0; i < self.posidsRemoved.length; i++) {
                        self.menustack[self.menustack.length - 1].removePosid(self.posidsRemoved[i]);
                    }
                }

                if (self.orderUpdated) {
                    self.orderUpdated();
                }

                self.updateReceipt();
            }

        } else {
            console.log("ordering.commandReceived - Unexpected command: " + commandName);
        }

    };

    // Only in UX
    self.trackClick = function (buttonName, buttonText) {
        // The button name can be split to extract out the button index.
        var buttonIndex = "";
        if (buttonName) {
            var buttonNameParts = buttonName.split('-');

            if (buttonNameParts.length >= 3) {
                buttonIndex = Number(buttonNameParts[2]);
                if (isNumeric(buttonIndex)) {
                    // Following along with the Flash, add one to the button index.
                    buttonIndex = buttonIndex + 1;
                } else {
                    buttonIndex = "";
                }
                //console.debug("setting button index to " + buttonIndex);
            }
        } else {
            console.debug("Unable to get info for button " + buttonName);
        }
        var currentMenuId = self.currentMenuId; // equivalent to self.currentMenu.id
        var menuContext = self.currentMenu.title;
        var BUTTON_TYPE = "menu"; // will be translated to 0
        _nex.utility.buttonTracking.track(buttonIndex, buttonText, currentMenuId, menuContext, BUTTON_TYPE);
    };

    // Helper function to get a price override.
    self.getPrice = function () {
        // Overwrite this method outside of here to allow custom price overrides.
        return "";
    };

    // Changed for UX vs NEXTEP Mobile
    self.addToOrder = function (posid, priceLevel, buttonName, nextMenu, callback, isscanned) {
        // send ADDTOORDER to the server
        if (!self.pending) {
            self.pending = true; // prevent multiple clicks
            var pricedBy = _nex.assets.templateManager.templatePricedBy(self.currentMenu.template);
            var buttonInfo = self.getButtonInfo(buttonName);
            var priceOverride = _nex.assets.templateManager.getPriceOverride(self.currentMenu.template, posid);

            _nex.communication.send(new _nex.commands.AddToOrder(posid, priceLevel, "1", self.currentMenuId, (self.menustack.length - 1), self.currentMenu.upsell, pricedBy, buttonInfo, isscanned, priceOverride), function (result) {
                self.pending = false;
                // var result = (typeof data === "string") ? JSON.parse(data) : data; // TODO - update NEXTEP Mobile to pass in the parsed result
                if (result.responseReceived === "true") {

                    if (result.added !== "true") {
                        self.menustack[self.menustack.length - 1].removePosid(posid);
                    } else {
                        // add the posid to the menustack so it can be removed when the back button is pressed
                        self.menustack[self.menustack.length - 1].posids.push(posid);
                    }

                    if (self.orderUpdated !== undefined) {
                        self.orderUpdated();
                    }

                    if (nextMenu !== undefined) {
                        self.loadMenu(nextMenu);
                    }
                }

                if (callback !== undefined) {
                    callback(result);
                }
            }, "ADDTOORDERRESPONSE");
        }
    };

    // Go into the previousOrders phase. If previousOrders aren't configured, it will skip ahead to the ordering phase.
    self.gotoPreviousOrders = function () {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PREVIOUS_ORDERS, function () {
            _nex.previousOrders.start();
        });
    };

    // Go from the ordering phase to the payment phase.
    self.gotoPayment = function () {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PAYMENT, function () {
            _nex.payment.start();
        });
    };

    self.popupPager = function () {
        self.hidePopupName();
        self.hidePopupPager();

        var showsplit = false;
        var pagerenabled = false;
        var maxLength = 3;
        var minValue = -1;
        var maxValue = -1;

        if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== null && _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== undefined) {
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty("enabled")) {
                pagerenabled = _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.enabled.toLowerCase() === 'true';
            }
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty("maxlength") &&
                ($.isNumeric(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.maxlength))) {
                maxLength = Number(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.maxlength);
            }
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty("minvalue") &&
                ($.isNumeric(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.minvalue))) {
                minValue = Number(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.minvalue);
            }
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty("maxvalue") &&
                ($.isNumeric(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.maxvalue))) {
                maxValue = Number(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.maxvalue);
            }

            if (minValue === maxValue) {
                minValue = -1;
                maxValue = -1;
            }
        }

        //if pager is enabled....
        if (pagerenabled && !inPreviewer()) {

            var popupString = "PagerPopup";
            var popup = $.extend(true, {}, _nex.assets.popupManager[popupString]);

            var defaultMessage = "Please enter your pager number";
            if ((minValue >= 0) && (maxValue >= 0) && (minValue !== maxValue)) {
                defaultMessage = "Please enter a number between " + minValue.toString() + " and " + maxValue.toString() + ".";
            }
            popup.message = _nex.assets.theme.getTextAttribute("POSTORDERING", "pager", defaultMessage);

            // Bind methods to call when they hit the buttons.
            _nex.ordering.pagerYesClicked = false;
            _nex.ordering.pagerNoClicked = false;
            popup.buttons[0].clickEvent = "_nex.ordering.pagerYesClicked = true;"; //
            popup.buttons[1].clickEvent = "_nex.ordering.pagerNoClicked = true;"; //"";

            _nex.keyboard.pagerpad.setMaxLength(maxLength);
            _nex.keyboard.pagerpad.setMinValue(minValue);
            _nex.keyboard.pagerpad.setMaxValue(maxValue);
            _nex.keyboard.pagerpad.setPopup(popup);
            popup.onShowCallback = _nex.keyboard.pagerpad.bindKeys;

            _nex.assets.popupManager.showPopup(popup, function () {
                if (_nex.ordering.pagerYesClicked) {
                    _nex.ordering.popupName();
                }
            });
        }
        else {
            //pager turned off skip
            _nex.ordering.gotoPayment();
        }
    };

    self.popupName = function () {
        var showsplit = self.isPagerSplit();
        _nex.keyboard.namepad.data = '';
        console.debug("Pager name split " + showsplit);

        var minLength = 1;
        var maxLength = 50;

        if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== null && _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== undefined) {

            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty("minguestlength") &&
                ($.isNumeric(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.minguestlength))) {
                minLength = Number(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.minguestlength);
            }
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty("maxguestlength") &&
                ($.isNumeric(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.maxguestlength))) {
                maxLength = Number(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.maxguestlength);
            }

            if (minLength === maxLength) {
                minLength = 1;
                maxLength = 50;
            }
        }

        //if pager is enabled and so is the setting to split name and pager...
        if (showsplit && !inPreviewer()) {
            var popupString = "NamePopup";
            var popup = $.extend(true, {}, _nex.assets.popupManager[popupString]);
            popup.message = _nex.assets.theme.getTextAttribute("POSTORDERING", "name", "Please enter your name");

            _nex.ordering.nameYesClicked = false;
            _nex.ordering.nameNoClicked = false;
            // Bind methods to call when they hit the buttons.
            popup.buttons[0].clickEvent = "_nex.ordering.nameYesClicked = true;";
            popup.buttons[1].clickEvent = "_nex.ordering.nameNoClicked = true;";

            _nex.keyboard.namepad.setMinLength(minLength);
            _nex.keyboard.namepad.setMaxLength(maxLength);
            _nex.keyboard.namepad.setPopup(popup);
            popup.onShowCallback = _nex.keyboard.namepad.bindKeys;

            _nex.assets.popupManager.showPopup(popup, function () {
                if (_nex.ordering.nameYesClicked) {
                    _nex.ordering.gotoPayment();
                } else if (_nex.ordering.nameNoClicked) {
                    _nex.keyboard.namepad.data = '';
                }
            });
        }
        else {
            //no split setting, proceed to next step!
            _nex.ordering.gotoPayment();

        }
    };
    self.isPagerEnabled = function () {
        if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== null && _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== undefined) {
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty("enabled")) {
                return _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.enabled.toLowerCase() === 'true';
            }
        }
        return false;
    };
    self.isPagerSplit = function () {
        if (self.isPagerEnabled()) {
            //no check for null on pager needed here, as we have done it in the ispagerenabled.
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty("splitpager")) {
                return _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.splitpager.toLowerCase() === 'true';
            }
        }
        return false;
    };
    self.hidePopupName = function (callback) {
        var popupString = "NamePopup";
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString]);
        _nex.assets.popupManager.hidePopup(popup, callback);
    };
    self.hidePopupPager = function () {
        var popupString = "PagerPopup";
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString]);
        _nex.assets.popupManager.hidePopup(popup);
    };
    // Helper method common to all control buttons being clicked in this phase.
    self._trackControlClick = function ($button, context) {
        var BUTTON_INDEX = "";
        var buttonText = $button.text();
        var currentMenuId = self.currentMenuId;
        var menuContext = context;
        var BUTTON_TYPE = "control"; // will be translated to 0
        _nex.utility.buttonTracking.track(BUTTON_INDEX, buttonText, currentMenuId, menuContext, BUTTON_TYPE);
        self.resetNudge();
    };

    // Button click handlers. Track the button click and then perform the action.
    self._addItemClicked = function ($button) {
        self._trackControlClick($button, "Add Item");
        _nex.assets.soundManager.playButtonHit();
        _nex.ordering.addItem();
    };

    self._backButtonClicked = function ($button) {
        self._trackControlClick($button, "Back");
        _nex.assets.soundManager.playButtonHit();
        _nex.ordering.goBack();
    };

    self._cancelButtonClicked = function ($button) {
        self._trackControlClick($button, "Cancel");
        _nex.assets.soundManager.playButtonHit();
        if (inPreviewer()) {
            self.orderManager.resetCurrentOrder();
            _nex.manager.cancelCurrentPhase(); // skip the prompt if we are just previewing
        } else {
            _nex.ordering.cancelOrderPrompt();
        }
    };

    self._continueButtonClicked = function ($button) {
        self._trackControlClick($button, "Continue");
        _nex.assets.soundManager.playButtonHit();
        self.stopNudge();
        _nex.ordering.gotoNextMenu();
    };

    self._reviewButtonClicked = function ($button) {
        self._trackControlClick($button, "Review");
        _nex.assets.soundManager.playButtonHit();
        _nex.ordering.gotoOrderReview();
    };

    self._doneButtonClicked = function ($button) {
        self._trackControlClick($button, "Done");
        _nex.assets.soundManager.playButtonHit();

        // The goal here is when they click done, show the dine in or carry out prompt just like the Flash;
        // then afterward show the pager popup (or pager name popup).
        if (!inPreviewer()) {
            var callback = _nex.ordering.popupPager;
            self._dineInOrCarryOut(callback);
        } else {
            _nex.ordering.gotoPayment();
        }

    };

    // Set the order type.
    self._setOrderType = function (userPicked, driveThruFlag, takeoutFlag, dineinFlag) {

        if (!userPicked) {
            // if the user did not pick the value set the type based on settings
            _nex.orderManager.togo = (driveThruFlag) ? true : takeoutFlag;

            if (driveThruFlag) {
                _nex.orderManager.currentOrder.ordertype = "drivethru";
            } else if (takeoutFlag) {
                _nex.orderManager.currentOrder.ordertype = "takeout";
            } else if (dineinFlag) {
                _nex.orderManager.currentOrder.ordertype = "dinein";
            }

        } else {
            // if the user picked the value set the type based on that
            if (_nex.orderManager.currentOrder.togo) {
                _nex.orderManager.currentOrder.ordertype = "takeout";
            } else {
                _nex.orderManager.currentOrder.ordertype = "dinein";
            }
        }
        console.log("Togo is now " + _nex.orderManager.currentOrder.togo + " and order type is " + _nex.orderManager.currentOrder.ordertype);
    };

    // Set the togo flag.
    self._dineInOrCarryOut = function (callback) {
        // This code is modeled after the Flash.
        _nex.orderManager.currentOrder.togoSet = false;
        _nex.orderManager.currentOrder.ordertypeSet = false;
        _nex.orderManager.currentOrder.togo = false;
        var orderTypeNode = null;
        var takeoutFlag = false;
        var dineinFlag = false;
        var driveThruFlag = false;
        var dicoPopup = null;

        if (_nex.assets.theme.kiosk.PAYMENTPROFILE.hasOwnProperty("ORDERTYPE")) {
            orderTypeNode = _nex.assets.theme.kiosk.PAYMENTPROFILE.ORDERTYPE;
            if (orderTypeNode.constructor === Array) {
                orderTypeNode = orderTypeNode[0];
            }
        }
      
        if (orderTypeNode) {
            if (orderTypeNode.hasOwnProperty("takeoutflag")) {
                takeoutFlag = orderTypeNode.takeoutflag.toLowerCase() === "true";
            }
            if (orderTypeNode.hasOwnProperty("dineinflag")) {
                dineinFlag = orderTypeNode.dineinflag.toLowerCase() === "true";
            }
            if (orderTypeNode.hasOwnProperty("drivethruflag")) {
                driveThruFlag= orderTypeNode.drivethruflag.toString().toLowerCase() == "true";
            }
        }

        if ((takeoutFlag && dineinFlag) || (_nex.orderManager._forceDicoPrompt))
        {
            // This is modeled after NEXTEP Mobile.
            dicoPopup = $.extend(true, {}, _nex.assets.popupManager.dicoPopup);
            dicoPopup.buttons[0].clickEvent = "_nex.orderManager.currentOrder.togo = false;";
            dicoPopup.buttons[1].clickEvent = "_nex.orderManager.currentOrder.togo = true;";
            _nex.assets.popupManager.showPopup(dicoPopup, function () {
                _nex.orderManager.currentOrder.togoSet = true; // set a flag so we know the user actually picked the value
                self._setOrderType(true, driveThruFlag, takeoutFlag, dineinFlag);
                callback();
            });
        } else {
            self._setOrderType(false, driveThruFlag, takeoutFlag, dineinFlag);
            callback();
        }
    };

    self._popoverHitTest = function (e) {
        if (self.currentPopover !== null) {
            //  plugin call
            var hit = self.currentPopover.hitTestPoint({ "x": e.pageX, "y": e.pageY, "transparency": true });
            self.currentPopover.data("keepshowing", (hit) ? "true" : "false");
        }
    };

    self._receiptHitTest = function (e) {
        self.showPulldownReceipt();
    };

    // Different in NEXTEP Mobile vs UX
    self.updateControlButtons = function () {

        if (self.currentMenu.startmenu.toString().toLowerCase() === "true") {
            self.startMenu = self.currentMenuId;
        }

        var template = _nex.assets.templateManager.findTemplate(self.currentMenu.template);
        var addItemVisible = false;

        // update add item
        var btnAddItem = $('#ctrl-add-item');
        if (btnAddItem.length > 0) {
            if ((template !== null) &&
                (template.additembutton !== undefined) &&
                (template.additembutton.toString().toLowerCase() === "true")) {

                addItemVisible = true;

                btnAddItem.removeClass('control-button-hidden');
                var addItemText = _nex.assets.theme.getTextAttribute("ORDERREVIEW", "addanother", "");
                if (addItemText.length === 0) {
                    addItemText = self.theme.getTextAttribute("ORDER", "addanother", "ADD ITEM");
                }

                self.theme.setControlButtonText("ctrl-add-item", addItemText);
                btnAddItem.unbind("click");
                btnAddItem.click(function () {
                    self._addItemClicked(btnAddItem);
                });
            } else {
                btnAddItem.addClass('control-button-hidden');
            }
        }

        // update back button
        var btnBack = $('#ctrl-back');
        if (btnBack.length > 0) {
            var backVisible = (self.startMenu !== self.currentMenuId);
            if ((backVisible) && (!addItemVisible)) {
                btnBack.removeClass('control-button-hidden');
                self.theme.setControlButtonText("ctrl-back", self.theme.getTextAttribute("ORDER", "back", "BACK"));
                btnBack.unbind("click");
                btnBack.click(function () {
                    self._backButtonClicked(btnBack);
                });
            } else {
                btnBack.addClass('control-button-hidden');
            }
        }

        // update cancel button
        var btnCancel = $('#ctrl-cancel');
        if (btnCancel.length > 0) {
            self.theme.setControlButtonText("ctrl-cancel", self.theme.getTextAttribute("ORDER", "cancel", "CANCEL"));
            btnCancel.removeClass('control-button-hidden');
            btnCancel.unbind("click");
            btnCancel.click(function () {
                self._cancelButtonClicked(btnCancel);
            });
        }

        // update continue button
        var btnContinue = $('#ctrl-continue');
        if (btnContinue.length > 0) {
            var continueVisible = false;

            if ((template !== null) &&
                (template.continuemenu !== undefined) &&
                (template.continuemenu.toString().toLowerCase() === "true")) {
                var continueMenu = (self.currentMenu.continuemenu.toString().length > 0) ? self.currentMenu.continuemenu : self.startMenu;

                if (_nex.assets.templateManager.isContinueVisible(self.currentMenu)) {
                    continueVisible = true;
                }
            }

            if (continueVisible) {
                btnContinue.removeClass('control-button-hidden');
                if ((self.currentMenu.upsell.toLowerCase() === "true") &&
                    (self.menustack[self.menustack.length - 1].posids.length === 0)) {
                    self.theme.setControlButtonText("ctrl-continue", self.theme.getTextAttribute("ORDER", "nothanksbutton", "NO, THANKS"));
                } else {
                    self.theme.setControlButtonText("ctrl-continue", self.theme.getTextAttribute("ORDER", "continuebutton", "CONTINUE"));
                }
                btnContinue.unbind("click");
                btnContinue.click(function () {
                    self._continueButtonClicked(btnContinue);
                });
                self.startNudge();
            } else {
                btnContinue.addClass('control-button-hidden');
            }
        }

        // update order review
        var btnOrderReview = $('#ctrl-orderreview');
        if (btnOrderReview.length > 0) {
            var orderReviewVisible = ((self.startMenu === self.currentMenuId) &&
                                        (self.order.ITEM !== undefined) &&
                                        (self.order.ITEM.length > 0));
            self.theme.setControlButtonText("ctrl-orderreview", self.theme.getTextAttribute("ORDER", "orderreview", "DONE"));
            if (orderReviewVisible) {
                btnOrderReview.removeClass('control-button-hidden');
                btnOrderReview.unbind("click");
                btnOrderReview.click(function () {
                    self._reviewButtonClicked(btnOrderReview);
                });
            } else {
                btnOrderReview.addClass('control-button-hidden');
            }
        }

        // update done button
        var btnDone = $('#ctrl-done');
        if (btnDone.length > 0) {

            var doneVisible = false;
            if ((template !== null) &&
                (template.donebutton !== undefined) &&
                (template.donebutton.toString().toLowerCase() === "true")) {
                doneVisible = true;
            }

            if (doneVisible) {
                btnDone.removeClass('control-button-hidden');
                self.theme.setControlButtonText("ctrl-done", self.theme.getTextAttribute("ORDER", "done", "DONE"));
                btnDone.unbind("click");
                btnDone.click(function () {
                    self._doneButtonClicked(btnDone);
                });
            } else {
                btnDone.addClass('control-button-hidden');
            }
        }
    };

    // Different in NEXTEP Mobile vs UX
    // this function should only be called from the goBack function.
    self.removePreviousMenu = function () {
        // remove the previous menu and pass the id to loadMenu
        if (self.menustack.length > 0) {

            // look for menus that have been skipped
            var menuInfoObj = self.menustack.pop();
            while (menuInfoObj.skipped) {
                menuInfoObj = self.menustack.pop();
            }

            var menuRemoved = self.menus[menuInfoObj.menuId - 1];
            var template = _nex.assets.templateManager.findTemplate(menuRemoved.template);

            if (template.defaultbuttontype === "SELECTONEMODIFIER") {
                // remove all mods on the current item which is the last on the order
                if (self.order.ITEM !== undefined) {
                    var index = self.order.ITEM.length - 1;
                    self.removeMods(menuRemoved.id, index);
                }
            } else if (template.defaultbuttontype === "SELECTONE") {

                // remove the last item on the order
                if ((menuInfoObj !== undefined) &&
                    (menuInfoObj.posids.length > 0)) {
                    // there should only be one item to remove since it is a SELECTONE
                    for (var i = 0; i < menuInfoObj.posids.length; i++) {
                        self.removeFromOrder(menuInfoObj.posids[i]);
                    }
                }
            }

            // load the menu
            self.loadMenu(menuRemoved.id);
        } else {
            // return the start menu
            if (self.currentMenuId !== self.startMenu) {
                self.loadMenu(self.startMenu);
            } else {
                // navigate away from the ordering process
                _nex.manager.cancelCurrentPhase();
            }
        }
    };

    // Different in NEXTEP Mobile from UX
    self.removeMultipleFromOrder = function (posids, callback) {
        if (posids.length > 0) {
            self.posidsRemoved = posids;
            _nex.communication.send(new _nex.commands.RemoveFromOrder(posids));

            if (callback) {
                callback();
            }
        } else {

            if (callback !== undefined) {
                callback();
            }
        }

    };

    // This will be called from a method in common
    self.cancelOrderPromptCallback = function () {
        // Implemented differently in UX from NEXTEP Mobile        
        _nex.manager.cancelCurrentPhase();
    };


    self.sendUpdateQuantity = function (index, delta, isModifier, modPosid, callback) {
        // Implemented differently in UX from NEXTEP Mobile
        _nex.communication.send(new _nex.commands.UpdateQuantity(index, delta, isModifier, modPosid), function (result) {

            if (result.responseReceived === "true") {
                self.order.update(result.ORDER);

                if (self.orderUpdated !== undefined) {
                    self.orderUpdated();
                }

                self.updateReceipt();
            }

            if (callback !== undefined) {
                callback(result);
            }
            self.pending = false;
        }, "UPDATEQUANTITYRESPONSE");
    };

    // Implemented differently in NEXTEP Mobile compared to UX
    self.resetOrder = function (callback) {

        self.pending = true;
        self.stopNudge();
        // Reset the order object on the TM if we haven't reached the complete phase yet.
        if (self.orderManager.currentOrder.ordernumber.length === 0) {
            _nex.communication.send(new _nex.commands.CancelOrder(), function (result) {

                if (result && result.responseReceived === "true") {
                    // future use
                }

                self.updateReceipt();

                // Reset the order object on the client
                self.orderManager.resetCurrentOrder();

                // Call the callback
                self.pending = false;
                if (callback !== undefined) {
                    if (result) {
                        callback(result);
                    } else {
                        callback();
                    }
                }

            }, "CANCELORDERRESPONSE");
        } else {
            // Reset the order object on the client
            self.orderManager.resetCurrentOrder();

            // Call the callback
            self.pending = false;
            if (callback !== undefined) {
                //callback(result);
                callback();
            }
        }
    };

    self.startNudge = function () {
        if (self._nudgeTimer !== null) {
            self._nudgeTimer.stop();
            self._nudgeTimer = null;
        }

        var nudgeTimeout = 7;
        if (_nex.assets.theme.system.USERINTERFACE.hasOwnProperty("nudgetimeout")) {
            nudgeTimeout = Number(_nex.assets.theme.system.USERINTERFACE.nudgetimeout.toString());
        }
        self._nudgeTimer = new SimpleTimer(self, self.onNudge, nudgeTimeout);
        self._nudgeTimer.start();
    };

    self.stopNudge = function () {
        $('#ctrl-continue').removeClass("nudge");
        if (self._nudgeTimer !== null) {
            self._nudgeTimer.stop();
        }
        self._nudgeTimer = null;
    };

    self.resetNudge = function () {
        if (self._nudgeTimer !== null) {
            self._nudgeTimer.restart();
        }
    };

    self.onNudge = function (evt) {
        try {
            _nex.assets.soundManager.playSoundByIndex(11); // nudge is 11
            $('#ctrl-continue').removeClass("nudge");
            setTimeout(function () { $('#ctrl-continue').addClass("nudge"); }, 10);
        }
        catch (e) {
        }
    };

    self.loadAd = function (ad, templateName) {
        if ((ad !== undefined) && (ad !== null) && (ad.toLowerCase() !== "empty.swf")) {
            // create an ad target
            $('#template').append("<div id='ad' ></div>");
            var adTarget = $('#template').find('#ad');
            adTarget.attr("style", "background-image: url('" + _nex.assets.theme.mediaPath() + "banners/" + itemFormatting.buttonImage(ad) + "');");
            var classNames = "ad";
            if (templateName !== undefined) {
                classNames += " " + templateName.replace(/ /g, "-") + "-ad";
            }
            adTarget.attr("class", classNames);

            $('#template').append(adTarget);
        }
    };
}
