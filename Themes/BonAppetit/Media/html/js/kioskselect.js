(function(window) {
    // Log that the page was loaded.
    console.log("--- kioskselect.js ---");
    
    // PaymentSelect constructor.
    function PaymentSelect() {
        var self = this;
        
        // Standard debugging.
        self.debugEnabled =  true;
        self.debug = function () {
            if (self.debugEnabled) {
                console.log("PaymentSelect", arguments);
            }
        };
        
        // Properties.
        self.addingTender = false;
        self.processingLoyalty = false;
        self.enoughCollected = false;
        self.currentTenderIndex = 0;
        
        // Once all the tenders are processed, process the entire order if enough has been collected.
        self.processOrder = function () {
            self.debug("Processing the order.");
            var requestObject = new _nex.commands.ProcessOrder(_nex.ordering.orderManager.currentOrder);
            _nex.communication.send(requestObject, _nex.payment.orderProcessed, "ORDERPROCESSED");
        };
        
        // Process a single loyalty tender.
        self.processLoyalty = function (loyaltyTender) {
            self.enoughCollected = false;
            
            // Send TENDERADDED. This does not put it on the tender stack, just sets the selected tender.
            var addTenderRequest = new _nex.commands.AddTender('loyalty');
            _nex.communication.send(addTenderRequest, function (tenderAddedResponse) {
                
                // No longer adding a tender... set the flag back.
                self.addingTender = false;
                
                if (tenderAddedResponse.added === "true") {
                    self.debug("Processing loyalty tender ", loyaltyTender, loyaltyTender.getValue());
                    
                    // Send the PROCESSLOYALTY command.
                    var command = new _nex.commands.ProcessLoyalty(loyaltyTender, loyaltyTender.getValue());
                    _nex.communication.send(command, function (response) {
                        self.debug("Received response.", response);
                       
                        // No longer doing process loyalty... set a flag.
                        self.processingLoyalty = false;
                        
                         // Update the order.
                        if (response.ORDER) {
                            self.debug("Updating current order to: ", response.ORDER);
                            _nex.orderManager.currentOrder.update(response.ORDER);
                        }

                        // If enough has been collected.
                        if (response.message === "ENOUGH_COLLECTED") {
                            self.enoughCollected = true;
                        } else {
                            // Hide the back button now that a tender has been applied.
                            $("#ctrl-back").hide();

                            self.debug('A tender has been applied.... but it is not enough... Staying at select payment so the customer can apply additional tenders.');        
                        } 
                    }, "PROCESSLOYALTYRESPONSE");
                } else {
                    console.log("Could not set selected tender for loyalty!!");
                    var processingPopup = $.extend(true, {}, _nex.assets.popupManager.processingPopup);
                    processingPopup.message = _nex.assets.theme.getTextAttribute("CDR", "processingloyalty", "There was an exception adding the tender.");
                    _nex.assets.popupManager.showPopup(processingPopup);  
                    
                }   
                
            }, "TENDERADDED");
        };
        
        // Process the next tender.
        self.processNextTender = function () {
            var loyaltyTenders = _nex.orderManager.customData.loyaltyTenders;
            var loyaltyTender = loyaltyTenders[self.currentTenderIndex];
            self.debug("Processing tender", loyaltyTender);
            self.processLoyalty(loyaltyTender);
        };
        
        // Process all the tenders.
        self.processTenders = function () {
            console.debug("enter processTenders");
            if (self.currentTenderIndex >= _nex.orderManager.customData.loyaltyTenders.length) {
                console.debug("All the tenders are processed. Exit.");
                
                // Hide the processing popup once we are done. This will be hidden in payment if enough was collected.
                if (!self.enoughCollected) {
                    _nex.assets.popupManager.hidePopup(_nex.assets.popupManager.processingPopup);
                }
                return;
            }
            
            // If we are already processing loyalty or adding a tender, wait;
            // otherwise, process the next tender.
            if (self.processingLoyalty || self.addingTender) {
                console.debug("waiting ...");
            } else {
                console.debug("processing the next tender.");
                self.addingTender = true;
                self.processingLoyalty = true;
                self.processNextTender();
                self.currentTenderIndex++;
            }
            
            // Stay within here until all the tenders are processed.
            window.setTimeout(function() {
                self.processTenders();
            }, 100);
        };

        
        // Do custom customer specific logic. In this case, for Cedar Fair.
        self.doCustomLogic = function () {
            self.debug('doCustomLogic - start');

            if (_nex.orderManager.customData.hasOwnProperty("loyaltyTenders")) {
                self.debug('Processing payment');
                
                // Show the processing popup.
                var processingPopup = $.extend(true, {}, _nex.assets.popupManager.processingPopup);
                processingPopup.message = _nex.assets.theme.getTextAttribute("CDR", "processingloyalty", "Processing passes.");
                _nex.assets.popupManager.showPopup(processingPopup);  
                
                // Process all the loyalty tenders.
                self.processTenders();        
            } else {
                self.debug("No loyalty tenders to apply.");
            }
            

            self.debug('doCustomLogic - exit');    
        };
    
    }
    
    // Expose the constructor globally and an instance.
    window.PaymentSelect = PaymentSelect;
    if (!window.hasOwnProperty("paymentSelect")) {
        console.log("Initializing payment select");
        window.paymentSelect = new PaymentSelect();
        window.paymentSelect.doCustomLogic();
    }
    
})(window);