// Constructor.
function ExceptionHandler() {
    var self = this;

    // Call this function to log a message anytime an uncaught exception bubbles up to the top level.
    self.enable = function () {
        window.onerror = function (message, url, line, col, error) {
            // Chrome supports an onerror function with 3 parameters for message, url, and line.
            // Not all browsers may support this.
            // It also supports the col and error parameters. This one is used here.
            var result = "";
            if (url) {
                result += "URL: " + url + "\n\n";
            }
            if (line) {
                result += "Line: " + line + "\n\n";
            }
            if (col) {
                result += "Column: " + col + "\n\n";
            }
            if (message) {
                result += "Message: " + message + "\n\n";
            }

            // Log the actual error. This will send the writetolog statement too if console.log has been overridden to do so.
            if (console && console.log) {
                // Write the error message and stack trace.
                console.log(result);
                if (error && error.stack) {
                    console.log("Stack trace: ");
                    console.log(error.stack);
                }
            }
        };
    };

    // Call this function to disable logging uncaught exceptions.
    self.disable = function () {
        window.onerror = function (message, url, line) {
            // do nothing.
        };
    };
}
