function Namepad() {

    var self = this;
    
    self._minLength = 1;
    self._maxLength = 50;
    self._popup = null;

	// Data buffer.
	self.data = "";

	// Whether or not the shift key is pressed.
	self.shift = false;

	// Whether or not capslock is on.
	self.capslock = true;

    // call to set the text that is entered
	self.updateText = function (text) {
	    self._updateOutput(text);
	    self.data = text;
	};

    // Update the output.
	self._updateOutput = function (newContent) {
	    // Update the output.
	    self.write.html(newContent);
	};

	self.setPopup = function (popup) {
	    self.write = $('.write');
	    self._updateOutput("");
	    self._popup = popup;
	};

    // Mask out certain characters on the keyboard.
	self._mask = function (value) {
	    var result = value;
	    var re = new RegExp("[a-zA-Z0-9]"); // letters and numbers
	    if (re.test(value)) {
	        result = "*";
	    }
	    return result;
	};

    // Call to setup keyboard bindings.
	self.bindKeys = function () {
	    // The output(s).
	    self.write = $('.write');
	    $("#pagernum").html("");	   
	    // Clear out old data.
	    self.write.html("");
	    self.data = "";
	    self._updateOutput("");

	    self._isValid(self.data);

	    // Remove previously attached event listeners.
	    $('#keyboard li').unbind();

	    $('#keyboard li').click(function () {
	        // At this point, the 'this' object is set to the element being clicked.
	        // "The jQuery function $ and many of the jQuery methods like click and animate return a jQuery object, which is part object and part array."
	        var $this = $(this);

	        // Get the character that was pressed.
	        var character = $this.html(); // If it's a lowercase letter, nothing happens to this variable

	        self.capslock = true;

	        // Delete
	        if ($this.hasClass('delete')) {
	            self.data = self.data.substr(0, self.data.length - 1);
	            self.write.html(self.data);
	            self._isValid(self.data);
	            //self.write.html(html.substr(0, html.length - 1));
	            _nex.utility.buttonTracking.track("", "[delete]", "", "keyboard", "control");
	            return false;
	        }

	        // Special characters
	        if ($this.hasClass('symbol')) character = $('span:visible', $this).html();
	        if ($this.hasClass('space')) character = ' ';
	        if ($this.hasClass('tab')) character = "\t";
	        if ($this.hasClass('return')) character = "\n";

	        character = character.toUpperCase();

            // Track the character... masking out certain ones.
	        _nex.utility.buttonTracking.track("", self._mask(character), "", "keyboard", "control");

	        // Add the character to our self.data buffer
	        self.data += character;

            // Update the output
	        self._updateOutput(self.data);

	        self._isValid(self.data);
	    });
	};

	self._isValid = function (value) {

	    var valid = true;

	    var elementId = self._popup.name;
	    // Use jQuery to get and hide the element.
	    var $element = $("#" + elementId);
	    for (var i = 0; i < self._popup.buttons.length; i++) {
	        if (self._popup.buttons[i].id.toLowerCase() === "ok") {
	        $element.find("#" + self._popup.buttons[i].id).prop('disabled', false);
	    }
	    }

	    if ((self._minLength > 0) &&
            (self._maxLength > 0)) {

	        valid = ((value.length >= self._minLength) && (value.length <= self._maxLength));

	        if (!valid) {
	            for (i = 0; i < self._popup.buttons.length; i++) {
	                if (self._popup.buttons[i].id.toLowerCase() === "ok") {
	                $element.find("#" + self._popup.buttons[i].id).prop('disabled', true);
	            }
	        }
	    }
	    }

	    return valid;
	};

	self.setMinLength = function (newlength) {
	    self._minLength = newlength || 1;
	    if (self._minLength === 0) {
	        self._minLength = 1;
	    }
	};

	self.setMaxLength = function (newlength) {
	    self._maxLength = newlength || 50;
	    if (self._maxLength === 0) {
	        self._maxLength = 50;
	    }
	};
}