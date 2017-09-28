function OnlineOrder(parameters) {
    // Guard against wrong parameters.
    if (!(parameters instanceof ThemeUX)) {
        throw "OnlineOrder: Parameter is not a ThemeUX.";
    }

    var self = this;
    self._theme = parameters;
    self.lookupByPin = false;

    self.isPinOrderLookup = function () {
        // Default the result to false.
        var result = false;

        // Use theme as a shorthand for self._theme.
        var theme = self._theme;

        // Check the theme object if 'previous orders' is enabled.
        if (theme.system && theme.system.PREVIOUSORDERS && theme.system.PREVIOUSORDERS.hasOwnProperty("orderlookup")) {
            if (theme.system.PREVIOUSORDERS.orderlookup.toLowerCase() === 'true') {
                result = true;
            }
        }

        // Return the result.
        return result;
    };

    self._popupOrderOptions = function (message, callback) {
            var popupString = "orderOptionsPopup";
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString]);
        popup.message = _nex.assets.theme.getTextAttribute("", "instructions", "Please Enter an option.");
        popup.buttons[0].clickEvent = "_nex.previousOrders.onlineOrder.getPinFromNumPad();";
        popup.buttons[1].clickEvent = "_nex.previousOrders._lookupPreviousSelected();";
        popup.buttons[2].clickEvent = "_nex.previousOrders._gotoOrderingWithoutOrder();";
        _nex.assets.popupManager.showPopup(popup);
    };

    self.getPinFromNumPad = function() {
        var popup = $.extend(true, {}, _nex.assets.popupManager.numpadPopup);
        popup.buttons[0].clickEvent = "_nex.previousOrders.onlineOrder.getPinLookup();";
        popup.buttons[1].clickEvent = "_nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.SPLASH);_nex.assets.popupManager.hidePopup(popup);";

        popup.message = _nex.assets.theme.getTextAttribute("ORDER", "orderidpin", "Please enter your PIN");
        _nex.assets.popupManager.showPopup(popup);
        _nex.keyboard.numpad.bindKeys();
    };

    self.getPinLookup = function() {
        var pin = _nex.keyboard.numpad.data;
        self.orderLookup(pin);
    };

    self.showPinNotFoundPopup = function (message, callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.dismissibleMessagePopup);
        popup.message = message ? message : "Sorry! We are unable to find your order.";
        popup.buttons[0].clickEvent = "_nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PREVIOUS_ORDERS, function () { _nex.previousOrders.start();});";
        _nex.assets.popupManager.showPopup(popup, callback);
    };

    self.orderLookup = function (pin) {
        self._orderDate = "";
        self._searchType = "OrderId";
        self._searchTerm = pin;

        var command = new _nex.commands.OrderLookup(self._orderDate, self._searchType, self._searchTerm, true);

        _nex.communication.send(command, function(response) {
            self.orderLookupResponse(response);

        }, "ORDERLOOKUPRESPONSE");
    };

    self.orderLookupResponse = function (response) {
        if (response.success === "true") {
            _nex.orderManager.currentOrder.update(response.ORDER);
            _nex.ordering.order = _nex.orderManager.currentOrder;
            //start the payment process if order has not been paid.  Otherwise go to complete phase.
            if (response.ORDER.paymentstatus === "NoPayment") {
                _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PAYMENT, function() {
                    _nex.payment.start();
                });
            } else {
                _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.COMPLETE, function () {
                    _nex.complete.start();
                });
            }
        } else {
            self.showPinNotFoundPopup();
        }
    };
}