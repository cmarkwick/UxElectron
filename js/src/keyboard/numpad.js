function Numpad() {
    var self = this;

	// Maximum data length we will accept.
	self.MAX_LENGTH = 20;
	
	// Keep a data buffer.
	self.data = "";
	
    // Update the output box.
	self._updateOutput = function (newContent) {
	    // Update the output textbox.
	    self.write.val(newContent);
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
	    self.write = $('.numpadTextOut');

	    // Clear out old data.
	    self.write.html("");
	    self.data = "";
	    self._updateOutput("");

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
	            if (self.isNotMaxLength(self.data.length)) {
	                    self.data += character;
	            }
	        }
	        self._updateOutput(self.data);
	    });

	};

    //if there is a maxlength attribute on the pinpad input field.  
    //Use it otherwise check for MAX_LENGTH constant.
	self.isNotMaxLength = function (numLength) {

	    var maxLength = $("div.numpadOutput input[maxlength]").attr("maxlength");

	    if (maxLength === undefined) {
	        return numLength <= self.MAX_LENGTH;
	    } else {
	        var numpadVal = $("div.numpadOutput input[maxlength]").val();
	        return numpadVal.length <= maxLength;
	    }
    };

}