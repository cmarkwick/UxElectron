function Numpad() {
	// Maximum data length we will accept.
	var MAX_LENGTH = document.getElementById('maxLength').value;
	
	// Keep a data buffer.
	var data = "";
	
	// Anything with a class of numpadTextOut will get written to.
	var $write = $('.numpadTextOut');
	
	function updateOutput(newContent) {
		// Update the output textbox.
		$write.val(newContent);
		
		// Update the phone number.
		//updatePhoneNumber(newContent);
	}
	
	// Whenever one of the keys is clicked ...
	$('#numpadInput li').click(function(){
		
		// Get a jQuery object for the element that was clicked.
		var $this = $(this);
		
		// Get the character from the element that was clicked.
		var character = $this.html(); 
		
		// At this point, the character includes the span. 
		// Parse out the character from the span.
		if ($this.hasClass('symbol')) {
			character = $('span:visible', $this).html();
		}
		
		// Check if it was the delete key that was pressed ...
		if ($this.hasClass('delete')) {
			data = data.substr(0, data.length - 1);
		} else {
			if (data.length < MAX_LENGTH) {
				data += character;
			}
		}

		updateOutput(data);
	});
}

$( document ).ready(function() {
    var numpad = new Numpad();
});