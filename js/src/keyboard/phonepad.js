function Phonepad(soundManager) {
    var self = this;

    // Keep a data buffer.
    self.data = "";

    // Max length of the data buffer.
    self.MAXLENGTH = 10;

    // Callback when the last digit is found.
    self._lastDigitCallback = null;

    // Callback when a single digit is entered. Good for resetting timers.
    self._digitEnteredCallback = null;

    // Sound manager.
    self._soundManager = soundManager;
    if (!self._soundManager) {
        console.log("Missing required parameter sound manager to Phonepad.");
    }
    
    // Update 3 text boxes to show a 10 digit phone number.
    self._updatePhoneNumber = function () {
        var input1 = "";
        var input2 = "";
        var input3 = "";
        var elementId1 = "phone1";
        var elementId2 = "phone2";
        var elementId3 = "phone3";
        for (var index = 0; index < self.data.length; index++) {

            var digit = self.data[index];

            if (input1.length < 3) {
                // Put the first 3 characters in the first input.
                input1 += digit;
            } else if (input2.length < 3) {
                // Put the next 3 characters in the next.
                input2 += digit;
            } else {
                // Put the final 4 at the end.
                input3 += digit;
            }
        }
        document.getElementById(elementId1).value = input1;
        document.getElementById(elementId2).value = input2;
        document.getElementById(elementId3).value = input3;
    };
    
    // Update page elements that show output.
    self._updateOutput = function (newContent) {
        // Update the output textbox.
        self.write.val(newContent);

        // Update the phone number.
        self._updatePhoneNumber();
    };

    // Play a sound.
    self._playSound = function (character) {
        var number = Number(character);
  
        if (number >= 0) {
            if (self._soundManager && self._soundManager.playSoundByIndex) {
                // console.debug("Playing sound for number " + number);
                self._soundManager.playSoundByIndex(number);
            } else {
                // console.debug("Cannot play sound. Sound manager is not setup.");
            }
        }

    };
    
    // Mask out the phone number.
    self._mask = function (value) {
        var result = value;
        switch (value) {
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                console.debug("masking number");
                result = "*";
                break;
        }
        return result;
    };

    // Call this right after showing the popup.
    self.bindKeys = function (lastDigitCallback, digitEnteredCallback) {
        // This callback will be called when the last found digit is found.
        self._lastDigitCallback = lastDigitCallback;

        // This callback will be called when a single digit is entered.
        self._digitEnteredCallback = digitEnteredCallback;

        // Anything with a class of numpadTextOut will get written to.
        self.write = $('.numpadTextOut');

        // Clear out old data.
        self.write.html("");
        self.data = "";
        self._updateOutput("");

        // Remove previously attached event listeners.
        $('#phonepadInput li').unbind();

        // Whenever one of the keys is clicked ...
        $('#phonepadInput li').click(function () {
            // Get a jQuery object for the element that was clicked.
            var $this = $(this);

            // Get the character from the element that was clicked.
            var character = $this.html();

            // At this point, the character includes the span. 
            // Parse out the character from the span.
            if ($this.hasClass('symbol')) {
                character = $('span', $this).html();
            }

            // Check if it was the delete key that was pressed ...
            if ($this.hasClass('delete')) {
                self.data = self.data.substr(0, self.data.length - 1);
            } else {
                if (self.data.length < self.MAXLENGTH) {
                    self.data += character;
                }
            }

            // There was a usability issue where the numbers wouldn't appear right after you click
            // the phonepad buttons sometimes. Adding this timeout causes the browser to do
            // a DOM refresh right after the button is pressed, and the data is updated, so the
            // user can see the output updated immediately. 
            window.setTimeout(function () {
                self._updateOutput(self.data);
            }, 0);

            // Track a button click.
            _nex.utility.buttonTracking.track("", self._mask(character), "", "keyboard", "control");

            // Play a sound.
            self._playSound(character);

            // If we encounter the last digit, call the callback.
            if (self.data.length === self.MAXLENGTH) {
                if (typeof self._lastDigitCallback === 'function') {
                    console.debug("last digit found");
                    self._lastDigitCallback(self.data);
                }
            } else {
                if (typeof self._digitEnteredCallback === 'function') {
                    self._digitEnteredCallback(character);
                } 
            }
        });

    };
   
    
}