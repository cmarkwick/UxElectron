function LookupPopup(postOrdering) //extends YesNoPopup
{
    // Copied from the Flash then modified.
    var self = this;
    self.postOrdering = postOrdering || false;

    self._currentButtonXml = null; //;
    self._barCodeListener = null; //:BarCodeScanListener;
    self._yesButton = {};
    self._noButton = {};

    self.setButtonXml = function (buttonXml) {
        self._currentButtonXml = buttonXml;
    };

    self.enableDebugging = true;
    self.debug = function () {
        if (self.enableDebugging) {
            console.debug("LookupPopup", arguments);
        }
    };

    // For face recognition.
    self.popupFace = function () {
        self.debug('popup face');

        // Start listening for a face response
        _nex.previousOrders.yesClicked = false;
        _nex.previousOrders.noClicked = false;
        var popup = $.extend(true, {}, _nex.assets.popupManager.lookupPopupVideo);
        popup.message = _nex.assets.theme.getTextAttribute("REPEATORDERS", "lookupfacemessage", "Repeat order by face recognition");
        popup.buttons[0].clickEvent = "_nex.previousOrders.noClicked = true;";
        popup.buttons[0].text = _nex.assets.theme.getTextAttribute("ORDER", "cancel", "Cancel");

        _nex.assets.popupManager.showPopup(popup, function () {
            if (_nex.previousOrders.noClicked) {

                self.debug('popupFace no clicked');
            }
        });

        // Show it, do the device lookup, wait until you get a response... A timeout is baked into
        // the call for the face retrieval...
        var cmd = new _nex.commands.DeviceLookup(_nex.types.lookup.FACE); // 1 for face
        _nex.communication.send(cmd, function (result) {
            if (result && (result.success.toLowerCase() === "true")) {
                self.debug('success');
                self.debug(result);
                _nex.assets.popupManager.hidePopup(popup, function () {
                    var lookup = new LookupData(_nex.types.lookup.FACE, result.lookupvalue, result.LOOKUPVALUES);
                    _nex.orderManager.currentOrder.lookupData = lookup;
                    if (!self.postOrdering) {
                        self._requestPreviousOrders(lookup);
                    } else {
                        self._rememberOrder(lookup);
                    }
                });
            } else {
                _nex.assets.popupManager.hidePopup(popup, function () {
                    var popup = $.extend(true, {}, _nex.assets.popupManager.messagePopup);
                    popup.message = _nex.assets.theme.getTextAttribute("REPEATORDERS", "nopicture", "Unable to take your picture");
                    _nex.assets.popupManager.showPopup(popup);
                });
            }
        }, "DEVICELOOKUPRESPONSE");
    };

    // Helper to actually request the previou orders.
    self._requestPreviousOrders = function (lookup) {
        _nex.previousOrders.fetchOrders(lookup);
    };

    // Helper to remember an order for next time.
    self._rememberOrder = function (lookup) {
        var req = new _nex.commands.SavePreviousOrder(_nex.orderManager.currentOrder.orderid, _nex.orderManager.currentOrder.smsNumber, lookup);
        _nex.communication.send(req); // SavePreviousOrder does not have a response...
        self.gotoComplete();
    };

    // Jump straight to the complete phase.
    self.gotoComplete = function () {
        _nex.postOrdering.gotoNextPhase(false);
    };

    // For loyalty, employee, generic tenders.
    self.popupOther = function (buttonType) {
        self.debug("Showing popupOther");
        // Listen for card swipe or device
        var stopListeningOnCallback = true;
        _nex.utility.deviceListener = new DeviceListener('ALL', _nex.previousOrders._cardEventListener, stopListeningOnCallback);
        _nex.utility.deviceListener.start();

        _nex.previousOrders.yesClicked = false;
        _nex.previousOrders.noClicked = false;
        var popup = $.extend(true, {}, _nex.assets.popupManager.lookupPopup);
        popup.message = _nex.assets.theme.getTextAttribute("REPEATORDERS", "lookupmessage", "Repeat order");
        popup.buttons[0].clickEvent = "_nex.previousOrders.noClicked = true;";
        
        _nex.assets.popupManager.showPopup(popup, function () {
            if (_nex.previousOrders.yesClicked) {
                // Track the user clicked yes.
                self.debug("popupOther yes clicked");

            } else if (_nex.previousOrders.noClicked) {
                // Track the user chose no.
                self.debug("popupOther no clicked");
            }
        });
    };

    // For credit card swipes.
    self.popupCredit = function () {
        self.debug("popupCredit");
        // Listen for card swipe or device
        var stopListeningOnCallback = true;
        _nex.utility.deviceListener = new DeviceListener('CARD', _nex.previousOrders._cardEventListener, stopListeningOnCallback);
        _nex.utility.deviceListener.start();

        _nex.previousOrders.yesClicked = false;
        _nex.previousOrders.noClicked = false;
        var popup = $.extend(true, {}, _nex.assets.popupManager.lookupPopup);
        popup.message = _nex.assets.theme.getTextAttribute("REPEATORDERS", "lookupcreditmessage", "Please swipe your card");
        popup.buttons[0].clickEvent = "_nex.previousOrders.noClicked = true;";
       
        _nex.assets.popupManager.showPopup(popup, function () {
            if (_nex.previousOrders.yesClicked) {
                // Track the user clicked yes.
                self.debug("popupCredit yes clicked");

            } else if (_nex.previousOrders.noClicked) {
                // Track the user chose no.
                self.debug("popupCredit no clicked");
            }
        });
    };

    // Popup for a phone.
    self.popupPhone = function () {
        // Get the popup object.
        var popupString = "phonepadPopup";
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString]);

        // For some reason, setting the message wipes out the rest of the page.
        if (!self.postOrdering) {
            popup.message = _nex.assets.theme.getTextAttribute("PREVIOUSORDERS", "instructions2", "Phone Number");
        } else {
            //_savePrevOrder.LabelText = (_completeText.@savepreviousorder.toString().length > 0) ? _completeText.@savepreviousorder : "Remember~This Order";
            popup.message = _nex.assets.theme.getTextAttribute("COMPLETEORDER", "savepreviousorder", "Remember this order?");
        }
        // Bind methods to call when they hit the buttons.
        popup.buttons[0].clickEvent = "_nex.previousOrders.cancelFetchOrders();";
        popup.buttons[0].text = _nex.assets.theme.getTextAttribute("PREVIOUSORDERS", "popupclear", "CANCEL");

        // Show the popup.
        _nex.assets.popupManager.showPopup(popup);

        // When they hit the final digit of their phone number, continue on.
        var lastDigitCallback = function () {
            _nex.assets.popupManager.hidePopup(popup, function(){
                console.debug("Post ordering is ", self.postOrdering);
                var lookup = new LookupData(_nex.types.lookup.PHONE, _nex.keyboard.phonepad.data);
                _nex.orderManager.currentOrder.smsNumber = lookup.lookupValue;
                if (!self.postOrdering) {
                    _nex.previousOrders.fetchOrders(lookup);
                } else {           
                    self._rememberOrder(lookup);
                }
            });
        };
        _nex.keyboard.phonepad.bindKeys(lastDigitCallback);
    };

    self.show = function (buttonType)//(popupCompleteListener = null, autoClose = false, x = -1000, y = -1000)
    {
        self.debug("Showing popup for button type " + buttonType);
        if (buttonType === "face") {
            self.popupFace();
        }
        else if (buttonType === "credit") {
            self.popupCredit();
        }
        else if (buttonType === "phone") {
            self.popupPhone();
        } else {
            self.popupOther(buttonType);
        }
    };

    self.updateUI = function (buttonType) {
        self.debug("updateUI");
        self._noButton.visible = true;
        self._yesButton.visible = false;

        var type = buttonType.toLowerCase();
        switch (type) {
            case "face":
                self._lookupType = self.LOOKUPTYPE_FACE;
                break;
            case "credit":
                self._lookupType = self.LOOKUPTYPE_CREDIT;
                break;
            case "loyalty":
                self._lookupType = self.LOOKUPTYPE_LOYALTY;
                break;
            case "loyalty2":
                self._lookupType = self.LOOKUPTYPE_LOYALTY2;
                break;
            case "generic1":
                self._lookupType = self.LOOKUPTYPE_GENERIC1;
                break;
            case "generic2":
                self._lookupType = self.LOOKUPTYPE_GENERIC2;
                break;
            case "generic3":
                self._lookupType = self.LOOKUPTYPE_GENERIC3;
                break;
            case "generic4":
                self._lookupType = self.LOOKUPTYPE_GENERIC4;
                break;
            case "generic5":
                self._lookupType = self.LOOKUPTYPE_GENERIC5;
                break;
            case "generic6":
                self._lookupType = self.LOOKUPTYPE_GENERIC6;
                break;
            case "generic7":
                self._lookupType = self.LOOKUPTYPE_GENERIC7;
                break;
            case "generic8":
                self._lookupType = self.LOOKUPTYPE_GENERIC8;
                break;
            case "generic9":
                self._lookupType = self.LOOKUPTYPE_GENERIC9;
                break;
            case "generic10":
                self._lookupType = self.LOOKUPTYPE_GENERIC10;
                break;
            default:
                break;
        }
    };

    self.getDefaultText = function (failureText) {
        var type = self._currentButtonXml.type.toString();
        switch (type.toLowerCase()) {
            case "face":
                if (failureText) {
                    return "Unable to take your picture";
                }
                else {
                    return "Taking your picture now";
                }
                break;
            case "credit":
                return "Swipe your card";
            case "loyalty":
            case "loyalty2":
                return "Scan your card";
            case "generic1":
            case "generic2":
            case "generic3":
            case "generic4":
            case "generic5":
            case "generic6":
            case "generic7":
            case "generic8":
            case "generic9":
            case "generic10":
                return "Scan your badge";
            default:
                return type;
        }
    };

}