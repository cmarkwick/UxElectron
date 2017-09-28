/**
 * A timer that calls a specified method on a specific object after so many seconds.
 * @constructor TimeoutTimer
 * @param {object} specifiedObject - e.g. window.
 * @param {function} specifiedMethod - e.g. alert.
 * @param {number} timeoutSeconds - e.g. 10.
 * @return 
 */
function TimeoutTimer(specifiedObject, specifiedMethod, timeoutSeconds) {
    // Setup constant properties.
    var MIN_TIMEOUT_SECONDS = 1;
    var MAX_TIMEOUT_SECONDS = 60 * 60 * 24; // Number of seconds in a day

    // Make sure what was passed is valid.
    _checkConstructorParameters(specifiedObject, specifiedMethod, timeoutSeconds, MIN_TIMEOUT_SECONDS, MAX_TIMEOUT_SECONDS);

    // Setup properties.
    var self = this;
    self.specifiedObject = specifiedObject;
    self.specifiedMethod = specifiedMethod;
    self.timeoutMilliseconds = timeoutSeconds * 1000;

    // Debugging
    self.enableDebugging = false;
    self.debug = function () {
        if (self.enableDebugging) {
            console.debug(arguments);
        }
    };

    // Start timer.
    self.start = function (args) {
        if (inPreviewer()) {
            return;
        }
        self.timeoutId = window.setTimeout(function () {
            _callFunction(self.specifiedObject, self.specifiedMethod, args);
        }, self.timeoutMilliseconds);
        self.debug("Started timer ", self.timeoutId);
    };

    // Stop timer.
    self.stop = function () {
        if (inPreviewer()) {
            return;
        }
        self.debug("Clearing timer ", self.timeoutId);
        window.clearTimeout(self.timeoutId);
    };

    // Restart the timer.
    self.restart = function () {
        if (inPreviewer()) {
            return;
        }
        self.stop();
        self.start();
    };

    // SUPPORTING FUNCTIONS

    // Helper to make sure the constructor paramaters are valid.
    function _checkConstructorParameters(specifiedObject, specifiedMethod, timeoutSeconds, minTimeout, maxTimeout) {
        if (typeof specifiedObject !== 'object') {
            throw "You must specify an object for the timer. Type is " + specifiedObject;
        }
        if (typeof specifiedMethod !== 'function') {
            console.log(specifiedMethod);
            throw "You must specifify a method to call for the timer.";
        }
        if (timeoutSeconds < minTimeout) {
            throw "Out of range exception for timeout. Timeout too small: " + timeoutSeconds + ". Must be greater than " + minTimeout;
        }
        if (timeoutSeconds > maxTimeout) {
            throw "Out of range exception. Timeout too large: " + timeoutSeconds + ". Must be less than " + maxTimeout;
        }
    }

    // Explicitly call a specific function on a specific object with certain arguments.
    function _callFunction(specifiedObject, specifiedMethod, specifiedArguments) {
        if (typeof specifiedObject !== "object") {
            throw "_callFunction: Must specify a valid object to call.";
        }
        if (typeof specifiedMethod !== "function") {
            throw "_callFunction: Must specify a valid function to call.";
        }
        specifiedMethod.call(specifiedObject, specifiedArguments);
    }
}

