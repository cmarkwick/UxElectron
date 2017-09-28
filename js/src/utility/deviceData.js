// Helper for storing, retrieving, and parsing data received from devices.
// Calls the callback function when the final character is received.
// Works with barcode data, RFID data, and card data. They are similar types of
// device data, so they are all grouped together in this class.
function DeviceData() {

    // Switch to strict mode to catch common mistakes as errors.
    "use strict";

    // Make self synonymous with this.
    var self = this;

    // PRIVATE PROPERTIES

    // Data for barcodes, RFIDs.
    self._data = "";

    // Track data. Special to cards.
    self._currentTrack = 0;
    self._track1 = "";
    self._track2 = "";
    self._track3 = "";

    // Whether or not the leading character was found.
    self._leadingCharReceived = false;

    // PUBLIC PROPERTIES/METHODS

    // Reset.
    self.clear = function () {
        self._data = "";
        self._track1 = "";
        self._track2 = "";
        self._track3 = "";
        self._leadingCharReceived = false;
    };

    // Return the data.
    self.get = function () {
        return self._data;
    };

    // Return card style data. Returns as a single object with 3 properties: track1, track2, and track3.
    self.getCard = function () {
        var result = {
            "track1": self._track1,
            "track2": self._track2,
            "track3": self._track3
        };
        return result;
    };

    // Append barcode style data.
    self.appendBarcode = function (key, keyString) {
        // Default the return value to empty string.
        var result = "";

        // Logic here follows along with the flash.
        if (key === 33) { // !
            //console.debug("-- key is 33. Leading character received.");
            self._leadingCharReceived = true;
        } else if (key !== 13 && key !== 10 && key !== 35 && self._leadingCharReceived) { // 35 is #
            //console.debug("-- key is data " + keyString + ". Appending to string " + keyString);
            self._data += keyString;
        } else if (key === 0) { // key is null
            //console.debug("-- key is null");
            //do nothing.... according to the flash, "key 0 is sent if the shift key is held down and sometimes when CAPS lock is enabled "
        } else if ((key === 13 && self._leadingCharReceived) ||
					(key === 10 && self._leadingCharReceived) ||
					(key === 0 && self._leadingCharReceived) ||
					(key === 35 && self._leadingCharReceived)) {  //13 (CR) is the end of the code, append until a CR is reached
            result = self.get();
        }
        return result;
    };

    // Append card style data.
    self.appendCard = function (key, keyString) {
        // Default the return value to empty string.
        var result = "";

        // Logic here follows along with the flash.

        // currentTrack 1 Case - ASCII 37 is "%"
        if (key === 37) {
            // console.debug("Card Swipe Listener - Track 1 detected. Setting self._currentTrack to 1.");
            self._currentTrack = 1;
            self._track1 = "%";

        } else if (key === 59) { // currentTrack 2 Case - ASCII 59 is ";"
            // console.debug("Card Swipe Listener - Track 2 detected. Setting self._currentTrack to 2.");
            self._currentTrack = 2;
            self._track2 = ";";

        } else if (key === 43) { // currentTrack 3 Case - ASCII 43 is "+"
            // console.debug("Card Swipe Listener - Track 3 detected. Setting self._currentTrack to 3.");
            self._currentTrack = 3;
            self._track3 = "+";

        } else if (key !== 13 && key !== 0) { // not carriage return or null
            if (self._currentTrack === 1) {
                // build up track one
                // console.debug("Building up track one " + keyString);
                self._track1 += keyString;
            }
            else if (self._currentTrack === 2) {
                // build up track two
                // console.debug("Building up track two " + keyString);
                self._track2 += keyString;
            }
            else if (self._currentTrack === 3) {
                // build up track three
                // console.debug("Building up track three " + keyString);
                self._track3 += keyString;
            }
        }
        else if ((self._track1.toUpperCase().indexOf("%QB3") === 0) || (self._track1.toUpperCase().indexOf("%ESC?") === 0)) // Starts with %QB3 or %ESC? TODO: Find out what to do for this?
        {
            result = self.getCard();
            console.info("%QB3 found in track one or %ESC");
        }

            // carriage return
        else if (key === 13) {
            // Per the Flash:
            // "When an ASCII 13 (enter) is received, the second character of track 1 is a "B" (bank card)
            // and current_track2 has a length of 0 then wait for track 2 otherwise process the card"	
            if (
					((self._track1.substr(1, 1) == "B") && (self._track2.length > 0)) || (self._track2.length > 0) || ((self._track1.substr(1, 1) != "B") && (self._track1.length > 0))) {
                if ((self._track1 != "%E?") && (self._track2 != ";E?")) {
                    // No exceptions found in track one or track two
                    result = self.getCard();
                }
                else {
                    // Exception found in either track one or track two
                    console.error("Exception found in track one or track two");
                    result = "ERROR";
                }
            } else {
                console.error("Unexpected newline key found.");
            }
        }

        return result;
    };

    // Append RFID style data.
    self.appendRFID = function (key, keyString, startCode) {
        // The start code was # in the flash... But sometimes it has been things like ; when testing. It is programmable to the device itself.
        if (!startCode) {
            startCode = 35; // #
        }

        // Default the return value to empty string. This is what is returned if we are before the end of the code.
        var result = "";

        // If the code is not newline, carriage return, null, or the start code (usually #)...
        if (key !== 13 && key !== 10 && key !== 0 && key !== startCode) {
            // append it to the string.
            self._data += keyString;
        }
        else if (((key === 13) ||
					(key === 10) ||
					(key === 0) ||
					(key === startCode)) && (self._data.length > 0))  //13 (CR) is the end of the code, append until a CR is reached
        {
            // CR was reached, raise the SCAN event and send the code down.
            // var evt:RFIDEvent = new RFIDEvent(RFIDEvent.SCAN);
            result = self.get();
        }

        return result;
    };
}
