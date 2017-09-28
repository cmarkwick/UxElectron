// Constructor.
function RFIDListener(lastkeyCallback) {
    // Make self synonymous with this.
    var self = this;

    // PRIVATE PROPERTIES / METHODS

    // Store a reference to the function to call once the last key is received.
    self._lastkeyCallback = lastkeyCallback;

    // Initialize RFID data.
    self._rfidData = new DeviceData();

    // Function to be called whenenever a RFID key is detected.
    self._receiveRFIDKey = function (key, keyString) {
        var result = self._rfidData.appendRFID(key, keyString, 59); // semi-colon
        if (result && result.length > 0) {
            self._lastkeyCallback(result);
            self.clearData();
        }
    };

    // Initialize simple listener.
    self._simpleListener = new SimpleListener(self._receiveRFIDKey);

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
        return self._rfidData.get();
    };

    // Clear the data.
    self.clearData = function () {
        self._rfidData.clear();
    };
}

