// Constructor.
function SetLanguageAction(theme) {
    var self = this;

    // Private properties
    self._theme = theme;
    self._langId = "";
    self._language = null; 
    self._buttonText = "";

    // Object initializer.
    self.initialize = function (langid, $buttonElement, defaultButtonText) {
        if (!langid) {
            console.log("Missing langid!");
            return;
        }
        if (!$buttonElement) {
            console.log("Missing parameter buttonElement!");
            return;
        }
        // Set the language properties.
        self._langid = langid;
        self._language = self._getLanguage(self._theme.system.LANGUAGE);
        console.debug("Language elements: ");
        console.debug(self._language);

        if (self._language !== null) {
            // Set the button text.
            self._buttonText = self._getLanguageButtonText(defaultButtonText);
            
            if (self._buttonText && self._buttonText.length > 0) {
                //  If we can get some type of button text on the button, put the text on the button.
                $buttonElement.text(self._buttonText);
            } else {
                //  If we can't get some type of button text on the button, hide the button.
                console.debug("Could not find any button text for the button.");
                self._hideLanguageButton($buttonElement);
            }
        } else {
            console.log("The language " + self._langid + " is not enabled... Hiding the button.");
            self._hideLanguageButton($buttonElement);
        }
    };


    // HELPER METHODS

    // Returns true if the language name matched the language id we are looking for.
    self._isLanguageMatch = function (language) {
        console.debug("Checking if language matches: " + language.name);
        var result = false;
        if (language.name && language.name.toLowerCase() === self._langid.toLowerCase()) {
            console.debug("...it does.");
            result = true;
        }
        return result;
    };

    // Returns true if the language element has the active attribute and it is set to true.
    self._isLanguageActive = function (language) {
        var result = false;
        console.debug("Checking if language is active: " + language.name);
        if (language.active && language.active === 'true') {
            console.debug("...it is.");
            result = true;
        }
        return result;
    };

    // Get the language out of the system language object.
    self._getLanguage = function (systemLanguage) {
        // Get the matching language that is active (if any) from the theme.LANGUAGE
        var result = null;
        var language = null;
        if (systemLanguage) {
            if (systemLanguage instanceof  Array) {
                for (var index = 0; index < systemLanguage.length; index++) {
                    language = systemLanguage[index];
                    if (self._isLanguageMatch(language) && self._isLanguageActive(language)) {
                        result = language;
                        break;
                    }
                }
            } else {
                language = systemLanguage;
                if (self._isLanguageMatch(language) && self._isLanguageActive(language)) {
                    result = language;
                }
            }
        }
        console.debug("Returning result: ");
        console.debug(result);
        return result;
    };

    // Hide the language button all together.
    self._hideLanguageButton = function ($languageButton) {
        $languageButton.hide();
        console.debug("setLanguageAction._hideLanguageButton: The language button is now hidden.");
    };

    // Get the text to put on the language button.
    self._getLanguageButtonText = function (defaultText) {
        console.debug("Trying to get language text for language ");
        result = _nex.assets.theme.getTextAttribute("ORDER", "language", defaultText);
        console.debug("... result found is " + result);
        return result;
    };

   
}
SetLanguageAction.prototype = Object.create(_BaseAction.prototype);