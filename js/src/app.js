// Copyright 2015-2016 NEXTEP SYSTEMS, Inc. All rights reserved.
// This code is property of NEXTEP SYSTEMS and cannot be duplicated
if (typeof jQuery === "undefined") { throw new Error("NEXTEP JavaScript Client requires jQuery"); }

// Setup global variable _nex.
var _nex = {
    assets: {
        buttons: {},
        buttonFactory: null,
        offline: null,
        popupManager: null,
        phaseManager: null,
        soundManager: null,
        templateManager: null,
        theme: null
    },
    commands: {},
    commmunication: null,
    completing: null,
    complete: null,
    device: null,
    keyboard: {
        keypad: null,
        numpad: null,
        phonepad: null,
        pagerpad: null,
        namepad: null
    },
    manager: null,
    ordering: null,
    payment: null,
    previousOrders: null,
    sms:null,
    greenReceipt: null,
    splashPhase: null,
    orderManager: null,
    utility: {
        cssListener: null,
        deviceListener: null, // for listening to any devices
        exceptionHandler: null,
        logging: null,
        orderTimer: null,
        rotateTimer: null,
        buttonTracking: null
    },
    hasGuestAccount: false,	//a guest account is associated to the current customer
    guestAccount: null,	//the guest account that is associated to the current customer
    writetolog: true, // set this to true to send WRITETOLOG commands whenever we do a console.log
    context: "UX",
    types: {
        lookup: {
            CANCEL: "",
            PHONE: "0",
            FACE: "1",
            CREDIT: "2",
            LOYALTY: "3",
            LOYALTY2: "4",
            EMPLOYEE: "5",
            GENERIC1: "6",
            GENERIC2: "7",
            GENERIC3: "8",
            GENERIC4: "9",
            GENERIC5: "10",
            GENERIC6: "11",
            GENERIC7: "12",
            GENERIC8: "13",
            GENERIC9: "14",
            GENERIC10: "15"
        }
    }
};


