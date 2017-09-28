// Customers can potentially have custom JavaScript... that needs to integrate with the rest of our solution.
// This file contains custom JavaScript for Cedar Fair. It can be used as a starting point for other customers.
// It is included through templates.xml. It inherits from a CustomPage object that has logic common to different
// customer pages.
(function(window) { // Keep these functions outside of global scope. Pass in dependencies.
    console.log("--- creditcheck.js ---");
    // Helper for setting up inheritance between two JavaScript objects.
    var inheritsFrom = function (child, parent) {
        // for the command objects, this inheritance is setup the same way.
        child.prototype = Object.create(parent.prototype);
    };

    // Constructor for the loyalty scan page. Inherits from the CustomPage object.
    var CheckPage = function (id) {
        var self = this;
        CustomPage.call(this, id);
        
        // Debug enabled.
        self.debugEnabled = true;
        self.debug = function () {
            if (self.debugEnabled) {
                console.log("CheckPage", arguments);
            }
        };
        
        // Helper to get the price of a specific item.
        self.getPrice = function (posid, responseIndex, menuPrice) {
            self.debug("getPrice", "Looking up the value of the discount on posid " + posid);
            var response = _nex.orderManager.customData.successfulResponses[responseIndex];
            self.debug("getPrice", "Checking in response", response);
            var result = menuPrice; 
            // (you get no discount on this item because Cedar Fair's API did not list a discount on it)
            if (response.hasOwnProperty("CDR") && response.CDR.hasOwnProperty("AVAILABLEITEM")) {
                var availableItems = response.CDR.AVAILABLEITEM;
                var newItem = {};
                for (var index = 0; index < availableItems.length; index++) {
                    self.debug("Checking item at index " + index);
                    var item = availableItems[index];
                    
                    // parse the menu option id if it has one
                    if (item.hasOwnProperty("menuoptionid")) {
                        newItem.posid = item.menuoptionid;
                    }
                    
                    // parse the posid if it has one
                    if (item.hasOwnProperty("posid")) {
                        newItem.posid = item.posid;
                    }
                    
                    // grab the price if it has one
                    if (item.hasOwnProperty("price")) {
                        newItem.price = item.price;
                    } else {
                        console.log("LoyaltyScanPage - Missing attribute price in return");
                    }

                    if (newItem.posid === posid) {
                        self.debug("Found a match. The price is ", newItem.price);
                        result = newItem.price;
                        break;
                    }
                }
            }
            self.debug("The menu price is " + menuPrice + " and the discount price is " + result);
            return result;
        };
        
        // Override for what to do when this page is shown.
        self.show = function() {
            self.debug('showing check page');
            if (!_nex.orderManager.customData.hasOwnProperty("credits")) {
                throw "Could not find property credits.";
            }
            if (_nex.orderManager.customData.credits > 0) {
                 _nex.orderManager.customData.credits--; // decrement number of credits here
            }
            if ($("#txtCreditsLabel").length > 0) {
                $("#txtCreditsLabel").html(_nex.orderManager.customData.name || "Barcode " + _nex.orderManager.customData.index + 1);
            }
            if ($("#txtCreditsTotal").length > 0) {
                $("#txtCreditsTotal").html(_nex.orderManager.customData.credits);
            }
            var lastSelectedItem = _nex.orderManager.currentOrder.currentItem();
            self.debug(lastSelectedItem);
            var currentTender = _nex.orderManager.customData.loyaltyTenders[_nex.orderManager.customData.index]; 
            
            // Set the current items price and the tenders price to be the same.
            var price = self.getPrice(lastSelectedItem.posid, _nex.orderManager.customData.index, lastSelectedItem.price);
            lastSelectedItem.price = price;
            currentTender.setValue(price);
            
            //uncomment for testing
            //lastSelectedItem.price = 5.00;
            //currentTender.setValue(5.00);

            _nex.orderManager.customData.index++; // go to one index higher
            
            if (_nex.orderManager.customData.credits === 0) {
                self.debug('No more credits... Go to order review');
                _nex.ordering.gotoOrderReview();
                
                // Hide the continue button on order review... It should just say done...
                $("#ctrl-continue").hide();

            } else {
                 self.debug('You have more credits... Allow ordering more by going to next menu...');
                _nex.ordering.gotoNextMenu();
            }
        };
        
    };
    inheritsFrom(CheckPage, CustomPage);
    
    // Explicitly expose the CheckPage constructor globally and an instance.
    if (!window.CheckPage) {
        window.CheckPage = CheckPage; 
        window.checkPage = new CheckPage();
        window.checkPage.show();
    }

})(window);