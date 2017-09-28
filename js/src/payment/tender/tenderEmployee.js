function TenderEmployee() {
    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(this);

    var self = this;
    self._tenderType = paymentConstants.TENDER_EMPLOYEE;
    self._tenderTypeCode = "7";
    self._employeeNumber = "";
    self._employeePIN = "";
    self._employeeName = "";

    self.updateNumber = function (number) {
        self._employeeNumber = number;
    };

    self.updatePin = function (pin) {
        self._employeePIN = pin;
    };

    self.getEmployeeNumber = function () {
        return self._employeeNumber;
    };

    self.getEmployeePIN = function () {
        return self._employeePIN;
    };

    self._write = function (tender) {
        // The _write method is called by baseTenders write method.

        // Where do I find the employee data in the card??
        tender.EMPLOYEE = {};
        tender.EMPLOYEE.number = self._employeeNumber;
        tender.EMPLOYEE.userdata = self._employeePIN;
        tender.EMPLOYEE.name = self._employeeName;

        return tender;
    };
}
TenderEmployee.prototype = Object.create(_BaseTender.prototype);