(function () {

    // Setup parameters.
    _nex.parameters = {
        offlinephase: {
            id: "__offline",
            CLIP: [
                {
                    id: "offline-kiosk",
                    filename: "offline-kiosk.html",
                    mediafolder: "html"
                }
            ]
        },
        initialphase: "splash"
    };


    // Setup authtoken. This is an object that exists in NEXTEP Mobile.
    _nex.authToken = {
        // It has these 4 properties.
        debug: "false",
        uri: "",
        copyright: "", // this is a default, it will be overwritten when the splash settings load
        code: ""
    };

    // Setup _nex.loc.id. This is an object that exists in NEXTEP Mobile.
    _nex.loc = {
        // Whenever the id is accessed, return the store id.
        get id() {
            return _nex.assets.theme.system.storeid;
        }
    };

    // Typical jQuery method to use when the document is ready.
    // This makes sure all the elements exist before we start trying to access/manipulate them.
    $(document).ready(function () {

        // init exception handler
        _nex.utility.exceptionHandler = new ExceptionHandler();
        _nex.utility.exceptionHandler.enable();

        // init communication
        _nex.device = _device;
        _nex.communication = new Communication({
            connection: _connection,
            commandFactory: new CommandFactory(),
            device: _device
        });

        // init css listener, so when we make CSS changes, they can be reflected immediately
        _nex.utility.cssListener = new CssListener({ listener: _cssListener });

        // init assets
        _nex.assets.buttonFactory = new _nex.assets.buttons.ButtonFactory();
        _nex.assets.theme = new ThemeUX(_device.defaultTheme(), _device.themeMediaPath());
        _nex.assets.phaseManager = new PhaseManager({
            theme: _nex.assets.theme,
            offlinePhase: _nex.parameters.offlinephase
        });
        _nex.assets.phaseManager.loadTheme([]); // this will init the phase manager; this method will be called again once theme data is received
        _nex.assets.soundManager = new SoundManager(_soundManager);

        // init the manager which maintains and controls the status of the application
        _nex.manager = new Manager({
            communication: _nex.communication,
            theme: _nex.assets.theme,
            phaseManager: _nex.assets.phaseManager
        });

        // if the theme is loaded ...
        if (_nex.assets.theme.id.length > 0) {
            // call the theme loaded method to finish initialization.
            themeLoaded();
        } else {
            $('#content').empty();
            $('#content').append(_nex.manager.formatError('Initialization Error', 'No theme is installed'));
        }

    });

    // Called after the theme object is loaded.
    function themeLoaded() {

        // further initialize the manager now that the theme has been loaded
        _nex.manager.init(_nex.device.deviceType(), _nex.assets.theme.id, _device.themeMediaPath(), _nex.parameters);

        // further initialize the CSS listener
        _nex.utility.cssListener.init(); // inits CssRefresh to watch for changes to css files

        //
        // initialize phases
        //

        // initialize the previous orders phase
        _nex.previousOrders = new PreviousOrders({
            theme: _nex.assets.theme
        });

        // initialize the ordering phase
        _nex.orderManager = new OrderManager();

        _nex.ordering = new OrderingUX({
            theme: _nex.assets.theme,
            orderManager: _nex.orderManager
        });

        // initialize the payment phase
        _nex.payment = new Payment({
            theme: _nex.assets.theme
        });

        // initialize the post ordering phase
        _nex.postOrdering = new PostOrdering();

        // initialize the sms phase
        _nex.sms = new sms({
            theme: _nex.assets.theme
        });
        // initialize the receipt phase
        _nex.greenReceipt = new GreenReceipt({
            theme: _nex.assets.theme
        });

        // initialize the splash phase
        _nex.splashPhase = new SplashPhase();

        // initialize the complete phase
        _nex.complete = new Complete({});

        // create targets div that is used to load HTML snippets into
        $('#content').empty();
        $('#content').append("<div id='targets' ><div id='" + _nex.parameters.offlinephase.id + "' ></div></div>");
        //$('#content').append("");

        // disable horizontal scrolling
        disableHorizontalScrolling();

        // since there could be buttons on the screen soon, init sounds
        var mediaPath = _nex.assets.theme.mediaPath();
        _nex.assets.soundManager.initialize(mediaPath + "Sounds");

        // overwrite the console.log method to also send WRITETOLOG commands
        if (_nex.writetolog && !inPreviewer()) {
            _nex.utility.logging = new Logging(_nex.communication.send);
        }

        // setup rotate timer to help prevent screen burn-in
        _nex.utility.rotateTimer = new RotateTimer('wrap');

        // setup keyboard
        _nex.keyboard.keypad = new Keypad(); // used also for email
        _nex.keyboard.numpad = new Numpad(); // used also for pinpad
        _nex.keyboard.phonepad = new Phonepad(_nex.assets.soundManager);
        _nex.keyboard.pagerpad = new Pagerpad();
        _nex.keyboard.namepad = new Namepad();
        // the targets div is setup... we can go offline, and start the connection process
        goOffline();
    }

    // This function is called after everything finishes initializing.
    function goOffline() {
        // up until this point, we haven't connected yet and received the first command.
        // The offline status in the corner should be blank.
        _nex.assets.offline = new Offline(window.htmlEscape);
        _nex.assets.offline.clearReason();

        // This function is called after the offline HTML page is finished loading.
        function offlineHtmlLoaded() {
            startConnection();
        }

        // This function is called after the offline JavaScript file is finished loading.
        function offlineScriptLoaded() {
            // There isn't any JS file for offline currently.
        }

        // load default offline; this starts the communication and loads the application
        _nex.assets.phaseManager.goOffline(offlineHtmlLoaded, offlineScriptLoaded);
    }

    function disableHorizontalScrolling() {
        document.ontouchmove = function (event) {
            // Only disable scrolling on the splash.
            if (_nex.assets.phaseManager && _nex.assets.phaseManager.currentPhase === _nex.assets.phaseManager.phaseType.SPLASH)
            {
                event.preventDefault();
            }
        };
    }

    // This function is called when we are ready to connect to the UI Manager over TCP.
    function startConnection() {
        console.debug("Connecting ...");
       _nex.communication.connect();
    }

})();