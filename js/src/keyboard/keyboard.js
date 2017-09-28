function Keypad() {

    var self = this;

	// Data buffer.
	self.data = "";
	
	// Whether or not the shift key is pressed.
	self.shift = false;
	
	// Whether or not capslock is on.
	self.capslock = false;

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

	    // Clear out old data.
	    self.write.html("");
	    self.data = "";
	    self._updateOutput("");

        //override default email domain keys
	    var emaildomain1 = _nex.assets.theme.system.USERINTERFACE.EMAILDOMAIN.value1;
	    var emaildomain2 = _nex.assets.theme.system.USERINTERFACE.EMAILDOMAIN.value2;
	    var emaildomain3 = _nex.assets.theme.system.USERINTERFACE.EMAILDOMAIN.value3;

        
	    if (_nex.assets.theme.system.USERINTERFACE.EMAILDOMAIN !== undefined && _nex.assets.theme.system.USERINTERFACE.EMAILDOMAIN !== "") {
	        if (emaildomain1 !== undefined && emaildomain1 !== "") {
	            $("#emaildomain1").text(emaildomain1);
	        }

	        if (emaildomain2 !== undefined && emaildomain2 !== "") {
	            $("#emaildomain2").text(emaildomain2);
	        }

	        if (emaildomain3 !== undefined && emaildomain3 !== "") {
	            $("#emaildomain3").text(emaildomain3);
	        }
	    }

	    // Remove previously attached event listeners.
	    $('#keyboard li').unbind();

	    $('#keyboard li').click(function () {
	        // At this point, the 'this' object is set to the element being clicked.
	        // "The jQuery function $ and many of the jQuery methods like click and animate return a jQuery object, which is part object and part array."
	        var $this = $(this);

	        // Get the character that was pressed.
	        var character = $this.html(); // If it's a lowercase letter, nothing happens to this variable

	        // Shift keys
	        if ($this.hasClass('left-shift') || $this.hasClass('right-shift')) {
	            $('.letter').toggleClass('uppercase');
	            $('.symbol span').toggle();

	            self.shift = (self.shift === true) ? false : true;
	            self.capslock = false;

	            // Track the click.
	            _nex.utility.buttonTracking.track("", "[shift]", "", "keyboard", "control");
	            return false;
	        }

	        // Caps lock
	        if ($this.hasClass('capslock')) {
	            $('.letter').toggleClass('uppercase');
	            self.capslock = true;
	            _nex.utility.buttonTracking.track("", "[capslock]", "", "keyboard", "control");
	            return false;
	        }

	        // Delete
	        if ($this.hasClass('delete')) {
	            self.data = self.data.substr(0, self.data.length - 1);
	            self.write.html(self.data);
	            //self.write.html(html.substr(0, html.length - 1));
	            _nex.utility.buttonTracking.track("", "[delete]", "", "keyboard", "control");
	            return false;
	        }

	        // Special characters
	        if ($this.hasClass('symbol')) character = $('span:visible', $this).html();
	        if ($this.hasClass('space')) character = ' ';
	        if ($this.hasClass('tab')) character = "\t";
	        if ($this.hasClass('return')) character = "\n";

	        // Uppercase letter
	        if ($this.hasClass('uppercase')) character = character.toUpperCase();

	        // Remove shift once a key is clicked.
	        if (self.shift === true) {
	            $('.symbol span').toggle();
	            // if caps lock is not un
	            if (self.capslock === false) {
	                // make the characters upper-case
	                $('.letter').toggleClass('uppercase');
	            }
	            // set shift back to false
	            self.shift = false;
	        }

            // Track the character... masking out certain ones.
	        _nex.utility.buttonTracking.track("", self._mask(character), "", "keyboard", "control");

	        // Add the character to our self.data buffer
	        self.data += character;

            // Update the output
	        self._updateOutput(self.data); 
	    });
	};
}