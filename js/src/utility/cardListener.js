// Constructor.
function CardListener(lastkeyCallback) {
    // Make self synonymous with this.
    var self = this;

    // PRIVATE PROPERTIES / METHODS

    // Store a reference to the function to call once the last key is received.
    self._lastkeyCallback = lastkeyCallback;

    // Initialize card data.
    self._cardData = new DeviceData();

    // Function to be called whenenever a card key is detected.
    self._receiveCardKey = function (key, keyString) {
        var result = self._cardData.appendCard(key, keyString);
        var track1Found = false;
        var track2Found = false;
        var track3Found = false;

        if (result) {
            // Check if track data was found
            if (result.track1 && result.track1.length > 0) {
                track1Found = true;
            } else if (result.track2 && result.track2.length > 0) {
                track2Found = true;
            } else if (result.track3 && result.track3.length > 0) {
                track3Found = true;
            }

            // If any track data was found on any of the tracks ...
            if (track1Found || track2Found || track3Found) {
                // console.debug(result);
                self._lastkeyCallback(result);
                self.clearData();
            }
        }
    };

    // Initialize simple listener.
    self._simpleListener = new SimpleListener(self._receiveCardKey);

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
        return self._cardData.getCard();
    };

    // Clear the data.
    self.clearData = function () {
        self._cardData.clear();
    };
}

