_nex.commands.EmployeeInquiry = function (employeeNumber, employeePin) {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "EMPLOYEEINQUIRY";
    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "employeenumber": employeeNumber,
            "userdata": employeePin
        };
        console.debug(msg);
        return msg;
    };
};
_nex.commands.EmployeeInquiry.prototype = Object.create(_nex.commands._BaseRequest.prototype);