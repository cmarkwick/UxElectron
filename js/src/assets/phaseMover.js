function PhaseMover(elementId) {
    var self = this;

    // use the position manager to do the actual positioning
    self._positionManager = new PositionManager(elementId);

    // jQuery objects for each button.
    self._$upButton = null;
    self._$downButton = null;
    self._$leftButton = null;
    self._$rightButton = null;

    // debugging
    var debugEnabled = true;
    self.debug = function () {
        if (debugEnabled) {
            console.debug(arguments);
        }
    };

    // There could potentially be four buttons for moving the screen around.
    // Bind the buttons.
    self.bind = function (upButtonId, downButtonId, leftButtonId, rightButtonId) {
        if (upButtonId) {
            self._$upButton = $("#" + upButtonId);
        }
        if (downButtonId) {
            self._$downButton = $("#" + downButtonId);
        }
        if (leftButtonId) {
            self._$leftButton = $("#" + leftButtonId);
        }

        if (rightButtonId) {
            self._$rightButton = $("#" + rightButtonId);
        }

        // Rebind.
        self.rebind();
    };

    // Unbind the click handlers and bind them again.
    self.rebind = function () {
        if (self._$upButton.length > 0) {
            self._$upButton.unbind("click", self.upClicked);
            self._$upButton.bind("click", self.upClicked);
        }
        if (self._$downButton.length > 0) {
            self._$downButton.unbind("click", self.downClicked);
            self._$downButton.bind("click", self.downClicked);
        }
        if (self._$leftButton.length > 0) {
            self._$leftButton.unbind("click", self.leftClicked);
            self._$leftButton.bind("click", self.leftClicked);
        }
        if (self._$rightButton.length > 0) {
            self._$rightButton.unbind("click", self.rightClicked);
            self._$rightButton.bind("click", self.rightClicked);
        }
    };

    // Unbind the click handlers.
    self.unbind = function () {
        if (self._$upButton.length > 0) {
            self._$upButton.unbind("click", self.upClicked);
        }
        if (self._$downButton.length > 0) {
            self._$downButton.unbind("click", self.downClicked);
        }
        if (self._$leftButton.length > 0) {
            self._$leftButton.unbind("click", self.leftClicked);
        }
        if (self._$rightButton.length > 0) {
            self._$rightButton.unbind("click", self.rightClicked);
        }
    };

    // Reset the CSS transform property.
    self.reset = function () {
        self._positionManager.resetTransform();
    };

    // Position to a spot on the screen.
    self.positionToSpot = function (position) {
        switch (position) {
            case '0':
                self._positionManager.positionToSpot("TOP_LEFT");
                break;
            case '1':
                self._positionManager.positionToSpot("TOP_CENTER");
                break;
            case '2':
                self._positionManager.positionToSpot("TOP_RIGHT");
                break;
            case '3':
                self._positionManager.positionToSpot("MIDDLE_LEFT");
                break;
            case '4':
                self._positionManager.positionToSpot("MIDDLE_CENTER");
                break;
            case '5':
                self._positionManager.positionToSpot("MIDDLE_RIGHT");
                break;
            case '6':
                self._positionManager.positionToSpot("BOTTOM_LEFT");
                break;
            case '7':
                self._positionManager.positionToSpot("BOTTOM_CENTER");
                break;
            case '8':
                self._positionManager.positionToSpot("BOTTOM_RIGHT");
                break;
            // case 9 is for touch positioning.
        }
    };

    // Show all the buttons for the phase mover.
    // Optinally pass in x and y coordinates for where to put the phase. 
    self.show = function (x, y) {
        // If the user clicked on a specific spot to start, set the screen to that position.
        if (x) {
            if (y) {
                self._positionManager.positionToTouch(x, y);
            }
        }
        if (self._$upButton.length > 0) {
            self._$upButton.show();
        }

        if (self._$downButton.length > 0) {
            self._$downButton.show();
        }

        if (self._$leftButton.length > 0) {
            self._$leftButton.show(); 
        }

        if (self._$rightButton.length > 0) {
            self._$rightButton.show();
        }
    };

    // Hide all the buttons.
    self.hide = function () {
        if (self._$upButton.length > 0) {
            self._$upButton.hide();
        }

        if (self._$downButton.length > 0) {
            self._$downButton.hide();
        }

        if (self._$leftButton.length > 0) {
            self._$leftButton.hide();
        }

        if (self._$rightButton.length > 0) {
            self._$rightButton.hide();
        }
    };

    // Do an unbind and hide together.
    self.unbindAndHide = function () {
        self.unbind();
        self.hide();
    };

    // Do a rebind and show together.
    self.rebindAndShow = function () {
        self.rebind();
        self.show();
    };

    // Click event handlers.
    self.upClicked = function () {
        self.debug("upClicked");
        event.stopPropagation();
        self._trackClick();
        self._playSound();
        self._moveUp();

    };
    self.downClicked = function () {
        self.debug("downClicked");
        event.stopPropagation();
        self._trackClick();
        self._playSound();
        self._moveDown();
    };
    self.leftClicked = function () {
        self.debug("leftClicked");
        event.stopPropagation();
        self._trackClick();
        self._playSound();
        self._moveLeft();

    };

    self.rightClicked = function () {
        self.debug("rightClicked");
        event.stopPropagation();
        self._trackClick();
        self._playSound();
        self._moveRight();
    };

    // Private/helper methods

    // Track the click.
    self._trackClick = function (buttonId) {
        // No button tracking at this moment.
    };

    // Play the appropriate sound.
    self._playSound = function () {
        // No sound played at this moment.
    };

    // Perform the actual movement.
    self._moveUp = function () {
        self._positionManager.moveUp();
    };
    self._moveDown = function () {
        self._positionManager.moveDown();
    };
    self._moveLeft = function () {
        self._positionManager.moveLeft();
    };
    self._moveRight = function () {
        self._positionManager.moveRight();
    };

    // Resize the content.
    self.size = function (newSize) {
        var defaultSize = 8;
        var newSizeInt = parseInt(newSize);

        // We have 8 different resolutions specified in mynextep.
        if (isNaN(newSizeInt)) {
            console.log("Invalid screen resolution specified " + newSize);
            newSizeInt = defaultSize;
        }
        if (newSizeInt < 0) {
            console.log("Invalid screen resolution specified " + newSizeInt);
            newSizeInt = defaultSize;
        }
        if (newSizeInt > 9) {
            console.log("Invalid screen resolution specified " + newSizeInt);
            newSizeInt = defaultSize;
        }

        // Use the utility to actually do the sizing.
        self._positionManager.size(newSizeInt);
    };

}

