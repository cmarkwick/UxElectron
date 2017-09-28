function Phonepad() {
    // Keep a data buffer.
    var data = "";
    
    // Anything with a class of numpadTextOut will get written to.
    var $write = $('.numpadTextOut');
    
    // Update 3 text boxes to show a 10 digit phone number.
    function updatePhoneNumber(newContent) {
        var input1 = "";
        var input2 = "";
        var input3 = "";
        var elementId1 = "phone1";
        var elementId2 = "phone2";
        var elementId3 = "phone3";
        console.debug("Updating phone number.");
        for (var index = 0; index < data.length; index++) {
            
            var digit = data[index];
            console.debug("Appending digit " + digit);

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
        console.debug("Setting input 1 to " + input1);
        document.getElementById(elementId1).value = input1;
        document.getElementById(elementId2).value = input2;
        document.getElementById(elementId3).value = input3;
    }
    
    function updateOutput(newContent) {
        // Update the output textbox.
        $write.val(newContent);
        
        // Update the phone number.
        updatePhoneNumber(newContent);
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
            if (data.length < 10) {
                data += character;
            }
        }

        updateOutput(data);
    });
    
}

$( document ).ready(function() {
    var phonepad = new Phonepad();
});