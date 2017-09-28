_nex.commands.EmployeeSecurityCheck = function (pin, capability) {

    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "EMPLOYEESECURITYCHECK";
    self.pin = pin;
    self.capability = capability;
    self.capabilities =
    {
        "SwitchApplication": 23
    };

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "pin": self.pin,
            "capability": self.capabilities[self.capability]
        };

        return msg;
    };
};
_nex.commands.EmployeeSecurityCheck.prototype = Object.create(_nex.commands._BaseRequest.prototype);
