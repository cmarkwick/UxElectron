// Represents a single repeat order button.
function RepeatOrderButton(buttonId, buttonSettings, callback) {
    var self = this;

    // Private properties.
    if (!buttonId) {
        throw "RepeatOrderButton: Missing required argument buttonId";
    }
    if (!buttonSettings) {
        throw "RepeatOrderButton: Missing required argument buttonSettings";
    }
    if (!callback) {
        throw "RepeatOrderButton: Missing required argument callback";
    }
    self._buttonId = buttonId;
    self._buttonSettings = buttonSettings; // the XML converted to JSON (has type, and whether it is enabled)
    self._callback = callback;

    // Return back the button id.
    self.getButtonId = function() {
        return self._buttonId;
    };

    // Get the settings for the button.
    self.getButtonSettings = function() {
        return self._buttonSettings;
    };

    // Get the callback function for the button.
    self.getCallback = function() {
        self._callback(self.getButtonSettings().type);
    };

    // Put an image on the button.
    self.setButtonImage = function(imagePath) {
        $("#" + self._buttonId).css("background-image", "url(" + imagePath + ")");
    };

    // Show the button using jQuery show.
    self.show = function() {
        $("#" + self._buttonId).show();
    };

    // Hide the button using jQuery hide.
    self.hide = function() {
        $("#" + self._buttonId).hide();
    };

    // Return the correct button text for the button.
    self.getButtonText = function(isPostOrdering) {
        // Taken from the Flash.
        var buttonType = self._buttonSettings.type.toString();
        var buttontextattribute = self._buttonSettings.buttontextattribute;
        var defaultText = "";
        switch (buttonType.toLowerCase())
        {
            case "phone":
                defaultText = "Phone Number";
                break;
            case "cancel":
                if (isPostOrdering) {
                    defaultText = "Go To Full Menu...";
                } else {
                    defaultText = "Complete order";
                }
                
                break;
            case "face":
                defaultText = "Facial Recognition";
                break;
            case "credit":
                defaultText = "Credit Card";
                break;
            case "loyalty":
                defaultText = "Gift Card";
                break;
            case "loyalty2":
                defaultText = "Rewards Card";
                break;
            case "generic1":
            case "generic2":
            case "generic3":
            case "generic4":
            case "generic5":
            case "generic6":
            case "generic7":
            case "generic8":
            case "generic9":
            case "generic10":
                defaultText = "Badge";
                break;
        }
        return _nex.assets.theme.getTextAttribute("REPEATORDERS", buttontextattribute, defaultText);
    };


}
