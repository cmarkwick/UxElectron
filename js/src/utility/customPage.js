// Helper for customers who need custom pages, e.g. Cedar Fair.
(function (window) {

    // If the user needs to be able to click on a custom element, we need a standard way to track clicks
    // and play a sound when it is clicked. We also need a common way of changing the HTML and the text.
    var ClickableElement = function (id, clickCallback) {
        var self = this;
        self.id = id;
        self.clickCallback = clickCallback;

        // Debugging.
        self.debugEnabled = true;
        self.debug = function () {
            if (self.debugEnabled) {
                console.debug("PageElement", arguments);
            }
        };

        // Double check the element exists in the HTML.
        self.checkElementExists = function () {
            return $("#" + self.id).length > 0;
        };

        // Set the HTML of the element using jQuery.
        self.html = function (html) {
            // May add support for ~ to replace newlines in the future.
            self.debug("Setting element html to", self.id, html);
            $("#" + self.id).html(html);
        };

        // Set the text of the element using jQuery.
        self.text = function (text) {
            // May add support for ~ to replace newlines in the future.
            self.debug("Setting element text to", self.id, text);
            $("#" + self.id).text(text);
        };

        // Show the element.
        self.show = function () {
            self.debug("Showing element", self.id);
            $("#" + self.id).show();
        };

        // Hide the element.
        self.hide = function () {
            self.debug("Hiding element", self.id);
            $("#" + self.id).hide();
        };

        // Setup a click handler on the element.
        self.bindClick = function () {
            self.element = $("#" + id);
            if (!self.element.length) {
                throw "Could not bind to the element with the id: " + id;
            }
            self.debug("Found element and binding to it.");
            if (self.clickCallback) {
                self.element.unbind("click");
                self.element.bind("click", function () {
                    self.playSound();
                    self.trackHistory();
                    self.clickCallback();
                });
            }
        };

        // Logic to call for button tracking history.
        self.trackHistory = function () {
            self.debug("tracking history"); // future use

        };

        // Logic to call for playing a sound.
        self.playSound = function () {
            self.debug("playing sound"); // future use
        };
    };

    // A custom page.
    var CustomPage = function (id, pageElements, callbackShow, callbackHide) {
        var self = this;

        self.id = id;
        self.pageElements = pageElements || [];
        self.callbackShow = callbackShow || function () { };
        self.callbackHide = callbackHide || function () { };

        // Debugging.
        self.debugEnabled = true;
        self.debug = function () {
            if (self.debugEnabled) {
                console.debug("CustomPage", arguments);
            }
        };

        // Show the page and call the callback.
        self.show = function () {
            self.debug("Showing page");
            $("#" + id).show();
            self.callbackShow();
        };

        // Hide the page and call the callback.
        self.hide = function () {
            self.debug("Hiding page");
            $("#" + id).hide();
            self.callbackHide();
        };

        // Add an element to the page. Ihe clickcallback argument is option.
        self.addElement = function (id, clickCallback) {
            self.debug("Adding an element to the page");
            var element = new ClickableElement(id, clickCallback);
            self.pageElements.push(element);
        };
    };

    // Expose just the CustomPage constructor. This can be used by any custom pages created.
    window.CustomPage = CustomPage;
})(window);