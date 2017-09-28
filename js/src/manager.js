/*
 * status.js
 * general site navigation
*/
function Manager(managerParams) {

    var self = this;

    self.communication = managerParams.communication;
    self.theme = managerParams.theme;
    self.phaseManager = managerParams.phaseManager;

    self.pages = null;
    self.offlinepage = 'offline.html';
    self.initialphase = 'splash';
    self.mediaPath = '';
    self.deviceType = '';
    self.reason = '';
    self.preferredStatus = '';
    self.currentStatus = 'Unknown';

    // Keep track of whether or not we are connected to the TM.
    self.connectedToTM = false;

    // TYPES
    self.statusType = {
        "IDLE": "Idle",
        "UNKNOWN": "Unknown",
        "OFFLINE": "Offline",
        "ORDERING": "Ordering",
        "SMS": "Sms",
        "PAYMENT": "Payment",
        "PROCESSING": "Processing",
        "COMPLETING": "Completing",
        "UPDATING": "Updating",
        "COMPLETE": "Complete",
        "PRINTER_ERROR": "PrinterError",
        "POS_OFFLINE": "POSOffline",
        "SURVEY": "Survey",
        "PREVIOUS_ORDERS": "PreviousOrders",
        "POST_ORDERING": "Completing",
        "PAUSED": "Paused",
        "CASH_ERROR": "CashError",
        "EXPIRED": "Expired",
        "SERVICE_REQUEST": "ServiceRequest",
        "WAITING": "Waiting",
        "PAYMENT_REQUEST": "PaymentRequest",
        "RESERVATIONS": "Reservations"
    };

    // METHODS
    // load pages.txt (json) used to navigate the site
    self.init = function (deviceType, themeId, themeMediaPath, uiParams) {

        self.deviceType = deviceType;
        if (uiParams.hasOwnProperty("offlinepage") &&
            (uiParams.offlinepage.length > 0)) {
            self.offlinepage = uiParams.offlinepage;
        }

        // update the css to use the default theme css
        if ((themeId.length > 0) && ($('#themecss').length > 0)) {
            self.mediaPath = themeMediaPath;
            if (themeMediaPath.toLowerCase().indexOf(themeId.toLowerCase()) === -1) {
                self.mediaPath += themeId;
            }
            self.mediaPath += "/media/html/";
            if (inPreviewer()) {
                self.mediaPath = "../Media.aspx?media=html/";
                var csspath = "../Media.aspx?media=html/css/" + deviceType.toLowerCase() + ".css";
                console.debug("manager.init: loading css " + csspath);
                $('#themecss').attr('href', csspath);
            } else {
                $('#themecss').attr('href', self.mediaPath + "css/" + deviceType + ".css");
            }
        }
    };

    self.commandReceived = function (commandName, msg) {

        if (commandName === "LICENSEUPDATE") {
            window.dimScreen(msg.screendim);
        } else if (commandName === "SERVERSTATUS") {
            if (msg.connected.toLowerCase() === "true") {
                self.connectedToTM = true;
                self.communication.send(new _nex.commands.Preamble());
            } else {
                // go offline
                self.connectedToTM = false;
                self.offline(true);
            }

        } else if (commandName === "SETSERVICEMODE") { 
            
            self.preferredStatus = msg.setstatus;
            self.reason = (msg.hasOwnProperty("reason")) ? msg.reason : "";            
            self.resetStatus();

            // TODO - SoundManager.SetVolume(Number(this._xml.@setvolume));


        } else if (commandName === "UPDATEKIOSK") {
            //self.preferredStatus = self.statusType.UPDATING; // otherwise, for a moment it switches to a status of blank
            self.theme.loadUpdate(msg);
            self.update();
        }
    };

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
    self.getStatusMessage = function (status) {
        // TODO: Support dayparts. For example, we will re-open at {0}.
        var result = "";
        switch (status) {
            case self.statusType.OFFLINE:
                // This logic tries to follow along with the Flash.
                if (self.connectedToTM) {
                    // If we are offline, but connected to the TM.... use the close message.
                    result = self.theme.getTextAttribute("STATUS", "offline", "We will reopen at {0}");  // todo: show time we will re-open
                } else {
                    // This goes along with the flash. It uses the unknown attribute, otherwise connecting to TM.
                    // It will be repeatedly trying to reconnect to the TM in this state.
                    result = self.theme.getTextAttribute("STATUS", "unknown", "Connecting to TM...");
                }
                break;
            case self.statusType.PRINTER_ERROR:               
                result = self.theme.getTextAttribute("STATUS", "printererror", "Service Printer"); // todo: show which printer                
                break;
            case self.statusType.EXPIRED:
                result = self.theme.getTextAttribute("STATUS", "expireerror", "Subscription Expired");
                break;
            case self.statusType.UNKNOWN:
                // This goes along with the flash. It uses the unknown attribute, otherwise connecting to TM.
                result = self.theme.getTextAttribute("STATUS", "unknown", "Connecting to TM...");
                break;
            case self.statusType.IDLE:
                // Instead of showing 'idle' in the corner, show empty string.
                result = "";
                break;
            default:
                // If nothing else matches, try to show the reason if we can't find the status in the configuration.
                result = self.theme.getTextAttribute("STATUS", status, self.reason);
        }
        return result;
    };

    // Set the current status to a new status.
    self.setCurrentStatus = function (newStatus, notifyUi) {
        //added check to make sure we were not already at the requested state, this seems to save a lot of traffic! -Trey 6/13/2016
        if (self.currentStatus !== newStatus) {

            self.currentStatus = newStatus;

            // anytime the status is updated, update the display
            self.updateStatusDisplay();

            // sometimes it makes sense to notify the UI manager that the status has updated
            if (notifyUi) {

                self.communication.send(new _nex.commands.KioskStatus(newStatus));
            }
        }
    };

    // Use to manually update the display of the status.
    self.updateStatusDisplay = function () {
        if (self.currentStatus === this.statusType.IDLE) {
            _nex.assets.offline.hide();
        } else {
            _nex.assets.offline.update(self.getStatusMessage(self.currentStatus), self.reason);
        }
    };

    // Once the popup manager is loaded, we can start showing popups.
    function popupManagerLoaded() {
        // console.debug("Popup manager has finished loading... Popups can now be shown.");
    }

    // The update method is called when the UPDATEKIOSK command is received.
    self.update = function () {

        if (self.currentStatus === self.statusType.OFFLINE ||
			self.currentStatus === self.statusType.IDLE ||
			self.currentStatus === self.statusType.PRINTER_ERROR ||
			self.currentStatus === self.statusType.UNKNOWN ||
			self.currentStatus === self.statusType.POS_OFFLINE ||
		    self.currentStatus === self.statusType.CASH_ERROR ||
			self.currentStatus === self.statusType.EXPIRED) {

            self.setCurrentStatus(self.statusType.UPDATING, true);

            // This call to applyUpdate also initializes the popupManager.
            self.theme.applyUpdate(popupManagerLoaded);
            self.phaseManager.loadTheme(self.theme.lastUpdate.THEMES.THEME.PHASE);

            //if (MainMovie.UsingPopups) PopupManager.LoadTheme(ThemeManager.CurrentTheme, ThemeManager.KioskXml.@pctype);
            //if (MainMovie.UsingSounds) SoundManager.LoadTheme(ThemeManager.CurrentTheme);
            self.start();
        }
    };

    self.resetStatus = function () {
        if ((self.currentStatus === self.statusType.IDLE) ||
				(self.currentStatus === self.statusType.OFFLINE) ||
				(self.currentStatus === self.statusType.PRINTER_ERROR) ||
				(self.currentStatus === self.statusType.UNKNOWN) ||
				(self.currentStatus === self.statusType.UPDATING) ||
				(self.currentStatus === self.statusType.POS_OFFLINE) ||
				(self.currentStatus === self.statusType.CASH_ERROR) ||
				(self.currentStatus === self.statusType.EXPIRED)) {
            if (self.currentStatus !== self.preferredStatus) {
                self.start();
            }
        }
    };

    self.start = function () {

        if (self.preferredStatus.length === 0) self.preferredStatus = self.statusType.IDLE;
        if (self.preferredStatus === self.statusType.PRINTER_ERROR || self.currentStatus === self.statusType.PRINTER_ERROR) {
            if (_nex.greenReceipt !== null && _nex.greenReceipt._greenReceiptEnabled()) {
                self.preferredStatus = self.statusType.IDLE;
                self.currentStatus = self.statusType.IDLE;
            }
        }

        if (self.preferredStatus != self.currentStatus) {
            self.setCurrentStatus(self.preferredStatus, true);
        }

        // If we are idle, go to the splash screen; otherwise, go offline.
        if (self.currentStatus === self.statusType.IDLE) {
            
            if (inPreviewer() && !_nex.splashPhase.redirected) {
                _nex.splashPhase.firstTimeToStart(); // initially redirect them to the main menu
                _nex.splashPhase.redirected = true; // second time through let them stay on the splash screen
            }
            else {
                _nex.splashPhase.stop();
                self.splash();
            }
        } else {
            _nex.splashPhase.stop();
            self.offline();
        }
    };

    self.splash = function () {
        var splashHtmlFinished = function () {
            console.debug("Splash HTML finished loading");
        };
        var splashJsFinished = function () {
            // Scale the splash screen full screen.
            console.debug("Splash JS finished loading");
            var wrap = document.getElementById('wrap');
            if (wrap) {
                wrap.style.left = "0";
                wrap.style.top = "0";
                wrap.style.width = '100%';
                wrap.style.height = '100%';
            }

        };
        // Go to the splash phase.
        if (_nex.assets.theme.isUpdateAvailable) {
            _nex.assets.theme.applyUpdate();
            self.phaseManager.loadTheme(self.theme.lastUpdate.THEMES.THEME.PHASE);
        }

        self.phaseManager.changePhase(self.phaseManager.phaseType.SPLASH, splashHtmlFinished, splashJsFinished);

    };

    // Go offline and update the status displayed.
    self.offline = function () {
        self.phaseManager.goOffline(function () {
            setTimeout(function () {
                // SoundManager.StopAllSounds(); TODO add support for sounds
                if ((self.currentStatus !== self.statusType.PRINTER_ERROR) &&
                    (self.currentStatus !== self.statusType.UNKNOWN) &&
                    (self.currentStatus !== self.statusType.POS_OFFLINE) &&
                    (self.currentStatus !== self.statusType.CASH_ERROR) &&
                    (self.currentStatus !== self.statusType.EXPIRED)) {

                        self.setCurrentStatus(self.statusType.OFFLINE, true);

                } else {
                    // We still want to update the status displayed in case the reason changed.
                    // setCurrentStatus normally updates it... But it isn't called, so call it manually.
                    self.updateStatusDisplay();
                }
            }, 500);
        });
    };

    self.sendStatusUpdate = function (status) {
        self.currentStatus = status;
        _nex.communication.send(new _nex.commands.KioskStatus(self.currentStatus));
    };

    self.cancelCurrentPhase = function () {
        self.start();
    };

    //self.offline = function (serverDisconnect) {
        // TODO - not sure about this logic; need to handle client that can work disconnected, like DMD
        // //if (serverDisconnect === undefined) {
        //    serverDisconnect = false;
        //}
        // ((_mainMovie.IsOfflineOnServerDisconnect && serverDisconnect) ||
        //  (!serverDisconnect))
        //if ((serverDisconnect) || (!serverDisconnect)) {
        //    if ((self.currentStatus !== self.statusType.PRINTER_ERROR) &&
        //        (self.currentStatus !== self.statusType.UNKNOWN) &&
        //        (self.currentStatus !== self.statusType.POS_OFFLINE) &&
        //        (self.currentStatus !== self.statusType.CASH_ERROR) &&
        //        (self.currentStatus !== self.statusType.EXPIRED)) {
        //        self.setCurrentStatus(self.statusType.POS_OFFLINE);
        //    }
        //    self.phaseManager.goOffline();
        //} else if (serverDisconnect && (self.currentStatus === self.statusType.UPDATING)) {
        //    // this is a special case where the client is disconnected while updating; reset the status to the last preferred status
        //    self.resetStatus();
        //}
    //};

    self.formatError = function (primaryMessage, secondaryMessage) {
        return '<div class="alert alert-danger"><h2>' + primaryMessage + '</h2>' +
        '<h3>' + secondaryMessage + '</h3>' +
        '</div>';
    };

    // EVENT Listeners
    self.communication.addListener(self.communication.createListener("LICENSEUPDATE", self.commandReceived));
    self.communication.addListener(self.communication.createListener("SERVERSTATUS", self.commandReceived));
    self.communication.addListener(self.communication.createListener("SETSERVICEMODE", self.commandReceived));
    self.communication.addListener(self.communication.createListener("UPDATEKIOSK", self.commandReceived));
}