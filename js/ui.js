// Copyright 2015-2016 NEXTEP SYSTEMS, Inc. All rights reserved.
// This code is property of NEXTEP SYSTEMS and cannot be duplicated
if (typeof jQuery === 'undefined') { throw new Error('NEXTEP JavaScript Client requires jQuery') }

function connectToHub() {
    var url = 'http://localhost:8011/signalr'
    var connection = $.hubConnection(url, {
        useDefaultPath: false
    })

    console.log(uXHubProxy)
    var uXHubProxy = connection.createHubProxy('uxHub')
    connection.start()
        .done(function() { console.log('Now connected, connection ID=' + connection.id) })
        .fail(function() { console.log('Could not connect'); throw 'Did not connect!' })

    uXHubProxy.on('uXReceive', function(name, message) {
        _nex.communication.receive(message)
        console.log(name + ' ' + message)
    });
}

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
    sms: null,
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
    touchListener: null,
    hasGuestAccount: false, // a guest account is associated to the current customer
    guestAccount: null, // the guest account that is associated to the current customer
    writetolog: true, // set this to true to send WRITETOLOG commands whenever we do a console.log
    context: 'UX',
    types: {
        lookup: {
            CANCEL: '',
            PHONE: '0',
            FACE: '1',
            CREDIT: '2',
            LOYALTY: '3',
            LOYALTY2: '4',
            EMPLOYEE: '5',
            GENERIC1: '6',
            GENERIC2: '7',
            GENERIC3: '8',
            GENERIC4: '9',
            GENERIC5: '10',
            GENERIC6: '11',
            GENERIC7: '12',
            GENERIC8: '13',
            GENERIC9: '14',
            GENERIC10: '15'
        }
    }
}

// Anytime a key is hit.
function bodyOnKeyPress(event) {
    if (event && event.hasOwnProperty('preventDefault')) {
        event.preventDefault()
    }
    if (_nex && _nex.navBarListener) {
        _nex.navBarListener.keyPressed(null, event)
    }
}

(function() {
    // Setup parameters.
    _nex.parameters = {
        offlinephase: {
            id: '__offline',
            CLIP: [{
                id: 'offline-kiosk',
                filename: 'offline-kiosk.html',
                mediafolder: 'html'
            }]
        },
        initialphase: 'splash'
    }


    // Setup authtoken. This is an object that exists in NEXTEP Mobile.
    _nex.authToken = {
        // It has these 4 properties.
        debug: 'false',
        uri: '',
        copyright: '', // this is a default, it will be overwritten when the splash settings load
        code: ''
    }

    // Setup _nex.loc.id. This is an object that exists in NEXTEP Mobile.
    _nex.loc = {
        // Whenever the id is accessed, return the store id.
        get id() {
            return _nex.assets.theme.system.storeid
        }
    }

    _nex.kvi = {
        active: false
    }

    // Normally this would be created from the C# code. Instead, for the previewer,
    // implement it differently.
    if (_nex.context === 'UX' && inPreviewer()) {
        window._soundManager = {
            initialize: function(filepath) {},
            playSound: function(filename) {},
            volUp: function() {},
            volDown: function() {},
            speak: function(text) {
                var msg = new SpeechSynthesisUtterance(text)
                window.speechSynthesis.speak(msg)
            },
            cancelSpeak: function() {
                window.speechSynthesis.cancel()
            },
            setSpeaker: function(jackin) {}
        }
    }

    _nex.inAdvancedMode = false

    // Typical jQuery method to use when the document is ready.
    // This makes sure all the elements exist before we start trying to access/manipulate them.
    $(document).ready(function() {
        document.addEventListener('click', function() {
            if (_nex.assets.soundManager) {
                _nex.assets.soundManager.cancelSpeak()
            }
        })

        // init exception handler
        _nex.utility.exceptionHandler = new ExceptionHandler()
        _nex.utility.exceptionHandler.enable()

        // init communication
        _device = {
            computerName: function() { return 'UXBONAPPKIOSK'; },
            defaultTheme: function() { return 'BonAppetit'; },
            deviceType: function() { return 'Kiosk'; },
            themeMediaPath: function() { return 'Themes/'; }
        }
        _nex.device = _device
        _connection = {}
        _nex.communication = new Communication({
            connection: _connection,
            commandFactory: new CommandFactory(),
            device: _device
        })
        _cssListener = {}
            // init css listener, so when we make CSS changes, they can be reflected immediately
        _nex.utility.cssListener = new CssListener({ listener: _cssListener })

        // init assets
        _nex.assets.buttonFactory = new _nex.assets.buttons.ButtonFactory()
        _nex.assets.theme = new ThemeUX(_device.defaultTheme(), _device.themeMediaPath())
        _nex.assets.phaseManager = new PhaseManager({
            theme: _nex.assets.theme,
            offlinePhase: _nex.parameters.offlinephase
        })
        _nex.assets.phaseManager.loadTheme([]) // this will init the phase manager; this method will be called again once theme data is received
        _soundManager = {}
        _nex.assets.soundManager = new SoundManager(_soundManager)

        // init the manager which maintains and controls the status of the application
        _nex.manager = new Manager({
            communication: _nex.communication,
            theme: _nex.assets.theme,
            phaseManager: _nex.assets.phaseManager
        })

        // if the theme is loaded ...
        if (_nex.assets.theme.id && _nex.assets.theme.id.length > 0) {
            // call the theme loaded method to finish initialization.
            themeLoaded()
        } else {
            $('#content').empty()
            $('#content').append(_nex.manager.formatError('Initialization Error', 'No theme is installed'))
        }
        _nex.tabManager = new TabManager()
    })

    // Called after the theme object is loaded.
    function themeLoaded() {
        // further initialize the manager now that the theme has been loaded
        _nex.manager.init(_nex.device.deviceType(), _nex.assets.theme.id, _device.themeMediaPath(), _nex.parameters)

        // further initialize the CSS listener
        _nex.utility.cssListener.init() // inits CssRefresh to watch for changes to css files

        //
        // initialize phases
        //

        // initialize the previous orders phase
        _nex.previousOrders = new PreviousOrders({
            theme: _nex.assets.theme
        })

        // initialize the ordering phase
        _nex.orderManager = new OrderManager()

        _nex.ordering = new OrderingUX({
            theme: _nex.assets.theme,
            orderManager: _nex.orderManager
        })

        // initialize the payment phase
        _nex.payment = new Payment({
            theme: _nex.assets.theme
        })

        // initialize the post ordering phase
        _nex.postOrdering = new PostOrdering()

        // initialize the sms phase
        _nex.sms = new sms({
                theme: _nex.assets.theme
            })
            // initialize the receipt phase
        _nex.greenReceipt = new GreenReceipt({
            theme: _nex.assets.theme
        })

        // initialize the splash phase
        _nex.splashPhase = new SplashPhase()

        // initialize the complete phase
        _nex.complete = new Complete({})

        // create targets div that is used to load HTML snippets into
        $('#content').empty()
        $('#content').append("<div id='targets' ><div id='" + _nex.parameters.offlinephase.id + "' ></div></div>")
            //$('#content').append("");

        // disable horizontal scrolling
        disableHorizontalScrolling()

        // since there could be buttons on the screen soon, init sounds
        var mediaPath = _nex.assets.theme.mediaPath()
        _nex.assets.soundManager.initialize(mediaPath + 'Sounds')

        // overwrite the console.log method to also send WRITETOLOG commands
        if (_nex.writetolog && !inPreviewer()) {
            _nex.utility.logging = new Logging(_nex.communication.send)
        }

        // setup rotate timer to help prevent screen burn-in
        _nex.utility.rotateTimer = new RotateTimer('wrap')

        // setup keyboard
        _nex.keyboard.keypad = new Keypad() // used also for email
        _nex.keyboard.numpad = new Numpad() // used also for pinpad
        _nex.keyboard.phonepad = new Phonepad(_nex.assets.soundManager)
        _nex.keyboard.pagerpad = new Pagerpad()
        _nex.keyboard.namepad = new Namepad()
            // the targets div is setup... we can go offline, and start the connection process
        goOffline()

        _nex.touchListener = new TouchListener()
        _nex.touchListener.listenForTouchStart()
        _nex.touchListener.listenForTouchEnd()
    }

    // This function is called after everything finishes initializing.
    function goOffline() {
        // up until this point, we haven't connected yet and received the first command.
        // The offline status in the corner should be blank.
        _nex.assets.offline = new Offline(window.htmlEscape)
        _nex.assets.offline.clearReason()

        // This function is called after the offline HTML page is finished loading.
        function offlineHtmlLoaded() {
            startConnection()
        }

        // This function is called after the offline JavaScript file is finished loading.
        function offlineScriptLoaded() {
            // There isn't any JS file for offline currently.
        }

        // load default offline; this starts the communication and loads the application
        _nex.assets.phaseManager.goOffline(offlineHtmlLoaded, offlineScriptLoaded)
    }

    function disableHorizontalScrolling() {
        document.ontouchmove = function(event) {
            // Only disable scrolling on the splash.
            if (_nex.assets.phaseManager && _nex.assets.phaseManager.currentPhase === _nex.assets.phaseManager.phaseType.SPLASH) {
                event.preventDefault()
            }
        }
    }

    // This function is called when we are ready to connect to the UI Manager over TCP.
    function startConnection() {
        console.debug('Connecting ...')
            // connect();
            // fetch('http://localhost:8011/api/connection/connect', {
            //     method: 'POST'
            // });
        _nex.communication.connect()
    }
})()

function CommandFactory() {
    var self = this

    self.isCommandSupport = function(cmd) {
        var isSupported = false
        switch (cmd.name) {
            case 'ADDTOORDERRESPONSE':
            case 'COMPLETEORDER':
            case 'TENDERADDED':
            case 'CANCELORDERRESPONSE':
            case 'CARDSWIPE':
            case 'CONSOLIDATEORDERRESPONSE':
            case 'COUPONRESPONSE':
            case 'CREATEORDERRESPONSE':
            case 'CUSTOMERRESPONSE': // this response is returned from the TM if facial recognition is configured on the kiosk
            case 'DEVICELOOKUPRESPONSE':
            case 'EMPLOYEERESPONSE':
            case 'GENERICINQUIRYRESPONSE':
            case 'LICENSEUPDATE':
            case 'LOADORDERRESPONSE':
            case 'LOYALTYRESPONSE':
            case 'ORDERPROCESSED':
            case 'ORDERTOTAL':
            case 'PAYMENTRESPONSE': // This command comes back when a payment device processes a payment.
            case 'PREVIOUSORDERS':
            case 'PROCESSLOYALTYRESPONSE':
            case 'PROCESSTENDERRESPONSE':
            case 'PROXIMITYTRIGGERED':
            case 'REMOVEFROMORDERRESPONSE':
            case 'SERVERSTATUS':
            case 'SETSERVICEMODE':
            case 'UPDATEQUANTITYRESPONSE':
            case 'UPDATETENDERRESPONSE':
            case 'EMPLOYEESECURITYCHECK':
            case 'EMPLOYEESECURITYCHECKRESPONSE':
            case 'SWITCHAPPLICATION':
            case 'ITEMWEIGHT':
            case 'ITEMLOOKUP':
            case 'ITEMLOOKUPRESPONSE':
            case 'ORDERLOOKUP':
            case 'ORDERLOOKUPRESPONSE':
            case 'UPDATEKIOSK':
            case 'WINDOWONTOP':
                {
                    isSupported = true
                    break;
                }
            default:
                {
                    console.log('command is not supported; name: ' + cmd.name)
                    break;
                }
        }
        // Note: The Manager is where responses are listened for in Manager.commandReceived.

        return isSupported
    };
}
/*
 * communication.js
 * handles the communication to the C# 
 * connectObj is the C# code that is accessible from javascript
 */
function Communication(paramObj) {
    var self = this

    self.connection = paramObj.connection || null
    self.commandFactory = paramObj.commandFactory || null
    self.device = paramObj.device || null

    self.subscribers = [] // array of objects { cmdName : "", callback : [function] }

    // call close to handle if the page was reloaded
    //self.connection.close()self.connection.close();

    self.debugEnabled = true
    self.debug = function() {
        if (self.debugEnabled) {
            console.debug(arguments)
        }
    }

    // delegate 
    self.createListener = function(commandName, callback, autoRemove) {
        return {
            cmdName: commandName,
            callback: callback,
            autoRemove: autoRemove || false
        }
    };

    // methods
    self.connect = function() {
        console.debug('connecting')
        fetch('http://localhost:8011/api/connection/connect', {
            method: 'POST'
        })
        connectToHub()
            // if (self.connection !== null) {
            //     console.debug('connecting');
            // self.connection.connect();
            // }
    };

    self.close = function() {
        if (self.connection !== null) {
            self.connection.close()
        }
    }


    self.send = function(cmd, callback, responseCmdName) {
        if (cmd.name !== 'WRITETOLOG') {
            self.debug('communication - send message ' + cmd.name, cmd)
        }
        var obj = cmd.write()
        obj[cmd.name] = $.extend(true, { pcid: self.device.computerName() }, obj[cmd.name]) // the pcid needs to before other properties so the JSON to XML conversion works as expected
        var msg = JSON.stringify(obj[cmd.name])

        responseCmdName = responseCmdName || '';
        if (responseCmdName.length > 0) {
            // console.debug("communication - listening for " + responseCmdName);
            self.addListener(self.createListener(responseCmdName, callback, true))
        }

        if (self.connection !== null) {
            console.debug('Sending' + msg)
            var jsonMsg = JSON.parse(msg)
            $.ajax({
                    type: 'POST',
                    url: 'http://localhost:8011/api/connection/sendCommand/' + cmd.name,
                    data: { '': JSON.stringify(jsonMsg) }
                })
                // fetch('http://localhost:8011/api/connection/sendCommand', {
                //     method: 'POST',
                //     body: jsonMsg
                // });
                //self.connection.send(cmd.name, msg);
        }
    }

    self.receive = function(data) {
        if (data.length > 0) {
            // For debugging purposes, record all messages received.
            self.debug('communication - received message ' + data.substring(0, 25), { 'data': data })

            var cmdJson = JSON.parse(data)
                //var cmd = self.commandFactory.isSupported(cmdJson);
            if (self.commandFactory.isCommandSupport(cmdJson)) {
                cmdJson[cmdJson.name].responseReceived = 'true'; // success needs to be true since the NEXTEP Mobile service can be return false; the TM will not return true or false so assume true

                // notify all listening functions
                // make a copy of the subscribers array since some elements may be removed
                var subscribersToRemove = []
                for (var i = 0; i < self.subscribers.length; i++) {
                    if (self.subscribers[i].cmdName === cmdJson.name) {
                        if (self.subscribers[i].autoRemove) {
                            self.debug('communication - calling callback ' + cmdJson.name)
                            self.subscribers[i].callback(cmdJson[cmdJson.name])
                            subscribersToRemove.push(self.subscribers[i])
                        } else {
                            self.debug('communication - calling callback ' + cmdJson.name)
                            self.subscribers[i].callback(cmdJson.name, cmdJson[cmdJson.name])
                        }
                    }
                }

                for (var j = 0; j < subscribersToRemove.length; j++) {
                    self.removeListener(subscribersToRemove[j])
                }

                subscribersToRemove = null
            }
        } else {
            self.debug('communication - received message ' + data, { 'data': data })
        }
    }

    self.addListener = function(listener) {
        if ((typeof listener.cmdName === 'string') &&
            (typeof listener.callback === 'function')) {
            self.subscribers.push(listener)
        }
    }

    self.removeListener = function(listener) {
        for (var i = self.subscribers.length - 1; i >= 0; i--) {
            if (self.subscribers[i] === listener) {
                self.subscribers.splice(i, 1)
            }
        }
    }
}
/* 
 *   global.js - helper methods
 */
if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '')
    };
}

// Fix for browsers that do not have a console object or are missing common console methods.
(function() {
    var method
    var noop = function() {}
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ]
    var length = methods.length
    var console = (window.console = window.console || {})

    while (length--) {
        method = methods[length]

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop
        }
    }
}());

// Have console.log log to both the browser's console log (if it is available)
// and do some additional work. This is called later on to do a WRITETOLOG command
// in addition to the typical browser logging.
(function(console) {
    var isExtended = false

    // Takes as parameters the object and method to call whenever console.log is called.
    var defineNewConsoleLog = function(newObject, newMethod) {
        // If it hasn't been extended already, extend it.
        if (!isExtended) {
            // Save the original console.log method so it can be used later.
            var browserConsoleLog = console.log

            // Override it.
            console.log = function() {
                // There can be multiple arguments to console.log.
                // It can be a string, it can be an object, it could be multiple objects.
                // Use the built-in arguments object to get those arguments, and pass them all as-is.
                var originalArguments = arguments

                // Call the browsers version of console.log with the original arguments.
                browserConsoleLog.apply(console, originalArguments)

                // If an additional log method was specified ... 
                if (newMethod && (typeof newMethod === 'function')) {
                    // Call that method as well with the original arguments.
                    newMethod.apply(newObject, originalArguments)

                    // Flag it as extended.
                    isExtended = true
                }
            }
        }
    }

    // Register it on the global window object so this can be called at a 
    // later time when we are ready. This allows some console.log methods to be made
    // just prior to using the extended version.
    window.defineNewConsoleLog = defineNewConsoleLog

    // Pass in the existing console method.
}(window.console))


// auto-close bootstrap menu on touch
$('.navbar-collapse a').click(function(e) {
    $('.navbar-collapse').collapse('toggle')
})

// reset the nav bar positions
// This is commented out because it was throwing all sorts of errors for ux
//var correctNavbarPosition = true;
//$(window).bind('scroll', function () {
//    if (correctNavbarPosition) {
//        var $nav = $(".navbar");
//        var scrollTop = $(window).scrollTop();
//        var offsetTop = $nav.offset().top;

//        if (Math.abs(scrollTop - offsetTop) > 1) {
//            $nav.css('position', 'absolute');
//            setTimeout(function () {
//                $nav.css('position', 'fixed');
//            }, 1);
//        }
//    }
//});

function correctMathError(num) {
    num = Math.round(num * 100.0)
    return num / 100.0
}

function copyrightNotice() {
    var copyright = 'Copyright 2014-2016 NEXTEP SYSTEMS, Inc. All rights reserved.';
    if (_nex.authToken.hasOwnProperty('copyright')) {
        copyright = _nex.authToken.copyright
        while ((copyright.indexOf('%lt;') > 0) && (copyright.indexOf('%gt;') > 0)) {
            copyright = copyright.replace('%lt;', '<').replace('%gt;', '>')
        }
    }
    return copyright
}

uriFormatting = {
    iorderfastUri: '{IORDERFAST_URI}',
    themeUri: '{THEME_URI}',
    scriptUri: function(uri) {
        if (uri.indexOf(this.iorderfastUri) > -1) {
            uri = uri.replace(this.iorderfastUri, _nex.authToken.uri)
        }
        if (uri.indexOf(this.themeUri) > -1) {
            uri = uri.replace(this.themeUri, _nex.assets.theme.mediaPath())
        }
        return uri
    }
}

// Add an 'endsWith' method to the string object.
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
        var subjectString = this.toString()
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length
        }
        position -= searchString.length
        var lastIndex = subjectString.indexOf(searchString, position)
        return lastIndex !== -1 && lastIndex === position
    };
}

currency = {
    moneySymbol: '$',
    thousandSeparator: ',',
    centsSeparator: '.',
    formatAsDollars: function(amount, showMoneySymbol) {
        //
        // Make sure we're given a real number to work with:  
        if (isNaN(amount)) {
            return '';
        }

        if (showMoneySymbol === null) {
            showMoneySymbol = false
        }

        amount = amount * 100
        amount = Math.round(amount)

        //
        // Handle less-than-a-dollar single-digit and double-digit cases:   
        var money = String(Math.floor(amount))
        if (money.length === 1) {
            money = ('0' + this.centsSeparator + '0' + money)
        } else if (money.length === 2) {
            money = ('0' + this.centsSeparator + money)
        } else {
            //
            // First grab the last two characters as cents, and remove them
            // from the amount string:
            var cents = money.slice(-2)
            money = money.substring(0, money.length - 2)
                //
                // Now stuff the last three digits at a time into an array, removing
                // them from the string. (We have to work backwards to figure where
                // commas should go.)
            var dollars = []
            do {
                dollars.push(money.slice(-3))
                money = money.substring(0, money.length - 3)
            } while (money.length > 3)
            //
            // If there are 1 or 2 numbers remaining, they'll need to be at
            // the front of the number, with their own comma. (We need to test
            // to make sure we don't end up with $,123.00 or such.)   
            if (money.length) {
                dollars.push(money)
            }
            //
            // Now reverse the array, so the last elements appear first:   
            dollars.reverse()

            // format the dollars amount
            money = '';
            for (var i = 0; i < dollars.length; i++) {
                money += dollars[i]
                money += (i !== (dollars.length - 1)) ? this.thousandSeparator : '';
            }

            money = (money + this.centsSeparator + cents)
        }

        if (showMoneySymbol) {
            money = this.moneySymbol + ' ' + money
        }

        return money
    }
}

dateFormatting = {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    dayOfWeek: function(day) {
        return this.days[day]
    },
    month: function(m) {
        return this.months[m]
    }
}

itemFormatting = {
    buttonText: function(text) {
        if (text !== undefined) {
            text = text.replace(/~/g, '<br/>')
            text = text.trim()
        }
        return text
    },
    buttonImage: function(image) {
        return image.replace('.swf', '.png').replace('&amp;', '&')
    },
    getPrice: function(item) {
        var amount = Number(item.amountdue)
        if (item.ITEM !== undefined) {
            for (var i = 0;
                (i < item.ITEM.length); i++) {
                amount += Number(item.ITEM[i].amountdue)
            }
        }

        return correctMathError(amount)
    },
    buildModReceiptText: function(item) {
        var receiptText = '';

        var includeQuantity = (_nex.assets.theme.system.RECEIPT.printmodquantity !== undefined) ? (_nex.assets.theme.system.RECEIPT.printmodquantity.toLowerCase() === 'true') : false
        var includePriceLevel = (_nex.assets.theme.system.RECEIPT.printmodpricelevel !== undefined) ? (_nex.assets.theme.system.RECEIPT.printmodpricelevel.toLowerCase() === 'true') : false

        if (item.ITEM !== undefined) {
            var lastModIsItem = false
            for (var i = 0; i < item.ITEM.length; i++) {
                var mod = item.ITEM[i]
                if (i > 0) {
                    if (lastModIsItem) {
                        receiptText += '<br/>';
                    } else {
                        receiptText += ', ';
                    }
                }

                if ((includeQuantity) &&
                    mod.hasOwnProperty('modquantity')) {
                    receiptText += mod.modquantity.toString() + ' ';
                }

                if (!mod.hasOwnProperty('receipttext')) {
                    mod = _nex.assets.theme.itemByPosid(mod.posid)
                    mod.receipttext = _nex.assets.theme.itemTextByType(mod, 'RECEIPTTEXT')
                }

                if (includePriceLevel) {
                    var priceLevelText = _nex.assets.theme.itemPriceLevelText(mod)
                    if (priceLevelText !== '') {
                        receiptText += _nex.assets.theme.itemPriceLevelText(mod) + '-';
                    }
                }

                receiptText += mod.receipttext

                lastModIsItem = (mod.hasOwnProperty('itemtype') && (mod.itemtype.toLowerCase() == 'item'))
            }
        }
        return receiptText.trim()
    },

    buildSingleModReceiptText: function(mod) {
        var receiptText = '';

        var includeQuantity = (_nex.assets.theme.system.RECEIPT.printmodquantity !== undefined) ? (_nex.assets.theme.system.RECEIPT.printmodquantity.toLowerCase() === 'true') : false
        var includePriceLevel = (_nex.assets.theme.system.RECEIPT.printmodpricelevel !== undefined) ? (_nex.assets.theme.system.RECEIPT.printmodpricelevel.toLowerCase() === 'true') : false

        if (mod !== undefined) {
            if ((includeQuantity) &&
                mod.hasOwnProperty('modquantity')) {
                receiptText += mod.modquantity.toString() + ' ';
            }

            if (!mod.hasOwnProperty('receipttext')) {
                mod = _nex.assets.theme.itemByPosid(mod.posid)
                mod.receipttext = _nex.assets.theme.itemTextByType(mod, 'RECEIPTTEXT')
            }

            if (includePriceLevel) {
                var priceLevelText = _nex.assets.theme.itemPriceLevelText(mod)
                if (priceLevelText !== '') {
                    receiptText += _nex.assets.theme.itemPriceLevelText(mod) + '-';
                }
            }

            receiptText += mod.receipttext
        }
        return receiptText.trim()
    }
}

var digitsOnly = /[1234567890]/g
var floatOnly = /[0-9\.]/g
var alphaOnly = /[A-Za-z]/g
var alphaNumOnly = /[A-Za-z1234567890\s]/g

function restrictCharacters(myfield, e, restrictionType) {
    if (!e) e = window.event
    if (e.keyCode) code = e.keyCode
    else if (e.which) code = e.which
    var character = String.fromCharCode(code)
        // if they pressed esc... remove focus from field...
    if (code == 27) { this.blur(); return false }
    // ignore if they are press other keys
    // strange because code: 39 is the down key AND ' key...
    // and DEL also equals .
    if (!e.ctrlKey && code !== 9 && code !== 8 && code !== 46 && code !== 36 && code !== 37 && code !== 38 && (code !== 39 || (code === 39 && character === "'")) && code !== 40) {
        if (character.match(restrictionType)) {
            return true
        } else {
            return false
        }
    } else {
        // console.log(code);
        return true
    }
}

/*! A fix for the iOS orientationchange zoom bug.
 Script by @scottjehl, rebound by @wilto.
 MIT / GPLv2 License.
*/
(function(w) {
    // Windows Phone 8 fix 
    if ('-ms-user-select' in document.documentElement.style && navigator.userAgent.match(/IEMobile\/10\.0/)) {
        var msViewportStyle = document.createElement('style')
        msViewportStyle.appendChild(
            document.createTextNode('@-ms-viewport{width:auto!important}')
        )
        document.getElementsByTagName('head')[0].appendChild(msViewportStyle)
        return;
    }

    // This fix addresses an iOS bug, so return early if the UA claims it's something else.
    var ua = navigator.userAgent
    if (!(/iPhone|iPad|iPod/.test(navigator.platform) && /OS [1-5]_[0-9_]* like Mac OS X/i.test(ua) && ua.indexOf('AppleWebKit') > -1)) {
        return
    }

    var doc = w.document

    if (!doc.querySelector) { return }

    var meta = doc.querySelector('meta[name=viewport]'),
        initialContent = meta && meta.getAttribute('content'),
        disabledZoom = initialContent + ',maximum-scale=1',
        enabledZoom = initialContent + ',maximum-scale=10',
        enabled = true,
        x, y, z, aig

    if (!meta) { return }

    function restoreZoom() {
        meta.setAttribute('content', enabledZoom)
        enabled = true
    }

    function disableZoom() {
        meta.setAttribute('content', disabledZoom)
        enabled = false
    }

    function checkTilt(e) {
        aig = e.accelerationIncludingGravity
        x = Math.abs(aig.x)
        y = Math.abs(aig.y)
        z = Math.abs(aig.z)

        // If portrait orientation and in one of the danger zones
        if ((!w.orientation || w.orientation === 180) && (x > 7 || ((z > 6 && y < 8 || z < 8 && y > 6) && x > 5))) {
            if (enabled) {
                disableZoom()
            }
        } else if (!enabled) {
            restoreZoom()
        }
    }

    w.addEventListener('orientationchange', restoreZoom, false)
    w.addEventListener('devicemotion', checkTilt, false)

})(this)

// htmlEscape and htmlUnescape
function htmlEscape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function htmlUnescape(value) {
    return String(value)
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
}

// dim screen creates a div that covers the entire user interface with a semi-transparent black background;
// the html and style are defined in the code so someone cannot update the css to workaround the dimming
// dimming occurs when a TM has not been able to communicate with mynextep for over 14 days; how much the screen is dimmed is controlled by the TM
function dimScreen(dim) {
    try {
        dim = Number(dim)
        var dimmer = $('#dimmer')

        if (dim !== 1) {
            var rgba = 'rgba(0,0,0,' + dim.toString() + ')';
            if (dimmer.length === 0) {
                $('body').append('<div id="dimmer" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:5000;pointer-events: none;background-color:' + rgba + ';"></div>')
            } else {
                dimmer.css('background-color', rgba)
            }
        } else {
            // remove the dimmer if it already exists
            if (dimmer.length > 0) {
                dimmer.remove()
            }
        }
    } catch (e) {

    }
}

// app switcher
// triple click on hidden area to switch apps
var throttle = false
$('#appSwitcher').click(function(evt) {
    if (!throttle && evt.originalEvent.detail === 3) {
        appSwitcherVerify()
        throttle = true
        setTimeout(function() {
            throttle = false
        }, 1000)
    }
})

//verify app switcher is enabled and show pin pad popup.
var _alternateui = '';

function appSwitcherVerify() {
    if (_alternateui.toLowerCase() !== 'off') {
        _alternateui = 'EOS';
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup)
        popup.autotimeout = true
        popup.buttons[0].clickEvent = 'validateCapability()';
        popup.message = _nex.assets.theme.getTextAttribute('ORDER', 'switchapplication', 'Please enter your PIN to switch applications')
        _nex.assets.popupManager.showPopup(popup, function() {}, 10000)
        _nex.keyboard.numpad.bindKeys()
    }
}

// validate user for SwitchApplication Capability
function validateCapability() {
    var pin = _nex.keyboard.numpad.data
    _nex.communication.send(new _nex.commands.EmployeeSecurityCheck(pin, 'SwitchApplication'), function(result) {
        if (result.responseReceived === 'true') {
            employeeCapabilityResponse(result)
        } else {
            console.error('EmployeeSecurityCheck Failed!')
        }
    }, 'EMPLOYEESECURITYCHECKRESPONSE')
}

// call SwitchApplication if authorized
// otherwise error message if user not authorized
function employeeCapabilityResponse(result) {
    if (result.EMPLOYEE === undefined) {
        var errorPopup = $.extend(true, {}, _nex.assets.popupManager.errorPopup)
        errorPopup.message = _nex.assets.theme.getTextAttribute('ORDER', 'switchapplicationnotallowed', 'You are not authorized to switch applications')
        _nex.assets.popupManager.showPopup(errorPopup)
    } else {
        _nex.communication.send(new _nex.commands.SwitchApplication(_alternateui), function(result) {})
    }
}

function refreshOrderTimer() {
    if (_nex.utility.orderTimer) {
        // If the orderTimer is already initialized, simply restart it.
        _nex.utility.orderTimer.restart()
    } else {
        // If the order timer is not initialized, initialize it. 
        var messageText = _nex.assets.theme.getTextAttribute('ORDER', 'needmoretime', 'Need more time?')
        _nex.utility.orderTimer = new OrderTimer(_nex.assets.popupManager, messageText, _nex.assets.phaseManager, '_nex.utility.orderTimer.needMoreTimeClicked();')
        _nex.utility.orderTimer.restart()

        // If a user does some activity, restart the timer.
        var resetFunction = function() {
            _nex.utility.orderTimer.restart()
            $('#popup-message').modal('hide')
            $('#popup-error').modal('hide')
            console.debug('restarted order timer')
            if (_nex.ordering) {
                _nex.ordering.resetNudge()
            }
        }
        var eventList = 'keypress scroll click swipe taphold tap touchmove keydown';
        $(document).off(eventList, resetFunction)
        $(document).on(eventList, resetFunction)
    }
}

// Used to detect if we are using the UX previewer
function inPreviewer() {
    try {
        return window.self !== window.top
    } catch (e) {
        return true
    }
}

/*
function onElementFocused(e) {
    $("div").blur();
}

if (document.addEventListener) {
    document.addEventListener("focus", onElementFocused, true);
}
  */

/*
 * status.js
 * general site navigation
 */
function Manager(managerParams) {
    var self = this

    self.communication = managerParams.communication
    self.theme = managerParams.theme
    self.phaseManager = managerParams.phaseManager

    self.pages = null
    self.offlinepage = 'offline.html'
    self.initialphase = 'splash'
    self.mediaPath = ''
    self.deviceType = ''
    self.reason = ''
    self.preferredStatus = ''
    self.currentStatus = 'Unknown'

    // Keep track of whether or not we are connected to the TM.
    self.connectedToTM = false

    // TYPES
    self.statusType = {
        'IDLE': 'Idle',
        'UNKNOWN': 'Unknown',
        'OFFLINE': 'Offline',
        'ORDERING': 'Ordering',
        'SMS': 'Sms',
        'PAYMENT': 'Payment',
        'PROCESSING': 'Processing',
        'COMPLETING': 'Completing',
        'UPDATING': 'Updating',
        'COMPLETE': 'Complete',
        'PRINTER_ERROR': 'PrinterError',
        'POS_OFFLINE': 'POSOffline',
        'SURVEY': 'Survey',
        'PREVIOUS_ORDERS': 'PreviousOrders',
        'POST_ORDERING': 'Completing',
        'PAUSED': 'Paused',
        'CASH_ERROR': 'CashError',
        'EXPIRED': 'Expired',
        'SERVICE_REQUEST': 'ServiceRequest',
        'WAITING': 'Waiting',
        'PAYMENT_REQUEST': 'PaymentRequest',
        'RESERVATIONS': 'Reservations'
    }

    // METHODS
    // load pages.txt (json) used to navigate the site
    self.init = function(deviceType, themeId, themeMediaPath, uiParams) {
        self.deviceType = deviceType
        if (uiParams.hasOwnProperty('offlinepage') &&
            (uiParams.offlinepage.length > 0)) {
            self.offlinepage = uiParams.offlinepage
        }

        // update the css to use the default theme css
        if ((themeId.length > 0) && ($('#themecss').length > 0)) {
            self.mediaPath = themeMediaPath
            if (themeMediaPath.toLowerCase().indexOf(themeId.toLowerCase()) === -1) {
                self.mediaPath += themeId
            }

            self.mediaPath += '/media/html/';
            self.mediaPath = self.mediaPath.replace('//', '/')
            if (inPreviewer()) {
                self.mediaPath = '../Media.aspx?media=html/';
                var csspath = '../Media.aspx?media=html/css/' + deviceType.toLowerCase() + '.css';
                console.debug('manager.init: loading css ' + csspath)
                $('#themecss').attr('href', csspath)
            } else {
                $('#themecss').attr('href', self.mediaPath + 'css/' + deviceType + '.css')
            }
        }
    }

    self.commandReceived = function(commandName, msg) {
        if (commandName === 'LICENSEUPDATE') {
            window.dimScreen(msg.screendim)
        } else if (commandName === 'SERVERSTATUS') {
            if (msg.connected.toLowerCase() === 'true') {
                self.connectedToTM = true
                self.communication.send(new _nex.commands.Preamble())
            } else {
                // go offline
                self.connectedToTM = false
                self.offline(true)
            }
        } else if (commandName === 'SETSERVICEMODE') {
            self.preferredStatus = msg.setstatus
            self.reason = (msg.hasOwnProperty('reason')) ? msg.reason : '';
            self.resetStatus()

            // TODO - SoundManager.SetVolume(Number(this._xml.@setvolume));


        } else if (commandName === 'UPDATEKIOSK') {
            // self.preferredStatus = self.statusType.UPDATING; // otherwise, for a moment it switches to a status of blank
            self.theme.loadUpdate(msg)
            self.update()
        } else if (commandName === 'WINDOWONTOP') {
            console.debug(_nex.device)
            if (_nex.device && _nex.device.hasOwnProperty('stopTimer')) {
                _nex.device.stopTimer()
            }
        }
    }

    // Commented out because it seems this method is no longer being called. Leaving here for now just in case.
    //self.loadContent = function (page, callback) {

    //    // clear error messages
    //    $("#errorNav").empty();

    //    try {
    //        var pageUri = self.mediaPath + page;

    //        var jxContent = $.ajax({
    //            "url": pageUri,
    //            "dataType": "html",
    //            "cache": false
    //        });

    //        jxContent.done(function (data) {
    //            // notify calling function that the page is available to load
    //            if (callback !== undefined) {
    //                callback(true);
    //            }
    //            $('#content').empty();
    //            $('#content').append(data);
    //        });

    //        jxContent.fail(function (jqXHR, textStatus, errorThrown) {
    //            // notify calling function that the page is not available to load
    //            if (callback !== undefined) {
    //                callback(false);
    //            }
    //            $('#errorNav').empty();
    //            $('#errorNav').append(self.formatError('Failed to load page', 'Page: ' + self.pages.PAGE[pageIndex].src));
    //        });
    //    }
    //    catch (e) {
    //        $('#errorNav').empty();
    //        $('#errorNav').append(self.formatError('Error!', e.message));
    //    }

    //};

    // Returns a user friendly status message based on the current state.
    self.getStatusMessage = function(status) {
        // TODO: Support dayparts. For example, we will re-open at {0}.
        var result = '';
        switch (status) {
            case self.statusType.OFFLINE:
                // This logic tries to follow along with the Flash.
                if (self.connectedToTM) {
                    // If we are offline, but connected to the TM.... use the close message.
                    result = self.theme.getTextAttribute('STATUS', 'offline', 'We will reopen at {0}') // todo: show time we will re-open
                } else {
                    // This goes along with the flash. It uses the unknown attribute, otherwise connecting to TM.
                    // It will be repeatedly trying to reconnect to the TM in this state.
                    result = self.theme.getTextAttribute('STATUS', 'unknown', 'Connecting to TM...')
                }
                break
            case self.statusType.PRINTER_ERROR:
                result = self.theme.getTextAttribute('STATUS', 'printererror', 'Service Printer') // todo: show which printer                
                break;
            case self.statusType.EXPIRED:
                result = self.theme.getTextAttribute('STATUS', 'expireerror', 'Subscription Expired')
                break;
            case self.statusType.UNKNOWN:
                // This goes along with the flash. It uses the unknown attribute, otherwise connecting to TM.
                result = self.theme.getTextAttribute('STATUS', 'unknown', 'Connecting to TM...')
                break;
            case self.statusType.IDLE:
                // Instead of showing 'idle' in the corner, show empty string.
                result = '';
                break
            default:
                // If nothing else matches, try to show the reason if we can't find the status in the configuration.
                result = self.theme.getTextAttribute('STATUS', status, self.reason)
        }
        return result
    };

    // Set the current status to a new status.
    self.setCurrentStatus = function(newStatus, notifyUi) {
        // added check to make sure we were not already at the requested state, this seems to save a lot of traffic! -Trey 6/13/2016
        if (self.currentStatus !== newStatus) {
            self.currentStatus = newStatus

            // Whenever the status updates, check if there is a pending CSS change, consider doing a reload.
            // The cssUpdated method will determine if it is the right time or not.
            if (_nex.pendingKioskCssChange) {
                self.cssUpdated()
            }

            // anytime the status is updated, update the display
            self.updateStatusDisplay()

            // sometimes it makes sense to notify the UI manager that the status has updated
            if (notifyUi) {
                self.communication.send(new _nex.commands.KioskStatus(newStatus))
            }
        }
    }

    // Use to manually update the display of the status.
    self.updateStatusDisplay = function() {
        if (self.currentStatus === this.statusType.IDLE) {
            _nex.assets.offline.hide()
        } else {
            _nex.assets.offline.update(self.getStatusMessage(self.currentStatus), self.reason)
        }
    }

    // Once the popup manager is loaded, we can start showing popups.
    function popupManagerLoaded() {
        console.debug('Popup manager has finished loading... Popups can now be shown.')
    }

    // Called when kiosk.css is updated.
    self.cssUpdated = function() {
        // Guard against doing the update if there is no update.
        if (!_nex.pendingKioskCssChange) {
            console.log('manager.js.cssUpdated: There are no pending kiosk CSS changes.')
            return;
        }

        // Guard against being in the wrong state.
        // We don't want to refresh if we are in the middle of ordering, for example.
        if (!self._validStatusForUpdate()) {
            console.log('manager.js.cssUpdated: Received kiosk.css change but not in a good state to reload kiosk.css...')
            return;
        }

        // Log what we are doing so it is clear in the log for troubleshooting purposes.
        console.log('manager.js.cssUpdated: Received kiosk.css change and in a good status... Reloading.')

        // Reset the flag.
        _nex.pendingKioskCssChange = false

        // Do a cache free reload.
        window.location.reload(true)
    };

    // Helper function. Returns true if the status is ok for an update.
    self._validStatusForUpdate = function() {
        // this logic was moved to its own helper function because it is in multiple places.
        return self.currentStatus === self.statusType.OFFLINE ||
            self.currentStatus === self.statusType.IDLE ||
            self.currentStatus === self.statusType.PRINTER_ERROR ||
            self.currentStatus === self.statusType.UNKNOWN ||
            self.currentStatus === self.statusType.POS_OFFLINE ||
            self.currentStatus === self.statusType.CASH_ERROR ||
            self.currentStatus === self.statusType.EXPIRED
    };

    // The update method is called when the UPDATEKIOSK command is received.
    self.update = function() {
        if (self.currentStatus === self.statusType.OFFLINE ||
            self.currentStatus === self.statusType.IDLE ||
            self.currentStatus === self.statusType.PRINTER_ERROR ||
            self.currentStatus === self.statusType.UNKNOWN ||
            self.currentStatus === self.statusType.POS_OFFLINE ||
            self.currentStatus === self.statusType.CASH_ERROR ||
            self.currentStatus === self.statusType.EXPIRED) {
            self.setCurrentStatus(self.statusType.UPDATING, true)

            // This call to applyUpdate also initializes the popupManager.
            self.theme.applyUpdate(popupManagerLoaded)
            self.phaseManager.loadTheme(self.theme.lastUpdate.THEMES.THEME.PHASE)

            self.start()

            // enable/disable app Swticher
            if (_nex.assets.theme.system.hasOwnProperty('USERINTERFACE') &&
                _nex.assets.theme.system.USERINTERFACE.hasOwnProperty('alternateui') &&
                (_nex.assets.theme.system.USERINTERFACE.alternateui.toLowerCase() === 'kiosk')) {
                $('#appSwitcher').show()
            } else {
                $('#appSwitcher').hide()
            }
        }
    }

    self.resetStatus = function() {
        if ((self.currentStatus === self.statusType.IDLE) ||
            (self.currentStatus === self.statusType.OFFLINE) ||
            (self.currentStatus === self.statusType.PRINTER_ERROR) ||
            (self.currentStatus === self.statusType.UNKNOWN) ||
            (self.currentStatus === self.statusType.UPDATING) ||
            (self.currentStatus === self.statusType.POS_OFFLINE) ||
            (self.currentStatus === self.statusType.CASH_ERROR) ||
            (self.currentStatus === self.statusType.EXPIRED)) {
            if (self.currentStatus !== self.preferredStatus) {
                self.start()
            }
        }
    }

    self.start = function() {
        if (self.preferredStatus.length === 0) self.preferredStatus = self.statusType.IDLE
        if (self.preferredStatus === self.statusType.PRINTER_ERROR || self.currentStatus === self.statusType.PRINTER_ERROR) {
            if (_nex.greenReceipt !== null && _nex.greenReceipt._greenReceiptEnabled()) {
                self.preferredStatus = self.statusType.IDLE
                self.currentStatus = self.statusType.IDLE
            }
        }

        if (self.preferredStatus != self.currentStatus) {
            self.setCurrentStatus(self.preferredStatus, true)
        }

        // If we are idle, go to the splash screen; otherwise, go offline.
        if (self.currentStatus === self.statusType.IDLE) {
            if (inPreviewer() && !_nex.splashPhase.redirected) {
                _nex.splashPhase.firstTimeToStart() // initially redirect them to the main menu
                _nex.splashPhase.redirected = true // second time through let them stay on the splash screen
            } else {
                _nex.splashPhase.stop()
                self.splash()
            }
        } else {
            _nex.splashPhase.stop()
            self.offline()
        }
    }

    self.splash = function() {
        var splashHtmlFinished = function() {
            console.debug('Splash HTML finished loading')
        };
        var splashJsFinished = function() {
                // Scale the splash screen full screen.
                console.debug('Splash JS finished loading')
                var wrap = document.getElementById('wrap')
                if (wrap) {
                    wrap.style.left = '0';
                    wrap.style.top = '0';
                    wrap.style.width = '100%'
                    wrap.style.height = '100%'
                }
            }
            // Go to the splash phase. 
        if (_nex.assets.theme.isUpdateAvailable) {
            _nex.assets.theme.applyUpdate()
            self.phaseManager.loadTheme(self.theme.lastUpdate.THEMES.THEME.PHASE)
        }

        self.phaseManager.changePhase(self.phaseManager.phaseType.SPLASH, splashHtmlFinished, splashJsFinished)

    };

    // Go offline and update the status displayed.
    self.offline = function() {
        self.phaseManager.goOffline(function() {
            // SoundManager.StopAllSounds(); TODO add support for sounds
            if ((self.currentStatus !== self.statusType.PRINTER_ERROR) &&
                (self.currentStatus !== self.statusType.UNKNOWN) &&
                (self.currentStatus !== self.statusType.POS_OFFLINE) &&
                (self.currentStatus !== self.statusType.CASH_ERROR) &&
                (self.currentStatus !== self.statusType.EXPIRED)) {
                self.setCurrentStatus(self.statusType.OFFLINE, true)

            }

            // We still want to update the status displayed in case the reason changed.
            // setCurrentStatus normally updates it... But it isn't called, so call it manually.
            self.updateStatusDisplay()
        })
    };

    self.sendStatusUpdate = function(status) {
        self.currentStatus = status
        _nex.communication.send(new _nex.commands.KioskStatus(self.currentStatus))
    };

    self.cancelCurrentPhase = function() {
        self.start()
    };

    // self.offline = function (serverDisconnect) {
    // TODO - not sure about this logic; need to handle client that can work disconnected, like DMD
    // //if (serverDisconnect === undefined) {
    //    serverDisconnect = false;
    // }
    // ((_mainMovie.IsOfflineOnServerDisconnect && serverDisconnect) ||
    //  (!serverDisconnect))
    // if ((serverDisconnect) || (!serverDisconnect)) {
    //    if ((self.currentStatus !== self.statusType.PRINTER_ERROR) &&
    //        (self.currentStatus !== self.statusType.UNKNOWN) &&
    //        (self.currentStatus !== self.statusType.POS_OFFLINE) &&
    //        (self.currentStatus !== self.statusType.CASH_ERROR) &&
    //        (self.currentStatus !== self.statusType.EXPIRED)) {
    //        self.setCurrentStatus(self.statusType.POS_OFFLINE);
    //    }
    //    self.phaseManager.goOffline();
    // } else if (serverDisconnect && (self.currentStatus === self.statusType.UPDATING)) {
    //    // this is a special case where the client is disconnected while updating; reset the status to the last preferred status
    //    self.resetStatus();
    // }
    // };

    self.formatError = function(primaryMessage, secondaryMessage) {
        return '<div class="alert alert-danger"><h2>' + primaryMessage + '</h2>' +
            '<h3>' + secondaryMessage + '</h3>' +
            '</div>'
    };

    // EVENT Listeners
    self.communication.addListener(self.communication.createListener('LICENSEUPDATE', self.commandReceived))
    self.communication.addListener(self.communication.createListener('SERVERSTATUS', self.commandReceived))
    self.communication.addListener(self.communication.createListener('SETSERVICEMODE', self.commandReceived))
    self.communication.addListener(self.communication.createListener('UPDATEKIOSK', self.commandReceived))
    self.communication.addListener(self.communication.createListener('LAUNCHREMOTESUPPORT', self.commandReceived))
    self.communication.addListener(self.communication.createListener('WINDOWONTOP', self.commandReceived))
}
// Constructor.
function BarcodeListener(lastkeyCallback) {
    // Make self synonymous with this.
    var self = this

    // PRIVATE PROPERTIES / METHODS

    // Store a reference to the function to call once the last key is received.
    self._lastkeyCallback = lastkeyCallback

    // Initialize the data object with a reference to the callback for the last barcode key.
    self._barcodeData = new DeviceData()

    // Function to be called whenenever a barcode key is detected.
    self._receiveBarcodeKey = function(key, keyString) {
        // console.debug("Received barcode key " + key + ": " + keyString + ";");
        var result = self._barcodeData.appendBarcode(key, keyString)
        if (result && result.length > 0) {
            self._lastkeyCallback(result)
            self.clearData()
        }
    }

    // Initialize simple listener.
    self._simpleListener = new SimpleListener(self._receiveBarcodeKey)


    // PUBLIC METHODS

    // Start listening for key events.
    self.startListening = function() {
        self._simpleListener.startListening()
    };

    // Stop listening for key events.
    self.stopListening = function() {
        self._simpleListener.stopListening()
    };

    // Get the data.
    self.getData = function() {
        return self._barcodeData.get()
    };

    // Clear the data.
    self.clearData = function() {
        self._barcodeData.clear()
    };
}

// A utility for binding and unbinding HTML buttons.
// Inject parameters for setting button text, tracking click, and playing the button hit.
function ButtonBinder(setControlButtonText, setButtonText, trackClick, playButtonHit) {
    var self = this

    // Dependency injection.
    self._setControlButtonText = setControlButtonText
    self._setButtonText = setButtonText
    self._trackClick = trackClick
    self._playButtonHit = playButtonHit

    // Debugging.
    self._debugEnabled = false
    self._debug = function() {
        console.debug('ButtonBinder', arguments)
    };

    // Bind the button.
    self.bind = function(buttonId, buttonText, clickCallback, isControlButton, cssClass) {
        // This logic was in several spots. Move it to one for consistency.
        var button = $('#' + buttonId)
        if (button.length === 0) {
            self._debug('ButtonBinder', 'Could not find button ' + buttonId)
            return;
        }

        // Set the text on the button. If it is a control button, use a special method designed for that,
        // which will look for #btext.
        if (isControlButton) {
            self._setControlButtonText(buttonId, buttonText)
        } else {
            self._setButtonText(buttonId, buttonText)
        }

        // Set what happens when you click the button.
        button.unbind('click')
        button.click(function() {
            // Track a click.
            self._trackClick(button)

            // Play a sound.
            self._playButtonHit()

            // Call the callback.
            if (clickCallback) {
                clickCallback()
            }
        })

        if (cssClass) {
            button.addClass(cssClass)
        }
    }

    // Unbind the button.
    self.unbind = function() {
        var button = $('#' + buttonId)
        if (button.length > 0) {
            button.unbind('click')
        }
    }
}

// A utility for button tracking.
function ButtonTracking(systemSettings) {
    var self = this

    // Shorthand for related settings.
    self.trackMenuButton = ((systemSettings !== undefined) && (systemSettings.menu !== undefined)) ? systemSettings.menu : 'true';
    self.trackPaymentButton = ((systemSettings !== undefined) && (systemSettings.payment !== undefined)) ? systemSettings.payment : 'true';
    self.trackLanguageButton = ((systemSettings !== undefined) && (systemSettings.language !== undefined)) ? systemSettings.language : 'true';
    self.trackGreenReceiptButton = ((systemSettings !== undefined) && (systemSettings.greenreceipt !== undefined)) ? systemSettings.greenreceipt : 'true';
    self.trackControlButton = 'true'; // always track control buttons TODO: Verify this is right.

    // Keep an array of the tracked buttons.
    self.trackedButtonList = []

    // Set to true to show button hits in the console/log.
    self.debugButtonHits = false

    // If debug hits is enabled, writes something to the console window.
    self._debugButtonHit = function(message) {
        if (self.debugButtonHits) {
            console.debug(message) // Switch to log to put in the UI client log.
        }
    }

    // Called after the buttons have been logged.
    self.reset = function() {
        self.trackedButtonList = []
    };

    // Convert to an attribute value that is expected.
    // Returns empty string or a value >= 0.
    // This follows the data in the ButtonUsage table.
    self._convertToAttribute = function(value) {
        var MIN = 0
        var result = '';
        if (value) {
            var numeric = parseInt(value)
            if (isNaN(numeric)) {
                result = '';
            } else if (numeric < MIN) {
                result = '';
            } else {
                result = numeric
            }
        }
        return result
    };

    // Validate that a property is valid.
    self._cleanProperty = function(propName, value) {
        var MAXLENGTH64 = 64 // A lot of times there is a maximum length that this content can be. We want to strip off characters past this limit.
        var MAXLENGTH128 = 128

        var result = '';

        switch (propName) {
            case 'id':
                // The buttonnumber in the XML.
                result = self._convertToAttribute(value)
                break;
            case 'text':
                result = value.substring(0, MAXLENGTH64)
                break;
            case 'phase':
                result = value.substring(0, MAXLENGTH64)
                break;
            case 'menuid':
                // The menuid in the XML.
                result = self._convertToAttribute(value)
                break;
            case 'context':
                result = value.substring(0, MAXLENGTH128)
                break;
            case 'buttontype':
                // Should be numeric.
                result = self._getType(value)
                break;
        }

        return result
    };

    // Called by the command object OrderUsage.
    self.writeButtonUsage = function() {
        var result = []
        for (var index = 0; index < self.trackedButtonList.length; index++) {
            var button = self.trackedButtonList[index]
            var propValue
            var buttonResult = {}
            for (var propName in button) {
                if (propName === 'id' || propName === 'text' || propName === 'phase' || propName === 'menuid' || propName === 'context' || propName === 'buttontype') {
                    propValue = button[propName]
                        // An error will happen trying to insert the data if the property values are not valid.
                    propValue = self._cleanProperty(propName, propValue)
                        //console.debug("setting " + propName + " to " + propValue);
                    buttonResult[propName] = propValue
                }
            }
            result.push(buttonResult)
        }
        return {
            'BUTTON': result
        }
    };

    // All in one method to create tracking data and track it.
    self.track = function(id, text, menuid, context, type) {
        var trackButtonData = self._create(id, text, menuid, context, type)
        self._addToBuffer(trackButtonData)
    };

    // Create a button tracking object.
    self._create = function(id, text, menuid, context, type) {
        var result = {}
        result.id = id
        result.text = $.trim(text)
        result.phase = _nex.manager.phaseManager.currentPhase
        result.menuid = '';
        if (menuid) {
            result.menuid = menuid
        }
        result.context = ''; // context can be menu text or something like ORDER REVIEW
        if (context) {
            result.context = context
        }
        result.buttontype = '';
        if (type) {
            result.buttontype = type
        }
        return result
    };

    self._getType = function(typeString) {
        var result = 0
        switch (typeString) {
            case 'menu':
                result = 0
                break;
            case 'payment':
            case 'complete':
                result = 1 // Payment and complete are button type 1 in the Flash.
                break;
            case 'language':
                result = 2
                break;
            case 'green':
                result = 3
                break;
            case 'control':
                result = 4
                break;
        }
        return result
    };

    // Add the tracking data to the buffer.
    self._addToBuffer = function(button) {
        // If the button exists, push information about the button.
        if (button) {
            switch (button.buttontype) {
                case 'menu':
                    if (self.trackMenuButton === 'true') {
                        self._debugButtonHit('[Tracking menu button]')
                        self.trackedButtonList.push(button)
                    } else {
                        self._debugButtonHit('[NOT Tracking menu button]')
                    }
                    break
                case 'payment':
                    if (self.trackPaymentButton === 'true') {
                        self._debugButtonHit('[Tracking payment button]')
                        self.trackedButtonList.push(button)
                    } else {
                        self._debugButtonHit('[NOT Tracking payment button]')
                    }
                    break
                case 'language':
                    if (self.trackLanguageButton === 'true') {
                        self._debugButtonHit('[Tracking language button]')
                        self.trackedButtonList.push(button)
                    } else {
                        self._debugButtonHit('[NOT Tracking language button]')
                    }
                    break
                case 'green':
                    if (self.trackGreenReceiptButton === 'true') {
                        self._debugButtonHit('[Tracking green button]')
                        self.trackedButtonList.push(button)
                    } else {
                        self._debugButtonHit('[NOT Tracking green button]')
                    }
                    break
                case 'control':
                    if (self.trackControlButton === 'true') {
                        self._debugButtonHit('[Tracking control button]')
                        self.trackedButtonList.push(button)
                    } else {
                        self._debugButtonHit('[NOT Tracking control button]')
                    }
                    break
            }
        } else {
            self._debugButtonHit('[Invalid button]')
        }
    }

}

// Constructor.
function CardListener(lastkeyCallback) {
    // Make self synonymous with this.
    var self = this

    // PRIVATE PROPERTIES / METHODS

    // Store a reference to the function to call once the last key is received.
    self._lastkeyCallback = lastkeyCallback

    // Initialize card data.
    self._cardData = new DeviceData()
    self._cardSwipeCmdListener = null

    // Function to be called whenenever a card key is detected.
    self._receiveCardKey = function(key, keyString) {
        var result = self._cardData.appendCard(key, keyString)
        var track1Found = false
        var track2Found = false
        var track3Found = false

        if (result) {
            // Check if track data was found
            if (result.track1 && result.track1.length > 0) {
                track1Found = true
            } else if (result.track2 && result.track2.length > 0) {
                track2Found = true
            } else if (result.track3 && result.track3.length > 0) {
                track3Found = true
            }

            // If any track data was found on any of the tracks ...
            if (track1Found || track2Found || track3Found) {
                // console.debug(result);
                self._lastkeyCallback(result)
                self.clearData()
            }
        }
    }

    // Initialize simple listener.
    self._simpleListener = new SimpleListener(self._receiveCardKey)

    self._cardSwipeReceived = function(commandName, msg) {
        try {
            console.log('card swipe received')
            if (commandName === 'CARDSWIPE') {
                self._cardData._track1 = msg.track1
                self._cardData._track2 = msg.track2
                self._cardData._track3 = msg.track3
                var result = self._cardData.getCard()
                console.log('card swipe received - execute callback')
                self._lastkeyCallback(result)
                self.clearData()
            }
        } catch (e) {
            console.log('error occured processing a card swipe')
            console.log(e.message)
        }
    }

    // PUBLIC METHODS

    // Start listening for key events.
    self.startListening = function() {
        self._simpleListener.startListening()
        self._cardSwipeCmdListener = _nex.communication.createListener('CARDSWIPE', self._cardSwipeReceived)
        _nex.communication.addListener(self._cardSwipeCmdListener)
    };

    // Stop listening for key events.
    self.stopListening = function() {
        self._simpleListener.stopListening()
        _nex.communication.removeListener(self._cardSwipeCmdListener)
    };

    // Get the data.
    self.getData = function() {
        return self._cardData.getCard()
    };

    // Clear the data.
    self.clearData = function() {
        self._cardData.clear()
    };
}

function CssListener(paramObj) {
    var self = this

    self.listener = paramObj.listener

    self.init = function() {
        // watch for css to be updated
        var cssCount = 0
        $('link').each(function() {
            var id = $(this).attr('id')
            var href = $(this).attr('href')

            if (id === undefined) {
                id = 'css' + cssCount
                $(this).attr('id', id)
            }
            self.watch(id, href)
            cssCount++
        })
    };

    self.watch = function(id, href) {
        if (self.listener !== null) {
            // self.listener.watch(id, href);
        }
    }

    self.refresh = function(id) {
        var link = $('#' + id)
        if (link.length > 0) {
            var href = link.attr('href')
            var randomIndex = href.indexOf('?x=')
            if (randomIndex >= 0) {
                href = href.substring(0, randomIndex)
            }
            link.attr('href', href + '?x=' + Math.random())
        }
    }
}
// Helper for customers who need custom pages, e.g. Cedar Fair.
(function(window) {
    // If the user needs to be able to click on a custom element, we need a standard way to track clicks
    // and play a sound when it is clicked. We also need a common way of changing the HTML and the text.
    var ClickableElement = function(id, clickCallback) {
        var self = this
        self.id = id
        self.clickCallback = clickCallback

        // Debugging.
        self.debugEnabled = true
        self.debug = function() {
            if (self.debugEnabled) {
                console.debug('PageElement', arguments)
            }
        }

        // Double check the element exists in the HTML.
        self.checkElementExists = function() {
            return $('#' + self.id).length > 0
        };

        // Set the HTML of the element using jQuery.
        self.html = function(html) {
            // May add support for ~ to replace newlines in the future.
            self.debug('Setting element html to', self.id, html)
            $('#' + self.id).html(html)
        };

        // Set the text of the element using jQuery.
        self.text = function(text) {
            // May add support for ~ to replace newlines in the future.
            self.debug('Setting element text to', self.id, text)
            $('#' + self.id).text(text)
        };

        // Show the element.
        self.show = function() {
            self.debug('Showing element', self.id)
            $('#' + self.id).show()
        };

        // Hide the element.
        self.hide = function() {
            self.debug('Hiding element', self.id)
            $('#' + self.id).hide()
        };

        // Setup a click handler on the element.
        self.bindClick = function() {
            self.element = $('#' + id)
            if (!self.element.length) {
                throw 'Could not bind to the element with the id: ' + id
            }
            self.debug('Found element and binding to it.')
            if (self.clickCallback) {
                self.element.unbind('click')
                self.element.bind('click', function() {
                    self.playSound()
                    self.trackHistory()
                    self.clickCallback()
                })
            }
        }

        // Logic to call for button tracking history.
        self.trackHistory = function() {
            self.debug('tracking history') // future use

        };

        // Logic to call for playing a sound.
        self.playSound = function() {
            self.debug('playing sound') // future use
        };
    }

    // A custom page.
    var CustomPage = function(id, pageElements, callbackShow, callbackHide) {
        var self = this

        self.id = id
        self.pageElements = pageElements || []
        self.callbackShow = callbackShow || function() {}
        self.callbackHide = callbackHide || function() {}

        // Debugging.
        self.debugEnabled = true
        self.debug = function() {
            if (self.debugEnabled) {
                console.debug('CustomPage', arguments)
            }
        }

        // Show the page and call the callback.
        self.show = function() {
            self.debug('Showing page')
            $('#' + id).show()
            self.callbackShow()
        };

        // Hide the page and call the callback.
        self.hide = function() {
            self.debug('Hiding page')
            $('#' + id).hide()
            self.callbackHide()
        };

        // Add an element to the page. Ihe clickcallback argument is option.
        self.addElement = function(id, clickCallback) {
            self.debug('Adding an element to the page')
            var element = new ClickableElement(id, clickCallback)
            self.pageElements.push(element)
        };
    }

    // Expose just the CustomPage constructor. This can be used by any custom pages created.
    window.CustomPage = CustomPage
})(window)
// Helper for storing, retrieving, and parsing data received from devices.
// Calls the callback function when the final character is received.
// Works with barcode data, RFID data, and card data. They are similar types of
// device data, so they are all grouped together in this class.
function DeviceData() {
    // Switch to strict mode to catch common mistakes as errors.
    'use strict';

    // Make self synonymous with this.
    var self = this

    // PRIVATE PROPERTIES

    // Data for barcodes, RFIDs.
    self._data = '';

    // Track data. Special to cards.
    self._currentTrack = 0
    self._track1 = '';
    self._track2 = '';
    self._track3 = '';

    // Whether or not the leading character was found.
    self._leadingCharReceived = false

    // PUBLIC PROPERTIES/METHODS

    // Reset.
    self.clear = function() {
        self._data = '';
        self._track1 = '';
        self._track2 = '';
        self._track3 = '';
        self._leadingCharReceived = false
    };

    // Return the data.
    self.get = function() {
        return self._data
    };

    // Return card style data. Returns as a single object with 3 properties: track1, track2, and track3.
    self.getCard = function() {
        var result = {
            'track1': self._track1,
            'track2': self._track2,
            'track3': self._track3
        }
        return result
    };

    // Append barcode style data.
    self.appendBarcode = function(key, keyString) {
        // Default the return value to empty string.
        var result = '';

        // Logic here follows along with the flash.
        if (key === 33) { // !
            // console.debug("-- key is 33. Leading character received.");
            self._leadingCharReceived = true
        } else if (key !== 13 && key !== 10 && key !== 35 && self._leadingCharReceived) { // 35 is #
            // console.debug("-- key is data " + keyString + ". Appending to string " + keyString);
            self._data += keyString
        } else if (key === 0) { // key is null
            // console.debug("-- key is null");
            // do nothing.... according to the flash, "key 0 is sent if the shift key is held down and sometimes when CAPS lock is enabled "
        } else if ((key === 13 && self._leadingCharReceived) ||
            (key === 10 && self._leadingCharReceived) ||
            (key === 0 && self._leadingCharReceived) ||
            (key === 35 && self._leadingCharReceived)) { // 13 (CR) is the end of the code, append until a CR is reached
            result = self.get()
        }
        return result
    };

    // Append card style data.
    self.appendCard = function(key, keyString) {
        // Default the return value to empty string.
        var result = '';

        // Logic here follows along with the flash.

        // currentTrack 1 Case - ASCII 37 is "%"
        if (key === 37) {
            // console.debug("Card Swipe Listener - Track 1 detected. Setting self._currentTrack to 1.");
            self._currentTrack = 1
            self._track1 = '%';
        } else if (key === 59) { // currentTrack 2 Case - ASCII 59 is ";"
            // console.debug("Card Swipe Listener - Track 2 detected. Setting self._currentTrack to 2.");
            self._currentTrack = 2
            self._track2 = ';';
        } else if (key === 43) { // currentTrack 3 Case - ASCII 43 is "+"
            // console.debug("Card Swipe Listener - Track 3 detected. Setting self._currentTrack to 3.");
            self._currentTrack = 3
            self._track3 = '+';
        } else if (key !== 13 && key !== 0) { // not carriage return or null
            if (self._currentTrack === 1) {
                // build up track one
                // console.debug("Building up track one " + keyString);
                self._track1 += keyString
            } else if (self._currentTrack === 2) {
                // build up track two
                // console.debug("Building up track two " + keyString);
                self._track2 += keyString
            } else if (self._currentTrack === 3) {
                // build up track three
                // console.debug("Building up track three " + keyString);
                self._track3 += keyString
            }
        } else if ((self._track1.toUpperCase().indexOf('%QB3') === 0) || (self._track1.toUpperCase().indexOf('%ESC?') === 0)) // Starts with %QB3 or %ESC? TODO: Find out what to do for this?
        {
            result = self.getCard()
            console.info('%QB3 found in track one or %ESC')
        }

        // carriage return
        else if (key === 13) {
            // Per the Flash:
            // "When an ASCII 13 (enter) is received, the second character of track 1 is a "B" (bank card)
            // and current_track2 has a length of 0 then wait for track 2 otherwise process the card"
            if (
                ((self._track1.substr(1, 1) == 'B') && (self._track2.length > 0)) || (self._track2.length > 0) || ((self._track1.substr(1, 1) != 'B') && (self._track1.length > 0))) {
                if ((self._track1 != '%E?') && (self._track2 != ';E?')) {
                    // No exceptions found in track one or track two
                    result = self.getCard()
                } else {
                    // Exception found in either track one or track two
                    console.error('Exception found in track one or track two')
                    result = 'ERROR';
                }
            } else {
                console.error('Unexpected newline key found.')
            }
        }

        return result
    };

    // Append RFID style data.
    self.appendRFID = function(key, keyString, startCode) {
        // The start code was # in the flash... But sometimes it has been things like ; when testing. It is programmable to the device itself.
        if (!startCode) {
            startCode = 35 // #
        }

        // Default the return value to empty string. This is what is returned if we are before the end of the code.
        var result = '';

        // If the code is not newline, carriage return, null, or the start code (usually #)...
        if (key !== 13 && key !== 10 && key !== 0 && key !== startCode) {
            // append it to the string.
            self._data += keyString
        } else if (((key === 13) ||
                (key === 10) ||
                (key === 0)) && (self._data.length > 0)) // 13 (CR) is the end of the code, append until a CR is reached
        {
            // CR was reached, raise the SCAN event and send the code down.
            // var evt:RFIDEvent = new RFIDEvent(RFIDEvent.SCAN);
            result = self.get()
        }

        return result
    };
}

// Class for listening to any kind of devices: RFID, Card, Barcode, or ALL.
function DeviceListener(type, callback, stopOnLastKey) {
    var self = this

    // Possible types.
    self.TYPE_CARD = 'CARD';
    self.TYPE_BARCODE = 'BARCODE';
    self.TYPE_RFID = 'RFID';
    self.TYPE_ALL = 'ALL';

    // Set enableDebugging to true to debug/troubleshoot any issues with the device listener.
    self.enableDebugging = true
    self._debug = function() {
        if (self.enableDebugging) {
            console.debug('DeviceListener', self._type, arguments)
        }
    }

    // Set the type.
    if (!type) {
        type = 'CARD';
    }
    self._type = type

    // Get the type.
    self.getType = function() {
        return self._type
    };

    // Set the callback property.
    self._callback = null
    if (callback) {
        self._callback = callback
    }

    // Set whether or not it should stop listening when the last key is found.
    self._stopOnLastKey = false
    if (stopOnLastKey) {
        self._stopOnLastKey = true
    }

    // Setup a complete method that handles the case where it should stop listening
    // when the last key is received.
    self.complete = function(data) {
        // Call the callback method if one was specified.
        if (self._callback) {
            self._callback(data)
        }

        // If we are supposed to stop listening on the last key, do that as well.
        if (self._stopOnLastKey) {
            self.stop()
        }
    }

    // When the last key is hit, these callback functions are called.
    self.lastBarcodeKey = function(data) {
        self._debug('Received last barcode key')
        self.complete(data)
    };
    self.lastCardKey = function(data) {
        self._debug('Received last card key')
        self.complete(data)
    };
    self.lastRFIDKey = function(data) {
        self._debug('Received last RFID key')
        self.complete(data)
    };

    // Wire up all the listeners... but don't start them.
    if (self._type === self.TYPE_BARCODE) {
        self._debug('Starting barcode listener')
        self.barListener = new BarcodeListener(self.lastBarcodeKey)
    } else if (self._type === self.TYPE_CARD) {
        self._debug('Starting card listener')
        self.cardListener = new CardListener(self.lastCardKey)
    } else if (self._type === self.TYPE_RFID) {
        self._debug('Starting RFID listener')
        self.rfidListener = new RFIDListener(self.lastRFIDKey)
    } else if (self._type === self.TYPE_ALL) {
        self._debug('Starting all listeners')
        self.barListener = new BarcodeListener(self.lastBarcodeKey)
        self.cardListener = new CardListener(self.lastCardKey)
        self.rfidListener = new RFIDListener(self.lastRFIDKey)
    }

    // Start listening.
    self.start = function() {
        var type = self._type
        if (type === self.TYPE_BARCODE) {
            self.barListener.startListening()
        } else if (type === self.TYPE_CARD) {
            self.cardListener.startListening()
        } else if (type === self.TYPE_RFID) {
            self.rfidListener.startListening()
        } else if (type === self.TYPE_ALL) {
            self.barListener.startListening()
            self.cardListener.startListening()
            self.rfidListener.startListening()
        }
    }

    // Stop listening.
    self.stop = function() {
        var type = self._type
        if (type === self.TYPE_BARCODE) {
            self.barListener.stopListening()
        } else if (type === self.TYPE_CARD) {
            self.cardListener.stopListening()
        } else if (type === self.TYPE_RFID) {
            self.rfidListener.stopListening()
        } else if (type === self.TYPE_ALL) {
            self.barListener.stopListening()
            self.cardListener.stopListening()
            self.rfidListener.stopListening()
        }
    }
}

// Constructor.
function ExceptionHandler() {
    var self = this

    // Call this function to log a message anytime an uncaught exception bubbles up to the top level.
    self.enable = function() {
        window.onerror = function(message, url, line, col, error) {
            // Chrome supports an onerror function with 3 parameters for message, url, and line.
            // Not all browsers may support this.
            // It also supports the col and error parameters. This one is used here.
            var result = '';
            if (url) {
                result += 'URL: ' + url + '\n\n';
            }
            if (line) {
                result += 'Line: ' + line + '\n\n';
            }
            if (col) {
                result += 'Column: ' + col + '\n\n';
            }
            if (message) {
                result += 'Message: ' + message + '\n\n';
            }

            // Log the actual error. This will send the writetolog statement too if console.log has been overridden to do so.
            if (console && console.log) {
                // Write the error message and stack trace.
                console.log(result)
                if (error && error.stack) {
                    console.log('Stack trace: ')
                    console.log(error.stack)
                }
            }
        }
    };

    // Call this function to disable logging uncaught exceptions.
    self.disable = function() {
        window.onerror = function(message, url, line) {
            // do nothing.
        }
    };
}

// Represents a Guest Account
function GuestAccount(guestAccountId, firstName, lastName, email, thumbnail64, accounts) {
    var self = this

    self.guestAccountId = guestAccountId
    self.firstName = firstName
    self.lastName = lastName
    self.email = email
    self.thumbnail64 = thumbnail64

    self.chargeableLocalAccounts = []

    var index = 0

    if (Array.isArray(accounts)) {
        accounts.forEach(function(account) {
            index++
            self.chargeableLocalAccounts.push(new GuestAccountLocal(index, account.guestaccountlocalid, account.guestaccountlocaltypeid, account.typename, account.usagetype, account.accountnumber, account.pin))
        })
    } else {
        self.chargeableLocalAccounts.push(new GuestAccountLocal(1, accounts.guestaccountlocalid, accounts.guestaccountlocaltypeid, accounts.typename, accounts.usagetype, accounts.accountnumber, accounts.pin))
    }

    self.getGuestAccountLocalByPaymentClipTenderType = function(paymentClipTenderType) {
        for (var i = 0; i < self.chargeableLocalAccounts.length; i++) {
            if (self.chargeableLocalAccounts[i].paymentClipTenderType === paymentClipTenderType) {
                return self.chargeableLocalAccounts[i]
            }
        }
    }
}

// Represents a generic tender account associated to a Guest Account
function GuestAccountLocal(index, guestAccountLocalId, guestAccountLocalTypeId, typeName, usageType, accountNumber, pin) {
    var self = this

    self.index = index
    self.paymentClipTenderType = 'gaincliningbalancetender' + index.toString()
    self.guestAccountLocalId = guestAccountLocalId
    self.guestAccountLocalTypeId = guestAccountLocalTypeId
    self.typeName = typeName
    self.usageType = usageType.toLowerCase()
    self.accountNumber = accountNumber
    self.pin = pin

    self.genericTenderId = null
    self.genericTenderIndex = null

    //associate a generic tender (enabled in the payment profile) to the chargeable local account...
    var genericTender = _nex.assets.theme.getGenericTenderByGuestAccountLocalType(guestAccountLocalTypeId)
    if (genericTender !== null && genericTender !== undefined) {
        self.genericTenderId = genericTender.type
        self.genericTenderIndex = genericTender.type.slice(-1)
    }

    // mask the account number to display in the UI...
    self.maskedAccountNumber = function() {
        var maskedLength = self.accountNumber.length - 3

        var maskString = '';
        for (var i = 0; i < maskedLength; i++) {
            maskString += '*';
        }

        return self.accountNumber.replace(/\b(\d{2})\d+(\d)/, '$1' + maskString + '$2')
    };
}

// Manage the Kiosk for Visually Impaired features.
function KVIReader(kioskTheme) {
    var self = this
    self.initialized = false
    self.kioskTheme = kioskTheme

    // Pull the auto advance setting from the USERINTERFACE element in system XML.
    self.autoAdvance = function() {
        var result = false
        if (_nex.assets.theme.system.hasOwnProperty('USERINTERFACE')) {
            var userInterface = _nex.assets.theme.system.USERINTERFACE
            if (userInterface.hasOwnProperty('VI')) {
                if (userInterface.VI.hasOwnProperty('autoadvance')) {
                    result = userInterface.VI.autoadvance.toLowerCase() === 'true';
                }
            }
        }
        return result
    };

    // Initialize all the KVI related objects.
    self.init = function() {
        if (!self.initialized) {
            _nex.navBarMap = new NavBarMap(kioskTheme)
                //_nex.navBarMap.loadTest();
            _nex.navBarMap.loadBumpBar()
            _nex.navBar = new NavBar()
            _nex.navBarListener = new NavBarListener(_nex.navBarMap, _nex.navBar)
            _nex.domFocus = new DomFocus()
            self.initialized = true
        }
    }

    // Handle the ordering phase.
    self.ordering = function() {
        self._bindSpeaking()
    };

    // Handle the payment phase.
    self.payment = function() {
        var selectPayment = $('#selectPaymentMessage:visible')
        if (selectPayment.length > 0) {
            $('div.payment-button').each(function(index) {
                $(this).attr('tabindex', '2')
            })

            $('div#selectPaymentMessage').each(function(index) {
                $(this).attr('tabindex', '2')
            })

            self._bindSpeaking()

            $('div#selectPaymentMessage').focus()
        } else {
            var paymentClip = $('.paymentclip:visible')
            if (paymentClip.length > 0) {
                paymentClip.attr('tabindex', '2')
                self._bindSpeaking()
                paymentClip.focus()
            }
        }
    }

    // When we start payment processing, set a timer... to tell the user to wait every so often.
    self.startPaymentProcessing = function() {
        self.simpleTimer.restart()
    };

    // Say the wait message.
    self.sayWait = function() {
        _nex.assets.soundManager.speak(_nex.assets.theme.getTextAttribute('PAYMENT', 'kviwait', 'Waiting for payment.'))
    };

    // Stop payment processing.
    self.stopPaymentProcessing = function() {
        self.simpleTimer.stop()
    };

    // For future use, custom logic per payment clip.
    self.paymentClip = function() {

    }

    // Handle the complete phase.
    self.complete = function(text) {
        _nex.kviReader.rebind()
        _nex.domFocus.cycleFocus()
    };

    // Called when the DOM changes to set focus events on the tab indexes.
    self.rebind = function() {
        self._bindSpeaking()
    };

    // Whenever an element gets focus, handle the event.
    self._bindSpeaking = function() {
        // This is not needed for mobile... Just UX.
        if (_nex.context === 'UX') {
            $('[tabindex]').off('focusin', _nex.domFocus.focusIn)
            $('[tabindex]').not("[tabindex='-1']").on('focusin', _nex.domFocus.focusIn)
        }
    }

    // Called when the speach synthesis finishes saying something.
    self.speakCompleted = function(cycleAll) {
        if (cycleAll) {
            _nex.domFocus.cycleFocus() // experimental feature to just loop through all the elements
        } else {
            // Jump to the first element.
            if ($(':focus').attr('tabindex') === '1') {
                if (self.autoAdvance()) {
                    _nex.domFocus.cycleFocus()
                }
            }
        }
    }

    // Speak some text on the screen.
    self.speak = function(text) {
        if (text) {
            _nex.assets.soundManager.speak(text)
        }
    }

    // Timer for payment processing.
    self.simpleTimer = new SimpleTimer(self, self.sayWait, 5)

    // Returns true if jacked in
    self.jackedIn = function() {
        return _nex.navBar.jackedIn
    };
}

/**
 * A utility for logging.
 * @constructor Logging
 */
function Logging(sendFunction) {
    var self = this

    // Private properties.
    var _sendFunction = sendFunction
    var _writeToLogCmdObj = _createWriteToLogCmd()

    // Use the global function defineNewConsoleLog to define an additional method for console.log.
    window.defineNewConsoleLog(self, _sendMessage)

    // SUPPORTING FUNCTIONS

    // Returns a WRITETOLOG command object.
    function _createWriteToLogCmd() {
        // Get the WRITETOLOG command specifically.
        var CmdType = _nex.commands.WriteToLog

        // Create a new instance of that command.
        var cmdObj = new CmdType('')

        // Return that command object.
        return cmdObj
    }

    // Sends a WRITETOLOG command object.
    function _sendMessage(message) {
        // Tag as coming from the console so we can tell it apart from other things in the log.
        var clientIndicator = '[console.log] ';

        // Set the message in the command object.
        _writeToLogCmdObj.setMessage(clientIndicator + message)

        // connection.send(cmd)
        _sendFunction(_writeToLogCmdObj)
    }
}

function LookupData(type, value, xml) {
    var self = this

    self.lookupType = type || _nex.types.lookup.CANCEL
    self.lookupValue = value || '';
    self.lookupXML = xml || null
}
// Used for the Navigation Bar for visually impaired.
function NavBar() {
    var self = this
    self.jackedIn = false
    self.lastButtonPressed = null // could be used to announce help text in the near future
    self.buttonsPressed = []

    // debugging
    self.debugEnabled = false
    self.debug = function() {
        if (self.debugEnabled) {
            console.log('NavBar', arguments)
        }
    }

    // enum of the different buttons
    self.buttons = {
        'jackin': 0,
        'back': 1,
        'help': 2,
        'up': 3,
        'down': 4,
        'circle': 5,
        'next': 6,
        'volup': 7,
        'voldown': 8,
        'jackout': 9
    }

    self.invokeMethod = function(methodString) {
        if (!self.hasMethod(methodString)) {
            throw 'NavBar error: No such method ' + methodString
        }
        var method = self.getMethod(methodString)
        method()
    };

    self.backPressed = function() {
        self.debug('NavBar back key pressed.')
        if (!_nex.kviReader.jackedIn()) {
            return
        }
        self.lastButtonPressed = self.buttons.back
        _nex.assets.soundManager.cancelSpeak()
        _nex.domFocus.cycleFocus(true)
    };

    self.helpPressed = function() {
        self.debug('NavBar help key pressed.')
        if (!_nex.kviReader.jackedIn()) {
            return
        }
        self.lastButtonPressed = self.buttons.help
        _nex.assets.soundManager.cancelSpeak()
        if (_nex.assets.phaseManager.currentPhase === _nex.assets.phaseManager.phaseType.SPLASH) {
            self._playWelcomeMessage()
        } else {
            var focused = $(':focus').first()
            var text = focused.text()
            _nex.assets.soundManager.speak(text)
        }
    }

    self._updownHelper = function(element, isUp, rebind) {
        if (!_nex.kviReader.jackedIn()) {
            return
        }
        var index = self._getCurrentIndex()
        var script = '';
        var focused
        var text
        script = element.attr('onclick')
        jQuery.globalEval(script)

        if (rebind) {
            window.setTimeout(function() {
                    self._setFocusByIndex('.order-review-item', index)
                    if (_nex.kviReader) {
                        _nex.kviReader.rebind()
                    }
                    focused = $(':focus').first()
                    text = focused.text()
                    _nex.assets.soundManager.speak(text)
                }, 500) // add a pause between speaking
        } else {
            // stop it from auto-announcing the popup once it gets focus...
            _nex.assets.soundManager.cancelSpeak()
            _nex.assets.soundManager.speakEnabled = false

            // Move focus for KVI to the message text
            window.setTimeout(function() {
                $('#messageText').focus()
                focused = $(':focus').first()
                text = focused.text()
                _nex.kviReader.rebind()
                _nex.assets.soundManager.speakEnabled = true
                _nex.assets.soundManager.speak(text)
            }, 500)
        }
    }

    self.upPressed = function() {
        if (!_nex.kviReader.jackedIn()) {
            return
        }
        self.debug('NavBar up key pressed.')
        self.lastButtonPressed = self.buttons.up
        _nex.assets.soundManager.cancelSpeak()
        var quantPlus = $(':focus #quantPlus')
        if (quantPlus.length > 0) {
            self.debug('Found quantPlus')
            self._updownHelper(quantPlus, true, true)
        } else {
            quantPlus = $(':focus #plusButton')
            if (quantPlus.length > 0) {
                self.debug('Found plusButton')
                quantPlus.trigger('click')
            }
        }
    }

    self.downPressed = function() {
        if (!_nex.kviReader.jackedIn()) {
            return
        }
        self.debug('NavBar down key pressed.')
        self.lastButtonPressed = self.buttons.down
        _nex.assets.soundManager.cancelSpeak()
        var quantMinus = $(':focus #quantMinus')
        var quantity = parseInt($(':focus .order-review-quantity').text())
        if (quantMinus.length > 0) {
            if (quantity > 1) {
                self._updownHelper(quantMinus, false, true)
            } else {
                self._updownHelper(quantMinus, false, false)
            }
        } else {
            quantMinus = $(':focus #minusButton')
            if (quantMinus.length > 0) {
                self.debug('Found minus button')
                quantMinus.trigger('click')
            }
        }
    }

    self._getCurrentIndex = function() {
        var listItem = $(':focus')
        var index = $('.order-review-item').index(listItem)
        var length = $('.order-review-item').length
        self.debug('Currently on index ' + index + ' of ' + length)
        return index
    };

    self._setFocusByIndex = function(selector, index) {
        var items = $(selector)
        var itemCount = items.length
        var indexInt
        if (itemCount > 0) {
            var lastIndex = itemCount - 1
            if (index > lastIndex) {
                index = lastIndex
            }
            indexInt = parseInt(index)
            $('.order-review-item').eq(indexInt).focus()
        }
    }

    self.circlePressed = function() {
        if (!_nex.kviReader.jackedIn()) {
            return
        }
        self.debug('NavBar circle key pressed.')
        self.lastButtonPressed = self.buttons.circle
        _nex.assets.soundManager.cancelSpeak(true)

        // If we find the KVIToStart button anywhere on the screen, trigger a click on it.
        var $kviToStart = $('#KVIToStart')
        if ($kviToStart.length > 0) {
            _nex.splashPhase.alternateLanguageToStart('KVI')
        } else {
            var $focused = $(':focus')
            var id = $focused.attr('id')

            // Check for less, normal, more.
            var lnm = self._lessNormalMore()
            if (lnm) {
                _nex.assets.soundManager.speak(lnm)
                $focused.focus()
            } else {
                // Trigger the item with the onclick element; otherwise, trigger a click on the link element.
                var $link = $focused.find('[onclick]').first()
                if ($link.length === 0) {
                    $link = $focused.find('a').first()
                    if ($link.length === 0) {
                        $link = $focused
                    }
                }
                $link.trigger('click')
            }
            // Give focus back to the item in some cases. This way it announces "No Bacon" for example if they toggle.
            if ($focused.hasClass('selectmanyof') || $focused.hasClass('button-down-state')) {
                $focused = $('#' + id)
                $focused.focus()
            }
        }
    }

    self._lessNormalMore = function() {
        var result = '';

        var less = $(':focus #less')
        var normal = $(':focus #normal')
        var more = $(':focus #more')
        var currentButtonId = $(':focus .sub-button-down-state').attr('id')
        var text = '';

        if (currentButtonId == 'less') {
            if (normal.length > 0) {
                normal.trigger('click')
                result = 'Less';
            }
        } else if (currentButtonId == 'normal') {
            if (more.length > 0) {
                more.trigger('click')
                result = 'Normal';
            }
        } else if (currentButtonId == 'more') {
            if (less.length > 0) {
                less.trigger('click')
                result = 'More';
            }
        } else {
            if (less.length > 0) {
                less.trigger('click')
                result = 'Normal';
            }
        }

        return result
    };

    self.nextPressed = function() {
        if (!_nex.kviReader.jackedIn()) {
            return
        }
        self.debug('NavBar next key pressed.')
        self.lastButtonPressed = self.buttons.next
        _nex.assets.soundManager.cancelSpeak()
        _nex.domFocus.cycleFocus()
    };

    self._playWelcomeMessage = function() {
        _nex.assets.soundManager.cancelSpeak(true)
        var maxloops = 10
        var message = _nex.assets.theme.getTextAttribute('SPLASH', 'kvitext', 'Welcome. Use the volume keys on the right bar to increase and decrease volume. Press the green circle button on the left navigation bar to start... ...')
        for (var index = 0; index < maxloops; index++) {
            _nex.assets.soundManager.speak(message)
        }
    }

    self.jackIn = function() {
        console.log('NavBar jack-in.')
        self.lastButtonPressed = self.buttons.jackin
        _nex.assets.soundManager.cancelSpeak()
        _nex.ordering.cancelOrder(true)
        _nex.manager.cancelCurrentPhase()
        _nex.splashPhase._stopListeningForDevice()
        _nex.kvi.active = true
        self.jackedIn = true
        _nex.ordering.pending = false
        $('body').attr('data-language', 'KVI')
        $('body').attr('data-jackedin', 'true')
        refreshOrderTimer()

        _nex.assets.soundManager.setSpeaker(true)
        self._playWelcomeMessage()
    };

    self.jackOut = function() {
        console.log('NavBar jack-out.')
        self.lastButtonPressed = self.buttons.jackout
        _nex.assets.soundManager.cancelSpeak(true)
        self.jackedIn = false
        $('body').attr('data-language', '')
        $('body').attr('data-jackedin', 'false')
        _nex.kvi.active = false
        _nex.ordering.cancelOrder(true)
        _nex.ordering.pending = false
        _nex.manager.cancelCurrentPhase()
        _nex.assets.soundManager.setSpeaker(false)
    };

    self.volumeUp = function() {
        if (!_nex.kviReader.jackedIn()) {
            return
        }
        self.debug('NavBar volume-up.')
        self.lastButtonPressed = self.buttons.volup
        _nex.assets.soundManager.cancelSpeak()
        _nex.assets.soundManager.volumeUp()
        if (_nex.assets.phaseManager.currentPhase !== _nex.assets.phaseManager.phaseType.SPLASH) {
            _nex.assets.soundManager.speak('Volume up.')
        }
    }

    self.volumeDown = function() {
        if (!_nex.kviReader.jackedIn()) {
            return
        }
        self.debug('NavBar volume-down.')
        self.lastButtonPressed = self.buttons.voldown
        _nex.assets.soundManager.cancelSpeak()
        _nex.assets.soundManager.volumeDown()
        if (_nex.assets.phaseManager.currentPhase !== _nex.assets.phaseManager.phaseType.SPLASH) {
            _nex.assets.soundManager.speak('Volume down.')
        }
    }

    self.hasMethod = function(method) {
        return self.hasOwnProperty(method)
    };

    self.getMethod = function(method) {
        var result = function() {}
        if (self.hasMethod(method)) {
            result = self[method]
        }
        return result
    };
}

// Handles key strokes for visually impaired navigation.
function NavBarListener(navBarMap, navBar) {
    var self = this
    self._navBarMap = navBarMap
    self._navBar = navBar

    self.debugEnabled = false
    self.debug = function() {
        if (self.debugEnabled) {
            console.debug('NavBarListener', arguments)
        }
    }

    // The user pressed a key on the keyboard or navbar.
    self.keyPressed = function(element, eventTriggered) {
        var method = '';
        var key = '';
        var object = {}
        var foundKey = false

        self.debug('Element', element)
        self.debug('Event', eventTriggered)

        // For the virtual keyboard, look them up by the data-method attribute.
        if ($(element).attr('data-method')) {
            self.debug('Found virtual key.')
            foundKey = true
            method = $(element).attr('data-method')
        }

        // Handle the case where the key is passed in rather than the event triggered.
        if (typeof eventTriggered === 'number') {
            key = eventTriggered
        } else {
            key = eventTriggered.which
        }
        if (key) {
            foundKey = true
        }
        self.debug('Found physical key: ' + key)

        object = self._navBarMap.getMap(key)
        if (object && object.hasOwnProperty('method')) {
            method = object.method
        }

        if (!foundKey) {
            console.log('Did not find key: ', key)
        }

        // If we found a method in the mapping, call it.
        if (method) {
            self.debug('Calling navbar method ' + method)
            self._navBar.invokeMethod(method)
        }
    }
}

// Keep track of which NavBar keys map to which methods.
function NavBarMap(kioskTheme) {
    var self = this
    self.kioskTheme = kioskTheme
    self._keys = {}

    // Add a new navbar key to the mapping.
    self.setMap = function(key, object) {
        self._keys[key] = object
    };

    // Get a navbar key from the mapping.
    self.getMap = function(key) {
        var result = null
        if (self._keys.hasOwnProperty(key)) {
            result = self._keys[key]
        }
        return result
    };

    // Load the default navbar mapping. Useful for testing without bumpbar.xml.
    self.loadDefault = function() {
        /*Back – 132
            Help – 128
            Up – 129
            Down – 130
            Green – 131
            Next – 133
            Unplug – 127
            Plugin – 126
            Volume Down – 124
            Volume Up - 125 */
        self.setMap(132, { 'method': 'backPressed' })
        self.setMap(128, { 'method': 'helpPressed' })
        self.setMap(129, { 'method': 'upPressed' })
        self.setMap(130, { 'method': 'downPressed' })
        self.setMap(131, { 'method': 'circlePressed' })
        self.setMap(133, { 'method': 'nextPressed' })
        self.setMap(127, { 'method': 'jackIn' })
        self.setMap(126, { 'method': 'jackOut' })
        self.setMap(125, { 'method': 'volumeUp' })
        self.setMap(124, { 'method': 'volumeDown' })
    };

    // Convert an object to an array.
    self._toArray = function(object) {
        if (Array.isArray(object)) {
            return object
        }
        var result = []
        result.push(object)
        return result
    };

    // Helper method to load the bumpbar from bumpbar.xml.
    // This file is pushed to here through an update.
    self._getBumpBar = function() {
        //  <BUMPBAR id="Nav-Bar" type="Kiosk" >
        //    <KEY key="132" event="Back" />
        //    <KEY key="128" event="Help" />
        //    <KEY key="129" event="Up" />
        //    <KEY key="130" event="Down" />
        //    <KEY key="131" event="Green" />
        //    <KEY key="133" event="Next" />
        //    <KEY key="127" event="Unplug" />
        //    <KEY key="126" event="PlugIn" />
        //    <KEY key="124" event="VolumeDown" />
        //    <KEY key="125" event="VolumeUp" />
        // </BUMPBAR> 
        var result = []
        if (self.kioskTheme.hasOwnProperty('BUMPBAR')) {
            var bumpBarElement = _nex.assets.theme.lastUpdate.THEMES.THEME.BUMPBAR
            if (bumpBarElement.hasOwnProperty('KEY')) {
                var keyElement = bumpBarElement.KEY
                result = self._toArray(keyElement) // just in case there is only one key element (unlikely) convert to an array
            }
        }
        return result
    };

    // Load the bumpbar keys into the NavBar mapping.
    self.loadBumpBar = function() {
        var keys = self._getBumpBar()
        for (var index = 0; index < keys.length; index++) {
            var key = keys[index].key
            var event = keys[index].event
            switch (event) {
                case 'Back':
                    self.setMap(key, { 'method': 'backPressed' })
                    break;
                case 'Help':
                    self.setMap(key, { 'method': 'helpPressed' })
                    break;
                case 'Up':
                    self.setMap(key, { 'method': 'upPressed' })
                    break;
                case 'Down':
                    self.setMap(key, { 'method': 'downPressed' })
                    break;
                case 'Green':
                    self.setMap(key, { 'method': 'circlePressed' })
                    break;
                case 'Next':
                    self.setMap(key, { 'method': 'nextPressed' })
                    break;
                case 'PlugIn':
                    self.setMap(key, { 'method': 'jackIn' })
                    break;
                case 'Unplug':
                    self.setMap(key, { 'method': 'jackOut' })
                    break;
                case 'VolumeUp':
                    self.setMap(key, { 'method': 'volumeUp' })
                    break;
                case 'VolumeDown':
                    self.setMap(key, { 'method': 'volumeDown' })
                    break;
                default:
                    console.log('loadBumpBar: Could not find key map for event ' + event)
                    break;
            }
        }
    }

    // Load keyboard mappings so we can test the NavBar with a regular keyboard.
    self.loadTest = function() {
        self.setMap(97, { 'method': 'backPressed' }) // a
        self.setMap(47, { 'method': 'helpPressed' }) // question mark key (slash)
        self.setMap(119, { 'method': 'upPressed' }) // w
        self.setMap(115, { 'method': 'downPressed' }) // s
        self.setMap(13, { 'method': 'circlePressed' }) // enter
        self.setMap(100, { 'method': 'nextPressed' }) // d
        self.setMap(105, { 'method': 'jackIn' }) // i
        self.setMap(111, { 'method': 'jackOut' }) // o
        self.setMap(43, { 'method': 'volumeUp' }) // plus
        self.setMap(45, { 'method': 'volumeDown' }) // minus
    };

    // Reset the mapping back to nothing.
    self.reset = function() {
        self._keys = {}
    };
}

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
    var self = this

    var _locked = false
        // CONSTANTS
    var SECONDS_BEFORE_POPUP = 24 // user has 24 seconds before they see the popup
    var SECONDS_FOR_RESPONSE = 4 // user has 4 seconds to respond to the dialogue

    // PRIVATE VARIABLES

    // use the phase manager to decide whether or not action is needed.
    var _phaseManager = phaseManager

    if (_nex.assets.theme.system.hasOwnProperty('ordertimeout') &&
        _nex.assets.theme.system.ordertimeout.length > 0) {
        SECONDS_BEFORE_POPUP = Number(_nex.assets.theme.system.ordertimeout)
        if (SECONDS_BEFORE_POPUP > 86280) {
            SECONDS_BEFORE_POPUP = 86280
        }
    }

    if (_nex.assets.theme.system.hasOwnProperty('needmoretime') &&
        _nex.assets.theme.system.needmoretime.length > 0) {
        SECONDS_FOR_RESPONSE = Number(_nex.assets.theme.system.needmoretime)
        if (SECONDS_FOR_RESPONSE > 120) {
            SECONDS_FOR_RESPONSE = 120
        }
    }

    // timer logic
    var _doubleTimer = new DoubleTimer(self, _orderTimerExpired, SECONDS_BEFORE_POPUP,
        self, _noResponse, SECONDS_FOR_RESPONSE)

    // popup logic
    var _popup = new NeedMoreTimePopup(popupManager, messageText, callbackScript)

    // PUBLIC METHODS

    // Start/restart the timers. 
    self.restart = function(unlock) {
        if (unlock) {
            _locked = !unlock
        }

        if (!_locked) {
            _smartRestart()
        }
    }

    self.stop = function(locked) {
        if (locked) {
            _locked = locked
        }
        _hidePopup()
        _doubleTimer.stop()
    };

    // When the user clicks yes for need more time.
    self.needMoreTimeClicked = function() {
        // Log for informational purposes back to the UI manager.
        console.log("User clicked 'yes' that they need more time.")

        // Restart the timers if needed.
        _smartRestart()
    };

    // PRIVATE/SUPPORTING FUNCTIONS

    // Show the need more time popup (if it is not already visible).
    function _showPopup() {
        if ($('#popup-need-more-time:visible').length <= 0) {
            var circle = $('circle')
            if (circle.length > 0) {
                // Take a little bit off the time so that the user gets to see the progress bar run out before things time-out.
                circle[0].style.WebkitAnimationDuration = (SECONDS_FOR_RESPONSE - 0.25) + 's';
            }
            _popup.show()
        }
    }

    // Hide the need more time popup (if it is not already hidden).
    function _hidePopup(callback) {
        if ($('#popup-need-more-time:visible').length > 0) {
            _popup.hide(callback)
        }
    }

    // Restart the timer if it makes sense to do so.
    // Otherwise, just stop it.
    function _smartRestart() {
        // Hide the popup if it is open.
        _hidePopup()

        // Restart the timers if we are in a phase where we should.
        var phaseMatters = _checkPhase()
        if (phaseMatters) {
            _doubleTimer.restart()
        } else {
            _doubleTimer.stop()
        }
    }

    // Function called if the timer expires.
    function _orderTimerExpired() {
        var phaseMatters = _checkPhase()
        if (phaseMatters) {
            // Log for informational purposes back to the UI manager.
            // console.log("The user has been idle for too long in the ordering phase and the phase matters. Showing popup for more time.");
            _showPopup()
        } else {
            // Hide the popup just in case it is still up.
            _hidePopup()
            _doubleTimer.stop()
        }
    }

    // When the user doesn't click yes soon enough.
    function _noResponse() {
        // Log for informational purposes back to the UI manager.
        // console.log("User did NOT click 'yes' that they need more time.");

        // Adjust the timers.
        _doubleTimer.stop()

        // TODO - refactor once order is its own object
        _nex.ordering.resetOrder()

        // Hide the popup that shows whether or not more time is needed.
        _hidePopup(function() {
            // Go back to the main screen.
            _nex.timingOut = true
            _nex.manager.cancelCurrentPhase()
        })
    }

    // The need more time popup only applies in certain phases. This helps check the phase.
    function _checkPhase() {
        var result = false

        // Show the need more time popup if we are in ordering or previous orders.
        if (_phaseManager.currentPhase === _phaseManager.phaseType.ORDERING ||
            _phaseManager.currentPhase === _phaseManager.phaseType.PREVIOUS_ORDERS ||
            _phaseManager.currentPhase === _phaseManager.phaseType.PAYMENT ||
            _phaseManager.currentPhase === _phaseManager.phaseType.POST_ORDERING) {
            result = true
        }

        // If KVI
        if (_nex.kviReader && _nex.kviReader.jackedIn()) {
            result = false
        }
        return result
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
        if (typeof popupManager !== 'object') {
            throw 'Must specify a valid popupManager to OrderTimer.';
        }

        // Check messageText
        if (typeof popupManager !== 'string') {
            throw 'Must specify a valid string to OrderTimer.';
        }

        // Check phaseManager
        if (typeof phaseManager !== 'object') {
            throw 'Must specify a valid phaseManager to OrderTimer.';
        }

        // Check callbackScript
        if (typeof callbackScript !== 'string') {
            throw 'Must specify a string for callbackScript to OrderTimer.';
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
    _checkConstructorParameters(popupManager, popupMessage, callbackScript)

    // SELF - Store self for object context on events.
    var self = this

    // PRIVATE VARIABLES

    // Keep a reference to the popup manager so we can use it to show/hide the popup.
    var _popupManager = popupManager

    // Create the popup object. Only needs to be created once. Store it in this private variable for later.
    var _needMoreTimePopup = _createPopupMoreTime(popupManager, popupMessage, callbackScript)

    // PUBLIC METHODS

    // Wrapper to show the popup.
    self.show = function() {
        _popupManager.showPopup(_needMoreTimePopup, function() {
            // do nothing on callback
        })
    };

    // Wrapper to hide the popup.
    self.hide = function(callback) {
        _popupManager.hidePopup(_needMoreTimePopup, callback)

    };

    // PRIVATE/SUPPORTING METHODS

    // Returns a newly created object with everything needed for the popup object.
    function _createPopupMoreTime(popupManager, message, callbackScript) {
        // Copy the existing needMoreTimePopup object.
        var result = _copyObject(popupManager.needMoreTimePopup)

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
        result.message = message

        // Set the click event for the button. There is only one button, so a second one doesn't need to be set for 'no'.
        result.buttons[0].clickEvent = callbackScript

        // Return the result.
        return result
    }

    // Does a deep copy of a JavaScript object.
    function _copyObject(someObject) {
        // Use jQuery extend method to copy the object. Extend actually merges two objects,
        // so if the first object is blank, you get a copy of the second object.
        var DEEP_COPY = true
        return $.extend(DEEP_COPY, {}, someObject)
    }

    // Helper function.
    function _checkConstructorParameters(popupManager, popupMessage, callbackScript) {
        // Check popupManager
        if (typeof popupManager !== 'object') {
            throw 'NeedMoreTimePopup: Must specify a valid popupManager. Got ' + popupManager
        }
        // Double check it has the needMoreTimePopup property.
        if (!popupManager.needMoreTimePopup) {
            throw 'NeedMoreTimePopup: The popup manager given is missing the property needMoreTimePopup ';
        }

        // Check popupMessage
        if (typeof popupMessage !== 'string') {
            throw 'NeedMoreTimePopup: Must specify a string for popupMessage. Got ' + popupMessage
        }

        // Check callbackScript
        if (typeof callbackScript !== 'string') {
            throw 'NeedMoreTimePopup: Must specify a string for callbackScript. Got ' + callbackScript
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
    _checkConstructorParameters(popupObject, popupMethod, popupTime, callbackObject, callbackMethod, callbackTime)

    // Store self for object context in events.
    var self = this

    // Private variables.
    var _popupObject = popupObject
    var _popupMethod = popupMethod
    var _timeSeconds = popupTime

    var _callbackObject = callbackObject
    var _callbackMethod = callbackMethod
    var _timePopup = callbackTime

    // Use one timer for when to show the popup, and a second for when to 
    // kick the user back to the main screen if they don't make a choice.
    var _timer1 = new TimeoutTimer(self, _showPopup, _timeSeconds)
    var _timer2 = new TimeoutTimer(_callbackObject, _callbackMethod, _timeSeconds + _timePopup)

    // Start the countdown timers.
    self.start = function() {
        _timer1.start()
        _timer2.start()
    };

    // Stop all the countdown timers. 
    self.stop = function() {
        _timer1.stop()
        _timer2.stop()
    };

    // Restart the countdown timers.
    self.restart = function() {
        // Stop timers that may be already running.
        _timer1.stop()
        _timer2.stop()

        // Start the timers.
        _timer1.start()
        _timer2.start()
    };

    // SUPPORTING FUNCTIONS

    function _checkConstructorParameters(popupObject, popupMethod, popupTime, callbackObject, callbackMethod, callbackTime) {
        // Check popupObject
        if (typeof popupObject !== 'object') {
            throw 'DoubleTimer: Must specify a valid popupObject. Expected object and got ' + popupObject
        }

        // Check popupMethod
        if (typeof popupMethod !== 'function') {
            throw 'DoubleTimer: Must specify a function for popupMethod. Expected function and got ' + popupMethod
        }

        // Check popupTime
        if (typeof popupTime !== 'number') {
            throw 'DoubleTimer: Must specify a valid popupTime. Expected number and got ' + popupTime
        }

        // Check callbackObject
        if (typeof callbackObject !== 'object') {
            throw 'DoubleTimer: Must specify an object for callbackObject. Expected object and got ' + callbackObject
        }

        // Check callbackObject
        if (typeof callbackMethod !== 'function') {
            throw 'DoubleTimer: Must specify a valid method for callbackMethod. Expected function and got ' + callbackMethod
        }

        // Check callbackTime
        if (typeof callbackTime !== 'number') {
            throw 'DoubleTimer: Must specify a number for callbackTime. Expected number and got ' + callbackTime
        }
    }

    // Show the popup after the specified time interval. If the user doesn't respond
    // after the second interval, call the callback function.
    function _showPopup(args) {
        // Show the popup.
        _callFunction(_popupObject, _popupMethod, args)
    }

    // Explicitly call a specific function on a specific object with certain arguments.
    // Helps remove ambiguity for what the timer should do on a specific interval.
    function _callFunction(specifiedObject, specifiedMethod, specifiedArguments) {
        // Note: The arguments object is a local variable available within all functions.
        if (typeof specifiedObject !== 'object') {
            throw '_callFunction: Must specify a valid object to call.';
        }
        if (typeof specifiedMethod !== 'function') {
            throw '_callFunction: Must specify a valid function to call.';
        }
        specifiedMethod.call(specifiedObject, specifiedArguments)
    }
}

function PositionManager(elementId) {
    var self = this

    var debugEnabled = false
    self.debug = function() {
        if (debugEnabled) {
            console.debug('PositionManager', arguments)
        }
    }

    self.setElement = function(elementId) {
        var element = document.getElementById(elementId)
        if (!element) {
            throw 'No such element ' + elementId
        }
        // Sometimes it is simpler to use jQuery and sometimes it is easier to use the DOM.
        // Have both ready.
        self.element = element // Browser DOM version of the element.
        self.$element = $(element) // jQuery version of the element.

    };

    self.setElement(elementId)

    self.positionElement = function(x, y) {
        // Sometimes the CSS can add transforms which conflict with this logic.
        // Take the transforms off.
        self.resetTransform()

        self.debug('positionElement: Moving element ' + self.element.id + ' to ' + x + ', ' + y)
        self.element.style.position = 'fixed'; // fixed means it is with respect to the entire screen
        var newOffset = { top: y, left: x }
        self.$element.offset(newOffset)
    };

    // One position on touch
    self.positionToTouch = function(x, y) {
        // Return early if we are in the UX previewer. We don't want to position based on touch,
        // because they go right into ordering and the last touch was not on the splash screen.
        if (inPreviewer()) {
            return
        }

        // If we aren't in the UX previewer, go ahead and position the element.
        if (x >= 0 && y >= 0) {
            // They touched where the middle of the element should be, not the upper-left corner.
            // Adjust for this.
            var newX = x - self.getHalfWidth()
            var newY = y - self.getHalfHeight()
            self.setPositionChecked(newX, newY)
        }
    }

    // top
    self.positionTopLeft = function() {
        self.element.style.position = 'fixed';
        self.element.style.top = '0px';
        self.element.style.left = '0px';
    }
    self.positionTopCenter = function() {
        self.element.style.position = 'fixed';
        self.element.style.top = '0px';
        self.element.style.left = '50%';
        self.element.style.transform = 'translateX(-50%)';
    }
    self.positionTopRight = function() {
            self.element.style.position = 'fixed';
            self.element.style.top = '0px';
            self.element.style.right = '0px';
        }
        // middle
    self.positionMiddleLeft = function() {
        self.element.style.position = 'fixed';
        self.element.style.top = '50%';
        self.element.style.left = '0px'
        self.element.style.transform = 'translate(0, -50%)';
    }
    self.positionMiddleCenter = function() {
        self.element.style.position = 'fixed';
        self.element.style.top = '50%';
        self.element.style.left = '50%'
        self.element.style.transform = 'translate(-50%, -50%)';
    }
    self.positionMiddleRight = function() {
            self.element.style.position = 'fixed';
            self.element.style.top = '50%';
            self.element.style.right = '0px'
            self.element.style.transform = 'translate(0, -50%)';
        }
        // bottom
    self.positionBottomLeft = function() {
        self.element.style.position = 'fixed';
        self.element.style.bottom = '0px';
        self.element.style.left = '0px';
    }
    self.positionBottomMiddle = function() {
        self.element.style.position = 'fixed';
        self.element.style.bottom = '0px';
        self.element.style.left = '50%'
        self.element.style.transform = 'translate(-50%, 0%)';
    }
    self.positionBottomRight = function() {
        self.element.style.position = 'fixed';
        self.element.style.bottom = '0px';
        self.element.style.right = '0px';
    }

    self.resetTransform = function() {
        self.element.style.transform = 'translate(0%, 0%)';
    }

    // Position to a particular spot defined in the CSS
    self.positionToSpot = function(spot) {
        switch (spot) {
            case 'TOP_LEFT':
                self.positionTopLeft()
                break;
            case 'TOP_CENTER':
                self.positionTopCenter()
                break;
            case 'TOP_RIGHT':
                self.positionTopRight()
                break;
            case 'MIDDLE_LEFT':
                self.positionMiddleLeft()
                break;
            case 'MIDDLE_CENTER':
                self.positionMiddleCenter()
                break;
            case 'MIDDLE_RIGHT':
                self.positionMiddleRight()
                break;
            case 'BOTTOM_LEFT':
                self.positionBottomLeft()
                break;
            case 'BOTTOM_CENTER':
                self.positionBottomMiddle()
                break;
            case 'BOTTOM_RIGHT':
                self.positionBottomRight()
                break;
        }
    }

    // Return the jQuery elements current X position.
    self.getCurrentX = function() {
        var elementPosition = self.$element.offset()
        var x = elementPosition.left
        return x
    };

    // Return the jQuery elements current Y position.
    self.getCurrentY = function() {
        var elementPosition = self.$element.offset()
        var y = elementPosition.top
        return y
    };

    self.getCurrentWidth = function() {
        var elementWidth = self.$element.width()
        return elementWidth
    };

    // Get the elements current height.
    self.getCurrentHeight = function() {
        var elementHeight = self.$element.height()
        return elementHeight
    };

    self.getHalfWidth = function() {
        var elementWidth = self.$element.width()
        var halfWidth = elementWidth / 2
        return halfWidth
    };

    self.getHalfHeight = function() {
        var elementHeight = self.$element.height()
        var halfHeight = elementHeight / 2
        return halfHeight

    };

    // Sets the element to the requested position. If the requested position is off the screen,
    // adjusts to put it in the closest position it can find on the screen.
    // Required parameters are x and y.
    self.setPositionChecked = function(x, y, width, height, maxX, maxY) {
        var newX = x
        var newY = y

        // Initialize optional variables.
        if (!width) {
            width = self.getCurrentWidth()
        }
        if (!height) {
            height = self.getCurrentHeight()
        }
        if (!maxX) {
            maxX = screenWidth()
        }
        if (!maxY) {
            maxY = screenHeight()
        }

        // Bounds checking on the right edge and bottom.
        var right = newX + width
        var bottom = newY + height

        self.debug('right: ' + right)
        self.debug('bottom: ' + bottom)

        if (right > maxX) {
            newX = maxX - width
            self.debug('Past right edge... moving new x to ' + newX)
        }

        if (bottom > maxY) {
            newY = maxY - height
            self.debug('Past bottom edge... moving new y to ' + newY)
        }

        // Bounds checking on the left and top.
        if (newX < 0) {
            newX = 0
        }
        if (newY < 0) {
            newY = 0
        }

        self.debug('Moving from (' + x + ',' + y + ') to (' + newX + ',' + newY + ')')
        self.positionElement(newX, newY)
    };

    self.moveUp = function() {
        var currentX = self.getCurrentX()
        var currentY = self.getCurrentY()
        var currentWidth = self.getCurrentWidth()
        var currentHeight = self.getCurrentHeight()

        self.debug('moveUp: Moving from (' + currentX + ',' + currentY + ')')

        var newX = currentX
        var newY = currentY - fractionHeight()

        self.setPositionChecked(newX, newY, currentWidth, currentHeight, screenWidth(), screenHeight())

    };

    self.moveDown = function() {
        var currentX = self.getCurrentX()
        var currentY = self.getCurrentY()
        var currentWidth = self.getCurrentWidth()
        var currentHeight = self.getCurrentHeight()

        self.debug('moveDown: Moving from (' + currentX + ',' + currentY + ')')

        var newX = currentX
        var newY = currentY + fractionHeight()

        self.setPositionChecked(newX, newY, currentWidth, currentHeight, screenWidth(), screenHeight())
    };

    self.moveLeft = function() {
        var currentX = self.getCurrentX()
        var currentY = self.getCurrentY()
        var currentWidth = self.getCurrentWidth()
        var currentHeight = self.getCurrentHeight()

        self.debug('MoveLeft: Moving From (' + currentX + ',' + currentY + ')')

        var newX = currentX - fractionWidth()
        var newY = currentY

        self.setPositionChecked(newX, newY, currentWidth, currentHeight, screenWidth(), screenHeight())

    };

    self.moveRight = function() {
        var currentX = self.getCurrentX()
        var currentY = self.getCurrentY()
        var currentWidth = self.getCurrentWidth()
        var currentHeight = self.getCurrentHeight()

        self.debug('moveRight: Moving From (' + currentX + ',' + currentY + ')')

        var newX = currentX + fractionWidth()
        var newY = currentY

        self.setPositionChecked(newX, newY, currentWidth, currentHeight, screenWidth(), screenHeight())

    };

    var SCREEN_FRACTION = 1 / 4 // Used to move the screen up and down a fraction of the screen.

    function screenHeight() {
        // "Height (in pixels) of the browser window viewport including, if rendered, the horizontal scrollbar."
        return window.innerHeight
    }

    function screenWidth() {
        // "Width (in pixels) of the browser window viewport including, if rendered, the vertical scrollbar."
        return window.innerWidth
    }

    function fractionHeight() {
        return screenHeight() * SCREEN_FRACTION
    }

    function fractionWidth() {
        return screenWidth() * SCREEN_FRACTION
    }

    self.changeWidth = function(newWidth) {
        self.$element.width(newWidth)
    };

    self.changeHeight = function(newHeight) {
        self.$element.height(newHeight)
    };

    self.size = function(newSize) {
        self.debug('Resizing to ' + newSize)
        var resolution = self.getResolution(newSize)
        self.changeWidth(resolution.width)
        self.changeHeight(resolution.height)
    };

    self.getResolution = function(value) {
        var result = { width: 1280, height: 720 }

        switch (value) {
            case 0:
                result.width = 1024
                result.height = 768
                break;
            case 1:
                result.width = 1280
                result.height = 768
                break;
            case 2:
                result.width = 1366
                result.height = 768
                break;
            case 3:
                result.width = 1680
                result.height = 1050
                break;
            case 4:
                result.width = 1920
                result.height = 1080
                break;
            case 5:
                result.width = 768
                result.height = 1280
                break;
            case 6:
                result.width = 1024
                result.height = 1820
                break;
            case 7:
                result.width = 1080
                result.height = 1920
                break;
            case 8:
                result.width = 1280
                result.height = 720
                break;
            case 9:
                result.width = 1280
                result.height = 800
                break;
        }
        return result

    };
}
// Constructor.
function RFIDListener(lastkeyCallback) {
    // Make self synonymous with this.
    var self = this

    // PRIVATE PROPERTIES / METHODS

    // Store a reference to the function to call once the last key is received.
    self._lastkeyCallback = lastkeyCallback

    // Initialize RFID data.
    self._rfidData = new DeviceData()

    // Function to be called whenenever a RFID key is detected.
    self._receiveRFIDKey = function(key, keyString) {
        var result = self._rfidData.appendRFID(key, keyString, 59) // semi-colon
        if (result && result.length > 0) {
            self._lastkeyCallback(result)
            self.clearData()
        }
    }

    // Initialize simple listener.
    self._simpleListener = new SimpleListener(self._receiveRFIDKey)

    // PUBLIC METHODS

    // Start listening for key events.
    self.startListening = function() {
        self._simpleListener.startListening()
    };

    // Stop listening for key events.
    self.stopListening = function() {
        self._simpleListener.stopListening()
    };

    // Get the data.
    self.getData = function() {
        return self._rfidData.get()
    };

    // Clear the data.
    self.clearData = function() {
        self._rfidData.clear()
    };
}

/**
 * Move the the specified document element a small amount every so often to prevent burn-in.
 * Pass in the id of the element to move. Only the constructor needs to be called.
 * @constructor RotateTimer
 * @param {} elementId
 * @return 
 */
function RotateTimer(elementId) {
    var self = this

    // Set parameters.
    var radius = 5 // 5 pixel radius
    var FREQUENCY_SECONDS = 60 // once a minute

    if ((_nex.assets.theme.system !== null) &&
        _nex.assets.theme.system.hasOwnProperty('splashmotionradius') &&
        $.isNumeric(_nex.assets.theme.system.splashmotionradius)) {
        radius = Number(_nex.assets.theme.system.splashmotionradius)
    }

    // Initialize the content rotator.
    var rotator = new ContentRotator(elementId, radius)

    // Set the rotator up on a timer.
    var timer = new SimpleTimer(rotator, rotator.translate, FREQUENCY_SECONDS)

    // Start the timer.
    timer.start()

    // Helper to reset the timer.
    self.reset = function() {
        // console.debug("***Restarting rotateTimer");
        timer.stop()
        rotator.reset()
        timer.start()
    };

    // If a user does some activity, restart the timer.
    // Note: Had to remove this because it conflicted with keeping the screen position for drive-thru.
    // Keeping it here for reference in case it is tried again.
    // $(document).on("keypress", restart);
    // $(document).on("click", restart);
}

/** @private */
// This is a helper object for the RotateTimer.
// This object keeps track of where the element is at, and what the new location should be.
function ContentRotator(elementId, radiusRotation) {
    var self = this

    // Constants.
    var MIN_RADIUS = 1
    var MAX_RADIUS = 300
    var DEGREES_ROTATION = 40

    // Check constructor parameters are valid to catch configuration errors.
    _checkConstructorParameters(elementId, radiusRotation, MIN_RADIUS, MAX_RADIUS)

    // Set the element being rotated. 
    self.element = document.getElementById(elementId)

    // The radius of rotation is used in the formula for approximating a circle
    // that the content will move in.
    self.radius = radiusRotation

    // Initialize the degrees to zero.
    self.degrees = 0

    // Use an X offset and Y offset.
    self.xOffset = 0
    self.yOffset = 0

    // Actually perform the translation.
    self.translate = function() {
        // Only perform the translation if we are on the SPLASH screen or OFFLINE.
        // Otherwise, if the rotation starts on the splash, but fires in the middle of ordering, it can be confusing.
        if (_nex.assets.phaseManager.currentPhase === _nex.assets.phaseManager.phaseType.SPLASH ||
            _nex.assets.phaseManager.currentPhase === _nex.assets.phaseManager.phaseType.OFFLINE) {
            _translate(self)
        }
    }

    // Reset any translations.
    self.reset = function() {
        _reset(self)
    };

    // SUPPORTING FUNCTIONS

    // Helper function to check the parameters passed to the constructor.
    function _checkConstructorParameters(elementId, radiusRotation, minRadius, maxRadius) {
        // Check the element.
        if (!elementId) {
            throw 'You must specify an element id.';
        }
        var element = document.getElementById(elementId)
        if (!element) {
            throw 'Unable to find an element with id ' + elementId
        }
        // Check the radius.
        if (radiusRotation < minRadius || radiusRotation > maxRadius) {
            throw 'A radius of ' + radiusRotation + ' is outside the supported range for the ContentRotator.';
        }
    }

    // Re-calculate the X and Y offsets.
    function _calculateOffsets(contentRotator) {
        // Increase the degrees.
        contentRotator.degrees += DEGREES_ROTATION

        // Reset if the degrees of rotation exceeds 360.
        if (contentRotator.degrees > 360) {
            contentRotator.degrees = 0
        }

        // Re-calculate position.
        var radians = (2 * Math.PI * contentRotator.degrees) / 360
        var xOffset = Math.cos(radians) * contentRotator.radius
        var yOffset = Math.sin(radians) * contentRotator.radius

        // Round to the nearest integer.
        contentRotator.xOffset = Math.round(xOffset)
        contentRotator.yOffset = Math.round(yOffset)

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
        element.style.position = 'relative';
        element.style.left = xOffset + 'px';
        element.style.top = yOffset + 'px';
        element.style.transform = 'none';

        // Rotate any background image. Without this, the background image remains static.
        $('body').css('background-position', xOffset + 'px ' + yOffset + 'px')
    }

    // Do the full translation, re-calculating the offsets, then moving the element.
    function _translate(contentRotator) {
        _calculateOffsets(contentRotator)
        _performTranslation(contentRotator.element, contentRotator.xOffset, contentRotator.yOffset)
    }

    // Reset the offsets on the rotator.
    function _reset(contentRotator) {
        contentRotator.xOffset = 0
        contentRotator.yOffset = 0
        _performTranslation(contentRotator.element, 0, 0)
    }
}

function ScanItems() {
    var self = this
    _nex.scanItems = self

    self.formatCurrency = function(value) {
        if (value === undefined) return '';

        return '$' + Number(value).toFixed(2)
    };

    self.currentItemDescription = ko.observable()
    self.currentItemPrice = ko.observable()
    self.currentItemPrompt = ko.observable('Scan an Item or Press Continue')
    self.items = ko.observableArray()

    self.itemTotal = ko.computed(function() {
        var total = 0
        ko.utils.arrayForEach(self.items(), function(item) {
            if (item.itemPrice !== undefined) {
                total += Number(item.itemPrice)
            }
        })
        return total
    })

    self.addItem = function(description, price) {
        console.debug('scanItems: addItem')
        self.currentItemDescription(description)
        self.currentItemPrice(price)
        self.currentItemPrompt('Scan Your Next Item or Press Continue')
        self.items.push({
            itemDescription: description,
            itemPrice: price
        })
    };
}
// The SimpleListener would not typically be used directly. It is intended to be
// used by the BarcodeListener, CardListener, or RFIDListener objects.
(function(window) {
    // Switch to strict mode to catch common mistakes as errors.
    'use strict';

    // The scope of this variable is the outer function.
    // It is a way to identify listeners from each other if there is more than one.
    // This is helpful for logging and troubleshooting.
    var nextId = 1

    // Constructor. 
    var SimpleListener = function(keyCallback) {
        // Use self in place of this.
        var self = this

        // Save a reference to the callback function to call whenever a new key is received.
        self._keyCallback = keyCallback

        // Set the id of the listener to tell it apart from others.
        // Useful for debugging when multiple listeners are present.
        self.id = nextId

        // Increment the listener count.
        nextId++

        // PRIVATE METHODS

        // Private function used for getting the key data from the browser.
        self._receiveKey = function(event) {
            if (event) {
                if (!event.which) {
                    console.error('This browser does not support event.which, which is needed for key listening.')
                }

                // Get information about the key pressed.
                var which = event.which

                // The character code for the key.
                var key = which

                // The string for the key.
                var keyString = String.fromCharCode(which)

                // Call the callback with the key pressed information.
                //console.debug("Calling callback with " + key + " and " + keyString);
                self._keyCallback(key, keyString)
            }
        }

        // Private function attached to the listening event.
        self._listener = function(event) {
            self._receiveKey(event)
        };

        // PUBLIC METHODS

        // Start listening.
        self.startListening = function() {
            console.debug('start listening ' + self.id)
            window.addEventListener('keypress', self._listener, false)
        };

        // Stop listening.
        self.stopListening = function() {
            console.debug('stop listening ' + self.id)
            window.removeEventListener('keypress', self._listener, false)
        };
    }

    // Register the class style function on the global namespace.
    window.SimpleListener = SimpleListener
})(window)
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
    var MIN_FREQUENCY_SECONDS = 1
    var MAX_FREQUENCY_SECONDS = 60 * 60 * 24 // Number of seconds in a day

    // Make sure what was passed is valid.
    _checkConstructorParameters(specifiedObject, specifiedMethod, frequencySeconds, MIN_FREQUENCY_SECONDS, MAX_FREQUENCY_SECONDS)

    // Setup properties.
    var self = this
    self.specifiedObject = specifiedObject
    self.specifiedMethod = specifiedMethod
    self.frequencyMilliseconds = frequencySeconds * 1000

    // Start the timer.
    self.start = function() {
        self.intervalId = window.setInterval(function() {
            _callFunction(self.specifiedObject, self.specifiedMethod)
        }, self.frequencyMilliseconds)
    };

    // Stop the timer.
    self.stop = function() {
        window.clearInterval(self.intervalId)
    };

    // Reset the timer.
    self.restart = function() {
        self.stop()
        self.start()
    };

    // SUPPORTING FUNCTIONS

    // Helper to make sure the constructor paramaters are valid.
    function _checkConstructorParameters(specifiedObject, specifiedMethod, frequencySeconds, minFrequency, maxFrequency) {
        if (typeof specifiedObject !== 'object') {
            throw 'You must specify an object for the timer. Type is ' + specifiedObject
        }
        if (typeof specifiedMethod !== 'function') {
            console.log(specifiedMethod)
            throw 'You must specifify a method to call for the timer.';
        }
        if (frequencySeconds < minFrequency) {
            throw 'Out of range exception for frequency. Frequency too small: ' + frequencySeconds + '. Must be greater than ' + minFrequency
        }
        if (frequencySeconds > maxFrequency) {
            throw 'Out of range exception. Frequency too large: ' + frequencySeconds + '. Must be less than ' + maxFrequency
        }
    }

    // Explicitly call a specific function on a specific object with certain arguments.
    function _callFunction(specifiedObject, specifiedMethod, specifiedArguments) {
        if (typeof specifiedObject !== 'object') {
            throw '_callFunction: Must specify a valid object to call.';
        }
        if (typeof specifiedMethod !== 'function') {
            throw '_callFunction: Must specify a valid function to call.';
        }
        specifiedMethod.call(specifiedObject, specifiedArguments)
    }
}

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
    var MIN_TIMEOUT_SECONDS = 1
    var MAX_TIMEOUT_SECONDS = 60 * 60 * 24 // Number of seconds in a day

    // Make sure what was passed is valid.
    _checkConstructorParameters(specifiedObject, specifiedMethod, timeoutSeconds, MIN_TIMEOUT_SECONDS, MAX_TIMEOUT_SECONDS)

    // Setup properties.
    var self = this
    self.specifiedObject = specifiedObject
    self.specifiedMethod = specifiedMethod
    self.timeoutMilliseconds = timeoutSeconds * 1000

    // Debugging
    self.enableDebugging = false
    self.debug = function() {
        if (self.enableDebugging) {
            console.debug(arguments)
        }
    }

    // Start timer.
    self.start = function(args) {
        self.timeoutId = window.setTimeout(function() {
            _callFunction(self.specifiedObject, self.specifiedMethod, args)
        }, self.timeoutMilliseconds)
        self.debug('Started timer ', self.timeoutId)
    };

    // Stop timer.
    self.stop = function() {
        self.debug('Clearing timer ', self.timeoutId)
        window.clearTimeout(self.timeoutId)
    };

    // Restart the timer.
    self.restart = function() {
        self.stop()
        self.start()
    };

    // SUPPORTING FUNCTIONS

    // Helper to make sure the constructor paramaters are valid.
    function _checkConstructorParameters(specifiedObject, specifiedMethod, timeoutSeconds, minTimeout, maxTimeout) {
        if (typeof specifiedObject !== 'object') {
            throw 'You must specify an object for the timer. Type is ' + specifiedObject
        }
        if (typeof specifiedMethod !== 'function') {
            console.log(specifiedMethod)
            throw 'You must specifify a method to call for the timer.';
        }
        if (timeoutSeconds < minTimeout) {
            throw 'Out of range exception for timeout. Timeout too small: ' + timeoutSeconds + '. Must be greater than ' + minTimeout
        }
        if (timeoutSeconds > maxTimeout) {
            throw 'Out of range exception. Timeout too large: ' + timeoutSeconds + '. Must be less than ' + maxTimeout
        }
    }

    // Explicitly call a specific function on a specific object with certain arguments.
    function _callFunction(specifiedObject, specifiedMethod, specifiedArguments) {
        if (typeof specifiedObject !== 'object') {
            throw '_callFunction: Must specify a valid object to call.';
        }
        if (typeof specifiedMethod !== 'function') {
            throw '_callFunction: Must specify a valid function to call.';
        }
        specifiedMethod.call(specifiedObject, specifiedArguments)
    }
}

// We found an issue with the kiosk where clicks seemed to be missed.
// As it turns out, if you click and move just the slightest amount, it counts as a 'touchmove', and not a click.
// To resolve this issue, this touch listener was created.
function TouchListener() {
    var self = this

    // Where the user started touching and stopped.
    self.startX = null
    self.startY = null
    self.endX = null
    self.endY = null
    self.minDistance = 25 // This number seemed to work really well for detecting a touch vs. a drag off.

    // Turn debugging on and off.
    self.debugEnabled = true
    self.debug = function() {
        if (self.debugEnabled) {
            console.debug('TouchListener', arguments)
        }
    }

    // Log an error with the object name.
    self.error = function() {
        console.log('TouchListener', arguments)
    };

    // When a user starts touching the screen, store where they clicked.
    self.listenForTouchStart = function() {
        self.debug('listenForTouchStart enter')

        document.ontouchstart = function(e) {
            if (!e.touches || e.touches.length <= 0) {
                // This is an error that should never happen.
                console.log('Missing touches touchstart')
                return;
            }
            self.startX = e.touches[0].pageX
            self.startY = e.touches[0].pageY

            self.debug('listenForTouchStart startX ' + self.startX)
            self.debug('listenForTouchStart startY ' + self.startY)
        };
    }

    // When a user stops touching the screen, store where they released.
    self.listenForTouchEnd = function() {
        self.debug('listenForTouchStart exit')

        document.ontouchend = function(e) {
            if (!e.changedTouches || e.changedTouches.length <= 0) {
                // This is an error that should never happen.
                console.log('Missing touches touchend')
                return;
            }

            // Get the end coordinates.
            self.endX = e.changedTouches[e.changedTouches.length - 1].pageX
            self.endY = e.changedTouches[e.changedTouches.length - 1].pageY
            self.debug('listenForTouchEnd endX ' + self.endX)
            self.debug('listenForTouchEnd endY ' + self.endY)

            // Calculate the distance between touches.
            var distance = self._distanceFormula(self.startX, self.startY, self.endX, self.endY)
            self.debug('listenForTouchEnd distance ' + distance)

            // if the distance is smaller than a certain amount, then treat it as a click.
            if (distance <= self.minDistance) {
                self.debug('TouchListener: Triggering a click.', 'Distance was ' + distance + ' which is <= ' + self.minDistance)

                self._triggerClick(e, self.endX, self.endY)
            } else {
                self.debug('TouchListener: Not triggering a click.', 'Distance was too great. It was ' + distance + ' which is more than ' + self.minDistance)
            }
            e.preventDefault()
        };
    }

    // Helper function. Calculate the distance between two touches.
    self._distanceFormula = function(x1, y1, x2, y2) {
        var result = 0
        if (window.isNaN(x1) || window.isNaN(y1) || window.isNaN(x2) || window.isNaN(y2)) {
            self.error('TouchListener received an invalid parameter in the distance formula.')
            self.error(x1, y1, x2, y2)
            return;
        }
        if (x1 >= 0 && y1 >= 0 && x2 >= 0 && y2 >= 0) {
            result = Math.pow((x1 - x2), 2) + Math.pow((y2 - y1), 2)
            result = Math.pow(result, 0.5)
        }
        return result
    };

    // Trigger a click at a specific location on the screen.
    self._triggerClick = function(event, x, y) {
        var clickEvent = document.createEvent('MouseEvent')
        clickEvent.initMouseEvent('click', true, true, window, 0,
            event.screenX, event.screenY, event.clientX, event.clientY,
            event.ctrlKey, event.altKey, event.shiftKey, event.metaKey,
            0, null)
        event.target.dispatchEvent(clickEvent)
    };
}
// Constructor.
function _BaseAction() {
    var self = this
}
// Constructor.
function SetLanguageAction(theme) {
    var self = this

    // Private properties
    self._theme = theme
    self._langId = '';
    self._language = null
    self._buttonText = '';

    // Object initializer.
    self.initialize = function(langid, $buttonElement, defaultButtonText) {
        if (!langid) {
            console.log('Missing langid!')
            return;
        }
        if (!$buttonElement) {
            console.log('Missing parameter buttonElement!')
            return;
        }
        // Set the language properties.
        self._langid = langid
        self._language = self._getLanguage(self._theme.system.LANGUAGE)
        console.debug('Language elements: ')
        console.debug(self._language)

        if (self._language !== null) {
            // Set the button text.
            self._buttonText = self._getLanguageButtonText(defaultButtonText)

            if (self._buttonText && self._buttonText.length > 0) {
                //  If we can get some type of button text on the button, put the text on the button.
                $buttonElement.text(self._buttonText)
            } else {
                //  If we can't get some type of button text on the button, hide the button.
                console.debug('Could not find any button text for the button.')
                self._hideLanguageButton($buttonElement)
            }
        } else {
            console.log('The language ' + self._langid + ' is not enabled... Hiding the button.')
            self._hideLanguageButton($buttonElement)
        }
    }


    // HELPER METHODS

    // Returns true if the language name matched the language id we are looking for.
    self._isLanguageMatch = function(language) {
        console.debug('Checking if language matches: ' + language.name)
        var result = false
        if (language.name && language.name.toLowerCase() === self._langid.toLowerCase()) {
            console.debug('...it does.')
            result = true
        }
        return result
    };

    // Returns true if the language element has the active attribute and it is set to true.
    self._isLanguageActive = function(language) {
        var result = false
        console.debug('Checking if language is active: ' + language.name)
        if (language.active && language.active === 'true') {
            console.debug('...it is.')
            result = true
        }
        return result
    };

    // Get the language out of the system language object.
    self._getLanguage = function(systemLanguage) {
        // Get the matching language that is active (if any) from the theme.LANGUAGE
        var result = null
        var language = null
        if (systemLanguage) {
            if (systemLanguage instanceof Array) {
                for (var index = 0; index < systemLanguage.length; index++) {
                    language = systemLanguage[index]
                    if (self._isLanguageMatch(language) && self._isLanguageActive(language)) {
                        result = language
                        break;
                    }
                }
            } else {
                language = systemLanguage
                if (self._isLanguageMatch(language) && self._isLanguageActive(language)) {
                    result = language
                }
            }
        }
        console.debug('Returning result: ')
        console.debug(result)
        return result
    };

    // Hide the language button all together.
    self._hideLanguageButton = function($languageButton) {
        $languageButton.hide()
        console.debug('setLanguageAction._hideLanguageButton: The language button is now hidden.')
    };

    // Get the text to put on the language button.
    self._getLanguageButtonText = function(defaultText) {
        console.debug('Trying to get language text for language ')
        result = _nex.assets.theme.getTextAttribute('ORDER', 'language', defaultText)
        console.debug('... result found is ' + result)
        return result
    };
}
SetLanguageAction.prototype = Object.create(_BaseAction.prototype)
    // Constructor.
function SwipeToStartAction(theme) {
    var self = this
    self._theme = theme
    self._tenderStarted = null
    self.tenderType = '';
    self.cardData = null
    self._pinData = '';

    // Turn to true to enable debugging information for the swipe to start.
    var debugging = true
    self._debug = function(message) {
        if (debugging) {
            // Use built in arguments object to pass all arguments to the console.debug method.
            console.debug('SwipeToStartAction', message)
        }
    }

    // Return the tender that was created when they swiped to start.
    self.getTenderAdded = function() {
        // If they swiped to start, then after payment, we want to process the tender as a final
        // tender.
        return self._tenderStarted
    };

    // Return the pin data that was entered, if any, when they swiped to start with.
    self.getPinData = function() {
        return self._pinData
    };

    // Restore original state of this action.
    self.reset = function() {
        self.stopListening()
        self._tenderStarted = null
        self.cardData = null
        self._pinData = '';
        _nex.splashPhase.userSwipedToStart = false
    };

    // Start listening for card swipes.
    self.startListening = function(callback) {
        self._debug('startListening')
        self.reset()

        // Start listening for card swipes and other data to start an order.
        _nex.utility.deviceListener = new DeviceListener('ALL', callback)
        _nex.utility.deviceListener.start()
    };

    // Stop listening.
    self.stopListening = function() {
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
        }
    }

    // Called if the user made a valid swipe.
    self.goodSwipe = function(cardData) {
        self._debug('goodSwipe')
        self.cardData = cardData
        self._debug(self.cardData)
            // If it is a good swipe, we must determine if it is a LOYALTY card or CREDIT card.
            // We support both for swipe to start in the Flash kiosk.
        if (cardData.isLoyalty()) {
            self._debug('goodSwipe', 'User swiped a loyalty card.')
            self.tenderType = 'loyalty';
            self.swipedLoyaltyCard()
        } else {
            self._debug('goodSwipe', 'User swiped a credit card.')
            self.tenderType = 'credit';
            self.data = cardData
            self.swipedCreditCard()
        }
    }

    // Called if the user made a bad swipe.
    self.badSwipe = function(errorMessage) {
        self._debug('badSwipe', errorMessage)

        // Get the display text for a bad swipe.
        var displayText = self._theme.getTextAttribute('PAYMENT', 'swipeerror',
            'There was a problem reading your card, please swipe again')

        // Setup a callback for when the user clicks a button.
        var callback = self.reset
        self._showBadSwipe(displayText, callback)
    };

    // Helper method to show the bad swipe message on a popup.
    self._showBadSwipe = function(message, callback) {
        self._debug('showBadSwipe')
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup)
        popup.message = message
        _nex.assets.popupManager.showPopup(popup, callback)
    };

    // Prompt the user to enter their pin.
    self._promptForPin = function(track1, track2) {
        self._debug('_promptForPin')
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup)
        popup.buttons[0].clickEvent = '_nex.splashPhase.swipeToStartAction.pinEntered()';
        popup.message = _nex.assets.theme.getTextAttribute('ORDER', 'loyaltypin', 'Please enter your PIN') // TODO: Which attribute to check?
        _nex.assets.popupManager.showPopup(popup)
        _nex.keyboard.numpad.bindKeys()
    };

    // This is called after they enter a pin.
    self.pinEntered = function() {
        self._debug('pinEntered')
        self.pinData = _nex.keyboard.numpad.data

        // Do a loyalty inquiry.
        var cardData = self.cardData.cardNumber
        var cardType = self.cardData.cardType
        var track1 = self.cardData.track1
        var track2 = self.cardData.track2
        var command = new _nex.commands.LoyaltyInquiry(cardData, self.pinData, cardType, track1, track2, false)

        _nex.communication.send(command, function(response) {
            self._debug('Loyalty inquiry response', response)
                // ischarged: "false" 
                // isoffline: "false"
                // name: "TEST USER"
                // number: "1234"
                // responseReceived: "true"
                // status: "Success"
                // usedphone: "false"
                // value: "4.49"

            // Put this data on the loyalty tender.
            var loyaltyTender = new TenderLoyalty()
            loyaltyTender.update(response)

            // If it is a valid account.... 
            if (loyaltyTender.isValidAccount()) {
                self._debug('We can accept this loyalty card for swipe to start! Valid account.')
                self._continueWithLoyalty()

            } else {
                self._debug("Can't accept this loyalty card for swipe to start! Invalid account")
                self._genericError(self.reset)
            }
        }, 'LOYALTYRESPONSE')
    };

    // Continue to previous orders with the loyalty information found.
    self._continueWithLoyalty = function() {
        self._debug('continueWithLoyalty')
        self._gotoPreviousOrders(self.cardData)
    };

    // This is called if the user swiped to start with a credit card.
    self.swipedCreditCard = function() {
        var tenderCredit = new TenderCredit()
        tenderCredit.update(self.cardData.track1, self.cardData.track2)
        self._tenderStarted = tenderCredit
        self._createCreditTender()
    };

    self._createCreditTender = function() {
        var requestObject = new _nex.commands.AddTender('credit')
        _nex.communication.send(requestObject, function(response) {
            if (response) {
                self._gotoPreviousOrders(self.cardData)
            }
        }, 'TENDERADDED')
    };

    self._createLoyaltyTender = function() {
        var requestObject = new _nex.commands.AddTender('loyalty')
        _nex.communication.send(requestObject, function(response) {
            if (response) {
                self._gotoPreviousOrders(self.cardData)
            }
        }, 'TENDERADDED')
    };

    // This is called if the user swiped to start with a loyalty card.
    self.swipedLoyaltyCard = function() {
        self._debug('swipedLoyaltyCard')
        var tenderConfig = _nex.assets.theme.getTenderByType('loyalty')
        if (tenderConfig) {
            if (_nex.assets.theme.isValidationRequired(tenderConfig)) {
                // prompt for pin
                self._debug('validateLoyalty', 'validation required; prompting for pin')
                self._promptForPin()
            } else {
                // no validation required, don't prompt for pin
                self._debug('validateLoyalty', 'validation not required; not prompting for pin')
                self._createLoyaltyTender()
            }
        } else {
            // Missing the loyalty tneder in the computeration.
            self._debug('validateLoyalty', 'Possible Configuration Error: No tender for loyalty found')
            self._genericError(self.reset)
        }
    }

    // Go to the ordering phase.
    self._gotoOrdering = function() {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function() {
            _nex.ordering.start()
        })
    };

    // Go to the previous orders phase.
    self._gotoPreviousOrders = function(cardData) {
        console.debug('_gotoPreviousOrders', 'Going to previous orders')
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PREVIOUS_ORDERS, function() {
            _nex.previousOrders.start(cardData)
        })
    };

    // Show a generic error message.
    self._genericError = function(callback) {
        // Re-use the one from payment.
        var message = _nex.payment.textProcessingError()
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup)
        popup.message = message
        _nex.assets.popupManager.showPopup(popup, callback)
    };
}
SwipeToStartAction.prototype = Object.create(_BaseAction.prototype)
    // buttonFactory.js
function ButtonFactory() {
    var self = this
    self.ITEM_TYPE_ITEM = 'Item';
    self.ITEM_TYPE_MOD = 'Modifier';

    self.createButton = function(menuItem, templateName) {
        var button = null

        if (!menuItem || !menuItem.buttontype) {
            console.log('no button available on this menu. template: ' + templateName)
            return null
        }

        var buttonId = _nex.assets.templateManager.getButtonId(templateName, menuItem.buttontype)

        switch (menuItem.buttontype) {
            case 'MENUBUTTON':
                {
                    button = new _nex.assets.buttons.MenuButton()
                    break;
                }
            case 'SELECTONE':
                {
                    button = new _nex.assets.buttons.SelectOne()
                    break;
                }
            case 'MULTIMENUBUTTON':
                {
                    button = new _nex.assets.buttons.MultiMenuButton()
                    break;
                }
            case 'SELECTONEMODIFIER':
                {
                    button = new _nex.assets.buttons.SelectOneModifier()
                    break;
                }
            case 'SELECTMANYITEM':
                {
                    button = new _nex.assets.buttons.SelectManyItem()
                    break;
                }
            case 'SELECTMANYMODIFIER':
                {
                    button = new _nex.assets.buttons.SelectManyModifier()
                    break;
                }
            case 'SELECTONEQUANTITY':
                {
                    button = new _nex.assets.buttons.SelectOneQuantity()
                    break;
                }
            case 'SELECTOTHER':
                {
                    button = new _nex.assets.buttons.SelectOther()
                    break;
                }
            case 'LESSMORE':
                {
                    button = new _nex.assets.buttons.LessMore()
                    break;
                }
            case 'SELECTNE':
                {
                    button = new _nex.assets.buttons.SelectNE()
                    break;
                }
            default:
                {
                    button = new _nex.assets.buttons.Blank()
                    break;
                }
        }

        // set the button id
        if ((button !== null) && (buttonId !== '')) {
            button.templateButtonName(buttonId)
        }

        return button
    };

    self.hasNoItems = function(buttonType) {
        return ((buttonType === null) ||
            (buttonType.toUpperCase() === 'BLANK') ||
            (buttonType.toUpperCase() === 'MENUBUTTON') ||
            (buttonType.toUpperCase() === 'MULTIMENUBUTTON') ||
            (buttonType.toUpperCase() === 'ORDERREVIEWITEM') ||
            (buttonType.toUpperCase() === 'SELECTALL') ||
            (buttonType.toUpperCase() === 'SELECTOTHER') ||
            (buttonType.toUpperCase() === 'SELECTMODIFIERPOPUP'))
    };

    self.getItemTypeForButton = function(buttonType) {
        if (self.hasNoItems(buttonType)) {
            return self.ITEM_TYPE_ITEM
        } else {
            if (buttonType.toUpperCase() == 'SELECTONE') {
                return self.ITEM_TYPE_ITEM
            } else if (buttonType.toUpperCase() == 'SELECTONEQUANTITY') {
                return '';
            } else {
                return self.ITEM_TYPE_MOD
            }
        }
    }
}

// Constructor. Returns an object that represents a collection of card data.
// This data is usually parsed from track data with the CardParser.
function CardData() {
    var self = this

    // Clear method.
    self.clear = function() {
        self.tenderType = paymentConstants.TENDER_CREDIT
        self.tenderTypeCode = '1';
        self.cardData = null
        self.cardNumber = '';
        self.expMonth = '';
        self.expYear = '';
        self.amount = 0.00
        self.cardType = '';
        self.track1 = '';
        self.track2 = '';
        self.userData = '';
        self.isTaxExempt = false
        self.cardId = '';
        self.billingStreet = '';
        self.billingZip = '';
        self.firstName = '';
        self.lastName = '';

        // Added for things like Loyalty where there is a card name based on the card type.
        self.cardName = '';
    }

    // Call the clear method initially to initialize variables.
    self.clear()

    // Returns true if the card type is loyalty.
    self.isLoyalty = function() {
        // For loyalty cards, if it can't find the card type, the card parser sets it to LOYALTY.
        return self.cardType === 'LOYALTY';
    }

    // Returns the full name on the card.
    self.fullName = function() {
        // Used for previous order lookup, for example.
        return self.firstName + ' ' + self.lastName
    };
}
// Constructor.
function CardParser(theme) {
    var self = this

    // CardParser depends on the theme for certain things. This dependency is passed in.
    self._theme = theme

    // Keep a list of all the credit cards accepted.
    self._creditCards = []

    // Keep track of whether or not this card type is accepted.
    self._isCardTypeAccepted = false

    // Store the card data parsed off the card.
    self.cardData = {}

    // Store any errors reading the card data.
    self.lastErrorMessage = '';

    // PUBLIC METHODS

    // CardParser parses the track data and returns a CardData object. 
    // Returns null if there was a problem with the card data.
    // Optionally pass in a successCallback and an errorCallback to use instead of
    // returning the card data.
    self.parse = function(track1, track2, successCallback, errorCallback) {
        // Default the result to null.
        var result = null

        // Initialize local variables for the card parser.
        self._initialize(self._theme)
        self.cardData = new CardData()

        // Try and parse the data.
        var parseResult = self._parseCard(track1, track2)

        // If it succeeded.
        if (parseResult === true) {
            // Set the result.
            result = self.cardData

            // If a successcallback was specified, call it.
            if (successCallback) {
                successCallback(result)
            }
        } else {
            // If an error callback was specified, call it.
            if (errorCallback) {
                // Pass along the message of what went wrong so it can be logged.
                errorCallback(self.lastErrorMessage)
            }
        }

        // If no callbacks were specified, simply return the result.
        if ((!successCallback) && (!errorCallback)) {
            // Return the result.
            return result
        }
    }

    // PRIVATE/HELPER METHODS

    // Parse all the data out of track1 and track2.
    // Returns true if the card data was parsed, and the card type is accepted.
    // Returns false if there was some type of issue.
    self._parseCard = function(track1, track2) {
        // This logic is mostly copied from the Flash.
        var result = false

        // Track 1 might be empty.
        if (!track1) {
            track1 = '';
        }

        // Reader returns an error
        if ((track1 === '%E?') || (track2 === ';E?')) {
            self.lastErrorMessage = 'ERROR IN TRACK 1 OR TRACK 2';
            return result
        }

        // track 1 and 2 do not start and end with the proper sentinels
        if ((track1.indexOf('%') !== 0) && (track1.indexOf('?') !== (track1.length - 1))) {
            self.lastErrorMessage = 'TRACK1: CARD READ ERROR WITH SENTINELS';
            return result
        }

        if ((track2.indexOf(';') !== 0) && (track2.indexOf('?') !== (track2.length - 1))) {
            self.lastErrorMessage = 'TRACK2: CARD READ ERROR WITH SENTINELS';
            return result
        }

        // validate the length of track 1 and 2
        if ((track1.length !== 0) && (track1.length > 79)) {
            self.lastErrorMessage = 'TRACK1 OR TRACK2: length is incorrect';
            return result
        }

        // if ((track1.length > 0) && ((track2 === null) || (track2.length === 0)))
        // {
        // cards that are encode with just track1 are to be ignore; credit cards will always have two tracks
        // the only Track1 only cards that exist are the old NEXTEP Admin Cards; these should already be trained
        // return "IGNORE";
        // }
        //
        // if(((track2 === null) || (track2.length === 0) || (track2.length > 40)))
        // {
        // Logger.Publish(Logger.INFO, "Track 2 - The length of the track data is either too short or too long; ");
        // return CreditCard.RESULT_ERROR;
        // }

        // process credit card
        var numdone = false
        var lastdone = false
        var firstdone = false
        var offset = 2
        var isCreditCard = false
        var character = ''

        self.cardData.cardNumber = '';
        self.cardData.lastName = '';
        self.cardData.firstName = '';

        var i

        isCreditCard = (track1.substr(1, 1) === 'B')

        for (i = offset; i <= track1.length && !numdone; i++) {
            character = track1.substr(i, 1)
            if (character === '^') {
                numdone = true
                offset++
            } else if (!numdone) {
                self.cardData.cardNumber += character
            }
        }

        for (i = (offset + self.cardData.cardNumber.length); i <= track1.length && !lastdone; i++) {
            character = track1.substr(i, 1)
            if (character === '/') {
                lastdone = true
                offset++
            } else if (character === '^') {
                lastdone = true
                firstdone = true
                offset++
            } else if (!lastdone) {
                self.cardData.lastName += character
            }
        }

        for (i = (4 + self.cardData.cardNumber.length + self.cardData.lastName.length); i <= track1.length && !firstdone; i++) {
            character = track1.substr(i, 1)
            if (character === '^') {
                firstdone = true
                offset++
            } else if (!firstdone) {
                self.cardData.firstName += character
            }
        }

        var index = offset + self.cardData.cardNumber.length + self.cardData.lastName.length + self.cardData.firstName.length
        self.cardData.lastName = self.cardData.lastName.trim()
        self.cardData.firstName = self.cardData.firstName.trim()
        self.cardData.expYear = track1.substr(index, 2)
        self.cardData.expMonth = track1.substr(index + 2, 2)

        // verify that the Card Number and Expiration are parsed from track1 successfully.

        if ((isCreditCard) &&
            (track1.length > 0) &&
            ((self.cardData.cardNumber.length === 0) ||
                (self.cardData.expYear.length === 0) ||
                (self.cardData.expMonth.length === 0))) {
            self.lastErrorMessage = 'Card Number or expiration parsing failure';
            return result
        } else if ((!isCreditCard) &&
            ((track2.length > 0) || ((track1.length > 0) && (track2.length === 0)))) {
            // loyality card
            self.cardData.lastName = '';
            self.cardData.firstName = '';
            self.cardData.expYear = '';
            self.cardData.expMonth = '';
            self.cardData.cardNumber = (track1.length > 0) ? track1.substring(1, track1.length - 1) : track2.substring(1, track2.length) // remove the leading (";") 
            if (self.cardData.cardNumber.indexOf('?') !== -1) {
                self.cardData.cardNumber = self.cardData.cardNumber.substr(0, self.cardData.cardNumber.indexOf('?')) // remove the trailing ("?") chacaters 
            }
            if (self.cardData.cardNumber.indexOf('=') !== -1) {
                self.cardData.cardNumber = self.cardData.cardNumber.substr(0, self.cardData.cardNumber.indexOf('=')) // remove the trailing ("?") chacaters 
            }

            // Try to set the card type by the card id.
            self.cardData.cardType = self._getCardTypeByCardID(self.cardData.cardNumber)
            if (self.cardData.cardType === null) {
                self.cardData.cardType = 'LOYALTY';
            }

            // If it is accepted, set the result to true; otherwise, set it to error.
            self._isCardTypeAccepted = self._isCardTypeAcceptedByCardType(self.cardData.cardType)

            // If it is accepted
            if (self._isCardTypeAccepted) {
                result = true
            } else {
                self.lastErrorMessage = 'Card type is not accepted';
                return result
            }
        } else {
            // Set the card type based on the card number.
            self.cardData.cardType = self._getCardType(self.cardData.cardNumber)

            // Set whether or not it is accepted.
            self._isCardTypeAccepted = self._isCardTypeAcceptedByCardType(self.cardData.cardType)

            // If it is accepted, set the result to true; otherwise, set it to error.
            if (self._isCardTypeAccepted) {
                result = true
            } else {
                self.lastErrorMessage = 'Card type is not accepted';
                return result
            }
        }
        // Set track1 and track2.
        self.cardData.track1 = track1
        self.cardData.track2 = track2
        return result
    };

    // Initialize local variables.
    self._initialize = function(theme) {
        // Lazy initialize a local array of the credit cards.
        self._initCardArray(theme)
    };

    // Returns the card type. First checks the CREDITCARD list in system.
    // If any of those have the 'hascardid' attribute set, it will try and read get the card type from there;
    // otherwise, it will check the digits on the card.
    self._getCardType = function(cardnumber) {
        var firstDigit = Number(cardnumber.substr(0, 1))
        var secondDigit = Number(cardnumber.substr(1, 1))

        // Try to get the card type by its id.
        var cardType = self._getCardTypeByCardID(cardnumber)
        if (cardType !== null) {
            return cardType
        }
        // Try to get the card type by the card number digits.
        else if (firstDigit === 1) {
            return 'JCB';
        } else if (firstDigit === 2) {
            if (cardnumber.length >= 6) {
                if (!isNaN(cardnumber.substring(0, 6))) {
                    var bin = parseInt(cardnumber.substring(0, 6))
                    if (!isNaN(bin)) {
                        if (bin >= 222100 && bin <= 272099) {
                            return 'MASTERCARD';
                        }
                    }
                }
            }
            return 'JCB';
        } else if (firstDigit === 3) {
            if (cardnumber.length === 16) {
                return 'JCB';
            }
            if (secondDigit === 6) {
                return 'MASTERCARD';
            } else if ((secondDigit === 4) || (secondDigit === 7)) {
                return 'AMEX';
            } else {
                return 'DINERS';
            }
        } else if (firstDigit === 4) {
            return 'VISA';
        } else if (firstDigit === 5 && secondDigit === 6) {
            return ''; // Bankcard
        } else if (firstDigit === 5 && secondDigit >= 1 && secondDigit <= 5) {
            return 'MASTERCARD';
        } else if (cardnumber.indexOf('6011') === 0 ||
            cardnumber.indexOf('622') === 0 ||
            cardnumber.indexOf('64') === 0 ||
            cardnumber.indexOf('65') === 0) {
            return 'DISCOVER';
        } else if (cardnumber.indexOf('564182') === 0 ||
            cardnumber.indexOf('633110') === 0 ||
            cardnumber.indexOf('6333') === 0 ||
            cardnumber.indexOf('6759') === 0) {
            return 'MAESTRO'; // used to be SWITCH card types
        } else if (cardnumber.indexOf('5018') === 0 ||
            cardnumber.indexOf('5020') === 0 ||
            cardnumber.indexOf('5038') === 0 ||
            cardnumber.indexOf('6304') === 0 ||
            cardnumber.indexOf('6759') === 0 ||
            cardnumber.indexOf('6761') === 0 ||
            cardnumber.indexOf('6762') === 0 ||
            cardnumber.indexOf('6763') === 0 ||
            cardnumber.indexOf('0604') === 0) {
            return 'MAESTRO'; // a UK company
        } else if (firstDigit === 6) {
            return 'DISCOVER';
        } else if (firstDigit === 5) {
            return 'MASTERCARD';
        } else {
            return null
        }
        /*
            else if(firstDigit === 5) 
            {
                if (secondDigit === 6) 
                {
                    return ""; // Bankcard
                }
                else 
                {
                    return "MASTERCARD";
                }
            }
            else if (firstDigit === 6)
            {
                return "DISCOVER";
            } 
            else
            {
                return null;
            }
            */
    }

    // Initialize the card array variable with a list of credit cards that are accepted.
    self._initCardArray = function(theme) {
        // Guard against bad parameters.
        if (!theme) {
            console.log('CardParser._initCardArray: Missing required parameter theme.')
            return;
        }
        if (!theme.system) {
            console.log('CardParser._initCardArray: Missing required parameter theme.system')
            return;
        }
        // Initialize the array if it hasn't been already.
        if (self._creditCards.length === 0) {
            if (theme.system.CREDITCARD) {
                for (var index = 0; index < theme.system.CREDITCARD.length; index++) {
                    var card = theme.system.CREDITCARD[index]
                    if (card.accept === 'true') {
                        self._creditCards.push(card)
                    }
                }
            }
        }
    }

    // Returns the card type by the code attribute if the 'hascardid' attribute is set;
    // otherwise, null.
    self._getCardTypeByCardID = function(cardNumber) {
        var cardType = null
        try {
            // Loop through the credit cards array.
            for (var i = 0; i < self._creditCards.length && cardType === null; i++) {
                if ((self._creditCards[i].hascardid.toString().toLowerCase() === 'true') && (cardNumber.indexOf(self._creditCards[i].cardid) === 0)) {
                    cardType = self._creditCards[i].code
                }
            }
        } catch (e) {
            // This can happen if hascardid attribute is missing. 
        }

        return cardType
    };

    // Returns true if the 'accept' attribute is set to true.
    self._isCardTypeAcceptedByCardType = function(cardType) {
        // find the card if it is accepted
        for (var i = 0; i < self._creditCards.length; i++) {
            var card = self._creditCards[i]
            if (card.accept === 'true' && card.code === cardType) {
                return true
            }
        }
        return false
    };
}

// Modeled after the flash. Offer special functionality for the Offline phase.
// The Flash offered methods for updating the status, and stored them in two fields, txtStatus0 and txtStatus1.
// It would then allow displaying that status.
function Offline(htmlEscapeFunction, elementId0, elementId1) {
    var self = this

    // Private variables for the reason we are offline.
    // Status 0 was used in the flash as the offline reason for things like the license has expired,
    // status1 is used for dayparts.
    var _status = '';
    var _reason = '';
    var _htmlEscapeFunction = htmlEscapeFunction


    // When the kiosk is offline, it is often the practice to show the reason
    // in the top-right corner, and/or the dayparts information at the bottom
    // if they are offline because of dayparts.

    // PUBLIC METHOD

    // Update the messages and refresh the display.
    self.update = function(message0, message1) {
        _status = (message0 !== undefined) ? window.htmlEscape(message0) : '';
        _reason = (message1 !== undefined) ? window.htmlEscape(message1) : '';

        self.updateDisplay()
    };

    // Clear out the statuses and update the display.
    self.clearReason = function() {
        _status = '';
        _reason = '';
        self.updateDisplay()
    };

    // Update the display.
    self.updateDisplay = function() {
        var offline = $('#__offline')
        var status0 = offline.find('#txtStatus0')
        var status1 = offline.find('#txtStatus1')
        var closeBg = offline.find('#closeBg')

        offline.css('display', '')
        status0.empty()
        status1.empty()

        _status = _status.replace('{0}', _reason)

        var visibility = 'none';
        if ((_reason.length > 0) &&
            (_nex.manager.currentStatus === _nex.manager.statusType.OFFLINE) &&
            _nex.manager.connectedToTM) {
            if ((_reason.toLowerCase().indexOf(' am', 0) >= 0) || (_reason.toLowerCase().indexOf(' pm', 0) >= 0)) {
                visibility = '';
                status1.append(_status)
            }
        } else {
            if (status0.length === 0) {
                console.log('#txtStatus0 not found')
            }
            status0.append(_status)
        }

        closeBg.css('display', visibility)
    };

    self.hide = function() {
        $('#__offline').empty()
        $('#__offline').css('display', 'none')
    };
}

function PhaseMover(elementId) {
    var self = this

    // use the position manager to do the actual positioning
    self._positionManager = new PositionManager(elementId)

    // jQuery objects for each button.
    self._$upButton = null
    self._$downButton = null
    self._$leftButton = null
    self._$rightButton = null

    // debugging
    var debugEnabled = true
    self.debug = function() {
        if (debugEnabled) {
            console.debug(arguments)
        }
    }

    // There could potentially be four buttons for moving the screen around.
    // Bind the buttons.
    self.bind = function(upButtonId, downButtonId, leftButtonId, rightButtonId) {
        if (upButtonId) {
            self._$upButton = $('#' + upButtonId)
        }
        if (downButtonId) {
            self._$downButton = $('#' + downButtonId)
        }
        if (leftButtonId) {
            self._$leftButton = $('#' + leftButtonId)
        }

        if (rightButtonId) {
            self._$rightButton = $('#' + rightButtonId)
        }

        // Rebind.
        self.rebind()
    };

    // Unbind the click handlers and bind them again.
    self.rebind = function() {
        if (self._$upButton.length > 0) {
            self._$upButton.unbind('click', self.upClicked)
            self._$upButton.on('click', self.upClicked)
        }
        if (self._$downButton.length > 0) {
            self._$downButton.unbind('click', self.downClicked)
            self._$downButton.on('click', self.downClicked)
        }
        if (self._$leftButton.length > 0) {
            self._$leftButton.unbind('click', self.leftClicked)
            self._$leftButton.on('click', self.leftClicked)
        }
        if (self._$rightButton.length > 0) {
            self._$rightButton.unbind('click', self.rightClicked)
            self._$rightButton.on('click', self.rightClicked)
        }
    }

    // Unbind the click handlers.
    self.unbind = function() {
        if (self._$upButton.length > 0) {
            self._$upButton.unbind('click', self.upClicked)
        }
        if (self._$downButton.length > 0) {
            self._$downButton.unbind('click', self.downClicked)
        }
        if (self._$leftButton.length > 0) {
            self._$leftButton.unbind('click', self.leftClicked)
        }
        if (self._$rightButton.length > 0) {
            self._$rightButton.unbind('click', self.rightClicked)
        }
    }

    // Reset the CSS transform property.
    self.reset = function() {
        self._positionManager.resetTransform()
    };

    // Position to a spot on the screen.
    self.positionToSpot = function(position) {
        switch (position) {
            case '0':
                self._positionManager.positionToSpot('TOP_LEFT')
                break;
            case '1':
                self._positionManager.positionToSpot('TOP_CENTER')
                break;
            case '2':
                self._positionManager.positionToSpot('TOP_RIGHT')
                break;
            case '3':
                self._positionManager.positionToSpot('MIDDLE_LEFT')
                break;
            case '4':
                self._positionManager.positionToSpot('MIDDLE_CENTER')
                break;
            case '5':
                self._positionManager.positionToSpot('MIDDLE_RIGHT')
                break;
            case '6':
                self._positionManager.positionToSpot('BOTTOM_LEFT')
                break;
            case '7':
                self._positionManager.positionToSpot('BOTTOM_CENTER')
                break;
            case '8':
                self._positionManager.positionToSpot('BOTTOM_RIGHT')
                break;
                // case 9 is for touch positioning.
        }
    }

    // Show all the buttons for the phase mover.
    // Optionally pass in x and y coordinates for where to put the phase. 
    self.show = function(x, y) {
        // If the user clicked on a specific spot to start, set the screen to that position.
        if (x) {
            if (y) {
                self._positionManager.positionToTouch(x, y)
            }
        }
        if (self._$upButton.length > 0) {
            self._$upButton.show()
        }

        if (self._$downButton.length > 0) {
            self._$downButton.show()
        }

        if (self._$leftButton.length > 0) {
            self._$leftButton.show()
        }

        if (self._$rightButton.length > 0) {
            self._$rightButton.show()
        }
    }

    // Hide all the buttons.
    self.hide = function() {
        if (self._$upButton.length > 0) {
            self._$upButton.hide()
        }

        if (self._$downButton.length > 0) {
            self._$downButton.hide()
        }

        if (self._$leftButton.length > 0) {
            self._$leftButton.hide()
        }

        if (self._$rightButton.length > 0) {
            self._$rightButton.hide()
        }
    }

    // Do an unbind and hide together.
    self.unbindAndHide = function() {
        self.unbind()
        self.hide()
    };

    // Do a rebind and show together.
    self.rebindAndShow = function() {
        self.rebind()
        self.show()
    };

    // Click event handlers.
    self.upClicked = function() {
        self.debug('upClicked')
        self._trackClick()
        self._playSound()
        self._moveUp()

    };
    self.downClicked = function() {
        self.debug('downClicked')
        self._trackClick()
        self._playSound()
        self._moveDown()
    };
    self.leftClicked = function() {
        self.debug('leftClicked')
        self._trackClick()
        self._playSound()
        self._moveLeft()

    };

    self.rightClicked = function() {
        self.debug('rightClicked')
        self._trackClick()
        self._playSound()
        self._moveRight()
    };

    // Private/helper methods

    // Track the click.
    self._trackClick = function(buttonId) {
        // No button tracking at this moment.
    }

    // Play the appropriate sound.
    self._playSound = function() {
        // No sound played at this moment.
    }

    // Perform the actual movement.
    self._moveUp = function() {
        self._positionManager.moveUp()
    };
    self._moveDown = function() {
        self._positionManager.moveDown()
    };
    self._moveLeft = function() {
        self._positionManager.moveLeft()
    };
    self._moveRight = function() {
        self._positionManager.moveRight()
    };

    // Resize the content.
    self.size = function(newSize) {
        var defaultSize = 8
        var newSizeInt = parseInt(newSize)

        // We have 8 different resolutions specified in mynextep.
        if (isNaN(newSizeInt)) {
            console.log('Invalid screen resolution specified ' + newSize)
            newSizeInt = defaultSize
        }
        if (newSizeInt < 0) {
            console.log('Invalid screen resolution specified ' + newSizeInt)
            newSizeInt = defaultSize
        }
        if (newSizeInt > 9) {
            console.log('Invalid screen resolution specified ' + newSizeInt)
            newSizeInt = defaultSize
        }

        // Use the utility to actually do the sizing.
        self._positionManager.size(newSizeInt)
    };
}

/** @constructor */
function SoundManager(csharpSoundManager) {
    // Make self synonymous with this.
    var self = this

    // Object to use for playing sounds on the C# side of the code.
    self._csharpSoundManager = csharpSoundManager

    // For KVI, sometimes we want to stop speaking for a moment, and start again; this variable helps with that.
    self.speakEnabled = true

    // Common sound files.
    self._sounds = [
        { index: 0, file: 'dtmf0.mp3' },
        { index: 1, file: 'dtmf1.mp3' },
        { index: 2, file: 'dtmf2.mp3' },
        { index: 3, file: 'dtmf3.mp3' },
        { index: 4, file: 'dtmf4.mp3' },
        { index: 5, file: 'dtmf5.mp3' },
        { index: 6, file: 'dtmf6.mp3' },
        { index: 7, file: 'dtmf7.mp3' },
        { index: 8, file: 'dtmf8.mp3' },
        { index: 9, file: 'dtmf9.mp3' },
        { index: 10, file: 'button-hit.mp3' },
        { index: 11, file: 'Continue-Nudge.mp3' },
        { index: 12, file: 'chimeloop.mp3' }
    ]

    self.initialize = function(filepath) {
        // self._csharpSoundManager.initialize(filepath);
    }

    // Play a specific sound in the list based on its index.
    self.playSoundByIndex = function(index) {
        // Double check we can play this sound.
        var isValidIndex = self._checkSoundByIndex(index)

        if (isValidIndex) {
            // Get the sound.
            var sound = self._getSoundByIndex(index)

            // Play the sound.
            // console.debug("Playing sound " + sound.file);
            self._playMP3(sound.file)
        }
    }


    // Play a specific sound in the list based on its filename.
    //self.playSoundByName = function (filepath) {

    //    // Double check we can play this sound.
    //    self._checkSoundByFilename(filename);

    //    // Get the sound.
    //    self.getSoundByName(filename);

    //    // Play the sound.
    //    self._playMP3(filepath);
    //};

    // Play the button-hit sound.
    self.playButtonHit = function() {
        self._playMP3(self._sounds[10].file)
    };

    // Play the chime sound.
    self.playChime = function() {
        self.playSoundByIndex(12) // chime is the 12th sound
    };

    // SUPPORTING FUNCTIONS

    self._getSoundByIndex = function(index) {
        return self._sounds[index]
    };

    self._getSoundByName = function(name) {
        for (var index = 0; index < self._sounds.length; index++) {
            var sound = self._sounds[index]
            if (sound.file === name) {
                return sound
            }
        }
        return false
    };

    // Check that we can play the sound at the specific index.
    self._checkSoundByIndex = function(index) {
        var result = true
            // Make sure the index is valid.
        if (index < 0) {
            console.log('Invalid sound index ' + index)
            result = false
        } else if (isNaN(index)) {
            console.log('Invalid sound index ' + index)
            result = false
        }
        return result

    };

    // Check that we can play the sound with the specific name.
    self._checkSoundByFilename = function(filename) {
        // Make sure the index is valid.
        if (!filename) {
            console.log('Missing filename.')
        }
        if (!filename.length) {
            console.log('Invalid filename ' + filename)
        }
        if (filename.length <= 0) {
            console.log('Empty string for filename.')
        }
    }

    // Play a sound for a known file. Does not support MP3.
    self._playSound = function(filename) {
        var audio = document.createElement('audio')
        audio.setAttribute('src', filename)
        audio.play()
            // Note: The audio element is not supported in IE-8 and below.
    };

    // Play an MP3 file.
    self._playMP3 = function(filename) {
        // MP3 files are not supported in CEF... so we are playing the sound
        // on the C# side of the application. This will need to be changed for
        // future platforms.
        // self._csharpSoundManager.playSound(filename);
    }

    self.cancelVoiceover = function() {
        try {
            self._csharpSoundManager.cancelVoiceover()
        } catch (e) {
            // gracefully throw away error
        }
    }

    self.playVoiceover = function(filename) {
        try {
            if (_nex.assets.theme.voiceoversEnabled) {
                if (_nex.assets.theme.languageSelected.toLowerCase() !== 'english') {
                    filename = _nex.assets.theme.languageSelected + '\\' + filename
                }
                self._csharpSoundManager.playSoundWithCancel(filename)
            }
        } catch (e) {
            // gracefully throw away error
        }
    }

    // KVI
    self.volumeUp = function() {
        self._csharpSoundManager.volUp()
    };

    // KVI
    self.volumeDown = function() {
        self._csharpSoundManager.volDown()
    };

    // KVI
    self.speak = function(text) {
        if (!self.speakEnabled) {
            return
        }
        if (!_nex.kvi.active) {
            return
        }
        if (!_nex.navBar.jackedIn) {
            return
        }
        if (self._csharpSoundManager.speak) {
            self._csharpSoundManager.speak(text)
        }
    }

    // KVI
    self.cancelSpeak = function(force) {
        if (!self.speakEnabled) {
            return;
        }
        if (!_nex.kvi.active) {
            return;
        }
        if (!_nex.navBar.jackedIn) {
            return;
        }
        if (force) {
            self._csharpSoundManager.cancelSpeak();
        } else {
            // If you are on the splash screen, you can't skip out of the initial dialog.
            if (_nex.assets.phaseManager.currentPhase === _nex.assets.phaseManager.phaseType.SPLASH) {

            } else {
                self._csharpSoundManager.cancelSpeak();
            }
        }
    };

    // KVI
    self.setSpeaker = function(jackin) {
        self._csharpSoundManager.setSpeaker(jackin)
    };
}
/*
 * theme.js
 */
function ThemeUX(themeId, themeMediaPath) {
    var self = this

    Theme.call(self, themeId, themeMediaPath)

    self.splashid = 'default'
    self.itemClasses = null
    self.lastUpdate = null
    self.isUpdateAvailable = false
    self.testMode = false
    self.languageSelected = 'english'; // can be switched to spanish, for example, from the splash screen.
    self.otherLanguages = null

    self.debugEnabled = false
    self.debug = function() {
        if (self.debugEnabled) {
            console.debug('ThemeUX', arguments)
        }
    }

    // helper method for the media path (themes folder)
    self.mediaPath = function() {
        if (inPreviewer()) {
            return '../Media.aspx?media=';
        }
        var path = self.mediaRootUri
        if (self.mediaRootUri.toLowerCase().indexOf(self.id.toLowerCase()) === -1) {
            path += '/' + self.id
        }
        return path + '/media/'
    };

    // load update is called to save off the update until it can be applied
    self.loadUpdate = function(update) {
        self.lastUpdate = update
        self.isUpdateAvailable = true
    };

    self._videoUrl = function() {
        var url = 'http://127.0.0.1:8088';
        if (_nex.assets.theme.frenabled) {
            self.debug('setVideoFeed', 'frenabled')
            url = 'http://127.0.0.1:8089';
        }

        var password = 'Kiosk1';
        var userid = 'nextep';
        var feedUrl = '"' + url + '"';

        return feedUrl.replace('http://', 'http://' + userid + ':' + password + '@')
    };

    // loads the video stream that is to be used by all video viewers
    self._loadVideoStream = function() {
        var videoStream = $('#videostream')
        if (videoStream.length === 0) {
            var iframe = '<iframe src=' + self._videoUrl() + ' id="videostream" style="display:none" ></iframe>' //
            $('#targets').append(iframe)
        }
    }

    // set the video feed
    self.setVideoFeed = function(html) {
        // cam feed frame.  The reason why there is an iframe is due to an issue with Chromium for basic auth where the user name and password was stripped from the img tag.
        // This does not happen to iframes.  But the credentials get cached by the iframe so the img tag works.
        if (_nex.assets.theme.hasvideo) {
            self._loadVideoStream()

            self.debug('setVideoFeed', 'showing video feed')
            var img = '<img src=' + self._videoUrl() + ' id="cameraFrame" class="camera-frame"  alt="Video Feed Unavailable" >'

            html.find('#videofeedwrapper').empty()
            html.find('#videofeedwrapper').append(img)
        }
    }

    self.clearVideoFeed = function(html) {
        html.find('#videofeedwrapper').empty()
    };

    // override setnutrition to work slightly different
    self.setNutrition = function(item, html, hideOnEmpty) {
        var fillNutritionAmount = function(attrName, elementId, htmlSnippet, itemObj) {
            var valueSet = false
            var itemAttr = self.findItemAttribute(itemObj, attrName)
            var amount = (itemAttr !== null) ? itemAttr.value : '';

            var amountText = htmlSnippet.find('#' + elementId)
            if (amountText.length > 0 && amount.length > 0) {
                amountText.empty()
                amountText.append(amount)
                valueSet = true //at least one nutritional value was found and set
            }

            var labelText = htmlSnippet.find('#' + elementId + 'Label')
            if (labelText && labelText.length > 0) {
                labelText.empty()
                var labelVal = self.getTextAttribute('ORDER', (elementId + 'Label').toLowerCase(), attrName)
                labelText.append(labelVal)
            }

            return valueSet
        };

        if (item !== null) {
            var valueSet = false
            valueSet = fillNutritionAmount('Serving Size', 'serving', html, item)
            valueSet = fillNutritionAmount('Calories Per Serving', 'calories', html, item) || valueSet
            valueSet = fillNutritionAmount('Total Fat', 'totalFat', html, item) || valueSet
            valueSet = fillNutritionAmount('Saturated Fat', 'satFat', html, item) || valueSet
            valueSet = fillNutritionAmount('Trans Fat', 'transFat', html, item) || valueSet
            valueSet = fillNutritionAmount('Cholesterol', 'cholesterol', html, item) || valueSet
            valueSet = fillNutritionAmount('Sodium', 'sodium', html, item) || valueSet
            valueSet = fillNutritionAmount('Total Carbohydrates', 'totalCarbs', html, item) || valueSet
            valueSet = fillNutritionAmount('Sugar', 'sugars', html, item) || valueSet
            valueSet = fillNutritionAmount('Protein', 'protein', html, item) || valueSet
            valueSet = fillNutritionAmount('Fiber', 'fiber', html, item) || valueSet

            //the entire nutritional visual will be hidden if no nutritional values are found for the given item.
            if (hideOnEmpty && !valueSet) {
                html.hide()
            } else {
                html.show()
            }
        }
    }

    // Loop through all the tenders and find the one with a specific type.
    self.getTenderByType = function(tenderType) {
        var result = null
        var tender = null
        var tenders = self.system.TENDERS.TENDER
        for (var index = 0; index < tenders.length; index++) {
            tender = tenders[index]
            if (tender.type === tenderType) {
                result = tender
                break;
            }
        }
        return result
    };

    self.getGenericTenderByType = function(genericTenderId) {
        var result = null
        var tender = null
        var tenders = []
        var genericTender = self.system.TENDERS.GENERICTENDER

        //will be one or many so convert to an array
        var isArray = Array.isArray(genericTender)
        if (!isArray) {
            tenders.push(genericTender)
        } else {
            tenders = genericTender
        }

        for (var index = 0; index < tenders.length; index++) {
            tender = tenders[index]
            if (tender.type.toLowerCase() === genericTenderId.toLowerCase()) {
                result = tender
                break;
            }
        }
        return result
    };

    // Return a generic tender (enabled in the payment profile) associated with the given Guest Account Local Type ID...
    self.getGenericTenderByGuestAccountLocalType = function(guestAccountLocalTypeId) {
        var genericTenders = self.system.TENDERS.GENERICTENDER

        var genericTender = null

        if (Array.isArray(genericTenders)) {
            for (var i = 0; i < genericTenders.length; i++) {
                if (genericTenders[i].guestaccountlocaltypeid !== undefined && genericTenders[i].guestaccountlocaltypeid === guestAccountLocalTypeId) {
                    genericTender = genericTenders[i]
                    break;
                }
            }
        } else if (genericTenders !== undefined && genericTenders !== null && genericTenders.guestaccountlocaltypeid === guestAccountLocalTypeId) {
            genericTender = genericTenders
        }

        return genericTender
    };

    // Return a specific property from the tender object.
    self._getPropertyFromTender = function(tender, property) {
        var result = null
        if (tender && tender.hasOwnProperty(property)) {
            result = tender[property]
        }
        return result
    };

    // Check a binary property on the tender object.
    self._checkBinaryProperty = function(tender, property) {
        var result = false
        var propertyValue = self._getPropertyFromTender(tender, property)
        if (propertyValue !== null && propertyValue.toLowerCase() === 'true') {
            result = true
        }
        return result
    };

    // Determine if a tender is tax exempt.
    self.isTenderTaxExempt = function(tender) {
        return self._checkBinaryProperty(tender, 'istaxexempt')
    };

    // Determine the preauth attribute on the tender.
    self.isPreAuthRequired = function(tender) {
        return self._checkBinaryProperty(tender, 'preauth') || self._checkBinaryProperty(tender, 'preauthandpay')
    };

    // Determine the preauthandpay attribute on the tender.
    self.isPreAuthAndPay = function(tender) {
        return self._checkBinaryProperty(tender, 'preauthandpay')
    };

    // Determine if the tender requires authorization.
    self.isValidationRequired = function(tender) {
        return self._checkBinaryProperty(tender, 'validate')
    };

    // Determine if the tender requires authorization.
    self.isKioskValidationRequired = function(tender) {
        return self._checkBinaryProperty(tender, 'kioskvalidate')
    };

    // Determine if the tender is a final tender.
    self.isFinal = function(tender) {
        return self._checkBinaryProperty(tender, 'final')
    };

    // Determine if we are using the full amount.
    self.useFullAmount = function(tender) {
        return true // always use the full amount with UX
            //return self._checkBinaryProperty(tender, "usefullamount");
    };

    // Return the tenders available.
    self.tendersAvailable = function() {
        var result = []

        var paymentProfile = _nex.assets.theme.lastUpdate.THEMES.KIOSK.PAYMENTPROFILE
            // Note: Cases that are not supported yet or tested are currently commented out.
        if (paymentProfile.TENDER.cashflag === 'true') {
            result.push('cash')
        }
        if (paymentProfile.TENDER.compflag === 'true') {
            result.push('comp')
        }
        if (paymentProfile.TENDER.counterflag === 'true') {
            // Counter flag is disabled and cash flag is set to true...
            result.push('counter')
        }
        if (paymentProfile.TENDER.couponflag === 'true') {
            result.push('coupon')
        }
        if (paymentProfile.TENDER.creditflag === 'true') {
            result.push('credit')
        }
        if (paymentProfile.TENDER.debitflag === 'true') {
            result.push('debit')
        }
        if (paymentProfile.TENDER.discountflag === 'true') {
            result.push('discount')
        }
        if (paymentProfile.TENDER.driverflag === 'true') {
            result.push('driver')
        }
        if (paymentProfile.TENDER.employeeflag === 'true') {
            result.push('employee')
        }
        if (paymentProfile.TENDER.loyalty2flag === 'true') {
            result.push('loyalty2')
        }
        if (paymentProfile.TENDER.loyaltyflag === 'true') {
            result.push('loyalty')
        }
        if (paymentProfile.TENDER.roomchargeflag === 'true') {
            result.push('room')
        }

        // push any available generic tenders onto the list of available tenders...
        if (paymentProfile.TENDER.GENERIC) {
            var genericTenders = []
            if (Array.isArray(paymentProfile.TENDER.GENERIC)) {
                genericTenders = paymentProfile.TENDER.GENERIC
            } else {
                genericTenders.push(paymentProfile.TENDER.GENERIC)
            }

            // there is at least 1 generic tender. loop through and add the enabled ones to the stack
            for (var i = 0; i < genericTenders.length; i++) {
                if (genericTenders[i].enabled.toString() === 'true') {
                    result.push(genericTenders[i].paymenttype.toString())
                }
            }
        }

        return result
    };

    // Returns an array of other languages for the KIOSKTEXT if there are any.
    self._getOtherLanguages = function() {
        var otherLanguages = null
        var otherLanguage = '';

        if (self.lastUpdate.THEMES.THEME.KIOSKTEXT.KIOSKTEXT) {
            var childKioskText = self.lastUpdate.THEMES.THEME.KIOSKTEXT.KIOSKTEXT
            var isArray = Array.isArray(childKioskText)

            if (!isArray) {
                // If there is only one alternate language ...
                if (childKioskText.languageid) {
                    otherLanguages = {}
                    otherLanguage = childKioskText.languageid.toLowerCase()
                    otherLanguages[otherLanguage] = childKioskText
                }
            } else {
                // If there is more than one alternate language.
                otherLanguages = {}
                for (var index = 0; index < childKioskText.length; index++) {
                    var otherLanguageElement = childKioskText[index]
                    if (otherLanguageElement.languageid) {
                        otherLanguage = otherLanguageElement.languageid.toLowerCase()
                        if (otherLanguage && otherLanguage.length > 0) {
                            otherLanguages[otherLanguage] = otherLanguageElement
                        }
                    }
                }
            }
        }
        return otherLanguages
    };

    // Get the text object for the specified language.
    self.getLanguageText = function(language, textName) {
        var textObj = null
        if ((self.otherLanguages) &&
            (self.otherLanguages[language]) &&
            (self.otherLanguages[language][textName])) {
            textObj = self.otherLanguages[language][textName]
        }
        return textObj
    };

    // Return the text for another language.
    self.getActiveLanguageText = function(element, attributeName) {
        var text = '';

        if (element !== undefined) {
            if (element.constructor === Array) {
                // mulitple languages exist
                for (var i = 0; i < element.length; i++) {
                    if ((element[i].languageid.toLowerCase() === 'english') &&
                        (text.length === 0)) {
                        text = element[i][attributeName] // load the english version by default
                    } else if (element[i].languageid.toLowerCase() === self.languageSelected.toLowerCase()) {
                        text = element[i][attributeName] // if the selected language exist then use that value
                    }
                }
            } else if (element.hasOwnProperty(attributeName)) { // only one element exists so mulitple languages have not been defined
                text = element[attributeName]
            }
        }
        return text
    };

    self.applyUpdate = function(callback) {
        self.id = self.lastUpdate.THEMES.THEME.id

        self.testMode = (self.lastUpdate.testmode.toLowerCase() == 'true')

        // store the menus/items to be use
        self.dayparts = self.lastUpdate.THEMES.THEME.DAYPARTS.DAYPART
        self.menus = self.lastUpdate.THEMES.THEME.MENUS.MENU
        self.items = self.lastUpdate.THEMES.THEME.ITEMS.ITEM
        self.system = self.lastUpdate.THEMES.THEME.SYSTEM
            //self.times = result.TIME; // TODO - need for NEXTEP Mobile

        // setup button tracking object as soon as the system XML is loaded.
        _nex.utility.buttonTracking = new ButtonTracking(self.system.BUTTONTRACKING)
        _nex.utility.buttonBinder = new ButtonBinder(
            _nex.assets.theme.setButtonText,
            _nex.assets.theme.setControlButtonText,
            _nex.utility.buttonTracking.track,
            _nex.assets.soundManager.playButtonHit)


        self.kioskText = self.lastUpdate.THEMES.THEME.KIOSKTEXT

        // Initialize other languages.
        var alternateLanguages = self._getOtherLanguages()
        if (alternateLanguages !== null) {
            // console.debug("Other languages were returned ... setting them on the theme.");
            self.otherLanguages = alternateLanguages
        }

        self.priceLevels = self.lastUpdate.THEMES.THEME.priceLevels
        self.paymentProfile = self.lastUpdate.THEMES.KIOSK.PAYMENTPROFILE
        self.itemClasses = self.lastUpdate.THEMES.THEME.ITEMCLASSES

        _nex.assets.templateManager = new TemplateManager(self.lastUpdate.THEMES.THEME.TEMPLATES)

        // set limits
        if (self.system.hasOwnProperty('quantitylimit')) {
            self.quantityLimit = Number(self.system.quantitylimit)
        }

        if (self.system.hasOwnProperty('alcohollimit')) {
            self.alcoholLimit = Number(self.system.alcohollimit)
        }

        if (self.system.hasOwnProperty('consolidate')) {
            self.consolidate = (self.system.consolidate.toLowerCase() === 'true')
        }

        if (self.lastUpdate.hasOwnProperty('thememediapath')) {
            self.mediaRootUri = self.lastUpdate.thememediapath
        }

        if (self.lastUpdate.THEMES.KIOSK.hasOwnProperty('splashid')) {
            self.splashid = self.lastUpdate.THEMES.KIOSK.splashid
            if (!self.splashid) {
                self.splashid = 'default'
            }
        }

        if (self.lastUpdate.THEMES.hasOwnProperty('voiceoverflag')) {
            self.voiceoversEnabled = (self.lastUpdate.THEMES.voiceoverflag.toString().toLowerCase() === 'true')
        }

        if (self.lastUpdate.THEMES.KIOSK.hasOwnProperty('splashvoiceover')) {
            self.splashVoiceover = self.lastUpdate.THEMES.KIOSK.splashvoiceover
        }

        // popup need to be loaded before calling the loaded method since popup could be used within the method
        var params = {
            popups: self.lastUpdate.THEMES.THEME.POPUPS,
            theme: this
        }

        _nex.assets.popupManager = new PopupManager(params, function() {
            if ((callback !== undefined) &&
                (callback !== null)) {
                callback()
            }
        })

        self.isUpdateAvailable = false
        self.hasvideo = false
        self.frenabled = false
        self.disablesmsprompt = false

        if (self.lastUpdate.THEMES.KIOSK.hasOwnProperty('hasvideo')) {
            self.hasvideo = self.lastUpdate.THEMES.KIOSK.hasvideo.toLowerCase() === 'true';
        }

        if (self.lastUpdate.THEMES.KIOSK.hasOwnProperty('disablesmsprompt')) {
            self.disablesmsprompt = self.lastUpdate.THEMES.KIOSK.disablesmsprompt.toLowerCase() === 'true';
        }

        if (self.lastUpdate.THEMES.KIOSK.hasOwnProperty('frenabled')) {
            self.frenabled = self.lastUpdate.THEMES.KIOSK.frenabled.toLowerCase() === 'true';
        }

        if (self.lastUpdate.THEMES.KIOSK.hasOwnProperty('loyaltyrequirespaymentdevice')) {
            self.loyaltyrequirespaymentdevice = self.lastUpdate.THEMES.KIOSK.loyaltyrequirespaymentdevice.toLowerCase() === 'true';
        }

        // self.hasFacialRecognition = self.lastUpdate.THEMES.KIOSK.hasFacialRecognition.toLowerCare() === "true";

        // Expose the whole KIOSK object
        self.kiosk = self.lastUpdate.THEMES.KIOSK

        self.itemRank = self.lastUpdate.THEMES.KIOSK.ITEMRANK

        // Remember your order by your face, phone, card, etc.
        if (_nex.assets.theme.kiosk.PAYMENTPROFILE && (!_nex.assets.theme.kiosk.PAYMENTPROFILE.REPEATORDERS)) {
            _nex.assets.theme.kiosk.PAYMENTPROFILE.REPEATORDERS = {
                'phone': 'true',
                'face': 'false',
                'credit': 'true',
                'cancel': 'true'
            }
        }

        // hide/show the cursor
        if (self.system.hasOwnProperty('cursor') && (self.system.cursor.toLowerCase() === 'off')) {
            $('body').addClass('ux-hide-cursor')
        } else {
            $('body').removeClass('ux-hide-cursor')
        }

        // Whether or not we should listen for the navbar to be plugged in.
        var listenForPlugin = false
        if (_nex.assets.theme.lastUpdate.THEMES.THEME.hasOwnProperty('BUMPBAR')) {
            _nex.assets.theme.lastUpdate.THEMES.THEME.BUMPBAR.KEY.forEach(function(item) {
                if (!listenForPlugin) {
                    if (item.hasOwnProperty('event') && item.event.toLowerCase() === 'plugin') {
                        listenForPlugin = true
                            // Initializing the kviReader will start the navbar objects to listen for plugin.
                            // It will not speak until the user has plugged in.
                        _nex.kviReader = new KVIReader(self.lastUpdate.THEMES.THEME)
                        _nex.kviReader.init()
                    }
                }
            })
        }

        // Inject the location id in the body element.
        if (self.lastUpdate.hasOwnProperty('locationid')) {
            $('body').addClass(self.lastUpdate.locationid)
        }
    }

    // Return the hardware type of the device.
    self.getHardwareType = function() {
        var result = '';
        if (_nex.assets.theme.kiosk && _nex.assets.theme.kiosk.hardwaretype) {
            result = _nex.assets.theme.kiosk.hardwaretype
        }
        return result
    };

    // loads site specific media
    // mediaId - is value that will be passed through to the callback so the calling
    // script - (optional) uri of script to load; pass null if there is no script to load
    //  method can identify what media was loaded
    // scriptCallback (optional) - Method to call after the script finishes loading.
    self.loadMedia = function(media, mediaId, scriptUri, callback, scriptCallback) {
        var uri = self.mediaPath() + media

        if (inPreviewer()) {
            uri = '../Media.aspx?media=' + media
                //if (scriptUri) {
                //    scriptUri = "../Media.aspx?media=html/" + scriptUri;
                //}
            console.debug('themeUX.loadMedia() - Loading uri ' + uri)
        }

        // Make the $.ajax call.
        var jxContent = $.ajax({
            'url': uri,
            'dataType': 'html',
            'cache': false
        })

        // This is called when the $.ajax call is complete and succeeded.
        jxContent.done(function(data) {
            // Call the HTML callback since the HTML has finished loading.
            if (callback !== undefined) {
                callback(mediaId, data)
            }

            // If there was a script to load... load it as well.
            // If the callback loaded some HTML, by appending it to a DIV, then the script can access that content now.
            if ((scriptUri !== undefined) &&
                (scriptUri !== null) &&
                (scriptUri !== '')) {
                self.loadScript(scriptUri, scriptCallback)
            }
        })

        // This is called when the $.ajax call is complete but failed. The file probably can't be found at the location specified.
        jxContent.fail(function() {
            // notify calling function that the page is not available to load
            console.error('Failed to load media ' + uri)

            if (callback !== undefined) {
                callback(mediaId, null)
            }
        })
    };

    // Load a JavaScript file.
    self.loadScript = function(scriptUri, scriptCallback) {
        // Use jQuery $.getScript to "Load a JavaScript file from the server using a GET HTTP request, then execute it."
        $.getScript(uriFormatting.scriptUri(scriptUri))
            .done(function(script, textStatus) {
                if (scriptCallback) {
                    scriptCallback()
                }
            })
            .fail(function(jqxhr, settings, exception) {
                // If the script fails to load, give the scriptUri for troubleshooting.
                console.error('Error loading script ' + scriptUri)

                // If the exception object is populated, log it as well for additional details.
                if (exception) {
                    console.error('Exception details: ')
                    console.error(exception)
                }
            })
    };
}
/** 
 * Parent object to all the commands. Implements msgHeader.
 * @constructor 
 */
_nex.commands._BaseRequest = function() {
    // NOTE:  This code matches what is in nextep.common.js.
    // It is left here for now because commands like ADDTENDER rely on it being in a certain build order.

    var self = this
    self.name = '';
    self.msgHeader = function() {
        var header = {}

        if (_nex.context !== 'UX') {
            header.authcode = _iorderfast.authToken.code
        }

        header.name = this.name

        if (_nex.context !== 'UX') {
            header.locationid = _iorderfast.loc.id
        }

        header[this.name] = {}

        return header
    };

    self.write = function() {}
};
// Following along with AddToOrderCmd.
_nex.commands.AddSMSToOrder = function(orderId, smsNumber) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self._orderId = orderId || '';
    self._smsNumber = smsNumber || '';
    self.name = 'ADDSMSTOORDER';

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'orderid': self._orderId,
            'smsnumber': self._smsNumber
        }
        return msg
    };
}
_nex.commands.AddSMSToOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype)
    // Following along with AddToOrderCmd.
_nex.commands.AddTender = function(type, tenderSpecific) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.type = type || '';
    self.tenderSpecific = tenderSpecific || {}

    self.name = 'ADDTENDER';

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'type': self.type,
            'tenderSpecific': self.tenderSpecific
        }
        return msg
    };
}
_nex.commands.AddTender.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.AddWeight = function(posid, weight, uom) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'ADDWEIGHT';
    self.posid = posid
    self.weight = weight
    self.weight = uom

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'posid': posid,
            'weight': weight,
            'uom': uom
        }

        return msg
    };
}
_nex.commands.AddWeight.prototype = Object.create(_nex.commands._BaseRequest.prototype)

/** 
 * Calculates all the totals for UX overrides commonJS version (taxes, fees, sub-totals, grand-totals).
 * @constructor 
 */

_nex.commands.CalculateTotal = function(order) {
    _nex.commands._BaseRequest.call(this)

    var self = this

    self.name = 'CALCULATETOTAL';
    self.subtotal = order.totals.subtotal().replace('$', '')
    self.togo = order.togo.toString()
    self.roundUpCharitySelected = order.roundUpCharitySelected.toString()

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'togo': self.togo,
            'subtotal': self.subtotal,
            'roundupcharityselected': self.roundUpCharitySelected,
            'sendtoserver': 'true'
        }

        return msg
    };
}
_nex.commands.CalculateTotal.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.CouponInquiry = function(couponNumber) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'COUPONINQUIRY';
    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'locationid': _nex.assets.theme.system.storeid, // send the 8 character location id for this command
            'couponnumber': couponNumber
        }
        console.debug(msg)
        return msg
    };
}
_nex.commands.CouponInquiry.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.CreateOrder = function(hasvideo, frenabled) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'CREATEORDER';

    self.hasvideo = false
    if (hasvideo) {
        self.hasvideo = true
    }

    self.frenabled = false
    if (frenabled) {
        self.frenabled = true
    }

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'hasvideo': self.hasvideo,
            'frenabled': self.frenabled
        }

        return msg
    };
}
_nex.commands.CreateOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.DeviceLookup = function(lookupType) {
    _nex.commands._BaseRequest.call(this)
    var self = this
    self._lookupType = '';
    self.name = 'DEVICELOOKUP';

    if (lookupType) {
        self._lookupType = lookupType
    }

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'lookuptype': self._lookupType
        }

        return msg
    };
}
_nex.commands.DeviceLookup.prototype = Object.create(_nex.commands._BaseRequest.prototype)

_nex.commands.EmployeeInquiry = function(employeeNumber, employeePin) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'EMPLOYEEINQUIRY';
    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'employeenumber': employeeNumber,
            'userdata': employeePin
        }
        console.debug(msg)
        return msg
    };
}
_nex.commands.EmployeeInquiry.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.EmployeeSecurityCheck = function(pin, capability) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'EMPLOYEESECURITYCHECK';
    self.pin = pin
    self.capability = capability
    self.capabilities = {
        'SwitchApplication': 23
    }

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'pin': self.pin,
            'capability': self.capabilities[self.capability]
        }

        return msg
    };
}
_nex.commands.EmployeeSecurityCheck.prototype = Object.create(_nex.commands._BaseRequest.prototype)

_nex.commands.EnableScale = function(enabled) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'ENABLESCALE';
    self.enabled = enabled

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'enabled': enabled
        }

        return msg
    };
}
_nex.commands.EnableScale.prototype = Object.create(_nex.commands._BaseRequest.prototype)

// called to make a generic tender inquiry lookup
_nex.commands.GenericInquiry = function(accountNumber, pin, paymentTypeId, guestAccountLocalTypeId) {
    // Constructor logic.
    var self = this

    _nex.commands._BaseRequest.call(self)


    self._guestAccountLocalTypeId = '';
    self._accountNumber = '';
    self._pin = '';
    self._paymentTypeId = '';

    if (guestAccountLocalTypeId) {
        self._guestAccountLocalTypeId = guestAccountLocalTypeId
    }
    if (accountNumber) {
        self._accountNumber = accountNumber
    }
    if (pin) {
        self._pin = pin
    }
    if (paymentTypeId) {
        self._paymentTypeId = paymentTypeId
    }

    self.name = 'GENERICINQUIRY';

    // Write method.
    self.write = function() {
        var msg = self.msgHeader()

        msg[self.name] = {
            'guestaccountlocaltypeid': self._guestAccountLocalTypeId,
            'accountnumber': self._accountNumber,
            'pin': self._pin,
            'paymenttypeid': self._paymentTypeId
        }
        return msg
    };
}
_nex.commands.CreateOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.ItemLookup = function(lookupField, lookupValue) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'ITEMLOOKUP';
    self.lookupField = lookupField
    self.lookupValue = lookupValue

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'lookupfield': lookupField,
            'lookupvalue': lookupValue
        }

        return msg
    };
}
_nex.commands.ItemLookup.prototype = Object.create(_nex.commands._BaseRequest.prototype)

_nex.commands.KioskStatus = function(status) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'KIOSKSTATUS';
    self.status = status
    if (!self.status) {
        console.log('ERROR! Did not specify a valid status for KioskStatus command.')
    }

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {

            'pcstatus': self.status // TODO  (ThemeManager.KioskXml.@pcprefstatus == "PrinterError") ? ThemeManager.KioskXml.@pcprefstatus : MovieManager.CurrentStatus;
        }

        return msg
    };
}
_nex.commands.KioskStatus.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.MenuStackReset = function() {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'MENUSTACKRESET'

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {}
        return msg
    };
}
_nex.commands.MenuStackReset.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.OrderLookup = function(orderDate, searchType, searchTerm, updateOrderTime) {
    var self = this

    _nex.commands._BaseRequest.call(self)
    self.name = 'ORDERLOOKUP'

    self._orderDate = '';
    self._searchType = '';
    self._searchTerm = '';
    self._updateOrderTime = false

    if (orderDate) {
        self._orderDate = new Date(orderDate)
    }

    if (searchType) {
        self._searchType = searchType
    }

    if (searchTerm) {
        self._searchTerm = searchTerm
    }

    if (updateOrderTime) {
        self._updateOrderTime = updateOrderTime
    }

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
                'orderdate': self._orderDate,
                'searchtype': self._searchType,
                'searchterm': self._searchTerm,
                'updateordertime': self._updateOrderTime
            }
            // console.debug(msg);
        return msg
    };
}
_nex.commands.OrderLookup.prototype = Object.create(_nex.commands._BaseRequest.prototype)


_nex.commands.OrderUsage = function() {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'ORDERUSAGE';

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'BUTTONUSAGE': _nex.utility.buttonTracking.writeButtonUsage()
        }
        return msg
    };
}
_nex.commands.OrderUsage.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.Preamble = function() {
    _nex.commands._BaseRequest.call(this) // calls the constructor of the parent class

    var self = this
    self.name = 'PREAMBLE';
    self.pcstatus = 'Offline';

    self.setStatus = function(status) {
        self.pcstatus = status
    };

    self.write = function() {
        var msg = self.msgHeader()

        msg[self.name] = {
            'pcstatus': self.pcstatus
        }
        return msg
    };
}
_nex.commands.Preamble.prototype = Object.create(_nex.commands._BaseRequest.prototype)
    // Update the order to reflect the amount that has been charged for loyalty.
_nex.commands.ProcessLoyalty = function(tender, amount) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'PROCESSLOYALTY';
    self.tender = '';
    if (tender) {
        self.tender = tender
    }
    self.amount = '';
    if (amount) {
        self.amount = amount
    }
    // Write the message.
    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'amounttocharge': self.amount,
            'TENDER': self.tender.write()
        }
        return msg
    };
}
_nex.commands.ProcessLoyalty.prototype = Object.create(_nex.commands._BaseRequest.prototype)
    // Note: A final tender object can be passed in along with process order, but is not required.
_nex.commands.ProcessOrder = function(order, finalTenderObject) {
    // Try and get any data from the pagerpad and namepad if applicable.
    try {
        if (_nex.keyboard.pagerpad.data) {
            _nex.orderManager.currentOrder.customer.pagernumber = _nex.keyboard.pagerpad.data
        }
        if (_nex.keyboard.namepad.data) {
            _nex.orderManager.currentOrder.customer.name = _nex.keyboard.namepad.data
            if (_nex.orderManager.currentOrder.customer.name.length > 0) {
                var res = _nex.orderManager.currentOrder.customer.name.split(' ')
                if (res.length > 0) {
                    _nex.orderManager.currentOrder.customer.firstname = res[0]
                    if (res.length > 1) {
                        _nex.orderManager.currentOrder.customer.lastname = res[1]
                    }
                }
            }
        }
    } catch (err) {
        console.log('Error in ProcessOrder trying to set the pager number' + err.message)
    }
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'PROCESSORDER';
    self.customerName = _nex.orderManager.currentOrder.customer.name
    self.customerPagerNumber = _nex.orderManager.currentOrder.customer.pagernumber
    self.customerFirstName = _nex.orderManager.currentOrder.customer.firstname
    self.customerLastName = _nex.orderManager.currentOrder.customer.lastname
        // Set the smsNumber for previous order lookup in the future.
    if (order && order.smsNumber) {
        self.smsNumber = order.smsNumber
    } else {
        self.smsNumber = '';
    }

    // Try to extract out any final tender data if there is any.
    if (finalTenderObject) {
        if (!finalTenderObject.write) {
            console.log('ERROR: Could not find a write method on the final tender object given!')
        } else {
            var tenderData = finalTenderObject.write()
            if (tenderData) {
                self.tenderSpecific = tenderData
            }
        }
    }

    // If we were unable to extract the data, just set it to empty string.
    if (!self.tenderSpecific) {
        self.tenderSpecific = '';
    }
    self.nutritionData = {}
    if (_nex.nutritionData) {
        self.nutritionData = _nex.nutritionData
    }

    // Write the message.
    self.write = function() {
        /// *jshint -W087 */
        // debugger;
        var msg = self.msgHeader()
        msg[self.name] = {
            'smsnumber': self.smsNumber,
            'ordertype': _nex.orderManager.currentOrder.ordertype,
            'FINALTENDER': self.tenderSpecific,
            'NUTRITIONINFO': self.nutritionData,
            'CUSTOMER': {
                'email': self.customerEmail,
                'customerName': self.customerName,
                'customerPagerNumber': self.customerPagerNumber,
                'customerFirstName': self.customerFirstName,
                'customerLastName': self.customerLastName
            }
        }


        return msg
    };
}
_nex.commands.ProcessOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.ProcessPrint = function(order) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'PROCESSPRINT';
    self.customerEmail = order.customer.email
    self.receiptFormat = order.receiptFormat
    self.smsNumber = _nex.orderManager.currentOrder.smsNumber

    self.nutritionData = {}
    if (_nex.nutritionData) {
        self.nutritionData = _nex.nutritionData
    }

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'receiptemail': self.customerEmail,
            'receiptformat': self.receiptFormat,
            'CUSTOMER': {
                'email': self.customerEmail,
                'phone': self.smsNumber,
                'smsnumber': self.smsNumber
            },
            'NUTRITIONINFO': self.nutritionData
        }

        return msg
    };
}
_nex.commands.ProcessPrint.prototype = Object.create(_nex.commands._BaseRequest.prototype)
    // Update the order to reflect the amount that has been charged to this tender
_nex.commands.ProcessTender = function(tender, amount, discountid) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'PROCESSTENDER';
    self.tender = '';
    if (tender) {
        self.tender = tender
    }
    self.amount = '';
    if (amount) {
        self.amount = amount
    }
    self.discountid = '';
    if (discountid) {
        self.discountid = discountid
    }
    // Write the message.
    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'amounttocharge': self.amount,
            'discountid': self.discountid,
            'TENDER': self.tender.write()
        }
        return msg
    };
}
_nex.commands.ProcessTender.prototype = Object.create(_nex.commands._BaseRequest.prototype)
    // removes the last tender on the tender stack
_nex.commands.RemoveTender = function() {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'REMOVETENDER';

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {}
        return msg
    };
}
_nex.commands.RemoveTender.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.RequestRepeatOrders = function(lookup) {
    var self = this
    _nex.commands._BaseRequest.call(self)

    self.name = 'REQUESTPREVIOUSORDERS';
    self._lookup = lookup

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'lookuptype': self._lookup.lookupType,
            'lookupvalue': self._lookup.lookupValue
        }

        if (self._lookup.lookupXML !== null) {
            msg[self.name].LOOKUPVALUES = self._lookup.lookupXML
        }

        console.debug('RequestPreviousOrders2', 'returning msg', msg)
        return msg
    };
}
_nex.commands.RequestRepeatOrders.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.SavePreviousOrder = function(orderId, phoneNumber, lookup) {
    var self = this
    _nex.commands._BaseRequest.call(self)

    self.name = 'SAVEPREVIOUSORDER';
    self._orderId = orderId || '';
    self._smsNumber = phoneNumber || '';
    self._lookup = lookup

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'orderid': self._orderId,
            'smsnumber': self._smsNumber,
            'LOOKUP': {
                'type': self._lookup.lookupType,
                'value': self._lookup.lookupValue
            }
        }

        if (self._lookup.lookupXML !== null) {
            msg[self.name].LOOKUP.LOOKUPVALUES = self._lookup.lookupXML
        }

        return msg
    };
}
_nex.commands.SavePreviousOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.SwitchApplication = function(launch) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'SWITCHAPPLICATION';
    self.launch = launch

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'launch': launch
        }

        return msg
    };
}
_nex.commands.SwitchApplication.prototype = Object.create(_nex.commands._BaseRequest.prototype)

_nex.commands.UpdateTender = function(paid) {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.paid = paid
    if (!self.paid) {
        self.paid = false
    }

    self.name = 'UPDATEORDERTENDER';

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'paid': self.paid
        }
        return msg
    };
}
_nex.commands.UpdateTender.prototype = Object.create(_nex.commands._BaseRequest.prototype)
    // Flip between dots and grid.
_nex.commands.VideoFeedDots = function(dots) {
    _nex.commands._BaseRequest.call(this)
    var self = this
    self.name = 'VIDEOFEEDDOTS';
    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            dots: dots
        }
        return msg
    };
}
_nex.commands.VideoFeedDots.prototype = Object.create(_nex.commands._BaseRequest.prototype)
    // Freezes the local display of the video feed.
_nex.commands.VideoFeedFlash = function() {
    _nex.commands._BaseRequest.call(this)
    var self = this
    self.name = 'VIDEOFEEDFLASH';
    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            test: 'test'
        }
        return msg
    };
}
_nex.commands.VideoFeedFlash.prototype = Object.create(_nex.commands._BaseRequest.prototype)
    // Freezes the local display of the video feed.
_nex.commands.VideoFeedFreeze = function() {
    _nex.commands._BaseRequest.call(this)
    var self = this
    self.name = 'VIDEOFEEDFREEZE';
    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            test: 'test'
        }
        return msg
    };
}
_nex.commands.VideoFeedFreeze.prototype = Object.create(_nex.commands._BaseRequest.prototype)
    // Change the loop timing. 0 puts no gap between loops.
_nex.commands.VideoFeedLoop = function(looptime) {
    _nex.commands._BaseRequest.call(this)
    var self = this
    self.name = 'VIDEOFEEDLOOP';
    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'looptime': looptime
        }
        return msg
    };
}
_nex.commands.VideoFeedLoop.prototype = Object.create(_nex.commands._BaseRequest.prototype)

// Change the video feed loop default timing. 0 puts no gap between loops.
_nex.commands.VideoFeedLoopDefault = function() {
    _nex.commands._BaseRequest.call(this)
    var self = this
    self.name = 'VIDEOFEEDLOOPDEFAULT';
    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'looptime': looptime
        }
        return msg
    };
}
_nex.commands.VideoFeedLoopDefault.prototype = Object.create(_nex.commands._BaseRequest.prototype)
    // Queue up a 'flash' effect when it gets your picture.
_nex.commands.VideoFeedQueueFlash = function() {
    _nex.commands._BaseRequest.call(this)
    var self = this
    self.name = 'VIDEOFEEDQUEUEFLASH';
    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {}
        return msg
    };
}
_nex.commands.VideoFeedQueueFlash.prototype = Object.create(_nex.commands._BaseRequest.prototype)
    // Unfreezes the local display of the video feed.
_nex.commands.VideoFeedThaw = function() {
    _nex.commands._BaseRequest.call(this)
    var self = this
    self.name = 'VIDEOFEEDTHAW';
    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            test: 'test'
        }
        return msg
    };
}
_nex.commands.VideoFeedThaw.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.WaitForPayment = function() {
    _nex.commands._BaseRequest.call(this)

    var self = this
    self.name = 'WAITFORPAYMENT'

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            // "POSIDS": self.posids
        }
        return msg
    };
}
_nex.commands.WaitForPayment.prototype = Object.create(_nex.commands._BaseRequest.prototype)
_nex.commands.WriteToLog = function(message) {
    _nex.commands._BaseRequest.call(this)

    // constant for now
    var DEBUG_LOG_LEVEL = 2

    // properties
    var self = this
    self.name = 'WRITETOLOG';

    // Default to a log level of debug.
    self.logLevel = DEBUG_LOG_LEVEL

    // Default the message to what the user specifies.
    self.message = message

    self.setLogLevel = function(newLevel) {
        self.logLevel = newLevel
    };

    self.setMessage = function(message) {
        var newMessage = '';
        if (typeof message === 'string') {
            newMessage = message
        }
        self.message = newMessage
    };

    self.write = function() {
        var msg = self.msgHeader()
        msg[self.name] = {
            'message': self.message,
            'loglevel': self.logLevel // Without a log level it will fail.
        }
        return msg
    };
}
_nex.commands.WriteToLog.prototype = Object.create(_nex.commands._BaseRequest.prototype)

function Keypad() {
    var self = this

    // Data buffer.
    self.data = '';

    // Whether or not the shift key is pressed.
    self.shift = false

    // Whether or not capslock is on.
    self.capslock = false

    // call to set the text that is entered
    self.updateText = function(text) {
        self._updateOutput(text)
        self.data = text
    };

    // Used for tabbing through keys when in visually impaired mode.
    self.setKVI = function() {
        $('#keyboard li.letter').attr('tabindex', '1')
        $('#keyboard li span').attr('tabindex', '1')
        _nex.domFocus.cycleFocus()
    };

    // Update the output.
    self._updateOutput = function(newContent) {
        // Update the output.
        self.write.html(newContent)
    };

    // Mask out certain characters on the keyboard.
    self._mask = function(value) {
        var result = value
        var re = new RegExp('[a-zA-Z0-9]') // letters and numbers
        if (re.test(value)) {
            result = '*';
        }
        return result
    };

    // Call to setup keyboard bindings.
    self.bindKeys = function() {
        // The output(s).
        self.write = $('.write')

        // Clear out old data.
        self.write.html('')
        self.data = '';
        self._updateOutput('')

        //override default email domain keys
        var emaildomain1 = _nex.assets.theme.system.USERINTERFACE.EMAILDOMAIN.value1
        var emaildomain2 = _nex.assets.theme.system.USERINTERFACE.EMAILDOMAIN.value2
        var emaildomain3 = _nex.assets.theme.system.USERINTERFACE.EMAILDOMAIN.value3


        if (_nex.assets.theme.system.USERINTERFACE.EMAILDOMAIN !== undefined && _nex.assets.theme.system.USERINTERFACE.EMAILDOMAIN !== '') {
            if (emaildomain1 !== undefined && emaildomain1 !== '') {
                $('#emaildomain1').text(emaildomain1)
            }

            if (emaildomain2 !== undefined && emaildomain2 !== '') {
                $('#emaildomain2').text(emaildomain2)
            }

            if (emaildomain3 !== undefined && emaildomain3 !== '') {
                $('#emaildomain3').text(emaildomain3)
            }
        }

        // Remove previously attached event listeners.
        $('#keyboard li').unbind()

        $('#keyboard li').click(function() {
            // At this point, the 'this' object is set to the element being clicked.
            // "The jQuery function $ and many of the jQuery methods like click and animate return a jQuery object, which is part object and part array."
            var $this = $(this)

            // Get the character that was pressed.
            var character = $this.html() // If it's a lowercase letter, nothing happens to this variable

            // Shift keys
            if ($this.hasClass('left-shift') || $this.hasClass('right-shift')) {
                $('.letter').toggleClass('uppercase')
                $('.symbol span').toggle()

                self.shift = self.shift !== true;
                self.capslock = false

                // Track the click.
                _nex.utility.buttonTracking.track('', '[shift]', '', 'keyboard', 'control')
                return false
            }

            // Caps lock
            if ($this.hasClass('capslock')) {
                $('.letter').toggleClass('uppercase')
                self.capslock = true
                _nex.utility.buttonTracking.track('', '[capslock]', '', 'keyboard', 'control')
                return false
            }

            // Delete
            if ($this.hasClass('delete')) {
                self.data = self.data.substr(0, self.data.length - 1)
                self.write.html(self.data)
                    //self.write.html(html.substr(0, html.length - 1));
                _nex.utility.buttonTracking.track('', '[delete]', '', 'keyboard', 'control')
                return false
            }

            // Special characters
            if ($this.hasClass('symbol')) character = $('span:visible', $this).html()
            if ($this.hasClass('space')) character = ' '
            if ($this.hasClass('tab')) character = '\t';
            if ($this.hasClass('return')) character = '\n';

            // Uppercase letter
            if ($this.hasClass('uppercase')) character = character.toUpperCase()

            // Remove shift once a key is clicked.
            if (self.shift === true) {
                $('.symbol span').toggle()
                    // if caps lock is not un
                if (self.capslock === false) {
                    // make the characters upper-case
                    $('.letter').toggleClass('uppercase')
                }
                // set shift back to false
                self.shift = false
            }

            // Track the character... masking out certain ones.
            _nex.utility.buttonTracking.track('', self._mask(character), '', 'keyboard', 'control')

            // Add the character to our self.data buffer
            self.data += character

            // Update the output
            self._updateOutput(self.data)
        })
    };
}

function Namepad() {
    var self = this

    self._minLength = 1
    self._maxLength = 50
    self._popup = null

    // Data buffer.
    self.data = '';

    // Whether or not the shift key is pressed.
    self.shift = false

    // Whether or not capslock is on.
    self.capslock = true

    // call to set the text that is entered
    self.updateText = function(text) {
        self._updateOutput(text)
        self.data = text
    };

    // Update the output.
    self._updateOutput = function(newContent) {
        // Update the output.
        self.write.html(newContent)
    };

    self.setPopup = function(popup) {
        self.write = $('.write')
        self._updateOutput('')
        self._popup = popup
    };

    // Mask out certain characters on the keyboard.
    self._mask = function(value) {
        var result = value
        var re = new RegExp('[a-zA-Z0-9]') // letters and numbers
        if (re.test(value)) {
            result = '*';
        }
        return result
    };

    // Call to setup keyboard bindings.
    self.bindKeys = function() {
        // The output(s).
        self.write = $('.write')
        $('#pagernum').html('')
            // Clear out old data.
        self.write.html('')
        self.data = '';
        self._updateOutput('')

        self._isValid(self.data)

        // Remove previously attached event listeners.
        $('#keyboard li').unbind()

        $('#keyboard li').click(function() {
            // At this point, the 'this' object is set to the element being clicked.
            // "The jQuery function $ and many of the jQuery methods like click and animate return a jQuery object, which is part object and part array."
            var $this = $(this)

            // Get the character that was pressed.
            var character = $this.html() // If it's a lowercase letter, nothing happens to this variable

            // Shift keys
            if ($this.hasClass('left-shift') || $this.hasClass('right-shift')) {
                $('.letter').toggleClass('uppercase')
                $('.symbol span').toggle()

                self.shift = self.shift !== true;
                self.capslock = false

                // Track the click.
                _nex.utility.buttonTracking.track('', '[shift]', '', 'keyboard', 'control')
                return false
            }

            // Caps lock
            if ($this.hasClass('capslock')) {
                $('.letter').toggleClass('uppercase')
                self.capslock = true
                _nex.utility.buttonTracking.track('', '[capslock]', '', 'keyboard', 'control')
                return false
            }

            // Delete
            if ($this.hasClass('delete')) {
                self.data = self.data.substr(0, self.data.length - 1)
                self.write.html(self.data)
                self._isValid(self.data)
                    //self.write.html(html.substr(0, html.length - 1));
                _nex.utility.buttonTracking.track('', '[delete]', '', 'keyboard', 'control')
                return false
            }

            // Special characters
            if ($this.hasClass('symbol')) character = $('span:visible', $this).html()
            if ($this.hasClass('space')) character = ' '
            if ($this.hasClass('tab')) character = '\t';
            if ($this.hasClass('return')) character = '\n';

            // Uppercase letter
            if ($this.hasClass('uppercase')) character = character.toUpperCase()

            // Remove shift once a key is clicked.
            if (self.shift === true) {
                $('.symbol span').toggle()
                    // if caps lock is not un
                if (self.capslock === false) {
                    // make the characters upper-case
                    $('.letter').toggleClass('uppercase')
                }
                // set shift back to false
                self.shift = false
            }

            // Track the character... masking out certain ones.
            _nex.utility.buttonTracking.track('', self._mask(character), '', 'keyboard', 'control')

            // Add the character to our self.data buffer
            self.data += character

            // Update the output
            self._updateOutput(self.data)

            self._isValid(self.data)
        })
    };

    self._isValid = function(value) {
        var valid = true

        var elementId = self._popup.name
            // Use jQuery to get and hide the element.
        var $element = $('#' + elementId)
        for (var i = 0; i < self._popup.buttons.length; i++) {
            if (self._popup.buttons[i].id.toLowerCase() === 'ok') {
                $element.find('#' + self._popup.buttons[i].id).prop('disabled', false)
            }
        }

        if ((self._minLength > 0) &&
            (self._maxLength > 0)) {
            valid = ((value.length >= self._minLength) && (value.length <= self._maxLength))

            if (!valid) {
                for (i = 0; i < self._popup.buttons.length; i++) {
                    if (self._popup.buttons[i].id.toLowerCase() === 'ok') {
                        $element.find('#' + self._popup.buttons[i].id).prop('disabled', true)
                    }
                }
            }
        }

        return valid
    };

    self.setMinLength = function(newlength) {
        self._minLength = newlength || 1
        if (self._minLength === 0) {
            self._minLength = 1
        }
    }

    self.setMaxLength = function(newlength) {
        self._maxLength = newlength || 50
        if (self._maxLength === 0) {
            self._maxLength = 50
        }
    }
}

function Numpad() {
    var self = this

    // Maximum data length we will accept.
    self.MAX_LENGTH = 20
    self._maxValue = -1

    // Keep a data buffer.
    self.data = '';
    self._popup = null

    // Update the output box.
    self._updateOutput = function(newContent) {
        // Update the output textbox.
        self.write.val(newContent)
    };

    self.setPopup = function(popup) {
        self.write = $('.numpadTextOut')
        self._updateOutput('')
        self._popup = popup
    };

    // Mask out the number pad values so pins aren't captured in ORDERUSAGE.
    self._mask = function(value) {
        var result = value
        switch (value) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                result = '*';
                break
        }
        return result
    };

    // Bind the keys.
    self.bindKeys = function() {
        // Anything with a class of numpadTextOut will get written to.
        self.write = $('.numpadTextOut')

        // Clear out old data.
        self.write.html('')
        self.data = '';
        self._updateOutput('')

        // Remove previously attached event listeners.
        $('#numpadInput li').unbind()

        // Whenever one of the keys is clicked ...
        $('#numpadInput li').click(function() {
            // Get a jQuery object for the element that was clicked.
            var $this = $(this)

            // Get the character from the element that was clicked.
            var character = $this.html()

            // At this point, the character includes the span. 
            // Parse out the character from the span.
            if ($this.hasClass('symbol')) {
                character = $('span:visible', $this).html()
            }

            // Track the click.
            _nex.utility.buttonTracking.track('', self._mask(character), '', 'numpad', 'control')

            // Check if it was the delete key that was pressed ...
            if ($this.hasClass('delete')) {
                self.data = self.data.substr(0, self.data.length - 1)
            } else {
                if (self.isNotMaxLength(self.data.length)) {
                    self.data += character
                }
            }
            self._updateOutput(self.data)

            if ((self.data.length === self.MAX_LENGTH) &&
                (self._popup !== null)) {
                var elementId = self._popup.name
                    // Use jQuery to get and hide the element.
                var $element = $('#' + elementId)
                $element.find('#' + self._popup.buttons[0].id).trigger('click')
            }
        })

    };

    // if there is a maxlength attribute on the pinpad input field.  
    // Use it otherwise check for MAX_LENGTH constant.
    self.isNotMaxLength = function(numLength) {
        var maxLength = $('div.numpadOutput input[maxlength]').attr('maxlength')

        if (maxLength === undefined) {
            return numLength <= self.MAX_LENGTH
        } else {
            var numpadVal = $('div.numpadOutput input[maxlength]').val()
            return numpadVal.length <= maxLength
        }
    }

    self.setMaxLength = function(newlength) {
        self.MAX_LENGTH = newlength || 3
        if (self.MAX_LENGTH === 0) {
            self.MAX_LENGTH = 3
        }
    }
}

function Pagerpad() {
    var self = this

    // Maximum data length we will accept.
    self.MAX_LENGTH = 3
    self._minValue = -1
    self._maxValue = -1

    // Keep a data buffer.
    self.data = '';
    self._popup = null

    // Update the output box.
    self._updateOutput = function(newContent) {
        // Update the output textbox.
        self.write.val(newContent)
    };

    self.setPopup = function(popup) {
        self.write = $('.pagerpadTextOut')
        self._updateOutput('')
        self._popup = popup
    };

    // Mask out the number pad values so pins aren't captured in ORDERUSAGE.
    self._mask = function(value) {
        var result = value
        switch (value) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                result = '*';
                break
        }
        return result
    };

    // Bind the keys.
    self.bindKeys = function() {
        // Anything with a class of numpadTextOut will get written to.
        self.write = $('.pagerpadTextOut')
        $('#pagernum').html('')
            // Clear out old data.
        self.write.html('')
        self.data = '';
        self._updateOutput('')

        self._isValid(self.data)

        // Remove previously attached event listeners.
        $('#numpadInput li').unbind()

        // Whenever one of the keys is clicked ...
        $('#numpadInput li').click(function() {
            // Get a jQuery object for the element that was clicked.
            var $this = $(this)

            // Get the character from the element that was clicked.
            var character = $this.html()

            // At this point, the character includes the span.
            // Parse out the character from the span.
            if ($this.hasClass('symbol')) {
                character = $('span:visible', $this).html()
            }

            // Track the click.
            _nex.utility.buttonTracking.track('', self._mask(character), '', 'numpad', 'control')

            // Check if it was the delete key that was pressed ...
            if ($this.hasClass('delete')) {
                self.data = self.data.substr(0, self.data.length - 1)
            } else {
                if (self.data.length < self.MAX_LENGTH) {
                    self.data += character
                }
            }
            self._updateOutput(self.data)

            var valid = self._isValid(self.data)

            if (valid &&
                (self.data.length === self.MAX_LENGTH) &&
                (self._popup !== null)) {
                var elementId = self._popup.name
                    // Use jQuery to get and hide the element.
                var $element = $('#' + elementId)
                $element.find('#' + self._popup.buttons[0].id).trigger('click')
            }
        })
    };

    self._isValid = function(value) {
        value = (isNaN(value)) ? -1 : Number(value)
        var valid = true

        var elementId = self._popup.name
            // Use jQuery to get and hide the element.
        var $element = $('#' + elementId)
        for (var i = 0; i < self._popup.buttons.length; i++) {
            if (self._popup.buttons[i].id.toLowerCase() === 'ok') {
                $element.find('#' + self._popup.buttons[i].id).prop('disabled', false)
            }
        }

        if ((self._minValue > 0) &&
            (self._maxValue > 0)) {
            valid = ((value >= self._minValue) && (value <= self._maxValue))

            if (!valid) {
                for (i = 0; i < self._popup.buttons.length; i++) {
                    if (self._popup.buttons[i].id.toLowerCase() === 'ok') {
                        $element.find('#' + self._popup.buttons[i].id).prop('disabled', true)
                    }
                }
            }
        }

        return valid
    };

    self.setMaxLength = function(newlength) {
        self.MAX_LENGTH = newlength || 3
        if (self.MAX_LENGTH === 0) {
            self.MAX_LENGTH = 3
        }
    }
    self.setMinValue = function(minValue) {
        self._minValue = minValue || -1
    };

    self.setMaxValue = function(maxValue) {
        self._maxValue = maxValue || -1
    };
}

function Phonepad(soundManager) {
    var self = this

    // Keep a data buffer.
    self.data = '';

    // Max length of the data buffer.
    self.MAXLENGTH = 10

    // Callback when the last digit is found.
    self._lastDigitCallback = null

    // Callback when a single digit is entered. Good for resetting timers.
    self._digitEnteredCallback = null

    // Sound manager.
    self._soundManager = soundManager
    if (!self._soundManager) {
        console.log('Missing required parameter sound manager to Phonepad.')
    }

    // Update 3 text boxes to show a 10 digit phone number.
    self._updatePhoneNumber = function() {
        var input1 = '';
        var input2 = '';
        var input3 = '';
        var elementId1 = 'phone1';
        var elementId2 = 'phone2';
        var elementId3 = 'phone3';
        for (var index = 0; index < self.data.length; index++) {
            var digit = self.data[index]

            if (input1.length < 3) {
                // Put the first 3 characters in the first input.
                input1 += digit
            } else if (input2.length < 3) {
                // Put the next 3 characters in the next.
                input2 += digit
            } else {
                // Put the final 4 at the end.
                input3 += digit
            }
        }
        document.getElementById(elementId1).value = input1
        document.getElementById(elementId2).value = input2
        document.getElementById(elementId3).value = input3
    };

    // Update page elements that show output.
    self._updateOutput = function(newContent) {
        // Update the output textbox.
        self.write.val(newContent)

        // Update the phone number.
        self._updatePhoneNumber()
    };

    // Play a sound.
    self._playSound = function(character) {
        var number = Number(character)

        if (number >= 0) {
            if (self._soundManager && self._soundManager.playSoundByIndex) {
                // console.debug("Playing sound for number " + number);
                self._soundManager.playSoundByIndex(number)
            } else {
                // console.debug("Cannot play sound. Sound manager is not setup.");
            }
        }
    }

    // Mask out the phone number.
    self._mask = function(value) {
        var result = value
        switch (value) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                console.debug('masking number')
                result = '*';
                break
        }
        return result
    };

    // Call this right after showing the popup.
    self.bindKeys = function(lastDigitCallback, digitEnteredCallback) {
        // This callback will be called when the last found digit is found.
        self._lastDigitCallback = lastDigitCallback

        // This callback will be called when a single digit is entered.
        self._digitEnteredCallback = digitEnteredCallback

        // Anything with a class of numpadTextOut will get written to.
        self.write = $('.numpadTextOut')

        // Clear out old data.
        self.write.html('')
        self.data = '';
        self._updateOutput('')

        // Remove previously attached event listeners.
        $('#phonepadInput li').unbind()

        // Whenever one of the keys is clicked ...
        $('#phonepadInput li').click(function() {
            // Get a jQuery object for the element that was clicked.
            var $this = $(this)

            // Get the character from the element that was clicked.
            var character = $this.html()

            // At this point, the character includes the span. 
            // Parse out the character from the span.
            if ($this.hasClass('symbol')) {
                character = $('span', $this).html()
            }

            // Check if it was the delete key that was pressed ...
            if ($this.hasClass('delete')) {
                self.data = self.data.substr(0, self.data.length - 1)
            } else {
                if (self.data.length < self.MAXLENGTH) {
                    self.data += character
                }
            }

            // There was a usability issue where the numbers wouldn't appear right after you click
            // the phonepad buttons sometimes. Adding this timeout causes the browser to do
            // a DOM refresh right after the button is pressed, and the data is updated, so the
            // user can see the output updated immediately. 
            window.setTimeout(function() {
                self._updateOutput(self.data)
            }, 0)

            // Track a button click.
            _nex.utility.buttonTracking.track('', self._mask(character), '', 'keyboard', 'control')

            // Play a sound.
            self._playSound(character)

            // If we encounter the last digit, call the callback.
            if (self.data.length === self.MAXLENGTH) {
                window.setTimeout(function() {
                    if (typeof self._lastDigitCallback === 'function') {
                        console.debug('last digit found')
                        self._lastDigitCallback(self.data)
                    }
                }, 250)
            } else {
                if (typeof self._digitEnteredCallback === 'function') {
                    self._digitEnteredCallback(character)
                }
            }
        })

    };
}

function OnlineOrder(parameters) {
    // Guard against wrong parameters.
    if (!(parameters instanceof ThemeUX)) {
        throw 'OnlineOrder: Parameter is not a ThemeUX.';
    }

    var self = this
    self._theme = parameters
    self.lookupByPin = false

    self.isPinOrderLookup = function() {
        // Default the result to false.
        var result = false

        // Use theme as a shorthand for self._theme.
        var theme = self._theme

        // Check the theme object if 'previous orders' is enabled.
        if (theme.system && theme.system.PREVIOUSORDERS && theme.system.PREVIOUSORDERS.hasOwnProperty('orderlookup')) {
            if (theme.system.PREVIOUSORDERS.orderlookup.toLowerCase() === 'true') {
                result = true
            }
        }

        // Return the result.
        return result
    };

    self._popupOrderOptions = function(message, callback) {
        var popupString = 'orderOptionsPopup';
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString])
        popup.message = _nex.assets.theme.getTextAttribute('', 'instructions', 'Please Enter an option.')
        popup.buttons[0].clickEvent = '_nex.previousOrders.onlineOrder.getPinFromNumPad();';
        popup.buttons[1].clickEvent = '_nex.previousOrders._lookupPreviousSelected();';
        popup.buttons[2].clickEvent = '_nex.previousOrders._gotoOrderingWithoutOrder();';
        _nex.assets.popupManager.showPopup(popup)
    };

    self.getPinFromNumPad = function() {
        var popup = $.extend(true, {}, _nex.assets.popupManager.numpadPopup)
        popup.buttons[0].clickEvent = '_nex.previousOrders.onlineOrder.getPinLookup();';
        popup.buttons[1].clickEvent = '_nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.SPLASH);_nex.assets.popupManager.hidePopup(popup);';

        popup.message = _nex.assets.theme.getTextAttribute('REPEATORDERS', 'orderpinprompt', 'Please enter your Order PIN')

        var maxLength = 4
        if (_nex.assets.theme.system &&
            _nex.assets.theme.system.USERINTERFACE &&
            _nex.assets.theme.system.USERINTERFACE.hasOwnProperty('orderpinlength')) {
            maxLength = Number(_nex.assets.theme.system.USERINTERFACE.orderpinlength)
        }
        _nex.keyboard.numpad.setMaxLength(maxLength)
        _nex.keyboard.numpad.setPopup(popup)
            //_nex.keyboard.numpad.bindKeys();
        popup.onShowCallback = _nex.keyboard.numpad.bindKeys
        _nex.assets.popupManager.showPopup(popup)
    };

    self.getPinLookup = function() {
        var pin = _nex.keyboard.numpad.data
        if (pin.length > 0) {
            self.orderLookup(pin)
        }
    }

    self.showPinNotFoundPopup = function(message, callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.dismissibleMessagePopup)
        popup.message = message || "Sorry! We are unable to find your order.";
        popup.buttons[0].clickEvent = '_nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PREVIOUS_ORDERS, function () { _nex.previousOrders.start();});';
        _nex.assets.popupManager.showPopup(popup, callback)
    };

    self.orderLookup = function(pin) {
        self._orderDate = '';
        self._searchType = 'OrderId';
        self._searchTerm = '*' + pin

        var command = new _nex.commands.OrderLookup(self._orderDate, self._searchType, self._searchTerm, true)

        _nex.communication.send(command, function(response) {
            self.orderLookupResponse(response)

        }, 'ORDERLOOKUPRESPONSE')
    };

    self.orderLookupResponse = function(response) {
        if (response.success === 'true') {
            _nex.orderManager.currentOrder.update(response.ORDER)
            _nex.orderManager.currentOrder.ordertype = 'drivethru';
            _nex.ordering.order = _nex.orderManager.currentOrder

            //start the payment process if order has not been paid.  Otherwise go to complete phase.
            if (response.ORDER.paymentstatus === 'NoPayment') {
                _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PAYMENT, function() {
                    _nex.payment.start()
                })
            } else {
                _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.COMPLETE, function() {
                    _nex.complete.start()
                })
            }
        } else {
            self.showPinNotFoundPopup()
        }
    }
}

function Order() {
    var self = this

    self.creditCard = null
    self.ITEM = []
    self.totals = new TotalsModel()
    self.togo = true
    self.alcoholEnabled = true
    self.ageVerified = false
    self.smsNumber = '';
    self.lookupData = null
    self.remainingBalance = 0.0
    self.roundUpCharitySelected = false

    self.customer = {
        email: '',
        firstname: '',
        lastname: '',
        guestaccountid: '',
        name: '',
        pagernumber: ''
    }

    self.receiptFormat = _nex.orderManager.receiptFormatType.PAPER
    self.ordernumber = '';
    self.tenderResults = []
    self.origin = '';
    self.ordertype = '';
    self.orderid = '';
    self.ordernumber = '';

    self.togoSet = false


    self.currentItem = function() {
        var current = null
        if ((self.ITEM !== null) &&
            (self.ITEM.length > 0)) {
            current = self.ITEM[self.ITEM.length - 1]
        }

        return current
    };

    self.update = function(orderData, updateItems) {
        if (updateItems !== false) {
            if (!orderData.hasOwnProperty('ITEM')) {
                self.ITEM = []
            } else {
                self.ITEM = orderData.ITEM
            }
        }

        if (!orderData.hasOwnProperty('CUSTOMER')) {
            self.customer = {}
        } else {
            self.customer = orderData.CUSTOMER[0]
            console.log('Updating customer info: ', self.customer)
        }

        self.checkAlcoholLimit()

        // update order totals
        if (orderData.subtotal !== undefined) {
            self.totals.subtotal(currency.formatAsDollars(Number(orderData.subtotal), false))
            self.totals.salestax(currency.formatAsDollars(0, false))
            self.totals.salestax2(currency.formatAsDollars(0, false))
            self.totals.deliveryfee(currency.formatAsDollars(0, false))
            self.totals.roundupcharity(currency.formatAsDollars(0, false))
            self.totals.amountdue(currency.formatAsDollars(Number(orderData.amountdue), false))
            self.totals.discount(currency.formatAsDollars(0, false))
            var remainingBalance = Number(orderData.remainingbalance)
            if (!remainingBalance) {
                remainingBalance = Number(orderData.amountdue)
            }
            self.totals.remainingbalance(currency.formatAsDollars(remainingBalance, false))
        }

        if (orderData.hasOwnProperty('COMPLETEORDER')) {
            self.origin = orderData.COMPLETEORDER.origin
            self.ordertype = orderData.COMPLETEORDER.ordertype
            self.orderid = orderData.COMPLETEORDER.orderid
            self.ordernumber = orderData.COMPLETEORDER.ordernumber
        }
    }

    self.currentItemIndex = function() {
        var index = -1

        if ((self.ITEM !== null) &&
            (self.ITEM.length > 0)) {
            index = (self.ITEM.length - 1)
        }

        return index
    };

    self.checkAlcoholLimit = function() {
        var alcoholCount = self.alcoholCount()

        self.alcoholEnabled = (alcoholCount < _nex.assets.theme.alcoholLimit)
    };

    self.alcoholCount = function() {
        var alcoholCount = 0

        for (var i = 0; i < self.ITEM.length; i++) {
            if (self.ITEM[i].alcoholflag.toLowerCase() === 'true') {
                alcoholCount += Number(self.ITEM[i].quantity)
            }
        }

        return alcoholCount
    };

    self.origin = _nex.assets.theme.kiosk.origin
    self.ordertype = null
}

function OrderManager() {
    var self = this
    var _orderId = null
    var _orderNumber = null
    var _futureOrder = false
    var _fulfillmentTime = null
    var _ordersPlaced = []
    var _gratuity = 0
    var _gratuityPercentage = 0
    var _gratuityAccepted = false
    var _acceptingCash = false
    var _cashAccetped = false
    var _couponAccepted = false
    var _selectedReservation = null
    var _specials = null
    var _orderReviewMenuId = null
    var _deliveryFee = 0
    var _forceDicoPrompt = false

    // Any custom or customer specific data on the order.
    self.customData = {}

    self.receiptFormatType = {
        'PAPER': '0',
        'EMAIL': '1',
        'NONE': '2',
        'SMS': '3'
    }

    self.currentOrder = null

    self.startOrder = function(creditCard) {
        self.currentOrder = new Order()
        self.currentOrder.creditCard = creditCard || null

        self._orderId = null
        self._orderNumber = null

        self._ordersPlaced = [] // FUTURE USE

        self._gratuity = 0
        self._gratuityPercentage = 0
        self._gratuityAccepted = false
        self._acceptingCash = false
        self._cashAccetped = false
        self._couponAccepted = false
        self._orderReviewMenuId = null
        self._selectedReservation = null // FUTURE USE
        self._specials = null
    };

    self.resetCurrentOrder = function() {
        self.currentOrder = new Order()
    };

    self.NEXTEPOrderType = {
        DineIn: '0',
        TakeOut: '1', // aka: pickup
        Delivery: '2',
        DriveThru: '3'
    }

    self.OrderOriginType = {
        Kiosk: '0',
        NextepMobile: '3',
        Pos: '5',
        DriveThru: '6',
        SelfCheckout: '7'
    }

}
// Constructor. 
function PaymentButtons(paymentManager) {
    //
    // Guard against bad parameters
    //
    if (!paymentManager) {
        throw 'ERROR IN PAYMENTBUTTONS! You must specify a paymentManager';
    }

    // Make self synonymous with this.
    var self = this

    // Keep a reference to the payment manager to going to clips.
    self._paymentManager = paymentManager

    // Keep track of the button elements.
    self._$cashButtonElement = null
    self._$counterButtonElement = null
    self._$couponButtonElement = null
    self._$creditButtonElement = null

    self._$debitButtonElement = null
    self._$discountButtonElement = null
    self._$employeeButtonElement = null
    self._$loyaltyButtonElement = null

    self._$genericTender1ButtonElement = null
    self._$genericTender2ButtonElement = null
    self._$genericTender3ButtonElement = null
    self._$genericTender4ButtonElement = null
    self._$genericTender5ButtonElement = null
    self._$genericTender6ButtonElement = null
    self._$genericTender7ButtonElement = null
    self._$genericTender8ButtonElement = null
    self._$genericTender9ButtonElement = null
    self._$genericTender10ButtonElement = null

    self._$gaIncliningBalanceTender1ButtonElement = null
    self._$gaIncliningBalanceTender2ButtonElement = null
    self._$gaIncliningBalanceTender3ButtonElement = null
    self._$gaIncliningBalanceTender4ButtonElement = null
    self._$gaIncliningBalanceTender5ButtonElement = null
    self._$gaIncliningBalanceTender6ButtonElement = null
    self._$gaIncliningBalanceTender7ButtonElement = null
    self._$gaIncliningBalanceTender8ButtonElement = null
    self._$gaIncliningBalanceTender9ButtonElement = null
    self._$gaIncliningBalanceTender10ButtonElement = null

    self._numButtons = 0

    //
    // Public methods
    //

    // Wireup the buttons to JavaScript functions.
    self.initialize = function() {
        var tendersAvailable = _nex.assets.theme.tendersAvailable()
        console.debug('PaymentButtons: Initializing with buttons available: ')
        console.debug(tendersAvailable)
        var btext = null

        self._$cashButtonElement = $('#' + paymentConstants.CASH_BUTTON_ID)
        self._$counterButtonElement = $('#' + paymentConstants.COUNTER_BUTTON_ID)
        self._$couponButtonElement = $('#' + paymentConstants.COUPON_BUTTON_ID)
        self._$creditButtonElement = $('#' + paymentConstants.CREDIT_BUTTON_ID)

        self._$debitButtonElement = $('#' + paymentConstants.DEBIT_BUTTON_ID)
        self._$discountButtonElement = $('#' + paymentConstants.DISCOUNT_BUTTON_ID)
        self._$employeeButtonElement = $('#' + paymentConstants.EMPLOYEE_BUTTON_ID)
        self._$loyaltyButtonElement = $('#' + paymentConstants.LOYALTY_BUTTON_ID)

        //up to 10 generic tender UIs could be there! unlikely we use more than a couple but need to check for all supported
        self._$genericTender1ButtonElement = $('#' + paymentConstants.GENERICTENDER1_BUTTON_ID)
        self._$genericTender2ButtonElement = $('#' + paymentConstants.GENERICTENDER2_BUTTON_ID)
        self._$genericTender3ButtonElement = $('#' + paymentConstants.GENERICTENDER3_BUTTON_ID)
        self._$genericTender4ButtonElement = $('#' + paymentConstants.GENERICTENDER4_BUTTON_ID)
        self._$genericTender5ButtonElement = $('#' + paymentConstants.GENERICTENDER5_BUTTON_ID)
        self._$genericTender6ButtonElement = $('#' + paymentConstants.GENERICTENDER6_BUTTON_ID)
        self._$genericTender7ButtonElement = $('#' + paymentConstants.GENERICTENDER7_BUTTON_ID)
        self._$genericTender8ButtonElement = $('#' + paymentConstants.GENERICTENDER8_BUTTON_ID)
        self._$genericTender9ButtonElement = $('#' + paymentConstants.GENERICTENDER9_BUTTON_ID)
        self._$genericTender10ButtonElement = $('#' + paymentConstants.GENERICTENDER10_BUTTON_ID)

        //up to 10 Guest Account Chargeable Local Inclining Balance Accounts could be there!
        self._$gaIncliningBalanceTender1ButtonElement = $('#' + paymentConstants.GAINCLININGBALANCETENDER1_BUTTON_ID)
        self._$gaIncliningBalanceTender2ButtonElement = $('#' + paymentConstants.GAINCLININGBALANCETENDER2_BUTTON_ID)
        self._$gaIncliningBalanceTender3ButtonElement = $('#' + paymentConstants.GAINCLININGBALANCETENDER3_BUTTON_ID)
        self._$gaIncliningBalanceTender4ButtonElement = $('#' + paymentConstants.GAINCLININGBALANCETENDER4_BUTTON_ID)
        self._$gaIncliningBalanceTender5ButtonElement = $('#' + paymentConstants.GAINCLININGBALANCETENDER5_BUTTON_ID)
        self._$gaIncliningBalanceTender6ButtonElement = $('#' + paymentConstants.GAINCLININGBALANCETENDER6_BUTTON_ID)
        self._$gaIncliningBalanceTender7ButtonElement = $('#' + paymentConstants.GAINCLININGBALANCETENDER7_BUTTON_ID)
        self._$gaIncliningBalanceTender8ButtonElement = $('#' + paymentConstants.GAINCLININGBALANCETENDER8_BUTTON_ID)
        self._$gaIncliningBalanceTender9ButtonElement = $('#' + paymentConstants.GAINCLININGBALANCETENDER9_BUTTON_ID)
        self._$gaIncliningBalanceTender10ButtonElement = $('#' + paymentConstants.GAINCLININGBALANCETENDER10_BUTTON_ID)


        var NOT_FOUND = -1 // jQuery returns -1 if it is not found in the array.
        self._numButtons = 0

        // Note: If more than one click listener is needed, addeventlistener can be used.
        if (self._$cashButtonElement) {
            if ($.inArray('cash', tendersAvailable) === NOT_FOUND) {
                self._$cashButtonElement.hide()
                self._$cashButtonElement.parent().hide()
            } else {
                ++self._numButtons
                self._setPaymentButtonText(self._$cashButtonElement, 'cashtext', 'CASH')
                self._$cashButtonElement.unbind('click')
                self._$cashButtonElement.click(function() {
                    self._cashButtonClicked(self._$cashButtonElement)
                })
            }
        }
        if (self._$counterButtonElement) {
            if ($.inArray('counter', tendersAvailable) === NOT_FOUND) {
                self._$counterButtonElement.hide()
                self._$counterButtonElement.parent().hide()
            } else {
                ++self._numButtons
                self._setPaymentButtonText(self._$counterButtonElement, 'countertext', 'COUNTER')
                self._$counterButtonElement.unbind('click')
                self._$counterButtonElement.click(function() {
                    self._counterButtonClicked(self._$counterButtonElement)
                })
            }
        }
        if (self._$couponButtonElement) {
            if ($.inArray('coupon', tendersAvailable) === NOT_FOUND) {
                self._$couponButtonElement.hide()
                self._$couponButtonElement.parent().hide()
            } else {
                ++self._numButtons
                self._setPaymentButtonText(self._$couponButtonElement, 'coupontext', 'COUPON')
                self._$couponButtonElement.unbind('click')
                self._$couponButtonElement.click(function() {
                    self._couponButtonClicked(self._$couponButtonElement)
                })
            }
        }
        if (self._$creditButtonElement) {
            if ($.inArray('credit', tendersAvailable) === NOT_FOUND) {
                self._$creditButtonElement.hide()
                self._$creditButtonElement.parent().hide()
            } else {
                ++self._numButtons
                self._setPaymentButtonText(self._$creditButtonElement, 'credittext', 'CREDIT')
                self._$creditButtonElement.unbind('click')
                self._$creditButtonElement.click(function() {
                    self._creditButtonClicked(self._$creditButtonElement)
                })
            }
        }

        if (self._$debitButtonElement) {
            if ($.inArray('debit', tendersAvailable) === NOT_FOUND) {
                self._$debitButtonElement.hide()
                self._$debitButtonElement.parent().hide()
            } else {
                ++self._numButtons
                self._setPaymentButtonText(self._$debitButtonElement, 'debittext', 'DEBIT')
                self._$debitButtonElement.unbind('click')
                self._$debitButtonElement.click(function() {
                    self._debitButtonClicked(self._$debitButtonElement)
                })
            }
        }
        if (self._$discountButtonElement) {
            if ($.inArray('discount', tendersAvailable) === NOT_FOUND) {
                self._$discountButtonElement.hide()
                self._$discountButtonElement.parent().hide()
            } else {
                ++self._numButtons
                self._setPaymentButtonText(self._$discountButtonElement, 'discounttext', 'DISCOUNTS')
                self._$discountButtonElement.unbind('click')
                self._$discountButtonElement.click(function() {
                    self._discountButtonClicked(self._$discountButtonElement)
                })
            }
        }
        if (self._$employeeButtonElement) {
            if ($.inArray('employee', tendersAvailable) === NOT_FOUND) {
                self._$employeeButtonElement.hide()
                self._$employeeButtonElement.parent().hide()
            } else {
                ++self._numButtons
                self._setPaymentButtonText(self._$employeeButtonElement, 'employeetext', 'EMPLOYEE')
                self._$employeeButtonElement.unbind('click')
                self._$employeeButtonElement.click(function() {
                    self._employeeButtonClicked(self._$employeeButtonElement)
                })
            }
        }
        if (self._$loyaltyButtonElement) {
            if ($.inArray('loyalty', tendersAvailable) === NOT_FOUND) {
                self._$loyaltyButtonElement.hide()
                self._$loyaltyButtonElement.parent().hide()
            } else {
                ++self._numButtons
                self._setPaymentButtonText(self._$loyaltyButtonElement, 'loyaltytext', 'GIFT CARD')
                self._$loyaltyButtonElement.unbind('click')
                self._$loyaltyButtonElement.click(function() {
                    self._loyaltyButtonClicked(self._$loyaltyButtonElement)
                })
            }
        }

        // add any generic tender buttons as needed
        self._validateGenericTender(tendersAvailable, self._$genericTender1ButtonElement, 'generictender1', 1)
        self._validateGenericTender(tendersAvailable, self._$genericTender2ButtonElement, 'generictender2', 2)
        self._validateGenericTender(tendersAvailable, self._$genericTender3ButtonElement, 'generictender3', 3)
        self._validateGenericTender(tendersAvailable, self._$genericTender4ButtonElement, 'generictender4', 4)
        self._validateGenericTender(tendersAvailable, self._$genericTender5ButtonElement, 'generictender5', 5)
        self._validateGenericTender(tendersAvailable, self._$genericTender6ButtonElement, 'generictender6', 6)
        self._validateGenericTender(tendersAvailable, self._$genericTender7ButtonElement, 'generictender7', 7)
        self._validateGenericTender(tendersAvailable, self._$genericTender8ButtonElement, 'generictender8', 8)
        self._validateGenericTender(tendersAvailable, self._$genericTender9ButtonElement, 'generictender9', 9)
        self._validateGenericTender(tendersAvailable, self._$genericTender10ButtonElement, 'generictender10', 10)

        //add any Guest Account Chargeable Local Inclining Balance Generic Tender Accounts as needed...
        for (var i = 0; i < 10; i++) {
            var buttonElement = self._getGAIncliningBalanceButtonElement(i)

            if (_nex.hasGuestAccount && i < _nex.guestAccount.chargeableLocalAccounts.length) {
                self._validateGAIncliningBalanceTender(_nex.guestAccount.chargeableLocalAccounts[i], buttonElement, i)
            } else {
                buttonElement.hide()
                buttonElement.parent().hide()
            }
        }

        self._showHeaderMessage()
    };

    self._setPaymentButtonText = function(tenderUI, attribute, defaultText) {
        var btext = tenderUI.find('#btext')
        if (btext) {
            btext.empty()
            btext.append(_nex.assets.theme.getTextAttribute('PAYMENT', attribute, defaultText))
        }
    }

    self._validateGenericTender = function(tendersAvailable, genericTenderButtonElement, genericTenderName, genericTenderIndex) {
        var NOT_FOUND = -1
        if (genericTenderButtonElement) {
            if ($.inArray(genericTenderName, tendersAvailable) === NOT_FOUND) {
                genericTenderButtonElement.hide()
                genericTenderButtonElement.parent().hide()
            } else {
                ++self._numButtons

                //pull default text from the tender in system.xml
                var defaultName = 'GENERIC';
                var gtender = _nex.assets.theme.getGenericTenderByType(genericTenderName)
                if (gtender) {
                    defaultName = gtender.name.toString()
                }

                self._setPaymentButtonText(genericTenderButtonElement, genericTenderName.toString() + 'text', defaultName)

                genericTenderButtonElement.unbind('click')
                genericTenderButtonElement.click(function() {
                    self._genericButtonClicked(genericTenderButtonElement, genericTenderName, genericTenderIndex)
                })
            }
        }
    }

    self._getGAIncliningBalanceButtonElement = function(index) {
        var buttonElement
        switch (index) {
            case 0:
                buttonElement = self._$gaIncliningBalanceTender1ButtonElement
                break;
            case 1:
                buttonElement = self._$gaIncliningBalanceTender2ButtonElement
                break;
            case 2:
                buttonElement = self._$gaIncliningBalanceTender3ButtonElement
                break;
            case 3:
                buttonElement = self._$gaIncliningBalanceTender4ButtonElement
                break;
            case 4:
                buttonElement = self._$gaIncliningBalanceTender5ButtonElement
                break;
            case 5:
                buttonElement = self._$gaIncliningBalanceTender6ButtonElement
                break;
            case 6:
                buttonElement = self._$gaIncliningBalanceTender7ButtonElement
                break;
            case 7:
                buttonElement = self._$gaIncliningBalanceTender8ButtonElement
                break;
            case 8:
                buttonElement = self._$gaIncliningBalanceTender9ButtonElement
                break;
            case 9:
                buttonElement = self._$gaIncliningBalanceTender10ButtonElement
                break;
            default:
                buttonElement = null
        }

        return buttonElement
    };

    self._validateGAIncliningBalanceTender = function(account, buttonElement, index) {
        //only inclining balance accounts should be displayed...
        if (account.usageType === "incliningbalance") {
            var genericTender = _nex.assets.theme.getGenericTenderByGuestAccountLocalType(account.guestAccountLocalTypeId);

            //only accounts associated to an enabled generic tender in the payment profile should be displayed...
            if (genericTender !== undefined && genericTender !== null) {
                ++self._numButtons;

                var buttonText = genericTender.name.toString() + " Account Number: " + account.maskedAccountNumber();
                self._setPaymentButtonText(buttonElement, "gaincliningbalancetender" + (index + 1).toString() + "text", buttonText);

                buttonElement.unbind("click");
                buttonElement.click(function() {
                    self._gaIncliningBalanceButtonClicked(buttonElement, "gaincliningbalancetender" + (index + 1).toString());
                });

                return;
            }
        }

        if (buttonElement !== undefined && buttonElement !== null) {
            buttonElement.hide();
            buttonElement.parent().hide();
        }


    };

    //
    // Private / helper methods
    //
    self._showHeaderMessage = function() {
        var msg = $('#selectPaymentMessage')
        if (msg.length > 0) {
            msg.empty()
            msg.append(_nex.assets.theme.getTextAttribute('PAYMENT', 'paymenttype', 'Select Type of Payment'))
        }
    }

    // Helper method common to all payment buttons being clicked.
    self._trackPaymentClick = function(id, button, context) {
        _nex.utility.buttonTracking.track(id, button.text(), self.currentMenuId, context, 'payment')
    };

    // Button click handlers.
    self._cashButtonClicked = function(button) {
        console.debug('PaymentButtons: Cash button clicked.')
        self._trackPaymentClick(1, button, 'Cash Button')
        _nex.assets.soundManager.playButtonHit()
        _nex.payment.paymentSelected('cash')

    };
    self._counterButtonClicked = function(button) {
        console.debug('PaymentButtons: Counter button clicked.')
        self._trackPaymentClick(1, button, 'Counter Button')
        _nex.assets.soundManager.playButtonHit()
        _nex.payment.paymentSelected('counter')
    };
    self._couponButtonClicked = function(button) {
        console.debug('PaymentButtons: Coupon button clicked.')
        self._trackPaymentClick(1, button, 'Coupon Button')
        _nex.assets.soundManager.playButtonHit()
        _nex.payment.paymentSelected('coupon')
    };
    self._creditButtonClicked = function(button) {
        console.debug('PaymentButtons: Credit button clicked.')
        self._trackPaymentClick(1, button, 'Credit Button')
        _nex.assets.soundManager.playButtonHit()
        _nex.payment.paymentSelected('credit')

    };
    self._debitButtonClicked = function(button) {
        console.debug('PaymentButtons: Debit button clicked.')
        self._trackPaymentClick(1, button, 'Debit Button')
        _nex.assets.soundManager.playButtonHit()
        _nex.payment.paymentSelected('debit')

    };
    self._discountButtonClicked = function(button) {
        console.debug('PaymentButtons: Discount button clicked.')
        self._trackPaymentClick(1, button, 'Discount Button')
        _nex.assets.soundManager.playButtonHit()
        _nex.payment.paymentSelected('discount')

    };
    self._employeeButtonClicked = function(button) {
        console.debug('PaymentButtons: Employee button clicked.')
        self._trackPaymentClick(1, button, 'Employee Button')
        _nex.assets.soundManager.playButtonHit()
        _nex.payment.paymentSelected('employee')

    };
    self._loyaltyButtonClicked = function(button) {
        console.debug('PaymentButtons: Loyalty button clicked.')
        self._trackPaymentClick(1, button, 'Loyalty Button')
        _nex.assets.soundManager.playButtonHit()
        _nex.payment.paymentSelected('loyalty')
    };

    self._genericButtonClicked = function(button, genericTenderId, genericTenderIndex) {
        console.debug('PaymentButtons: Generic Tender button clicked...generic tenderid:' + genericTenderId.toString())
        self._trackPaymentClick(1, button, 'Generic Button')
        _nex.assets.soundManager.playButtonHit()
        _nex.payment.paymentSelected(genericTenderId)
    };

    self._gaIncliningBalanceButtonClicked = function(button, gaIncliningBalanceTenderId) {
        console.debug('PaymentButtons: Guest Account Inclining Balance Tender button clicked... id:' + gaIncliningBalanceTenderId.toString())
        self._trackPaymentClick(1, button, 'Guest Account Inclining Balance Button')
        _nex.assets.soundManager.playButtonHit()
        _nex.payment.paymentSelected(gaIncliningBalanceTenderId)
    };
}
// Constructor. 
function PaymentClipFactory() {
    // Make self synonymous with this.
    var self = this

    // These payment clips are listed in the Flash.
    self.createPaymentClip = function(clipId, callback) {
        // Copy reference to the constants for a short-hand.
        var constants = paymentConstants

        // Default the result to null.
        var result = null

        // Depending on the clip id, create the corresponding object.
        switch (clipId) {
            case constants.CASH_CLIP: // 2
                // result = new CashPaymentClip(clipId, paymentTarget, paymentText);
                break
            case constants.COUNTER_CLIP: // 1
                // result = new CounterPaymentClip(clipId, paymentTarget, paymentText);
                result = new CounterPaymentClip(callback)
                break;
            case constants.COUPON_CLIP: // 6
                result = new CouponPaymentClip(callback)
                break;
            case constants.CREDIT_CLIP: // 3 (or debit)
                // result = new CreditPaymentClip(clipId, paymentTarget, paymentText);
                result = new CreditPaymentClip(callback)
                break;
            case constants.LOYALTY_CLIP: // 4 (or gift card)
                // result = new LoyaltyPaymentClip(clipId, paymentTarget, paymentText);
                result = new LoyaltyPaymentClip(callback)
                break;
            case constants.PREPTIME_CLIP:
                // result = new PrepTime(clipId, paymentTarget, paymentText);
                break
            case constants.PREPTIME_CLIP:
                // result = new Pager(clipId, paymentTarget, paymentText);
                break
            case constants.PROCESSING_CLIP:
                // result = new Processing(clipId, paymentTarget, paymentText);
                break
            case constants.SELECTPAYMENT_CLIP: // The clip for showing payment information.
                // result = new SelectPaymentClip(clip, paymentTarget, paymentText);
                // result = new SelectPaymentClip(clipId);
                result = new SelectPaymentClip()
                break;
            case constants.LOYALTYSELECTBUCKET_CLIP: // similar to 4?
                // result = new LoyaltySelectBucketClip(clipId, paymentTarget, paymentText);
                break
            case constants.ROOMCHARGE_CLIP: // 5
                // result = new RoomChargePaymentClip(clipId, paymentTarget, paymentText);
                break
            case constants.SUBMITORDER_CLIP: // ?
                // result = new SubmitOrder(clipId, paymentTarget, paymentText);
                break
            case constants.TAKECASH_CLIP: // ?
                // result = new TakeCashClip(clipId, paymentTarget, paymentText);
                break
            case constants.EMPLOYEE_CLIP: // ?
                // result = new EmployeePaymentClip(clipId, paymentTarget, paymentText);
                result = new EmployeePaymentClip(callback)
                break;
            case constants.LOYALTYPROMPT_CLIP: // ?
                result = new LoyaltyPromptClip(callback)
                break;
            case constants.GENERICTENDER1_CLIP:
                result = new GenericPaymentClip(1)
                break;
            case constants.GENERICTENDER2_CLIP:
                result = new GenericPaymentClip(2)
                break;
            case constants.GENERICTENDER3_CLIP:
                result = new GenericPaymentClip(3)
                break;
            case constants.GENERICTENDER4_CLIP:
                result = new GenericPaymentClip(4)
                break;
            case constants.GENERICTENDER5_CLIP:
                result = new GenericPaymentClip(5)
                break;
            case constants.GENERICTENDER6_CLIP:
                result = new GenericPaymentClip(6)
                break;
            case constants.GENERICTENDER7_CLIP:
                result = new GenericPaymentClip(7)
                break;
            case constants.GENERICTENDER8_CLIP:
                result = new GenericPaymentClip(8)
                break;
            case constants.GENERICTENDER9_CLIP:
                result = new GenericPaymentClip(9)
                break;
            case constants.GENERICTENDER10_CLIP:
                result = new GenericPaymentClip(10)
                break;
            case constants.GAINCLININGBALANCETENDER1_CLIP:
                result = new GAIncliningBalancePaymentClip(1)
                break;
            case constants.GAINCLININGBALANCETENDER2_CLIP:
                result = new GAIncliningBalancePaymentClip(2)
                break;
            case constants.GAINCLININGBALANCETENDER3_CLIP:
                result = new GAIncliningBalancePaymentClip(3)
                break;
            case constants.GAINCLININGBALANCETENDER4_CLIP:
                result = new GAIncliningBalancePaymentClip(4)
                break;
            case constants.GAINCLININGBALANCETENDER5_CLIP:
                result = new GAIncliningBalancePaymentClip(5)
                break;
            case constants.GAINCLININGBALANCETENDER6_CLIP:
                result = new GAIncliningBalancePaymentClip(6)
                break;
            case constants.GAINCLININGBALANCETENDER7_CLIP:
                result = new GAIncliningBalancePaymentClip(7)
                break;
            case constants.GAINCLININGBALANCETENDER8_CLIP:
                result = new GAIncliningBalancePaymentClip(8)
                break;
            case constants.GAINCLININGBALANCETENDER9_CLIP:
                result = new GAIncliningBalancePaymentClip(9)
                break;
            case constants.GAINCLININGBALANCETENDER10_CLIP:
                result = new GAIncliningBalancePaymentClip(10)
                break;
            default:
                throw 'PaymentFactory: Unknown payment type ' + clipId
        }
        return result
    };
}
// Global variable of constants used by the payment phase.
var paymentConstants = {
        // Button ids used in the theme. .
        CASH_BUTTON_ID: 'btnTenderCash',
        COUNTER_BUTTON_ID: 'btnTenderCounter',
        COUPON_BUTTON_ID: 'btnTenderCoupon',
        CREDIT_BUTTON_ID: 'btnTenderCredit',

        DEBIT_BUTTON_ID: 'btnTenderDebit',
        DISCOUNT_BUTTON_ID: 'btnTenderDiscount',
        EMPLOYEE_BUTTON_ID: 'btnTenderEmployee',
        LOYALTY_BUTTON_ID: 'btnTenderLoyalty',

        GENERICTENDER1_BUTTON_ID: 'btnTenderGeneric1',
        GENERICTENDER2_BUTTON_ID: 'btnTenderGeneric2',
        GENERICTENDER3_BUTTON_ID: 'btnTenderGeneric3',
        GENERICTENDER4_BUTTON_ID: 'btnTenderGeneric4',
        GENERICTENDER5_BUTTON_ID: 'btnTenderGeneric5',
        GENERICTENDER6_BUTTON_ID: 'btnTenderGeneric6',
        GENERICTENDER7_BUTTON_ID: 'btnTenderGeneric7',
        GENERICTENDER8_BUTTON_ID: 'btnTenderGeneric8',
        GENERICTENDER9_BUTTON_ID: 'btnTenderGeneric9',
        GENERICTENDER10_BUTTON_ID: 'btnTenderGeneric10',

        GAINCLININGBALANCETENDER1_BUTTON_ID: 'btnTenderGAIncliningBalance1',
        GAINCLININGBALANCETENDER2_BUTTON_ID: 'btnTenderGAIncliningBalance2',
        GAINCLININGBALANCETENDER3_BUTTON_ID: 'btnTenderGAIncliningBalance3',
        GAINCLININGBALANCETENDER4_BUTTON_ID: 'btnTenderGAIncliningBalance4',
        GAINCLININGBALANCETENDER5_BUTTON_ID: 'btnTenderGAIncliningBalance5',
        GAINCLININGBALANCETENDER6_BUTTON_ID: 'btnTenderGAIncliningBalance6',
        GAINCLININGBALANCETENDER7_BUTTON_ID: 'btnTenderGAIncliningBalance7',
        GAINCLININGBALANCETENDER8_BUTTON_ID: 'btnTenderGAIncliningBalance8',
        GAINCLININGBALANCETENDER9_BUTTON_ID: 'btnTenderGAIncliningBalance9',
        GAINCLININGBALANCETENDER10_BUTTON_ID: 'btnTenderGAIncliningBalance10',

        // Elements ids in the html files in the theme folder.
        CREDIT_CLIP_ELEMENT_ID: 'paymentclip-credit',
        LOYALTY_CLIP_ELEMENT_ID: 'paymentclip-loyalty',
        EMPLOYEE_CLIP_ELEMENT_ID: 'paymentclip-employee',
        SELECT_CLIP_ELEMENT_ID: 'paymentclip-select',
        GENERIC_CLIP_ELEMENT_ID: 'paymentclip-generic',
        GAINCLININGBALANCE_CLIP_ELEMENT_ID: 'paymentclip-gaincliningbalance',
        COUPON_CLIP_ELEMENT_ID: 'paymentclip-coupon',

        // Taken from the Flash. A kind of enum of the possible clips. Used by the
        // payment clip factory.
        CASH_CLIP: 'cash',
        COUNTER_CLIP: 'counter',
        COUPON_CLIP: 'coupon',
        CREDIT_CLIP: 'credit',
        LOYALTY_CLIP: 'loyalty',

        GENERICTENDER1_CLIP: 'generictender1',
        GENERICTENDER2_CLIP: 'generictender2',
        GENERICTENDER3_CLIP: 'generictender3',
        GENERICTENDER4_CLIP: 'generictender4',
        GENERICTENDER5_CLIP: 'generictender5',
        GENERICTENDER6_CLIP: 'generictender6',
        GENERICTENDER7_CLIP: 'generictender7',
        GENERICTENDER8_CLIP: 'generictender8',
        GENERICTENDER9_CLIP: 'generictender9',
        GENERICTENDER10_CLIP: 'generictender10',

        GAINCLININGBALANCETENDER1_CLIP: 'gaincliningbalancetender1',
        GAINCLININGBALANCETENDER2_CLIP: 'gaincliningbalancetender2',
        GAINCLININGBALANCETENDER3_CLIP: 'gaincliningbalancetender3',
        GAINCLININGBALANCETENDER4_CLIP: 'gaincliningbalancetender4',
        GAINCLININGBALANCETENDER5_CLIP: 'gaincliningbalancetender5',
        GAINCLININGBALANCETENDER6_CLIP: 'gaincliningbalancetender6',
        GAINCLININGBALANCETENDER7_CLIP: 'gaincliningbalancetender7',
        GAINCLININGBALANCETENDER8_CLIP: 'gaincliningbalancetender8',
        GAINCLININGBALANCETENDER9_CLIP: 'gaincliningbalancetender9',
        GAINCLININGBALANCETENDER10_CLIP: 'gaincliningbalancetender10',

        PREPTIME_CLIP: 'preptime',
        PAGER_CLIP: 'pager',
        PROCESSING_CLIP: 'processing',
        SELECTPAYMENT_CLIP: 'selectpayment',

        LOYALTYSELECTBUCKET_CLIP: 'loyaltyselectbucket',
        ROOMCHARGE_CLIP: 'roomcharge',
        SUBMITORDER_CLIP: 'submitorder',

        TAKECASH_CLIP: 'takecash',
        EMPLOYEE_CLIP: 'employee',
        LOYALTYPROMPT_CLIP: 'loyaltyprompt',

        // Payment clip class, all payment clips share this class. Used to hide them all, for example.
        PAYMENT_CLIP_CLASS: 'paymentclip',

        // Payment modes
        PAYMENTMODE_STANDARD: 'standard',
        PAYMENTMODE_NOPAYMENT: 'nopayment',

        // Tenders. Used by the tender factory.
        TENDER_CASH: 'cash',
        TENDER_COUNTER: 'counter',
        TENDER_COUPON: 'coupon',
        TENDER_CREDIT: 'credit',
        TENDER_DEBIT: 'debit',
        TENDER_DISCOUNT: 'discount',
        TENDER_EMPLOYEE: 'employee',
        TENDER_LOYALTY: 'loyalty',
        TENDER_ROOMCHARGE: 'roomcharge',
        TENDER_GENERIC1: 'generictender1',
        TENDER_GENERIC2: 'generictender2',
        TENDER_GENERIC3: 'generictender3',
        TENDER_GENERIC4: 'generictender4',
        TENDER_GENERIC5: 'generictender5',
        TENDER_GENERIC6: 'generictender6',
        TENDER_GENERIC7: 'generictender7',
        TENDER_GENERIC8: 'generictender8',
        TENDER_GENERIC9: 'generictender9',
        TENDER_GENERIC10: 'generictender10'

    }
    // Constructor.
function PaymentManager() {
    // The PaymentManager is started from Payment.
    // It starts up a clip to be played for the user to select the payment.
    // It then binds the buttons to that screen.
    // After the buttons are bound, clicking the buttons and the events that follow
    // (card swipes for example) control the flow of the process.
    // The button logic is in paymentButtons.js.

    // Make self synonymous with this.
    var self = this

    // Enable/disable debugging for this class.
    self._enableDebugging = true
    self._debug = function(message) {
        if (self._enableDebugging) {
            console.debug('PaymentManager: ' + message)
        }
    }

    // These were the properties from the Flash and their types.
    //self._paymentTarget = null; //:MovieClip;
    //self._paymentClips = null; //:Dictionary;
    //self._paymentXml = null; //:XMLList;
    //self._clipIndex = 0; //:Number;
    //self._nextClipIndex = 0; //:Number;		
    //self._currentClip = null; //:BasePaymentClip;
    //self._clipStack = []; //:Array;
    //self._paymentEventHandler = null; //:PaymentEventHandler;
    //self._paymentMode = ''; //:String = null;

    // Keep track of the previous clip that was played (for the back button).
    self._previousClip = null

    // Keep a reference to the current clip (HTML snippet) that is being shown.
    self._currentClip = null

    // Initialize dependencies.
    self._paymentClipFactory = new PaymentClipFactory()
    self._paymentTenderFactory = new PaymentTenderFactory()
    self._paymentButtons = new PaymentButtons(self)

    // Call a custom callback function after a clip is selected.
    self._callbackClip = '';
    self._callback = function() {

    }

    //
    // Public methods
    //
    self.reset = function() {
        self._previousClip = null
        if (self._currentClip !== null) {
            self._currentClip.hide()
        }
        self._currentClip = null
    };

    // Leave the current clip, and go to a specified clip/snippet of HTML. 
    self.gotoClip = function(clipId) {
        self._debug('Going to clip ' + clipId)

        // If there is already a clip being shown ...
        if (self._currentClip) {
            self._currentClip.hide()
                // mark it as the previous clip before be go to the next clip.
            self._previousClip = self._currentClip
        }

        // Then go to the next clip. Pass in the callback after the clip has received all the data from the user,
        // for something like a MSR card swipe.
        var nextClip = self._paymentClipFactory.createPaymentClip(clipId)
        if (nextClip) {
            // Wire up any buttons that are found on the clip.
            self._paymentButtons.initialize()

            // Show the clip.
            nextClip.show()
            if (nextClip.hasOwnProperty('defaultVoiceover') &&
                nextClip.defaultVoiceover.length > 0) { // TODO: need to get the voiceover override from htmltheme.xml
                _nex.assets.soundManager.playVoiceover(nextClip.defaultVoiceover)
            }

            // Call the custom callback if appropriate.
            if (self._callbackClip === clipId) {
                console.log('paymentManager.gotoClip: Calling custom callback because ' + self._callbackClip + ' is ' + clipId)
                self._callback()
            }

            // If they click anywhere in payment and they are in the previewer, shortcut to complete.
            if (inPreviewer() && !_nex.inAdvancedMode) {
                $('#wrap').click(function() {
                    $('#wrap').unbind('click')
                    self._debug('In the previewer... going right to complete.')
                    _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.COMPLETE, function() {
                        _nex.complete.start()
                    })
                })
            }
        }

        // Set the current clip to the clip we are on.
        self._currentClip = nextClip

        if (_nex.kviReader) {
            _nex.kviReader.payment()
        }
    }

    // Go back to the previous clip.
    self.previousClip = function() {
        if (!self._previousClip) {
            return false
        }
        self._currentClip.hide()
        self._previousClip.show()
        self._currentClip = self._previousClip
        self._previousClip = false
        return true
    };

    // A callback can be registered when going to a specific clip.
    self.registerCallback = function(clipid, callback) {
        self._callbackClip = clipid
        self._callback = callback
    };

    // Update the receipt specific to payment.
    self.updateReceipt = function() {
        // This is a slimmed down version of the ordering receipt.
        var receipt = $('#receipt')

        if (receipt.length > 0) {
            self._debug('Found the payment receipt... Updating it...')
            if (_nex.context === 'UX') {
                $('#receipt').attr('tabindex', 2)
            }

            if (_nex.orderManager.currentOrder.totals.remainingbalance !== undefined) {
                var remainingBalance = _nex.orderManager.currentOrder.totals.remainingbalance()
                var correctedTotal = correctMathError(Number(remainingBalance))
                if (correctedTotal > 0) {
                    var state = 'visible';
                    var pulldownScript = ($('#receiptItemTemplate').length > 0) ? '_nex.ordering.showPulldownReceipt()' : '';
                    var updatedTotal = Number(correctedTotal)
                    if (updatedTotal > 0) {
                        var totalText = receipt.find('#txtTotal')
                        if (totalText.length > 0) {
                            self._debug('Updating txtTotal on the payment receipt')
                            totalText.empty()
                            totalText.append(currency.formatAsDollars(updatedTotal, true))
                            self._debug('Showing receipt')
                            $('.order-receipt').css('visibility', 'visible') // sometimes there is CSS that initially hides it... show it
                        } else {
                            self._debug('No txtTotal on the payment receipt')
                        }
                    }
                }
            }
        } else {
            self._debug('No payment receipt')
        }
    }
}
// Constructor
function PaymentTenderFactory() {
    var createPaymentTender = function(tenderId) {
        var result = null
        var constants = paymentConstants
        switch (tenderId) {
            case constants.TENDER_CASH:
                result = new TenderCash()
                break;
            case constants.TENDER_COUNTER:
                result = new TenderCounter()
                break;
            case constants.TENDER_COUPON:
                result = new TenderCoupon()
                break;
            case constants.TENDER_CREDIT:
                result = new TenderCredit()
                break;
            case constants.TENDER_DEBIT:
                result = new TenderDebit()
                break;
            case constants.TENDER_DISCOUNT:
                result = new TenderDiscount()
                break;
            case constants.TENDER_EMPLOYEE:
                result = new TenderEmployee()
                break;
            case constants.TENDER_LOYALTY:
                result = new TenderLoyalty()
                break;
            case constants.TENDER_ROOMCHARGE:
                result = new TenderRoomCharge()
                break;
            default:
                throw 'PaymentFactory: Unknown tender type ' + tenderId
        }
        return result


    };
}
// Shows the complete screen.
// Brings the user back to the splash screen if they click ok, or 10 seconds goes by.
function Complete(completeParams) {
    var self = this
    self.timer = null

    self.debugEnabled = false
    self.debug = function() {
        if (self.debugEnabled) {
            console.debug('Complete phase', arguments)
        }
    }

    self.orderIsDriveThruOrder = function() {
        return _nex.manager.theme.kiosk.PAYMENTPROFILE.ORDERTYPE.hasOwnProperty('drivethruflag') && _nex.manager.theme.kiosk.PAYMENTPROFILE.ORDERTYPE.drivethruflag === 'true';
    }

    self.startTimer = function() {
        if (self.timer) {
            self.timer.stop()
            self.timer = null
        }
        self.timer = new TimeoutTimer(this, this.gotoSplash, 10)
        self.timer.start()
    };

    self.stopTimer = function() {
        if (self.timer) {
            self.timer.stop()
            self.timer = null
        }
    }

    self.start = function() {
        self.debug('Starting complete phase')
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.COMPLETE)
        _nex.communication.send(new _nex.commands.ProcessPrint(_nex.orderManager.currentOrder))

        self.startTimer()

        var completeScreen = $('#complete')
        if (completeScreen.length > 0) {
            var hitArea = $('#complete-hitarea')
            if (hitArea.length > 0) {
                hitArea.unbind('click')
                hitArea.click(function() {
                    self.debug('complete hitarea clicked')
                    self._completeClicked(hitArea)
                })
            }
            var attributetype = 'COMPLETE';
            if (self.orderIsDriveThruOrder()) {
                attributetype = 'DTCOMPLETE';
            }

            var defaultText = 'Pick Up Your Order When Your Number Is Called';

            var orderNumber = _nex.ordering.order.ordernumber
            var orderNumberMaxLength = (_nex.assets.theme.system.hasOwnProperty('ordernumberlength') && (_nex.assets.theme.system.ordernumberlength.toString().length > 0)) ? Number(_nex.assets.theme.system.ordernumberlength.toString()) : 2
            var orderNumberLength = _nex.ordering.order.ordernumber.length
            if (orderNumberLength > orderNumberMaxLength) {
                orderNumber = _nex.ordering.order.ordernumber.substr(orderNumberLength - orderNumberMaxLength, orderNumberMaxLength)
            }
            $('#ordernumbermessage').empty()
            $('#ordernumbermessage').append(_nex.assets.theme.getTextAttribute(attributetype, 'ordernumber', 'Your Order Number Is'))

            $('#ordernumber').empty()
            $('#ordernumber').append(orderNumber || '00')

            // set the message text based on the final tender
            var finalTenderType = (_nex.orderManager.currentOrder.tenderResults.length > 0) ? _nex.orderManager.currentOrder.tenderResults[_nex.orderManager.currentOrder.tenderResults.length - 1].tendertype : '';
            var tenderMessage = self._getTenderMessage(finalTenderType)

            var messageContainer = $('#ordercomplete')
            var completeMessage = $('#completemessage')
            if (completeMessage.length > 0) {
                // determine the tender id of the final tender
                // not a bug, but a really interesting approach!  This just points at the ATTRIBUTE of "COMPLETE" so IE complete element,  "paymentmessage" attrib -Trey
                var tenderText = (tenderMessage !== null) ? tenderMessage.dineintext : 'paymentmessage';

                if (finalTenderType.length === 0) {
                    tenderText = 'localmessage';
                    tenderMessage = 'WILL BE READY IN APPROXIMATELY';
                } else if ((_nex.orderManager.currentOrder.togo) &&
                    (tenderMessage !== null)) {
                    tenderText = tenderMessage.togotext
                    defaultText = 'Please Take Your Receipt To The Cashier For Payment';
                }

                completeMessage.empty()
                if (_nex.orderManager.currentOrder.ordertype === 'takeout') {
                    completeMessage.append(_nex.assets.theme.getTextAttribute(attributetype, tenderText, defaultText))
                } else if (!self.orderIsDriveThruOrder()) {
                    completeMessage.append(_nex.assets.theme.getTextAttribute(attributetype, tenderText, defaultText))
                }

                if (self.orderIsDriveThruOrder()) completeMessage.append(_nex.assets.theme.getTextAttribute(attributetype, 'drivethruendtext', ''))
                    //TODO: Make a new message that does not say to get the receipt when there is none! -Trey
            }

            // play the voice over based on the final tender
            if (tenderMessage !== null) {
                var mp3 = tenderMessage.dineinvoiceover
                if (_nex.orderManager.currentOrder.togo) {
                    mp3 = tenderMessage.togovoiceover
                }
                _nex.assets.soundManager.playVoiceover(mp3)
            }

            // For KVI, when the user tabs it stays on the order complete message.
            if (_nex.kviReader) {
                messageContainer.attr('tabindex', '1')
                _nex.kviReader.complete()
            }
        }
    }

    self.stop = function() {
        self.stopTimer()
    };

    self._getTenderMessage = function(tenderType) {
        var tenderMessage = null
        try {
            var phaseClips = _nex.assets.phaseManager.findPhaseClips(_nex.assets.phaseManager.phaseType.COMPLETE)

            for (var i = 0;
                (i < phaseClips.length) && (tenderMessage === null); i++) {
                if (phaseClips[i].hasOwnProperty('TENDER')) {
                    for (var t = 0;
                        (t < phaseClips[i].TENDER.length) && (tenderMessage === null); t++) {
                        if (phaseClips[i].TENDER[t].id === tenderType) {
                            tenderMessage = phaseClips[i].TENDER[t]
                        }
                    }
                }
            }
        } catch (err) {
            console.log(err)
        }

        return tenderMessage
    };

    self.gotoSplash = function() {
        self.debug('Leaving complete phase... Going to splash. Should stop the timer.')
        self.timer.stop()

        // Send the order usage command.
        _nex.communication.send(new _nex.commands.OrderUsage())

        // Reset button tracking.
        _nex.utility.buttonTracking.reset()

        // We don't want to go back to the splash for KVI until they unplug.
        if (_nex.kvi.active && _nex.navBar && _nex.navBar.jackedIn) {
            return
        }

        _nex.assets.soundManager.cancelVoiceover()

        _nex.ordering.resetOrder(function() {
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.SPLASH, function() {
                // clean up
                self.timer = null
            })
        })

    };

    // Helper method common to all complete buttons being clicked.
    self._trackCompleteClick = function($button) {
        // The Flash seemed to only track the Save Previous Order button. We are starting with this, but adding tracking for anytime
        // the user clicks the complete screen. If they don't click it, it will timeout, and the click won't be captured.
        // Flash:
        // ButtonTracker.Track("", "Save Previous Order", PhaseManager.CurrentPhase.PhaseId,  "", "Complete Order", 1, this);

        var COMPLETE_BUTTON_ID = ''; // Only one button currently.
        var COMPLETE_BUTTON_CONTEXT = 'Complete order';
        var COMPLETE_BUTTON_TYPE = 'complete'; // Will be translated to 1
        var MENU_ID = ''; // Menu id is not applicable.
        _nex.utility.buttonTracking.track(COMPLETE_BUTTON_ID, $button.text(), MENU_ID, COMPLETE_BUTTON_CONTEXT, COMPLETE_BUTTON_TYPE)
    };

    self._completeClicked = function($button) {
        _nex.assets.soundManager.playButtonHit()
        self._trackCompleteClick($button)
        _nex.complete.gotoSplash()
    };
}
// Constructor. Represents the receipt phase.
// If a user gets here, and green receipts are not enabled, it goes
// right to the Complete phase where the receipt will be printed.
function GreenReceipt(phaseParameters) {
    var self = this
    self.timer = null

    var HasPrinterErrorByPassed = false //gets set to true if the printer is offline, but green receipts are enabled
        // Guard against missing parameters.
    if (!phaseParameters) {
        console.log('ERROR: GreenReceipt requires parameters')
    }
    if (!phaseParameters.theme) {
        console.log('ERROR: GreenReceipt requires parameters theme')
    }

    // Use the theme for checking if green receipts are enabled. Passed in like other phases.
    self._theme = phaseParameters.theme

    var debugEnabled = false
    self.debug = function() {
        if (debugEnabled) {
            console.debug('GreenReceipt', arguments)
        }
    }

    // Start the timer.
    self.startTimer = function() {
        self.debug('!!!Starting green receipt timer')
        var timeout = self._getTimeoutSeconds()
        self.debug('greenReceipt - setting timeout to ' + timeout)
        if (self.timer) {
            self.timer.stop()
            self.timer = null
        }
        self.timer = new TimeoutTimer(this, self.printReceipt, timeout)
        self.timer.start()
    };

    // Stop the timer.
    self.stopTimer = function() {
        if (self.timer) {
            console.log('!!!Stopping green receipt timer')
            self.timer.stop()
            self.timer = null
        }
    }

    // Called when this phase begins.
    self.start = function() {
        console.debug('GreenReceipt: Start green receipt phase')
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.COMPLETING)

        self.startTimer()

        // If green receipt is enabled:
        if (self._greenReceiptEnabled()) {
            // Bind the options.
            self._bindOptions()
            if (_nex.assets.theme.system.RECEIPT.hasOwnProperty('receiptshowsendemailoption') && _nex.assets.theme.system.RECEIPT.receiptshowsendemailoption.toLowerCase() !== 'true') {
                document.getElementById('button1').style.display = 'none';
            }
            if (_nex.assets.theme.system.RECEIPT.hasOwnProperty('receiptshowsendsmsoption') && _nex.assets.theme.system.RECEIPT.receiptshowsendsmsoption !== 'true') {
                var element = document.getElementById('button3')
                if (element.length > 0) {
                    element.style.display = 'none';
                }
            }
        } else {
            // Go to the complete phase.
            self._gotoComplete()
        }
    }

    self.stop = function() {
        self.stopTimer()
    };

    // public enum ReceiptDelivery : int
    // {
    //    Print = 0,
    //    Email = 1,
    //    None = 2
    // }

    // Called when print receipt is pushed.
    self.printReceipt = function() {
        _nex.orderManager.currentOrder.receiptFormat = _nex.orderManager.receiptFormatType.PAPER
            // Go to the complete phase.
        self._gotoComplete()
    };

    // Called when email receipt is pushed.
    self.emailReceipt = function() {
        self._hideReceiptChoices()
        self._popupEmail()
    };

    // Called when no receipt is pushed.
    self.noReceipt = function() {
        _nex.orderManager.currentOrder.receiptFormat = _nex.orderManager.receiptFormatType.NONE
            // Go to the complete phase.
        self._gotoComplete()
    };

    // called when SMS/Text receipt is Pushed.
    self.smsReceipt = function() {
        self._hideReceiptChoices()
        self._popupPhone()
    };

    // Called when asking the user for their email address.
    self._popupEmail = function() {
        // Get the popup object.
        var popupString = 'emailPopup';
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString])
        popup.buttons[0].clickEvent = '_nex.greenReceipt.saveEmail()';
        popup.buttons[1].clickEvent = '_nex.greenReceipt.cancelEmail()';

        // Show the popup.
        _nex.assets.popupManager.showPopup(popup)

        // Bind the keys.
        _nex.keyboard.keypad.bindKeys()

        //set initial email if it exists
        _nex.keyboard.keypad.updateText(_nex.orderManager.currentOrder.customer.email)

        // The keypad needs tab indexes for visually impaired
        _nex.keyboard.keypad.setKVI()
    };

    // User clicked 'save' on the email screen.
    self.saveEmail = function() {
        // console.debug("Saving email");
        _nex.orderManager.currentOrder.receiptFormat = _nex.orderManager.receiptFormatType.EMAIL
        _nex.orderManager.currentOrder.customer.email = _nex.keyboard.keypad.data
            // Go to the complete phase.
        self._gotoComplete()
    };

    // User clicked 'cancel' on the email screen.
    self.cancelEmail = function() {
        self._showReceiptChoices()
    };

    // Check whether or not green receipt is enabled.
    self._greenReceiptEnabled = function() {
        var result = false
        var theme = self._theme
        var system = theme.system
            // console.debug("Checking green receipt");
        if (system && system.RECEIPT && system.RECEIPT.greenreceipt) {
            self.debug('green receipt element is present.')
            var greenReceiptFlag = system.RECEIPT.greenreceipt
            if (greenReceiptFlag.toLowerCase() === 'true') {
                self.debug('green receipt element is present and enabled.')
                result = true
            } else {
                console.debug('Green receipt element is present and set to ' + system.RECEIPT.greenreceipt)
            }
        }
        return result
    };

    // Go to the complete phase.
    self._gotoComplete = function() {
        self.stop()
        self.debug('Changing phase to complete.')
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.COMPLETE, function() {
            _nex.complete.start()
        })
    };

    // Helper method common to all green receipt buttons being clicked.
    self._trackReceiptClick = function(selectedButtonText) {
        // Flash:
        // ButtonTracker.Track("", selectedButton, PhaseManager.CurrentPhase.PhaseId, "", "Receipt", 3, this);

        var BUTTON_ID = ''; // Following along with the Flash, the button id is always blank for green receipt phase.
        var MENU_ID = ''; // Menu id is not applicable in the green receipt phase.
        var BUTTON_CONTEXT = 'Receipt';
        var BUTTON_TYPE = 'green'; // The button type is green, which will be translated to 3.
        _nex.utility.buttonTracking.track(BUTTON_ID, selectedButtonText, MENU_ID, BUTTON_CONTEXT, BUTTON_TYPE)
    };
    // Button click handlers.
    self._noReceiptClicked = function($button) {
        self._trackReceiptClick('No Receipt')
        self.noReceipt()
    };
    self._emailReceiptClicked = function($button) {
        self._trackReceiptClick('Email Receipt')
        self.emailReceipt()
    };
    self._printReceiptClicked = function($button) {
        self._trackReceiptClick('Paper Receipt')
        self.printReceipt()
    };
    self._smsReceiptClicked = function($button) {
        self._trackReceiptClick('SMS Receipt')
        self.smsReceipt()
    };

    // Helper to return the number of seconds before jumping to the next screen.
    self._getTimeoutSeconds = function() {
        var timeout = 11
        if (self._theme && self._theme.system && self._theme.system.RECEIPT) {
            if (self._theme.system.RECEIPT.greenreceipttimeout) {
                var newTimeout = parseInt(self._theme.system.RECEIPT.greenreceipttimeout)
                if (!isNaN(newTimeout)) {
                    timeout = newTimeout
                }
            }
        }
        return timeout
    };

    // Setup what happens when the user clicks the buttons.
    self._bindOptions = function() {
        // Update the text on the buttons to what is in kiosk text.
        self._updateReceiptText()

        // Send the user forward if they don't choose in a certain period of time.
        self.startTimer()

        // Setup the click events.
        $('#button0').unbind('click')
        $('#button0').click(function() {
            self.stopTimer()
            self._printReceiptClicked($('#button0'))
        })
        $('#button1').unbind('click')
        $('#button1').click(function() {
            self.stopTimer()
            self._emailReceiptClicked($('#button1'))

        })
        $('#button2').unbind('click')
        $('#button2').click(function() {
            self.stopTimer()
            self._noReceiptClicked($('#button2'))
        })
        $('#button3').unbind('click')
        $('#button3').click(function() {
                self.stopTimer()
                self._smsReceiptClicked($('#button3'))

            })
            //hide "print" button if the printer is offline,otherwise show it!  -Trey
        if (self.HasPrinterErrorByPassed) {
            $('#button0').hide()
        } else {
            $('#button0').show()
        }
    }

    // Hide the receipt choices dialog.
    self._hideReceiptChoices = function() {
        var element = $('#clip-choices')
        element.hide()
    };

    // Show the receipt choices dialog.
    self._showReceiptChoices = function() {
        var element = $('#clip-choices')
        element.show()
    };

    // Get the text to use for the green receipt.
    self._updateReceiptText = function() {
        var kioskText = self._theme.kioskText
        if (kioskText) {
            var receiptText = kioskText.RECEIPTTEXT
            if (receiptText) {
                var greenreceiptheader = receiptText.greenreceiptheader ? receiptText.greenreceiptheader : 'Consider the Environment';
                var greenreceiptno = receiptText.greenreceiptno ? receiptText.greenreceiptno : 'No Receipt';
                var greenreceiptemail = receiptText.greenreceiptemail ? receiptText.greenreceiptemail : 'Email Receipt';
                var greenreceiptsms = receiptText.greenreceiptsms ? receiptText.greenreceiptsms : 'Text Receipt';
                var greenreceiptpaper = receiptText.greenreceiptpaper ? receiptText.greenreceiptpaper : 'Paper Receipt';
                $('#receiptText').html(greenreceiptheader)
                $('#button2').html(greenreceiptno)
                $('#button1').html(greenreceiptemail)
                $('#button0').html(greenreceiptpaper)
                $('#button3').html(greenreceiptsms)
            }
        }
    }

    self._popupPhone = function() {
        // Get the popup object.
        var popupString = 'phonepadPopup';
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString])

        // For some reason, setting the message wipes out the rest of the page.
        popup.message = _nex.assets.theme.getTextAttribute('PREVIOUSORDERS', 'instructions2', 'Please Enter Phone Number')
            // Bind methods to call when they hit the buttons.
        popup.buttons[1].clickEvent = '_nex.greenReceipt.cancelEmail()';
        popup.buttons[1].text = _nex.assets.theme.getTextAttribute('PREVIOUSORDERS', 'popupclear', 'CANCEL')

        // Show the popup.
        _nex.assets.popupManager.showPopup(popup)

        // When they hit the final digit of their phone number, continue on.
        var lastDigitCallback = function() {
            _nex.orderManager.currentOrder.receiptFormat = _nex.orderManager.receiptFormatType.SMS
            _nex.orderManager.currentOrder.smsNumber = _nex.keyboard.phonepad.data
                // Go to the complete phase.
            _nex.assets.popupManager.hidePopup(popup, function() {
                self._gotoComplete()
            })

        };
        _nex.keyboard.phonepad.bindKeys(lastDigitCallback)
    };
}
/**
 * OrderingUX extends the common ordering phase with UX specific methods.
 * @constructor
 */
function OrderingUX(orderingParams) {
    var self = this
    Ordering.call(self, orderingParams)

    self.currentPopover = null
    self.isOrderReview = false
    self._nudgeTimer = null

    // Note: Other properties are in the common ordering class.

    // There is a start in UX and NEXTEP Mobile. It is different in UX though.
    self.start = function(tagName) {
        self.startMenu = 1
        $('#ordering #controlbuttons').hide()
            // send kiosk status
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.ORDERING)

        if (self.addToOrderResponseListener) {
            _nex.communication.removeListener(self.addToOrderResponseListener)
        }
        self.addToOrderResponseListener = _nex.communication.createListener('ADDTOORDERRESPONSE', self.commandReceived)
        _nex.communication.addListener(self.addToOrderResponseListener)

        if (self.removeFromOrderResponseListener) {
            _nex.communication.removeListener(self.removeFromOrderResponseListener)
        }
        self.removeFromOrderResponseListener = _nex.communication.createListener('REMOVEFROMORDERRESPONSE', self.commandReceived)
        _nex.communication.addListener(self.removeFromOrderResponseListener)


        self.order = self.orderManager.currentOrder
        self.menus = $.extend(true, [], self.theme.menus)

        // If a specific menu tag was not specified, load the start menu;
        // otherise, jump to the menu specified.
        if (!tagName) {
            self.loadMenu()
        } else {
            var menuId = self.findMenuByTag(tagName)
            self.loadMenu(menuId)
        }

        self.updateControlButtons()
        $('#ordering #controlbuttons').show()
    };

    // Stop is particular to UX.
    self.stop = function() {
        // Say we stop the phase early because we are going offline, for example.
        // Make sure we stop listening.
        if (self.addToOrderResponseListener !== null) {
            _nex.communication.removeListener(self.addToOrderResponseListener)
        }
        if (self.removeFromOrderResponseListener !== null) {
            _nex.communication.removeListener(self.removeFromOrderResponseListener)
        }
    }

    // Only in UX
    // Returns true if the string or number is numeric.
    function isNumeric(num) {
        // One way check if a variable (including a string) is a number, is to check check if it is not NaN.
        return !isNaN(num)
    }

    // Only in UX
    self.commandReceived = function(commandName, result) {
        if (commandName === 'ADDTOORDERRESPONSE' || commandName === 'REMOVEFROMORDERRESPONSE') {
            self.pending = false
                // var result = (typeof data === "string") ? JSON.parse(data) : data; // TODO - update NEXTEP Mobile to pass in the parsed result
            if (result.responseReceived === 'true') {
                self.order.update(result.ORDER)

                if (commandName === 'REMOVEFROMORDERRESPONSE') {
                    // remove from the menu stack
                    for (var i = 0; i < self.posidsRemoved.length; i++) {
                        self.menustack[self.menustack.length - 1].removePosid(self.posidsRemoved[i])
                    }
                }

                if (self.orderUpdated) {
                    self.orderUpdated()
                }

                self.updateReceipt()
            }
        } else {
            console.log('ordering.commandReceived - Unexpected command: ' + commandName)
        }
    }

    // Only in UX
    self.trackClick = function(buttonName, buttonText) {
        // The button name can be split to extract out the button index.
        var buttonIndex = '';
        if (buttonName) {
            var buttonNameParts = buttonName.split('-')

            if (buttonNameParts.length >= 3) {
                buttonIndex = Number(buttonNameParts[2])
                if (isNumeric(buttonIndex)) {
                    // Following along with the Flash, add one to the button index.
                    buttonIndex = buttonIndex + 1
                } else {
                    buttonIndex = '';
                }
                // console.debug("setting button index to " + buttonIndex);
            }
        } else {
            console.debug('Unable to get info for button ' + buttonName)
        }
        var currentMenuId = self.currentMenuId // equivalent to self.currentMenu.id
        var menuContext = self.currentMenu.title
        var BUTTON_TYPE = 'menu'; // will be translated to 0
        _nex.utility.buttonTracking.track(buttonIndex, buttonText, currentMenuId, menuContext, BUTTON_TYPE)
    };

    // Helper function to get a price override.
    self.getPrice = function() {
        // Overwrite this method outside of here to allow custom price overrides.
        return '';
    }

    // Changed for UX vs NEXTEP Mobile
    self.addToOrder = function(posid, priceLevel, buttonName, nextMenu, callback, isscanned) {
        // send ADDTOORDER to the server
        if (!self.pending) {
            self.pending = true // prevent multiple clicks
            var pricedBy = _nex.assets.templateManager.templatePricedBy(self.currentMenu.template)
            var buttonInfo = self.getButtonInfo(buttonName)
            var priceOverride = _nex.assets.templateManager.getPriceOverride(self.currentMenu.template, posid)

            _nex.communication.send(new _nex.commands.AddToOrder(posid, priceLevel, '1', self.currentMenuId, (self.menustack.length - 1), self.currentMenu.upsell, pricedBy, buttonInfo, isscanned, priceOverride), function(result) {
                self.pending = false
                    // var result = (typeof data === "string") ? JSON.parse(data) : data; // TODO - update NEXTEP Mobile to pass in the parsed result
                if (result.responseReceived === 'true') {
                    if (result.added !== 'true') {
                        self.menustack[self.menustack.length - 1].removePosid(posid)
                    } else {
                        // add the posid to the menustack so it can be removed when the back button is pressed
                        self.menustack[self.menustack.length - 1].posids.push(posid)
                    }

                    if (self.orderUpdated !== undefined) {
                        self.orderUpdated()
                    }

                    if (nextMenu !== undefined) {
                        self.loadMenu(nextMenu)
                    }
                }

                if (callback !== undefined) {
                    callback(result)
                }
            }, 'ADDTOORDERRESPONSE')
        }
    }

    // Go into the previousOrders phase. If previousOrders aren't configured, it will skip ahead to the ordering phase.
    self.gotoPreviousOrders = function() {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PREVIOUS_ORDERS, function() {
            _nex.previousOrders.start()
        })
    };

    // Go from the ordering phase to the payment phase.
    self.gotoPayment = function() {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PAYMENT, function() {
            _nex.payment.start()
        })
    };

    self.popupPager = function() {
        self.hidePopupName()
        self.hidePopupPager()
        var showsplit = false
        var pagerenabled = false
        var maxLength = 3
        var minValue = -1
        var maxValue = -1

        if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== null && _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== undefined) {
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty('enabled')) {
                pagerenabled = _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.enabled.toLowerCase() === 'true';
            }
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty('maxlength') &&
                ($.isNumeric(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.maxlength))) {
                maxLength = Number(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.maxlength)
            }
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty('minvalue') &&
                ($.isNumeric(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.minvalue))) {
                minValue = Number(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.minvalue)
            }
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty('maxvalue') &&
                ($.isNumeric(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.maxvalue))) {
                maxValue = Number(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.maxvalue)
            }

            if (minValue === maxValue) {
                minValue = -1
                maxValue = -1
            }

            // override pagerenabled if not enabled for current order type
            pagerenabled = self.pagerEnabledByOrderType(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER, _nex.orderManager.currentOrder.ordertype)
        }

        // if pager is enabled....
        if (pagerenabled) {
            var popupString = 'PagerPopup';
            var popup = $.extend(true, {}, _nex.assets.popupManager[popupString])

            var defaultMessage = 'Please enter your pager number';
            if ((minValue >= 0) && (maxValue >= 0) && (minValue !== maxValue)) {
                defaultMessage = 'Please enter a number between ' + minValue.toString() + ' and ' + maxValue.toString() + '.';
            }
            popup.message = _nex.assets.theme.getTextAttribute('POSTORDERING', 'pager', defaultMessage)

            // Bind methods to call when they hit the buttons.
            _nex.ordering.pagerYesClicked = false
            _nex.ordering.pagerNoClicked = false
            popup.buttons[0].clickEvent = '_nex.ordering.pagerYesClicked = true;'; //
            popup.buttons[1].clickEvent = '_nex.ordering.pagerNoClicked = true;'; // "";

            _nex.keyboard.pagerpad.setMaxLength(maxLength)
            _nex.keyboard.pagerpad.setMinValue(minValue)
            _nex.keyboard.pagerpad.setMaxValue(maxValue)
            _nex.keyboard.pagerpad.setPopup(popup)
            popup.onShowCallback = _nex.keyboard.pagerpad.bindKeys

            if (!self.isPagerNumberDisabled()) {
                _nex.assets.popupManager.showPopup(popup, function() {
                    if (_nex.ordering.pagerYesClicked) {
                        _nex.ordering.popupName()
                    }
                })
            } else {
                _nex.ordering.popupName()
            }
        } else {
            // pager turned off skip
            _nex.ordering.gotoPayment()
        }
    }

    //only enable pager if it is enabled for order type
    self.pagerEnabledByOrderType = function(pager, orderType) {
        if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== null && _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== undefined) {
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty('enabled') &&
                _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.enabled.toLowerCase() === 'true') {
                if (orderType === 'delivery' && pager.hasOwnProperty('enableddelivery')) {
                    return pager.enableddelivery === 'true';
                }
                if (orderType === 'dinein' && pager.hasOwnProperty('enableddinein')) {
                    return pager.enableddinein === 'true';
                }
                if (orderType === 'drivethru' && pager.hasOwnProperty('enableddrivethru')) {
                    return pager.enableddrivethru === 'true';
                }
                if (orderType === 'takeout' && pager.hasOwnProperty('enabledfortakeout')) {
                    return pager.enabledfortakeout === 'true';
                }
            }
        }

        return false
    };

    self.popupName = function() {
        var showsplit = self.isPagerSplit()
        _nex.keyboard.namepad.data = ''
        console.debug('Pager name split ' + showsplit)

        var minLength = 1
        var maxLength = 50

        if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== null && _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== undefined) {
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty('minguestlength') &&
                ($.isNumeric(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.minguestlength))) {
                minLength = Number(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.minguestlength)
            }
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty('maxguestlength') &&
                ($.isNumeric(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.maxguestlength))) {
                maxLength = Number(_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.maxguestlength)
            }

            if (minLength === maxLength) {
                minLength = 1
                maxLength = 50
            }
        }
        console.debug('Pager name split ' + showsplit)
            //if pager is enabled and so is the setting to split name and pager...
        if (showsplit && !self.isPagerNameDisabled()) {
            var popupString = 'NamePopup';
            var popup = $.extend(true, {}, _nex.assets.popupManager[popupString])
            popup.message = _nex.assets.theme.getTextAttribute('POSTORDERING', 'name', 'Please enter your name')

            _nex.ordering.nameYesClicked = false
            _nex.ordering.nameNoClicked = false
                // Bind methods to call when they hit the buttons.
            popup.buttons[0].clickEvent = '_nex.ordering.nameYesClicked = true;';
            popup.buttons[1].clickEvent = '_nex.ordering.nameNoClicked = true;';

            _nex.keyboard.namepad.setMinLength(minLength)
            _nex.keyboard.namepad.setMaxLength(maxLength)
            _nex.keyboard.namepad.setPopup(popup)
            popup.onShowCallback = _nex.keyboard.namepad.bindKeys

            _nex.assets.popupManager.showPopup(popup, function() {
                if (_nex.ordering.nameYesClicked) {
                    _nex.ordering.gotoPayment()
                } else if (_nex.ordering.nameNoClicked) {
                    _nex.keyboard.namepad.data = ''
                }
            })
        } else {
            // no split setting, proceed to next step!
            _nex.ordering.gotoPayment()

        }
    }
    self.isPagerEnabled = function() {
        if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== null && _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER !== undefined) {
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty('enabled')) {
                return _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.enabled.toLowerCase() === 'true'
            }
        }
        return false
    };
    self.isPagerSplit = function() {
        if (self.isPagerEnabled()) {
            // no check for null on pager needed here, as we have done it in the ispagerenabled.
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty('splitpager')) {
                return _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.splitpager.toLowerCase() === 'true'
            }
        }
        return false
    };
    self.isPagerNameDisabled = function() {
        if (self.isPagerEnabled()) {
            // no check for null on pager needed here, as we have done it in the ispagerenabled.
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty('disablenamepager')) {
                return _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.disablenamepager.toLowerCase() === 'true'
            }
        }
        return false
    };
    self.isPagerNumberDisabled = function() {
        if (self.isPagerEnabled()) {
            // no check for null on pager needed here, as we have done it in the ispagerenabled.
            if (_nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.hasOwnProperty('disablenumberpager')) {
                return _nex.manager.theme.kiosk.PAYMENTPROFILE.PAGER.disablenumberpager.toLowerCase() === 'true'
            }
        }
        return false
    };
    self.hidePopupName = function(callback) {
        var popupString = 'NamePopup';
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString])
        _nex.assets.popupManager.hidePopup(popup, callback)
    };
    self.hidePopupPager = function() {
        var popupString = 'PagerPopup';
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString])
        _nex.assets.popupManager.hidePopup(popup)
    };
    // Helper method common to all control buttons being clicked in this phase.
    self._trackControlClick = function($button, context) {
        var BUTTON_INDEX = '';
        var buttonText = $button.text()
        var currentMenuId = self.currentMenuId
        var menuContext = context
        var BUTTON_TYPE = 'control'; // will be translated to 0
        _nex.utility.buttonTracking.track(BUTTON_INDEX, buttonText, currentMenuId, menuContext, BUTTON_TYPE)
        self.resetNudge()
    };

    // Button click handlers. Track the button click and then perform the action.
    self._addItemClicked = function($button) {
        self._trackControlClick($button, 'Add Item')
        _nex.assets.soundManager.playButtonHit()
        _nex.ordering.addItem()
    };

    self._backButtonClicked = function($button) {
        self._trackControlClick($button, 'Back')
        _nex.assets.soundManager.playButtonHit()
        _nex.ordering.goBack()
    };

    self._cancelButtonClicked = function($button) {
        self._trackControlClick($button, 'Cancel')
        _nex.assets.soundManager.playButtonHit()

        _nex.ordering.cancelOrderPrompt()
    };

    self._continueButtonClicked = function($button) {
        self._trackControlClick($button, 'Continue')
        _nex.assets.soundManager.playButtonHit()
        self.stopNudge()
        _nex.ordering.gotoNextMenu()
    };

    self._reviewButtonClicked = function($button) {
        self._trackControlClick($button, 'Review')
        _nex.assets.soundManager.playButtonHit()
        _nex.ordering.gotoOrderReview()
    };

    // self._doneButtonClicked = function ($button) {
    //    self._trackControlClick($button, "Done");
    //    _nex.assets.soundManager.playButtonHit();

    //    // The goal here is when they click done, show the dine in or carry out prompt just like the Flash;
    //    // then afterward show the pager popup (or pager name popup).
    //    _nex.keyboard.pagerpad.data = "";
    //    _nex.keyboard.namepad.data = "";
    //    var callback = _nex.ordering.popupPager;
    //    self._dineInOrCarryOut(callback);

    // };
    self._doneButtonClicked = function($button) {
        self._trackControlClick($button, 'Done')
        _nex.assets.soundManager.playButtonHit()

        // The goal here is when they click done, show the dine in or carry out prompt just like the Flash;
        // then afterward show the pager popup (or pager name popup).
        _nex.keyboard.pagerpad.data = '';
        _nex.keyboard.namepad.data = '';
        // var callback = _nex.ordering.popupPager;
        // self._dineInOrCarryOut(callback);
        _nex.ordering.gotoPayment()

    };

    // Set the order type.
    self._setOrderType = function(userPicked, driveThruFlag, takeoutFlag, dineinFlag) {
        if (!userPicked) {
            // if the user did not pick the value set the type based on settings
            _nex.orderManager.togo = (driveThruFlag) ? true : takeoutFlag

            if (driveThruFlag) {
                _nex.orderManager.currentOrder.ordertype = 'drivethru';
            } else if (takeoutFlag) {
                _nex.orderManager.currentOrder.ordertype = 'takeout';
            } else if (dineinFlag) {
                _nex.orderManager.currentOrder.ordertype = 'dinein';
            }
        } else {
            // if the user picked the value set the type based on that
            if (_nex.orderManager.currentOrder.togo) {
                _nex.orderManager.currentOrder.ordertype = 'takeout';
            } else {
                _nex.orderManager.currentOrder.ordertype = 'dinein';
            }
        }
        console.log('Togo is now ' + _nex.orderManager.currentOrder.togo + ' and order type is ' + _nex.orderManager.currentOrder.ordertype)
    };

    // Set the togo flag.
    self._dineInOrCarryOut = function(callback) {
        // This code is modeled after the Flash.
        _nex.orderManager.currentOrder.togoSet = false
        _nex.orderManager.currentOrder.ordertypeSet = false
        _nex.orderManager.currentOrder.togo = false
        var orderTypeNode = null
        var takeoutFlag = false
        var dineinFlag = false
        var driveThruFlag = false
        var dicoPopup = null

        if (_nex.assets.theme.kiosk.PAYMENTPROFILE.hasOwnProperty('ORDERTYPE')) {
            orderTypeNode = _nex.assets.theme.kiosk.PAYMENTPROFILE.ORDERTYPE
            if (orderTypeNode.constructor === Array) {
                orderTypeNode = orderTypeNode[0]
            }
        }

        if (orderTypeNode) {
            if (orderTypeNode.hasOwnProperty('takeoutflag')) {
                takeoutFlag = orderTypeNode.takeoutflag.toLowerCase() === 'true';
            }
            if (orderTypeNode.hasOwnProperty('dineinflag')) {
                dineinFlag = orderTypeNode.dineinflag.toLowerCase() === 'true';
            }
            if (orderTypeNode.hasOwnProperty('drivethruflag')) {
                driveThruFlag = orderTypeNode.drivethruflag.toString().toLowerCase() == 'true';
            }
        }

        if ((takeoutFlag && dineinFlag) || (_nex.orderManager._forceDicoPrompt)) {
            // This is modeled after NEXTEP Mobile.
            dicoPopup = $.extend(true, {}, _nex.assets.popupManager.dicoPopup)
            dicoPopup.message = _nex.assets.theme.getTextAttribute('ORDERREVIEW', 'dicomessage', '')
            dicoPopup.buttons[0].clickEvent = '_nex.orderManager.currentOrder.togo = false;';
            dicoPopup.buttons[1].clickEvent = '_nex.orderManager.currentOrder.togo = true;';
            _nex.assets.popupManager.showPopup(dicoPopup, function() {
                _nex.orderManager.currentOrder.togoSet = true // set a flag so we know the user actually picked the value
                self._setOrderType(true, driveThruFlag, takeoutFlag, dineinFlag)
                callback()
            })
        } else {
            self._setOrderType(false, driveThruFlag, takeoutFlag, dineinFlag)
            callback()
        }
    }

    self._popoverHitTest = function(e) {
        if (self.currentPopover !== null) {
            //  plugin call
            var hit = self.currentPopover.hitTestPoint({ 'x': e.pageX, 'y': e.pageY, 'transparency': true })
            self.currentPopover.data('keepshowing', (hit) ? 'true' : 'false')
        }
    }

    // Different in NEXTEP Mobile vs UX
    self.updateControlButtons = function() {
        if (self.currentMenu.hasOwnProperty('startmenu') &&
            (self.currentMenu.startmenu.toString().toLowerCase() === 'true')) {
            self.startMenu = self.currentMenuId
        }

        var template = _nex.assets.templateManager.findTemplate(self.currentMenu.template)
        var addItemVisible = false

        // update add item
        var btnAddItem = $('#ctrl-add-item')
        if (btnAddItem.length > 0) {
            if ((template !== null) &&
                (template.additembutton !== undefined) &&
                (template.additembutton.toString().toLowerCase() === 'true')) {
                addItemVisible = true

                btnAddItem.removeClass('control-button-hidden')
                var addItemText = _nex.assets.theme.getTextAttribute('ORDERREVIEW', 'addanother', '')
                if (addItemText.length === 0) {
                    addItemText = self.theme.getTextAttribute('ORDER', 'addanother', 'ADD ITEM')
                }

                self.theme.setControlButtonText('ctrl-add-item', addItemText)
                btnAddItem.attr('onclick', '')
                btnAddItem.unbind('click')
                btnAddItem.click(function() {
                    self._addItemClicked(btnAddItem)
                })
            } else {
                btnAddItem.addClass('control-button-hidden')
            }
        }

        // update back button
        var btnBack = $('#ctrl-back')
        if (btnBack.length > 0) {
            var backVisible = ((self.startMenu !== self.currentMenuId) || (self.menuScrollIndex > 0 && _nex.ordering.pagination === 'moreforward'))
            if ((backVisible) && (!addItemVisible)) {
                btnBack.removeClass('control-button-hidden')
                self.theme.setControlButtonText('ctrl-back', self.theme.getTextAttribute('ORDER', 'back', 'BACK'))
                btnBack.attr('onclick', '')
                btnBack.unbind('click')
                btnBack.click(function() {
                    self._backButtonClicked(btnBack)
                })
            } else {
                btnBack.addClass('control-button-hidden')
            }
        }

        // update cancel button
        var btnCancel = $('#ctrl-cancel')
        if (btnCancel.length > 0) {
            self.theme.setControlButtonText('ctrl-cancel', self.theme.getTextAttribute('ORDER', 'cancel', 'CANCEL'))
            btnCancel.removeClass('control-button-hidden')
            btnCancel.attr('onclick', '')
            btnCancel.unbind('click')
            btnCancel.click(function() {
                self._cancelButtonClicked(btnCancel)
            })
        }

        // update continue button
        var btnContinue = $('#ctrl-continue')
        if (btnContinue.length > 0) {
            var continueVisible = false

            if ((template !== null) &&
                (template.continuemenu !== undefined) &&
                (template.continuemenu.toString().toLowerCase() === 'true')) {
                var continueMenu = (self.currentMenu.continuemenu.toString().length > 0) ? self.currentMenu.continuemenu : self.startMenu

                if (_nex.assets.templateManager.isContinueVisible(self.currentMenu) &&
                    (self.startMenu !== self.currentMenuId)) {
                    continueVisible = true
                }
            }

            if (continueVisible) {
                btnContinue.removeClass('control-button-hidden')
                if ((self.currentMenu.upsell.toLowerCase() === 'true') &&
                    (self.menustack[self.menustack.length - 1].posids.length === 0)) {
                    self.theme.setControlButtonText('ctrl-continue', self.theme.getTextAttribute('ORDER', 'nothanksbutton', 'NO, THANKS'))
                } else {
                    self.theme.setControlButtonText('ctrl-continue', self.theme.getTextAttribute('ORDER', 'continuebutton', 'CONTINUE'))
                }
                btnContinue.attr('onclick', '')
                btnContinue.unbind('click')
                btnContinue.click(function() {
                    self._continueButtonClicked(btnContinue)
                })
                self.startNudge()
            } else {
                btnContinue.addClass('control-button-hidden')
                self.stopNudge()
            }
        }

        // update order review
        var btnOrderReview = $('#ctrl-orderreview')
        if (btnOrderReview.length > 0) {
            var orderReviewVisible = ((self.startMenu === self.currentMenuId) &&
                (self.order.ITEM !== undefined) &&
                (self.order.ITEM.length > 0))
            self.theme.setControlButtonText('ctrl-orderreview', self.theme.getTextAttribute('ORDER', 'orderreview', 'DONE'))
            if (orderReviewVisible) {
                btnOrderReview.removeClass('control-button-hidden')
                btnOrderReview.attr('onclick', '')
                btnOrderReview.unbind('click')
                btnOrderReview.click(function() {
                    self._reviewButtonClicked(btnOrderReview)
                })
            } else {
                btnOrderReview.addClass('control-button-hidden')
            }
        }

        // update done button
        var btnDone = $('#ctrl-done')
        if (btnDone.length > 0) {
            var doneVisible = false
            if ((template !== null) &&
                (template.donebutton !== undefined) &&
                (template.donebutton.toString().toLowerCase() === 'true')) {
                doneVisible = true
            }

            if (doneVisible) {
                btnDone.removeClass('control-button-hidden')
                self.theme.setControlButtonText('ctrl-done', self.theme.getTextAttribute('ORDER', 'done', 'DONE'))
                btnDone.attr('onclick', '')
                btnDone.unbind('click')
                btnDone.click(function() {
                    self._doneButtonClicked(btnDone)
                })
            } else {
                btnDone.addClass('control-button-hidden')
            }
        }
    }

    // Different in NEXTEP Mobile vs UX
    // this function should only be called from the goBack function.
    self.removePreviousMenu = function() {
        // remove the previous menu and pass the id to loadMenu
        if (self.menustack.length > 0) {
            // look for menus that have been skipped
            var menuInfoObj = self.menustack.pop()
            while (menuInfoObj.skipped) {
                menuInfoObj = self.menustack.pop()
            }

            var menuRemoved = self.menus[menuInfoObj.menuId - 1]
            var template = _nex.assets.templateManager.findTemplate(menuRemoved.template)

            if (template.defaultbuttontype === 'SELECTONEMODIFIER') {
                // remove all mods on the current item which is the last on the order
                if (self.order.ITEM !== undefined) {
                    var index = self.order.ITEM.length - 1
                    self.removeMods(menuRemoved.id, index)
                }
            } else if (template.defaultbuttontype === 'SELECTONE') {
                // remove the last item on the order
                if ((menuInfoObj !== undefined) &&
                    (menuInfoObj.posids.length > 0)) {
                    // there should only be one item to remove since it is a SELECTONE
                    for (var i = 0; i < menuInfoObj.posids.length; i++) {
                        self.removeFromOrder(menuInfoObj.posids[i])
                    }
                }
            }

            // load the menu
            self.loadMenu(menuRemoved.id)
                // scroll the menu to the last viewed page of the menu
            self.menuScrollIndex = menuInfoObj.scrollIndex
            self._showPage()
        } else {
            // return the start menu
            if (self.currentMenuId !== self.startMenu) {
                self.loadMenu(self.startMenu)
            } else {
                // navigate away from the ordering process
                _nex.manager.cancelCurrentPhase()
            }
        }
    }

    // Different in NEXTEP Mobile from UX
    self.removeMultipleFromOrder = function(posids, callback) {
        if (posids.length > 0) {
            self.posidsRemoved = posids
            _nex.communication.send(new _nex.commands.RemoveFromOrder(posids))

            if (callback) {
                callback()
            }
        } else {
            if (callback !== undefined) {
                callback()
            }
        }
    }

    // This will be called from a method in common
    self.cancelOrderPromptCallback = function() {
        // Implemented differently in UX from NEXTEP Mobile
        _nex.manager.cancelCurrentPhase()
    };

    self.sendUpdateQuantity = function(index, delta, isModifier, modPosid, callback) {
        // Implemented differently in UX from NEXTEP Mobile
        _nex.communication.send(new _nex.commands.UpdateQuantity(index, delta, isModifier, modPosid), function(result) {
            if (result.responseReceived === 'true') {
                self.order.update(result.ORDER)

                if (self.orderUpdated !== undefined) {
                    self.orderUpdated()
                }

                self.updateReceipt()
            }

            if (callback !== undefined) {
                callback(result)
            }
            self.pending = false
        }, 'UPDATEQUANTITYRESPONSE')
    };

    // Implemented differently in NEXTEP Mobile compared to UX
    self.resetOrder = function(callback) {
        self.pending = true
        self.stopNudge()
            // Reset the order object on the TM if we haven't reached the complete phase yet.
        if (self.orderManager.currentOrder &&
            self.orderManager.currentOrder.hasOwnProperty('ordernumber') &&
            self.orderManager.currentOrder.ordernumber.length === 0) {
            _nex.communication.send(new _nex.commands.CancelOrder(), function(result) {
                if (result && result.responseReceived === 'true') {
                    // future use
                }

                self.updateReceipt()

                // Reset the order object on the client
                self.orderManager.resetCurrentOrder()

                // Call the callback
                self.pending = false
                if (callback !== undefined) {
                    if (result) {
                        callback(result)
                    } else {
                        callback()
                    }
                }
            }, 'CANCELORDERRESPONSE')
        } else {
            // Reset the order object on the client
            self.orderManager.resetCurrentOrder()

            // Call the callback
            self.pending = false
            if (callback !== undefined) {
                // callback(result);
                callback()
            }
        }
    }

    self.startNudge = function() {
        if (_nex.kviReader && _nex.kviReader.jackedIn()) {
            return
        }
        if (self._nudgeTimer !== null) {
            self._nudgeTimer.stop()
            self._nudgeTimer = null
        }

        var nudgeTimeout = 7
        if (_nex.assets.theme.system.USERINTERFACE.hasOwnProperty('nudgetimeout')) {
            nudgeTimeout = Number(_nex.assets.theme.system.USERINTERFACE.nudgetimeout.toString())
        }
        self._nudgeTimer = new SimpleTimer(self, self.onNudge, nudgeTimeout)
        self._nudgeTimer.start()
    };

    self.stopNudge = function() {
        $('#ctrl-continue').removeClass('nudge')
        if (self._nudgeTimer !== null) {
            self._nudgeTimer.stop()
        }
        self._nudgeTimer = null
    };

    self.resetNudge = function() {
        if (self._nudgeTimer !== null) {
            self._nudgeTimer.restart()
        }
    }

    self.onNudge = function(evt) {
        try {
            _nex.assets.soundManager.playSoundByIndex(11) // nudge is 11
            $('#ctrl-continue').removeClass('nudge')
            setTimeout(function() { $('#ctrl-continue').addClass('nudge') }, 10)
        } catch (e) {}
    }

    self.loadAd = function(ad, templateName) {
        if ((ad !== undefined) && (ad !== null) && (ad.toLowerCase() !== 'empty.swf')) {
            // create an ad target
            $('#template').append("<div id='ad' ></div>")
            var adTarget = $('#template').find('#ad')
            adTarget.attr('style', "background-image: url('" + _nex.assets.theme.mediaPath() + 'banners/' + itemFormatting.buttonImage(ad) + "');")
            var classNames = 'ad';
            if (templateName !== undefined) {
                classNames += ' ' + templateName.replace(/ /g, '-') + '-ad';
            }
            adTarget.attr('class', classNames)

            $('#template').append(adTarget)
        }
    }
}

// Main payment flow.
function Payment(paymentParams) {
    // Make self synonymous with this.
    var self = this

    // Store the theme object.
    self._theme = paymentParams.theme

    // Guard against missing required parameters.
    if (!self._theme) {
        console.log('ERROR: theme not passed into the payment phase.')
    }

    // Payment uses the payment manager to show and hide clips.
    self._paymentManager = null

    // Keep track of the last selected tender.
    self.lastSelectedTender = '';

    // Whether or not to automatically charge the card that was swiped to start.
    self.autocharge = true // TODO: Find out what the setting was to autocharge a card.

    // Payment related device data.
    self.deviceData = null

    self.promptForLoyalty = function() {
        return _nex.manager.theme.kiosk.PAYMENTPROFILE.promptforrewardscard == 1
    };

    self.promptForLoyalty2 = function() {
        return _nex.manager.theme.kiosk.PAYMENTPROFILE.promptforrewardscard == 2
    };

    // Debugging for the payment phase.
    self._enableDebugging = true
    self._debug = function() {
        if (self._enableDebugging) {
            console.debug('PaymentPhase', arguments)
        }
    }


    self.reset = function(route) {
        if ((route === undefined) || (route === null)) {
            route = true
        }

        self.deviceData = null
        self.autocharge = true
            //self._removeSelectedTender(); // no longer needed
        _nex.utility.orderTimer.restart()

        if (route) {
            self._route() // skip start and go to route... start will try to autocharge again for swipe to start.
        }
    }

    // Start/restart the payment phase.
    self.start = function() {
        // Follows along with the Visio diagram for this project.
        // This is the main entry point to the payment process.
        self._debug('start')
        _nex.assets.popupManager.hideAllPopups(function() {
            $('#targets').removeClass() // make sure a class attribute for what menu we are on isn't left over from ordering

            // Setup the payment manager which will show and hide clips.
            if (!self._paymentManager) {
                self._paymentManager = new PaymentManager()
            }
            self._paymentManager.reset()

            // Remove any previously selected tender.
            // Commented out but left here for reference. Should not be needed.
            //if (self.lastSelectedTender !== "") {
            //self._removeSelectedTender();
            //self.lastSelectedTender = "";
            //}

            // Send an update of the current status.
            _nex.manager.sendStatusUpdate(_nex.manager.statusType.PAYMENT)
            if (_nex.manager.theme.paymentProfile.roundupcharityenabled === 'true') {
                _nex.orderManager.currentOrder.roundUpCharitySelected = true
                    // Send the command to calculate the total for the current order. This will take into account tax on the previous balance.
                _nex.communication.send(new _nex.commands.CalculateTotal(_nex.orderManager.currentOrder), function(result) {
                    console.log(result)
                        //self.hideProcessingPopup(function () {
                    if (result.hasOwnProperty('subtotal') && (Number(result.subtotal) !== -1)) {
                        // If we have a valid subtotal back, update the current order so we know the TotalAmountDue with tax and everything,
                        // and can show it during payment.
                        _nex.orderManager.currentOrder.update(result, false)
                        _nex.orderManager.currentOrder.totals.roundupcharity(result.roundupcharity)
                        self._popupRoundUpCharity()
                    } else {
                        self._sendCalculateTotal()
                    }
                    // });
                }, 'ORDERTOTAL')
            } else {
                self._sendCalculateTotal()
            }
        })
    };

    // Called when existing the payment phase if we go offline.
    self.stop = function() {
        if (_nex.utility.orderTimer) {
            _nex.utility.orderTimer.stop()
        }
    }

    self.showLoyaltyPrompt = function() {
        var popup = $.extend(true, {}, _nex.assets.popupManager.yesNoPopup)
        popup.message = _nex.assets.theme.getTextAttribute('PAYMENT', 'loyaltyprompt', 'Do you have a Loyalty Card?')
        popup.buttons[0].clickEvent = "console.debug('yes clicked');_nex.payment._gotoLoyaltyPrompt()"
        popup.buttons[1].clickEvent = "console.debug('no clicked');_nex.payment._route(_nex.splashPhase.userSwipedToStart, true);"
        _nex.assets.popupManager.showPopup(popup)
    };

    // self.showRewardsPrompt = function () {
    // var popup = $.extend(true, {}, _nex.assets.popupManager.yesNoPopup);
    // popup.message = _nex.assets.theme.getTextAttribute("PAYMENT", "rewardsprompt", "Do you have a Rewards Card?");
    // popup.buttons[0].clickEvent = "console.debug('yes clicked');_nex.payment._gotoRewardsPrompt()";
    // popup.buttons[1].clickEvent = "console.debug('no clicked');_nex.payment._route(_nex.splashPhase.userSwipedToStart, true);";
    // _nex.assets.popupManager.showPopup(popup);
    // };

    // Logic for routing where the user goes to based on the number of tenders.
    self._route = function(swipedToStart, containstenders) {
        // If swiped to start...
        if (swipedToStart) {
            self.swipedToStart()
            return;
        }

        // Check the number of tenders.
        // If they are >= 2, we go to select payment.
        // If they are 1, we just create that tender.
        // If they are 0, we return to order review.
        var availableTenders = self._getAvailableTenders()
        var numberOfTenders = availableTenders.length
        var tenderConfig = _nex.assets.theme.getTenderByType('loyalty')
            //var rewardsConfig = "";

        var promptForRewards = _nex.manager.theme.kiosk.PAYMENTPROFILE.promptforrewardscard !== '' && _nex.manager.theme.kiosk.PAYMENTPROFILE.promptforrewardscard !== undefined
            //var promptForNextepRewards = _nex.manager.theme.kiosk.PAYMENTPROFILE.promptfornexteprewardscard !== "" && _nex.manager.theme.kiosk.PAYMENTPROFILE.promptfornexteprewardscard !== undefined;

        var loyaltyEnabled = _nex.manager.theme.kiosk.PAYMENTPROFILE.TENDER.loyaltyflag || _nex.manager.theme.kiosk.PAYMENTPROFILE.TENDER.loyalty2flag
            //var rewardsEnabled = false;
            //if(promptForNextepRewards)
            //{
            //rewardsConfig = _nex.assets.theme.getGenericTenderByType(_nex.manager.theme.kiosk.PAYMENTPROFILE.promptfornexteprewardscard);
            //var genericTenderNum = Number(_nex.manager.theme.kiosk.PAYMENTPROFILE.promptfornexteprewardscard.substring(13));
            //if(!isNaN(genericTenderNum)) {
            //rewardsEnabled = _nex.manager.theme.kiosk.PAYMENTPROFILE.TENDER.GENERIC[genericTenderNum-1].enabled;
            //}
            //}

        if (!containstenders && // ((
            tenderConfig && promptForRewards && loyaltyEnabled) { // ||
            // (rewardsConfig && promptForNextepRewards && rewardsEnabled))
            // ) {
            // if(loyaltyEnabled && promptForRewards) {
            self.showLoyaltyPrompt()
                //} else {
                //self.showRewardsPrompt();
                //}
        } else {
            if (numberOfTenders !== undefined && numberOfTenders !== null) {
                if (numberOfTenders === 0) {
                    self._zeroPaymentOptions()
                } else if (numberOfTenders === 1) {
                    self._onePaymentOption(availableTenders[0])
                } else {
                    self._multiplePaymentOptions()
                }
            } else {
                // This should never happen.
                // Just in case, simply treat this case the same as zero payment options.
                self._zeroPaymentOptions()
            }
        }
    }

    // Called when the user swiped to start.
    self.swipedToStart = function() {
        // Support both credit and loyalty for swipe to start.
        var finalTender = _nex.splashPhase.swipeToStartAction.getTenderAdded()

        if (finalTender) {
            self._debug('swipedToStart', 'Automatically charging the credit card that was swiped to start')
            if (self.autocharge) {
                // Process the order with the tender added as the final tender.
                self._debug('Process Order with tender: ', finalTender)
                self.processOrder(finalTender)
            }
        } else {
            self._debug('swipedToStart', 'Automatically doing a loyalty inquiry. If preauthandpay is true, it will charge the card; otherwise, check first then charge the card if there are enough funds.')
            self.deviceData = _nex.splashPhase.swipeToStartAction.cardData
            var pin = _nex.splashPhase.swipeToStartAction.getPinData()
            if (self.autocharge) {
                self.loyaltyInquiry(pin)
            }
        }
    }

    // Returns true if we are using a payment device.
    self.usesPaymentDevice = function() {
        var result = false
        if (_nex.assets.theme.lastUpdate) {
            var lastUpdate = _nex.assets.theme.lastUpdate
            if (lastUpdate.usepaymentdevice && lastUpdate.usepaymentdevice.length > 0) {
                result = _nex.assets.theme.lastUpdate.usepaymentdevice.toLowerCase() === 'true';
            }
        }
        return result
    };

    // Returns true if loyalty requires a payment device.
    self.loyaltyRequiresPaymentDevice = function() {
        var result = false
        if (_nex.assets.theme.lastUpdate) {
            var lastUpdate = _nex.assets.theme.lastUpdate
            if (lastUpdate.loyaltyrequirespaymentdevice && lastUpdate.loyaltyrequirespaymentdevice.length > 0) {
                result = _nex.assets.theme.lastUpdate.loyaltyrequirespaymentdevice.toLowerCase() === 'true';
            }
        }
        return result
    };

    // Called when the user hits the 'back' button during payment.
    self.backButton = function() {
        if (self.lastSelectedTender.length > 0) {
            self._removeSelectedTender()
        }

        var routed = self._paymentManager.previousClip()
        if (!routed) {
            self._gotoOrderReview()
        }
    }

    // Called at the end.
    self.orderProcessed = function(result) {
        self._debug('enter orderProcessed with result ', result)
        self.hideProcessingPopup(function() {
            if (result.orderstatus.toLowerCase() === 'success') {
                self._debug('result is success ')
                    // set the order number for the complete phase and other phases to reference later
                _nex.ordering.order.ordernumber = result.ordernumber
                _nex.ordering.order.orderid = result.orderid
                if (result.TENDERRESULT !== undefined) {
                    _nex.ordering.order.tenderResults = result.TENDERRESULT
                }

                // if this order doesn't currently have a guestaccount or email
                // and if the orderPRocessed
                if ((_nex.orderManager.currentOrder.customer.email === null || _nex.orderManager.currentOrder.customer.email === '') &&
                    (_nex.orderManager.currentOrder.customer.guestaccountid === null || _nex.orderManager.currentOrder.customer.guestaccountid === '') &&
                    result.email !== null && result.email !== '') {
                    _nex.orderManager.currentOrder.customer.email = result.email
                    _nex.orderManager.currentOrder.customer.guestaccountid = result.guestaccountid
                }

                self.gotoPostOrdering()
            } else {
                self._debug('result is error ')
                    // remove the last tender added from the tender stack
                _nex.communication.send(new _nex.commands.RemoveTender())

                // show a generic error message.
                _nex.payment.showErrorPopup(self.textProcessingError(), function() {
                    self._gotoOrderReview()
                })
            }
        })

    };

    self.showTestPayment = function(show) {
        show = show || false
        var payment = $('#payment')
        if (show && (payment.length > 0)) {
            var testPayment = payment.find('#testpayment')
            if (testPayment.length === 0) {
                payment.append('<div id="testpayment" class="test-payment" >test payment</div>')
            }
        }
    }

    self._trackPaymentClick = function($button) {
        // Flash:
        // ButtonTracker.Track("", this.LabelText, PhaseManager.CurrentPhase.PhaseId,"", "Payment", 1, this);

        var PAYMENT_BUTTON_ID = '';
        var paymentButtonText = $button.text()
        var currentMenuId = '';
        var PAYMENT_CONTEXT = 'Payment';
        var PAYMENT_BUTTON_TYPE = 'control'; // The payment buttons are in payment/paymentButtons.js... These are the control buttons cancel and back.
        _nex.utility.buttonTracking.track(PAYMENT_BUTTON_ID, paymentButtonText, currentMenuId, PAYMENT_CONTEXT, PAYMENT_BUTTON_TYPE)
    };

    self._cancelButtonClicked = function($button) {
        _nex.assets.soundManager.playButtonHit()
        self._trackPaymentClick($button)
        _nex.ordering.cancelOrderPrompt()
    };

    self._backButtonClicked = function($button) {
        _nex.assets.soundManager.playButtonHit()
        self._trackPaymentClick($button)
        _nex.payment.backButton()
    };

    // Setup the cancel, back, and other control buttons.
    self._updateControlButtons = function() {
        // update cancel button
        var btnCancel = $('#ctrl-cancel')
        if (btnCancel.length > 0) {
            self._theme.setControlButtonText('ctrl-cancel', self._theme.getTextAttribute('ORDER', 'cancel', 'CANCEL'))
            btnCancel.removeClass('control-button-hidden')
            btnCancel.attr('onclick', '')
            btnCancel.unbind('click')
            btnCancel.click(function() {
                    self._cancelButtonClicked(btnCancel)
                })
                // skip tabbing to the 'cancel' button for Visually Impaired. Should be hidden anyways, unless they click the KVI to start button.
                // the way to cancel here is by unplugging.
            btnCancel.attr('tabindex', '-1')
        }

        // update back button
        var btnBack = $('#ctrl-back')
        if (btnBack.length > 0) {
            self._theme.setControlButtonText('ctrl-back', self._theme.getTextAttribute('ORDER', 'back', 'BACK'))
            btnBack.removeClass('control-button-hidden')
            btnBack.attr('onclick', '')
            btnBack.unbind('click')
            btnBack.click(function() {
                self._backButtonClicked(btnBack)
            })
            btnBack.attr('tabindex', '3')
        }

        var btnSkip = $('#ctrl-skip')
        if (btnSkip.length > 0) {
            btnSkip.addClass('control-button-hidden') //do not show the skip at the regular payment screen.
        }
    }

    self._hideBackButton = function() {
        var btnBack = $('#ctrl-back')
        if (btnBack.length > 0) {
            btnBack.addClass('control-button-hidden')
        }
    }

    // Go to post ordering.
    self.gotoPostOrdering = function() {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.POST_ORDERING, function() {
            self.showTestPayment(false)
            _nex.postOrdering.start()
        })
    };

    // Go to select payment.
    self._gotoSelectPayment = function() {
        self._paymentManager.gotoClip(paymentConstants.SELECTPAYMENT_CLIP)
        self._paymentManager.updateReceipt()
    };

    self._gotoLoyaltyPrompt = function() {
        self._paymentManager.gotoClip(paymentConstants.LOYALTYPROMPT_CLIP)
            //self._paymentManager.updateReceipt();
            //};

        //self._gotoRewardsPrompt = function () {
        //self._paymentManager.gotoClip(paymentConstants.REWARDSPROMPT_CLIP);
        self._paymentManager.updateReceipt()
    };

    // Go to order review.
    self._gotoOrderReview = function() {
        self.reset(false)
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function() {
            self.showTestPayment(false)
            _nex.ordering.gotoOrderReview()
            $('#ordering #controlbuttons').show()
        })
    };

    // Callback when a payment has been selected.
    // Examples:
    // Called when the user picks 'counter' for payment.
    // Called when credit is chosen, and there is an error.
    // Called when credit is chosen, and the data is valid.
    self.paymentSelected = function(result) {
        // Create the selected tender.
        self._debug('payment selected')
        if (inPreviewer() && !_nex.inAdvancedMode) {
            self._debug('Going right to complete.')
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.COMPLETE, function() {
                _nex.complete.start()
            })
        } else {
            self.createSelectedTender(result)
            if (_nex.kviReader) {
                _nex.kviReader.payment()
            }
        }
    }

    // The Round up for charity popup.
    self._popupRoundUpCharity = function() {
        var popup
        var roundUpPrompt = _nex.assets.theme.getTextAttribute('PAYMENT', 'roundupcharityprompt', 'Would you like to Round-Up for Charity?')
        if (_nex.assets.popupManager.charityYesNoPopup !== null) {
            popup = $.extend(true, {}, _nex.assets.popupManager.charityYesNoPopup)

            popup.roundUpYesAmount = currency.formatAsDollars(Number(_nex.orderManager.currentOrder.totals.amountdue()), true)
            popup.roundUpNoAmount = currency.formatAsDollars(Number(parseFloat(_nex.orderManager.currentOrder.totals.amountdue()) - parseFloat(_nex.orderManager.currentOrder.totals.roundupcharity())), true)
        } else {
            popup = $.extend(true, {}, _nex.assets.popupManager.yesNoPopup)
        }
        popup.message = roundUpPrompt
        popup.buttons[0].clickEvent = "console.debug('round up charity yes clicked');_nex.payment._roundupcharity(true);"
        popup.buttons[1].clickEvent = "console.debug('round up charity no clicked');_nex.payment._roundupcharity(false);"
        _nex.assets.popupManager.showPopup(popup)
    };

    self._roundupcharity = function(roundup) {
        _nex.orderManager.currentOrder.roundUpCharitySelected = roundup
        if (!roundup) {
            _nex.orderManager.currentOrder.totals.roundupcharity(0)
        }
        self._sendCalculateTotal()
    };

    self._sendCalculateTotal = function() {
        self.showProcessingPopup(self.textProcessingOrder())

        // Send the command to calculate the total for the current order. This will take into account tax on the previous balance.
        _nex.communication.send(new _nex.commands.CalculateTotal(_nex.orderManager.currentOrder), function(result) {
            console.log(result)
            self.hideProcessingPopup(function() {
                if (result.hasOwnProperty('subtotal') && (Number(result.subtotal) !== -1)) {
                    // If we have a valid subtotal back, update the current order so we know the TotalAmountDue with tax and everything,
                    // and can show it during payment.
                    _nex.orderManager.currentOrder.update(result, false)

                    // If we get to here, invoke the routing logic to decide whether we go back to
                    // ordering (which should take us to order review), show select tender screen, etc.
                    self.showTestPayment(_nex.assets.theme.testMode)
                    var swipedToStart = _nex.splashPhase.userSwipedToStart
                    self._route(swipedToStart)
                } else {
                    // Show an error popup if we fail to calculate the total; then return to ordering.
                    self.showErrorPopup(self.textCalculateTotalError(), function() {
                        _nex.payment.backButton()
                    })
                }
            })
        }, 'ORDERTOTAL')
    };

    // Show a popup with an error message.
    self.showErrorPopup = function(message, callback) {
        self._debug('hiding all popups and showing error popup')
        _nex.assets.popupManager.hideAllPopups(function() {
            var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup)
            popup.message = message
            _nex.assets.popupManager.showPopup(popup, callback)
        })
    };

    //
    // PRIVATE / HELPER METHODS
    //

    // Called when there are zero payment options.
    self._zeroPaymentOptions = function() {
        self._debug('zero payment option detected - going to order review')
            // We want to go back to the ordering phase.
            // The ordering phase should deal with it appropriately.
        self._gotoOrderReview()
    };

    // Called when there is only one payment option.
    self._onePaymentOption = function(type) {
        self._debug('one payment option detected - skipping payment select screen')
            // When there is only one payment option, this is a special case, we want to just pick
            // the tender for the one payment option.
        var singleTenderType = type
        if (!singleTenderType) {
            console.log('ERROR IN PAYMENT: Expected the single tender to be set.')
        } else {
            self._debug('Creating tender for type ' + type)
            self.createSelectedTender(singleTenderType)
        }

        // Show the control buttons too.
        self._updateControlButtons()
    };

    // Called when there are more than one payment options.
    self._multiplePaymentOptions = function() {
        self._debug('multiple payment options detected - showing select payment screen')
            // When there are multiple payment options, the user needs to select which one.
        self._gotoSelectPayment()

        // Show the control buttons too.
        self._updateControlButtons()
    };

    // Show the processing popup.
    self.showProcessingPopup = function(message, callback) {
        self._debug('showing processing popup')
        var processingPopup = $.extend(true, {}, _nex.assets.popupManager.processingPopup)
        processingPopup.message = message || "Processing ...";
        if (callback) {
            processingPopup.onShowCallback = callback
        }
        _nex.assets.popupManager.showPopup(processingPopup)
    };

    // Hide the processing popup.
    self.hideProcessingPopup = function(callback) {
        self._debug('hiding processing popup')
        _nex.assets.popupManager.hidePopup(_nex.assets.popupManager.processingPopup, callback)
    };

    // Show the select tender popup
    self.showSelectTenderPopup = function(message, callback) {
        self._debug('showing select tender popup')
        var popup = $.extend(true, {}, _nex.assets.popupManager.messagePopup)
        popup.message = message || "Processing ...";
        _nex.assets.popupManager.showPopup(popup, callback)
    };

    // Hide the add tender popup
    self.hideSelectTenderPopup = function(callback) {
        self._debug('hiding select tender popup')
        _nex.assets.popupManager.hidePopup(_nex.assets.popupManager.messagePopup, callback)
    };

    // Send the command to set the selected tender.
    self.createSelectedTender = function(type) {
        var tenderType

        // If this a Guest Account Inclining Balance Generic Tender Account, then get the associated generic tender...
        if (type.startsWith('gaincliningbalancetender')) {
            var guestAccountLocal = _nex.guestAccount.getGuestAccountLocalByPaymentClipTenderType(type)

            tenderType = guestAccountLocal.genericTenderId
        } else {
            tenderType = type
        }

        // Set last selected tender.
        self.lastSelectedTender = type

        // Send TENDERADDED. This does not put it on the tender stack, just sets the selected tender.
        console.log('Sending request to add tender with type ' + type)
        var requestObject = new _nex.commands.AddTender(tenderType)
        _nex.communication.send(requestObject, self._tenderAdded, 'TENDERADDED')
    };

    // Send the process order command. Optionally pass in a final tender to process.
    self.processOrder = function(finalTender) {
        self.stop()
        self.showProcessingPopup(self.textProcessingPayment(), function() {
            var requestObject = new _nex.commands.ProcessOrder(_nex.ordering.orderManager.currentOrder, finalTender)
            _nex.communication.send(requestObject, self.orderProcessed, 'ORDERPROCESSED')
        })
    };

    // Remove a selected tender.
    self._removeSelectedTender = function() {
        // If a selected tender has been set, the way to remove it is to use the REMOVETENDER command.
        // This must be done when the user hits back, for example.
        var requestObject = new _nex.commands.RemoveTender(self.lastSelectedTender)
        _nex.communication.send(requestObject, self._tenderRemoved, 'TENDERREMOVED')
    };

    // Callback after a tender is added.
    self._tenderAdded = function(result) {
        self._debug('Tender has been added')
        self._debug(result)
        if (result.responseReceived === 'true') {
            self._paymentManager.gotoClip(self.lastSelectedTender)
        } else {
            throw 'ERROR: MISSING CLIP FOR TENDER ' + self.lastSelectedTender
        }
    }

    // Callback after a tender is removed.
    self._tenderRemoved = function() {
        // TODO: Find out what we do if the tender fails to remove.
        self._debug('Tender removed callback')
    };

    // Check which tenders are available.
    self._getAvailableTenders = function() {
        // Default the result to an empty array.
        var result = []

        // Use this helper method in the theme to get the tendersAvailable.
        // This uses the paymentProfile, which is updated from the UPDATEKIOSK command.
        var lastUpdateTenders = self._theme.tendersAvailable()
        if (lastUpdateTenders) {
            result = lastUpdateTenders
        }

        // Return the result.
        self._debug('GET AVAILABLE TENDERS:')
        self._debug(result)
        return result
    };

    // Return various kiosk text messages for this phase.
    self.textSwipe = function() {
        return self._theme.getTextAttribute('PAYMENT', 'swipe', 'Please Swipe Your Credit Card')
    };
    self.textSwipeError = function() {
        return self._theme.getTextAttribute('PAYMENT', 'swipeerror', 'There was a problem reading your card, please swipe again')
    };
    self.textProcessingPayment = function() {
        return self._theme.getTextAttribute('PAYMENT', 'processingpayment', 'Your Payment Is Being Processed')
    };
    self.textProcessingError = function() {
        return self._theme.getTextAttribute('PAYMENT', 'processingerror', 'Sorry.  Payment could not be processed.')
    };
    self.textCash = function() {
        return self._theme.getTextAttribute('PAYMENT', 'cashtext', 'CASH')
    };
    self.textCredit = function() {
        return self._theme.getTextAttribute('PAYMENT', 'credittext', 'CREDIT')
    };
    self.textDebit = function() {
        return self._theme.getTextAttribute('PAYMENT', 'debittext', 'DEBIT')
    };
    self.textPaymentType = function() {
        return self._theme.getTextAttribute('PAYMENT', 'paymenttype', 'Select a Payment Type')
    };
    self.textProcessingOrder = function() {
        return self._theme.getTextAttribute('PAYMENT', 'processingorder', 'Calculating Total')
    };
    self.textCounter = function() {
        return self._theme.getTextAttribute('PAYMENT', 'countertext', 'COUNTER') // sometimes is cash
    };
    self.textCoupon = function() {
        return self._theme.getTextAttribute('PAYMENT', 'coupontext', 'COUPON')
    };
    self.textLoyalty = function() {
        return self._theme.getTextAttribute('PAYMENT', 'loyaltytext', 'GUEST EXPRESS')
    };
    self.textCalculateTotalError = function() {
        return self._theme.getTextAttribute('PAYMENT', 'calculatetotalerror', 'Error processing order')
    };
    self.textPaymentDeviceSwipe = function() {
        return self._theme.getTextAttribute('PAYMENT', 'waitforpayment', 'Swipe Card On The Payment Device')
    };
    self.textBalanceMessage = function() {
        return self._theme.getTextAttribute('PAYMENT', 'amountauthorized', 'Balance applied')
    };
    self.textCardAppliedMessage = function() {
        return self._theme.getTextAttribute('PAYMENT', 'loyaltycardapplied', 'Loyalty Card Applied')
    };
    self.textAuthorizing = function() {
        return self._theme.getTextAttribute('PAYMENT', 'preauthmessage', 'Authorizing...')
    };
    // Handle the response from payment
    self.handlePaymentResponse = function(msg) {
        // When payment devices process a payment, they come back with a payment response.
        self._debug('handlePaymentResponse')

        // Log a debug message for troubleshooting.
        self._debug('Response message: ')
        self._debug(msg)

        // Failure case ...
        if (msg.paymentstatus === 'Failure') {
            // This indicates something went wrong with the payment device.
            // For example, the user didn't swipe in time.
            // Show an error to the user so they know something went wrong with the payment device.
            var messageText = self._theme.getTextAttribute('PAYMENT', 'processingerror', 'Sorry, your payment could not be processed.')

            _nex.payment.showErrorPopup(messageText, function() {
                // Following along with the Visio diagram for this project, change the flow of control.
                // There are 3 exit points.
                var numTenders = _nex.payment._getAvailableTenders().length
                if (numTenders === 1) {
                    // Go to ordering phase
                    self._debug('Going back to the ordering phase ...')
                    self._gotoOrderReview()
                } else if (numTenders > 1) {
                    // Go to select payment
                    self._debug('Going back to the start of payment, which will bring us to select payment ...')
                    self.start()
                }
            })
        } else {
            // Payment was a success - calling process order (all payments are final currently).
            _nex.payment.processOrder()
        }
    }

    // Handly a loyalty process response. Similar to payment response, but for loyalty.
    self.handleLoyaltyResponse = function(response, tender) {
        self._debug('Handling response: ')
        self._debug(response)

        // Update the order.
        if (response.ORDER) {
            _nex.orderManager.currentOrder.update(response.ORDER)
        }

        // If enough has been collected.
        if (response.message === 'ENOUGH_COLLECTED') {
            console.log('Payment: Enough has been collected... Going to process order.')
            self.processOrder()
        } else {
            // Let the user know what happened
            var amount = response.amount ? response.amount : 0.0
            if (amount > 0) {
                var remainingBalance = _nex.orderManager.currentOrder.totals.remainingbalance()

                var balanceText = self.textBalanceMessage()
                balanceText = balanceText.replace('{0}', amount)
                balanceText = balanceText.replace('{1}', remainingBalance)
                self._showBalanceMessage(self._route(false, true), balanceText)
            } else {
                var appliedText = self.textCardAppliedMessage()
                self._showLoyaltyCardApplied(appliedText, self._route(false, true))
            }

            // Hide the back button now that a tender has been applied.
            self._hideBackButton()
        }
    }

    // Process a loyalty card, QR code, etc.. Called from the loyalty payment clip.
    // Device data should be a string and pindata should be some type of authentication if
    // authentication was required.
    self.loyaltyInquiry = function(pindata, bLoyalty2) {
        self._debug('processLoyalty')
        var carddata = '';
        var userdata = '';
        var cardtype = 'LOYALTY';
        if (bLoyalty2) {
            cardtype = 'LOYALTY2';
        }
        var track1 = '';
        var track2 = '';

        if (typeof self.deviceData === 'string') {
            carddata = self.deviceData // string for things like QR codes.
        } else if (typeof self.deviceData === 'object') {
            carddata = self.deviceData.cardNumber // object for cards.
        }

        if (pindata) {
            userdata = pindata
        }

        // Get at the track data.
        if (self.deviceData.track1) {
            track1 = self.deviceData.track1
        }
        if (self.deviceData.track2) {
            track2 = self.deviceData.track2
        }

        // Get at the card type.
        if (track1 || track2) {
            var cardParser = new CardParser(_nex.assets.theme)
            cardParser.parse(track1, track2, function(data) {
                if (data) {
                    if (cardtype != 'LOYALTY' && cardtype != 'LOYALTY2') {
                        cardtype = data.cardType
                    }
                }
            })

            if (cardParser.cardData) {
                carddata = cardParser.cardData.cardNumber
            }
        }

        var tenderConfig = _nex.assets.theme.getTenderByType(cardtype.toLowerCase())
        var preauthandpay = _nex.assets.theme.isPreAuthAndPay(tenderConfig)

        self._sendLoyaltyInquiry(carddata, userdata, cardtype, track1, track2, preauthandpay)
    };

    // Called if the employee inquiry fails for the card swiped or pin.
    self.showEmployeeCardError = function(callback) {
        var message = _nex.payment.textProcessingError()
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup)
        popup.message = message
        _nex.assets.popupManager.showPopup(popup, callback)
    };

    // Whether or not we should show the authorizing popup when doing a loyalty inquiry
    // or employee inquiry. 
    self.authorizingEnabled = function() {
        var result = true // default to true
            // Do the same thing as the Flash.
            // For the Flash, it is only false if loyalty is processed on the payment device.
        if (self.loyaltyRequiresPaymentDevice()) {
            result = false
        }
        return result
    };

    // Show the authorizing popup.
    self.showAuthorizingPopup = function(isProcessingLoyalty) {
        var message = _nex.payment.textAuthorizing(isProcessingLoyalty)
        var popup = $.extend(true, {}, _nex.assets.popupManager.messagePopup)
        popup.message = message
        _nex.assets.popupManager.showPopup(popup)
    };

    // Hide the authorizing popup.
    self.hideAuthorizingPopup = function(callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.messagePopup)
        _nex.assets.popupManager.hidePopup(popup, function() {
            if (callback) {
                callback()
            }
        })
    };

    // Send the loyalty inquiry.
    self._sendLoyaltyInquiry = function(cardnumber, userdata, cardtype, track1, track2, preauthandpay) {
        var tenderType = 'loyalty';
        if (_nex.manager.theme.kiosk.PAYMENTPROFILE.promptforrewardscard === '2' && cardtype === 'loyalty') { cardtype = 'loyalty2'; }
        self.showAuthorizingPopup()
        var command = new _nex.commands.LoyaltyInquiry(cardnumber, userdata, cardtype, track1, track2, preauthandpay)

        _nex.communication.send(command, function(response) {
            self._debug('Loyalty inquiry response', response)
            self.hideAuthorizingPopup(function() {
                // ischarged: "false"
                // isoffline: "false"
                // name: "TEST USER"
                // number: "1234"
                // responseReceived: "true"
                // status: "Success"
                // usedphone: "false"
                // value: "4.49"

                // Put this data on the loyalty tender.
                var loyaltyTender = new TenderLoyalty()
                loyaltyTender.update(response)
                loyaltyTender.LOYALTYRESPONSE.CardType = cardtype.toUpperCase()
                    // If it is a valid account....
                if (loyaltyTender.isValidAccount()) {
                    // if the guest has been charged (preAuthAndPay)
                    if (loyaltyTender.isCharged()) {
                        // Make sure client and server have the tender information in sync.
                        self._updateTender(function() {
                            // Process the loyalty tender.
                            self._processLoyalty(loyaltyTender, loyaltyTender.value)
                        })
                    } else if (loyaltyTender.hasMultipleValues()) {
                        // Multiple values should only be on if preAuthAndPay is off.
                        self._multipleOptions()
                    } else if (!loyaltyTender._noOffersReturnedFromInquiry) {
                        loyaltyTender._offersPopup('', loyaltyTender._availableOffers)
                    } else if (loyaltyTender.hasBalance()) {
                        // (preauth case)
                        // Try to charge the remaining balance on the card.
                        var tenderConfig = _nex.assets.theme.getTenderByType(cardtype)
                        var amountToCharge = self._getAmountToCharge(loyaltyTender, tenderConfig)
                        if (amountToCharge > 0) {
                            self._processLoyalty(loyaltyTender, amountToCharge)
                        } else {
                            self._debug('There is $0.00 to be charged. Could be from rounding if usefullamount is turned off.')
                            self._genericError(self.reset)
                        }
                        // default for if using offers but nothing returned by inquiry
                    } else if (response.isgiftcard) {
                        self._showErrorMessage(self.reset, 'No Balance remains on card')
                    } else {
                        // add non-payment tender to stack so loyalty builds points if supported.
                        // var command = new _nex.commands.ProcessLoyalty(tender, selectedOffer.price);
                        var addTenderCommand = new _nex.commands.AddTender('loyalty')
                        _nex.communication.send(addTenderCommand, function(response) {
                            if (response.added) {
                                var processLoyaltyTenderCommand = new _nex.commands.ProcessLoyalty(loyaltyTender, 0)
                                _nex.communication.send(processLoyaltyTenderCommand, function(response) {
                                    // if(response.message != "NOT_ENOUGH_COLLECTED") {
                                    self.handleLoyaltyResponse(response, loyaltyTender)
                                        //}
                                        //else {

                                    //}
                                }, 'PROCESSLOYALTYRESPONSE')
                            }
                        }, 'TENDERADDED')
                        self._debug('No multiple values and no balance on the card')
                            //self._genericError(self.reset);
                    }
                } else {
                    self._debug('Invalid account')
                    if (response.errormessage === '') {
                        self._genericError(self.reset)
                    } else {
                        self._showErrorMessage(self.reset, response.errormessage)
                    }
                }
            })
        }, 'LOYALTYRESPONSE')
    };

    // Called if there are multiple values on the loyalty card...
    // which means the user can select from a screen of what to do next.
    // This is custom logic per customer.
    self._multipleOptions = function() {
        _nex.assets.theme.loadMedia('customloyalty.html', null, 'customloyalty.js')
    };

    // Return the amount to charge.
    self._getAmountToCharge = function(tender, tenderConfig) {
        // Default to the remaining balance on the card.
        var result = tender.remainingBalance()

        // If we aren't using the full amount... Go down to the nearest dollar.
        // Used for cases where they only have whole bills to give for change.
        var useFullAmount = _nex.assets.theme.useFullAmount(tenderConfig)
        if (!useFullAmount) {
            result = Math.floor(result)
        }
        return result
    };

    // Complete the loyalty flow.
    self._processLoyalty = function(tender, amount) {
        // End of the Visio process.
        // Add the tender to the tender stack.
        var command = new _nex.commands.ProcessLoyalty(tender, amount)
        _nex.communication.send(command, function(response) {
            // Have the payment phase decide where to route the user next based on the response.
            // If things are paid in full, it should go to the next phase.
            // If not, it should go back to selecting payment.
            self.handleLoyaltyResponse(response, tender)
        }, 'PROCESSLOYALTYRESPONSE')
    };

    self.processEmployeeCard = function(track2) {
        var employeeNumber = track2.replace(/[^0-9]/g, '') // strip out non-digits from track 2
        var employeePin = _nex.keyboard.numpad.data
        var cmd = new _nex.commands.EmployeeInquiry(employeeNumber, employeePin)
        self.showAuthorizingPopup()
        _nex.communication.send(cmd, function(response) {
            self.hideAuthorizingPopup(function() {
                if (response && response.status && response.status.toLowerCase() === 'success') {
                    // Process as a final tender for now.
                    console.debug(response)
                    var value = Number(response.value)
                    if (value > 0) {
                        var employeeTender = new TenderEmployee()
                        employeeTender.updateNumber(response.number)
                        employeeTender.updatePin(response.pin)
                        employeeTender.updateResponse(response)
                        _nex.payment._processTender(employeeTender, value)
                    } else {
                        self.showEmployeeCardError(_nex.payment.start)
                    }
                } else {
                    self.showEmployeeCardError(_nex.payment.start)
                }
            })
        }, 'EMPLOYEERESPONSE')
    };

    // Show a generic error message.
    self._genericError = function(callback) {
        var message = _nex.payment.textProcessingError()
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup)
        popup.message = message
        _nex.assets.popupManager.showPopup(popup, callback)
    };

    // Show a error popup message.
    self._showErrorMessage = function(callback, message) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup)
        popup.message = message
        _nex.assets.popupManager.showPopup(popup, callback)
    };

    // Show a balance message.
    self._showBalanceMessage = function(callback, message) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.messagePopup)
        popup.message = message
        _nex.assets.popupManager.showPopup(popup, callback)
    };

    self._showLoyaltyCardApplied = function(message, callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.messagePopup)
        popup.message = message
        _nex.assets.popupManager.showPopup(popup, callback)
    };
    // Update the selected tender to reflect that it has been paid.
    self._updateTender = function(callback) {
        var command = new _nex.commands.UpdateTender(true)
        _nex.communication.send(command, function(response) {
            // Update the current order object.
            _nex.orderManager.currentOrder.update(response.ORDER)

            if (callback) {
                callback()
            }
        }, 'UPDATETENDERRESPONSE')
    };

    // GENERIC TENDER methods...
    // Process a generic tender account. Called from the genericpaymentclip.
    self.genericInquiry = function(pindata, guestAccountLocalTypeId, paymentTypeId, accountNumber) {
        self._debug('genericInquiry')
        var pin = '';

        // accountNumber is already populated if this request is sent from a Guest Account Inclining Balance Generic Tender Account, otherwise get the accountNumber from a device...
        if (accountNumber === undefined) {
            if (typeof self.deviceData === 'string') {
                accountNumber = self.deviceData // string for things like QR codes.
            } else if (typeof self.deviceData === 'object' && self.deviceData !== null) {
                if (self.deviceData.cardNumber) {
                    accountNumber = self.deviceData.cardNumber // object for cards.
                } else {
                    var track1 = '';
                    var track2 = '';

                    if (self.deviceData.track1) {
                        track1 = self.deviceData.track1
                    }
                    if (self.deviceData.track2) {
                        track2 = self.deviceData.track2
                    }

                    // Get at the card type.
                    if (track1 || track2) {
                        var cardParser = new CardParser(_nex.assets.theme)
                        cardParser.parse(track1, track2, function(data) {
                            if (data) {
                                cardtype = data.cardType
                                accountNumber = data.cardNumber
                            }
                        })
                    }
                }
            }
        }

        if (pindata) {
            pin = pindata
        }

        self._sendGenericInquiry(accountNumber, pin, paymentTypeId, guestAccountLocalTypeId)
    };

    // Send the generic inquiry and handle the response
    self._sendGenericInquiry = function(accountNumber, pin, paymentTypeId, guestAccountLocalTypeId) {
        // alert("account number: " + accountNumber + " (pin: " + pin + ")\npayment type id: " + paymentTypeId + "\nguest account local type id: " + guestAccountLocalTypeId);

        var command = new _nex.commands.GenericInquiry(accountNumber, pin, paymentTypeId, guestAccountLocalTypeId)
        self.showTenderProcessingMessage()

        _nex.communication.send(command, function(response) {
            self._debug('generic inquiry response', response)
            self.hideProcessingPopup(function() {
                // Put this data on the loyalty tender.
                var genericTender = new TenderGeneric(paymentTypeId, accountNumber, pin)
                genericTender.update(response)

                var genericMessageAttr = genericTender._tenderType

                // If it is a valid account....
                if (genericTender.isValidAccount()) {
                    var message = self._theme.getTextAttribute('PAYMENT', 'nobalance' + genericMessageAttr, 'No available balance. Select a different method of payment.')

                    if (genericTender.hasBalance()) {
                        // Try to charge the remaining balance on the card.
                        var tenderConfig = _nex.assets.theme.getGenericTenderByType(genericTender._tenderType)
                        var amountToCharge = self._getAmountToCharge(genericTender, tenderConfig)
                        if (amountToCharge > 0) {
                            self._processTender(genericTender, amountToCharge, response.discountid)
                        } else {
                            self._debug('There is $0.00 to be charged. Could be from rounding if usefullamount is turned off.')
                            self._showErrorMessage(self.reset, message)
                        }
                    } else {
                        self._debug('No balance on the account')
                        self._showErrorMessage(self.reset, message)
                    }
                } else {
                    self._debug('Invalid account')
                    self._genericError(self.reset)
                }
            })
        }, 'GENERICINQUIRYRESPONSE')
    };

    // Complete the tender flow by telling the TM to push the tender onto the tender stack.
    self._processTender = function(tender, amount, discountid) {
        // End of the Visio process.
        // Add the tender to the tender stack.
        var command = new _nex.commands.ProcessTender(tender, amount, discountid)
        _nex.communication.send(command, function(response) {
            // Have the payment phase decide where to route the user next based on the response.
            // If things are paid in full, it should go to the next phase.
            // If not, it should go back to selecting payment.
            self.handleTenderResponse(response)
        }, 'PROCESSTENDERRESPONSE')
    };

    // Handle a tender process response... at this point the tender on the TM has been pushed to the tender stack
    self.handleTenderResponse = function(response) {
        self._debug('Handling PROCESSTENDERRESPONSE response: ')
        self._debug(response)

        // Update the order.
        _nex.orderManager.currentOrder.update(response.ORDER)

        // If enough has been collected.
        if (response.message === 'ENOUGH_COLLECTED') {
            self.processOrder()
        } else {
            // Let the user know what happened
            var amount = response.amount ? response.amount : 0.0
            var remainingBalance = _nex.orderManager.currentOrder.totals.remainingbalance()

            var text = self.textBalanceMessage()
            text = text.replace('{0}', amount)
            text = text.replace('{1}', remainingBalance)
            self._showBalanceMessage(self._route, text)

            // Hide the back button now that a tender has been applied.
            self._hideBackButton()
        }
    }

    self.showTenderProcessingMessage = function() {
        var message = _nex.assets.theme.getTextAttribute('PAYMENT', 'preauthmessage', 'Authorizing...')
        self.showProcessingPopup(message)
    };

    self.couponInquiry = function(data) {
        self._debug('couponInquiry')
        var coupondata = '';
        var userdata = '';
        var tendertype = 'COUPON';
        var track1 = '';
        var track2 = '';

        if (typeof self.deviceData === 'string') {
            coupondata = self.deviceData // string for things like QR codes.
        } else if (typeof self.deviceData === 'object') {
            coupondata = self.deviceData.barcode // object for coupons.
        }

        self._sendCouponInquiry(coupondata)
    };

    // Send the coupon inquiry.
    self._sendCouponInquiry = function(couponnumber) {
        self.showTenderProcessingMessage()

        _nex.communication.send(new _nex.commands.CouponInquiry(couponnumber), function(response) {
            self._debug('coupon inquiry response', response)
            self.hideProcessingPopup()

            // Put this data on the coupon tender.
            var couponTender = new TenderCoupon(couponnumber)
            couponTender.update(response)

            self._debug(response)

            // If it is a valid account....
            if (couponTender.isValidAccount()) {
                var deductionAmount = couponTender.deductionAmount(_nex.orderManager.currentOrder.totals.subtotal())
                if (deductionAmount > 0.0) {
                    self._processTender(couponTender, deductionAmount, '')
                } else {
                    self._debug('There is $0.00 to be deducted. Coupon amount could be invalid.')
                    self._genericError(self.reset)
                }
            } else {
                self._debug('Invalid account')
                self._genericError(self.reset)
            }
        }, 'COUPONRESPONSE')

    };

    // Register custom logic to be executed once the select payment clip comes up.
    self.registerCallback = function(clipid, callback) {
        if (!self._paymentManager) {
            self._paymentManager = new PaymentManager()
        }
        self._paymentManager.registerCallback(clipid, callback)
    };
}
// Capture any additional information from the user before complete.
// Brings the user to the green receipt screen if they don't respond soon enough.
function PostOrdering() {
    var self = this

    self.debugEnabled = true
    self.debug = function() {
        if (self.debugEnabled) {
            console.debug('PostOrdering', arguments)
        }
    }

    // Check if 'previous orders' is enabled.
    self._isPreviousOrdersEnabled = function() {
        var result = false
        var theme = _nex.assets.theme
        if (theme && theme.system && theme.system.PREVIOUSORDERS && theme.system.PREVIOUSORDERS.hasOwnProperty('enabled')) {
            if (theme.system.PREVIOUSORDERS.enabled.toLowerCase() === 'true') {
                result = true
            }
        }
        return result
    };

    // Start.
    self.start = function() {
        self.debug('start')
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.POST_ORDERING)
        refreshOrderTimer()

        if (!self._isPreviousOrdersEnabled()) {
            self.gotoNextPhase(false)
        } else {
            if ((_nex.orderManager.currentOrder.smsNumber) ||
                (_nex.orderManager.currentOrder.lookupData)) {
                self.debug('Phone number found at previous orders... Trying to apply it here.')
                if (_nex.orderManager.currentOrder.lookupData) {
                    var req = new _nex.commands.SavePreviousOrder(_nex.orderManager.currentOrder.orderid, _nex.orderManager.currentOrder.smsNumber, _nex.orderManager.currentOrder.lookupData)
                    _nex.communication.send(req) // SavePreviousOrder does not have a response...
                }
                self.gotoNextPhase(true)
            } else {
                self.debug('No phone number at previous orders.')
                self.showLookupOptions()
            }
        }
    }

    // Show the lookup options.
    self.showLookupOptions = function() {
        // Re-use what is in the repeatOrdersPhase... pass it true for postordering.
        try {
            _nex.repeatOrderPhase.showLookupOptions(true)
        } catch (ex) {
            self.gotoNextPhase()
        }
    }

    // Stop.
    self.stop = function() {
        // For future use
    }

    // Called if we already have everything we need.
    self.gotoNextPhase = function(saveHit) {
        self.stop()
        var phaseClips = _nex.assets.phaseManager.findPhaseClips(_nex.assets.phaseManager.phaseType.SMS)
        if (phaseClips !== undefined && phaseClips !== null && phaseClips.length > 0) {
            self.debug('SMS is enabled. Going to SMS.')
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.SMS, function() {
                _nex.sms.start()
            })
        } else {
            self.debug('SMS is not enabled. Going to green receipt.')
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.GREEN_RECEIPT, function() {
                _nex.greenReceipt.start()
            })

        }
    }

    // Tracking logic common to buttons in post orders.
    self._trackClick = function(text, context) {
        var buttonId = ''; // button id is left as empty string.
        var buttonText = text
        var menuId = ''; // menu id is not applicable in this phase.
        var BUTTON_TYPE = 'control';
        _nex.utility.buttonTracking.track(buttonId, buttonText, menuId, context, BUTTON_TYPE)
    };
}
// Constructor for the PreviousOrders phase. If this phase is enabled,
// then it gives the user an opportunity to lookup any previous orders,
// and choose one. If it is not enabled, it should be skipped, and the
// user is brought right to the ordering phase.
function PreviousOrders(parameters) {
    // Guard against missing parameters.
    if (!parameters) {
        throw 'PreviousOrders: Missing parameters.';
    }
    if (!parameters.theme) {
        throw 'PreviousOrders: Missing parameter theme.';
    }

    // Make self synonymous with this.
    var self = this

    // Like all the phases, we use certain parts of the theme object.
    self._theme = parameters.theme

    // Set a property for the previous order.
    self._previousOrderSelected = null

    // User's choice to lookup previous orders.
    self.lookupPrevious = false

    // What previous orders came back if they choose to look up previous orders.
    self.previousOrdersFound = []

    // Whether or not the user started the process with a card swipe.
    self.deviceData = null

    // Any phone data entered at this phase to be used later.
    self.phoneData = '';

    // Turn to true to enable debugging the previous orders phase.
    var DEBUG_ENABLED = true
    self._debug = function() {
        if (DEBUG_ENABLED) {
            console.debug('PreviousOrders', arguments) // use built-in arguments object
        }
    }


    // Reset properties.
    self.reset = function() {
        self._previousOrderSelected = null
        self.lookupPrevious = false
        self.previousOrdersFound = []
        self.deviceData = null
        self.phoneData = '';
    }

    // Start the 'previous orders' process.
    self.start = function(deviceData) {
        self._debug('start', 'Enter the previous orders phase')

        // Reset variables.
        self.reset()

        // Send an update of the current status.
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.PREVIOUS_ORDERS)

        // Hide the content of this phase for now.
        self.hideClip()

        // Update the control buttons for when we show it.
        self.updateControlButtons()

        // User scanned a barcode or something to start.
        if (deviceData) {
            self.deviceData = deviceData
        }

        // Check if the customer is configured to use this phase.
        if (self.isPreviousOrdersEnabled()) {
            self._debug('start', 'previous orders is enabled... checking card swiped')
                // Check if they did a card swipe already
            if (self.deviceData) {
                self.fetchOrders(self.deviceData)
            } else {
                // Repeat a previous order.
                try {
                    _nex.repeatOrderPhase = new RepeatOrderPhase()
                    _nex.repeatOrderPhase.start()

                } catch (ex) {
                    // This may happen if we are missing an asset for repeat orders
                    console.log('ERROR entering repeat order phase.')
                    self.gotoOrdering()
                }
            }
        } else {
            // This customer is not configured to use this phase.
            // Go directly to the ordering phase.
            self._debug('start', 'going to ordering')
            self.gotoOrdering()
        }

        refreshOrderTimer()
    };

    // Stop the previous orders process.
    self.stop = function() {
        self.reset()
    };

    // Hide the clip.
    self.hideClip = function() {
        // Hide the content of this clip.
        $('#clip-orders').hide()
        $('#clip-controlbuttons').hide()
    };

    // Show the clip.
    self.showClip = function() {
        self._debug('showing previous orders to select from')

        $('#clip-repeatorders').hide()
        $('#clip-orders').show()
        $('#clip-controlbuttons').show()
    };

    // Tracking logic common to buttons in previous orders.
    self._trackClick = function($button, context) {
        var buttonId = ''; // button id is left as empty string.
        var buttonText = $button.text()
        var menuId = ''; // menu id is not applicable in this phase.
        var BUTTON_TYPE = 'control';
        _nex.utility.buttonTracking.track(buttonId, buttonText, menuId, context, BUTTON_TYPE)
    };

    // Callback.
    self._continueButtonClicked = function($button) {
        self._trackClick($button, 'New Order')
        _nex.previousOrders.gotoOrdering()
    };

    // Callback.
    self._cancelButtonClicked = function($button) {
        self._trackClick($button, 'Cancel')
        _nex.previousOrders.gotoSplash()
    };

    // Update control buttons.
    self.updateControlButtons = function() {
        self._debug('Updating control buttons')
        var text = '';
        // new order button
        var btnNewOrder = $('#ctrl-continue')
        if (btnNewOrder.length > 0) {
            btnNewOrder.attr('onclick', '')
            btnNewOrder.unbind('click')
            btnNewOrder.click(function() {
                self._continueButtonClicked(btnNewOrder)
            })
            text = _nex.assets.theme.getTextAttribute('PREVIOUSORDERS', 'continue', 'NEW ORDER')
            btnNewOrder.html(text)
        }

        // update cancel button
        var btnCancel = $('#ctrl-cancel')
        if (btnCancel.length > 0) {
            btnCancel.attr('onclick', '')
            btnCancel.unbind('click')
            btnCancel.click(function() {
                self._cancelButtonClicked(btnCancel)
            })
            text = _nex.assets.theme.getTextAttribute('ORDER', 'cancel', 'CANCEL')
            btnCancel.html(text)
        }
    }

    // Check if 'previous orders' is enabled.
    self.isPreviousOrdersEnabled = function() {
        // Default the result to false.
        var result = false

        // Use theme as a shorthand for self._theme.
        var theme = self._theme

        // Check the theme object if 'previous orders' is enabled.
        if (theme.system && theme.system.PREVIOUSORDERS && theme.system.PREVIOUSORDERS.hasOwnProperty('enabled')) {
            if (theme.system.PREVIOUSORDERS.enabled.toLowerCase() === 'true') {
                result = true
            }
        }

        // Return the result.
        return result
    };

    // Returns true if previous orders were found.
    self.previousOrdersFound = function(previousOrders) {
        var result = false
        if (previousOrders && previousOrders.length > 0) {
            result = true
        }
        return result
    };

    // Clear previous orders shown.
    self.clearPreviousOrders = function() {
        // Use a jQuery selector for this to remove all the ones except the first one,
        // which is actually a template that is cloned for the others.
        $('div.previous-order:not(:first)').remove()
    };

    // Copied from NEXTEP Mobile.
    self.isOrderItemsAvailable = function(items) {
        var isAvailable = true

        // look at all items and modifiers - if any are not available the entire order is not available
        for (var i = 0;
            (i < items.length) && (isAvailable); i++) {
            isAvailable = _nex.assets.theme.itemIsAvailable(items[i].posid)

            // check the pricelevel price; if the price of the is $0 then the item should not be included
            try {
                var item = _nex.assets.theme.itemByPosid(items[i].posid)
                if (isAvailable &&
                    items[i].hasOwnProperty('price') &&
                    (item !== null)) {
                    var originalPrice = (items[i].price.length > 0) ? Number(items[i].price) : 0
                    var currentPrice = _iorderfast.assets.theme.itemPrice(item, items[i].pricelevel)
                    currentPrice = (currentPrice.length > 0) ? Number(currentPrice) : 0

                    if ((originalPrice > 0) && (currentPrice === 0)) {
                        isAvailable = false
                    }
                }
            } catch (e) {
                console.log('unable to determine price of item')
            }

            // check modifiers
            if (isAvailable) {
                var itemsArray = self._convertToArray(items[i].ITEM)
                isAvailable = self.isOrderItemsAvailable(itemsArray)
            }
        }

        return isAvailable
    };

    // Utility method.
    self._convertToArray = function(obj) {
        var result = []
        if (obj) {
            if (obj instanceof Array) {
                result = obj
            } else {
                result.push(obj)
            }
        }
        return result
    };

    // Check if all the items exist on the previous order.
    self._allItemsExist = function(previousOrder) {
        var result = true
        var items = []
        var itemsArray = []
        if (previousOrder.ORDER) {
            items = previousOrder.ORDER.ITEM
            itemsArray = self._convertToArray(items)
            result = self.isOrderItemsAvailable(itemsArray)
        }
        self._debug('previousOrders._allItemsExist returning ' + result)
        return result
    };

    // Display the orders to choose from.
    self.displayOrders = function(callbackFound, callbackNotFound) {
        self._debug('enter display orders')
        self.clearPreviousOrders()

        self._debug('Displaying previous orders. Here were the ones that were found:')
        var previousOrderTemplate = $('#previousorder')
        self._debug(self.previousOrdersFound)

        var previousOrdersToShow = false
        if (self.previousOrdersFound.length >= 1) {
            for (var index = 0; index < self.previousOrdersFound.length; index++) {
                var previousOrder = self.previousOrdersFound[index]
                    // If all the items exist on the previous order ...
                if (self._allItemsExist(previousOrder)) {
                    // write the HTML out for the order.
                    self.buildOrder(index, previousOrder)
                        // set a flag so we know there is at least one order to show.
                    previousOrdersToShow = true
                }
            }
        }

        if (previousOrdersToShow) {
            if (callbackFound) {
                callbackFound()
            }

            self._debug('Showing control buttons')
            self.updateControlButtons()
            self.showClip()


        } else {
            if (!callbackNotFound) {
                self._popupNoPreviousOrdersFound()
            } else {
                callbackNotFound()
            }
        }
    }

    // Called if a previous order is selected.
    self.orderSelected = function(order) {
        self._debug('Previous order selected: ', order)
        self.loadOrder(order)
    };

    // Called if new order is touched.
    self.newOrder = function() {
        // This is bound to the control button for New Order in the PreviousOrders phase.
        self.gotoOrdering()
    };

    // Called to load a previous order.
    self.loadOrder = function(index) {
        var order = self.previousOrdersFound[index]
        self._debug('loadOrder', order)
            // Pass the order selected right to ordering.
        console.log(order)
        self.gotoOrdering(order)
    };

    // Go back to the splash phase.
    self.gotoSplash = function() {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.SPLASH, function() {
            // _nex.splash.start();
        })
    };

    // Called when leaving this phase to go to the ordering phase.
    self.gotoOrdering = function(order) {
        // If we have a previous order that was selected ...
        if (order) {
            self._gotoOrderingWithOrder(order)
        } else {
            self._gotoOrderingWithoutOrder()
        }
    }

    // This method is in Nextep mobile. It is called when the user selects a previous order to go to.
    self.loadOrder = function(orderIndex) {
        // Get the order by its index.
        var order = self.previousOrdersFound[orderIndex]

        if (order) {
            // Go to the ordering phase with that order.
            self.gotoOrdering(order)
        }
    }

    // Display the message that no previous orders were found.
    self.displayNoPreviousOrdersFound = function() {
        self._popupNoPreviousOrdersFound()
    };

    // Show an error letting the user know there was a problem with the card data;
    // Go ahead and jump ahead to ordering when this happens (give up on trying to look up previous orders).
    self._popupErrorCardData = function(message, callback) {
        // Show a generic error message.
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup)
        if (message && message.length > 0) {
            popup.message = message
        }
        _nex.assets.popupManager.showPopup(popup, function() {
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function() {

            })
        })
    };

    self._lookupPreviousSelected = function() {
        if (self.cardSwiped) {
            // They swiped a card to start, so go ahead and fetch the orders associated with that card.
            _nex.previousOrders.fetchOrders()
        }
    }

    // User chose to fetch previous orders.
    self.fetchOrders = function(lookup, callbackFound, callbackNotFound) {
        self._debug('fetching orders')
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
            _nex.utility.deviceListener = null
        }

        if (typeof lookup === 'object') {
            switch (lookup.lookupType) {
                case '2':
                    {
                        // credit -TODO: parse card data
                        break
                    }
            }
        }

        // If we don't have a callback to handle the popups, show the popup in here.
        if (!callbackFound) {
            self._popupProcessing()
        }

        var requestObject = new _nex.commands.RequestRepeatOrders(lookup)
        _nex.communication.send(requestObject, function(result) {
            if (!callbackFound) {
                self._popupProcessingHide()
            }
            self._responseReceived(result, callbackFound, callbackNotFound)
        }, 'PREVIOUSORDERS')
    };

    // User clicked the cancel button on the fetch orders dialog.
    self.cancelFetchOrders = function() {
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
            _nex.utility.deviceListener = null
        }
        // No need to do anything else. Stay on the same screen.
    }

    // Called if the user swiped a card on the screen that prompts for phone number or card swipe.
    self._cardEventListener = function(cardData) {
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
            _nex.utility.deviceListener = null
        }
        // _nex.assets.popupManager.hideAllPopups();
        self._debug(cardData)
        if (cardData && cardData !== 'ERROR') {
            // Card case.
            if (cardData.track1) {
                var cardParser = new CardParser(_nex.assets.theme)
                cardParser.parse(cardData.track1, cardData.track2, function(cardData) {
                    var cardNum = cardData.cardNumber
                    var first2 = '';
                    var last4 = '';
                    var cardType = cardData.cardType
                    if (cardNum) {
                        if (cardNum.length >= 2) {
                            first2 = cardNum.substr(0, 2)
                        }
                        if (cardNum.length >= 4) {
                            last4 = cardNum.substr(cardNum.length - 4, 4)
                        }
                    }
                    var name = cardData.fullName()
                    var profile = cardType + name + first2 + last4

                    var lookup = new LookupData(_nex.types.lookup.CANCEL, profile)
                    _nex.orderManager.currentOrder.lookupData = lookup
                    self.fetchOrders(lookup, self.callbackFound, self.callbackNotFound)
                }, function() {
                    self._sendRequestPreviousOrders('')
                })
            }
        } else {
            // Error reading card data.
            self._popupErrorCardData(self._theme.getTextAttribute('PAYMENT', 'swipeerror', 'Error reading card data'))
        }
    }

    // These are set from the repeat order phase.
    self.callbackFound = function() {

    }

    self.callbackNotFound = function() {

    }

    // The no previous orders popup.
    self._popupNoPreviousOrdersFound = function() {
        console.log('_popupNoPreviousOrdersFound')
        var popup = $.extend(true, {}, _nex.assets.popupManager.errorPopup)
        popup.message = _nex.assets.theme.getTextAttribute('PREVIOUSORDERS', 'promptnotfound', 'Sorry, no previous orders available.')
        _nex.assets.popupManager.showPopup(popup, function() {
            // Simply stay on the same screen.
        })
    };

    // The processing popup. Optional parameters message and callback.
    self._popupProcessing = function(message, callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.processingPopup)
            // TODO: Could not find an attribute for the 'processing' text. Change this to what it should be.
        popup.message = message || self._theme.getTextAttribute("PREVIOUSORDERS2", "processing", "Looking Up<br/>Previous Orders...");
        _nex.assets.popupManager.showPopup(popup, function() {
            if (callback) {
                callback()
            }
        })
    };

    // Hide processing popup.
    self._popupProcessingHide = function(callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.processingPopup)
        _nex.assets.popupManager.hidePopup(popup, function() {
            if (callback) {
                callback()
            }
        })
    };

    // Hide the phonepad popup.
    self._phonepadPopupHide = function(message, callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.phonepadPopup)
        _nex.assets.popupManager.hidePopup(popup, function() {
            if (callback) {
                callback()
            }
        })
    };

    // Check card data.
    self._isValidCard = function(data) {
        var result = false
        if (data) {
            return true
        }
        return result
    };

    // Returns true if it looks like a phone #.
    self._isValidPhone = function(data) {
        // For the purposes of previous orders, any 10 digits are a valid phone.
        var result = false
        if (data && data.length === 10) {
            result = true
        }
        return result
    };

    // Send the request previous orders command.
    self._sendRequestPreviousOrders = function(data) {
        self._debug('Fetching previous orders with data ', data)
            // Hide the phonepad popup if it is still up.
        self._phonepadPopupHide()

        // Check that it is a phone number of credit card data.
        if (data && (self._isValidPhone(data) || self._isValidCard(data))) {
            // Show the processing popup.
            self._popupProcessing()

            // Make a place for the SMS number if there isn't one already.
            if (!_nex.orderManager.currentOrder) {
                _nex.orderManager.currentOrder = {}
            }
            // Set the SMS number.
            _nex.orderManager.currentOrder.smsNumber = data


            var requestObject = new _nex.commands.RequestPreviousOrders(_nex.orderManager.currentOrder)
            _nex.communication.send(requestObject, function(result) {
                self._popupProcessingHide()
                self._responseReceived(result)
            }, 'PREVIOUSORDERS')
        } else {
            console.error('No data or bad data specified for fetching previous orders! Going right to ordering.')
            self._gotoOrderingWithoutOrder()
        }
    }

    // Called when previous orders are found.
    self._responseReceived = function(msg, callbackFound, callbackNotFound) {
        if (msg.responseReceived === 'true') {
            self._debug(msg)

            // Extract the previous order array from the message object.
            var previousOrderArray = msg.PREVIOUSORDER

            // Double check that it is an array.
            if (Array.isArray(previousOrderArray)) {
                // If there are more than one previous orders, it comes back as an array.
                self.previousOrdersFound = previousOrderArray
            } else if (typeof previousOrderArray === 'object') {
                // If only one order comes back, it comes back as an object rather than an array.
                self.previousOrdersFound.push(msg.PREVIOUSORDER)
            }
            // Display the orders.
            _nex.previousOrders.displayOrders(callbackFound, callbackNotFound)
        } else {
            self._debug('error getting previous orders')
            self.previousOrdersFound = null

            // Display orders will handle the null case by showing a message.
            self.displayOrders(callbackFound, callbackNotFound)
        }
    }

    // For the simple case of going to ordering without a previous
    // order selected.
    self._gotoOrderingWithoutOrder = function() {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function() {
            _nex.ordering.start()
        })
    };

    // For the simple case of going to ordering without a previous
    // order selected.
    self._gotoOrderingWithOrder = function(order) {
        // Show a popup to let the user know we are doing a round trip.
        self._popupProcessing(self._theme.getTextAttribute('PREVIOUSORDERS2', 'loadorder', 'Loading Order...'))

        // Build and send the request object.
        var requestObject = new _nex.commands.LoadOrder(order)
        _nex.communication.send(requestObject, function(result) {
            // Once the response is received, hide the popup.
            self._popupProcessingHide()

            // Update the ordering object.
            _nex.orderManager.currentOrder.update(result.ORDER)

            // Change phases to the ordering phase; go to order review.
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function() {
                _nex.ordering.start()
                _nex.ordering.gotoOrderReview()
            })
        }, 'LOADORDERRESPONSE')
    };

    // Build a previous order. This is called for each previous order.
    // Note: the order passed in is actually the PREVIOUSORDER element.
    self.buildOrder = function(orderIndex, previousOrder) {
        // Taken from Nextep mobile.
        self._debug('build order - ' + orderIndex)
        self._debug(previousOrder)

        // clone the template for displaying a previous order
        var orderHtml = $('#previousorder').clone()

        // set the order date time to be displayed
        orderHtml.attr('id', 'previousorder' + String(orderIndex))
        var date = orderHtml.find('#orderdate')

        // Get the date off the PREVIOUSORDER object
        var orderDate = new Date(previousOrder.date)
        var dayOfWeek = dateFormatting.dayOfWeek(orderDate.getDay())
        date.append(dayOfWeek + ', ' + dateFormatting.month(orderDate.getMonth()) + ' ' + orderDate.getDate())


        // build the item/mod list
        var itemHtml = orderHtml.find('#previousOrderItem').clone()
            //$('#previousOrderItem').remove();

        if (previousOrder.ORDER) {
            var order = previousOrder.ORDER
            var previousOrderItem = null
            previousOrder.ORDER.previousorderid = previousOrder.orderintid
            console.log(previousOrder)

            var items = self._convertToArray(order.ITEM)

            for (var i = 0; i < items.length; i++) {
                // The content of this for loop has been moved to getItemHtml.
                var orderItem = items[i]
                previousOrderItem = self._getItemHtml(orderItem, itemHtml, i)

                if (previousOrderItem !== null) {
                    orderHtml.find('#items').append(previousOrderItem)
                    self._debug('1 ORDER HTML NOW: ')
                    self._debug(orderHtml.html())
                }
            }
        } else {
            console.log('ORDER is not an array and is expected to be')
                //self._appendHtml(order.ITEM, itemHtml);
        }

        // set the onclick event to load the previous order
        var loadOrderLink = orderHtml.find('#loadOrder')
        loadOrderLink.attr('onclick', '_nex.previousOrders.loadOrder(' + orderIndex + ')')

        // append all the order HTML to the orders element
        orderHtml.css('visibility', '')
        orderHtml.css('display', '')
        self._debug('Appending total order HTML now...')
        self._debug(orderHtml.html())
        orderHtml.appendTo('#orders')
        self._debug('Orders is now: ')
        self._debug($('#orders').html())
    };

    // Get HTML for the item that is to be added.
    // Pass in a unique id.
    self._getItemHtml = function(orderItem, itemHtml, index) {
        // Clone the previous order item.
        var previousOrderItem = itemHtml.clone()


        // Copy the item.
        var item = _nex.assets.theme.itemByPosid(orderItem.posid)
        if (item) {
            // Re-assign the id.
            var tempId = previousOrderItem.attr('id')
            var newId = tempId + index
            previousOrderItem.attr('id', newId)

            // Update the item text.
            var itemtext = previousOrderItem.find('#receipttext')
            itemtext.empty()

            itemtext.append(orderItem.quantity + ' - ' + itemFormatting.buttonText(_nex.assets.theme.itemTextByType(item, 'RECEIPTTEXT')))

            var bimage = previousOrderItem.find('#bimage')
            if (bimage.length > 0) {
                bimage.empty()
                var posid = order.ITEM[i].posid
                var imageurl = _nex.assets.theme.itemByPosid(posid).DETAIL.image

                if (imageurl.length > 0 && themeid.length > 0) {
                    url = _nex.assets.theme.mediaRootUri
                    if (url.toLowerCase().indexOf(_nex.assets.theme.id.toLowerCase()) === -1) {
                        url += '/' + _nex.assets.theme.id
                    }
                    url += '/media/images/' + imageurl

                    $(bimage).css({
                        'background-image': 'url(' + url + ')'
                    })
                }
            }

            // create the mod array if it does not exist
            orderItem.ITEM = self._convertToArray(orderItem.ITEM)

            // use the itemFormatting method in global.js
            var modReceiptText = itemFormatting.buildModReceiptText(orderItem)
            var modtext = previousOrderItem.find('#modtext')
            modtext.empty()
            modtext.append(modReceiptText)

            // unhide the previous order item that was cloned
            self._debug(previousOrderItem.html())
            previousOrderItem.css('visibility', '')
            previousOrderItem.css('display', '')

        } else {
            self._debug('Could not lookup item in POS')

            previousOrderItem.css('visibility', '')
            previousOrderItem.css('display', '')

            //itemHtml.find('#items').append("-");
        }

        index++
        return previousOrderItem
    };
}
// RepeatOrders phase (used to be called PreviousOrders).
function RepeatOrderPhase() {
    var self = this

    // Optional debugging.
    self.debugEnabled = false
    self.debug = function() {
        if (self.debugEnabled) {
            console.debug('RepeatOrderPhase', arguments)
        }
    }

    // Easy reset of all variables.
    self.reset = function() {
        // reset any local variables.

        // hide the phase
        self.hide()
    };

    // Entry point.
    self.start = function() {
        var repeatOrderPrompt = new RepeatOrderPrompt(self, self.theme, self.soundManager, self.popupManager)
        repeatOrderPrompt.updateUI()
        self.show()
    };

    // Exit point.
    self.stop = function() {
        self.reset()
    };

    // Hide the clip.
    self.hide = function() {
        // Hide the content of this clip.
        $('#repeatOrderphase').hide()
    };

    // Show the clip.
    self.show = function() {
        $('#repeatOrderphase').show()
    };

    // Returns the button list from the htmltheme.xml (if available);
    // otherwise, some defaults.
    self.getButtonList = function(isPostOrdering) {
        var buttonList = []
        buttonList.push({ 'type': 'phone' })
        buttonList.push({ 'type': 'face' })
        buttonList.push({ 'type': 'credit' })
        buttonList.push({ 'type': 'cancel' })
            //<OPTION type="phone"  buttontextattribute="lookupphonebutton" popuptextattribute="lookupphonemessage" />
            //<OPTION type="face"  buttontextattribute="lookupfacebutton" popuptextattribute="lookupfacemessage" />
            //<OPTION type="credit"  buttontextattribute="lookupcreditbutton" popuptextattribute="lookupcreditmessage" />
            //<OPTION type="cancel" buttontextattribute="fullmenubutton" popuptextattribute="" />
        var theme = _nex.assets.theme.lastUpdate.THEMES.THEME
        var phases = theme.PHASE
        for (var phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
            // We want to look at the options setup in previous orders or post ordering phase depending on where we are at in the process.
            var phaseId = 'previousorders';
            if (isPostOrdering) {
                phaseId = 'postordering';
            }
            var phase = phases[phaseIndex]
            if (phase.id == phaseId) {
                var clips = phase.CLIP
                for (var clipIndex = 0; clipIndex < clips.length; clipIndex++) {
                    var clip = clips[clipIndex]
                    if (clip.hasOwnProperty('OPTION')) {
                        buttonList = clip.OPTION
                        return buttonList
                    }
                }
            }
        }

        self.debug('.getButtonList', buttonList)
        return buttonList
    };

    // Returns the repeat order element from the payment profile (if available);
    // otherwise, some defualts.
    self.getRepeatOrderElement = function() {
        var element = null
        if (_nex.assets.theme.kiosk.PAYMENTPROFILE.REPEATORDERS) {
            element = _nex.assets.theme.kiosk.PAYMENTPROFILE.REPEATORDERS
        } else {
            element = {
                'phone': 'true',
                'face': 'false',
                'credit': 'true',
                'cancel': 'true'
            }
        }
        return element
    };

    self.showLookupOptions = function(postOrdering) {
        var lookupButtonContainer = $('#lookupContainer')
        var cancelText = 'Cancel';
        var optionMessage = 'Option message';
        var buttonList = self.getButtonList(postOrdering)

        var repeatOrderOptions = new RepeatOrderOptions(postOrdering || false)
        repeatOrderOptions.init(lookupButtonContainer, cancelText, optionMessage, buttonList)
        repeatOrderOptions.bindButtons()
        repeatOrderOptions.show()

    };

    // Go to ordering. Optionally pass in an existing order to start ordering with.
    self.gotoOrdering = function(order) {
        // If we have a previous order that was selected ...
        if (order) {
            self._gotoOrderingWithOrder(order)
        } else {
            self._gotoOrderingWithoutOrder()
        }
    }

    // Go to ordering without an order.
    self._gotoOrderingWithoutOrder = function() {
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function() {
            _nex.ordering.start()
        })
    };

    // Go to ordering with a previous order.
    self._gotoOrderingWithOrder = function(order) {
        // Show a popup to let the user know we are doing a round trip.
        self._popupProcessing()

        // Build and send the request object.
        var requestObject = new _nex.commands.LoadOrder(order)
        _nex.communication.send(requestObject, function(result) {
            // Once the response is received, hide the popup.
            self._popupProcessingHide()

            // Update the ordering object.
            _nex.orderManager.currentOrder.update(result.ORDER)

            // Change phases to the ordering phase; go to order review.
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function() {
                _nex.ordering.start()
                _nex.ordering.gotoOrderReview()
            })
        }, 'LOADORDERRESPONSE')
    };

    // The processing popup. Optional parameters message and callback.
    self._popupProcessing = function(message, callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.processingPopup)
        popup.message = message || _nex.assets.theme.getTextAttribute("PREVIOUSORDERS", "processing", "Processing ...");
        _nex.assets.popupManager.showPopup(popup, function() {
            if (callback) {
                callback()
            }
        })
    };

    // Hide processing popup.
    self._popupProcessingHide = function(callback) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.processingPopup)
        _nex.assets.popupManager.hidePopup(popup, function() {
            if (callback) {
                callback()
            }
        })
    };

    self.gotoSplash = function() {
        // alert('going to splash');
    }

}
// Constructor. Represents the SMS phase.
// If a user gets here, and SMS is not enabled, it goes
// to the green receipts phase.
function sms(phaseParameters) {
    var self = this
    self.timer = null


    // Guard against missing parameters.
    if (!phaseParameters) {
        console.log('ERROR: SMS requires parameters')
    }
    if (!phaseParameters.theme) {
        console.log('ERROR: SMS requires parameter: theme')
    }

    self._theme = phaseParameters.theme

    var debugEnabled = true
    self._debug = function() {
        if (debugEnabled) {
            console.debug('SMS', arguments)
        }
    }

    // Start the timer.
    self.startTimer = function() {
        self._debug('!!!Starting SMS timer')
        var timeout = self._getTimeoutSeconds()
        if (self.timer) {
            self.timer.stop()
            self.timer = null
        }
        self.timer = new TimeoutTimer(this, self._gotoNextPhase, timeout)
        self.timer.start()
        self.popupPhone()
    };

    // Stop the timer.
    self.stopTimer = function() {
        if (self.timer) {
            console.log('!!!Stopping SMS timer')
            self.timer.stop()
            self.timer = null
        }
    }

    // Called when this phase begins.
    self.start = function() {
        console.debug('SMS: Phase started')
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.COMPLETING)

        // If green receipt is enabled:
        if (self._smsenabled() && (!_nex.orderManager.currentOrder.smsNumber)) {
            // Bind the options.
            console.debug('SMS: ENABLED')
            self.startTimer()
        } else {
            console.debug('SMS: DISABLED')
                // Go to the complete phase.
            self._gotoNextPhase()
        }
    }

    self.stop = function() {
        self.stopTimer()
    };

    // Popup for a phone.
    self.popupPhone = function() {
        // Get the popup object.
        var popupString = 'phonepadPopup';
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString])

        // For some reason, setting the message wipes out the rest of the page.
        popup.message = _nex.assets.theme.getTextAttribute('PREVIOUSORDERS', 'instructions2', 'Phone Number')
            // Bind methods to call when they hit the buttons.
        popup.buttons[0].clickEvent = '_nex.previousOrders.cancelFetchOrders();';
        popup.buttons[0].text = _nex.assets.theme.getTextAttribute('PREVIOUSORDERS', 'popupclear', 'CANCEL')

        // Show the popup.
        _nex.assets.popupManager.showPopup(popup)

        // When they hit the final digit of their phone number, continue on.
        var lastDigitCallback = function() {
            var lookup = new LookupData(_nex.types.lookup.PHONE, _nex.keyboard.phonepad.data)
            _nex.orderManager.currentOrder.smsNumber = lookup.lookupValue
            var req = new _nex.commands.AddSMSToOrder(_nex.orderManager.currentOrder.orderid, _nex.orderManager.currentOrder.smsNumber)
            _nex.communication.send(req)
            _nex.assets.popupManager.hidePopup(popup, function() {
                self._gotoNextPhase()
            })
        };
        _nex.keyboard.phonepad.bindKeys(lastDigitCallback)
    };

    // Check whether or not green receipt is enabled.
    self._smsenabled = function() {
        var result = false
        try {
            var theme = self._theme
            var system = theme.system
            if (system && system.ODS && system.ODS.smsnotification) {
                result = true
            }
            if (_nex.orderManager.currentOrder.smsNumber) result = false
            if (theme.disablesmsprompt) result = false

        } catch (ex) {}
        return result
    };

    // Go to the complete phase.
    self._gotoNextPhase = function() {
        self.stop()

        self._debug('Changing phase to complete.')
        _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.GREEN_RECEIPT, function() {
            _nex.greenReceipt.start()
        })
    };

    // Helper to return the number of seconds before jumping to the next screen.
    self._getTimeoutSeconds = function() {
        var timeout = 30
        return timeout
    };
}
// Constuctor. Represents the splash phase.
function SplashPhase() {
    var self = this
    self._startPending = false
    self.actions = null
    self.firsttime = false
    self._deviceData = null
    self.barcodeData = null
    self.userSwipedToStart = false
    self.clickX = window.innerWidth / 2
    self.clickY = window.innerHeight / 2
    self.handledSplashClick = false // set to true when the screen is moved to where the user clicked
    self.splashSettings = null
    self.redirected = false
    self.barcodescanmenu = null
    self._voiceoverDelay = 2000 // default 2 second delay before playing splash voiceover
    self._proximityListener = null

    // Set this to true to enable debugging of the splash phase.
    var enableDebugging = true
    self._debug = function() {
        if (enableDebugging) {
            console.debug('SplashPhase', arguments) // use built-in arguments object
        }
    }

    // This method is called by the CreateJS JavaScript after it has finished.
    // Takes an option parameter btnReturningGuestId if the start button is not the one specified in the system actions. 
    self.start = function(canvasElementId, btnFirstTimeId, btnReturningGuestId) {
        // Set internal variables back to default.
        self._reset()

        self._proximityListener = _nex.communication.createListener('PROXIMITYTRIGGERED', self._proximityTriggered)
        _nex.communication.addListener(self._proximityListener)

        // Send a status update to the UI manager.
        _nex.manager.sendStatusUpdate(_nex.manager.statusType.IDLE)

        if (!_nex.assets.theme.splashid) {
            console.error('Could not load the splash id from the theme!')
        }

        // Check actions. This sets an array for each action enabled.
        self._checkActions(_nex.assets.theme.splashid)
        self._debug('start', 'actions enabled', self.actions)

        // Check splash settings for things like the resolution to display the ordering phase, and copyright.
        self._checkSplashSettings(_nex.assets.theme.splashid)
        self._debug('start', 'splash settings', self.splashSettings)

        // If the video feed is enabled:
        // TODO : add FacePay option to the payment profile to enable this option
        if (_nex.assets.theme.hasvideo) {
            self._debug('start', 'Adding video feed.')
            self._addVideoFeed() //TODO: needs to be refactored to only add the video feed to splash when FR tender is used
        }

        // If the start ordering action is enabled:
        if (self.actions.startorder) {
            self._debug('start', 'Binding buttons for first time and returning guest.')
            self._bindButtons(canvasElementId, btnFirstTimeId, btnReturningGuestId)
        }

        // If barcode scan is enabled:
        if (self.actions.barcodescan) {
            self._debug('start', 'Barcode action is enabled... Listening for barcode')
            self.swipeToStartAction = new SwipeToStartAction(_nex.assets.theme)
            self.swipeToStartAction.startListening(self.barcodeToStart)
        } else if (self.actions.cardswipe) {
            // only listen for swipes if we aren't listening for barcodes
            self._debug('start', 'Cardswipe action is enabled... Listening for cardswipe')
            self.swipeToStartAction = new SwipeToStartAction(_nex.assets.theme)
            self.swipeToStartAction.startListening(self.deviceToStart)
        }

        var splashvideoid = 'splashvideo';
        self.showMovie(btnFirstTimeId, btnReturningGuestId, splashvideoid)
    };

    self.showMovie = function(btnFirstTimeId, btnReturningGuestId, splashvideoid) {
        // If a background was specified for the splash:
        if (_nex.assets.theme.hasOwnProperty('kiosk') && _nex.assets.theme.kiosk.hasOwnProperty('splashbg')) {
            // Try and set it. If this fails, it should not cause any issue, but it will log that it failed.
            var filepath = _nex.assets.theme.mediaPath()
            filepath += 'Other/'
            var filename = _nex.assets.theme.kiosk.splashbg
            if (filename.length === 0) {
                filename = 'splash.webm'; // default to splash.webm 
            }
            self.setBackground(filepath, filename, btnFirstTimeId, btnReturningGuestId, splashvideoid)
        }
    }

    // Called when exiting the splash phase, e.g. going offline.
    self.stop = function() {
        // Stop the CreateJS ticker.
        self._stopTicker()
    };

    // Called when a user clicks the splash screen to start.
    self.clickToStart = function() {
        self._trackClick()
        _nex.assets.theme.languageSelected = 'english'
        self._startHelper()
    };

    // For the enhanced splash screen. Called when user clicks first time to start.
    self.firstTimeToStart = function() {
        self._trackFirstTime()
        _nex.assets.theme.languageSelected = 'english'
        self._startHelper()
    };

    // For the enhanced splash screen. Called when user clicks returning guest to start.
    self.returningGuestStart = function() {
        self._trackReturningGuest()
        _nex.assets.theme.languageSelected = 'english'
        self._startHelper()
    };

    // Called when a user clicks on the camera frame to start.
    self.cameraFrameClicked = function() {
        self._trackClickVideo()
        _nex.assets.theme.languageSelected = 'english'
        self._startHelper()
    };

    // Called when a user swipes to start.
    self.deviceToStart = function(deviceData) {
        self._trackSwipe()
        self.userSwipedToStart = true
        _nex.assets.theme.languageSelected = 'english'
        self._startHelper(deviceData)
    };

    // Called when a user scans a barcode to start.
    self.barcodeToStart = function(barcodeData) {
        self._trackBarcode()
        self.userSwipedToStart = false
        _nex.assets.theme.languageSelected = 'english'
        self._startHelper(barcodeData, true)
    };

    // Called when a user picks an alternate language to start.
    self.alternateLanguageToStart = function(language) {
        self._trackAlternateLanguage(language)
        _nex.assets.theme.languageSelected = language

        // Inject the language on the body element. Helps creative tie into it for visually impaired and other styling. 
        $('body').attr('data-language', _nex.assets.theme.languageSelected)
        self._startHelper()
    };

    // PRIVATE / HELPER METHODS

    // Restore original state of the splash phase.
    self._reset = function() {
        self.firsttime = false
        self._deviceData = null
        self.barcodeData = null
        self.userSwipedToStart = false
        self.handledSplashClick = false
        self._resetRotateTimer()
        _nex.assets.popupManager.hideAllPopups()
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
            _nex.utility.deviceListener = null
        }
        _nex.orderManager.customData = {}
        $('body').attr('data-language', '')

        if (_nex.assets.theme.system.hasOwnProperty('voiceoverdelay') &&
            _nex.assets.theme.system.voiceoverdelay.length > 0) {
            self._voiceoverDelay = Number(_nex.assets.theme.system.voiceoverdelay)
        }

        _nex.communication.removeListener(self._proximityListener)
    };

    self._proximityTriggered = function() {
        if (_nex.manager.currentStatus.toLowerCase() === 'idle') {
            if (_nex.assets.theme.splashVoiceover.toString().length > 0) {
                window.setTimeout(function() {
                    _nex.assets.soundManager.playVoiceover(_nex.assets.theme.splashVoiceover)
                }, self._voiceoverDelay)
            }
        }
    }

    // Set the screen to original positioning.
    self._resetRotateTimer = function() {
        if (_nex.utility.rotateTimer) {
            _nex.utility.rotateTimer.reset()
        }
    }

    // Setup the video feed.
    self._addVideoFeed = function() {
        // cam feed frame.  The reason why there is an iframe is due to an issue with Chromium for basic auth where the user name and password was stripped from the img tag.
        // This does not happen to iframes.  But the credentials get cached by the iframe so the img tag works.
        if (_nex.assets.theme.hasvideo) {
            var url = 'http://127.0.0.1:8088';
            if (_nex.assets.theme.frenabled) {
                url = 'http://127.0.0.1:8089';
            }

            var password = 'Kiosk1';
            var userid = 'nextep';
            var feedUrl = '"' + url + '"';

            feedUrl = feedUrl.replace('http://', 'http://' + userid + ':' + password + '@')

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
    }

    // Setup the first start button.
    self._bindFirstStart = function(btnFirstTimeId) {
        self._debug('Binding first start')

        var firstStart = null

        if (btnFirstTimeId) {
            // Override.
            firstStart = $('#' + btnFirstTimeId)
        } else if (self.actions.startorder.firststartbuttonid) { //  TODO: Add this attribute. There is a buttonid but no firststartbuttonid
            // use it to get the button.
            firstStart = $('#' + self.actions.startorder.firststartbuttonid)
        }

        if (firstStart && firstStart.length > 0) {
            firstStart.button()
            firstStart.unbind('click')
            firstStart.click(function(event) {
                    // Call the click to start method.
                    self.firsttime = true
                    self.firstTimeToStart()
                    self.clickX = event.pageX
                    self.clickY = event.pageY
                })
                // There was an issue where the button was resizing on the second time through to less than the screen height...
                // this should fix that issue.
            firstStart.css('height', function() {
                return window.innerHeight
            })
        }
    }

    // Setup the guest start button.
    self._bindGuestStart = function(btnReturningGuestId) {
        self._debug('Binding guest start')

        var guestStart = null

        if (btnReturningGuestId) {
            // Override.
            guestStart = $('#' + btnReturningGuestId)
        } else if (self.actions.startorder.buttonid) {
            // use it to get the button.
            guestStart = $('#' + self.actions.startorder.buttonid)
        }

        if (guestStart && guestStart.length > 0) {
            guestStart.button()
            guestStart.unbind('click')
            guestStart.click(function(event) {
                    // Call the click to start method.
                    self.firsttime = false
                    self.returningGuestStart()
                    self.clickX = event.pageX
                    self.clickY = event.pageY
                })
                // There was an issue where the button was resizing on the second time through to less than the screen height...
                // this should fix that issue.
            guestStart.css('height', function() {
                return window.innerHeight
            })
        }
    }

    // Setup the language button.
    self._bindLanguageButtons = function() {
        if (!self.actions.selectlanguage) {
            return
        }
        self._debug('Binding language buttons')

        var languageIds = self.actions.selectlanguage
        var languageid = '';
        var languageAction = null

        //var languageid = 'spanish';
        self._debug('Found languages ', languageIds)
        if (languageIds.length > 0) {
            languageAction = new SetLanguageAction(_nex.assets.theme)
        }

        for (var index = 0; index < languageIds.length; index++) {
            var languageObject = languageIds[index]
            if (languageObject && languageObject.hasOwnProperty('languageid')) {
                languageid = languageObject.languageid
            }
            self._debug('select language is enabled... adding the alernate language button for language id ', languageid)
            var languageButtonId = languageid + 'ToStart';
            var onClick = "_nex.splashPhase.alternateLanguageToStart('" + languageid + "')"
            var element = $('#' + languageButtonId)
            if (element.length > 0) {
                element.attr('onclick', onClick)
                element.attr('class', 'alternateLanguageToStart')
            } else {
                $('#splash').append('<div class="alternateLanguageToStart" id="' + languageButtonId + '" onclick="' + onClick + '"></div>')
            }

            // Create the language action.
            var defaultText = languageid
            if (languageid === 'spanish') {
                defaultText = 'ESPAÑOL';
            }
            languageAction.initialize(languageid, $('#' + languageButtonId), defaultText)
        }
    }

    // Bind returning guest and first time buttons to the splash screen.
    self._bindButtons = function(canvasElementId, btnFirstTimeId, btnReturningGuestId) {
        self._bindFirstStart(btnFirstTimeId)
        self._bindGuestStart(btnReturningGuestId)
        self._bindLanguageButtons()
    };

    // Called when we no longer want to listen for a card swipe, e.g. leaving hte splash phase.
    self._stopListeningForDevice = function() {
        if (self.swipeToStartAction) {
            self.swipeToStartAction.stopListening()
        }
    }

    // Checks the swipe data and hands processing over to the SwipeToStart action.
    self._checkSwipeData = function() {
        var cardParser = new CardParser(_nex.assets.theme)
        cardParser.parse(self._swipeData.track1, self._swipeData.track2, self.swipeToStartAction.goodSwipe, self.swipeToStartAction.badSwipe)
    };

    // Stop the createjs ticker.
    self._stopTicker = function() {
        // If we don't stop the ticker, then we were getting 404 errors on .ajax calls for media downstream, and certain
        // clips and images won't load properly.
        if (createjs && createjs.Ticker) {
            createjs.Ticker.reset()
        }
    }

    // This method contains logic common to the different ways of starting from the splash screen.
    self._startHelper = function(data, barcodeToStart) {
        if (!self._startPending) {
            self._startPending = true
                // Stop listening for card swipes to start.
            self._stopListeningForDevice()
            self._deviceData = '';
            self._stopTicker()

            _nex.assets.soundManager.cancelVoiceover()

            // If there is data present, they swiped to start or used a barcode to start.
            if (data) {
                self._deviceData = data
            }

            // Create a customer response listener to retrieve a related Guest Account based on facial recognition. 
            // The customer response message is the result of the create order command sent below (hijacked). The 
            // create order command spawns a customer inquiry command sent from the client to the TM then a 
            // request guest orders command sent from the TM to mynextep services. The TM then responds with a 
            // customer response message that is handled here.
            _nex.communication.addListener(_nex.communication.createListener('CUSTOMERRESPONSE', function(message) {
                    // A Guest Account was returned via facial recognition search -- populate the JS object from the response...
                    if (message.CUSTOMER !== undefined && message.CUSTOMER !== null && Boolean(message.CUSTOMER.facesearch)) {
                        // The Guest Account has a location...
                        if (message.CUSTOMER.LOCATION !== undefined && message.CUSTOMER.LOCATION !== null) {
                            var isGuestAccountLocation = false

                            //The Guest Account has multiple locations...
                            if (Array.isArray(message.CUSTOMER.LOCATION)) {
                                for (var i = 0; i < message.CUSTOMER.LOCATION.length; i++) {
                                    // The Guest Account is valid for this location...
                                    if (message.CUSTOMER.LOCATION[i].identifier === _nex.assets.theme.system.storeid) {
                                        isGuestAccountLocation = true
                                        break;
                                    }
                                }
                            } else {
                                // The Guest Account is valid for this location...
                                if (message.CUSTOMER.LOCATION.identifier === _nex.assets.theme.system.storeid) {
                                    isGuestAccountLocation = true
                                }
                            }

                            // The Guest Account is valid for this location...
                            if (isGuestAccountLocation) {
                                _nex.hasGuestAccount = true
                                _nex.guestAccount = new GuestAccount(message.CUSTOMER.guestaccountid, message.CUSTOMER.firstname, message.CUSTOMER.lastname, message.CUSTOMER.email, message.CUSTOMER.thumbnail64, message.CUSTOMER.ACCOUNT)
                                console.log(_nex.guestAccount)
                                    //alert("Guest Account Found\n" + _nex.guestAccount.firstName + " " + _nex.guestAccount.lastName + " (email: " + _nex.guestAccount.email + ")\naccounts: " + _nex.guestAccount.chargeableLocalAccounts.length);
                            }
                        }
                    }
                }, true))
                //End Customer Response Listener -- Guest Account Lookup via Facial Recognition

            // Create the order.
            _nex.communication.send(new _nex.commands.CreateOrder(_nex.assets.theme.hasvideo, _nex.assets.theme.frenabled), function() {
                self._startPending = false
                _nex.orderManager.startOrder()

                // initialize the 'flash' on the facial recognition
                if (!_nex.initializedFlash && _nex.assets.theme.hasvideo && _nex.assets.theme.frenabled) {
                    var cmdFlash = new _nex.commands.VideoFeedQueueFlash()
                    _nex.communication.send(cmdFlash)
                    _nex.initializedFlash = true
                }

                if (self._deviceData && self.barcodescanmenu && barcodeToStart) {
                    // The user scanned a barcode to start. Go to the barcode scan menu.
                    _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function() {
                        self.barcodeData = self._deviceData
                        _nex.ordering.start(self.barcodescanmenu)
                    })
                } else if (self._deviceData && _nex.previousOrders.isPreviousOrdersEnabled()) {
                    // The user swiped to start. Look up previous orders.
                    console.log('User swiped to start. Going to previous orders')
                    _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PREVIOUS_ORDERS, function() {
                        _nex.previousOrders.start(self._deviceData)
                    })
                } else if (self.firsttime === false && _nex.previousOrders.isPreviousOrdersEnabled()) {
                    // The user did not swipe to start, but previous orders are enabled. Go to the previous orders phase.
                    _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.PREVIOUS_ORDERS, function() {
                        _nex.previousOrders.start()
                    })
                } else {
                    // Go to ordering.
                    _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function() {
                        _nex.ordering.start()
                    })

                }
            }, 'CREATEORDERRESPONSE')
        }
    }


    // Setup enabled actions.
    self._checkAction = function(action) {
        if (action.actionid === 'adminswipe' && action.enabled === 'true') {
            self.actions.adminswipe = action
        } else if (action.actionid === 'cardswipe' && action.enabled === 'true') {
            self.actions.cardswipe = action
        } else if (action.actionid === 'startorder' && action.enabled === 'true') {
            self.actions.startorder = action
        } else if (action.actionid === 'futureorder' && action.enabled === 'true') {
            self.actions.futureorder = action
        } else if (action.actionid === 'playanimation' && action.enabled === 'true') {
            self.actions.playanimation = action
        } else if (action.actionid === 'selectlanguage' && action.enabled === 'true') {
            if (!self.actions.selectlanguage) {
                self.actions.selectlanguage = []
            }
            self.actions.selectlanguage.push(action)
        } else if (action.actionid === 'barcodescan' && action.enabled === 'true') {
            if (!action.barcodescanmenu) {
                console.log('Error! No barcode scan menu specified!')
            }
            self.actions.barcodescan = action
            self.barcodescanmenu = action.barcodescanmenu
        }
    }

    // Helper for checking which actions are enabled.
    self._checkItem = function(item, splashId) {
        // there can be settings for the SPLASH screen for the POS, for example.    
        // we are just interested in the default settings, or ones for the kiosk.
        var action = null
        if (item.id === splashId) {
            if (item.ACTION) {
                if (Array.isArray(item.ACTION)) {
                    for (var actionIndex = 0; actionIndex < item.ACTION.length; actionIndex++) {
                        action = item.ACTION[actionIndex]
                        self._checkAction(action)
                    }
                } else {
                    action = item.ACTION
                    self._checkAction(action)
                }
            }
        }
    }

    // Check which actions are enabled on the splash screen.
    self._checkActions = function(splashId) {
        var userInterface = _nex.assets.theme.system.USERINTERFACE
        self.actions = {}
        var item = null
        if (userInterface.SPLASH) {
            if (Array.isArray(userInterface.SPLASH)) {
                for (var index = 0; index < userInterface.SPLASH.length; index++) {
                    item = userInterface.SPLASH[index]
                    self._checkItem(item, splashId)
                }
            } else {
                item = userInterface.SPLASH
                self._checkItem(item, splashId)
            }
        }
    }

    // Check which resolution is set in the splash touch settings.
    self._checkSplashSettings = function(splashId) {
        self._debug('Checking splash settings for splash id ' + splashId)
        var userInterface = _nex.assets.theme.system.USERINTERFACE
        var item = null
        if (userInterface.SPLASH) {
            if (Array.isArray(userInterface.SPLASH)) {
                for (var index = 0; index < userInterface.SPLASH.length; index++) {
                    item = userInterface.SPLASH[index]
                    if (item.id === splashId) {
                        self.splashSettings = item
                    }
                }
            } else {
                item = userInterface.SPLASH
                if (item.id === splashId) {
                    self.splashSettings = item
                }
            }
        }

        // If we were able to find splash settings for this computer, update the copyright notice.
        if (self.splashSettings) {
            try {
                _nex.authToken.copyright = self.splashSettings.SPLASHTEXT.copyright
                self._debug(_nex.authToken.copyright)
                    // insert line breaks in to splash text
                if (_nex.splashPhase.splashSettings.SPLASHTEXT.hasOwnProperty('INSTRUCTION')) {
                    _nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION = $.isArray(_nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION) ? _nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION : new Array(_nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION)
                    for (var s = 0; s < _nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION.length; s++) {
                        var text = _nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION[s].message
                        if (text !== undefined) {
                            text = text.replace(/~/g, '\n') // createjs does not support <br/>
                            text = text.trim()
                        }

                        _nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION[s].message = text
                    }
                }
            } catch (e) {
                console.log('ERROR SETTING COPYRIGHT')
                console.log(e)
            }
        } else {
            console.error('UNABLE TO LOAD SPLASH SETTINGS')
        }
    }

    // Track a click on the splash screen. 
    self._trackClick = function() {
        var BUTTON_ID = ''; // Will be translated to NULL
        var BUTTON_TEXT = ''; // Will be inserted as empty string
        var MENU_ID = ''; // Will translate to NULL
        var CONTEXT = 'SplashAction';
        var BUTTON_TYPE = 'control'; // will be translated to control
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE)
    };

    // Track a click on the video feed.
    self._trackClickVideo = function() {
        var BUTTON_ID = ''; // Will be translated to NULL
        var BUTTON_TEXT = 'Video Feed'; // Will be inserted as empty string
        var MENU_ID = ''; // Will translate to NULL
        var CONTEXT = 'SplashAction';
        var BUTTON_TYPE = 'control'; // will be translated to control
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE)
    };

    self._trackFirstTime = function() {
        var BUTTON_ID = ''; // Will be translated to NULL
        var BUTTON_TEXT = 'First Time';
        var MENU_ID = ''; // Will translate to NULL
        var CONTEXT = 'SplashAction';
        var BUTTON_TYPE = 'control'; // will be translated to control
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE)
    };

    self._trackReturningGuest = function() {
        var BUTTON_ID = ''; // Will be translated to NULL
        var BUTTON_TEXT = 'Returning Guest';
        var MENU_ID = ''; // Will translate to NULL
        var CONTEXT = 'SplashAction';
        var BUTTON_TYPE = 'control'; // will be translated to control
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE)
    };

    // Track a swipe to start.
    self._trackSwipe = function() {
        var BUTTON_ID = ''; // Will be translated to NULL
        var BUTTON_TEXT = 'swipe'; // Change to swipe to indicate 'swiped to start'
        var MENU_ID = ''; // Will translate to NULL
        var CONTEXT = 'SplashAction';
        var BUTTON_TYPE = 'control'; // will be translated to control
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE)
    };

    // Track a barcode scan to start.
    self._trackBarcode = function() {
        var BUTTON_ID = '';
        var BUTTON_TEXT = 'barcode';
        var MENU_ID = '';
        var CONTEXT = 'SplashAction';
        var BUTTON_TYPE = 'control';
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE)
    };

    // Track alternate language to start.
    self._trackAlternateLanguage = function(language) {
        var BUTTON_ID = ''; // Will be translated to NULL
        var BUTTON_TEXT = language // TODO: Verify if this is preferred way
        var MENU_ID = ''; // Will translate to NULL
        var CONTEXT = 'SplashAction';
        var BUTTON_TYPE = 'control'; // will be translated to control
        _nex.utility.buttonTracking.track(BUTTON_ID, BUTTON_TEXT, MENU_ID, CONTEXT, BUTTON_TYPE)
    };

    // Helper function to set the background to a webm file. This can be a video file or an image.
    self._setBackgroundWebm = function(filePath, callback, firstTimeElementId, returningGuestElementId, splashVideoElementId) {
        console.log('Loading splash video onto element')
        var video = document.getElementById(splashVideoElementId)
        if (!video) {
            console.log('Missing element ' + splashVideoElementId)
            return;
        }
        var source = document.createElement('source')

        console.log('Videofile: ' + filePath)

        // In mynextep the options to choose from are in the "other' folder.
        source.setAttribute('src', filePath)

        video.appendChild(source)
        video.play()
        $('#' + splashVideoElementId).show()

        //_nex.splashPhase.start("canvas", "btnFirstTime", "btnReturningGuestId");
        var selector = '#' + firstTimeElementId + ', #' + returningGuestElementId

        $(selector).bind('click', function() {
            $('#' + splashVideoElementId).hide()
            callback()
        })

        self._setCopyright()
    };

    self._setCopyright = function() {
        // add the copyright.
        var copyrightText = copyrightNotice()
        var copyrightHtml = '<div id="copyright">' + copyrightText + '</div>'
        self._debug('Appending ' + copyrightHtml)
        $('#splash').append(copyrightHtml)
    };

    // Set the background to a video or image on the splash screen.
    self.setBackground = function(filepath, filename, firstTimeElementId, returningGuestElementId, splashVideoElementId) {
        var fullpath = filepath + filename

        if (fullpath.endsWith('webm')) {
            var callback = _nex.splashPhase.clickToStart
            self._setBackgroundWebm(fullpath, callback, firstTimeElementId, returningGuestElementId, splashVideoElementId)
        }
    }
}

function LookupPopup(postOrdering) // extends YesNoPopup
{
    var ARTIFICIAL_DELAY_LOOK = 1500
    var ARTIFICIAL_DELAY_FR = 1500
    var ARTIFICIAL_DELAY_LOOKUP = 1500
    var ARTIFICIAL_DELAY_FOUND = 1500
    var ARTIFICIAL_DELAY_NOT_FOUND = 1500

    // Copied from the Flash then modified.
    var self = this
    self.postOrdering = postOrdering || false
    var initializedFlash = false

    self._currentButtonXml = null //;
    self._barCodeListener = null //:BarCodeScanListener;
    self._yesButton = {}
    self._noButton = {}

    self.setButtonXml = function(buttonXml) {
        self._currentButtonXml = buttonXml
    };

    self.enableDebugging = true
    self.debug = function() {
        if (self.enableDebugging) {
            console.debug('LookupPopup', arguments)
        }
    }

    // For face recognition.
    self.popupFace = function() {
        self.debug('popup face')
        var noClicked = false

        if (_nex.assets.theme.frenabled) {
            var cmdGrid = new _nex.commands.VideoFeedDots(1)
            _nex.communication.send(cmdGrid)
        }

        // Start listening for a face response
        _nex.previousOrders.yesClicked = false
        _nex.previousOrders.noClicked = false
        var popup = $.extend(true, {}, _nex.assets.popupManager.lookupPopupVideo)
            //popup.message = _nex.assets.theme.getTextAttribute("REPEATORDERS", "lookupfacemessage", "Repeat order by face recognition");
        popup.message = _nex.assets.theme.getTextAttribute('REPEATORDERS', 'lookuplookmessage', 'Please look at the camera')
        popup.buttons[0].clickEvent = '_nex.previousOrders.noClicked = true;';
        popup.buttons[0].text = _nex.assets.theme.getTextAttribute('ORDER', 'cancel', 'Cancel')

        // Show the popup.
        _nex.assets.popupManager.showPopup(popup, function() {
            self.removeLookupEmoticon()
            self.changeState('lookuplook')
            if (_nex.previousOrders.noClicked) {
                noClicked = true
                self.debug('popupFace no clicked')
            }
        })

        // After a specific amount of time, switch to "searching".
        window.setTimeout(function() {
            if (!noClicked) {
                self.changeState('lookupsearching')
                self._sendDeviceLookupFr(popup)
            }
        }, ARTIFICIAL_DELAY_LOOK)
    };

    // Send the DEVICELOOKUP message.
    self._sendDeviceLookupFr = function(popup) {
        var cmd = new _nex.commands.DeviceLookup(_nex.types.lookup.FACE) // 1 for face
        _nex.communication.send(cmd, function(result) {
            // Once we receive a response, add some extra delay so they still see it searching.
            window.setTimeout(function() {
                // Handle the response.
                self._handleDeviceLookupResponse(popup, result)
            }, ARTIFICIAL_DELAY_FR)
        }, 'DEVICELOOKUPRESPONSE')
    };

    // Handle the DEVICELOOKUP response.
    self._handleDeviceLookupResponse = function(popup, result) {
        if (result && (result.success.toLowerCase() === 'true')) {
            self.debug('success')
            self.debug(result)

            // instead of hiding the popup... now we have to show a <div class="lookupsearching" then <div id="lookupicon"
            var lookup = new LookupData(_nex.types.lookup.FACE, result.lookupvalue, result.LOOKUPVALUES)
            _nex.orderManager.currentOrder.lookupData = lookup
            if (!self.postOrdering) {
                window.setTimeout(function() {
                    // _nex.assets.popupManager.hidePopup(popup, function () {
                    self.requestPreviousOrders(lookup, self.callbackFound, self.callbackNotFound)
                        //});
                }, ARTIFICIAL_DELAY_LOOKUP)

            } else {
                self.changeState('lookuppostordering')
                window.setTimeout(function() {
                    _nex.assets.popupManager.hidePopup(popup, function() {
                        self._rememberOrder(lookup)
                    })
                }, ARTIFICIAL_DELAY_LOOKUP)
            }
        } else {
            self.changeState('lookupnopicture')
            window.setTimeout(function() {
                _nex.assets.popupManager.hideAllPopups()
            }, ARTIFICIAL_DELAY_NOT_FOUND)

        }
    }

    self.callbackFound = function() {
        self.changeState('lookupfound')

        // switch to grid on the video feed
        if (_nex.assets.theme.frenabled) {
            var cmdGrid = new _nex.commands.VideoFeedDots(0)
            _nex.communication.send(cmdGrid)
        }

        window.setTimeout(function() {
            _nex.assets.popupManager.hideAllPopups()
            self.removeLookupEmoticon()

            // switch to dots on the video feed
            if (_nex.assets.theme.frenabled) {
                var cmdDots = new _nex.commands.VideoFeedDots(1)
                _nex.communication.send(cmdDots)
            }
        }, ARTIFICIAL_DELAY_FOUND)
    };

    self.callbackNotFound = function() {
        self.changeState('lookupnotfound')
        window.setTimeout(function() {
            _nex.assets.popupManager.hideAllPopups()
            self.removeLookupEmoticon()
                //self.changeState("lookuplook");
        }, ARTIFICIAL_DELAY_NOT_FOUND)
    };

    // Helper to actually request the previous orders.
    self.requestPreviousOrders = function(lookup) {
        _nex.previousOrders.fetchOrders(lookup, self.callbackFound, self.callbackNotFound)
    };

    // Helper to remember an order for next time.
    self._rememberOrder = function(lookup) {
        var req = new _nex.commands.SavePreviousOrder(_nex.orderManager.currentOrder.orderid, _nex.orderManager.currentOrder.smsNumber, lookup)
        _nex.communication.send(req) // SavePreviousOrder does not have a response...
        self.gotoComplete()
    };

    // Jump straight to the complete phase.
    self.gotoComplete = function() {
        _nex.postOrdering.gotoNextPhase(false)
    };

    // For loyalty, employee, generic tenders.
    self.popupOther = function(buttonType) {
        self.debug('Showing popupOther')
            // Listen for card swipe or device
        var stopListeningOnCallback = true
        _nex.utility.deviceListener = new DeviceListener('ALL', _nex.previousOrders._cardEventListener, stopListeningOnCallback)
        _nex.utility.deviceListener.start()

        _nex.previousOrders.yesClicked = false
        _nex.previousOrders.noClicked = false
        var popup = $.extend(true, {}, _nex.assets.popupManager.lookupPopup)
        popup.message = _nex.assets.theme.getTextAttribute('REPEATORDERS', 'lookupmessage', 'Repeat order')
        popup.buttons[0].clickEvent = '_nex.previousOrders.noClicked = true;';

        _nex.assets.popupManager.showPopup(popup, function() {
            self.removeLookupEmoticon()
            if (_nex.previousOrders.yesClicked) {
                // Track the user clicked yes.
                self.debug('popupOther yes clicked')

            } else if (_nex.previousOrders.noClicked) {
                // Track the user chose no.
                self.debug('popupOther no clicked')
            }
        })
    };

    // For credit card swipes.
    self.popupCredit = function() {
        self.debug('popupCredit')
            // Listen for card swipe or device
        var stopListeningOnCallback = true
        _nex.previousOrders.callbackFound = self.callbackFound
        _nex.previousOrders.callbackNotFound = self.callbackNotFound
        _nex.utility.deviceListener = new DeviceListener('CARD', _nex.previousOrders._cardEventListener, stopListeningOnCallback)
        _nex.utility.deviceListener.start()

        _nex.previousOrders.yesClicked = false
        _nex.previousOrders.noClicked = false
        var popup = $.extend(true, {}, _nex.assets.popupManager.lookupPopup)
        popup.message = _nex.assets.theme.getTextAttribute('REPEATORDERS', 'lookupcreditmessage', 'Please swipe your card')
        popup.buttons[0].clickEvent = '_nex.previousOrders.noClicked = true;';

        _nex.assets.popupManager.showPopup(popup, function() {
            self.removeLookupEmoticon()
            if (_nex.previousOrders.yesClicked) {
                // Track the user clicked yes.
                self.debug('popupCredit yes clicked')

            } else if (_nex.previousOrders.noClicked) {
                // Track the user chose no.
                self.debug('popupCredit no clicked')
            }
        })
    };

    // Popup for a phone.
    self.popupPhone = function() {
        // Get the popup object.
        var popupString = 'phonepadPopup';
        var popup = $.extend(true, {}, _nex.assets.popupManager[popupString])

        // For some reason, setting the message wipes out the rest of the page.
        if (!self.postOrdering) {
            popup.message = _nex.assets.theme.getTextAttribute('PREVIOUSORDERS', 'instructions2', 'Phone Number')
        } else {
            // _savePrevOrder.LabelText = (_completeText.@savepreviousorder.toString().length > 0) ? _completeText.@savepreviousorder : "Remember~This Order";
            popup.message = _nex.assets.theme.getTextAttribute('COMPLETEORDER', 'savepreviousorder', 'Remember this order?')
        }
        // Bind methods to call when they hit the buttons.
        popup.buttons[0].clickEvent = '_nex.previousOrders.cancelFetchOrders();';
        popup.buttons[0].text = _nex.assets.theme.getTextAttribute('PREVIOUSORDERS', 'popupclear', 'CANCEL')

        // Show the popup.
        _nex.assets.popupManager.showPopup(popup)

        self.removeLookupEmoticon()
        $('#popup-phonepad #keyboardContainer').show()

        // When they hit the final digit of their phone number, continue on.
        var lastDigitCallback = function() {
            self.changeState('lookupsearching', 'phone')
            $("div.modal[aria-hidden='false'] #keyboardContainer").hide()
            console.debug('Post ordering is ', self.postOrdering)
            var lookup = new LookupData(_nex.types.lookup.PHONE, _nex.keyboard.phonepad.data)
            _nex.orderManager.currentOrder.smsNumber = lookup.lookupValue
            if (!self.postOrdering) {
                window.setTimeout(function() {
                    self.requestPreviousOrders(lookup)
                }, ARTIFICIAL_DELAY_LOOK)

            } else {
                self.changeState('lookuppostordering')
                window.setTimeout(function() {
                    _nex.assets.popupManager.hidePopup(popup, function() {
                        self._rememberOrder(lookup)
                    })
                }, ARTIFICIAL_DELAY_LOOKUP)

            }
            // });
        }
        _nex.keyboard.phonepad.bindKeys(lastDigitCallback)
    };

    self.show = function(buttonType) // (popupCompleteListener = null, autoClose = false, x = -1000, y = -1000)
        {
            self.debug('Showing popup for button type ' + buttonType)
            if (buttonType === 'face') {
                self.popupFace()
            } else if (buttonType === 'credit') {
                self.popupCredit()
            } else if (buttonType === 'phone') {
                self.popupPhone()
            } else {
                self.popupOther(buttonType)
            }
        }

    self.updateUI = function(buttonType) {
        self.debug('updateUI')
        self._noButton.visible = true
        self._yesButton.visible = false

        var type = buttonType.toLowerCase()
        switch (type) {
            case 'face':
                self._lookupType = self.LOOKUPTYPE_FACE
                break;
            case 'credit':
                self._lookupType = self.LOOKUPTYPE_CREDIT
                break;
            case 'loyalty':
                self._lookupType = self.LOOKUPTYPE_LOYALTY
                break;
            case 'loyalty2':
                self._lookupType = self.LOOKUPTYPE_LOYALTY2
                break;
            case 'generic1':
                self._lookupType = self.LOOKUPTYPE_GENERIC1
                break;
            case 'generic2':
                self._lookupType = self.LOOKUPTYPE_GENERIC2
                break;
            case 'generic3':
                self._lookupType = self.LOOKUPTYPE_GENERIC3
                break;
            case 'generic4':
                self._lookupType = self.LOOKUPTYPE_GENERIC4
                break;
            case 'generic5':
                self._lookupType = self.LOOKUPTYPE_GENERIC5
                break;
            case 'generic6':
                self._lookupType = self.LOOKUPTYPE_GENERIC6
                break;
            case 'generic7':
                self._lookupType = self.LOOKUPTYPE_GENERIC7
                break;
            case 'generic8':
                self._lookupType = self.LOOKUPTYPE_GENERIC8
                break;
            case 'generic9':
                self._lookupType = self.LOOKUPTYPE_GENERIC9
                break;
            case 'generic10':
                self._lookupType = self.LOOKUPTYPE_GENERIC10
                break;
            default:
                break
        }
    }

    self.getDefaultText = function(failureText) {
        var type = self._currentButtonXml.type.toString()
        switch (type.toLowerCase()) {
            case 'face':
                if (failureText) {
                    return 'Unable to take your picture';
                } else {
                    return 'Taking your picture now';
                }
                break
            case 'credit':
                return 'Swipe your card';
            case 'loyalty':
            case 'loyalty2':
                return 'Scan your card';
            case 'generic1':
            case 'generic2':
            case 'generic3':
            case 'generic4':
            case 'generic5':
            case 'generic6':
            case 'generic7':
            case 'generic8':
            case 'generic9':
            case 'generic10':
                return 'Scan your badge';
            default:
                return type
        }
    }

    // Change the state of the lookup popup for the user to see the stages of facial recognition.
    self.changeState = function(state, lookupType) {
        var text = self.getText(state, lookupType)
        self.changePopupText(text)
        self.changePopupIcon('lookupicon', state)
        self.changeFrImage(state)
    };

    // Helper to get the popup text.
    self.getText = function(state, lookupType, postOrdering) {
        var text = '';
        switch (state) {
            case 'lookuplook':
                if (lookupType === 'phone') {
                    text = _nex.assets.theme.getTextAttribute('REPEATORDERS', state, 'Looking up your previous orders')
                } else {
                    text = _nex.assets.theme.getTextAttribute('REPEATORDERS', state, 'Please look at the camera')
                }

                break
            case 'lookupsearching':
                if (self.postOrdering) {
                    text = _nex.assets.theme.getTextAttribute('REPEATORDERS', state, 'Saving your order...')
                } else {
                    text = _nex.assets.theme.getTextAttribute('REPEATORDERS', state, 'Searching for your orders...')
                }
                break
            case 'lookupfound':
                text = _nex.assets.theme.getTextAttribute('REPEATORDERS', state, 'We found you! Loading your previous orders...')
                break;
            case 'lookupnotfound':
                text = _nex.assets.theme.getTextAttribute('REPEATORDERS', state, "We didn't find any previous orders.")
                break;
            case 'lookuppostordering':
                text = _nex.assets.theme.getTextAttribute('REPEATORDERS', state, 'Saved your order!') // TODO: Change this text.
                break;
            case 'lookupnopicture':
                text = _nex.assets.theme.getTextAttribute('REPEATORDERS', state, 'Unable to take your picture!')
                break;
            default:
                text = _nex.assets.theme.getTextAttribute('REPEATORDERS', 'lookupfacemessage', 'Repeat order by face recognition')
        }
        return text
    };

    // Helper to change just the text.
    self.changePopupText = function(newText) {
        var $messageText = $("div[aria-hidden='false'] #messageText") // change the visible popup
        $messageText.text(newText)
    };

    // Helper to change just the emoji style icon that is showed to the user.
    self.changePopupIcon = function(id, cssClass) {
        $('.lookupicon').remove()
        $("div.modal[aria-hidden='false'] .modal-content").prepend('<div id="lookupicon" class="animated ' + cssClass + ' lookupicon"></div>')
        if (cssClass === 'lookupfound' || cssClass === 'lookupnotfound') {
            $('#lookupicon').addClass('pulse')
        }
    }

    self.removeLookupEmoticon = function() {
        $('.lookupicon').remove()
    };

    // Helper to change the image that shows the user.
    self.changeFrImage = function(state) {
        $('#popup-lookupvideo img#cameraFrame').attr('data-state', state)
    };
}
// Represents a single repeat order button.
function RepeatOrderButton(buttonId, buttonSettings, callback) {
    var self = this

    // Private properties.
    if (!buttonId) {
        throw 'RepeatOrderButton: Missing required argument buttonId';
    }
    if (!buttonSettings) {
        throw 'RepeatOrderButton: Missing required argument buttonSettings';
    }
    if (!callback) {
        throw 'RepeatOrderButton: Missing required argument callback';
    }
    self._buttonId = buttonId
    self._buttonSettings = buttonSettings // the XML converted to JSON (has type, and whether it is enabled)
    self._callback = callback

    // Return back the button id.
    self.getButtonId = function() {
        return self._buttonId
    };

    // Get the settings for the button.
    self.getButtonSettings = function() {
        return self._buttonSettings
    };

    // Get the callback function for the button.
    self.getCallback = function() {
        self._callback(self.getButtonSettings().type)
    };

    // Put an image on the button.
    self.setButtonImage = function(imagePath) {
        $('#' + self._buttonId).css('background-image', 'url(' + imagePath + ')')
    };

    // Show the button using jQuery show.
    self.show = function() {
        $('#' + self._buttonId).show()
    };

    // Hide the button using jQuery hide.
    self.hide = function() {
        $('#' + self._buttonId).hide()
    };

    // Return the correct button text for the button.
    self.getButtonText = function(isPostOrdering) {
        // Taken from the Flash.
        var buttonType = self._buttonSettings.type.toString()
        var buttontextattribute = self._buttonSettings.buttontextattribute
        var defaultText = '';
        switch (buttonType.toLowerCase()) {
            case 'phone':
                defaultText = 'Phone Number';
                break
            case 'cancel':
                if (isPostOrdering) {
                    defaultText = 'Go To Full Menu...';
                } else {
                    defaultText = 'Complete order';
                }

                break
            case 'face':
                defaultText = 'Facial Recognition';
                break
            case 'credit':
                defaultText = 'Credit Card';
                break
            case 'loyalty':
                defaultText = 'Gift Card';
                break
            case 'loyalty2':
                defaultText = 'Rewards Card';
                break
            case 'generic1':
            case 'generic2':
            case 'generic3':
            case 'generic4':
            case 'generic5':
            case 'generic6':
            case 'generic7':
            case 'generic8':
            case 'generic9':
            case 'generic10':
                defaultText = 'Badge';
                break
        }
        return _nex.assets.theme.getTextAttribute('REPEATORDERS', buttontextattribute, defaultText)
    };
}

// Logic for the report order options screen.
function RepeatOrderOptions(postOrdering) {
    var self = this
    self._postOrdering = postOrdering || false
        // This was copied from the Flash.

    // constants
    self.OPTION_SELECTED = 'OPTION_SELECTED';
    self.BUTTON_PRESSED = 'BUTTON_PRESSED';
    self.LOOKUP_MESSAGE_ID = 'lookupmessage';
    self.REMEMBER_MESSAGE_ID = 'remembermessage';

    // private properties
    self._lookupButtonContainer = null //:MovieClip;
    self._lookupButtons = [] //:Array;
    self._lookupHeader = {} //:TextField;
    self._lookupType = ''; // :String;
    self._lookupValue = ''; // :String;
    self._lookupValuesXml = {} //:XML;

    self.debugEnabled = true
    self.debug = function() {
        if (self.debugEnabled) {
            console.debug(arguments)
        }
    }

    // public properties
    self.getSelectedValue = function() {
        return self._lookupValue
    };
    self.getSelectedType = function() {
        return self._lookupType
    };
    self.getSelectedValuesXml = function() {
        return self._lookupValuesXml
    };
    self.getText = function(attribute, defaultText) {
        return _nex.assets.theme.getTextAttribute('REPEATORDERS', attribute, defaultText)
    };

    // Returns true if the customer has repeat orders turned on.
    self.isRepeatOrderEnabled = function() {
        var prevOrders = _nex.assets.theme.system.PREVIOUSORDERS
        if (prevOrders.length > 0) {
            prevOrders = _nex.assets.theme.system.PREVIOUSORDERS[0]
        }
        if (prevOrders && prevOrders.userepeatorders && (prevOrders.userepeatorders.toLowerCase() == 'true')) {
            return true
        } else {
            return false
        }
    }

    // Returns true if at least one of the repeat order option buttons is available and if repeat ordering is enabled in system.xml.
    self.containsAtLeastOneButton = function() {
        return self.isRepeatOrderEnabled() && (self._lookupButtons.length > 0)
    };

    // initialization
    self.init = function(lookupButtonContainer, cancelText, optionMessage, buttonXmlList) {
        if (!self.containsAtLeastOneButton) {
            console.log('No buttons for repeat orders!')
            return;
        }

        self._lookupButtonContainer = lookupButtonContainer

        // Find the lookup header. In post ordering, we use a different message.
        if (self._lookupHeader !== null) {
            if (!self.postOrdering) {
                self._lookupHeader.text = self.getText(self.LOOKUP_MESSAGE_ID, optionMessage)
            } else {
                self._lookupHeader.text = self.getText(self.REMEMBER_MESSAGE_ID, optionMessage)
            }
        }

        var buttonUI

        self._lookupButtons = []

        // create a list of enabled buttons
        var buttonUIIndex = 0
        for (var i = 0; i < buttonXmlList.length; i++) {
            var buttonXml = buttonXmlList[i]
            if (self.isTypeEnabled(buttonXml)) {
                // get button UI element
                var buttonId = 'button' + buttonUIIndex
                buttonUIElement = $('#repeatOrderOptions #' + buttonId)

                // If there is a button on the UI
                if (buttonUIElement.length > 0) {
                    // create the button
                    var button = new RepeatOrderButton(buttonId, buttonXml, self.onButtonClick)
                    self._lookupButtons.push(button)

                    buttonUIIndex++
                } else {
                    console.log('RepeatOrderOptions: Ran out of button elements in the HTML file!')
                    break;
                }
            }
        }
    }

    // Bind all the buttons to their HTML counter parts.
    self.bindButtons = function() {
        for (var index = 0; index < self._lookupButtons.length; index++) {
            var button = self._lookupButtons[index]
            var buttonId = button.getButtonId()
            var settings = button.getButtonSettings()
            var type = settings.type
            _nex.utility.buttonBinder.bind(buttonId, button.getButtonText(self._postOrdering), button.getCallback, false, type)
        }
    }


    // Show the buttons and the header.
    self.show = function() {
        for (var i = 0; i < self._lookupButtons.length; i++) {
            var button = self._lookupButtons[i]
            if (button) {
                button.show()
            }
        }
        var header = $('#repeatOrderPromptHeader')
        if (header.length > 0) {
            $('#repeatOrderPromptHeader').html(_nex.assets.theme.getTextAttribute('REPEATORDERS', 'lookupmessage', ''))
            header.show()
        }
    }

    self._isEnabled = function(repeatOrderElement, attribute) {
        self.debug(repeatOrderElement)
        self.debug('Checking if attribute ' + attribute + ' is set to true')
        var result = false
        if (repeatOrderElement.hasOwnProperty(attribute)) {
            if (repeatOrderElement[attribute] === 'true') {
                result = true
            }
        }
        self.debug(result)
        return result
    };

    // Returns true if enabled.
    self.isTypeEnabled = function(buttonXml) { // (buttonXml:XML) : Boolean
        // based on the button determine if the lookup option is enabled...
        var enabled = false
        var type = buttonXml.type.toString()
        var typeLower = type.toLowerCase()

        var repeatOrderElement = _nex.repeatOrderPhase.getRepeatOrderElement()

        switch (typeLower) {
            case 'cancel':
                enabled = true
                break;
            case 'phone':
            case 'face':
            case 'credit':
            case 'loyalty':
            case 'loyalty2':
            case 'generic1':
            case 'generic2':
            case 'generic3':
            case 'generic4':
            case 'generic5':
            case 'generic6':
            case 'generic7':
            case 'generic8':
            case 'generic9':
            case 'generic10':
                enabled = self._isEnabled(repeatOrderElement, typeLower)
                break;
            default:
                enabled = self._isEnabled(repeatOrderElement, typeLower)
                break;
        }

        return enabled
    };

    self.onButtonClick = function(buttonType) { // (evt:MouseEvent)
        self.debug('clicked ' + buttonType)
        switch (buttonType.toLowerCase()) {
            // show the prompt for the phone number
            // _nex.previousOrders._popupPhone();
            // break;

            case 'cancel':
                // just move along
                if (!self._postOrdering) {
                    _nex.previousOrders.gotoOrdering()
                } else {
                    _nex.postOrdering.gotoNextPhase()
                }

                break
            case 'phone':
            case 'face':
            case 'credit':
            case 'loyalty':
            case 'loyalty2':
            case 'generic1':
            case 'generic2':
            case 'generic3':
            case 'generic4':
            case 'generic5':
            case 'generic6':
            case 'generic7':
            case 'generic8':
            case 'generic9':
            case 'generic10':
                // listen for a swipe/scan or face. show the generic lookup popup with the proper image loaded
                var lookupPopup = new LookupPopup(self._postOrdering)
                    //lookupPopup.setButtonXml(button.buttonXml);

                lookupPopup.updateUI(buttonType)
                lookupPopup.show(buttonType)
                break;
            default:
                console.error('Could not find popup for ' + buttonType)

        }
    }

    //self.lookupPopupClosed = function (okClicked, itemChosen) { //(evt:PopupEvent) : void 
    //    if (okClicked) {
    //        alert(itemChosen);
    //    }
    //};
}

// The first thing the repeat order phase does is show the repeat order prompt.
function RepeatOrderPrompt(repeatOrderPhase) {
    var self = this

    // Constants.
    self.ACTION_NEWORDER = 0
    self.ACTION_REPEAT = 1
    self.ACTION_ORDERPIN = 2
    self.ACTION_CANCEL = 3

    // Private properties. Some of these are dependencies being injected.
    self._theme = _nex.assets.theme
    self._soundManager = _nex.assets.soundManager
    self._popupManager = _nex.assets.popupManager
    self._phase = repeatOrderPhase
    self._action = 0

    // Debugging.
    self._debugEnabled = true
    self._debug = function() {
        if (self._debugEnabled) {
            console.debug(arguments)
        }
    }

    // Update the user interface to show all the choices.
    self.updateUI = function() {
        // Default to new order action.
        self._action = self.ACTION_NEWORDER

        // If we are already initialized, simply return.
        if (self._newOrderButton) {
            return
        }

        // Update the text of the heading.
        $('#repeatOrderPromptText').html(self._theme.getTextAttribute('REPEATORDERS', 'prompttitle', ''))

        // Bind the buttons.
        self.bindOptions()

        // Show the buttons.
        self.showOptions()
    };

    // Show the options.
    self.showOptions = function() {
        $('#repeatOrderPrompt').show()
    };

    // Hide the options.
    self.hideOptions = function() {
        $('#repeatOrderPrompt').hide()
    };

    self.isPinOrderLookup = function() {
        // Default the result to false.
        var result = false

        // Use theme as a shorthand for self._theme.
        var theme = self._theme

        // Check the theme object if 'previous orders' is enabled.
        if (theme.system && theme.system.PREVIOUSORDERS && theme.system.PREVIOUSORDERS.hasOwnProperty('orderlookup')) {
            if (theme.system.PREVIOUSORDERS.orderlookup.toLowerCase() === 'true') {
                result = true
            }
        }

        // Return the result.
        return result
    };

    // Bind the options you can pick from (e.g. new order or repeat order).
    self.bindOptions = function() {
        // All buttons are optional... 
        // The names are prefixed to help make them unique for creative to bind to easily.
        var PROMPT_BUTTON_NEW = 'repeatorderprompt-newOrderButton';
        var PROMPT_BUTTON_REPEAT = 'repeatorderprompt-repeatButton';
        var PROMPT_BUTTON_PIN = 'repeatorderprompt-orderPinButton';
        var PROMPT_BUTTON_CANCEL = 'repeatorderprompt-cancelButton';

        // The Flash code is commented out and placed here for reference.
        // self._newOrderButton = new StandardButton(self._uiClip, "newOrderButton", self.getText("neworderbutton", "Start a New Order"));
        // self._repeatButton = new StandardButton(self._uiClip, "repeatButton", self.getText("repeatorderbutton", "Repeat a Previous Order"));
        // self._orderPinButton = new StandardButton(self._uiClip, "orderPinButton", self.getText("orderpinbutton", "I have an Order PIN"));
        // self._cancelButton = new StandardButton(self._uiClip, "cancelButton", self.getText("cancelbutton", "Cancel"));

        // Use a utility class to wire up the buttons.
        var buttonBinder = _nex.utility.buttonBinder
        var text = '';

        text = self._theme.getTextAttribute('REPEATORDERS', 'neworderbutton', 'Start a New Order')
        buttonBinder.bind(PROMPT_BUTTON_NEW, text, self.onNewOrder)

        text = self._theme.getTextAttribute('REPEATORDERS', 'repeatorderbutton', 'Repeat a Previous Order')
        buttonBinder.bind(PROMPT_BUTTON_REPEAT, text, self.onRepeat)

        if (self.isPinOrderLookup()) {
            text = self._theme.getTextAttribute('REPEATORDERS', 'orderpinbutton', 'I have an Order PIN')
            buttonBinder.bind(PROMPT_BUTTON_PIN, text, self.onOrderPin)
        } else {
            var pinButton = $('#' + PROMPT_BUTTON_PIN)
            pinButton.hide()
        }

        text = self._theme.getTextAttribute('REPEATORDERS', 'cancelbutton', 'Cancel')
        buttonBinder.bind(PROMPT_BUTTON_CANCEL, text, self.onCancel)
    };

    // User clicked the new order button.
    self.onNewOrder = function() {
        self._action = self.ACTION_NEWORDER
        self.continue()
    };

    // User clicked the repeat order button.
    self.onRepeat = function() {
        self._action = self.ACTION_REPEAT
        self.continue()
    };

    // User clicked the order pin button.
    self.onOrderPin = function() {
        self._action = self.ACTION_ORDERPIN
        self.continue()
    };

    // User clicked the cancel button.
    self.onCancel = function() {
        self._action = self.ACTION_CANCEL
        self.continue()
    };

    // Continue after the user picks an action.
    self.continue = function() {
        self._debug('Continue with action: ' + self._action)
        switch (self._action) {
            case self.ACTION_NEWORDER:
                // Just move along to ordering.
                self._phase.gotoOrdering()
                break;
            case self.ACTION_REPEAT:
                // Move to the repeat selection UI.
                self.hideOptions()
                self._phase.showLookupOptions()
                break;
            case self.ACTION_ORDERPIN:
                // Prompt for an order PIN.
                _nex.previousOrders.onlineOrder = new OnlineOrder(self._theme)
                _nex.previousOrders.onlineOrder.getPinFromNumPad()
                break;
            default:
                // Cancel out and go back to splash.
                _nex.manager.cancelCurrentPhase()
        }
    }

    //// Called from the popup after they enter a pin.
    //self.orderPinEntered = function (okClicked, pin) {
    //    // TODO: do something with the Order PIN!
    //    // Lookup the order by its pin... then go to ordering with that pin.
    //    self.gotoOrdering(null);
    //};

    // Helper method to get all the attributes right for button tracking.
    self._trackControlClick = function(button) {
        var buttonId = ''; // button id is used for menus 
        var buttonText = button.text() // the text on the button itself
        var menuId = ''; // menu id is not applicable in this phase.
        var BUTTON_TYPE = 'control'; // control will be translated to the right enum
        var context = ''; // leave context blank, usually used for menus
        _nex.utility.buttonTracking.track(buttonId, buttonText, menuId, context, BUTTON_TYPE)
    };
}

// Constructor. There is a BasePaymentClip and other Clip files in the Flash as well.
// We are using the naming convention of Clip, although these aren't technically movie clips,
// it keeps it consistent with the naming in different areas.
function BasePaymentClip(clip, paymentTarget, paymentText) { // clip:XML, paymentTarget:MovieClip, paymentText:XML
    var self = this
        //self._paymentClipXml = ""; //XML;
        //self._paymentMedia = ""; //MediaFile;
        //self._paymentTarget = ""; //MovieClip;
        //self._paymentText = ""; //XML;

    self._allowCardSwipes = false //Boolean = false;		
    self._waitingOnUpdate = false //Boolean = false; ??
    self._createdTender = false // Related to preauth and pay
    self._gratuityEnabled = false //Boolean = false;
    self._gratuityShown = false //Boolean = false;

    // This is from the Flash constructor.
    self._paymentClipXml = clip
    self._paymentTarget = paymentTarget
    self._paymentText = paymentText
    self._paymentMedia = null

    //var gratList = ThemeManager.CurrentTheme.SystemSettingsXml.GRATUITY;
    //if (gratList.length() > 0)
    //{
    //   _gratuityEnabled = (gratList[0].@enabled.toString().toLowerCase() == "true");
    //}

    // Default for whether or not the back control button is visible.
    self.backButtonVisible = function() {
        return true
    };

    // Default for whether or not the cancel button control is visible.
    self.cancelButtonVisible = function() {
        return true
    };

    // Continue navigation button.
    self.continueButtonVisible = function() // :Boolean
        {
            return false
        };

    // By default show the 'request server' button.
    self.requestServerButtonVisible = function() {
        return true
    };

    // Default for the load method.
    self.load = function() {

    }
}
// Constructor.
function CashPaymentClip(clip, paymentTarget, paymentText) {
    var self = this
    BasePaymentClip.call(self, clip, paymentTarget, paymentText)
    self.someNewProperty = 'test';
}
CashPaymentClip.prototype = Object.create(BasePaymentClip.prototype)
CashPaymentClip.prototype.constructor = BasePaymentClip
    // Constructor.
function CounterPaymentClip() { // clip:XML, paymentTarget:MovieClip, paymentText:XML) ) {
    //
    // Private properties
    //
    var self = this
    self._elementId = 'paymentclip-counter';

    //
    // Public methods
    //
    self.isAvailable = function() {
        return true
    };

    self.isTracked = function() {
        return false
    };

    self.backButtonVisible = function() {
        return false
    };

    self.cancelButtonVisible = function() {
        return false
    };

    self.continueButtonVisible = function() {
        return false
    };

    self.load = function() {

    }

    self.dispose = function() {

    }

    // Standard 'show' method.
    self.show = function() {
        // Instead of showing a clip, just setup counter as the final tender.
        var finalTenderCounter = new TenderCounter()

        // Process the order that way.
        _nex.payment.processOrder(finalTenderCounter)
    };

    self.hide = function() {

    }

}
CounterPaymentClip.prototype = Object.create(CounterPaymentClip.prototype)

/*
package NEXTEP.Phase.Payment.PaymentClip 
{
	import flash.display.MovieClip;
	import NEXTEP.Phase.Payment.PaymentManager;
	import NEXTEP.Shared.IDisposable;

public class CounterPaymentClip extends BasePaymentClip implements IDisposable
{
		
    public function CounterPaymentClip(clip:XML, paymentTarget:MovieClip, paymentText:XML) 
{
        super(clip, paymentTarget, paymentText);		
}
		
    override public function IsAvailable():Boolean 
{
        return true;
}
		
    override public function IsTracked():Boolean 
{
        return false;
}
		
    override public function get BackButtonVisible():Boolean 
{ 
        return false; 
}
		
    override public function get CancelButtonVisible():Boolean 
{
        return false;
}
		
    override public function get ContinueButtonVisible():Boolean 
{ 
        return false; 
}
		
    override public function Load():void 
{
        PaymentManager.ProcessOrder();
}
		
    override public function Dispose():void 
{
        super.Dispose();
}
}
    }
    */
// Constructor.
function CouponPaymentClip() {
    var self = this

    self._elementId = paymentConstants.COUPON_CLIP_ELEMENT_ID

    self._paymentDeviceFlow = null
    self.tender = null

    self.enableDebug = false
    self._debug = function(message) {
        if (self.enableDebug) {
            console.debug(message)
        }
    }

    // Show the clip.
    self.show = function() {
        // Transition out the coupon payment clip.
        $('#' + paymentConstants.SELECT_CLIP_ELEMENT_ID).hide()

        // Set the swipe message. The image will be set as the background on the element with id of "swipeTarget"
        self._showSwipeMessage()

        // Update the swipe image.
        var hardwareType = _nex.assets.theme.getHardwareType()
        self._updateSwipeImage(hardwareType)

        // Show the new clip.
        $('#' + self._elementId).show()

        // Start listening for card swipes, barcode scans, RFIDs, etc.
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
        }
        _nex.utility.deviceListener = new DeviceListener('BARCODE', self._lastKeyFound, true)
        _nex.utility.deviceListener.start()
    };

    self._showSwipeMessage = function() {
        var msg = $('#txtScanCoupon')
        if (msg.length > 0) {
            msg.empty()
                // The function will check the kiosktext.xml file for a scanCoupon attribute to get which text to show for this clip. 
                // If the attribute does not exist, the default text will be "Please Swipe your Coupon".
            msg.append(_nex.assets.theme.getTextAttribute('PAYMENT', 'scanCoupon', 'Please Scan Your Coupon'))
        }
    }

    self._updateSwipeImage = function(hardwareType) {
        if (hardwareType.length > 0) {
            var div = $('#swipeTarget')
            if (div.length > 0) {
                div.addClass(hardwareType)
            }
        }
    }

    // Called when the credit payment clip goes out of scope.
    self.hide = function() {
        $('#' + self._elementId).hide()
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
        }
    }

    // Called to reset.
    self.reset = function() {
        self.hide()
        self.show()
    };

    // Called when the end of the card data is detected.
    self._lastKeyFound = function(deviceData) {
        // Store this data in the payment phase for later.
        _nex.payment.deviceData = deviceData

        var tenderConfig = _nex.assets.theme.getTenderByType('coupon')
        if (tenderConfig) {
            if (_nex.assets.theme.isValidationRequired(tenderConfig)) {
                // prompt for pin (which will call processCoupon)
                self._debug('validation required; prompting for pin')
                self._promptForPin()
            } else {
                self._debug('validation not required')
                    // skip prompting for a pin; just process the coupon
                _nex.payment.couponInquiry('')
            }
        } else {
            // This looks like a configuration issue.
            console.log('Configuration Error: No tender for coupon found!')
            self._genericError(self.reset)
        }
    }

    // Prompt the user to enter their pin.
    self._promptForPin = function() {
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup)
        popup.buttons[0].clickEvent = '_nex.payment.couponInquiry(_nex.keyboard.numpad.data);';
        popup.message = _nex.assets.theme.getTextAttribute('ORDER', 'couponpin', 'Please enter your PIN') // TODO: Which attribute to check?
        _nex.assets.popupManager.showPopup(popup)
        _nex.keyboard.numpad.bindKeys()
    };
}
CouponPaymentClip.prototype = Object.create(BasePaymentClip.prototype)

// Constructor.
function CreditPaymentClip() {
    var self = this

    //
    // PRIVATE PROPERTIES
    // 
    self._elementId = paymentConstants.CREDIT_CLIP_ELEMENT_ID
    self._cardListener = null
    self._paymentDeviceFlow = null
    self.MAX_CARD_TYPE = 7

    self.defaultVoiceover = 'Swipe Card Now.mp3'; // the voiceover can be overridden in htmltheme.xml

    //
    // PUBLIC METHODS
    //

    // Show the clip.
    self.show = function() {
        $('#' + paymentConstants.SELECT_CLIP_ELEMENT_ID).hide()

        // At this point the clip should already be appended to the #targets tag...
        // We just need to change it from hidden to visible.
        $('#' + self._elementId).show()

        // Update the swipe image.
        var hardwareType = _nex.assets.theme.getHardwareType()
        self._updateSwipeImage(hardwareType)

        // If we are using a payment device, start the payment device flow as well.
        if (_nex.payment.usesPaymentDevice()) {
            self._paymentDeviceFlow = new PaymentDeviceFlow(_nex.payment.numAvailableTenders)
            self._paymentDeviceFlow.start()
        } else {
            // Otherwise, start listening for a MSR swipe.
            self._listenForSwipe()
            self._showSwipeMessage()
            self._showAcceptedCardTypes()
        }
    }

    // Called when the credit payment clip goes out of scope.
    self.hide = function() {
        var element = document.getElementById(self._elementId)
        if (element) {
            element.style.display = 'none'
        }

        // If we are using a payment device (not MSR device)....
        if (_nex.payment.usesPaymentDevice()) {
            // Cleanup any payment device related things.
            if (self._paymentDeviceFlow !== null) {
                self._paymentDeviceFlow.stop()
            }
        } else {
            // For regular (non-payment device) swipes.
            // Integrate not listening right into hiding the clip.
            // This way, if the clip is not showing, we should be not listening.
            self._stopListening()
        }
    }

    //
    // PRIVATE / HELPER METHODS
    //
    self._showSwipeMessage = function() {
        var msg = $('#swipeCard')
        if (msg.length > 0) {
            msg.empty()
            msg.append(_nex.assets.theme.getTextAttribute('PAYMENT', 'swipe', 'Please Swipe Your Credit Card'))
        }
    }

    self._updateSwipeImage = function(hardwareType) {
        if (hardwareType.length > 0) {
            var div = $('#swipeTarget')
            if (div.length > 0) {
                div.addClass(hardwareType)
            }
        }
    }

    self._showAcceptedCardTypes = function() {
        var acceptCardsMsg = $('#acceptedCards')
        if (acceptCardsMsg.length > 0) {
            acceptCardsMsg.empty()
            acceptCardsMsg.append(_nex.assets.theme.getTextAttribute('PAYMENT', 'accepted', 'Accepted Credit Cards'))
        }

        var cards = $('#cards')
        if (cards.length > 0) {
            // display card images
            var cardTypes = _nex.assets.theme.system.CREDITCARD
            var cardId = 0

            for (var i = 0; i < cardTypes.length; i++) {
                if ((cardTypes[i].accept.toString().toLowerCase() === 'true') &&
                    (cardTypes[i].code.toString().toLowerCase().indexOf('loyalty') === -1)) {
                    // create an html element to put in the 
                    var card = cards.find('#card' + cardId)
                    if (card.length > 0) {
                        card.addClass(cardTypes[i].code.toLowerCase())
                        cardId++
                    }
                }
            }

            for (var c = cardId; c < self.MAX_CARD_TYPE; c++) {
                var hideCard = cards.find('#card' + c)
                if (hideCard.length > 0) {
                    hideCard.css('display', 'none')
                }
            }
        }
    }

    // Start listening for a card swipe.
    self._listenForSwipe = function() {
        if (self._cardListener !== null) {
            self._cardListener.stopListening()
        }

        self._cardListener = new CardListener(self._lastKeyFound)
        self._cardListener.startListening()
    };

    // Called when the end of the card data is detected.
    self._lastKeyFound = function(cardData) {
        self._cardListener.stopListening()

        // Create a credit tender. 
        var tenderCredit = new TenderCredit()
        tenderCredit.update(cardData.track1, cardData.track2)
        if (tenderCredit.cardData) {
            // Pass the card data along.
            _nex.payment.processOrder(tenderCredit)
        } else {
            // Error case.
            _nex.payment.showErrorPopup(_nex.payment.textSwipeError(), _nex.payment.start())
        }
    }

    // Stop listening for a card swipe.
    self._stopListening = function() {
        self._cardListener.stopListening()
    };
}
CreditPaymentClip.prototype = Object.create(BasePaymentClip.prototype)
CreditPaymentClip.prototype.constructor = BasePaymentClip


// Helper for the payment device flow.
// This will only be used if the user picks credit, and it is setup so they use payment devices.
var PaymentDeviceFlow = function(numAvailableTenders, processingPopup) {
    // Make self synonymous with this.
    var self = this

    // Store the number of available tenders for later.
    self._numAvailableTenders = numAvailableTenders

    // Entry point to the payment device flow.
    self.start = function() {
        // console.clear();

        // Enable the payment device. Control has now been moved to the payment device.
        self._enablePaymentDevice()
    };

    // Leaving the payment device flow.
    self.stop = function() {

    }

    // Deep copy an object.
    var deepCopy = function(object) {
        // Uses jQuery to do a deep copy of an object, by using the $.extend method,
        // but passing the first object of empty.
        return $.extend(true, {}, object)
    };

    // Show the 'please swipe your card on the payment device' popup.
    // Shortly after this, control buttons will be blocked. Control is being
    // handed over to the device.
    self._showPaymentDevicePopup = function(messageText, callback) {
        // This is right along with the main Visio diagram for this project.
        var popup = deepCopy(_nex.assets.popupManager.processingPopup)
        popup.message = messageText
        _nex.assets.popupManager.showPopup(popup, function() {
            if (callback) {
                callback()
            }
        })

        return popup
    };

    // Hide the payment device popup.
    self._hidePaymentDevicePopup = function(popup, callback) {
        _nex.assets.popupManager.hidePopup(popup, function() {
            if (callback) {
                callback()
            }
        })
    };

    // Send the command to the TM to enable the payment device.
    self._enablePaymentDevice = function() {
        _nex.utility.orderTimer.stop(true) // need to wait for the payment device to return; lock the timer

        var popup = self._showPaymentDevicePopup(_nex.payment.textPaymentDeviceSwipe())

        var requestObject = new _nex.commands.WaitForPayment()

        // Loop a message during payment processing for KVI.
        if (_nex.kviReader) {
            _nex.kviReader.startPaymentProcessing()
        }

        _nex.communication.send(requestObject, function(msg) {
            try {
                console.log('creditpaymentclip.enablepaymentdevice - paymentresponse received')
                try {
                    if (_nex.kviReader) {
                        _nex.kviReader.stopPaymentProcessing()
                    }
                } catch (e) {
                    console.log('creditpaymentclip.enablepaymentdevice - error occured stopping kvi')
                }

                console.log('creditpaymentclip.enablepaymentdevice - hidding processing popup')
                self._hidePaymentDevicePopup(popup, function() {
                    console.log('creditpaymentclip.enablepaymentdevice - processing popup hidden')
                    _nex.payment.handlePaymentResponse(msg)
                })
            } catch (e) {
                console.log('creditpaymentclip.enablepaymentdevice - unexpeced error occurred')
            }

            console.log('creditpaymentclip.enablepaymentdevice - reset timer')
            _nex.utility.orderTimer.restart(true) // unlock the timer
        }, 'PAYMENTRESPONSE')

    };
    /// / Was the payment successful for the payment device.
    // self.isPaymentSuccessful = function (paymentResult) {
    //    if (paymentResult) {
    //        gotoProcess();
    //    } else {
    //        if (numAvailableTenders() > 1) {
    //            gotoSelectPayment();
    //        } else if (numAvailableTenders() === 1) {
    //            gotoOrderingPhasing();
    //        }
    //    }
    // };

    /// / Callback method after the card swipe.
    // self.usesPaymentDevice = function () {
    //    if (usesPaymentDevice(xmlAttribute)) {
    //        enablePaymentDevice();
    //        showPopup();
    //        pauseTimer();
    //        blockControlButtons();
    //    } else {
    //        // Enable card listener.

    //        // Valid swipe?
    //        if (!validSwipe) {
    //            displayErrorMessage();
    //            displayCreditHtml();
    //        } else {
    //            if (isCardTypeAccepted()) {
    //                gotoProcess();
    //            }
    //        }
    //    }
    // };
}




// Constructor.
function EmployeePaymentClip() {
    var self = this

    //
    // PRIVATE PROPERTIES
    // 
    self._elementId = paymentConstants.EMPLOYEE_CLIP_ELEMENT_ID
    self._paymentDeviceFlow = null

    //
    // PUBLIC METHODS
    //

    // Show the clip.
    self.show = function() {
        // Transition out the select payment clip.
        $('#' + paymentConstants.SELECT_CLIP_ELEMENT_ID).hide()

        // Update the message to be shown. The image will be set by creative as the background on the element with id of "swipeTarget"
        self._showSwipeMessage()

        // Update the swipe image.
        var hardwareType = _nex.assets.theme.getHardwareType()
        self._updateSwipeImage(hardwareType)

        // Show the loyalty payment HTML.
        $('#' + self._elementId).show()

        // Start listening for a card swipe.
        self._listenForSwipe()
    };

    self._showSwipeMessage = function() {
        // The swipe message is custom in the Flash.
        // For the UX Kiosk, we decided to have a default message at least.
        var msg = $('#txtSwipeCard')
        if (msg.length > 0) {
            msg.empty()
                // This uses a new attribute, employeeswipe.
            msg.append(_nex.assets.theme.getTextAttribute('PAYMENT', 'employeeswipe', 'Please Swipe Your Employee Card'))
        }
    }

    self._updateSwipeImage = function(hardwareType) {
        if (hardwareType.length > 0) {
            var div = $('#swipeTarget')
            if (div.length > 0) {
                div.addClass(hardwareType)
            }
        }
    }

    // Show the user a popup to enter their employee pin.
    self.showPinPrompt = function(track2) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup)
        popup.buttons[0].clickEvent = "_nex.payment.processEmployeeCard('" + htmlEscape(track2) + "');"
        popup.message = _nex.assets.theme.getTextAttribute('ORDER', 'employeepin', 'Please enter your PIN') // TODO: Find out which attribute to use here. employeeverify is temporary
        _nex.assets.popupManager.showPopup(popup)
        _nex.keyboard.numpad.bindKeys()
    };

    // Hide the clip.
    self.hide = function() {
        $('#' + self._elementId).hide()

        // Stop listening for a MSR swipe.
        self._stopListening()
    };

    // Start listening for a card swipe.
    self._listenForSwipe = function() {
        _nex.utility.deviceListener = new DeviceListener('ALL', self._lastKeyFound)
        _nex.utility.deviceListener.start()
    };

    // Called when the end of the card data is detected.
    self._lastKeyFound = function(cardData) {
        _nex.utility.deviceListener.stop()

        // If it is configured to prompt for a pin, prompt for a pin.
        var employeeTenderConfig = _nex.assets.theme.getTenderByType('employee')
        var promptForPin = employeeTenderConfig.validate === "true";
        var empData = (cardData.track2) ? cardData.track2 : cardData
        if (promptForPin) {
            self.showPinPrompt(empData)
        } else {
            // Process the employee card data.
            _nex.payment.processEmployeeCard(empData)
        }
    }

    // Stop listening for a card swipe.
    self._stopListening = function() {
        if (_nex.utility.deviceListener !== null) {
            _nex.utility.deviceListener.stop()
        }
    }

}
EmployeePaymentClip.prototype = Object.create(BasePaymentClip.prototype)
    //Represents a payment clip for a Guest Account Inclining Balance Generic Tender Account
function GAIncliningBalancePaymentClip(gaIncliningBalanceTenderId) {
    var self = this

    self._gaIncliningBalanceId = gaIncliningBalanceTenderId
    self._elementId = paymentConstants.GAINCLININGBALANCE_CLIP_ELEMENT_ID
    self._tenderType = 'gaincliningbalancetender' + gaIncliningBalanceTenderId.toString()

    self._guestAccountLocal = _nex.guestAccount.getGuestAccountLocalByPaymentClipTenderType(self._tenderType)
    self._guestAccountLocalTypeId = self._guestAccountLocal.guestAccountLocalTypeId
    self._genericTenderId = self._guestAccountLocal.genericTenderId
    self._paymentTypeId = Number(self._guestAccountLocal.genericTenderIndex) + 50

    self._enableDebugging = true

    //write debugging information to the console
    self._debug = function(message) {
        if (self._enableDebugging) {
            console.debug(message)
        }
    }

    //show the clip
    self.show = function() {
        // transition out the select payment clip.
        $('#' + paymentConstants.SELECT_CLIP_ELEMENT_ID).hide()

        //show the new clip.
        $('#paymentclip-' + self._tenderType).show()
        $('#' + self._elementId).show()

        //determine next step -- prompt for pin or generic inquiry...
        var tenderConfig = _nex.assets.theme.getGenericTenderByType(self._genericTenderId)
        if (_nex.assets.theme.isKioskValidationRequired(tenderConfig)) {
            // prompt for pin
            self._debug('generic tender validation required; prompting for pin')
            self.promptForPin()
        } else {
            _nex.payment.genericInquiry(self._guestAccountLocal.pin, self._guestAccountLocalTypeId, self._paymentTypeId, self._guestAccountLocal.accountNumber)
        }
    }

    //hide the clip
    self.hide = function() {
        $('#' + self._elementId).hide()
        $('#paymentclip-' + self._tenderType).hide()
    };

    // reset the clip
    self.reset = function() {
        self.hide()
        self.show()
    };

    // prompt the user to enter their pin.
    self.promptForPin = function() {
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup)
        popup.buttons[0].clickEvent = '_nex.payment.genericInquiry(_nex.keyboard.numpad.data, "' + self._guestAccountLocalTypeId.toString() + '",' + self._paymentTypeId.toString() + ', "' + self._guestAccountLocal.accountNumber + '");';
        popup.buttons[1].clickEvent = '_nex.payment._paymentManager._currentClip.show();';

        popup.message = _nex.assets.theme.getTextAttribute('ORDER', 'genericpin', 'Please enter your PIN')
        _nex.assets.popupManager.showPopup(popup)
        _nex.keyboard.numpad.bindKeys()
    };
}

GAIncliningBalancePaymentClip.prototype = Object.create(BasePaymentClip.prototype)
    // Constructor.
function GenericPaymentClip(genericTenderId) {
    var self = this

    //generic tenders are enumerated 1-10. they related to paymenttypeids 51-60
    self._genericTenderId = genericTenderId
    self._elementId = paymentConstants.GENERIC_CLIP_ELEMENT_ID

    self._guestAccountLocalTypeId = '';
    self._tenderType = 'generictender' + genericTenderId.toString()
    self._paymentTypeId = Number(genericTenderId) + 50

    var tenderData = _nex.assets.theme.getGenericTenderByType(self._tenderType)
    if (tenderData.guestaccountlocaltypeid) {
        self._guestAccountLocalTypeId = tenderData.guestaccountlocaltypeid
    }

    self.tender = null

    self.enableDebug = true
    self._debug = function(message) {
        if (self.enableDebug) {
            console.debug(message)
        }
    }


    // Show the clip.
    self.show = function() {
        // Transition out the select payment clip.
        $('#' + paymentConstants.SELECT_CLIP_ELEMENT_ID).hide()

        // Set the swipe message. The image will be set as the background on the element with id of "swipeTarget"
        self._showSwipeMessage()

        // Update the swipe image.
        var hardwareType = _nex.assets.theme.getHardwareType()
        self._updateSwipeImage(hardwareType)

        // Show the new clip.
        $('#paymentclip-' + self._tenderType).show()
        $('#' + self._elementId).show()

        // Start listening for card swipes, barcode scans, RFIDs, etc.
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
        }
        _nex.utility.deviceListener = new DeviceListener('ALL', self._lastKeyFound, true)
        _nex.utility.deviceListener.start()

    };

    self._showSwipeMessage = function() {
        var msg = $('#txtSwipeCard')
        if (msg.length > 0) {
            msg.empty()
                // Following along with the Flash, the UpdateClip method in LoyaltyPaymentClip uses the 'scan' attribute
                // to get which text to show for this clip. It also uses the default text of "Please Swipe your Loyalty Card".
            msg.append(_nex.assets.theme.getTextAttribute('PAYMENT', 'scan' + self._genericTenderId, 'Please Scan Your Badge'))
        }
    }

    self._updateSwipeImage = function(hardwareType) {
        if (hardwareType.length > 0) {
            var div = $('#swipeTarget')
            if (div.length > 0) {
                div.addClass(hardwareType)
            }
        }
    }


    // Called when the clip goes out of scope.
    self.hide = function() {
        $('#' + self._elementId).hide()
        $('#paymentclip-' + self._tenderType).hide()

        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
        }
    }

    // Called to reset.
    self.reset = function() {
        self.hide()
        self.show()
    };

    // Called when the end of the card data is detected.
    self._lastKeyFound = function(deviceData) {
        // Store this data in the payment phase for later.
        _nex.payment.deviceData = deviceData

        var tenderConfig = _nex.assets.theme.getGenericTenderByType(self._tenderType)
        if (tenderConfig) {
            if (_nex.assets.theme.isKioskValidationRequired(tenderConfig)) {
                // prompt for pin (which will call processLoyalty)
                self._debug('generic tender validation required; prompting for pin')
                self._promptForPin()
            } else {
                self._debug('generic tender validation not required')
                    // skip prompting for a pin; just process the loyalty
                _nex.payment.genericInquiry('', self._guestAccountLocalTypeId, self._paymentTypeId)
            }
        } else {
            // This looks like a configuration issue.
            console.log('Configuration Error: No tender for generic found!')
            self._genericError(self.reset)
        }
    }

    // Prompt the user to enter their pin.
    self._promptForPin = function() {
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup)
        popup.buttons[0].clickEvent = "_nex.payment.genericInquiry(_nex.keyboard.numpad.data, '" + self._guestAccountLocalTypeId.toString() + "'," + self._paymentTypeId.toString() + ');';
        popup.buttons[1].clickEvent = '_nex.payment._paymentManager._currentClip.show();';

        popup.message = _nex.assets.theme.getTextAttribute('ORDER', 'genericpin', 'Please enter your PIN') // TODO: Which attribute to check?
        _nex.assets.popupManager.showPopup(popup)
        _nex.keyboard.numpad.bindKeys()
    };
}
GenericPaymentClip.prototype = Object.create(BasePaymentClip.prototype)

// Constructor.
function LoyaltyPaymentClip() {
    var self = this

    self._elementId = paymentConstants.LOYALTY_CLIP_ELEMENT_ID

    self._paymentDeviceFlow = null
    self.tender = null

    self.enableDebug = false
    self._debug = function(message) {
        if (self.enableDebug) {
            console.debug(message)
        }
    }

    // Show the clip.
    self.show = function() {
        // Transition out the select payment clip.
        $('#' + paymentConstants.SELECT_CLIP_ELEMENT_ID).hide()

        // Set the swipe message. The image will be set as the background on the element with id of "swipeTarget"
        self._showSwipeMessage()

        // Update the swipe image.
        var hardwareType = _nex.assets.theme.getHardwareType()
        self._updateSwipeImage(hardwareType)

        // Show the new clip.
        $('#' + self._elementId).show()

        // Start listening for card swipes, barcode scans, RFIDs, etc.
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
        }
        _nex.utility.deviceListener = new DeviceListener('ALL', self._lastKeyFound, true)
        _nex.utility.deviceListener.start()
    };

    self._showSwipeMessage = function() {
        var msg = $('#txtSwipeCard')
        if (msg.length > 0) {
            msg.empty()
                // Following along with the Flash, the UpdateClip method in LoyaltyPaymentClip uses the 'scan' attribute
                // to get which text to show for this clip. It also uses the default text of "Please Swipe your Loyalty Card".
            msg.append(_nex.assets.theme.getTextAttribute('PAYMENT', 'scan', 'Please Swipe Your Loyalty Card'))
        }
    }

    self._updateSwipeImage = function(hardwareType) {
        if (hardwareType.length > 0) {
            var div = $('#swipeTarget')
            if (div.length > 0) {
                div.addClass(hardwareType)
            }
        }
    }

    // Called when the credit payment clip goes out of scope.
    self.hide = function() {
        $('#' + self._elementId).hide()
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
        }
    }

    // Called to reset.
    self.reset = function() {
        self.hide()
        self.show()
    };

    // Called when the end of the card data is detected.
    self._lastKeyFound = function(deviceData) {
        // Store this data in the payment phase for later.
        _nex.payment.deviceData = deviceData

        var tenderConfig = _nex.assets.theme.getTenderByType('loyalty')
        if (tenderConfig) {
            if (_nex.assets.theme.isValidationRequired(tenderConfig)) {
                // prompt for pin (which will call processLoyalty)
                self._debug('validation required; prompting for pin')
                self._promptForPin()
            } else {
                self._debug('validation not required')
                    // skip prompting for a pin; just process the loyalty
                _nex.payment.loyaltyInquiry('')
            }
        } else {
            // This looks like a configuration issue.
            console.log('Configuration Error: No tender for loyalty found!')
            self._genericError(self.reset)
        }
    }

    // Prompt the user to enter their pin.
    self._promptForPin = function() {
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup)
        popup.buttons[0].clickEvent = '_nex.payment.loyaltyInquiry(_nex.keyboard.numpad.data);';
        popup.buttons[1].clickEvent = '_nex.payment._paymentManager._currentClip.show();';
        popup.message = _nex.assets.theme.getTextAttribute('ORDER', 'loyaltypin', 'Please enter your PIN') // TODO: Which attribute to check?
        _nex.assets.popupManager.showPopup(popup)
        _nex.keyboard.numpad.bindKeys()
    };
}
LoyaltyPaymentClip.prototype = Object.create(BasePaymentClip.prototype)

function LoyaltyPromptClip(callback) { // clip:XML, paymentTarget:MovieClip, paymentText:XML
    var self = this

    self._elementId = paymentConstants.LOYALTY_CLIP_ELEMENT_ID
    self._cardListener = null
    self.cardData = null
    self._pinData = '';
    var debugging = true
    self._debug = function(message) {
        if (debugging) {
            // Use built in arguments object to pass all arguments to the console.debug method.
            console.debug('LoyaltyPrompt', message)
        }
    }

    self._promptIsForLoyalty2 = function() {
        return _nex.manager.theme.kiosk.PAYMENTPROFILE.promptforrewardscard == 2
    };

    self._updateControlButtons = function() {
        // update cancel button
        var btnCancel = $('#ctrl-cancel')
        if (btnCancel.length > 0) {
            _nex.assets.theme.setControlButtonText('ctrl-cancel', _nex.assets.theme.getTextAttribute('ORDER', 'cancel', 'CANCEL'))
            btnCancel.removeClass('control-button-hidden')
            btnCancel.attr('onclick', '')
            btnCancel.unbind('click')
            btnCancel.click(function() {
                    self._cancelButtonClicked(btnCancel)
                })
                // skip tabbing to the 'cancel' button for Visually Impaired. Should be hidden anyways, unless they click the KVI to start button.
                // the way to cancel here is by unplugging.
            btnCancel.attr('tabindex', '-1')
        }

        // update back button
        var btnBack = $('#ctrl-back')
        if (btnBack.length > 0) {
            _nex.assets.theme.setControlButtonText('ctrl-back', _nex.assets.theme.getTextAttribute('ORDER', 'back', 'BACK'))
            btnBack.removeClass('control-button-hidden')
            btnBack.attr('onclick', '')
            btnBack.unbind('click')
            btnBack.click(function() {
                self._backButtonClicked(btnBack)
            })
            btnBack.attr('tabindex', '3')
        }

        var btnSkip = $('#ctrl-skip')
        if (btnSkip.length > 0) {
            _nex.assets.theme.setControlButtonText('ctrl-skip', _nex.assets.theme.getTextAttribute('ORDER', 'skip', 'SKIP'))
            btnSkip.removeClass('control-button-hidden')
            btnSkip.attr('onclick', '')
            btnSkip.unbind('click')
            btnSkip.click(function() {
                self._skipButtonClicked(btnSkip)
            })

            btnSkip.attr('tabindex', '4')
        }
    }

    self._cancelButtonClicked = function($button) {
        _nex.assets.soundManager.playButtonHit()
        _nex.ordering.cancelOrderPrompt()
    };

    self._backButtonClicked = function($button) {
        _nex.assets.soundManager.playButtonHit()
        _nex.payment.backButton()
    };

    self._skipButtonClicked = function($button) {
        _nex.assets.soundManager.playButtonHit()
        _nex.payment._route(_nex.splashPhase.userSwipedToStart, true)
    };

    // Show the clip.
    self.show = function() {
        // Transition out the select payment clip.
        $('#' + paymentConstants.SELECT_CLIP_ELEMENT_ID).hide()

        // Set the swipe message. The image will be set as the background on the element with id of "swipeTarget"
        self._showSwipeMessage()

        // Update the swipe image.
        var hardwareType = _nex.assets.theme.getHardwareType()
        self._updateSwipeImage(hardwareType)

        // Show the new clip.
        $('#' + self._elementId).show()

        // Start listening for card swipes, barcode scans, RFIDs, etc.
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
        }
        _nex.utility.deviceListener = new DeviceListener('ALL', self._lastKeyFound, true)
        _nex.utility.deviceListener.start()

        self._listenForSwipe()
        self._updateControlButtons()
    };

    self._showSwipeMessage = function() {
        var msg = $('#txtSwipeCard')
        if (msg.length > 0) {
            msg.empty()
                // Following along with the Flash, the UpdateClip method in LoyaltyPaymentClip uses the 'scan' attribute
                // to get which text to show for this clip. It also uses the default text of "Please Swipe your Loyalty Card".
            msg.append(_nex.assets.theme.getTextAttribute('PAYMENT', 'scan', 'Please Swipe Your Loyalty Card'))
        }
    }

    self._updateSwipeImage = function(hardwareType) {
        if (hardwareType.length > 0) {
            var div = $('#swipeTarget')
            if (div.length > 0) {
                div.addClass(hardwareType)
            }
        }
    }

    self.hide = function() {
        var element = document.getElementById(self._elementId)
        if (element) {
            element.style.display = 'none'
        }
    }

    self._showSwipeMessage = function() {
        var msg = $('#swipeCard')
        if (msg.length > 0) {
            msg.empty()
            msg.append(_nex.assets.theme.getTextAttribute('PAYMENT', 'swipe', 'Please Swipe Your Credit Card'))
        }
    }

    self._listenForSwipe = function() {
        if (self._cardListener !== null) {
            self._cardListener.stopListening()
        }

        self._cardListener = new CardListener(self._lastKeyFound)
        self._cardListener.startListening()
    };

    self._promptForPin = function(track1, track2) {
        self._debug('_promptForPin')
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup)
        popup.buttons[0].clickEvent = '_nex.payment.loyaltyInquiry(_nex.keyboard.numpad.data, _nex.payment.promptForLoyalty2());';
        popup.buttons[1].clickEvent = '_nex.payment._paymentManager._currentClip.show();';
        popup.message = _nex.assets.theme.getTextAttribute('ORDER', 'loyaltypin', 'Please enter your PIN') // TODO: Which attribute to check?
        _nex.assets.popupManager.showPopup(popup)
        _nex.keyboard.numpad.bindKeys()
    };

    // Called when the end of the card data is detected.
    self._lastKeyFound = function(cardData) {
        self._cardListener.stopListening()
        _nex.payment.deviceData = cardData
        var tenderConfig = _nex.assets.theme.getTenderByType('loyalty')
        if (tenderConfig) {
            if (_nex.assets.theme.isValidationRequired(tenderConfig)) {
                // prompt for pin (which will call processLoyalty)
                self._debug('validation required; prompting for pin')
                self._promptForPin(cardData.track1, cardData.track2)
            } else {
                self._debug('validation not required')
                    // skip prompting for a pin; just process the loyalty
                    //_nex.payment.loyaltyInquiry("");
                var isLoyalty2 = _nex.manager.theme.kiosk.PAYMENTPROFILE.promptforrewardscard == 2
                _nex.payment.loyaltyInquiry('', isLoyalty2)
            }
        }
    }
}

LoyaltyPromptClip.prototype = Object.create(BasePaymentClip.prototype)
LoyaltyPromptClip.prototype.constructor = BasePaymentClip

function SelectPaymentClip() {
    var self = this

    self._elementId = paymentConstants.SELECT_CLIP_ELEMENT_ID
    self.defaultVoiceover = 'Select Payment.mp3';

    self.enableDebugging = true
    self._debug = function() {
        if (self.enableDebugging) {
            console.debug('SelectPaymentClip', arguments)
        }
    }

    self.show = function() {
        // At this point the clip should already be appended to the #targets tag...
        // We just need to change it from hidden to visible.
        console.debug('SelectPaymentClip.show with element ' + self._elementId)
        var element = document.getElementById(self._elementId)
        if (!element) {
            throw 'Missing element ' + self._elementId
        }
        $('#' + self._elementId).show()

        // If there is a credit tender or loyalty tender, allow swipe from this screen.
        // This logic was causing confusion in the lobby why it would accept a swipe if you didn't pick credit or loyalty
        // Commenting out for now
        //if (self._checkForCreditTender() || self._checkForLoyaltyTender()) {
        //    if (_nex.utility.deviceListener) {
        //        _nex.utility.deviceListener.stop();
        //    }
        //    _nex.utility.deviceListener = new DeviceListener("CARD", self._lastKeyFound, true);
        //    _nex.utility.deviceListener.start();
        //}
    };

    self._checkForCreditTender = function() {
        var result = true
        var NOT_FOUND = -1 // jQuery returns -1 if it is not found in the array.
        var tendersAvailable = _nex.assets.theme.tendersAvailable()
        if ($.inArray('credit', tendersAvailable) === NOT_FOUND) {
            result = false
        }
        return result
    };

    self._checkForLoyaltyTender = function() {
        var result = true
        var NOT_FOUND = -1 // jQuery returns -1 if it is not found in the array.
        var tendersAvailable = _nex.assets.theme.tendersAvailable()
        if ($.inArray('loyalty', tendersAvailable) === NOT_FOUND) {
            result = false
        }
        return result
    };

    self.hide = function() {
        $('#' + self._elementId).hide()
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
        }
    }

    // Called when the end of the card data is detected.
    self._lastKeyFound = function(cardData) {
        if (_nex.utility.deviceListener) {
            _nex.utility.deviceListener.stop()
        }
        self._debug(cardData)
        self._checkSwipeData(cardData.track1, cardData.track2)
    };

    // Checks the swipe data and hands processing over to the SwipeToStart action.
    self._checkSwipeData = function(track1, track2) {
        var cardParser = new CardParser(_nex.assets.theme)
        self._debug('_checkSwipeData, parsing card')
        cardParser.parse(track1, track2, self._goodSwipe, self._badSwipe)
    };

    // Called for a good swipe by the card parser.
    self._goodSwipe = function(cardData) {
        self._debug('goodSwipe method')
            // We support both loyalty and credit for the splash screen just like swipe to start
        if (cardData.isLoyalty()) {
            self._debug('goodSwipe', 'User swiped a loyalty card.')
            self.tenderType = 'loyalty';
            // Simulate the last key being found from the loyalty clip itself.
            var clip = new LoyaltyPaymentClip()
            clip._lastKeyFound(cardData)
        } else {
            self._debug('credit')
            self._debug('goodSwipe', 'User swiped a credit card.')
            var tenderCredit = new TenderCredit()
            tenderCredit.update(cardData.track1, cardData.track2)
            if (tenderCredit.cardData) {
                // Pass the card data along.
                _nex.payment.processOrder(tenderCredit)
            } else {
                self._debug('bad')
            }
        }
    }

    // Called for a bad swipe by the card parser.
    self._badSwipe = function() {
        self._debug('badSwipe method')
        _nex.payment.showErrorPopup(_nex.payment.textSwipeError(), _nex.payment.start())
    };
}
SelectPaymentClip.prototype = Object.create(BasePaymentClip.prototype)

function _BaseTender() {
    var self = this
    self._amount = 0 //Number;
    self._tenderType = ''; // String ;//= "counter"; // Counter is the default tender types
    self._tenderTypeCode = 0 //String;// = "0";
    self._tenderName = ''; // String = null; // user friendly name displayed to the user
    self._isAuthorized = false //Boolean  = false;
    self._tenderDiscount = 0 //Number = 0;
    self._usedAsPayment = false //Boolean = false;
    self._errorMessage = ''; // String = null;
    self._allowGratuity = false //Boolean = false; 

    self._isValidated = false //Boolean  = false;
    self._saveTender = true //Boolean  = true;

    self._validationData = ''; // String = "";
    self._tenderXml = ''; // XML;
    self._paymentText = ''; // XML;

    self._currentValidateSequence = 0 //int;
    self._maxValidates = 1 //int = 1;
    self._validationDataBySequence = null //Object;
    self._overrideAllreadyUsed = false //Boolean;

    self._isCharged = false //Boolean;
    self._discountXml = ''; // XMLList;
    self._showProcessingOnPreAuth = true //Boolean = true;


    self.isFinalTender = function() {
        // return (_tenderXml.@final.toString().toLowerCase() == "true");

    }

    self.isPreAuthRequired = function() {

        // return (_tenderXml.@preauth.toString().toLowerCase() == "true");		
    }
    self.write = function() {
        // Start the tender object with a type property.
        var tender = {
            type: self._tenderType, // the string, e.g. "credit"
            typeCode: self._tenderTypeCode // the code, e.g. 1

        }

        // Pass that in to the write method, implemented in the derived class.
        var result = self._write(tender)

        // Return the result.
        return result
    };
}

/*
public class BaseTender extends EventDispatcher implements ITenderType
	{
		protected var _amount:Number;
		protected var _tenderType:String ;//= "counter"; // Counter is the default tender types
		protected var _tenderTypeCode:String;// = "0";
		protected var _tenderName:String = null; // user friendly name displayed to the user
		protected var _isAuthorized:Boolean  = false;
		protected var _tenderDiscount:Number = 0;
		protected var _usedAsPayment:Boolean = false;
		protected var _errorMessage:String = null;
		protected var _allowGratuity:Boolean = false; 
		
		protected var _isValidated:Boolean  = false;
		protected var _saveTender:Boolean  = true;
		
		protected var _validationData:String = "";
		protected var _tenderXml:XML;
		protected var _paymentText:XML;
		
		protected var _currentValidateSequence:int;
		protected var _maxValidates:int = 1;
		protected var _validationDataBySequence:Object;
		protected var _overrideAllreadyUsed:Boolean;
		
		protected var _isCharged:Boolean;
		protected var _discountXml:XMLList;
		protected var _showProcessingOnPreAuth:Boolean = true;
		
		function BaseTender()
		{
			_tenderXml = ThemeManager.CurrentTheme.SystemSettingsXml.TENDERS[0].TENDER.(@type == _tenderType.toLowerCase())[0];
			if (_tenderXml.@allowgratuity.toString().length > 0) _allowGratuity = (_tenderXml.@allowgratuity.toString().toLowerCase() == "true");
			_paymentText = ThemeManager.CurrentTheme.Language.GetActiveText("PAYMENT");
			_amount = 0;
			
			if (MovieManager.MainMovie.MovieName.toLowerCase() == "onlineordering")
			{
				_saveTender = false; 
			}
			
			_discountXml = null;
		}

		public function get AllowGratuity():Boolean
		{
			return _allowGratuity;
		}
		
		public function get Amount():Number
		{
			_amount = NumericUtilities.CorrectMathError(_amount);
			return _amount;
		}
				
		public function set Amount(amount:Number)
		{
			_amount = amount;
		}
		
		public function get DisplayAmount():Number
		{
			return Amount;
		}
		
		public function get Discount():Number
		{
			return _tenderDiscount;
		}
		
		public function set Discount(tenderDiscount:Number)
		{
			_tenderDiscount = tenderDiscount;
		}
		
		public function get DiscountXml():XMLList
		{
			return _discountXml;
		}
		
		public function set DiscountXml(discounts:XMLList)
		{
			_discountXml = discounts;
		}
		
		public function get ErrorMessage():String
		{
			return _errorMessage;
		}
		
		public function get IsAuthorized():Boolean
		{
			return _isAuthorized;
		}
		
		public function get IsValidated():Boolean
		{
			return _isValidated;
		}
		
		public function get IsCharged():Boolean
		{
			return _isCharged;
		}

		public function get UsedAsPayment():Boolean
		{
			return _usedAsPayment;
		}
		
		public function set UsedAsPayment(usedAsPayment:Boolean)
		{
			_usedAsPayment = usedAsPayment;
		}

		public function TenderType():String
		{
			return _tenderType;
		}
		
		public function TenderTypeCode():String
		{
			return _tenderTypeCode;
		}
		
		public function get TenderName():String
		{
			return _tenderName;
		}
		
		public function set TenderName(name:String)
		{
			_tenderName = name;
		}
		
		public function get OverrideAllreadyUsed():Boolean
		{
			return _overrideAllreadyUsed
		}
		
		public function set OverrideAllreadyUsed(value:Boolean)
		{
			_overrideAllreadyUsed = value;
		}
		
		public function get ShowProcessingOnPreAuth():Boolean
		{
			return _showProcessingOnPreAuth;
		}
		
		public function set ShowProcessingOnPreAuth(showProcessingOnPreAuth:Boolean)
		{
			_showProcessingOnPreAuth = showProcessingOnPreAuth;
		}
		
		//
		 // defaults to true. if false then the POP server will not save this tender on the order when processing
		 // if online ordering then it deafaults to false and it triggers OO to save the tender to the customer profile
		 //
public function get SaveTender():Boolean
    {
        return _saveTender;
    }
		
    public function set SaveTender(val:Boolean):void
    {
        _saveTender = val;
    }
		
    public function PreAuthRequest():void
    {
        if (IsPreAuthRequired() || IsPreAuthAndPayment())
            {
                trace("show processing for PreAuthRequest");
                if (_showProcessingOnPreAuth)
                {
                    var popup:BasePopup = PopupManager.GetPopup(PopupManager.PROCESSING);
                    popup.MessageText = (_paymentText.@preauthmessage.toString().length > 0) ? _paymentText.@preauthmessage : "Authorizing...";
                    popup.Show();
                }
				
                _isAuthorized = false;
            }
        else
        {
            _isAuthorized = true;
            RaiseEvent(TenderEvent.PREAUTH_RESPONSE);				
        }
    }
		
        protected function PreAuthResponse(evt:CommunicationEvent):void
		{			
		    if (_showProcessingOnPreAuth)
		    {
		        PopupManager.GetPopup(PopupManager.PROCESSING).Hide();
		    }
			
			if (!this.IsAuthorized)
        {
				var popup:BasePopup = PopupManager.GetPopup(PopupManager.ERROR);
            if (evt.Response.Xml.@errormessage.toString().length > 0)
            {
                popup.MessageText = evt.Response.Xml.@errormessage;
            }
            else
            {
                popup.MessageText = (_paymentText.@preautherror.toString().length > 0) ? _paymentText.@preautherror : "Authorization failed";
            }
            popup.Show(null, true);
        }
        RaiseEvent(TenderEvent.PREAUTH_RESPONSE);
    }
		
    protected function RaiseEvent(eventType:String):void
    {
        dispatchEvent(new TenderEvent(eventType, this));
        }
		
    public function WriteXml(tender:XML)
        {
            tender.@type = this.TenderTypeCode();
            tender.@tenderdiscount = this._tenderDiscount;
			
            tender.@istaxexempt = IsTaxExempt;
            tender.@savetender = (_saveTender ? "true" : "false");
            if (_isCharged)
            {
                //flag that hte tender was already paid for and should not be charged again
                tender.@paid = "true"; 
            }
            tender.@pcid = ThemeManager.KioskXml.@pcid;
        }
		
        public function get IsTaxExempt():Boolean
            {
                var tenderSetting:XML = OrderManager.CurrentOrder.OrderPayment.TenderSettings.TENDER.(@type == this.TenderType().toLowerCase())[0];
                Logger.Publish(Logger.DEBUG, tenderSetting.toXMLString());
                return (tenderSetting.@istaxexempt.toString().toLowerCase() == "true");		
            }
		
            public function IsFinalTender():Boolean
                {
                    return (_tenderXml.@final.toString().toLowerCase() == "true");
                }
		
                public function IsPreAuthRequired():Boolean
                    {
                        return (_tenderXml.@preauth.toString().toLowerCase() == "true");		
                    }
		
                    //
                     // If true then the tender is expected to be charged during the preauth.
                     // Only supported by loyalty currently
                     //
                    public function IsPreAuthAndPayment():Boolean
                        {
                            return (_tenderXml.@preauthandpay.toString().toLowerCase() == "true");		
                        }
		
                        public function IsValidationRequired():Boolean
                            {
                                return (_tenderXml.@validate.toString().toLowerCase() == "true");		
                            }
		
                            public function get ValidationData():String
                                {
                                    return _validationData;
                                }
		
                                public function GetValidationData(validateSequence:int):String
                                    {
                                        if (_validationDataBySequence == null || _validationDataBySequence[validateSequence] == null)
                                        {
                                            return "";
                                        }
			
                                        return String(_validationDataBySequence[validateSequence]);
                                    }
		
                                    protected function SetValidationData(validateSequence:int, validationData:String):void
                                    {
                                        if (_validationDataBySequence == null)
                                            {
                                                _validationDataBySequence = new Object();
                                            }
			
                                            _validationDataBySequence[validateSequence]  = validationData;
                                        }
		
                                    protected function GetValidateType(validateSequence:int):String
                                        {
                                            return "";
                                        }
		
                                        public function GetValidationPopup(validateSequence:int = 1):BaseKeyPadPopup
                                            {
                                                var popup:BaseKeyPadPopup;
                                                var validateAssetAttribute:String = "validateasset";
                                                if (validateSequence > 1)
                                                {
                                                    validateAssetAttribute = validateAssetAttribute + validateSequence.toString();
                                                }
				
                                                var validationAsset:String = _tenderXml.@[validateAssetAttribute].toString().toLowerCase();
                                                switch(validationAsset)
                                                {
                                                    case "assets/pinpad.swf": //this one is included for backwards compatibility
                                                    case "pinpad":
                                                        popup = PopupManager.GetPopup(PopupManager.PIN_PAD) as BaseKeyPadPopup;
                                                        break;
                                                    case "assets/keyboard.swf": //this one is included for backwards compatibility
                                                    case "keyboard":
                                                        popup = PopupManager.GetPopup(PopupManager.KEYBOARD) as BaseKeyPadPopup;
                                                        KeyboardPopup(popup).EnableKeys(true, true, false, true);//if using the keyboard allow letters and numbers
                                                        break;
                                                    case "assets/numberpad.swf": //this one is included for backwards compatibility
                                                    case "numberpad":
                                                    default:
                                                        popup = PopupManager.GetPopup(PopupManager.NUMBER_PAD) as BaseKeyPadPopup;
                                                        break;
                                                }
			
                                                return popup;
                                            }
		
                                            //
                                             // Loads up the selected validate popup for this tender and then preauthorizes the tender once the popup has returned with a value.
                                             //
                                            public function Validate():void
                                            {
                                                //validate for each validate asset setup. create an array of validate data
                                                _currentValidateSequence = 1;
                                                var validateAsset:String;
                                                var bail:Boolean = false;
                                                _maxValidates = 1;
                                                for (var i:int = 2; i < 10 && !bail; i++)
                                                {
                                                    validateAsset = "validateasset" + i.toString();
                                                    if (_tenderXml.@[validateAsset] == null || _tenderXml.@[validateAsset].toString() == "")
                                                {
                                                        bail = true;
                                                }
                                        else
                                        {
                                                    _maxValidates++;
                                        }
                                    }
			
                                        if ((_maxValidates == 1) && (_tenderXml.@validateasset.toString() == ""))
                                        {
                                            PreAuthRequest();
                                        }
                                        else
                                        {
                                            DoValidate(_currentValidateSequence);
                                        }
                                    }
		
                                    protected function DoValidate(validateSequence:int):void
                                    {
                                        var popup:BaseKeyPadPopup = GetValidationPopup(validateSequence);
			
                                        var minString:String = "minlength" ;
                                        var maxString:String = "maxlength" ;
			
                                        if (validateSequence > 1)
                                        {
                                            minString = "minlength" + validateSequence.toString();
                                            maxString= "maxlength" + validateSequence.toString();
                                        }
			
                                        var maxlength:Number = Number(_tenderXml.@[maxString].toString());
                                        var minlength:Number = Number(_tenderXml.@[minString].toString());
			
                                        if (minlength < 0 || minlength == NaN)
                                        {
                                            minlength = 0;
                                        }
                                        if (maxlength <= 0 || maxlength == NaN)
                                        {
                                            maxlength = 10;
                                        }
			
                                        popup.MaxLength = maxlength;
                                        popup.MinLength = minlength;
			
                                        var validateText:String = ThemeManager.CurrentTheme.Language.GetActiveTextAttribute("VALIDATE", GetValidateType(validateSequence));
                                        if (validateText == null || validateText.length == 0)
                                        {
                                            validateText = "Enter Validation Number";
                                        }
                                        popup.MessageText = validateText;
                                        popup.Show(ValidateResults);
                                    }
		
                                    //
                                     // Called when the validate popup is closed. get the validation retult and send the preauth
                                     //
                                    private function ValidateResults(evt:PopupEvent):void
                                    {
                                        try
                                        {
                                            if (evt.NoClicked)
                                                {
                                                    //clear out the validation data and raise the cancelled event.
                                                    _validationData = "";
                                                    _currentValidateSequence = null;
                                                    RaiseEvent(TenderEvent.VALIDATION_CANCELLED);
                                                }
                                            else
                                            {
                                                //yes clicked so validation data was returned. preauthorize using this data
                                                var popup:BaseKeyPadPopup = evt.target as BaseKeyPadPopup;				
                                                if (_currentValidateSequence == 1)
                                                {
                                                    _validationData = popup.Text;
                                                }
					
                                                SetValidationData(_currentValidateSequence, popup.Text);
					
                                                if (_currentValidateSequence == _maxValidates)
                                                {					
                                                    PreAuthRequest();	
                                                }
                                                else
                                                {
                                                    //get the next piece of validation data.
                                                    _currentValidateSequence++;
                                                    DoValidate(_currentValidateSequence);
                                                }
                                            }
                                        }
                                        catch (e:Error)
                                        {
                                            Logger.PublishError(e);
                                        }
                                    }
		
                                }
                            }

                        */
function TenderCash() {
    var self = this
    self._tenderType = paymentConstants.TENDER_CASH
    self._tenderTypeCode = '2';

    self._baseTender = new BaseTender()


}

function TenderCounter() {
    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(this)

    var self = this
    self._tenderType = paymentConstants.TENDER_COUNTER
    self._tenderTypeCode = '0'; // counter is 0 in the Flash.

    self._write = function(tender) {
        tender.COUNTER = {}

        return tender
    };
}
TenderCounter.prototype = Object.create(_BaseTender.prototype)

function TenderCoupon(paymentTypeId, accountNumber, pin) {
    var self = this

    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(self)

    // Private properties.
    self._tenderType = paymentConstants.TENDER_COUPON

    self._tenderTypeCode = '4';
    self._responseData = null

    // Check if this is a valid account.
    self.isValidAccount = function() {
        if (self._responseData) {
            return self._responseData.success
        }
        return false
    };

    // Get the coupon amount by deduction type.
    self.deductionAmount = function(subTotal) {
        var amount = 0.0

        if (self._responseData.deductiontype == 2) {
            amount = self._responseData.amount / 100 * subTotal
        } else {
            amount = self._responseData.amount
        }
        self._responseData.amount = amount
        return amount
    };

    // Call this method to update the coupon tender with what comes back from couponInquiry.
    self.update = function(response) {
        var data = {}
        data.success = response.status.toLowerCase() === "success";

        data.couponnumber = response.number ? response.number : '';
        data.amount = response.value ? response.value : '';
        data.deductiontype = response.type ? response.type : '';

        // Put the data on the tender object.
        self._responseData = data
    };

    // The _write method is called by baseTenders write method.
    self._write = function(tender) {
        tender.COUPON = {}

        tender.COUPON.tendercode = self._responseData.couponnumber
        tender.COUPON.amount = self._responseData.amount
        tender.COUPON.deductiontype = self._responseData.deductiontype
        tender.COUPON.paymenttypeid = self._tenderType

        return tender
    };
}
TenderCoupon.prototype = Object.create(_BaseTender.prototype)
    // Constructor.
function TenderCredit(amount) {
    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(this)

    // Copy a reference to the object instance.
    var self = this
    self._tenderType = paymentConstants.TENDER_CREDIT
    self._tenderTypeCode = '1'; // credit is 1 in the Flash

    // Get the amount from the parameter if it is valid.
    self._amount = 0.00
    if (typeof amount === 'number') {
        if (amount && amount > 0.00) {
            self._amount = amount
        }
    }

    // Keep track of the data on the card.
    self.cardData = {}

    // Credit is always a final tender
    self.isFinalTender = function() {
        // return (_tenderXml.@final.toString().toLowerCase() == "true");
        return true
    };

    // Parse card data given track1 and track2.
    self.update = function(track1, track2) {
        // Initialize the card parser.
        var cardParser = new CardParser(_nex.assets.theme)

        // Parse the data out of track1 and track2.
        var cardData = cardParser.parse(track1, track2)

        // Set the card data to whatever comes back. This will be null if there is an issue in track1 or track2.
        self.cardData = cardData
    };

    // If card data is available, use this to initialize the cardData property.
    // TODO2: Test this!
    self.setCardData = function(cardData) {
        self.cardData = new CardData()

        self.cardData.cardNumber = cardData.CardNumber
        self.cardData.expMonth = cardData.ExpMonth
        self.cardData.expYear = cardData.ExpYear
        self.cardData.cardType = cardData.CardType
        self.cardData.firstName = cardData.FirstName
        self.cardData.lastName = cardData.LastName
        self.cardData.track1 = cardData.Track1
        self.cardData.track2 = cardData.Track2
        self.cardData.userData = cardData.UserData
        self.cardData.userDataLength = self.cardData.userData.length
    };

    self._write = function(tender) {
        // The _write method is called by baseTenders write method.

        tender.CREDITCARD = {}
            //tender.CREDITCARD.TotalAmount = self._amount;

        tender.CREDITCARD.CardNum = self.cardData.cardNumber
        tender.CREDITCARD.CardExpMonth = self.cardData.expMonth
        tender.CREDITCARD.CardExpYear = self.cardData.expYear

        tender.CREDITCARD.CardType = self.cardData.cardType
            //tender.CREDITCARD.PreAuth = "false"; // always false for UX regardless of settings (hard coded server side in the credit tender)
        tender.CREDITCARD.Track1 = (self.cardData.track1 != null) ? self.cardData.track1 : '';
        tender.CREDITCARD.Track2 = (self.cardData.track2 != null) ? self.cardData.track2 : '';
        tender.CREDITCARD.UserData = (self.cardData.userData != null) ? self.cardData.userData : '';
        tender.CREDITCARD.TaxExempt = self.cardData.isTaxExempt
        tender.CREDITCARD.cardid = self.cardData.cardId;
        tender.CREDITCARD.billingstreet = self.cardData.billingStreet
        tender.CREDITCARD.billingzip = self.cardData.billingZip


        if (self.cardData.firstName.length > 0) {
            tender.CREDITCARD.NameOnCard = self.cardData.firstName + ' ' + self.cardData.lastName
        } else {
            tender.CREDITCARD.NameOnCard = self.cardData.lastName
        }
        return tender
    };
}
TenderCredit.prototype = Object.create(_BaseTender.prototype)

function TenderDebit() {
    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(this)

    var self = this
    self._tenderType = paymentConstants.TENDER_DEBIT
    self._tenderTypeCode = '3';
}
TenderDebit.prototype = Object.create(_BaseTender.prototype)

function TenderDiscount() {
    var self = this
    self._tenderType = paymentConstants.TENDER_DISCOUNT
    self._tenderTypeCode = '9';
}

function TenderEmployee() {
    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(this)

    var self = this
    self._tenderType = paymentConstants.TENDER_EMPLOYEE
    self._tenderTypeCode = '7';
    self._employeeNumber = '';
    self._employeePIN = '';
    self._employeeName = '';
    self._response = null

    self.updateNumber = function(number) {
        self._employeeNumber = number
    };

    self.updatePin = function(pin) {
        self._employeePIN = pin
    };

    self.getEmployeeNumber = function() {
        return self._employeeNumber
    };

    self.getEmployeePIN = function() {
        return self._employeePIN
    };

    self.updateResponse = function(response) {
        self._response = response
    };

    self._write = function(tender) {
        // The _write method is called by baseTenders write method.

        // Where do I find the employee data in the card??
        tender.EMPLOYEE = {}
        tender.EMPLOYEE.number = self._employeeNumber
        tender.EMPLOYEE.userdata = self._employeePIN
        tender.EMPLOYEE.name = self._employeeName
        if (self._response != null) {
            tender.EMPLOYEE.EMPLOYEERESPONSE = self._response
        }

        return tender
    };
}
TenderEmployee.prototype = Object.create(_BaseTender.prototype)


// TenderGeneric relies on the generic inquiry to update its data.
function TenderGeneric(paymentTypeId, accountNumber, pin) {
    var self = this

    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(self)

    // Private properties.
    var gi = Number(paymentTypeId) - 50
    self._tenderType = 'generictender' + gi.toString()

    self._tenderTypeCode = paymentTypeId
    self._responseData = null
    self._accountNumber = accountNumber
    self._pin = pin

    // Check if this is a valid account.
    self.isValidAccount = function() {
        if (self._responseData) {
            return self._responseData.success
        }
        return false
    };

    // Get the remaining balance on the card.
    self.remainingBalance = function() {
        return self._responseData.maxcharge
    };

    // Has non-zero balance.
    self.hasBalance = function() {
        var result = false
        if (self._responseData.maxcharge > 0.0) {
            result = true
        }
        return result
    };

    // Call this method to update the generic tender with what comes back from genericInquiry.
    self.update = function(response) {
        var data = {}
        data.success = response.success === "true";

        data.guestaccountid = response.guestaccountid ? response.guestaccountid : '';
        data.name = response.name ? response.name : '';
        data.email = response.email ? response.email : '';
        data.guestaccountlocalid = response.guestaccountlocalid ? response.guestaccountlocalid : '';
        data.usage = response.usage ? response.usage : '';
        data.usagebalance = response.usagebalance ? response.usagebalance : '';
        data.usagelimit = response.usagelimit ? response.usagelimit : '';
        data.maxcharge = response.maxcharge ? Number(response.maxcharge) : 0
        data.totalmax = response.totalmax ? Number(response.totalmax) : 0
        data.offline = response.offline ? response.offline.toString() : '';

        // Put the data on the tender object.
        self._responseData = data
    };

    // The _write method is called by baseTenders write method.
    self._write = function(tender) {
        tender.GENERIC = {}

        tender.GENERIC.accountnumber = self._accountNumber
        tender.GENERIC.guestaccountid = self._responseData.guestaccountid
        tender.GENERIC.guestaccountlocalid = self._responseData.guestaccountlocalid
        tender.GENERIC.name = self._responseData.name
        tender.GENERIC.paymenttypeid = self._tenderType
        tender.GENERIC.pin = self._pin
        tender.GENERIC.usage = self._responseData.usage ? self._responseData.usage : '';
        tender.GENERIC.GENERICINQUIRYRESPONSE = self._responseData

        return tender
    };
}
TenderGeneric.prototype = Object.create(_BaseTender.prototype)

// TenderLoyalty relies on the loyalty inquiry to update its data.
function TenderLoyalty() {
    var self = this

    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(self)

    // Private properties.
    self._tenderType = paymentConstants.TENDER_LOYALTY
    self._tenderTypeCode = '5';
    self._cardData = null
    self._offerPercent = 'percent';
    self._offerValue = 'value';
    self._hasOffers = false
    self._noOffersReturnedFromInquiry = false
    self._availableOffers = null
    self._matchedOffers = []
    self._selectedOffers = []

    //objects send back to TM
    self.LOYALTYRESPONSE = {}

    // Call this method to load the card data found on the card.
    self.setCardData = function(cardData) {
        self._cardData = cardData
    };

    // Check if this is a valid account.
    self.isValidAccount = function() {
        var result = false
        if (self.LOYALTYRESPONSE) {
            // If it has a vallid number, it is a valid account.
            if (self.LOYALTYRESPONSE.number) {
                result = true
            }
        }
        return result
    };

    // Get the remaining balance on the card.
    self.remainingBalance = function() {
        return self.LOYALTYRESPONSE.value
    };

    // Has non-zero balance.
    self.hasBalance = function() {
        var result = false
        if (self.LOYALTYRESPONSE.value > 0.0) {
            result = true
        }
        return result
    };

    // Returns true if there are multiple values.
    self.hasMultipleValues = function() {
        var result = false
        if (self.LOYALTYRESPONSE.multiplevalues) {
            result = true
        }
        return result
    };

    // Returns true if it has already been charged.
    self.isCharged = function() {
        return self.LOYALTYRESPONSE.ischarged
    };

    // Return the amount on the loyalty tender object.
    self.getValue = function() {
        return self.LOYALTYRESPONSE.value
    };

    // Set the amount on the tender.
    self.setValue = function(value) {
        self.LOYALTYRESPONSE.value = value
    };

    self.hideProcessingPopup = function(callback) {
        _nex.assets.popupManager.hidePopup(_nex.assets.popupManager.processingPopup, callback)
    };

    // Call this method to update the loyalty tender with what comes back from loyaltyInquiry.
    self.update = function(response) {
        var data = {}
        data.ischarged = response.ischarged === "true";
        data.isoffline = response.isoffline === "true";
        data.name = response.name ? response.name : '';
        data.number = response.number ? response.number : '';
        // make consistent with POS. CardNum is an attribute of the LOYALTY ELEMENT XML
        data.CardNum = response.number ? response.number : '';
        data.CardType = response.cardType ? response.cardType : 'LOYALTY';
        data.responseReceived = response.responseReceived ? response.responseReceived : '';
        data.status = response.status ? response.status : '';
        data.usedphone = response.usedphone ? response.usedphone : '';
        data.value = response.value ? response.value : '';
        data.totalamount = response.value ? response.value : '';
        data.multiplevalues = response.multiplevalues === "true";
        data.DISCOUNTS = {}
        if (response.hasOwnProperty('DISCOUNTS') && response.DISCOUNTS.hasOwnProperty('DISCOUNT')) {
            data.DISCOUNTS = response.DISCOUNTS
            console.log('UPDATING DISCOUNT ', data.discount)
        }
        data.OFFERS = { OFFER: [] }
        self._hasOffers = false
        self._noOffersReturnedFromInquiry = false
        if (response.hasOwnProperty('OFFERS') && response.OFFERS.hasOwnProperty('OFFER')) {
            self._matchedOffers = []
            self._availableOffers = response.OFFERS.OFFER
            self._populateOffers(response.OFFERS.OFFER)
            data.OFFERS.OFFER = self._matchedOffers
            self._hasOffers = self._matchedOffers.length > 0
        } else {
            self._noOffersReturnedFromInquiry = true
        }

        if (self._hasOffers) data.value = self._calculateOfferValue()

        // Put the data on the tender object.
        self.LOYALTYRESPONSE = data
    };

    self._calculateOfferValue = function() {
        var offerAmount = 0.00
        self._matchedOffers.forEach(function(offer) {
            if (offer.type === self._offerPercent) {
                offerAmount += self._calculatePercentOff(offer.price, offer.value)
            } else if (offer.type === self._offervalue) {
                offerAmount += self._calculateAmountOff(offer.price, offer.value)
            } else {
                console.log('Unknown Offer Type ', offer.type)
            }
        })
        return offerAmount
    }

    self._calculatePercentOff = function(price, amount) {
        var percentage = Number(amount)

        //50% = 50 not 0.5, 100% = 1
        if (percentage > 1) {
            percentage = NumericUtilities.CorrectMathError(percentage / 100)
        }
        return percentage * price

    };

    self._calculateAmountOff = function(price, amount) {
        var offerAmount = Number(amount)

        return price - offerAmount
    };

    // The _write method is called by baseTenders write method.
    self._write = function(tender) {
        tender.LOYALTY = {
            LOYALTYRESPONSE: self.LOYALTYRESPONSE
        }
        return tender
    };

    self._offersPopup = function(routeTender, offers) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.offersPopup)
        if (!popup.hasOwnProperty('message')) {
            console.log('Offers Popup Not Found', '')
            return;
        }

        if (self._hasOffers) {
            $('#popup-offers').on('show.bs.modal', function(e) { self._showOffers(e, offers) })
            popup.message = _nex.assets.theme.getTextAttribute('OFFERS', 'hasoffersmessage', 'Congratulations you have offers!')
        } else {
            $('#popup-offers').on('show.bs.modal', function(e) { self._clearOffers(e) })
            popup.message = _nex.assets.theme.getTextAttribute('OFFERS', 'hasnooffersmessage', 'Sorry no offers found!')
        }

        popup.buttons[0].clickEvent = 'addSelectedLoyalty();';
        popup.buttons[0].text = _nex.assets.theme.getTextAttribute('ORDER', 'ok', 'OK')
        _nex.assets.popupManager.showPopup(popup)
    };

    self._clearOffers = function(popup) {
        var $target = $(popup.target)
        var $offer = $target.find('#offer1')
        $offer.text('')
        $offer.nextAll().remove()
    }

    self._showOffers = function(popup, offers) {
        var $target = $(popup.target)
        var $offer = $target.find('#offer1')
        var $noOffer = $target.find('#noOffer')
        var matched = false

        $noOffer.hide()
        $offer.nextAll().remove()

        if (!Array.isArray(offers)) offers = [offers]

        if (Array.isArray(offers)) {
            offers.forEach(function(offer) {
                matched = self._matchedOffers
                if (self._matchedOffers.indexOf(offer) !== -1 || offer.producttype === 'all') {
                    var offerDiv = $target.find('#offer1:last')
                    var rewardContent = ''
                    if (offer.name === 'Reward Dollars') rewardContent = ' - $' + parseFloat(offer.qty).toFixed(2)
                    var htmlContent = '<input type="checkbox" class="check" id="checked-' + offer.id + '" checked><label class="offer-item" onclick="rewardClick(' + offer.id + ');" for="checked-' + offer.id + '">' + offer.name + rewardContent + '</div>'
                    $(offerDiv).html(htmlContent)
                    self._selectedOffers.push(offer.id)
                    $offer.clone().insertAfter('#offer1:last')
                }
            })
            $offer.last().remove()
        } else {
            if (self._matchedOffers.length === 0) {
                $noOffer.show()
            }
        }
    }

    self.addNonPaymentTender = function() {
        var tender = $.extend({}, self)

        var command = new _nex.commands.ProcessLoyalty(tender, 0)
        var tenderType = 'loyalty';
        var addTenderCommand = new _nex.commands.AddTender('loyalty')
        _nex.communication.send(addTenderCommand, function(response) {
            if (response.added) {
                tender.LOYALTYRESPONSE.value = 0
                if (_nex.manager.theme.kiosk.PAYMENTPROFILE.promptforrewardscard == 2) { tenderType = 'loyalty2'; }
                tender.LOYALTYRESPONSE.CardType = tenderType.toUpperCase()
                var processLoyaltyTenderCommand = new _nex.commands.ProcessLoyalty(tender, 0)
                _nex.communication.send(processLoyaltyTenderCommand, function(response) {
                    _nex.payment.handleLoyaltyResponse(response, tender)
                }, 'PROCESSLOYALTYRESPONSE')
            }
        }, 'TENDERADDED')
    }

    addSelectedLoyalty = function() {
        var offers = []
        if (self._selectedOffers.length == 0) {
            // no offers selected.  Add loyalty to order for issuing points
            self.addNonPaymentTender()
            _nex.payment._route(_nex.splashPhase.userSwipedToStart, true)
        } else {
            // process all of the non-monetary offers
            for (var i = 0; i < self._selectedOffers.length; i++) {
                var selectedOffer
                var currentOfferId = self._selectedOffers[i]
                if (Array.isArray(self._availableOffers)) {
                    for (var x = 0; x < self._availableOffers.length; x++) {
                        if (self._availableOffers[x].id == currentOfferId) {
                            selectedOffer = self._availableOffers[x]
                            break;
                        }
                    }
                } else {
                    if (self._availableOffers.id == currentOfferId) {
                        selectedOffer = self._availableOffers
                    }
                }

                if (selectedOffer != null) {
                    offers.push(selectedOffer)
                }
            }

            // if(selectedOffer != null && selectedOffer.name !== "Reward Dollars") {
            var tender = $.extend({}, self)
            tender._amount = selectedOffer.price
            tender._isAuthorized = true
                //tender._isCharged = true;
            tender._isValidated = true
            tender.LOYALTYRESPONSE.OFFERS.OFFER = offers
            var tenderType = 'loyalty';
            var addTenderCommand = new _nex.commands.AddTender(tenderType)

            _nex.communication.send(addTenderCommand, function(response) {
                    if (response.added) {
                        selectedOffer.used = '1';
                        if (_nex.manager.theme.kiosk.PAYMENTPROFILE.promptforrewardscard == 2) { tenderType = 'loyalty2'; }
                        tender.LOYALTYRESPONSE.CardType = tenderType.toUpperCase()
                        var processLoyaltyTenderCommand = new _nex.commands.ProcessLoyalty(tender, selectedOffer.price)
                        _nex.communication.send(processLoyaltyTenderCommand, function(response) {
                            self.handleLoyaltyResponse(response, tender)
                        }, 'PROCESSLOYALTYRESPONSE')
                    }
                }, 'TENDERADDED')
                //}
                //}

            //if(processedOffers < self._selectedOffers.length) {
            //    //Now process all of the monetary offers
            //    for(var i = 0; i < self._selectedOffers.length; i++) {
            //        var selectedOffer;
            //        var currentOfferId = self._selectedOffers[i];
            //        if(Array.isArray(self._availableOffers)) {
            //            for(var x = 0; x < self._availableOffers.length; x++) {
            //                if(self._availableOffers[x].id == currentOfferId) {
            //                    selectedOffer = self._availableOffers[x];
            //                    break;
            //                }
            //            }
            //        }
            //        else {
            //            if(self._availableOffers.id == currentOfferId) {
            //                selectedOffer = self._availableOffers;
            //            }
            //        }

            //        if(selectedOffer != null && selectedOffer.name === "Reward Dollars") {
            //            var tender = $.extend({}, self);

            //            var command = new _nex.commands.ProcessLoyalty(tender, selectedOffer.price);
            //            tender.LOYALTYRESPONSE.OFFERS.OFFER = [selectedOffer]
            //            var tenderType = "loyalty";
            //            var addTenderCommand = new _nex.commands.AddTender(tenderType);
            //            _nex.communication.send(addTenderCommand, function (response) {
            //                if(response.added) {
            //                    selectedOffer.used = selectedOffer.price;
            //                    if(_nex.manager.theme.kiosk.PAYMENTPROFILE.promptforrewardscard == 2) { tenderType = "loyalty2"; }
            //                    tender.LOYALTYRESPONSE.CardType = tenderType.toUpperCase();
            //                    var processLoyaltyTenderCommand = new _nex.commands.ProcessLoyalty(tender, selectedOffer.price);
            //                    _nex.communication.send(processLoyaltyTenderCommand, function (response) {
            //                        if(response.status === "Success") {
            //                            processedOffers++;
            //                            console.log("Loyalty processed", response);
            //                            if(processedOffers == self._selectedOffers.length) {
            //                                self.handleLoyaltyResponse(response, tender);
            //                            }
            //                        }
            //                    }, "PROCESSLOYALTYRESPONSE");
            //                }
            //            }, "TENDERADDED");
            //            break;
            //        }
            //    }
            //}

            _nex.payment._route(_nex.splashPhase.userSwipedToStart, true)
        }
    }

    self._showBalanceMessage = function(message) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.messagePopup)
        popup.message = message
        _nex.assets.popupManager.showPopup(popup)
    };

    self.handleLoyaltyResponse = function(response, tender) {
        // Update the order.
        if (response.ORDER) {
            _nex.orderManager.currentOrder.update(response.ORDER)
        }

        // If enough has been collected.
        if (response.message === 'ENOUGH_COLLECTED') {
            console.log('Payment: Enough has been collected... Going to process order.')
            _nex.payment.processOrder()
        } else {
            // Let the user know what happened
            var amount = response.amount ? response.amount : 0.0
            var remainingBalance = _nex.orderManager.currentOrder.totals.remainingbalance()

            var text = _nex.assets.theme.getTextAttribute('PAYMENT', 'amountauthorized', '${0} Applied.  ${1} Remaining')
            text = text.replace('{0}', amount)
            text = text.replace('{1}', remainingBalance)

            self._showBalanceMessage(text)

            // Hide the back button now that a tender has been applied.
            self._hideBackButton()
        }
    }

    self._hideBackButton = function() {
        var btnBack = $('#ctrl-back')
        if (btnBack.length > 0) {
            btnBack.addClass('control-button-hidden')
        }
    }

    rewardClick = function(id) {
        var index = self._selectedOffers.indexOf(id.toString())
        if (index == -1) {
            self._selectedOffers.push(id.toString())
        } else {
            self._selectedOffers.splice(index, 1)
        }
    }

    self._populateOffers = function(offers) {
        if (!Array.isArray(offers)) offers = [offers]
        if (Array.isArray(offers)) {
            offers.forEach(function(offer) {
                self._matchOffersWithCurrentOrder(offer)
            })
        }
    }

    self._matchOffersWithCurrentOrder = function(offer) {
        var items = _nex.orderManager.currentOrder.ITEM
        var itemsIsArray = Array.isArray(items)
        var matched = {}

        //match all items that match offer items or offer items that are applied to the whole order
        if (itemsIsArray) {
            matched = $.grep(items, function(i) { return i.posid === offer.posid })
            if (matched.length > 0 || offer.producttype === 'all') {
                if (matched.length > 0) {
                    offer.price = matched[0].price
                    offer.quantity = matched[0].quantity
                }

                self._matchedOffers.push(offer)
            }
        }

        return matched.length > 0
    }
}
TenderLoyalty.prototype = Object.create(_BaseTender.prototype)

function TenderRoomCharge() {
    var self = this
    self._tenderType = paymentConstants.TENDER_ROOMCHARGE
    self._tenderTypeCode = '6';
}