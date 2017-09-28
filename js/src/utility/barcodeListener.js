// Constructor.
function BarcodeListener(lastkeyCallback) {
    // Make self synonymous with this.
    var self = this;

    // PRIVATE PROPERTIES / METHODS

    // Store a reference to the function to call once the last key is received.
    self._lastkeyCallback = lastkeyCallback;

    // Initialize the data object with a reference to the callback for the last barcode key.
    self._barcodeData = new DeviceData();

    // Function to be called whenenever a barcode key is detected.
    self._receiveBarcodeKey = function (key, keyString) {
        // console.debug("Received barcode key " + key + ": " + keyString + ";");
        var result = self._barcodeData.appendBarcode(key, keyString);
        if (result && result.length > 0) {
            self._lastkeyCallback(result);
            self.clearData();
        }
    };

    // Initialize simple listener.
    self._simpleListener = new SimpleListener(self._receiveBarcodeKey);


    // PUBLIC METHODS

    // Start listening for key events.
    self.startListening = function () {
        self._simpleListener.startListening();
    };

    // Stop listening for key events.
    self.stopListening = function () {
        self._simpleListener.stopListening();
    };

    // Get the data.
    self.getData = function () {
        return self._barcodeData.get();
    };

    // Clear the data.
    self.clearData = function () {
        self._barcodeData.clear();
    };
}

