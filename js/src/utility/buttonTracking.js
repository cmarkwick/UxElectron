// A utility for button tracking.
function ButtonTracking(systemSettings) {

    var self = this;

    // Shorthand for related settings.
    self.trackMenuButton = ((systemSettings !== undefined) && (systemSettings.menu !== undefined)) ? systemSettings.menu : "true";
    self.trackPaymentButton = ((systemSettings !== undefined) && (systemSettings.payment !== undefined)) ? systemSettings.payment : "true";
    self.trackLanguageButton = ((systemSettings !== undefined) && (systemSettings.language !== undefined)) ? systemSettings.language : "true";
    self.trackGreenReceiptButton = ((systemSettings !== undefined) && (systemSettings.greenreceipt !== undefined)) ? systemSettings.greenreceipt : "true";
    self.trackControlButton = "true"; // always track control buttons TODO: Verify this is right.

    // Keep an array of the tracked buttons.
    self.trackedButtonList = [];

    // Set to true to show button hits in the console/log.
    self.debugButtonHits = false;

    // If debug hits is enabled, writes something to the console window.
    self._debugButtonHit = function (message) {
        if (self.debugButtonHits) {
            console.debug(message); // Switch to log to put in the UI client log.
        }
    };

    // Called after the buttons have been logged.
    self.reset = function () {
        self.trackedButtonList = [];
    };

    // Convert to an attribute value that is expected.
    // Returns empty string or a value >= 0.
    // This follows the data in the ButtonUsage table.
    self._convertToAttribute = function (value) {
        var MIN = 0;
        var result = "";
        if (value) {
            var numeric = parseInt(value);
            if (isNaN(numeric)) {
                result = "";
            } else if (numeric < MIN) {
                result = "";
            } else {
                result = numeric;
            }
        }
        return result;
    };

    // Validate that a property is valid.
    self._cleanProperty = function (propName, value) {
        var MAXLENGTH64 = 64; // A lot of times there is a maximum length that this content can be. We want to strip off characters past this limit.
        var MAXLENGTH128 = 128;

        var result = "";

        switch (propName) {
            case "id":
                // The buttonnumber in the XML.
                result = self._convertToAttribute(value);
                break;
            case "text":
                result = value.substring(0, MAXLENGTH64);
                break;
            case "phase":
                result = value.substring(0, MAXLENGTH64);
                break;
            case "menuid":
                // The menuid in the XML.
                result = self._convertToAttribute(value);
                break;
            case "context":
                result = value.substring(0, MAXLENGTH128);
                break;
            case "buttontype":
                // Should be numeric.
                result = self._getType(value);
                break;
        }

        return result;
    };

    // Called by the command object OrderUsage.
    self.writeButtonUsage = function () {
        var result = [];
        for(var index = 0; index < self.trackedButtonList.length; index++)
        {
            var button = self.trackedButtonList[index];
            var propValue;
            var buttonResult = {};
            for (var propName in button) {
                if (propName === "id" || propName === "text" || propName === "phase" || propName === "menuid" || propName === "context" || propName === "buttontype") {
                    propValue = button[propName];
                    // An error will happen trying to insert the data if the property values are not valid.
                    propValue = self._cleanProperty(propName, propValue);
                    //console.debug("setting " + propName + " to " + propValue);
                    buttonResult[propName] = propValue;
                }
            }
            result.push(buttonResult);
        }
        return {
            "BUTTON": result
        };
    };

    // All in one method to create tracking data and track it.
    self.track = function (id, text, menuid, context, type) {
        var trackButtonData = self._create(id, text, menuid, context, type);
        self._addToBuffer(trackButtonData);
    };

    // Create a button tracking object.
    self._create = function (id, text, menuid, context, type) {
        var result = {};
        result.id = id;
        result.text = $.trim(text); 
        result.phase = _nex.manager.phaseManager.currentPhase;
        result.menuid = "";
        if (menuid) {
            result.menuid = menuid;
        }
        result.context = ""; // context can be menu text or something like ORDER REVIEW
        if (context) {
            result.context = context;
        }
        result.buttontype = ""; 
        if (type) {
            result.buttontype = type;
        }
        return result;
    };

    self._getType = function (typeString) {
        var result = 0;
        switch (typeString) {
            case "menu":
                result = 0;
                break;
            case "payment":
            case "complete":
                result = 1; // Payment and complete are button type 1 in the Flash.
                break;
            case "language":
                result = 2;
                break;
            case "green":
                result = 3;
                break;
            case "control":
                result = 4;
                break;
        }
        return result;
    };

    // Add the tracking data to the buffer.
    self._addToBuffer = function (button) {

        // If the button exists, push information about the button.
        if (button) {
            switch (button.buttontype) {
                case "menu":
                    if (self.trackMenuButton === "true") {
                        self._debugButtonHit("[Tracking menu button]");
                        self.trackedButtonList.push(button);
                    } else {
                        self._debugButtonHit("[NOT Tracking menu button]");
                    }
                    break;
                case "payment":
                    if (self.trackPaymentButton === "true") {
                        self._debugButtonHit("[Tracking payment button]");
                        self.trackedButtonList.push(button);
                    } else {
                        self._debugButtonHit("[NOT Tracking payment button]");
                    }
                    break;
                case "language":
                    if (self.trackLanguageButton === "true") {
                        self._debugButtonHit("[Tracking language button]");
                        self.trackedButtonList.push(button);
                    } else {
                        self._debugButtonHit("[NOT Tracking language button]");
                    }
                    break;
                case "green":
                    if (self.trackGreenReceiptButton === "true") {
                        self._debugButtonHit("[Tracking green button]");
                        self.trackedButtonList.push(button);
                    } else {
                        self._debugButtonHit("[NOT Tracking green button]");
                    }
                    break;
                case "control": 
                    if (self.trackControlButton === "true") {
                        self._debugButtonHit("[Tracking control button]");
                        self.trackedButtonList.push(button);
                    } else {
                        self._debugButtonHit("[NOT Tracking control button]");
                    }
                    break;
            }
        } else {
            self._debugButtonHit("[Invalid button]");
        }
    };

}

