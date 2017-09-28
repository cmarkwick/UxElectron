// Constuctor. Represents the splash phase.
function SplashPhase() {

    var self = this;
    self.actions = null;
    self.firsttime = false;
    self._deviceData = null;
    self.userSwipedToStart = false;
    self.clickX = window.innerWidth / 2;
    self.clickY = window.innerHeight / 2;
    self.handledSplashClick = false; // set to true when the screen is moved to where the user clicked
    self.splashSettings = null;
    self.redirected = false;
    self.barcodescanmenu = null;

    // Set this to true to enable debugging of the splash phase.
    var enableDebugging = true;
    self._debug = function () {
        if (enableDebugging) {
            console.debug("SplashPhase", arguments); // use built-in arguments object
        }
    };

    // This method is called by the CreateJS JavaScript after it has finished.
    // Takes an option parameter btnReturningGuestId if the start button is not the one specified in the system actions. 
    self.start = function (canvasElementId, btnFirstTimeId, btnReturningGuestId) {

        // Set internal variables back to default.
        self._reset();

        // Send a status update to the UI manager.
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.IDLE);

        if (!_nex.assets.theme.splashid) {
            console.error("Could not load the splash id from the theme!");
        }

        // Check actions. This sets an array for each action enabled.
        self._checkActions(_nex.assets.theme.splashid);
        self._debug("start", "actions enabled", self.actions);

        // Check splash settings for things like the resolution to display the ordering phase, and copyright.
        self._checkSplashSettings(_nex.assets.theme.splashid);
        self._debug("start", "splash settings", self.splashSettings);

        // If the video feed is enabled:
        // TODO : add FacePay option to the payment profile to enable this option
        if(_nex.assets.theme.hasvideo)
        {
            self._debug("start", "Adding video feed.");
            self._addVideoFeed(); //TODO: needs to be refactored to only add the video feed to splash when FR tender is used
        }

        // If the start ordering action is enabled:
        if (self.actions.startorder) {
            self._debug("start", "Binding buttons for first time and returning guest.");
            self._bindButtons(canvasElementId, btnFirstTimeId, btnReturningGuestId);
        }

        // If swipe to start is enabled:
        if (self.actions.cardswipe || self.actions.barcodescan) {
            self._debug("start", "Cardswipe action is enabled... Listening for swipe");
            self.swipeToStartAction = new SwipeToStartAction(_nex.assets.theme);
            self.swipeToStartAction.startListening(self.deviceToStart);
        }

        // If a background was specified for the splash:
        if (_nex.assets.theme.hasOwnProperty('kiosk') && _nex.assets.theme.kiosk.hasOwnProperty('splashbg')) {
            // Try and set it. If this fails, it should not cause any issue, but it will log that it failed.
            var filepath = _nex.assets.theme.mediaPath();
            filepath += 'Other/';
            var filename = _nex.assets.theme.kiosk.splashbg;
            var splashvideoid = "splashvideo";
            self.setBackground(filepath, filename, btnFirstTimeId, btnReturningGuestId, splashvideoid);
        }   
    };

    // Called when exiting the splash phase, e.g. going offline.
    self.stop = function () {
        // Stop the CreateJS ticker.
        self._stopTicker();
    };


    // Called when a user clicks the splash screen to start.
    self.clickToStart = function () {
        self._trackClick();
        _nex.assets.theme.languageSelected = 'english';
        self._startHelper();
    };

    // For the enhanced splash screen. Called when user clicks first time to start.
    self.firstTimeToStart = function () {
        self._trackFirstTime();
        _nex.assets.theme.languageSelected = 'english';
        self._startHelper();
    };

    // For the enhanced splash screen. Called when user clicks returning guest to start.
    self.returningGuestStart = function () {
        self._trackReturningGuest();
        _nex.assets.theme.languageSelected = 'english';
        self._startHelper();
    };

    // Called when a user clicks on the camera frame to start.
    self.cameraFrameClicked = function () {
        self._trackClickVideo();
        _nex.assets.theme.languageSelected = 'english';
        self._startHelper();
    };

    // Called when a user swipes to start.
    self.deviceToStart = function (data) {
        self._trackSwipe();
        self.userSwipedToStart = true;
        _nex.assets.theme.languageSelected = 'english';
        self._startHelper(data, self.barcodescanmenu);
    };

    // Called when a user picks an alternate language to start.
    self.alternateLanguageToStart = function (language) {
        self._trackAlternateLanguage(language);
        _nex.assets.theme.languageSelected = language;
         self._startHelper();
    };

    // PRIVATE / HELPER METHODS

    // Restore original state of the splash phase.
    self._reset = function () {
        self.firsttime = false;
        self._deviceData = null;
        self.userSwipedToStart = false;
        self.handledSplashClick = false;
        self._resetRotateTimer();
        self._hideAllPopups();
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop();
            _nex.utility.deviceListener = null;
        }
        _nex.orderManager.customData = {};
    };

    // Set the screen to original positioning.
    self._resetRotateTimer = function () {
        if (_nex.utility.rotateTimer) {
            _nex.utility.rotateTimer.reset();
        }
    };

    // Hide all the popups.
    self._hideAllPopups = function () {
        _nex.assets.popupManager.hideAllPopups();
    };

    // Setup the video feed.
    self._addVideoFeed = function () {
        //cam feed frame.  The reason why there is an iframe is due to an issue with Chromium for basic auth where the user name and password was stripped from the img tag.
        //This does not happen to iframes.  But the credentials get cached by the iframe so the img tag works.
        if(_nex.assets.theme.hasvideo)
        {
            var url = "http://127.0.0.1:8088";
            if(_nex.assets.theme.frenabled)
            {
                url = "http://127.0.0.1:8089";
            }

            var password = "Kiosk1";
            var userid = "nextep";
            var feedUrl = "\"" + url + "\"";

            feedUrl = feedUrl.replace("http://", "http://" + userid + ":" + password + "@");

            //$("#splash").append('<iframe src=' + feedUrl + ' style="display:none"></iframe>');
            //$("#splash").append('<img src=' + feedUrl + ' id="cameraFrame" class="camera-frame" alt="Video Feed Unavailable" >');


            //var iframe = '<iframe src=' + feedUrl + ' style="display:none" ></iframe>';
            //var img = '<img src=' + feedUrl + ' id="cameraFrame" class="camera-frame" alt="Video Feed Unavailable" >';

            //// comment out for now because we no longer wish to show the video feed on the splash screen.
            //// we may bring this back for self service kiosks.
            //$("#splash").append(iframe);
            //$("#splash").append(img);


            //$("#cameraFrame").unbind("click");
            //$("#cameraFrame").click(function () {
            //    self.cameraFrameClicked();
            //});
        }
    };

    // Setup the first start button.
    self._bindFirstStart = function (btnFirstTimeId) {
        self._debug("Binding first start");

        var firstStart = null;

        if (btnFirstTimeId) {
            // Override.
            firstStart = $("#" + btnFirstTimeId);
        } else if (self.actions.startorder.firststartbuttonid) { //  TODO: Add this attribute. There is a buttonid but no firststartbuttonid
            // use it to get the button.
            firstStart = $("#" + self.actions.startorder.firststartbuttonid);
        }

        if (firstStart && firstStart.length > 0) {
            firstStart.button();
            firstStart.unbind("click");
            firstStart.click(function(event) {
                // Call the click to start method.
                self.firsttime = true;
                self.firstTimeToStart();
                self.clickX = event.pageX;
                self.clickY = event.pageY;
            });
            // There was an issue where the button was resizing on the second time through to less than the screen height...
            // this should fix that issue.
            firstStart.css("height", function() {
                return window.innerHeight;
            });
        }
    };

    // Setup the guest start button.
    self._bindGuestStart = function (btnReturningGuestId) {
        self._debug("Binding guest start");

        var guestStart = null;

        if (btnReturningGuestId) {
            // Override.
            guestStart = $("#" + btnReturningGuestId);
        } else if (self.actions.startorder.buttonid) {
            // use it to get the button.
            guestStart = $("#" + self.actions.startorder.buttonid);
        }

        if (guestStart && guestStart.length > 0) {
            guestStart.button();
            guestStart.unbind("click");
            guestStart.click(function (event) {
                // Call the click to start method.
                self.firsttime = false;
                self.returningGuestStart();
                self.clickX = event.pageX;
                self.clickY = event.pageY;
            });
            // There was an issue where the button was resizing on the second time through to less than the screen height...
            // this should fix that issue.
            guestStart.css("height", function () {
                return window.innerHeight;
            });
        }
    };

    // Setup the language button.
    self._bindLanguageButton = function () {
  
        if (!self.actions.selectlanguage) {
            return;
        }
        self._debug("Binding language button");

        // TODO: Handle support for more than one language.

        var languageid = self.actions.selectlanguage.languageid;
        //var languageid = 'spanish';
        self._debug("select language is enabled... adding the alernate language button for language id " + languageid);
        if (languageid) {
            var languageButtonId = languageid + "ToStart";
            var onClick = "_nex.splashPhase.alternateLanguageToStart('" + languageid + "')";
            if (!document.getElementById(languageButtonId)) {
                $("#splash").append('<button class="alternateLanguageToStart" id="' + languageButtonId + '" onclick="' + onClick + '"></button>');
            }
            // Create the language action.
            var languageAction = new SetLanguageAction(_nex.assets.theme);
            var defaultText = languageid;
            if (languageid === 'spanish') {
                defaultText = "ESPAÑOL";
            }
            languageAction.initialize(languageid, $("#" + languageButtonId), defaultText);
        } else {
            console.log("Missing element languageid!!");
        }
    };

    // Bind returning guest and first time buttons to the splash screen.
    self._bindButtons = function (canvasElementId, btnFirstTimeId, btnReturningGuestId) {
        self._bindFirstStart(btnFirstTimeId);
        self._bindGuestStart(btnReturningGuestId);
        self._bindLanguageButton();
    };
 
    // Called when we no longer want to listen for a card swipe, e.g. leaving hte splash phase.
    self._stopListeningForDevice = function () {
        if (self.swipeToStartAction) {
            self.swipeToStartAction.stopListening();
        }
    };

    // Checks the swipe data and hands processing over to the SwipeToStart action.
    self._checkSwipeData = function() {
        var cardParser = new CardParser(_nex.assets.theme);
        cardParser.parse(self._swipeData.track1, self._swipeData.track2, self.swipeToStartAction.goodSwipe, self.swipeToStartAction.badSwipe);
    };

    // Stop the createjs ticker.
    self._stopTicker = function () {
        // If we don't stop the ticker, then we were getting 404 errors on .ajax calls for media downstream, and certain
        // clips and images won't load properly.
        if (createjs && createjs.Ticker) {
            createjs.Ticker.reset();
        }
    };

    // This method contains logic common to the different ways of starting from the splash screen.
    self._startHelper = function (data) {

        // Stop listening for card swipes to start.
        self._stopListeningForDevice();
        self._deviceData = "";
        self._stopTicker();

        // If there is data present, they swiped to start.
        if (data) {
            self._deviceData = data;
        }
        
		// Create a customer response listener to retrieve a related Guest Account based on facial recognition. 
		// The customer response message is the result of the create order command sent below (hijacked). The 
		// create order command spawns a customer inquiry command sent from the client to the TM then a 
		// request guest orders command sent from the TM to mynextep services. The TM then responds with a 
		// customer response message that is handled here.
		_nex.communication.addListener(_nex.communication.createListener("CUSTOMERRESPONSE", function(message)
		{
			//A Guest Account was returned via facial recognition search -- populate the JS object from the response...
			if(message.CUSTOMER !== undefined && message.CUSTOMER !== null && Boolean(message.CUSTOMER.facesearch))
			{
				//The Guest Account has a location...
				if(message.CUSTOMER.LOCATION !== undefined && message.CUSTOMER.LOCATION !== null)
				{
					var isGuestAccountLocation = false;

					//The Guest Account has multiple locations...
					if(Array.isArray(message.CUSTOMER.LOCATION))
					{
						for(var i = 0; i < message.CUSTOMER.LOCATION.length; i++)
						{
							//The Guest Account is valid for this location...
							if(message.CUSTOMER.LOCATION[i].identifier === _nex.assets.theme.system.storeid)
							{
								isGuestAccountLocation = true;
								break;
							}
						}
					}
					else
					{
						//The Guest Account is valid for this location...
						if(message.CUSTOMER.LOCATION.identifier === _nex.assets.theme.system.storeid)
						{
							isGuestAccountLocation = true;
						}
					}

					//The Guest Account is valid for this location...
					if(isGuestAccountLocation)
					{
						_nex.hasGuestAccount = true;
						_nex.guestAccount = new GuestAccount(message.CUSTOMER.guestaccountid, message.CUSTOMER.firstname, message.CUSTOMER.lastname, message.CUSTOMER.email, message.CUSTOMER.thumbnail64, message.CUSTOMER.ACCOUNT);
						console.log(_nex.guestAccount);
						//alert("Guest Account Found\n" + _nex.guestAccount.firstName + " " + _nex.guestAccount.lastName + " (email: " + _nex.guestAccount.email + ")\naccounts: " + _nex.guestAccount.chargeableLocalAccounts.length);
					}
				}
			}
		}, true));
		//End Customer Response Listener -- Guest Account Lookup via Facial Recognition
		
        // Create the order.
		_nex.communication.send(new _nex.commands.CreateOrder(_nex.assets.theme.hasvideo, _nex.assets.theme.frenabled), function()
		{
            _nex.orderManager.startOrder();

            // Swiped to start.
            if (self._deviceData && _nex.previousOrders.isPreviousOrdersEnabled()) {
                    console.log('User swiped to start. Going to previous orders');
                     _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PREVIOUS_ORDERS, function () {
                        _nex.previousOrders.start(self._deviceData);
                    });
                }
            // Guest start.
            else if (self.firsttime === false && _nex.previousOrders.isPreviousOrdersEnabled()) {
                // First time.
                _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PREVIOUS_ORDERS, function () {
                    _nex.previousOrders.start();
                });
            } else if (self._deviceData && self.barcodescanmenu) {
                _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function () {
                    _nex.ordering.start(self.barcodescanmenu);
                });
            } else {
                // Change to ordering phase.
                _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function () {
                    _nex.ordering.start();
                });

            }
        }, "CREATEORDERRESPONSE");
    };


    // Setup enabled actions.
    self._checkAction = function (action) {
        if (action.actionid === 'adminswipe' && action.enabled === "true") {
            self.actions.adminswipe = action;
        } else if (action.actionid === 'cardswipe' && action.enabled === "true") {
            self.actions.cardswipe = action;
        } else if (action.actionid === 'startorder' && action.enabled === "true") {
            self.actions.startorder = action;
        } else if (action.actionid === 'futureorder' && action.enabled === "true") {
            self.actions.futureorder = action;
        } else if (action.actionid === 'playanimation' && action.enabled === "true") {
            self.actions.playanimation = action;
        } else if (action.actionid === 'selectlanguage' && action.enabled === "true") {
            self.actions.selectlanguage = action;
        } else if (action.actionid === 'barcodescan' && action.enabled === "true") {
            self.actions.barcodescan = action;
            self.barcodescanmenu = action.barcodescanmenu;
        }
    };

    // Helper for checking which actions are enabled.
    self._checkItem = function (item, splashId) {
        // there can be settings for the SPLASH screen for the POS, for example.    
        // we are just interested in the default settings, or ones for the kiosk.
        var action = null;
        if (item.id === splashId) {
            if (item.ACTION) {
                if (Array.isArray(item.ACTION)) {
                    for (var actionIndex = 0; actionIndex < item.ACTION.length; actionIndex++) {
                        action = item.ACTION[actionIndex];
                        self._checkAction(action);
                    }
                } else {
                    action = item.ACTION;
                    self._checkAction(action);
                }
            }
        }
    };

    // Check which actions are enabled on the splash screen.
    self._checkActions = function (splashId) {
        var userInterface = _nex.assets.theme.system.USERINTERFACE;
        self.actions = {};
        var item = null;
        if (userInterface.SPLASH) {
            if (Array.isArray(userInterface.SPLASH)) {
                for (var index = 0; index < userInterface.SPLASH.length; index++) {
                    item = userInterface.SPLASH[index];
                    self._checkItem(item, splashId);
                }
            } else {
                item = userInterface.SPLASH;
                self._checkItem(item, splashId);
            }
        }
    };

    // Check which resolution is set in the splash touch settings.
    self._checkSplashSettings = function (splashId) {
        self._debug("Checking splash settings for splash id " + splashId);
        var userInterface = _nex.assets.theme.system.USERINTERFACE;
        var item = null;
        if (userInterface.SPLASH) {
            if (Array.isArray(userInterface.SPLASH)) {
                for (var index = 0; index < userInterface.SPLASH.length; index++) {
                    item = userInterface.SPLASH[index];
                    if (item.id === splashId) {
                        self.splashSettings = item;
                    }
                }
            } else {
                item = userInterface.SPLASH;
                if (item.id === splashId) {
                    self.splashSettings = item;
                }
            }
        }

        // If we were able to find splash settings for this computer, update the copyright notice.
        if (self.splashSettings) {
            try {
                _nex.authToken.copyright = self.splashSettings.SPLASHTEXT.copyright;
                self._debug(_nex.authToken.copyright);
                // insert line breaks in to splash text
                if (_nex.splashPhase.splashSettings.SPLASHTEXT.hasOwnProperty("INSTRUCTION")) {
                    _nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION = $.isArray(_nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION) ? _nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION : new Array(_nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION);
                    for (var s = 0; s < _nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION.length; s++) {
                        var text = _nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION[s].message;
                        if (text !== undefined) {
                            text = text.replace(/~/g, "\n"); // createjs does not support <br/>
                            text = text.trim();
                        }
                        
                        _nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION[s].message = text;
                    }
                }
            } catch (e) {
                console.log("ERROR SETTING COPYRIGHT");
                console.log(e);
            }    
        } else {
            console.error("UNABLE TO LOAD SPLASH SETTINGS");
        }
    };

    // Track a click on the splash screen. 
    self._trackClick = function () {
        var BUTTON_ID = ""; // Will be translated to NULL
        var BUTTON_TEXT = ""; // Will be inserted as empty string
        var MENU_ID = ""; // Will translate to NULL
        var CONTEXT = "SplashAction";
        var BUTTON_TYPE = "control"; // will be translated to control
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE);
    };

    // Track a click on the video feed.
    self._trackClickVideo = function () {
        var BUTTON_ID = ""; // Will be translated to NULL
        var BUTTON_TEXT = "Video Feed"; // Will be inserted as empty string
        var MENU_ID = ""; // Will translate to NULL
        var CONTEXT = "SplashAction";
        var BUTTON_TYPE = "control"; // will be translated to control
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE);
    };

    self._trackFirstTime = function () {
        var BUTTON_ID = ""; // Will be translated to NULL
        var BUTTON_TEXT = "First Time";
        var MENU_ID = ""; // Will translate to NULL
        var CONTEXT = "SplashAction";
        var BUTTON_TYPE = "control"; // will be translated to control
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE);
    };

    self._trackReturningGuest = function () {
        var BUTTON_ID = ""; // Will be translated to NULL
        var BUTTON_TEXT = "Returning Guest";
        var MENU_ID = ""; // Will translate to NULL
        var CONTEXT = "SplashAction";
        var BUTTON_TYPE = "control"; // will be translated to control
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE);
    };

    // Track a swipe to start.
    self._trackSwipe = function () {
        var BUTTON_ID = ""; // Will be translated to NULL
        var BUTTON_TEXT = "swipe"; // Change to swipe to indicate 'swiped to start' TODO: Verify if this is preferred way
        var MENU_ID = ""; // Will translate to NULL
        var CONTEXT = "SplashAction";
        var BUTTON_TYPE = "control"; // will be translated to control
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE);
    };

    // Track alternate language to start.
    self._trackAlternateLanguage = function (language) {
        var BUTTON_ID = ""; // Will be translated to NULL
        var BUTTON_TEXT = language; // TODO: Verify if this is preferred way
        var MENU_ID = ""; // Will translate to NULL
        var CONTEXT = "SplashAction";
        var BUTTON_TYPE = "control"; // will be translated to control
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE);
    };

    // Helper function to set the background to a webm file. This can be a video file or an image.
    self._setBackgroundWebm = function (filePath, callback, firstTimeElementId, returningGuestElementId, splashVideoElementId) {
        console.log("Loading splash video onto element");
        var video = document.getElementById(splashVideoElementId);
        if (!video) {
            console.log("Missing element " + splashVideoElementId);
            return;
        }
        var source = document.createElement('source');

        console.log("Videofile: " + filePath);

        // In mynextep the options to choose from are in the "other' folder.
        source.setAttribute('src', filePath);

        video.appendChild(source);
        video.play();
        $("#" +splashVideoElementId).show();

        //_nex.splashPhase.start("canvas", "btnFirstTime", "btnReturningGuestId");
        var selector = "#" + firstTimeElementId + ", #" + returningGuestElementId;

        $(selector).bind("click", function() {
            $("#" +splashVideoElementId).hide();
            callback();
        });

        self._setCopyright();
    };

    self._setCopyright = function () {
        // add the copyright.
        var copyrightText = copyrightNotice();
        var copyrightHtml = '<div id="copyright">' + copyrightText + '</div>';
        self._debug("Appending " + copyrightHtml);
        $("#splash").append(copyrightHtml);
    };

    // Set the background to a video or image on the splash screen.
    self.setBackground = function (filepath, filename, firstTimeElementId, returningGuestElementId, splashVideoElementId) {
        var fullpath = filepath + filename;

        if (fullpath.endsWith("webm")) {
            var callback = _nex.splashPhase.clickToStart;
            self._setBackgroundWebm(fullpath, callback, firstTimeElementId, returningGuestElementId, splashVideoElementId);
        }
    };
}

