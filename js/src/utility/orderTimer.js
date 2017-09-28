/**
 * The OrderTimer keeps track of how much time has been spent on the current order.
 * When too much time has been spent, it produces a popup message to ask the user if they need more time.
 * If they don't respond soon enough, then it kicks them back to the main screen.
 * If they click 'yes' that they do more time, it lets them stay on the current screen.
 * At times like payment we don't want to kick them back... and if for whatever the reason the timer
 * expires and they are in a phase it doesn't make sense to show them the popup (e.g. the popup started
 * and then expired unexpectedly at a different screen than usual), we want to not show the popup.
 *
 * @constructor OrderTimer
 * @param {object} popupManager - The popup manager.
 * @param {string} messageText - The message to display in the popup.
 * @param {object} phaseManager - The phase manager.
 * @param {object} callbackScript - The callback script if the user clicks 'yes'.
 */
function OrderTimer(popupManager, messageText, phaseManager, callbackScript) {

    // Store self for object context in events.
    var self = this;

    // CONSTANTS
    var SECONDS_BEFORE_POPUP = 24; // user has 24 seconds before they see the popup
    var SECONDS_FOR_RESPONSE = 4; // user has 4 seconds to respond to the dialogue
    
    // PRIVATE VARIABLES

    // use the phase manager to decide whether or not action is needed.
    var _phaseManager = phaseManager;

    if(_nex.assets.theme.system.hasOwnProperty("ordertimeout") &&
        _nex.assets.theme.system.ordertimeout.length > 0) {
        SECONDS_BEFORE_POPUP = Number(_nex.assets.theme.system.ordertimeout);
        if (SECONDS_BEFORE_POPUP > 86280) {
            SECONDS_BEFORE_POPUP = 86280;
        }
    }

    if (_nex.assets.theme.system.hasOwnProperty("needmoretime") &&
        _nex.assets.theme.system.needmoretime.length > 0) {
        SECONDS_FOR_RESPONSE = Number(_nex.assets.theme.system.needmoretime);
        if (SECONDS_FOR_RESPONSE > 120) {
            SECONDS_FOR_RESPONSE = 120;
        }
    }

    // timer logic
    var _doubleTimer = new DoubleTimer(self, _orderTimerExpired, SECONDS_BEFORE_POPUP,
        self, _noResponse, SECONDS_FOR_RESPONSE);

    // popup logic
    var _popup = new NeedMoreTimePopup(popupManager, messageText, callbackScript);

    // PUBLIC METHODS

    // Start/restart the timers. 
    self.restart = function () {
        _smartRestart();
    };

    self.stop = function () {
        _hidePopup();
        _doubleTimer.stop();
    };

    // When the user clicks yes for need more time.
    self.needMoreTimeClicked = function () {
        // Log for informational purposes back to the UI manager.
        console.log("User clicked 'yes' that they need more time.");

        // Hide the popup that shows whether or not more time is needed.
        _hidePopup();

        // Restart the timers if needed.
        _smartRestart();
    };
    
    // PRIVATE/SUPPORTING FUNCTIONS

    function _showPopup() {
        _popup.show();
    }

    function _hidePopup(callback) {
        _popup.hide(callback);
    }

    // Restart the timer if it makes sense to do so.
    // Otherwise, just stop it.
    function _smartRestart() {
        // Restart the timers if we are in a phase where we should.
        _hidePopup();
        var phaseMatters = _checkPhase();
        if (phaseMatters) {
            _doubleTimer.restart();
        } else {
            _doubleTimer.stop();
        }
    }

    // Function called if the timer expires.
    function _orderTimerExpired() {
        var phaseMatters = _checkPhase();
        if (phaseMatters) {
            // Log for informational purposes back to the UI manager.
             // console.log("The user has been idle for too long in the ordering phase and the phase matters. Showing popup for more time.");
            _showPopup();
        } else {
            // Hide the popup just in case it is still up.
            _hidePopup();
            _doubleTimer.stop();
        }
    }

    // When the user doesn't click yes soon enough.
    function _noResponse() {
        // Log for informational purposes back to the UI manager.
        // console.log("User did NOT click 'yes' that they need more time.");

        // Adjust the timers.
        _doubleTimer.stop();

        // TODO - refactor once order is its own object
        _nex.ordering.resetOrder();

        // Hide the popup that shows whether or not more time is needed.
        _hidePopup(function() {
            // Go back to the main screen.
            _nex.manager.cancelCurrentPhase();
        });
    }

    // The need more time popup only applies in certain phases. This helps check the phase.
    function _checkPhase() {
        var result = false;

        // Show the need more time popup if we are in ordering or previous orders.
        if (_phaseManager.currentPhase === _phaseManager.phaseType.ORDERING ||
            _phaseManager.currentPhase === _phaseManager.phaseType.PREVIOUS_ORDERS ||
            _phaseManager.currentPhase === _phaseManager.phaseType.PAYMENT ||
             _phaseManager.currentPhase === _phaseManager.phaseType.POST_ORDERING) {
            result = true;
        }
        return result;
        // The timer doesn't apply in any of the other phases ...
        //self.phaseType = {
        //    "SPLASH": "splash",
        //    "PREVIOUS_ORDERS": "previousorders",
        //    "OFFLINE": "__offline",
        //    "PAYMENT": "payment",
        //    "SURVEY": "survey",
        //    "COMPLETE": "complete",
        //    "ORDER_GOVERNOR": "ordergovernor",
        //    "MENUBOARD": "menuboard",
        //    "SMS": "sms",
        //    "GREEN_RECEIPT": "greenreceipt",
        //    "DDMD": "ddmd",
        //    "STATUS": "status"
        //};
    }

    function _checkConstructorParameters(popupManager, messageText, phaseManager, callbackScript) {
        // Check popupManager
        if (typeof popupManager !== "object") {
            throw "Must specify a valid popupManager to OrderTimer.";
        }

        // Check messageText
        if (typeof popupManager !== "string") {
            throw "Must specify a valid string to OrderTimer.";
        }

        // Check phaseManager
        if (typeof phaseManager !== "object") {
            throw "Must specify a valid phaseManager to OrderTimer.";
        }

        // Check callbackScript
        if (typeof callbackScript !== "string") {
            throw "Must specify a string for callbackScript to OrderTimer.";
        }
    }
}


