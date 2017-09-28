// Class for listening to any kind of devices: RFID, Card, Barcode, or ALL.
function DeviceListener(type, callback, stopOnLastKey) {

    var self = this;

    // Possible types.
    self.TYPE_CARD = "CARD";
    self.TYPE_BARCODE = "BARCODE";
    self.TYPE_RFID = "RFID";
    self.TYPE_ALL = "ALL";

    // Set enableDebugging to true to debug/troubleshoot any issues with the device listener.
    self.enableDebugging = true;
    self._debug = function() {
        if (self.enableDebugging) {
            console.debug("DeviceListener", self._type, arguments);
        }
    };

    // Set the type.
    if (!type) {
        type = "CARD";
    }
    self._type = type;

    // Get the type.
    self.getType = function() {
        return self._type;
    };

    // Set the callback property.
    self._callback = null;
    if (callback) {
        self._callback = callback;
    }

    // Set whether or not it should stop listening when the last key is found.
    self._stopOnLastKey = false;
    if (stopOnLastKey) {
        self._stopOnLastKey = true;
    }

    // Setup a complete method that handles the case where it should stop listening
    // when the last key is received.
    self.complete = function (data) {
        // Call the callback method if one was specified.
        if (self._callback) {
            self._callback(data);
        }

        // If we are supposed to stop listening on the last key, do that as well.
        if (self._stopOnLastKey) {
            self.stop();
        }
    };

    // When the last key is hit, these callback functions are called.
    self.lastBarcodeKey = function (data) {
        self._debug("Received last barcode key");
        self.complete(data);
    };
    self.lastCardKey = function (data) {
        self._debug("Received last card key");
        self.complete(data);
    };
    self.lastRFIDKey = function (data) {
        self._debug("Received last RFID key");
        self.complete(data);
    };

    // Wire up all the listeners... but don't start them.
    if (self._type === self.TYPE_BARCODE) {
        self._debug("Starting barcode listener");
        self.barListener = new BarcodeListener(self.lastBarcodeKey);
    } else if (self._type === self.TYPE_CARD) {
        self._debug("Starting card listener");
        self.cardListener = new CardListener(self.lastCardKey);
    } else if (self._type === self.TYPE_RFID) {
        self._debug("Starting RFID listener");
        self.rfidListener = new RFIDListener(self.lastRFIDKey);
    } else if (self._type === self.TYPE_ALL) {
        self._debug("Starting all listeners");
        self.barListener = new BarcodeListener(self.lastBarcodeKey);
        self.cardListener = new CardListener(self.lastCardKey);
        self.rfidListener = new RFIDListener(self.lastRFIDKey);
    }

    // Start listening.
    self.start = function () {
        var type = self._type;
        if (type === self.TYPE_BARCODE) {
            self.barListener.startListening();
        } else if (type === self.TYPE_CARD) {
            self.cardListener.startListening();
        } else if (type === self.TYPE_RFID) {
            self.rfidListener.startListening();
        } else if (type === self.TYPE_ALL) {
            self.barListener.startListening();
            self.cardListener.startListening();
            self.rfidListener.startListening();
        }
    };

    // Stop listening.
    self.stop = function () {
        var type = self._type;
        if (type === self.TYPE_BARCODE) {
            self.barListener.stopListening();
        } else if (type === self.TYPE_CARD) {
            self.cardListener.stopListening();
        } else if (type === self.TYPE_RFID) {
            self.rfidListener.stopListening();
        } else if (type === self.TYPE_ALL) {
            self.barListener.stopListening();
            self.cardListener.stopListening();
            self.rfidListener.stopListening();
        }
    };
}
