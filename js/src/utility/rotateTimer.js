/**
 * Move the the specified document element a small amount every so often to prevent burn-in.
 * Pass in the id of the element to move. Only the constructor needs to be called.
 * @constructor RotateTimer
 * @param {} elementId
 * @return 
 */
function RotateTimer(elementId) {
    var self = this;

    // Set parameters.
    var radius = 5; // 5 pixel radius
    var FREQUENCY_SECONDS = 60; // once a minute

    if ((_nex.assets.theme.system !== null) &&
        _nex.assets.theme.system.hasOwnProperty("splashmotionradius") &&
        $.isNumeric(_nex.assets.theme.system.splashmotionradius)) {
        radius = Number(_nex.assets.theme.system.splashmotionradius);
    }

    // Initialize the content rotator.
    var rotator = new ContentRotator(elementId, radius);

    // Set the rotator up on a timer.
    var timer = new SimpleTimer(rotator, rotator.translate, FREQUENCY_SECONDS);

    // Start the timer.
    timer.start();

    // Helper to reset the timer.
    self.reset = function () {
        // console.debug("***Restarting rotateTimer");
        timer.stop();
        rotator.reset();
        timer.start();
    };

    // If a user does some activity, restart the timer.
    // Note: Had to remove this because it conflicted with keeping the screen position for drive-thru.
    // Keeping it here for reference in case it is tried again.
    //$(document).on("keypress", restart);
    //$(document).on("click", restart);
}

/** @private */
// This is a helper object for the RotateTimer.
// This object keeps track of where the element is at, and what the new location should be.
function ContentRotator(elementId, radiusRotation) {

    var self = this;

    // Constants.
    var MIN_RADIUS = 1;
    var MAX_RADIUS = 300;
    var DEGREES_ROTATION = 40;

    // Check constructor parameters are valid to catch configuration errors.
    _checkConstructorParameters(elementId, radiusRotation, MIN_RADIUS, MAX_RADIUS);

    // Set the element being rotated. 
    self.element = document.getElementById(elementId);

    // The radius of rotation is used in the formula for approximating a circle
    // that the content will move in.
    self.radius = radiusRotation;

    // Initialize the degrees to zero.
    self.degrees = 0;

    // Use an X offset and Y offset.
    self.xOffset = 0;
    self.yOffset = 0;

    // Actually perform the translation.
    self.translate = function () {
        // Only perform the translation if we are on the SPLASH screen or OFFLINE.
        // Otherwise, if the rotation starts on the splash, but fires in the middle of ordering, it can be confusing.
        if (_nex.assets.phaseManager.currentPhase === _nex.assets.phaseManager.phaseType.SPLASH ||
            _nex.assets.phaseManager.currentPhase === _nex.assets.phaseManager.phaseType.OFFLINE) {
            _translate(self);
        }
    };

    // Reset any translations.
    self.reset = function () {
        _reset(self);
    };


    // SUPPORTING FUNCTIONS

    // Helper function to check the parameters passed to the constructor.
    function _checkConstructorParameters(elementId, radiusRotation, minRadius, maxRadius) {
        // Check the element.
        if (!elementId) {
            throw "You must specify an element id.";
        }
        var element = document.getElementById(elementId);
        if (!element) {
            throw "Unable to find an element with id " + elementId;
        }
        // Check the radius.
        if (radiusRotation < minRadius || radiusRotation > maxRadius) {
            throw "A radius of " + radiusRotation + " is outside the supported range for the ContentRotator.";
        }
    }

    // Re-calculate the X and Y offsets.
    function _calculateOffsets(contentRotator) {
        // Increase the degrees.
        contentRotator.degrees += DEGREES_ROTATION;

        // Reset if the degrees of rotation exceeds 360.
        if (contentRotator.degrees > 360) {
            contentRotator.degrees = 0;
        }

        // Re-calculate position.
        var radians = (2 * Math.PI * contentRotator.degrees) / 360;
        var xOffset = Math.cos(radians) * contentRotator.radius;
        var yOffset = Math.sin(radians) * contentRotator.radius;

        // Round to the nearest integer.
        contentRotator.xOffset = Math.round(xOffset);
        contentRotator.yOffset = Math.round(yOffset);

        // Debugging information.
        // console.debug('new x: ' + contentRotator.xOffset);
        // console.debug('new y: ' + contentRotator.yOffset);
    }

    // Helper to do the translation of the document element.
    function _performTranslation(element, xOffset, yOffset) {
        //
        // There are 4 different position values: static, relative, fixed, or absolute.
        //
        // - Static is the default. It positions according to the normal flow of the page.
        // - Relative is 'relative' to the normal position. This will move it away from its original position.
        // - Fixed is relative to the viewport... Which means it stays in the same position even if the page is scrolled.
        // - Absolute is relative to the nearested positioned ancestor... If there aren't any, it uses the document body.
        //
        // We want to use relative, and just move the item from its normal position.
        //
        element.style.position = "relative";
        element.style.left = xOffset + "px";
        element.style.top = yOffset + "px";
        element.style.transform = "none";

        // Rotate any background image. Without this, the background image remains static.
        $('body').css('background-position', xOffset + 'px ' + yOffset + 'px');
    }

    // Do the full translation, re-calculating the offsets, then moving the element.
    function _translate(contentRotator) {
        _calculateOffsets(contentRotator);
        _performTranslation(contentRotator.element, contentRotator.xOffset, contentRotator.yOffset);
    }

    // Reset the offsets on the rotator.
    function _reset(contentRotator) {
        contentRotator.xOffset = 0;
        contentRotator.yOffset = 0;
        _performTranslation(contentRotator.element, 0, 0);
    }
}