/**
 * @private
 * This is a helper for the OrderTimer. It handles the popup portion of the logic.
 * @constructor NeedMoreTimePopup
 * @param {object} popupManager - The existing popup manager object.
 * @param {string} popupMessage - The message to display on the popup.
 * @param {string} callbackScript - The script to execute onclick if the user clicks 'yes'.
 */
function NeedMoreTimePopup(popupManager, popupMessage, callbackScript) {

    // ARGUMENT CHECKING - Check constructor parameters to catch configuration errors early.
    _checkConstructorParameters(popupManager, popupMessage, callbackScript);

    // SELF - Store self for object context on events.
    var self = this;

    // PRIVATE VARIABLES

    // Keep a reference to the popup manager so we can use it to show/hide the popup.
    var _popupManager = popupManager;

    // Create the popup object. Only needs to be created once. Store it in this private variable for later.
    var _needMoreTimePopup = _createPopupMoreTime(popupManager, popupMessage, callbackScript);

    // PUBLIC METHODS

    // Wrapper to show the popup.
    self.show = function () {
        _popupManager.showPopup(_needMoreTimePopup, function () {
            // do nothing on callback
        });
    };

    // Wrapper to hide the popup.
    self.hide = function (callback) {
        _popupManager.hidePopup(_needMoreTimePopup, callback);

    };

    // PRIVATE/SUPPORTING METHODS

    // Returns a newly created object with everything needed for the popup object.
    function _createPopupMoreTime(popupManager, message, callbackScript) {
        // Copy the existing needMoreTimePopup object.
        var result = _copyObject(popupManager.needMoreTimePopup);

        // At this point, these objects are initialized.
        // name: "popup-need-more-time",
        // message: "",
        // buttons: [
        //    {
        //        id: "yes",
        //        text: self.theme.getTextAttribute("ORDER", "yes", "YES"),
        //        clickEvent: ""
        //    }
        // ]

        // Set the message to what is in the ORDER configuration for the theme.
        result.message = message;

        // Set the click event for the button. There is only one button, so a second one doesn't need to be set for 'no'.
        result.buttons[0].clickEvent = callbackScript;

        // Return the result.
        return result;
    }

    // Does a deep copy of a JavaScript object.
    function _copyObject(someObject) {
        // Use jQuery extend method to copy the object. Extend actually merges two objects,
        // so if the first object is blank, you get a copy of the second object.
        var DEEP_COPY = true;
        return $.extend(DEEP_COPY, {}, someObject);
    }

    // Helper function.
    function _checkConstructorParameters(popupManager, popupMessage, callbackScript) {
        // Check popupManager
        if (typeof popupManager !== "object") {
            throw "NeedMoreTimePopup: Must specify a valid popupManager. Got " + popupManager;
        }
        // Double check it has the needMoreTimePopup property.
        if (!popupManager.needMoreTimePopup) {
            throw "NeedMoreTimePopup: The popup manager given is missing the property needMoreTimePopup ";
        }

        // Check popupMessage
        if (typeof popupMessage !== "string") {
            throw "NeedMoreTimePopup: Must specify a string for popupMessage. Got " + popupMessage;
        }

        // Check callbackScript
        if (typeof callbackScript !== "string") {
            throw "NeedMoreTimePopup: Must specify a string for callbackScript. Got " + callbackScript;
        }
    }
}
/**
 * @private
 * A helper for the OrderTimer. It handles the timer portion of the logic. 
 * It actually consists of two timers... one for when to show the popup, and
 * another for how long the user has to click 'yes'.
 *
 * @constructor DoubleTimer
 * @param {object} popupObject - Object to use for showing popups.
 * @param {function} popupMethod - Method to call on the object.
 * @param {number} popupTime - Time to wait before showing the first popup.
 * @param {object} callbackObject - Object to use for no response.
 * @param {function} callbackMethod - Method to use for no response.
 * @param {callbackTime} callbackTime - Time to wait before going back to the main screen.
 */
