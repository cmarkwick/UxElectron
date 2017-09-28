function PositionManager(elementId) {

    var self = this;

    var debugEnabled = false;
    self.debug = function () {
        if (debugEnabled) {
            console.debug("PositionManager", arguments);
        }
    };

    self.setElement = function (elementId) {
        var element = document.getElementById(elementId);
        if (!element) {
            throw "No such element " + elementId;
        }
        // Sometimes it is simpler to use jQuery and sometimes it is easier to use the DOM.
        // Have both ready.
        self.element = element; // Browser DOM version of the element.
        self.$element = $(element); // jQuery version of the element.

    };

    self.setElement(elementId);

    self.positionElement = function (x, y) {
        // Sometimes the CSS can add transforms which conflict with this logic.
        // Take the transforms off.
        self.resetTransform();
        self.debug("positionElement: Moving element " + self.element.id + " to " + x + ", " + y);
        self.element.style.position = "fixed"; // fixed means it is with respect to the entire screen
        var newOffset = { top: y, left: x};
        self.$element.offset(newOffset);  
    };

    // One position on touch
    self.positionToTouch = function (x, y) {
        if (x >= 0 && y >= 0) {
            // They touched where the middle of the element should be, not the upper-left corner.
            // Adjust for this.
            var newX = x - self.getHalfWidth();
            var newY = y - self.getHalfHeight();
            self.setPositionChecked(newX, newY);
        }
    };

    // top
    self.positionTopLeft = function () {
        self.element.style.position = "fixed";
        self.element.style.top = "0px";
        self.element.style.left = "0px";
    };
    self.positionTopCenter = function () {
        self.element.style.position = "fixed";
        self.element.style.top = "0px";
        self.element.style.left = "50%";
        self.element.style.transform = "translateX(-50%)";
    };
    self.positionTopRight = function () {
        self.element.style.position = "fixed";
        self.element.style.top = "0px";
        self.element.style.right = "0px";
    };
    // middle
    self.positionMiddleLeft = function () {
        self.element.style.position = "fixed";
        self.element.style.top = "50%";
        self.element.style.left = '0px';
        self.element.style.transform = "translate(0, -50%)";
    };
    self.positionMiddleCenter = function () {
        self.element.style.position = "fixed";
        self.element.style.top = "50%";
        self.element.style.left = '50%';
        self.element.style.transform = "translate(-50%, -50%)";
    };
    self.positionMiddleRight = function () {
        self.element.style.position = "fixed";
        self.element.style.top = "50%";
        self.element.style.right = '0px';
        self.element.style.transform = "translate(0, -50%)";
    };
    // bottom
    self.positionBottomLeft = function () {
        self.element.style.position = "fixed";
        self.element.style.bottom = "0px";
        self.element.style.left = "0px";

    };
    self.positionBottomMiddle = function () {
        self.element.style.position = "fixed";
        self.element.style.bottom = "0px";
        self.element.style.left = '50%';
        self.element.style.transform = "translate(-50%, 0%)";

    };
    self.positionBottomRight = function () {
        self.element.style.position = "fixed";
        self.element.style.bottom = "0px";
        self.element.style.right = "0px";
    };

    self.resetTransform = function () {
        self.element.style.transform = "translate(0%, 0%)";
    };

    // Position to a particular spot defined in the CSS
    self.positionToSpot = function (spot) {
        switch (spot) {
            case "TOP_LEFT":
                self.positionTopLeft();
                break;
            case "TOP_CENTER":
                self.positionTopCenter();
                break;
            case "TOP_RIGHT":
                self.positionTopRight();
                break;
            case "MIDDLE_LEFT":
                self.positionMiddleLeft();
                break;
            case "MIDDLE_CENTER":
                self.positionMiddleCenter();
                break;
            case "MIDDLE_RIGHT":
                self.positionMiddleRight();
                break;
            case "BOTTOM_LEFT":
                self.positionBottomLeft();
                break;
            case "BOTTOM_CENTER":
                self.positionBottomMiddle();
                break;
            case "BOTTOM_RIGHT":
                self.positionBottomRight();
                break;
        }
    };

    // Return the jQuery elements current X position.
    self.getCurrentX = function () {
        var elementPosition = self.$element.offset();
        var x = elementPosition.left;
        return x;
    };

    // Return the jQuery elements current Y position.
    self.getCurrentY = function () {
        var elementPosition = self.$element.offset();
        var y = elementPosition.top;
        return y;
    };

    self.getCurrentWidth = function () {
        var elementWidth = self.$element.width();
        return elementWidth;
    };

    // Get the elements current height.
    self.getCurrentHeight = function () {
        var elementHeight = self.$element.height();
        return elementHeight;
    };

    self.getHalfWidth = function () {
        var elementWidth = self.$element.width();
        var halfWidth = elementWidth / 2;
        return halfWidth;
    };

    self.getHalfHeight = function () {
        var elementHeight = self.$element.height();
        var halfHeight = elementHeight / 2;
        return halfHeight;

    };

    // Sets the element to the requested position. If the requested position is off the screen,
    // adjusts to put it in the closest position it can find on the screen.
    // Required parameters are x and y.
    self.setPositionChecked = function (x, y, width, height, maxX, maxY) {

        var newX = x;
        var newY = y;

        // Initialize optional variables.
        if (!width) {
            width = self.getCurrentWidth();
        }
        if (!height) {
            height = self.getCurrentHeight();
        }
        if (!maxX) {
            maxX = screenWidth();
        }
        if (!maxY) {
            maxY = screenHeight();
        }

        // Bounds checking on the right edge and bottom.
        var right = newX + width;
        var bottom = newY + height;

        self.debug("right: " + right);
        self.debug("bottom: " + bottom);

        if (right > maxX) {
            
            newX = maxX - width;
            self.debug("Past right edge... moving new x to " + newX);
        }

        if (bottom > maxY) {
            
            newY = maxY - height;
            self.debug("Past bottom edge... moving new y to " + newY);
        }
        
        // Bounds checking on the left and top.
        if (newX < 0) {
            newX = 0;
        }
        if (newY < 0) {
            newY = 0;
        }

        self.debug("Moving from (" + x + "," + y + ") to (" + newX + "," + newY + ")");
        self.positionElement(newX, newY);
    };


    self.moveUp = function () {

        var currentX = self.getCurrentX();
        var currentY = self.getCurrentY();
        var currentWidth = self.getCurrentWidth();
        var currentHeight = self.getCurrentHeight();

        self.debug("moveUp: Moving from (" + currentX + "," + currentY + ")");

        var newX = currentX;
        var newY = currentY - fractionHeight();

        self.setPositionChecked(newX, newY, currentWidth, currentHeight, screenWidth(), screenHeight());

    };

    self.moveDown = function () {
        var currentX = self.getCurrentX();
        var currentY = self.getCurrentY();
        var currentWidth = self.getCurrentWidth();
        var currentHeight = self.getCurrentHeight();

        self.debug("moveDown: Moving from (" + currentX + "," + currentY + ")");

        var newX = currentX;
        var newY = currentY + fractionHeight();

        self.setPositionChecked(newX, newY, currentWidth, currentHeight, screenWidth(), screenHeight());
    };

    self.moveLeft = function () {
        var currentX = self.getCurrentX();
        var currentY = self.getCurrentY();
        var currentWidth = self.getCurrentWidth();
        var currentHeight = self.getCurrentHeight();

        self.debug("MoveLeft: Moving From (" + currentX + "," + currentY + ")");

        var newX = currentX - fractionWidth();
        var newY = currentY;

        self.setPositionChecked(newX, newY, currentWidth, currentHeight, screenWidth(), screenHeight());

    };

    self.moveRight = function () {
        var currentX = self.getCurrentX();
        var currentY = self.getCurrentY();
        var currentWidth = self.getCurrentWidth();
        var currentHeight = self.getCurrentHeight();

        self.debug("moveRight: Moving From (" + currentX + "," + currentY + ")");

        var newX = currentX + fractionWidth();
        var newY = currentY;

        self.setPositionChecked(newX, newY, currentWidth, currentHeight, screenWidth(), screenHeight());

    };

    var SCREEN_FRACTION = 1 / 4; // Used to move the screen up and down a fraction of the screen.

    function screenHeight() {
        // "Height (in pixels) of the browser window viewport including, if rendered, the horizontal scrollbar."
        return window.innerHeight;
    }
    function screenWidth() {
        // "Width (in pixels) of the browser window viewport including, if rendered, the vertical scrollbar."
        return window.innerWidth;
    }
    function fractionHeight() {
        return screenHeight() * SCREEN_FRACTION;
    }
    function fractionWidth() {
        return screenWidth() * SCREEN_FRACTION;
    }

    self.changeWidth = function (newWidth) {
        self.$element.width(newWidth);
    };

    self.changeHeight = function (newHeight) {
        self.$element.height(newHeight);
    };

    self.size = function (newSize) {
        self.debug("Resizing to " + newSize);
        var resolution = self.getResolution(newSize);
        self.changeWidth(resolution.width);
        self.changeHeight(resolution.height);
    };

    self.getResolution = function (value) {

        var result = { width: 1280, height: 720 };

        switch (value) {
            case 0:
                result.width = 1024;
                result.height = 768;
                break;
            case 1:
                result.width = 1280;
                result.height = 768;
                break;
            case 2:
                result.width = 1366;
                result.height = 768;
                break;
            case 3:
                result.width = 1680;
                result.height = 1050;
                break;
            case 4:
                result.width = 1920;
                result.height = 1080;
                break;
            case 5:
                result.width = 768;
                result.height = 1280;
                break;
            case 6:
                result.width = 1024;
                result.height = 1820;
                break;
            case 7:
                result.width = 1080;
                result.height = 1920;
                break;
            case 8:
                result.width = 1280;
                result.height = 720;
                break;
            case 9:
                result.width = 1280;
                result.height = 800;
                break;
        }
        return result;

    };
}