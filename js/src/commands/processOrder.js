// Note: A final tender object can be passed in along with process order, but is not required.
_nex.commands.ProcessOrder = function (order, finalTenderObject) {

    // Try and get any data from the pagerpad and namepad if applicable.
    try {
        if (_nex.keyboard.pagerpad.data) {
            _nex.orderManager.currentOrder.customer.pagernumber = _nex.keyboard.pagerpad.data;
        }
        if (_nex.keyboard.namepad.data) {
            _nex.orderManager.currentOrder.customer.name = _nex.keyboard.namepad.data;
            if (_nex.orderManager.currentOrder.customer.name.length > 0) {
                var res = _nex.orderManager.currentOrder.customer.name.split(" ");
                if (res.length > 0) {
                    _nex.orderManager.currentOrder.customer.firstname = res[0];
                    if (res.length > 1) {
                        _nex.orderManager.currentOrder.customer.lastname = res[1];
                    }
                }
            }
        }
    }
    catch (err)
    {
        console.log("Error in ProcessOrder trying to set the pager number" + err.message);
    }
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "PROCESSORDER";
    self.customerName = _nex.orderManager.currentOrder.customer.name;
    self.customerPagerNumber = _nex.orderManager.currentOrder.customer.pagernumber;
    self.customerFirstName = _nex.orderManager.currentOrder.customer.firstname;
    self.customerLastName = _nex.orderManager.currentOrder.customer.lastname;
    // Set the smsNumber for previous order lookup in the future.
    if (order && order.smsNumber) {
        self.smsNumber = order.smsNumber;
    } else {
        self.smsNumber = "";
    }





    // Try to extract out any final tender data if there is any.
    if (finalTenderObject) {
        if (!finalTenderObject.write) {
            console.log("ERROR: Could not find a write method on the final tender object given!");
        } else {
            var tenderData = finalTenderObject.write();
            if (tenderData) {
                self.tenderSpecific = tenderData;
            }
        }

    }

    // If we were unable to extract the data, just set it to empty string.
    if (!self.tenderSpecific) {
        self.tenderSpecific = "";
    }
    self.nutritionData = {};
    if (_nex.nutritionData) {
        self.nutritionData = _nex.nutritionData;
    }

    // Write the message.
    self.write = function () {

        ///*jshint -W087 */
        //debugger;
        var msg = self.msgHeader();
        msg[self.name] = {
            "smsnumber": self.smsNumber,
            "ordertype": _nex.orderManager.currentOrder.ordertype,
            "FINALTENDER": self.tenderSpecific,
            "NUTRITIONINFO": self.nutritionData,
            "CUSTOMER": {
                "email": self.customerEmail,
                "customerName": self.customerName,
                "customerPagerNumber": self.customerPagerNumber,
                "customerFirstName": self.customerFirstName,
                "customerLastName": self.customerLastName
            }
        };


        return msg;
    };
};
_nex.commands.ProcessOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype);