// Modeled after the flash. Offer special functionality for the Offline phase.
// The Flash offered methods for updating the status, and stored them in two fields, txtStatus0 and txtStatus1.
// It would then allow displaying that status.
function Offline(htmlEscapeFunction, elementId0, elementId1) {

    var self = this;

    // Private variables for the reason we are offline.
    // Status 0 was used in the flash as the offline reason for things like the license has expired,
    // status1 is used for dayparts.
    var _status = "";
    var _reason = "";
    var _htmlEscapeFunction = htmlEscapeFunction;


    // When the kiosk is offline, it is often the practice to show the reason
    // in the top-right corner, and/or the dayparts information at the bottom
    // if they are offline because of dayparts.

    // PUBLIC METHOD

    // Update the messages and refresh the display.
    self.update = function (message0, message1) {

        _status = (message0 !== undefined) ? window.htmlEscape(message0) : "";
        _reason = (message1 !== undefined) ? window.htmlEscape(message1) : "";

        self.updateDisplay();
    };

    // Clear out the statuses and update the display.
    self.clearReason = function () {
        _status = "";
        _reason = "";
        self.updateDisplay();
    };

    // Update the display.
    self.updateDisplay = function () {

        var offline = $("#__offline");
        var status0 = offline.find("#txtStatus0");
        var status1 = offline.find("#txtStatus1");
        var closeBg = offline.find("#closeBg");

        offline.css("display", "");
        status0.empty();
        status1.empty();

        _status = _status.replace("{0}", _reason);
        
        var visibility = "none";
        if ((_reason.length > 0) &&
            (_nex.manager.currentStatus === _nex.manager.statusType.OFFLINE) &&
            _nex.manager.connectedToTM) {

            if((_reason.toLowerCase().indexOf(" am", 0) >= 0) || (_reason.toLowerCase().indexOf(" pm", 0) >= 0)) {
                visibility = "";
                status1.append(_status);
            }
        }
        else
        {
            if (status0.length === 0) {
                console.log("#txtStatus0 not found");
            }
            status0.append(_status);
        }
        
        closeBg.css("display", visibility);
    };

    self.hide = function () {
        $("#__offline").empty();
        $("#__offline").css("display", "none");
    };
}