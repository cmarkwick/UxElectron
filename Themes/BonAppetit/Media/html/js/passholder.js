// Customers can potentially have custom JavaScript... that needs to integrate with the rest of our solution.
// This file contains custom JavaScript for Cedar Fair. It can be used as a starting point for other customers.
// It is included through templates.xml. It inherits from a CustomPage object that has logic common to different
// customer pages.
(function(window) { // Keep these functions outside of global scope. Pass in dependencies.

    // Log that the page was loaded.
    console.log("--- passholder.js ---");
    
    // Helper for setting up inheritance between two JavaScript objects.
    var inheritsFrom = function (child, parent) {
        // for the command objects, this inheritance is setup the same way.
        child.prototype = Object.create(parent.prototype);
    };
    

    // Constructor for the loyalty scan page. Inherits from the CustomPage object.
    function LoyaltyScanPage(id) {
        var self = this;
        CustomPage.call(this, id);
        
        // Debugging.
        self.debugEnabled = true;
        self.debug = function () {
            if (self.debugEnabled) {
                console.log("LoyaltyScanPage", arguments);
            }
        };
        
        // Keep track of previously scanned barcodes.
        self.previouslyScannedBarcodes = [];
        
        // Check if this barcode has already been scanned within this ordering process.
        self.isAlreadyScanned = function (barcode) {
            var result = false;
            for (var index = 0; index < self.previouslyScannedBarcodes.length; index++) {
                var previouslyScannedBarcode = self.previouslyScannedBarcodes[index];
                if (previouslyScannedBarcode === barcode) {
                    result = true;
                    break;
                }
            }
            return result;
        };
        
        // Create additional properties on customData if they haven't been already.
        if (!_nex.orderManager.customData.hasOwnProperty("credits")) {
            _nex.orderManager.customData.credits = 0;
        }
        if (!_nex.orderManager.customData.hasOwnProperty("posids")) {
            _nex.orderManager.customData.posids = []; // posids that qualify... each barcode has its own list
            _nex.orderManager.customData.index = 0; // the current barcode we are iterating through
            _nex.orderManager.customData.successfulResponses = []; // the actual responses from Cedar Fair's API
            _nex.orderManager.customData.loyaltyTenders = []; // each of the loyalty tenders created from the responses
        }

        // Perform a loyalty inquiry to Cedar Fair's API.
        self._performInquiry = function (barcodeData) {
            barcodeData = "TN34YE"; // For testing only
            
            // If it hasn't been scanned already, perform the inquiry.
            var command = new _nex.commands.LoyaltyInquiry(barcodeData, "", "", "", "", false);
            _nex.communication.send(command, function (response) {
                self.debug("Response received", response);
                
                _nex.assets.popupManager.hidePopup(_nex.assets.popupManager.processingPopup);
                if (response.status && response.status.toLowerCase() !== "failure") {
                    
                    self.debug('loyaltyInquiry', "Received response success", response);
                    self.previouslyScannedBarcodes.push(barcodeData);
                    _nex.orderManager.customData.credits++;  
                    _nex.orderManager.customData.successfulResponses.push(response);       
                    _nex.orderManager.customData.name = response.name;
                    
                    if ($("#txtCreditsLabel").length >0) {
                        $("#txtCreditsLabel").html(_nex.orderManager.customData.name);
                    }
                    if ($("#txtCreditsTotal").length >0) {
                        $("#txtCreditsTotal").html(_nex.orderManager.customData.credits);
                    }

                    if (response.hasOwnProperty("CDR") && response.CDR.hasOwnProperty("AVAILABLEITEM")) {
                        var sessionId = response.sessionid;
                        var availableItems = response.CDR.AVAILABLEITEM;
                        var newPosIdList = [];
                        for (var index = 0; index < availableItems.length; index++) {
                            var item = availableItems[index];
                            var newItem = {};
                            
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

                            // add to the list of pos ids
                            newPosIdList.push(newItem.posid);
                        }
                    }
                    
                    // For testing
                    _nex.orderManager.customData.posids.push(["202", "7001", "4002", "5001", "50007", "50014"]);

                    //_nex.orderManager.customData.posids.push(newPosIdList);

                    
                    self.debug('loyaltyInquiry', "Updating loyalty tender", response);
                    
                    // Tie a loyalty tender to the item.
                    var loyaltyTender = new TenderLoyalty();
                    loyaltyTender.update(response);
                    
                    // Set the loyalty response data. This will come in handy later when we send it back up to the API.
                    loyaltyTender.LOYALTYRESPONSE = {
                        "CDR": response.CDR
                    };
                    loyaltyTender.sessionId = sessionId;
                    _nex.orderManager.customData.loyaltyTenders.push(loyaltyTender);
        
                    self.debug("Loyalty tenders is now", _nex.orderManager.customData.loyaltyTenders);

                    $("#ctrl-continue").show();
                    $("#loyaltyscan-availablecredits #bnumber").text(_nex.orderManager.customData.credits);                    
                } else {
                    self.debug('loyaltyInquiry', "Received response failure", response);
                    
                    // show error popup
                    var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
                    popup.message =  _nex.assets.theme.getTextAttribute("CDR", "lookuperror", "Sorry, loyalty could not be processed.");;
                     _nex.assets.popupManager.showPopup(popup);
                } 
                
                // Restart the device listener for the next swipe.
                _nex.utility.deviceListener.start();

                //customerPageManager.gotoLoyaltyScan(response);
            }, "LOYALTYRESPONSE");  
        };

        // Callback after the user scans a barcode.
        self.loyaltyInquiry = function (deviceData) {
            self.debug('loyaltyInquiry', 'performing inquiry for device data', deviceData);

            // If they have already scanned the barcode, let them know.
            if (self.isAlreadyScanned(deviceData)) {
                // show error popup
                var popupAlreadyScanned = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
                popupAlreadyScanned.message =  _nex.assets.theme.getTextAttribute("CDR", "lookuperror", "Sorry, this barcode has already been scanned.");;
                 _nex.assets.popupManager.showPopup(popupAlreadyScanned);
            } else {
                // show process popup
                var processingPopup = $.extend(true, {}, _nex.assets.popupManager.processingPopup);
                processingPopup.message = _nex.assets.theme.getTextAttribute("CDR", "lookingupyouraccount", "Looking up your account");
                _nex.assets.popupManager.showPopup(processingPopup);
                self._performInquiry(deviceData);
                
            }
        };
        
        // Override the callback show.
        self.callbackShow = function () {
            self.debug("enter callbackshow");
            
            // Start the barcode listener.
            if (_nex.utility.deviceListener) {
                _nex.utility.deviceListener.stop();
                _nex.utility.deviceListener = null;
            }
            _nex.utility.deviceListener = new DeviceListener("BARCODE", self.loyaltyInquiry, true);
            _nex.utility.deviceListener.start();
            
            // Use case if they already scanned a barcode to start.
            if (_nex.splashPhase._deviceData) {
                self.loyaltyInquiry(_nex.splashPhase._deviceData);
                _nex.splashPhase._deviceData = ""; // clear it out so it isn't tried at payment
                _nex.splashPhase.userSwipedToStart = false; // clear this flag as well for the payment phase
            }
            
            // Reset the credits shown in the corner.
            $("#loyaltyscan-availablecredits #bnumber").text(_nex.orderManager.customData.credits); 
            
            // If they don't have any credits, they cannot continue.
            if (_nex.orderManager.customData.credits === 0) {
                $("#ctrl-continue").hide();
            } 
        };
        
        // Override the callback hide.
        self.callbackHide = function () {
            _nex.utility.deviceListener.stop();
        };     
    }
    inheritsFrom(LoyaltyScanPage, CustomPage); // Customer specific pages can inherit from CustomPage

    
    // Inject template behaviors.
    _nex.assets.templateManager.templateBehaviors.PassHolder =  {
        hasButtons: function (menu, template) {
            return false;
        },
        templateLoaded: function (menu, template) {
            // logic moved to JS file
        }
    };
    // Inject CheckCredits for later.
     _nex.assets.templateManager.templateBehaviors.CheckCredits =  {
        templateLoaded: function (menu, template) {
            // logic moved to JS file
        }
     };

    // Check an available button if it is white listed by the customer.
    _nex.ordering.checkAvailableButton = function (button, posid) {
        if (!_nex.orderManager.customData.hasOwnProperty("posids")) {
            return;
        }
        var listOfPOSIds = _nex.orderManager.customData.posids[_nex.orderManager.customData.index];
        button.foundInList = true;
        if (posid) {
            if ($.inArray(posid, listOfPOSIds) === -1) {
                button.foundInList = false;
            }
        }
    };
    
    // Remove an available button from the list of avialable buttons.
    _nex.ordering.removeAvailableButtons = function (availableButtons) {
        // This could be called filter logic, but there is already a concept of filtering in ordering that has to do
        // with the menu genie. This logic removes available buttons.
        // remove buttons that shouldn't be shown according to custom logic
        for (i = availableButtons.length - 1; i >= 0; i--) {
            var availableButton = availableButtons[i];
            if (availableButton.hasOwnProperty("foundInList")) {
                var foundInList = availableButton.foundInList;
                if (!foundInList) {
                    availableButtons.splice(i, 1);
                }
            }
        }
    };
    

    // Helper for checkCustomFilter.
    _nex.ordering._isInList = function (list, searchValue) {
        var result = false;
        for (var index = 0; index < list.length; index++) {
            var value = list[index];
            if (value === searchValue) {
                result = true;
                break;
            }
        }
        return result;
    };

    // Used during order review to disable the increase of quantity for special menu ids.
    _nex.ordering.checkCustomFilter = function (posid) {
        var result = false;
        if (_nex.orderManager.customData.hasOwnProperty("posids")) {
            var posids = _nex.orderManager.customData.posids;
            for (var index = 0; index < posids.length; index++) {
                var posidList = posids[index];
                //uncomment for debugging
                //console.log("Checking if the posid " + posid + " is in the list:", posidList);
                if (posidList.hasOwnProperty("length") && posidList.length > 0) {
                    if (_nex.ordering._isInList(posidList, posid)) {
                        //console.log("It is! Returning early.");
                        result = true;
                        break;
                    } else {
                        //console.log("It is not! You can still increase the quantity.");
                    }
                }
            }
        }
        return result;
    };

        
    // Expose the LoyaltyScanPage constructor globally and an instance.
    window.LoyaltyScanPage = LoyaltyScanPage;
    if (!window.hasOwnProperty("loyaltyScanPage")) {
        console.log("Creating loyaltyScanPage instance.");
        window.loyaltyScanPage = new LoyaltyScanPage("loyaltyscan-page");
        window.loyaltyScanPage.show();
    }

})(window);