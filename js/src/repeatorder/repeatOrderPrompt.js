// The first thing the repeat order phase does is show the repeat order prompt.
function RepeatOrderPrompt(repeatOrderPhase) {
    var self = this;

    // Constants.
    self.ACTION_NEWORDER = 0;
    self.ACTION_REPEAT = 1;
    self.ACTION_ORDERPIN = 2;
    self.ACTION_CANCEL = 3;

    // Private properties. Some of these are dependencies being injected.
    self._theme = _nex.assets.theme;
    self._soundManager = _nex.assets.soundManager;
    self._popupManager = _nex.assets.popupManager;
    self._phase = repeatOrderPhase;
    self._action = 0;

    // Debugging.
    self._debugEnabled = true;
    self._debug = function () {
        if (self._debugEnabled) {
            console.debug(arguments);
        }
    };

    // Update the user interface to show all the choices.
    self.updateUI = function () {
        // Default to new order action.
        self._action = self.ACTION_NEWORDER;

        // If we are already initialized, simply return.
        if (self._newOrderButton) {
            return;
        }

        // Update the text of the heading.
        $("#repeatOrderPromptText").html(self._theme.getTextAttribute("REPEATORDERS", "prompttitle", ""));

        // Bind the buttons.
        self.bindOptions();

        // Show the buttons.
        self.showOptions();
    };

    // Show the options.
    self.showOptions = function () {
        $("#repeatOrderPrompt").show();
    };

    // Hide the options.
    self.hideOptions = function () {
        $("#repeatOrderPrompt").hide();
    };

    // Bind the options you can pick from (e.g. new order or repeat order).
    self.bindOptions = function () {
        // All buttons are optional... 
        // The names are prefixed to help make them unique for creative to bind to easily.
        var PROMPT_BUTTON_NEW = "repeatorderprompt-newOrderButton";
        var PROMPT_BUTTON_REPEAT = "repeatorderprompt-repeatButton";
        var PROMPT_BUTTON_PIN = "repeatorderprompt-orderPinButton";
        var PROMPT_BUTTON_CANCEL = "repeatorderprompt-cancelButton";

        //The Flash code is commented out and placed here for reference.
        //self._newOrderButton = new StandardButton(self._uiClip, "newOrderButton", self.getText("neworderbutton", "Start a New Order"));
        //self._repeatButton = new StandardButton(self._uiClip, "repeatButton", self.getText("repeatorderbutton", "Repeat a Previous Order"));
        //self._orderPinButton = new StandardButton(self._uiClip, "orderPinButton", self.getText("orderpinbutton", "I have an Order PIN"));
        //self._cancelButton = new StandardButton(self._uiClip, "cancelButton", self.getText("cancelbutton", "Cancel"));

        // Use a utility class to wire up the buttons.
        var buttonBinder = _nex.utility.buttonBinder;
        var text = "";

        text = self._theme.getTextAttribute("REPEATORDERS", "neworderbutton", "Start a New Order");
        buttonBinder.bind(PROMPT_BUTTON_NEW, text, self.onNewOrder);

        text = self._theme.getTextAttribute("REPEATORDERS", "repeatorderbutton", "Repeat a Previous Order");
        buttonBinder.bind(PROMPT_BUTTON_REPEAT, text, self.onRepeat);

        text = self._theme.getTextAttribute("REPEATORDERS", "orderPinButton", "I have an Order PIN");
        buttonBinder.bind(PROMPT_BUTTON_PIN, text, self.onOrderPin);

        text = self._theme.getTextAttribute("REPEATORDERS", "cancelButton", "Cancel");
        buttonBinder.bind(PROMPT_BUTTON_CANCEL, text, self.onCancel);
    };

    // User clicked the new order button.
    self.onNewOrder = function () {
        self._action = self.ACTION_NEWORDER;
        self.continue();
    };

    // User clicked the repeat order button.
    self.onRepeat = function () {
        self._action = self.ACTION_REPEAT;
        self.continue();
    };

    // User clicked the order pin button.
    self.onOrderPin = function () {
        self._action = self.ACTION_ORDERPIN;
        self.continue();
    };

    // User clicked the cancel button.
    self.onCancel = function () {
        self._action = self.ACTION_CANCEL;
        self.continue();
    };

    // Continue after the user picks an action.
    self.continue = function () {
        self._debug("Continue with action: " + self._action);
        switch (self._action) {
            case self.ACTION_NEWORDER:
                // Just move along to ordering.
                self._phase.gotoOrdering();
                break;
            case self.ACTION_REPEAT:
                // Move to the repeat selection UI.
                self.hideOptions();
                self._phase.showLookupOptions();
                break;
            case self.ACTION_ORDERPIN:
                // Prompt for an order PIN.
                var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup);
                popup.message = self._theme.getTextAttribute("REPEATORDERS", "orderpinprompt", "Enter your pin");
                _nex.previousOrders.onlineOrder = new OnlineOrder(self._theme);
                _nex.previousOrders.onlineOrder.getPinFromNumPad();
                break;
            default:
                // Cancel out and go back to splash.
                _nex.manager.cancelCurrentPhase();
        }
    };

    //// Called from the popup after they enter a pin.
    //self.orderPinEntered = function (okClicked, pin) {
    //    // TODO: do something with the Order PIN!
    //    // Lookup the order by its pin... then go to ordering with that pin.
    //    self.gotoOrdering(null);
    //};

    // Helper method to get all the attributes right for button tracking.
    self._trackControlClick = function (button) {
        var buttonId = "";              // button id is used for menus 
        var buttonText = button.text(); // the text on the button itself
        var menuId = "";                // menu id is not applicable in this phase.
        var BUTTON_TYPE = "control";    // control will be translated to the right enum
        var context = "";               // leave context blank, usually used for menus
        _nex.utility.buttonTracking.track(buttonId, buttonText, menuId, context, BUTTON_TYPE);
    };

}
