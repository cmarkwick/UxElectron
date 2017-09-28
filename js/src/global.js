/* 
*   global.js - helper methods
*/
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

// Fix for browsers that do not have a console object or are missing common console methods.
(function () {
    var method;
    var noop = function () { };
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Have console.log log to both the browser's console log (if it is available)
// and do some additional work. This is called later on to do a WRITETOLOG command
// in addition to the typical browser logging.
(function (console) {
    var isExtended = false;

    // Takes as parameters the object and method to call whenever console.log is called.
    var defineNewConsoleLog = function (newObject, newMethod) {
        // If it hasn't been extended already, extend it.
        if (!isExtended) {
            // Save the original console.log method so it can be used later.
            var browserConsoleLog = console.log;

            // Override it.
            console.log = function () {

                // There can be multiple arguments to console.log.
                // It can be a string, it can be an object, it could be multiple objects.
                // Use the built-in arguments object to get those arguments, and pass them all as-is.
                var originalArguments = arguments;

                // Call the browsers version of console.log with the original arguments.
                browserConsoleLog.apply(console, originalArguments);

                // If an additional log method was specified ... 
                if (newMethod && (typeof newMethod === "function")) {
                    // Call that method as well with the original arguments.
                    newMethod.apply(newObject, originalArguments);

                    // Flag it as extended.
                    isExtended = true;
                }
            };
        }
    };

    // Register it on the global window object so this can be called at a 
    // later time when we are ready. This allows some console.log methods to be made
    // just prior to using the extended version.
    window.defineNewConsoleLog = defineNewConsoleLog;

// Pass in the existing console method.
}(window.console));


// auto-close bootstrap menu on touch
$('.navbar-collapse a').click(function (e) {
    $('.navbar-collapse').collapse('toggle');
});

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
    num = Math.round(num * 100.0);
    return num / 100.0;
}

function copyrightNotice() {

    var copyright = "Copyright 2014-2016 NEXTEP SYSTEMS, Inc. All rights reserved.";
    if(_nex.authToken.hasOwnProperty("copyright")) {
        copyright = _nex.authToken.copyright;
        while ((copyright.indexOf("%lt;") > 0) && (copyright.indexOf("%gt;") > 0)) {
            copyright = copyright.replace("%lt;", "<").replace("%gt;", ">");
        }
    }
    return copyright;
}

uriFormatting = {
    iorderfastUri: "{IORDERFAST_URI}",
    themeUri: "{THEME_URI}",
    scriptUri: function (uri) {
        if (uri.indexOf(this.iorderfastUri) > -1) {
            uri = uri.replace(this.iorderfastUri, _nex.authToken.uri);
        }
        if (uri.indexOf(this.themeUri) > -1) {
            uri = uri.replace(this.themeUri, _nex.assets.theme.mediaPath());
        }
        return uri;
    }
};

// Add an 'endsWith' method to the string object.
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

currency = {
    moneySymbol : "$",
    thousandSeparator : ",",
    centsSeparator : ".",
    formatAsDollars : function (amount, showMoneySymbol) {
        //
        // Make sure we're given a real number to work with:  
        if (isNaN(amount)) {
            return "";
        }

        if (showMoneySymbol === null) {
            showMoneySymbol = false;
        }

        amount = amount * 100;
        amount = Math.round(amount);

        //
        // Handle less-than-a-dollar single-digit and double-digit cases:   
        var money = String(Math.floor(amount));
        if (money.length === 1) {
            money = ("0" + this.centsSeparator + "0" + money);
        } else if (money.length === 2) {
            money = ("0" + this.centsSeparator + money);
        } else {
            //
            // First grab the last two characters as cents, and remove them
            // from the amount string:
            var cents = money.slice( -2);
            money = money.substring(0, money.length - 2);
            //
            // Now stuff the last three digits at a time into an array, removing
            // them from the string. (We have to work backwards to figure where
            // commas should go.)
            var dollars = [];
            do {
                dollars.push(money.slice( -3));
                money = money.substring(0, money.length - 3);
            } while (money.length > 3);
            //
            // If there are 1 or 2 numbers remaining, they'll need to be at
            // the front of the number, with their own comma. (We need to test
            // to make sure we don't end up with $,123.00 or such.)   
            if (money.length) {
                dollars.push(money);
            }
            //
            // Now reverse the array, so the last elements appear first:   
            dollars.reverse();

            // format the dollars amount
            money = "";
            for (var i = 0; i < dollars.length; i++) {
                money += dollars[i];
                money += (i !== (dollars.length - 1)) ? this.thousandSeparator : "";
            }

            money = (money + this.centsSeparator + cents);
        }

        if (showMoneySymbol) {
            money = this.moneySymbol + " " + money;
        }

        return money;
    }
};

dateFormatting = {
    days : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    months : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    dayOfWeek: function (day) {
        return this.days[day];
    },
    month: function (m) {
        return this.months[m];
    }
};

itemFormatting = {
    buttonText: function (text) {
        if (text !== undefined) {
            text = text.replace(/~/g, "<br/>");
            text = text.trim();
        }
        return text;
    },
    buttonImage: function (image) {
        return image.replace(".swf", ".png").replace("&amp;","&");
    },
    getPrice : function (item){
        var amount = Number(item.amountdue);
        if (item.ITEM !== undefined) {
            for (var i = 0; (i < item.ITEM.length) ; i++) {
                amount += Number(item.ITEM[i].amountdue);
            }
        }
			
        return correctMathError(amount);
    },
    buildModReceiptText: function (item) {
        var receiptText = "";

        var includeQuantity = (_nex.assets.theme.system.RECEIPT.printmodquantity !== undefined) ? (_nex.assets.theme.system.RECEIPT.printmodquantity.toLowerCase() === "true") : false; 
        var includePriceLevel = (_nex.assets.theme.system.RECEIPT.printmodpricelevel !== undefined) ? (_nex.assets.theme.system.RECEIPT.printmodpricelevel.toLowerCase() === "true") : false;

        if (item.ITEM !== undefined) {
            var lastModIsItem = false;
            for (var i = 0; i < item.ITEM.length; i++) {
                
                var mod = item.ITEM[i];
                if (i > 0) {
                    if (lastModIsItem) {
                        receiptText += "<br/>";
                    }
                    else {
                        receiptText += ", ";
                    }
                }

                if (!mod.hasOwnProperty('receipttext')) {
                    mod = _nex.assets.theme.itemByPosid(mod.posid);
                    mod.receipttext = _nex.assets.theme.itemTextByType(mod, "RECEIPTTEXT");
                }

                if (includePriceLevel) {
                    var priceLevelText = _nex.assets.theme.itemPriceLevelText(mod);
                    if (priceLevelText !== "") {
                        receiptText += _nex.assets.theme.itemPriceLevelText(mod) + "-";
                    }
                }

                receiptText += mod.receipttext;

                lastModIsItem = (mod.hasOwnProperty("itemtype") && (mod.itemtype.toLowerCase() == "item"));
            }
        }
        return receiptText.trim();
    },


    buildSingleModReceiptText: function (mod) {
        var receiptText = "";

        var includeQuantity = (_nex.assets.theme.system.RECEIPT.printmodquantity !== undefined) ? (_nex.assets.theme.system.RECEIPT.printmodquantity.toLowerCase() === "true") : false; 
        var includePriceLevel = (_nex.assets.theme.system.RECEIPT.printmodpricelevel !== undefined) ? (_nex.assets.theme.system.RECEIPT.printmodpricelevel.toLowerCase() === "true") : false;

        if (mod !== undefined){

            if (!mod.hasOwnProperty('receipttext')) {
                mod = _nex.assets.theme.itemByPosid(mod.posid);
                mod.receipttext = _nex.assets.theme.itemTextByType(mod, "RECEIPTTEXT");
            }

            if (includePriceLevel) {
                var priceLevelText = _nex.assets.theme.itemPriceLevelText(mod);
                if (priceLevelText !== "") {
                    receiptText += _nex.assets.theme.itemPriceLevelText(mod) + "-";
                }
            }

            receiptText += mod.receipttext;
        }
        return receiptText.trim();
    }
};

var digitsOnly = /[1234567890]/g;
var floatOnly = /[0-9\.]/g;
var alphaOnly = /[A-Za-z]/g;
var alphaNumOnly = /[A-Za-z1234567890\s]/g;

function restrictCharacters(myfield, e, restrictionType) {
    if (!e) e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;
    var character = String.fromCharCode(code);
    // if they pressed esc... remove focus from field...
    if (code == 27) { this.blur(); return false; }
    // ignore if they are press other keys
    // strange because code: 39 is the down key AND ' key...
    // and DEL also equals .
    if (!e.ctrlKey && code !== 9 && code !== 8 && code !== 46 && code !== 36 && code !== 37 && code !== 38 && (code !== 39 || (code === 39 && character === "'")) && code !== 40) {
        if (character.match(restrictionType)) {
            return true;
        } else {
            return false;
        }
    } else {
        console.log(code);
        return true;
    }
}

/*! A fix for the iOS orientationchange zoom bug.
 Script by @scottjehl, rebound by @wilto.
 MIT / GPLv2 License.
*/
(function (w) {

    // Windows Phone 8 fix 
    if ("-ms-user-select" in document.documentElement.style && navigator.userAgent.match(/IEMobile\/10\.0/)) {
        var msViewportStyle = document.createElement("style");
        msViewportStyle.appendChild(
            document.createTextNode("@-ms-viewport{width:auto!important}")
        );
        document.getElementsByTagName("head")[0].appendChild(msViewportStyle);
        return;
    }

    // This fix addresses an iOS bug, so return early if the UA claims it's something else.
    var ua = navigator.userAgent;
    if (!(/iPhone|iPad|iPod/.test(navigator.platform) && /OS [1-5]_[0-9_]* like Mac OS X/i.test(ua) && ua.indexOf("AppleWebKit") > -1)) {
        return;
    }

    var doc = w.document;

    if (!doc.querySelector) { return; }

    var meta = doc.querySelector("meta[name=viewport]"),
        initialContent = meta && meta.getAttribute("content"),
        disabledZoom = initialContent + ",maximum-scale=1",
        enabledZoom = initialContent + ",maximum-scale=10",
        enabled = true,
		x, y, z, aig;

    if (!meta) { return; }

    function restoreZoom() {
        meta.setAttribute("content", enabledZoom);
        enabled = true;
    }

    function disableZoom() {
        meta.setAttribute("content", disabledZoom);
        enabled = false;
    }

    function checkTilt(e) {
        aig = e.accelerationIncludingGravity;
        x = Math.abs(aig.x);
        y = Math.abs(aig.y);
        z = Math.abs(aig.z);

        // If portrait orientation and in one of the danger zones
        if ((!w.orientation || w.orientation === 180) && (x > 7 || ((z > 6 && y < 8 || z < 8 && y > 6) && x > 5))) {
            if (enabled) {
                disableZoom();
            }
        } else if (!enabled) {
            restoreZoom();
        }
    }

    w.addEventListener("orientationchange", restoreZoom, false);
    w.addEventListener("devicemotion", checkTilt, false);

})(this);

// htmlEscape and htmlUnescape
function htmlEscape(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

function htmlUnescape(value) {
    return String(value)
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

// dim screen creates a div that covers the entire user interface with a semi-transparent black background;
// the html and style are defined in the code so someone cannot update the css to workaround the dimming
// dimming occurs when a TM has not been able to communicate with mynextep for over 14 days; how much the screen is dimmed is controlled by the TM
function dimScreen(dim) {
    try {
        dim = Number(dim);
        var dimmer = $("#dimmer");

        if (dim !== 1) {
            var rgba = "rgba(0,0,0," + dim.toString() + ")";
            if (dimmer.length === 0) {
                $('body').append('<div id="dimmer" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:5000;pointer-events: none;background-color:' + rgba + ';"></div>');
            } else {
                dimmer.css("background-color", rgba);
            }
        } else {
            // remove the dimmer if it already exists
            if (dimmer.length > 0) {
                dimmer.remove();
            }
        }
    }
    catch(e){

    }
}

//app switcher
//triple click on hidden area to switch apps
var throttle = false;
$("#appSwitcher").click(function (evt) {
    if (!throttle && evt.originalEvent.detail === 3) {
        appSwitcherVerify();
        throttle = true;
        setTimeout(function () {
            throttle = false;
        }, 1000);
    }
});

//verify app switcher is enabled and show pin pad popup.
var _alternateui = "";
function appSwitcherVerify() {
    if (_alternateui.toLowerCase() !== "off")
    {
        _alternateui = "EOS";
        var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup);
        popup.buttons[0].clickEvent = "validateCapability()";
        popup.message = _nex.assets.theme.getTextAttribute("ORDER", "switchapplication", "Please enter your PIN to switch applications");
        _nex.assets.popupManager.showPopup(popup);
        _nex.keyboard.numpad.bindKeys();
    }
}

//validate user for SwitchApplication Capability
function validateCapability() {
    var pin = _nex.keyboard.numpad.data;
    _nex.communication.send(new _nex.commands.EmployeeSecurityCheck(pin, "SwitchApplication"), function (result) {
        if (result.responseReceived === "true") {
            employeeCapabilityResponse(result);
        } else {
            console.error("EmployeeSecurityCheck Failed!");
        }
    }, "EMPLOYEESECURITYCHECKRESPONSE");
}

//call SwitchApplication if authorized
// otherwise error message if user not authorized
function employeeCapabilityResponse(result) {
    if (result.EMPLOYEE === undefined) {
        var errorPopup = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
        errorPopup.message = _nex.assets.theme.getTextAttribute("ORDER", "switchapplicationnotallowed", "You are not authorized to switch applications");
        _nex.assets.popupManager.showPopup(errorPopup);
    } else {
        _nex.communication.send(new _nex.commands.SwitchApplication(_alternateui), function(result) {
        });
    }
}

function refreshOrderTimer() {
    // If the orderTimer is already initialized, simply restart it.
    if (_nex.utility.orderTimer) {
        _nex.utility.orderTimer.restart();
    } else {
        // If the order timer is not initialized, initialize it. 
        // At this stage in the process, all the dependencies have been loaded.
        // The theme has been updated in applyUpdate, which also initializes the popupManager, 
        // need to show a popup.
        var messageText = _nex.assets.theme.getTextAttribute("ORDER", "needmoretime", "Need more time?");
        _nex.utility.orderTimer = new OrderTimer(_nex.assets.popupManager, messageText, _nex.assets.phaseManager, "_nex.utility.orderTimer.needMoreTimeClicked();");
        _nex.utility.orderTimer.restart();

        // If a user does some activity, restart the timer.
        $(document).on("keypress", _nex.utility.orderTimer.restart);
        $(document).on("click", function () {
            _nex.utility.orderTimer.restart();
            // If the user clicks anywhere on the screen, be sure to dismiss these kinds of dialogs.
            $('#popup-message').modal('hide');
            $('#popup-error').modal('hide');
        });
        $(document).on("scroll", _nex.utility.orderTimer.restart);

       
    }
}

// Used to detect if we are using the UX previewer
function inPreviewer() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
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
