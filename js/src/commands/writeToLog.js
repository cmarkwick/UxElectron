_nex.commands.WriteToLog = function (message) {
    _nex.commands._BaseRequest.call(this);

    // constant for now
    var DEBUG_LOG_LEVEL = 2;

    // properties
    var self = this;
    self.name = "WRITETOLOG";

    // Default to a log level of debug.
    self.logLevel = DEBUG_LOG_LEVEL;

    // Default the message to what the user specifies.
    self.message = message;

    self.setLogLevel = function (newLevel) {
        self.logLevel = newLevel;
    };

    self.setMessage = function (message) {
        var newMessage = "";
        if (typeof message === "string") {
            newMessage = message;
        }
        self.message = newMessage;
    };

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "message": self.message,
            "loglevel": self.logLevel // Without a log level it will fail.
        };
        return msg;
    };
};
_nex.commands.WriteToLog.prototype = Object.create(_nex.commands._BaseRequest.prototype);