function DoubleTimer(popupObject, popupMethod, popupTime, callbackObject, callbackMethod, callbackTime) {

    // Check constructor parameters to catch configuration errors early.
    _checkConstructorParameters(popupObject, popupMethod, popupTime, callbackObject, callbackMethod, callbackTime);

    // Store self for object context in events.
    var self = this;

    // Private variables.
    var _popupObject = popupObject;
    var _popupMethod = popupMethod;
    var _timeSeconds = popupTime;

    var _callbackObject = callbackObject;
    var _callbackMethod = callbackMethod;
    var _timePopup = callbackTime;

    // Use one timer for when to show the popup, and a second for when to 
    // kick the user back to the main screen if they don't make a choice.
    var _timer1 = new TimeoutTimer(self, _showPopup, _timeSeconds);
    var _timer2 = new TimeoutTimer(_callbackObject, _callbackMethod, _timeSeconds + _timePopup);

    // Start the countdown timers.
    self.start = function () {
        _timer1.start();
        _timer2.start();
    };

    // Stop all the countdown timers. 
    self.stop = function () {
        _timer1.stop();
        _timer2.stop();
    };

    // Restart the countdown timers.
    self.restart = function () {
        // Stop timers that may be already running.
        _timer1.stop();
        _timer2.stop();

        // Start the timers.
        _timer1.start();
        _timer2.start();
    };

    // SUPPORTING FUNCTIONS

    function _checkConstructorParameters(popupObject, popupMethod, popupTime, callbackObject, callbackMethod, callbackTime) {
        // Check popupObject
        if (typeof popupObject !== "object") {
            throw "DoubleTimer: Must specify a valid popupObject. Expected object and got " + popupObject;
        }

        // Check popupMethod
        if (typeof popupMethod !== "function") {
            throw "DoubleTimer: Must specify a function for popupMethod. Expected function and got " + popupMethod;
        }

        // Check popupTime
        if (typeof popupTime !== "number") {
            throw "DoubleTimer: Must specify a valid popupTime. Expected number and got " + popupTime;
        }

        // Check callbackObject
        if (typeof callbackObject !== "object") {
            throw "DoubleTimer: Must specify an object for callbackObject. Expected object and got " + callbackObject;
        }

        // Check callbackObject
        if (typeof callbackMethod !== "function") {
            throw "DoubleTimer: Must specify a valid method for callbackMethod. Expected function and got " + callbackMethod;
        }

        // Check callbackTime
        if (typeof callbackTime !== "number") {
            throw "DoubleTimer: Must specify a number for callbackTime. Expected number and got " + callbackTime;
        }
    }

    // Show the popup after the specified time interval. If the user doesn't respond
    // after the second interval, call the callback function.
    function _showPopup(args) {
        // Show the popup.
        _callFunction(_popupObject, _popupMethod, args);
    }

    // Explicitly call a specific function on a specific object with certain arguments.
    // Helps remove ambiguity for what the timer should do on a specific interval.
    function _callFunction(specifiedObject, specifiedMethod, specifiedArguments) {
        // Note: The arguments object is a local variable available within all functions.
        if (typeof specifiedObject !== "object") {
            throw "_callFunction: Must specify a valid object to call.";
        }
        if (typeof specifiedMethod !== "function") {
            throw "_callFunction: Must specify a valid function to call.";
        }
        specifiedMethod.call(specifiedObject, specifiedArguments);
    }
}