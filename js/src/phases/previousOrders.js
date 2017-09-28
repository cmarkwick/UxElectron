// Constructor for the PreviousOrders phase. If this phase is enabled,
// then it gives the user an opportunity to lookup any previous orders,
// and choose one. If it is not enabled, it should be skipped, and the
// user is brought right to the ordering phase.
function PreviousOrders(parameters) {
    // Guard against missing parameters.
    if (!parameters) {
        throw "PreviousOrders: Missing parameters.";
    }
    if (!parameters.theme) {
        throw "PreviousOrders: Missing parameter theme.";
    }

    // Make self synonymous with this.
    var self = this;

    // Like all the phases, we use certain parts of the theme object.
    self._theme = parameters.theme;

    // Set a property for the previous order.
    self._previousOrderSelected = null;

    // User's choice to lookup previous orders.
    self.lookupPrevious = false;

    // What previous orders came back if they choose to look up previous orders.
    self.previousOrdersFound = [];

    // Whether or not the user started the process with a card swipe.
    self.deviceData = null;

    // Any phone data entered at this phase to be used later.
    self.phoneData = "";

    // Turn to true to enable debugging the previous orders phase.
    var DEBUG_ENABLED = true;
    self._debug = function() {
        if (DEBUG_ENABLED) {
            console.debug("PreviousOrders", arguments); // use built-in arguments object
        }
    };


    // Reset properties.
    self.reset = function () {
        self._previousOrderSelected = null;
        self.lookupPrevious = false;
        self.previousOrdersFound = [];
        self.deviceData = null;
        self.phoneData = "";
    };

    // Start the 'previous orders' process.
    self.start = function (deviceData) {
        self._debug("start","Enter the previous orders phase");

        // Reset variables.
        self.reset();

        // Send an update of the current status.
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.PREVIOUS_ORDERS);

        // Hide the content of this phase for now.
        self.hideClip();

        // Update the control buttons for when we show it.
        self.updateControlButtons();

        // User scanned a barcode or something to start.
        if (deviceData) {
            self.deviceData = deviceData;
        }

        // Check if the customer is configured to use this phase.
        if (self.isPreviousOrdersEnabled()) {
            self._debug("start", "previous orders is enabled... checking card swiped");
            // Check if they did a card swipe already
            if (self.deviceData) {
                self.fetchOrders(self.deviceData);
            } else {
                // Repeat a previous order.
                try {
                    _nex.repeatOrderPhase = new RepeatOrderPhase();
                    _nex.repeatOrderPhase.start();
                    
                } catch (ex) {
                    // This may happen if we are missing an asset for repeat orders
                    console.log("ERROR entering repeat order phase.");
                    self.gotoOrdering();
                }

            }
        } else {
            // This customer is not configured to use this phase.
            // Go directly to the ordering phase.
            self._debug("start", "going to ordering");
            self.gotoOrdering();
        }

        refreshOrderTimer();
    };

    // Stop the previous orders process.
    self.stop = function () {
        self.reset();
    };

    // Hide the clip.
    self.hideClip = function () {
        // Hide the content of this clip.
        $("#clip-orders").hide();
        $("#clip-controlbuttons").hide();
    };

    // Show the clip.
    self.showClip = function () {
        self._debug('showing previous orders to select from');

        $("#clip-repeatorders").hide();
        $("#clip-orders").show();
        $("#clip-controlbuttons").show();
    };

    // Tracking logic common to buttons in previous orders.
    self._trackClick = function ($button, context) {
        var buttonId = ""; // button id is left as empty string.
        var buttonText = $button.text();
        var menuId = ""; // menu id is not applicable in this phase.
        var BUTTON_TYPE = "control";
        _nex.utility.buttonTracking.track(buttonId, buttonText, menuId, context, BUTTON_TYPE);
    };

    // Callback.
    self._continueButtonClicked = function ($button) {
        self._trackClick($button, "New Order");
        _nex.previousOrders.gotoOrdering();
    };

    // Callback.
    self._cancelButtonClicked = function ($button) {
        self._trackClick($button, "Cancel");
        _nex.previousOrders.gotoSplash();
    };

    // Update control buttons.
    self.updateControlButtons = function () {
        self._debug("Updating control buttons");
        var text = "";
        // new order button
        var btnNewOrder = $('#ctrl-continue');
        if (btnNewOrder.length > 0) {
            btnNewOrder.unbind("click");
            btnNewOrder.click(function () {
                self._continueButtonClicked(btnNewOrder);
            });
            text = _nex.assets.theme.getTextAttribute("PREVIOUSORDERS", "continue", "NEW ORDER");
            btnNewOrder.html(text);
         }

        // update cancel button
        var btnCancel = $('#ctrl-cancel');
        if (btnCancel.length > 0) {
            btnCancel.unbind("click");
            btnCancel.click(function () {
                self._cancelButtonClicked(btnCancel);
            });
            text = _nex.assets.theme.getTextAttribute("ORDER", "cancel", "CANCEL");
            btnCancel.html(text);
        }
    };

    // Check if 'previous orders' is enabled.
    self.isPreviousOrdersEnabled = function () {
        // Default the result to false.
        var result = false;

        // Use theme as a shorthand for self._theme.
        var theme = self._theme;

        // Check the theme object if 'previous orders' is enabled.
        if (theme.system && theme.system.PREVIOUSORDERS && theme.system.PREVIOUSORDERS.hasOwnProperty("enabled")) {
            if (theme.system.PREVIOUSORDERS.enabled.toLowerCase() === 'true') {
                result = true;
            }
        }

        // Return the result.
        return result;
    };

    // Returns true if previous orders were found.
    self.previousOrdersFound = function (previousOrders) {
        var result = false;
        if (previousOrders && previousOrders.length > 0) {
            result = true;
        }
        return result;
    };

    // Clear previous orders shown.
    self.clearPreviousOrders = function () {
        // Use a jQuery selector for this to remove all the ones except the first one,
        // which is actually a template that is cloned for the others.
        $('div.previous-order:not(:first)').remove();
    };

    // Copied from NEXTEP Mobile.
    self.isOrderItemsAvailable = function (items) {
        var isAvailable = true;

        // look at all items and modifiers - if any are not available the entire order is not available
        for (var i = 0; (i < items.length) && (isAvailable) ; i++) {
            isAvailable = _nex.assets.theme.itemIsAvailable(items[i].posid);

            // check the pricelevel price; if the price of the is $0 then the item should not be included
            try {
                var item = _nex.assets.theme.itemByPosid(items[i].posid);
                if (isAvailable &&
                    items[i].hasOwnProperty("price") &&
                    (item !== null)) {
                    var originalPrice = (items[i].price.length > 0) ? Number(items[i].price) : 0;
                    var currentPrice = _iorderfast.assets.theme.itemPrice(item, items[i].pricelevel);
                    currentPrice = (currentPrice.length > 0) ? Number(currentPrice) : 0;

                    if ((originalPrice > 0) && (currentPrice === 0)) {
                        isAvailable = false;
                    }
                }
            }
            catch (e) {
                console.log("unable to determine price of item");
            }

            // check modifiers
            if (isAvailable) {
                var itemsArray = self._convertToArray(items[i].ITEM);
                isAvailable = self.isOrderItemsAvailable(itemsArray);      
            }
        }

        return isAvailable;
    };

    // Utility method.
    self._convertToArray = function (obj) {
        var result = [];
        if (obj) {
            if (obj instanceof Array) {
                result = obj;
            } else {
                result.push(obj);
            }
        }
        return result;
    };

    // Check if all the items exist on the previous order.
    self._allItemsExist = function (previousOrder) {
        var result = true;
        var items = [];
        var itemsArray = [];
        if (previousOrder.ORDER) {
            items = previousOrder.ORDER.ITEM;
            itemsArray = self._convertToArray(items);
            result = self.isOrderItemsAvailable(itemsArray);
        }
        self._debug("previousOrders._allItemsExist returning " + result);
        return result;
    };

    // Display the orders to choose from.
    self.displayOrders = function (message) {
        self._debug("enter display orders");
        self.clearPreviousOrders();

        self._debug("Displaying previous orders. Here were the ones that were found:");
        var previousOrderTemplate = $('#previousorder');
        self._debug(self.previousOrdersFound);

        var previousOrdersToShow = false;
        if (self.previousOrdersFound.length >= 1) {
            for (var index = 0; index < self.previousOrdersFound.length; index++) {
                var previousOrder = self.previousOrdersFound[index];
                // If all the items exist on the previous order ...
                if (self._allItemsExist(previousOrder)) {
                    // write the HTML out for the order.
                    self.buildOrder(index, previousOrder);
                    // set a flag so we know there is at least one order to show.
                    previousOrdersToShow = true;
                }
            }
        }

        if (previousOrdersToShow) {
            self._debug("Showing control buttons");
            self.updateControlButtons();
            self.showClip();

        } else {
            self._popupNoPreviousOrdersFound();
        }
    };

    // Called if a previous order is selected.
    self.orderSelected = function (order) {
        self._debug("Previous order selected: ", order);
        self.loadOrder(order);
    };

    // Called if new order is touched.
    self.newOrder = function () {
        // This is bound to the control button for New Order in the PreviousOrders phase.
        self.gotoOrdering();
    };

    // Called to load a previous order.
    self.loadOrder = function (index) {
        var order = self.previousOrdersFound[index];
        self._debug("loadOrder", order);
        // Pass the order selected right to ordering.
        console.log(order);
        self.gotoOrdering(order);
    };

    // Go back to the splash phase.
    self.gotoSplash = function () {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.SPLASH, function () {
            //_nex.splash.start();
        });
    };

    // Called when leaving this phase to go to the ordering phase.
    self.gotoOrdering = function (order) {
        // If we have a previous order that was selected ...
        if (order) {
            self._gotoOrderingWithOrder(order);
        } else {
            self._gotoOrderingWithoutOrder();
        }
    };

    // This method is in Nextep mobile. It is called when the user selects a previous order to go to.
    self.loadOrder = function (orderIndex) {
        // Get the order by its index.
        var order = self.previousOrdersFound[orderIndex];

        if (order) {
            // Go to the ordering phase with that order.
            self.gotoOrdering(order);
        }

    };

    // Display the message that no previous orders were found.
    self.displayNoPreviousOrdersFound = function () {
        self._popupNoPreviousOrdersFound();
    };

    // Show an error letting the user know there was a problem with the card data;
    // Go ahead and jump ahead to ordering when this happens (give up on trying to look up previous orders).
    self._popupErrorCardData = function (message, callback) {
        // Show a generic error message.
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
        if (message && message.length > 0) {
            popup.message = message;
        }
        _nex.assets.popupManager.showPopup(popup, function () {
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function () {

            });
        });
    };


    self._lookupPreviousSelected = function () {
        if (self.cardSwiped) {
            // They swiped a card to start, so go ahead and fetch the orders associated with that card.
            _nex.previousOrders.fetchOrders();
        }
    };

    // User chose to fetch previous orders.
    self.fetchOrders = function (lookup) {
        self._debug('fetching orders');
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop();
            _nex.utility.deviceListener = null;
        }

        if (typeof lookup === "object") {
            switch (lookup.lookupType) {
                case "2": {
                    // credit -TODO: parse card data
                    break;
                }
            }
        }

        self._popupProcessing();

        var requestObject = new _nex.commands.RequestRepeatOrders(lookup);
        _nex.communication.send(requestObject, function (result) {
            self._popupProcessingHide();
            self._responseReceived(result);
        }, "PREVIOUSORDERS");

        //if (cardData) {

        //    // Card case.
        //    if (cardData.track1) { 
        //        var cardParser = new CardParser(_nex.assets.theme);
        //        cardParser.parse(cardData.track1, cardData.track2, function (cardData) {
        //            var cardNum = cardData.cardNumber;
        //            var first2 = "";
        //            var last4 = "";
        //            var cardType = cardData.cardType;
        //            if (cardNum) {
        //                if (cardNum.length >= 2) {
        //                    first2 = cardNum.substr(0, 2);
        //                }
        //                if (cardNum.length >= 4) {
        //                    last4 = cardNum.substr(cardNum.length - 4, 4);
        //                }
        //            }
        //            var name = cardData.fullName();
        //            var profile = cardType + name + first2 + last4;
        //            self._sendRequestPreviousOrders(profile);
        //        }, function () {
        //            self._sendRequestPreviousOrders("");
        //        });
        //    } else {
        //        self._sendRequestPreviousOrders("");
        //    }
        //} else {
        //    // Phone case.
        //    self.phoneData = _nex.keyboard.phonepad.data;
        //    if (self.phoneData) {
        //        self._sendRequestPreviousOrders(self.phoneData);
        //    } else {
        //        console.error("Missing card and keyboard data!");
        //        self._sendRequestPreviousOrders(null);
        //    }
        //}
    };

    // User clicked the cancel button on the fetch orders dialog.
    self.cancelFetchOrders = function () {
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop();
            _nex.utility.deviceListener = null;
        }
        // No need to do anything else. Stay on the same screen.
    };

    // Called if the user swiped a card on the screen that prompts for phone number or card swipe.
    self._cardEventListener = function (cardData) {
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop();
            _nex.utility.deviceListener = null;
        }
        _nex.assets.popupManager.hideAllPopups();
        self._debug(cardData);
        if (cardData && cardData !== "ERROR") {
            // Card case.
            if (cardData.track1) {
                var cardParser = new CardParser(_nex.assets.theme);
                cardParser.parse(cardData.track1, cardData.track2, function (cardData) {
                    var cardNum = cardData.cardNumber;
                    var first2 = "";
                    var last4 = "";
                    var cardType = cardData.cardType;
                    if (cardNum) {
                        if (cardNum.length >= 2) {
                            first2 = cardNum.substr(0, 2);
                        }
                        if (cardNum.length >= 4) {
                            last4 = cardNum.substr(cardNum.length - 4, 4);
                        }
                    }
                    var name = cardData.fullName();
                    var profile = cardType + name + first2 + last4;
                    
                    var lookup = new LookupData(_nex.types.lookup.CANCEL, profile);
                    _nex.orderManager.currentOrder.lookupData = lookup;
                    _nex.previousOrders.fetchOrders(lookup);
                }, function () {
                    self._sendRequestPreviousOrders("");
                });
            }
        } else {
            // Error reading card data.
            self._popupErrorCardData(self._theme.getTextAttribute("PAYMENT", "swipeerror", "Error reading card data"));
        }
    };

    // The no previous orders popup.
    self._popupNoPreviousOrdersFound = function () {
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
        popup.message = _nex.assets.theme.getTextAttribute("PREVIOUSORDERS", "promptnotfound", "Sorry, no previous orders found.");
        _nex.assets.popupManager.showPopup(popup, function () {
            // Simply stay on the same screen.
        });
    };

    // The processing popup. Optional parameters message and callback.
    self._popupProcessing = function (message, callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.processingPopup);
        // TODO: Could not find an attribute for the 'processing' text. Change this to what it should be.
        popup.message = message ? message : self._theme.getTextAttribute("PREVIOUSORDERS2", "processing", "Looking Up<br/>Previous Orders...");
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

    // Hide the phonepad popup.
    self._phonepadPopupHide = function (message, callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.phonepadPopup);
        _nex.assets.popupManager.hidePopup(popup, function () {
            if (callback) {
                callback();
            }
        });
    };

    // Check card data.
    self._isValidCard = function (data) {
        var result = false;
        if (data) {
            return true;
        }
        return result;
    };

    // Returns true if it looks like a phone #.
    self._isValidPhone = function (data) {
        // For the purposes of previous orders, any 10 digits are a valid phone.
        var result = false;
        if (data && data.length === 10) {
            result = true;
        }
        return result;
    };

    // Send the request previous orders command.
    self._sendRequestPreviousOrders = function (data) {
        self._debug("Fetching previous orders with data ", data);
        // Hide the phonepad popup if it is still up.
        self._phonepadPopupHide();

        // Check that it is a phone number of credit card data.
        if (data && (self._isValidPhone(data) || self._isValidCard(data))) {
            // Show the processing popup.
            self._popupProcessing();

            // Make a place for the SMS number if there isn't one already.
            if (!_nex.orderManager.currentOrder) {
                _nex.orderManager.currentOrder = {};
            }
            // Set the SMS number.
            _nex.orderManager.currentOrder.smsNumber = data;


            var requestObject = new _nex.commands.RequestPreviousOrders(_nex.orderManager.currentOrder);
            _nex.communication.send(requestObject, function (result) {

                self._popupProcessingHide();
                self._responseReceived(result);
            }, "PREVIOUSORDERS");
        } else {
            console.error("No data or bad data specified for fetching previous orders! Going right to ordering.");
            self._gotoOrderingWithoutOrder();
        }
    };

    // Called when previous orders are found.
    self._responseReceived = function (msg) {
        if (msg.responseReceived === "true") {
            self._debug(msg);

            // Extract the previous order array from the message object.
            var previousOrderArray = msg.PREVIOUSORDER;

            // Double check that it is an array.
            if (Array.isArray(previousOrderArray)) {
                // If there are more than one previous orders, it comes back as an array.
                self.previousOrdersFound = previousOrderArray;
            } else if (typeof previousOrderArray === 'object') {
                // If only one order comes back, it comes back as an object rather than an array.
                self.previousOrdersFound.push(msg.PREVIOUSORDER);
            }
            // Display the orders.
            _nex.previousOrders.displayOrders();
        } else {
            self._debug("error getting previous orders");
            self.previousOrdersFound = null;

            // Display orders will handle the null case by showing a message.
            self.displayOrders();
        }
    };

    // For the simple case of going to ordering without a previous
    // order selected.
    self._gotoOrderingWithoutOrder = function () {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function () {
            _nex.ordering.start();
        });
    };

    // For the simple case of going to ordering without a previous
    // order selected.
    self._gotoOrderingWithOrder = function (order) {

        // Show a popup to let the user know we are doing a round trip.
        self._popupProcessing(self._theme.getTextAttribute("PREVIOUSORDERS2", "loadorder", "Loading Order..."));

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

    // Build a previous order. This is called for each previous order.
    // Note: the order passed in is actually the PREVIOUSORDER element.
    self.buildOrder = function (orderIndex, previousOrder) {
        // Taken from Nextep mobile.
        self._debug("build order - " + orderIndex);
        self._debug(previousOrder);

        // clone the template for displaying a previous order
        var orderHtml = $("#previousorder").clone();

        // set the order date time to be displayed
        orderHtml.attr("id", "previousorder" + String(orderIndex));
        var date = orderHtml.find("#orderdate");

        // Get the date off the PREVIOUSORDER object
        var orderDate = new Date(previousOrder.date);
        var dayOfWeek = dateFormatting.dayOfWeek(orderDate.getDay());
        date.append(dayOfWeek + ", " + dateFormatting.month(orderDate.getMonth()) + " " + orderDate.getDate());


        // build the item/mod list
        var itemHtml = orderHtml.find('#previousOrderItem').clone();
        //$('#previousOrderItem').remove();

        if (previousOrder.ORDER) {
            var order = previousOrder.ORDER;
            var previousOrderItem = null;
            previousOrder.ORDER.previousorderid = previousOrder.orderintid;
            console.log(previousOrder);

            var items = self._convertToArray(order.ITEM);

            for (var i = 0; i < items.length; i++) {
                // The content of this for loop has been moved to getItemHtml.
                var orderItem = items[i];
                previousOrderItem = self._getItemHtml(orderItem, itemHtml, i);

                if (previousOrderItem !== null) {
                    orderHtml.find("#items").append(previousOrderItem);
                    self._debug("1 ORDER HTML NOW: ");
                    self._debug(orderHtml.html());
                }
            }

        } else {
            console.log("ORDER is not an array and is expected to be");
            //self._appendHtml(order.ITEM, itemHtml);
        }


        // set the onclick event to load the previous order
        var loadOrderLink = orderHtml.find('#loadOrder');
        loadOrderLink.attr("onclick", "_nex.previousOrders.loadOrder(" + orderIndex + ")");

        // append all the order HTML to the orders element
        orderHtml.css('visibility', '');
        orderHtml.css('display', '');
        self._debug("Appending total order HTML now...");
        self._debug(orderHtml.html());
        orderHtml.appendTo("#orders");
        self._debug("Orders is now: ");
        self._debug($("#orders").html());
    };


    // Get HTML for the item that is to be added.
    // Pass in a unique id.
    self._getItemHtml = function (orderItem, itemHtml, index) {
        // Clone the previous order item.
        var previousOrderItem = itemHtml.clone();


        // Copy the item.
        var item = _nex.assets.theme.itemByPosid(orderItem.posid);
        if (item) {
            // Re-assign the id.
            var tempId = previousOrderItem.attr("id");
            var newId = tempId + index;
            previousOrderItem.attr("id", newId);

            // Update the item text.
            var itemtext = previousOrderItem.find('#receipttext');
            itemtext.empty();

            itemtext.append(orderItem.quantity + " - " + itemFormatting.buttonText(_nex.assets.theme.itemTextByType(item, "RECEIPTTEXT")));

            var bimage = previousOrderItem.find('#bimage');
            if (bimage.length > 0) {
                bimage.empty();
                var posid = order.ITEM[i].posid;
                var imageurl = _nex.assets.theme.itemByPosid(posid).DETAIL.image;

                if (imageurl.length > 0 && themeid.length > 0) {
                    url = _nex.assets.theme.mediaRootUri;
                    if (url.toLowerCase().indexOf(_nex.assets.theme.id.toLowerCase()) === -1) {
                        url += "/" + _nex.assets.theme.id;
                    }
                    url += "/media/images/" + imageurl;

                    $(bimage).css({
                        "background-image": "url(" + url + ")"
                    });
                }
            }

            // create the mod array if it does not exist
            orderItem.ITEM = self._convertToArray(orderItem.ITEM);

            // use the itemFormatting method in global.js
            var modReceiptText = itemFormatting.buildModReceiptText(orderItem);
            var modtext = previousOrderItem.find('#modtext');
            modtext.empty();
            modtext.append(modReceiptText);

            // unhide the previous order item that was cloned
            self._debug(previousOrderItem.html());
            previousOrderItem.css('visibility', '');
            previousOrderItem.css('display', '');

        } else {
            self._debug("Could not lookup item in POS");

            previousOrderItem.css('visibility', '');
            previousOrderItem.css('display', '');

            //itemHtml.find('#items').append("-");
        }

        index++;
        return previousOrderItem;
    };
}