// Constructor.
function PaymentManager() {
    // The PaymentManager is started from Payment.
    // It starts up a clip to be played for the user to select the payment.
    // It then binds the buttons to that screen.
    // After the buttons are bound, clicking the buttons and the events that follow
    // (card swipes for example) control the flow of the process.
    // The button logic is in paymentButtons.js.
    
    // Make self synonymous with this.
    var self = this;

    // Enable/disable debugging for this class.
    self._enableDebugging = true;
    self._debug = function (message) {
        if (self._enableDebugging) {
            console.debug("PaymentManager: " + message);
        }
    };

    // These were the properties from the Flash and their types.
    //self._paymentTarget = null; //:MovieClip;
    //self._paymentClips = null; //:Dictionary;
    //self._paymentXml = null; //:XMLList;
    //self._clipIndex = 0; //:Number;
    //self._nextClipIndex = 0; //:Number;		
    //self._currentClip = null; //:BasePaymentClip;
    //self._clipStack = []; //:Array;
    //self._paymentEventHandler = null; //:PaymentEventHandler;
    //self._paymentMode = ''; //:String = null;

    // Keep track of the previous clip that was played (for the back button).
    self._previousClip = null;

    // Keep a reference to the current clip (HTML snippet) that is being shown.
    self._currentClip = null;

    // Initialize dependencies.
    self._paymentClipFactory = new PaymentClipFactory();
    self._paymentTenderFactory = new PaymentTenderFactory();
    self._paymentButtons = new PaymentButtons(self);
    
    // Call a custom callback function after a clip is selected.
    self._callbackClip = "";
    self._callback = function () {
        
    };

    //
    // Public methods
    //
    self.reset = function () {
        self._previousClip = null;
        if (self._currentClip !== null) {
            self._currentClip.hide();
        }
        self._currentClip = null;
    };

    // Leave the current clip, and go to a specified clip/snippet of HTML. 
    self.gotoClip = function (clipId) {
        self._debug("Going to clip " + clipId);

        // If there is already a clip being shown ...
        if (self._currentClip) {
            self._currentClip.hide();
            // mark it as the previous clip before be go to the next clip.
            self._previousClip = self._currentClip;
        }

        // Then go to the next clip. Pass in the callback after the clip has received all the data from the user,
        // for something like a MSR card swipe.
        var nextClip = self._paymentClipFactory.createPaymentClip(clipId);
        if (nextClip) {
            // Wire up any buttons that are found on the clip.
            self._paymentButtons.initialize();

            // Show the clip.
            nextClip.show();

            // Call the custom callback if appropriate.
            if (self._callbackClip === clipId) {
                console.log("paymentManager.gotoClip: Calling custom callback because " + self._callbackClip + " is " + clipId);
                self._callback();
            }

            // If they click anywhere in payment and they are in the previewer, shortcut to complete.
            if (inPreviewer()) {        
                $("#wrap").click(function () {
                    $("#wrap").unbind("click");
                    self._debug('In the previewer... going right to complete.');
                    _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.COMPLETE, function () {
                        _nex.complete.start();
                    });
                });
            }
        }

        // Set the current clip to the clip we are on.
        self._currentClip = nextClip;
    };

    // Go back to the previous clip.
    self.previousClip = function () {
        if (!self._previousClip) {
            return false;
        }
        self._currentClip.hide();
        self._previousClip.show();
        self._currentClip = self._previousClip;
        self._previousClip = false;
        return true;
    };

    // A callback can be registered when going to a specific clip.
    self.registerCallback = function (clipid, callback) {
        self._callbackClip = clipid;
        self._callback = callback;
    };

    // Update the receipt specific to payment.
    self.updateReceipt = function () {
        // This is a slimmed down version of the ordering receipt.
        var receipt = $("#receipt");
        
        if (receipt.length > 0) {
            self._debug("Found the payment receipt... Updating it...");

            if (_nex.orderManager.currentOrder.totals.subtotal !== undefined) {
                var totalsSubtotal = _nex.orderManager.currentOrder.totals.subtotal();

                var correctedTotal = correctMathError(Number(totalsSubtotal));
                if (correctedTotal > 0) {
                    var state = "visible";
                    var pulldownScript = ($('#receiptItemTemplate').length > 0) ? "_nex.ordering.showPulldownReceipt()" : "";
                    var updatedTotal = Number(_nex.orderManager.currentOrder.totals.subtotal());
                    if (updatedTotal > 0) {
                        var totalText = receipt.find('#txtTotal');
                        if (totalText.length > 0) {
                            self._debug('Updating txtTotal on the payment receipt');
                            totalText.empty();
                            totalText.append(currency.formatAsDollars(updatedTotal, true));
                            self._debug("Showing receipt");
                            $(".order-receipt").css("visibility", "visible"); // sometimes there is CSS that initially hides it... show it
                        } else {
                            self._debug('No txtTotal on the payment receipt');
                        }
                    }
                }
            }
        }
        else {
            self._debug('No payment receipt');
        }
    };
}