function Keyboard() {
	
	// Data buffer.
	var data = "";
	
	// The output.
	var $write = $('#write');
	
	// Whether or not the shift key is pressed.
	var shift = false;
	
	// Whether or not capslock is on.
	var capslock = false;
	
	$('#keyboard li').click(function(){
		// At this point, the 'this' object is set to the element being clicked.
		// "The jQuery function $ and many of the jQuery methods like click and animate return a jQuery object, which is part object and part array."
		var $this = $(this);
		
		// Get the character that was pressed.
		var character = $this.html(); // If it's a lowercase letter, nothing happens to this variable
		
		// Shift keys
		if ($this.hasClass('left-shift') || $this.hasClass('right-shift')) {
			$('.letter').toggleClass('uppercase');
			$('.symbol span').toggle();
			
			shift = (shift === true) ? false : true;
			capslock = false;
			return false;
		}
		
		// Caps lock
		if ($this.hasClass('capslock')) {
			$('.letter').toggleClass('uppercase');
			capslock = true;
			return false;
		}
		
		// Delete
		if ($this.hasClass('delete')) {
			data = data.substr(0, data.length - 1);
			$write.html(data);
			//$write.html(html.substr(0, html.length - 1));
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
		if (shift === true) {
			$('.symbol span').toggle();
			// if caps lock is not un
			if (capslock === false) {
				// make the characters upper-case
				$('.letter').toggleClass('uppercase');
			}
			// set shift back to false
			shift = false;
		}
		
		// Add the character to our data buffer
		data += character;
		
		// Update the output.
		$write.html(data);
		//$write.val($write.val() + character);
	});
}


$( document ).ready(function() {
    var keyboard = new Keyboard();
});