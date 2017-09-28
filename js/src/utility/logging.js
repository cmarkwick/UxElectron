/**
 * A utility for logging.
 * @constructor Logging
 */
function Logging(sendFunction) {

    var self = this;

    // Private properties.
    var _sendFunction = sendFunction;
    var _writeToLogCmdObj = _createWriteToLogCmd();

    // Use the global function defineNewConsoleLog to define an additional method for console.log.
    window.defineNewConsoleLog(self, _sendMessage);

    // SUPPORTING FUNCTIONS

    // Returns a WRITETOLOG command object.
    function _createWriteToLogCmd( ) {

        // Get the WRITETOLOG command specifically.
        var CmdType = _nex.commands.WriteToLog;

        // Create a new instance of that command.
        var cmdObj = new CmdType("");

        // Return that command object.
        return cmdObj;
    }

    // Sends a WRITETOLOG command object.
    function _sendMessage(message) {
        // Tag as coming from the console so we can tell it apart from other things in the log.
        var clientIndicator = "[console.log] ";

        // Set the message in the command object.
        _writeToLogCmdObj.setMessage(clientIndicator + message);

        // connection.send(cmd)
        _sendFunction(_writeToLogCmdObj);
    }

}

