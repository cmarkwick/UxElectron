function Pagerpad() {
    var self = this;

	// Maximum data length we will accept.
	self.MAX_LENGTH = 3;
	self._minValue = -1;
	self._maxValue = -1;

	// Keep a data buffer.
	self.data = "";
	self._popup = null;

    // Update the output box.
	self._updateOutput = function (newContent) {
	    // Update the output textbox.
	    self.write.val(newContent);
	};

	self.setPopup = function (popup) {
	    self.write = $('.pagerpadTextOut');
	    self._updateOutput("");
	    self._popup = popup;
	};

    // Mask out the number pad values so pins aren't captured in ORDERUSAGE.
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
	            result = "*";
	            break;
	    }
	    return result;
	};

    // Bind the keys.
	self.bindKeys = function () {
	    // Anything with a class of numpadTextOut will get written to.
	    self.write = $('.pagerpadTextOut');
	    $("#pagernum").html("");
	    // Clear out old data.
	    self.write.html("");
	    self.data = "";
	    self._updateOutput("");

	    self._isValid(self.data);

	    // Remove previously attached event listeners.
	    $('#numpadInput li').unbind();

	    // Whenever one of the keys is clicked ...
	    $('#numpadInput li').click(function () {
	        // Get a jQuery object for the element that was clicked.
	        var $this = $(this);

	        // Get the character from the element that was clicked.
	        var character = $this.html();

	        // At this point, the character includes the span.
	        // Parse out the character from the span.
	        if ($this.hasClass('symbol')) {
	            character = $('span:visible', $this).html();
	        }

	        // Track the click.
	        _nex.utility.buttonTracking.track("", self._mask(character), "", "numpad", "control");

	        // Check if it was the delete key that was pressed ...
	        if ($this.hasClass('delete')) {
	            self.data = self.data.substr(0, self.data.length - 1);
	        } else {
	            if (self.data.length < self.MAX_LENGTH) {
	                self.data += character;
	            }
	        }
	        self._updateOutput(self.data);

	        var valid = self._isValid(self.data);

	        if (valid &&
                (self.data.length === self.MAX_LENGTH) &&
                (self._popup !== null)) {
	            var elementId = self._popup.name;
                // Use jQuery to get and hide the element.
	            var $element = $("#" + elementId);
	            $element.find("#" + self._popup.buttons[0].id).trigger("click");
	        }
	    });
	};

	self._isValid = function (value) {

	    value = (isNaN(value)) ? -1 : Number(value);
        var valid = true;

        var elementId = self._popup.name;
	    // Use jQuery to get and hide the element.
        var $element = $("#" + elementId);
        for (var i = 0; i < self._popup.buttons.length; i++) {
            if (self._popup.buttons[i].id.toLowerCase() === "ok") {
            $element.find("#" + self._popup.buttons[i].id).prop('disabled', false);
        }
        }
       
	    if ((self._minValue > 0) && 
            (self._maxValue > 0)) {
	        
	        valid = ((value >= self._minValue) && (value <= self._maxValue));

	        if(!valid) {
	            for (i = 0; i < self._popup.buttons.length; i++) {
	                if (self._popup.buttons[i].id.toLowerCase() === "ok") {
	                $element.find("#" + self._popup.buttons[i].id).prop('disabled', true);
	            }
	        }
	    }
	    }

	    return valid;
	};

	self.setMaxLength = function (newlength) {
	    self.MAX_LENGTH = newlength || 3;
	    if (self.MAX_LENGTH === 0) {
	        self.MAX_LENGTH = 3;
	    }
	};
	self.setMinValue = function (minValue) {
	    self._minValue = minValue || -1;
	};

	self.setMaxValue = function (maxValue) {
	    self._maxValue = maxValue || -1;
	};
}