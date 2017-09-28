// A utility for binding and unbinding HTML buttons.
// Inject parameters for setting button text, tracking click, and playing the button hit.
function ButtonBinder(setControlButtonText, setButtonText, trackClick, playButtonHit) {
    var self = this;

    // Dependency injection.
    self._setControlButtonText = setControlButtonText;
    self._setButtonText = setButtonText;
    self._trackClick = trackClick;
    self._playButtonHit = playButtonHit;

    // Debugging.
    self._debugEnabled = false;
    self._debug = function () {
        console.debug("ButtonBinder", arguments);
    };

    // Bind the button.
    self.bind = function (buttonId, buttonText, clickCallback, isControlButton, cssClass) {
        // This logic was in several spots. Move it to one for consistency.
        var button = $("#" + buttonId);
        if (button.length === 0) {
            self._debug("ButtonBinder", "Could not find button " + buttonId);
            return;
        }

        // Set the text on the button. If it is a control button, use a special method designed for that,
        // which will look for #btext.
        if (isControlButton) {
            self._setControlButtonText(buttonId, buttonText);
        } else {
            self._setButtonText(buttonId, buttonText);
        }

        // Set what happens when you click the button.
        button.unbind("click");
        button.click(function () {
            // Track a click.
            self._trackClick(button);

            // Play a sound.
            self._playButtonHit();

            // Call the callback.
            if (clickCallback) {
                clickCallback();
            }
        });

        if (cssClass) {
            button.addClass(cssClass);
        }
    };

    // Unbind the button.
    self.unbind = function () {
        var button = $("#" + buttonId);
        if (button.length > 0) {
            button.unbind("click");
        }
    };
}
