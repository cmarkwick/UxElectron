/*
 * theme.js
 */
function ThemeUX(themeId, themeMediaPath) {
    var self = this;

    Theme.call(self, themeId, themeMediaPath);

    self.splashid = 'default';
    self.itemClasses = null;
    self.lastUpdate = null;
    self.isUpdateAvailable = false;
    self.testMode = false;
    self.languageSelected = "english"; // can be switched to spanish, for example, from the splash screen.
    self.otherLanguages = null;

    self.debugEnabled = false;
    self.debug = function () {
        if (self.debugEnabled) {
            console.debug("ThemeUX", arguments);
        }
    };

    // helper method for the media path (themes folder)
    self.mediaPath = function () {
        if (inPreviewer()) {
            return "../Media.aspx?media=";
        }
        var path = self.mediaRootUri;
        if (self.mediaRootUri.toLowerCase().indexOf(self.id.toLowerCase()) === -1) {
            path += '/' + self.id;
        }
        return path + '/media/';
    };

    // load update is called to save off the update until it can be applied
    self.loadUpdate = function (update) {
        self.lastUpdate = update;
        self.isUpdateAvailable = true;
    };

    self._videoUrl = function () {

        var url = "http://127.0.0.1:8088";
        if (_nex.assets.theme.frenabled) {
            self.debug('setVideoFeed', 'frenabled');
            url = "http://127.0.0.1:8089";
        }

        var password = "Kiosk1";
        var userid = "nextep";
        var feedUrl = "\"" + url + "\"";

        return feedUrl.replace("http://", "http://" + userid + ":" + password + "@");
    };

    // loads the video stream that is to be used by all video viewers
    self._loadVideoStream = function () {

        var videoStream = $("#videostream");
        if (videoStream.length === 0) {
            var iframe = '<iframe src=' + self._videoUrl() + ' id="videostream" style="display:none" ></iframe>'; //
            $("#targets").append(iframe);
        }
    };

    // set the video feed
    self.setVideoFeed = function (html) {
        //cam feed frame.  The reason why there is an iframe is due to an issue with Chromium for basic auth where the user name and password was stripped from the img tag.
        //This does not happen to iframes.  But the credentials get cached by the iframe so the img tag works.
        if (_nex.assets.theme.hasvideo) {

            self._loadVideoStream();

            self.debug('setVideoFeed', 'showing video feed');
            var img = '<img src=' + self._videoUrl() + ' id="cameraFrame" class="camera-frame"  alt="Video Feed Unavailable" >';

            html.find("#videofeedwrapper").empty();
            html.find("#videofeedwrapper").append(img);
        }
    };

    self.clearVideoFeed = function (html) {
        html.find("#videofeedwrapper").empty();
    };

    // override setnutrition to work slightly different
    self.setNutrition = function (item, html, hideOnEmpty) {

        var fillNutritionAmount = function (attrName, elementId, htmlSnippet, itemObj) {
            var valueSet = false;
            var itemAttr = self.findItemAttribute(itemObj, attrName);
            var amount = (itemAttr !== null) ? itemAttr.value : "";

            var amountText = htmlSnippet.find("#" + elementId);
            if (amountText.length > 0 && amount.length > 0) {
                amountText.empty();
                amountText.append(amount);
                valueSet = true; //at least one nutritional value was found and set
            }

            var labelText = htmlSnippet.find("#" + elementId + "Label");
            if (labelText && labelText.length > 0) {
                labelText.empty();
                var labelVal = self.getTextAttribute("ORDER", (elementId + "Label").toLowerCase(), attrName);
                labelText.append(labelVal);
            }

            return valueSet;
        };

        if (item !== null) {
            var valueSet = false;
            valueSet = fillNutritionAmount("Serving Size", "serving", html, item);
            valueSet = fillNutritionAmount("Calories Per Serving", "calories", html, item) || valueSet;
            valueSet = fillNutritionAmount("Total Fat", "totalFat", html, item) || valueSet;
            valueSet = fillNutritionAmount("Saturated Fat", "satFat", html, item) || valueSet;
            valueSet = fillNutritionAmount("Trans Fat", "transFat", html, item) || valueSet;
            valueSet = fillNutritionAmount("Cholesterol", "cholesterol", html, item) || valueSet;
            valueSet = fillNutritionAmount("Sodium", "sodium", html, item) || valueSet;
            valueSet = fillNutritionAmount("Total Carbohydrates", "totalCarbs", html, item) || valueSet;
            valueSet = fillNutritionAmount("Sugar", "sugars", html, item) || valueSet;
            valueSet = fillNutritionAmount("Protein", "protein", html, item) || valueSet;
            valueSet = fillNutritionAmount("Fiber", "fiber", html, item) || valueSet;

            //the entire nutritional visual will be hidden if no nutritional values are found for the given item.
            if (hideOnEmpty && !valueSet) {
                html.hide();
            }
            else {
                html.show();
            }
        }
    };

    // Loop through all the tenders and find the one with a specific type.
    self.getTenderByType = function (tenderType) {
        var result = null;
        var tender = null;
        var tenders = self.system.TENDERS.TENDER;
        for (var index = 0; index < tenders.length; index++) {
            tender = tenders[index];
            if (tender.type === tenderType) {
                result = tender;
                break;
            }
        }
        return result;
    };


    self.getGenericTenderByType = function (genericTenderId) {
        var result = null;
        var tender = null;
        var tenders = [];
        var genericTender = self.system.TENDERS.GENERICTENDER;

        //will be one or many so convert to an array
        var isArray = Array.isArray(genericTender);
        if (!isArray) {
            tenders.push(genericTender);
        }
        else {
            tenders = genericTender;
        }

        for (var index = 0; index < tenders.length; index++) {
            tender = tenders[index];
            if (tender.type.toLowerCase() === genericTenderId.toLowerCase()) {
                result = tender;
                break;
            }
        }
        return result;
    };

    // Return a generic tender (enabled in the payment profile) associated with the given Guest Account Local Type ID...
    self.getGenericTenderByGuestAccountLocalType = function (guestAccountLocalTypeId) {
        var genericTenders = self.system.TENDERS.GENERICTENDER;

        var genericTender = null;

        if (Array.isArray(genericTenders)) {
            for (var i = 0; i < genericTenders.length; i++) {
                if (genericTenders[i].guestaccountlocaltypeid !== undefined && genericTenders[i].guestaccountlocaltypeid === guestAccountLocalTypeId) {
                    genericTender = genericTenders[i];
                    break;
                }
            }
        }
        else if (genericTenders !== undefined && genericTenders !== null && genericTenders.guestaccountlocaltypeid === guestAccountLocalTypeId) {
            genericTender = genericTenders;
        }

        return genericTender;
    };

    // Return a specific property from the tender object.
    self._getPropertyFromTender = function (tender, property) {
        var result = null;
        if (tender && tender.hasOwnProperty(property)) {
            result = tender[property];
        }
        return result;
    };

    // Check a binary property on the tender object.
    self._checkBinaryProperty = function (tender, property) {
        var result = false;
        var propertyValue = self._getPropertyFromTender(tender, property);
        if (propertyValue !== null && propertyValue.toLowerCase() === "true") {
            result = true;
        }
        return result;
    };

    // Determine if a tender is tax exempt.
    self.isTenderTaxExempt = function (tender) {
        return self._checkBinaryProperty(tender, "istaxexempt");
    };

    // Determine the preauth attribute on the tender.
    self.isPreAuthRequired = function (tender) {
        return self._checkBinaryProperty(tender, "preauth") || self._checkBinaryProperty(tender, "preauthandpay");
    };

    // Determine the preauthandpay attribute on the tender.
    self.isPreAuthAndPay = function (tender) {
        return self._checkBinaryProperty(tender, "preauthandpay");
    };

    // Determine if the tender requires authorization.
    self.isValidationRequired = function (tender) {
        return self._checkBinaryProperty(tender, "validate");
    };

    // Determine if the tender requires authorization.
    self.isKioskValidationRequired = function (tender) {
        return self._checkBinaryProperty(tender, "kioskvalidate");
    };

    // Determine if the tender is a final tender.
    self.isFinal = function (tender) {
        return self._checkBinaryProperty(tender, "final");
    };

    // Determine if we are using the full amount.
    self.useFullAmount = function (tender) {
        return true; // always use the full amount with UX
        //return self._checkBinaryProperty(tender, "usefullamount");
    };

    // Return the tenders available.
    self.tendersAvailable = function () {
        var result = [];

        var paymentProfile = _nex.assets.theme.lastUpdate.THEMES.KIOSK.PAYMENTPROFILE;
        // Note: Cases that are not supported yet or tested are currently commented out.
        if (paymentProfile.TENDER.cashflag === "true") {
            result.push("cash");
        }
        if (paymentProfile.TENDER.compflag === "true") {
            result.push("comp");
        }
        if (paymentProfile.TENDER.counterflag === "true") {
            // Counter flag is disabled and cash flag is set to true...
            result.push("counter");
        }
        if (paymentProfile.TENDER.couponflag === "true") {
            result.push("coupon");
        }
        if (paymentProfile.TENDER.creditflag === "true") {
            result.push("credit");
        }
        if (paymentProfile.TENDER.debitflag === "true") {
            result.push("debit");
        }
        if (paymentProfile.TENDER.discountflag === "true") {
            result.push("discount");
        }
        if (paymentProfile.TENDER.driverflag === "true") {
            result.push("driver");
        }
        if (paymentProfile.TENDER.employeeflag === "true") {
            result.push("employee");
        }
        if (paymentProfile.TENDER.loyalty2flag === "true") {
            result.push("loyalty2");
        }
        if (paymentProfile.TENDER.loyaltyflag === "true") {
            result.push("loyalty");
        }
        if (paymentProfile.TENDER.roomchargeflag === "true") {
            result.push("room");
        }

        //push any available generic tenders onto the list of available tenders...
        if (paymentProfile.TENDER.GENERIC) {
            var genericTenders = [];
            if (Array.isArray(paymentProfile.TENDER.GENERIC)) {
                genericTenders = paymentProfile.TENDER.GENERIC;
            }
            else {
                genericTenders.push(paymentProfile.TENDER.GENERIC);
            }

            //there is at least 1 generic tender. loop through and add the enabled ones to the stack
            for (var i = 0; i < genericTenders.length; i++) {
                if (genericTenders[i].enabled.toString() === "true") {
                    result.push(genericTenders[i].paymenttype.toString());
                }
            }
        }


        return result;
    };


    // Returns an array of other languages for the KIOSKTEXT if there are any.
    self._getOtherLanguages = function () {
        var otherLanguages = null;
        var otherLanguage = "";

        if (self.lastUpdate.THEMES.THEME.KIOSKTEXT.KIOSKTEXT) {
            var childKioskText = self.lastUpdate.THEMES.THEME.KIOSKTEXT.KIOSKTEXT;
            var isArray = Array.isArray(childKioskText);

            if (!isArray) {
                // If there is only one alternate language ...
                if (childKioskText.languageid) {
                    otherLanguages = {};
                    otherLanguage = childKioskText.languageid.toLowerCase();
                    otherLanguages[otherLanguage] = childKioskText;
                }
            } else {
                // If there is more than one alternate language.
                otherLanguages = {};
                for (var index = 0; index < childKioskText.length; index++) {
                    var otherLanguageElement = childKioskText[index];
                    if (otherLanguageElement.languageid) {
                        otherLanguage = otherLanguageElement.languageid.toLowerCase();
                        if (otherLanguage && otherLanguage.length > 0) {
                            otherLanguages[otherLanguage] = otherLanguageElement;
                        }
                    }
                }
            }
        }
        return otherLanguages;
    };

    // Get the text object for the specified language.
    self.getLanguageText = function (language, textName) {
        var textObj = null;
        if ((self.otherLanguages) &&
             (self.otherLanguages[language]) &&
            (self.otherLanguages[language][textName])) {
            textObj = self.otherLanguages[language][textName];
        }
        return textObj;
    };

    // Return the text for another language.
    self.getActiveLanguageText = function (element, attributeName) {
        var text = "";

        if (element !== undefined) {
            if (element.constructor === Array) {
                // mulitple languages exist
                for (var i = 0; i < element.length; i++) {
                    if ((element[i].languageid.toLowerCase() === "english") &&
                        (text.length === 0)) {
                        text = element[i][attributeName];  // load the english version by default
                    } else if (element[i].languageid.toLowerCase() === self.languageSelected.toLowerCase()) {
                        text = element[i][attributeName]; // if the selected language exist then use that value
                    }
                }
            } else if (element.hasOwnProperty(attributeName)) {   // only one element exists so mulitple languages have not been defined
                text = element[attributeName];
            }
        }
        return text;
    };

    self.applyUpdate = function (callback) {

        self.id = self.lastUpdate.THEMES.THEME.id;

        self.testMode = (self.lastUpdate.testmode.toLowerCase() == "true");

        // store the menus/items to be use
        self.dayparts = self.lastUpdate.THEMES.THEME.DAYPARTS.DAYPART;
        self.menus = self.lastUpdate.THEMES.THEME.MENUS.MENU;
        self.items = self.lastUpdate.THEMES.THEME.ITEMS.ITEM;
        self.system = self.lastUpdate.THEMES.THEME.SYSTEM;
        //self.times = result.TIME; // TODO - need for NEXTEP Mobile

        // setup button tracking object as soon as the system XML is loaded.
        _nex.utility.buttonTracking = new ButtonTracking(self.system.BUTTONTRACKING);
        _nex.utility.buttonBinder = new ButtonBinder(
            _nex.assets.theme.setButtonText,
            _nex.assets.theme.setControlButtonText,
            _nex.utility.buttonTracking.track,
            _nex.assets.soundManager.playButtonHit);


        self.kioskText = self.lastUpdate.THEMES.THEME.KIOSKTEXT;

        // Initialize other languages.
        var alternateLanguages = self._getOtherLanguages();
        if (alternateLanguages !== null) {
            // console.debug("Other languages were returned ... setting them on the theme.");
            self.otherLanguages = alternateLanguages;
        }

        self.priceLevels = self.lastUpdate.THEMES.THEME.priceLevels;
        self.paymentProfile = self.lastUpdate.THEMES.KIOSK.PAYMENTPROFILE;
        self.itemClasses = self.lastUpdate.THEMES.THEME.ITEMCLASSES;

        _nex.assets.templateManager = new TemplateManager(self.lastUpdate.THEMES.THEME.TEMPLATES);

        // set limits
        if (self.system.hasOwnProperty('quantitylimit')) {
            self.quantityLimit = Number(self.system.quantitylimit);
        }

        if (self.system.hasOwnProperty('alcohollimit')) {
            self.alcoholLimit = Number(self.system.alcohollimit);
        }

        if (self.system.hasOwnProperty('consolidate')) {
            self.consolidate = (self.system.consolidate.toLowerCase() === "true");
        }

        if (self.lastUpdate.hasOwnProperty("thememediapath")) {
            self.mediaRootUri = self.lastUpdate.thememediapath;
        }

        if (self.lastUpdate.THEMES.KIOSK.hasOwnProperty("splashid")) {
            self.splashid = self.lastUpdate.THEMES.KIOSK.splashid;
            if (!self.splashid) {
                self.splashid = 'default';
            }
        }

        // popup need to be loaded before calling the loaded method since popup could be used within the method
        var params = {
            popups: self.lastUpdate.THEMES.THEME.POPUPS,
            theme: this
        };

        _nex.assets.popupManager = new PopupManager(params, function () {
            if ((callback !== undefined) &&
                (callback !== null)) {
                callback();
            }
        });

        self.isUpdateAvailable = false;
        self.hasvideo = false;
        self.frenabled = false;
        self.disablesmsprompt = false;

        if (self.lastUpdate.THEMES.KIOSK.hasOwnProperty("hasvideo")) {
            self.hasvideo = self.lastUpdate.THEMES.KIOSK.hasvideo.toLowerCase() === "true";
        }

        if (self.lastUpdate.THEMES.KIOSK.hasOwnProperty("disablesmsprompt")) {
            self.disablesmsprompt = self.lastUpdate.THEMES.KIOSK.disablesmsprompt.toLowerCase() === "true";
        }

        if (self.lastUpdate.THEMES.KIOSK.hasOwnProperty("frenabled")) {
            self.frenabled = self.lastUpdate.THEMES.KIOSK.frenabled.toLowerCase() === "true";
        }
       
	    //self.hasFacialRecognition = self.lastUpdate.THEMES.KIOSK.hasFacialRecognition.toLowerCare() === "true";

        // Expose the whole KIOSK object
        self.kiosk = self.lastUpdate.THEMES.KIOSK;

        self.itemRank = self.lastUpdate.THEMES.KIOSK.ITEMRANK;

        // Remember your order by your face, phone, card, etc.
        if (_nex.assets.theme.kiosk.PAYMENTPROFILE && (!_nex.assets.theme.kiosk.PAYMENTPROFILE.REPEATORDERS)) {
            _nex.assets.theme.kiosk.PAYMENTPROFILE.REPEATORDERS = {
                "phone": "true",
                "face": "false",
                "credit": "true",
                "cancel": "true"
            };
        }

        // hide/show the cursor
        if (self.system.hasOwnProperty("cursor") && (self.system.cursor.toLowerCase() === "off")) {
            $("body").addClass("ux-hide-cursor");
        } else {
            $("body").removeClass("ux-hide-cursor");
        }
    };

    // Return the hardware type of the device.
    self.getHardwareType = function () {
        var result = "";
        if (_nex.assets.theme.kiosk && _nex.assets.theme.kiosk.hardwaretype) {
            result = _nex.assets.theme.kiosk.hardwaretype;
        }
        return result;
    };


    // loads site specific media
    // mediaId - is value that will be passed through to the callback so the calling
    // script - (optional) uri of script to load; pass null if there is no script to load
    //  method can identify what media was loaded
    // scriptCallback (optional) - Method to call after the script finishes loading.
    self.loadMedia = function (media, mediaId, scriptUri, callback, scriptCallback) {
        var uri = self.mediaPath() + media;

        if (inPreviewer()) {
            uri = "../Media.aspx?media=" + media;
            //if (scriptUri) {
            //    scriptUri = "../Media.aspx?media=html/" + scriptUri;
            //}
            console.debug("themeUX.loadMedia() - Loading uri " +uri);
        }


        // Make the $.ajax call.
        var jxContent = $.ajax({
            "url": uri,
            "dataType": "html",
            "cache": false
        });

        // This is called when the $.ajax call is complete and succeeded.
        jxContent.done(function (data) {
            // Call the HTML callback since the HTML has finished loading.
            if (callback !== undefined) {
                callback(mediaId, data);
            }

            // If there was a script to load... load it as well.
            // If the callback loaded some HTML, by appending it to a DIV, then the script can access that content now.
            if ((scriptUri !== undefined) &&
                (scriptUri !== null) &&
                (scriptUri !== "")) {

                self.loadScript(scriptUri, scriptCallback);
            }

        });

        // This is called when the $.ajax call is complete but failed. The file probably can't be found at the location specified.
        jxContent.fail(function () {
            // notify calling function that the page is not available to load
            console.error("Failed to load media " + uri);

            if (callback !== undefined) {
                callback(mediaId, null);
            }
        });
    };

    // Load a JavaScript file.
    self.loadScript = function (scriptUri, scriptCallback) {
        // Use jQuery $.getScript to "Load a JavaScript file from the server using a GET HTTP request, then execute it."
        $.getScript(uriFormatting.scriptUri(scriptUri))
            .done(function (script, textStatus) {
                if (scriptCallback) {
                    scriptCallback();
                }
            })
            .fail(function (jqxhr, settings, exception) {
                // If the script fails to load, give the scriptUri for troubleshooting.
                console.error("Error loading script " + scriptUri);

                // If the exception object is populated, log it as well for additional details.
                if (exception) {
                    console.error("Exception details: ");
                    console.error(exception);
                }
            });
    };
}