function Order() {
    var self = this;

    self.creditCard = null;
    self.ITEM = [];
    self.totals = new TotalsModel();
    self.togo = true;
    self.alcoholEnabled = true;
    self.ageVerified = false;
    self.smsNumber = "";
    self.lookupData = null;
    self.remainingBalance = 0.0;
    self.roundUpCharitySelected = false;

    self.customer = {
        email: "",
        firstname: "",
        lastname: "",
        guestaccountid: "",
        name: "",
        pagernumber:""
    };

    self.receiptFormat = _nex.orderManager.receiptFormatType.PAPER;
    self.ordernumber = "";
    self.tenderResults = [];
    self.origin = "";
    self.ordertype = "";
    self.orderid = "";
    self.ordernumber = "";

    self.togoSet = false;


    self.currentItem = function () {
        var current = null;
        if ((self.ITEM !== null) &&
            (self.ITEM.length > 0)) {
            current = self.ITEM[self.ITEM.length - 1];
        }

        return current;
    };

    self.update = function (orderData) {

        if (!orderData.hasOwnProperty("ITEM")) {
            self.ITEM = [];
        }
        else {
            self.ITEM = orderData.ITEM;
        }

        if (!orderData.hasOwnProperty("CUSTOMER")) {
            self.customer = {};
        }
        else {
            self.customer = orderData.CUSTOMER[0];
            console.log("Updating customer info: ", self.customer);
        }

        self.checkAlcoholLimit();

        // update order totals
        if (orderData.subtotal !== undefined) {
            self.totals.subtotal(currency.formatAsDollars(Number(orderData.subtotal), false));
            self.totals.salestax(currency.formatAsDollars(0, false));
            self.totals.salestax2(currency.formatAsDollars(0, false));
            self.totals.deliveryfee(currency.formatAsDollars(0, false));
            self.totals.roundupcharity(currency.formatAsDollars(0, false));
            self.totals.amountdue(currency.formatAsDollars(0, false));
            self.totals.discount(currency.formatAsDollars(0, false));
            self.totals.remainingbalance(currency.formatAsDollars(Number(orderData.remainingbalance), false));
        }

        if (orderData.hasOwnProperty("COMPLETEORDER")) {
            self.origin = orderData.COMPLETEORDER.origin;
            self.ordertype = orderData.COMPLETEORDER.ordertype;
            self.orderid = orderData.COMPLETEORDER.orderid;
            self.ordernumber = orderData.COMPLETEORDER.ordernumber;
        }
    };

    self.currentItemIndex = function () {
        var index = -1;

        if ((self.ITEM !== null) &&
            (self.ITEM.length > 0)) {
            index = (self.ITEM.length - 1);
        }

        return index;
    };

    self.checkAlcoholLimit = function () {
        var alcoholCount = self.alcoholCount();

        self.alcoholEnabled = (alcoholCount < _nex.assets.theme.alcoholLimit);
    };

    self.alcoholCount = function () {
        var alcoholCount = 0;

        for (var i = 0; i < self.ITEM.length; i++) {
            if (self.ITEM[i].alcoholflag.toLowerCase() === "true") {
                alcoholCount += Number(self.ITEM[i].quantity);
            }
        }

        return alcoholCount;
    };

    self.origin = _nex.assets.theme.kiosk.origin;
    self.ordertype = null;
}