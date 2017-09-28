/**
 * A timer that calls a specified method on a specific object every so many seconds.
 * @constructor SimpleTimer
 * @param {object} specifiedObject - e.g. window.
 * @param {function} specifiedMethod - e.g. alert.
 * @param {number} frequencySeconds - e.g. 10.
 * @return 
 */
function SimpleTimer(specifiedObject, specifiedMethod, frequencySeconds) {
    // Setup constant properties.
    var MIN_FREQUENCY_SECONDS = 1;
    var MAX_FREQUENCY_SECONDS = 60 * 60 * 24; // Number of seconds in a day

    // Make sure what was passed is valid.
    _checkConstructorParameters(specifiedObject, specifiedMethod, frequencySeconds, MIN_FREQUENCY_SECONDS, MAX_FREQUENCY_SECONDS);

    // Setup properties.
    var self = this;
    self.specifiedObject = specifiedObject;
    self.specifiedMethod = specifiedMethod;
    self.frequencyMilliseconds = frequencySeconds * 1000;

    // Start the timer.
    self.start = function () {
        self.intervalId = window.setInterval(function () {
            _callFunction(self.specifiedObject, self.specifiedMethod);
        }, self.frequencyMilliseconds);
    };

    // Stop the timer.
    self.stop = function () {
        window.clearInterval(self.intervalId);
    };

    // Reset the timer.
    self.restart = function () {
        self.stop();
        self.start(); 
    };

    // SUPPORTING FUNCTIONS

    // Helper to make sure the constructor paramaters are valid.
    function _checkConstructorParameters(specifiedObject, specifiedMethod, frequencySeconds, minFrequency, maxFrequency) {
        if (typeof specifiedObject !== 'object') {
            throw "You must specify an object for the timer. Type is " + specifiedObject;
        }
        if (typeof specifiedMethod !== 'function') {
            console.log(specifiedMethod);
            throw "You must specifify a method to call for the timer.";
        }
        if (frequencySeconds < minFrequency) {
            throw "Out of range exception for frequency. Frequency too small: " + frequencySeconds + ". Must be greater than " + minFrequency;
        }
        if (frequencySeconds > maxFrequency) {
            throw "Out of range exception. Frequency too large: " + frequencySeconds + ". Must be less than " + maxFrequency;
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

