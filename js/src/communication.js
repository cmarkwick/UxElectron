/*
 * communication.js
 * handles the communication to the C# 
 * connectObj is the C# code that is accessible from javascript
*/
function Communication (paramObj) {
    var self = this;

    self.connection = paramObj.connection || null;
    self.commandFactory = paramObj.commandFactory || null;
    self.device = paramObj.device || null;

    self.subscribers = [];  // array of objects { cmdName : "", callback : [function] }

    // call close to handle if the page was reloaded
    self.connection.close();

    self.debugEnabled = true;
    self.debug = function () {
        if (self.debugEnabled) {
            console.debug(arguments);
        }
    };

    // delegate 
    self.createListener = function (commandName, callback, autoRemove) {
        return {
            cmdName: commandName,
            callback: callback,
            autoRemove: autoRemove || false
        };
    };

    // methods
    self.connect = function () {
        if (self.connection !== null) {
            self.connection.connect();
        }
    };

    self.close = function () {
        if (self.connection !== null) {
            self.connection.close();
        }
    };


    self.send = function (cmd, callback, responseCmdName) {
        if (cmd.name !== 'WRITETOLOG') {
            self.debug("communication - send message " + cmd.name, cmd);
         }
        var obj = cmd.write();
        obj[cmd.name] = $.extend(true, {pcid : self.device.computerName()}, obj[cmd.name]); // the pcid needs to before other properties so the JSON to XML conversion works as expected
        var msg = JSON.stringify(obj[cmd.name]);

        responseCmdName = responseCmdName || "";
        if (responseCmdName.length > 0) {
            //console.debug("communication - listening for " + responseCmdName);
            self.addListener(self.createListener(responseCmdName, callback, true));
        }

        if (self.connection !== null) {
            self.connection.send(cmd.name, msg);
        }
    };

    self.receive = function (data) {
        // For debugging purposes, record all messages received.
        self.debug("communication - received message " +data.substring(0, 25), { "data": data });

        var cmdJson = JSON.parse(data);
        //var cmd = self.commandFactory.isSupported(cmdJson);
        if (self.commandFactory.isCommandSupport(cmdJson)) {

            cmdJson[cmdJson.name].responseReceived = "true"; // success needs to be true since the NEXTEP Mobile service can be return false; the TM will not return true or false so assume true

            // notify all listening functions
            // make a copy of the subscribers array since some elements may be removed
            var subscribersToRemove = [];
            for (var i = 0; i < self.subscribers.length; i++) {
                if (self.subscribers[i].cmdName === cmdJson.name) {
                        
                    if (self.subscribers[i].autoRemove) {
                        self.debug("communication - calling callback " + cmdJson.name);
                        self.subscribers[i].callback(cmdJson[cmdJson.name]);
                        subscribersToRemove.push(self.subscribers[i]);
                    }
                    else {
                        self.debug("communication - calling callback " + cmdJson.name);
                        self.subscribers[i].callback(cmdJson.name, cmdJson[cmdJson.name]);
                    }
                }
            }

            for (var j = 0; j < subscribersToRemove.length; j++) {
                self.removeListener(subscribersToRemove[j]);
            }

            subscribersToRemove = null;
        }
    };

    self.addListener = function(listener) {

        if ((typeof listener.cmdName === "string") &&
            (typeof listener.callback === "function")) {
            self.subscribers.push(listener);
        }        
    };
     
    self.removeListener = function (listener) {

        for (var i = self.subscribers.length - 1; i >= 0; i--) {
            if (self.subscribers[i] === listener) {
                self.subscribers.splice(i,1);
            }
        }
    };
}