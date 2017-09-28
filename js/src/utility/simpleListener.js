// The SimpleListener would not typically be used directly. It is intended to be
// used by the BarcodeListener, CardListener, or RFIDListener objects.
(function (window) {

    // Switch to strict mode to catch common mistakes as errors.
    "use strict";

    // The scope of this variable is the outer function.
    // It is a way to identify listeners from each other if there is more than one.
    // This is helpful for logging and troubleshooting.
    var nextId = 1;

    // Constructor. 
    var SimpleListener = function (keyCallback) {

        // Use self in place of this.
        var self = this;

        // Save a reference to the callback function to call whenever a new key is received.
        self._keyCallback = keyCallback;

        // Set the id of the listener to tell it apart from others.
        // Useful for debugging when multiple listeners are present.
        self.id = nextId;

        // Increment the listener count.
        nextId++;

        // PRIVATE METHODS

        // Private function used for getting the key data from the browser.
        self._receiveKey = function (event) {
            if (event) {
                if (!event.which) {
                    console.error("This browser does not support event.which, which is needed for key listening.");
                }

                // Get information about the key pressed.
                var which = event.which;

                // The character code for the key.
                var key = which;

                // The string for the key.
                var keyString = String.fromCharCode(which);

                // Call the callback with the key pressed information.
                //console.debug("Calling callback with " + key + " and " + keyString);
                self._keyCallback(key, keyString);
            }
        };

        // Private function attached to the listening event.
        self._listener = function (event) {
            self._receiveKey(event);
        };

        // PUBLIC METHODS

        // Start listening.
        self.startListening = function () {
            console.debug('start listening ' + self.id);
            window.addEventListener("keypress", self._listener, false);
        };

        // Stop listening.
        self.stopListening = function () {
            console.debug('stop listening ' + self.id);
            window.removeEventListener("keypress", self._listener, false);
        };
    };

    // Register the class style function on the global namespace.
    window.SimpleListener = SimpleListener;
})(window);