// Logic for the report order options screen.
function RepeatOrderOptions(postOrdering) {
    var self = this;
    self._postOrdering = postOrdering || false;
    // This was copied from the Flash.

    // constants
    self.OPTION_SELECTED = "OPTION_SELECTED";
    self.BUTTON_PRESSED = "BUTTON_PRESSED";
    self.LOOKUP_MESSAGE_ID = "lookupmessage";
    self.REMEMBER_MESSAGE_ID = "remembermessage";

    // private properties
    self._lookupButtonContainer = null;//:MovieClip;
    self._lookupButtons = [];//:Array;
    self._lookupHeader = {};//:TextField;
    self._lookupType = "";//:String;
    self._lookupValue = "";//:String;
    self._lookupValuesXml = {};//:XML;

    self.debugEnabled = true;
    self.debug = function () {
        if (self.debugEnabled) {
            console.debug(arguments);
        }
    };

    // public properties
    self.getSelectedValue = function () {
        return self._lookupValue;
    };
    self.getSelectedType = function () {
        return self._lookupType;
    };
    self.getSelectedValuesXml = function () {
        return self._lookupValuesXml;
    };
    self.getText = function (attribute, defaultText) {
        return _nex.assets.theme.getTextAttribute("REPEATORDERS", attribute, defaultText);
    };

    // Returns true if the customer has repeat orders turned on.
    self.isRepeatOrderEnabled = function () {
        var prevOrders = _nex.assets.theme.system.PREVIOUSORDERS;
        if (prevOrders.length > 0) {
            prevOrders = _nex.assets.theme.system.PREVIOUSORDERS[0];
        }
        if (prevOrders && prevOrders.userepeatorders && (prevOrders.userepeatorders.toLowerCase() == "true")) {
            return true;
        } else {
            return false;
        }
    };

    // Returns true if at least one of the repeat order option buttons is available and if repeat ordering is enabled in system.xml.
    self.containsAtLeastOneButton = function () {
        return self.isRepeatOrderEnabled() && (self._lookupButtons.length > 0);
    };

    // initialization
    self.init = function (lookupButtonContainer, cancelText, optionMessage, buttonXmlList) {

        if (!self.containsAtLeastOneButton) {
            console.log("No buttons for repeat orders!");
            return;
        }

        self._lookupButtonContainer = lookupButtonContainer;

        // Find the lookup header. In post ordering, we use a different message.
        if (self._lookupHeader !== null) {
            if (!self.postOrdering) {
                self._lookupHeader.text = self.getText(self.LOOKUP_MESSAGE_ID, optionMessage);
            } else {
                self._lookupHeader.text = self.getText(self.REMEMBER_MESSAGE_ID, optionMessage);
            }
            
        }

        var buttonUI;

        self._lookupButtons = [];

        // create a list of enabled buttons
        var buttonUIIndex = 0;
        for (var i = 0; i < buttonXmlList.length; i++) {
            var buttonXml = buttonXmlList[i];
            if (self.isTypeEnabled(buttonXml)) {
                //get button UI element
                var buttonId = "button" + buttonUIIndex;
                buttonUIElement = $("#repeatOrderOptions #" + buttonId);

                // If there is a button on the UI
                if (buttonUIElement.length > 0) {
                    //create the button
                    var button = new RepeatOrderButton(buttonId, buttonXml, self.onButtonClick);
                    self._lookupButtons.push(button);

                    buttonUIIndex++;
                }
                else {
                    console.log("RepeatOrderOptions: Ran out of button elements in the HTML file!");
                    break;
                }
            }
        }
    };

    // Bind all the buttons to their HTML counter parts.
    self.bindButtons = function () {
        for (var index = 0; index < self._lookupButtons.length; index++) {
            var button = self._lookupButtons[index];
            var buttonId = button.getButtonId();
            var settings = button.getButtonSettings();
            var type = settings.type;
            _nex.utility.buttonBinder.bind(buttonId, button.getButtonText(self._postOrdering), button.getCallback, false, type);
        }
    };


    // Show the buttons and the header.
    self.show = function () {
        for (var i = 0; i < self._lookupButtons.length; i++) {
            var button = self._lookupButtons[i];
            if (button) {
                button.show();
            }
        }
        var header = $("#repeatOrderPromptHeader");
        if (header.length > 0) {
            $("#repeatOrderPromptHeader").html(_nex.assets.theme.getTextAttribute("REPEATORDERS", "lookupmessage", ""));
            header.show();
        }
    };

    self._isEnabled = function (repeatOrderElement, attribute) {
        self.debug(repeatOrderElement);
        self.debug("Checking if attribute " + attribute + " is set to true");
        var result = false;
        if (repeatOrderElement.hasOwnProperty(attribute)) {
            if (repeatOrderElement[attribute] === "true") {
                result = true;
            }
        }
        self.debug(result);
        return result;
    };

    // Returns true if enabled.
    self.isTypeEnabled = function (buttonXml) { // (buttonXml:XML) : Boolean
        //based on the button determine if the lookup option is enabled...
        var enabled = false;
        var type = buttonXml.type.toString();
        var typeLower = type.toLowerCase();

        var repeatOrderElement = _nex.repeatOrderPhase.getRepeatOrderElement();

        switch (typeLower) {
            case "cancel":
                enabled = true;
                break;
            case "phone":
            case "face":
            case "credit":
            case "loyalty":
            case "loyalty2":
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
                enabled = self._isEnabled(repeatOrderElement, typeLower);
                break;
            default:
                enabled = self._isEnabled(repeatOrderElement, typeLower);
                break;
        }

        return enabled;
    };


    self.onButtonClick = function (buttonType) { //(evt:MouseEvent)
        self.debug('clicked ' + buttonType);
        switch (buttonType.toLowerCase()) {
           
                //show the prompt for the phone number
                //_nex.previousOrders._popupPhone();
                //break;

            case "cancel":
                //just move along
                if (!self._postOrdering) {
                    _nex.previousOrders.gotoOrdering();
                } else {
                    _nex.postOrdering.gotoNextPhase();
                }

                break;
             case "phone":
            case "face":
            case "credit":
            case "loyalty":
            case "loyalty2":
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
                //listen for a swipe/scan or face. show the generic lookup popup with the proper image loaded
                var lookupPopup = new LookupPopup(self._postOrdering);
                //lookupPopup.setButtonXml(button.buttonXml);
                
                lookupPopup.updateUI(buttonType);
                lookupPopup.show(buttonType);
                break;
            default:
                console.error("Could not find popup for " + buttonType);

        }
    };

    //self.lookupPopupClosed = function (okClicked, itemChosen) { //(evt:PopupEvent) : void 
    //    if (okClicked) {
    //        alert(itemChosen);
    //    }
    //};
}
