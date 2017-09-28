function OrderManager() {

    var self = this;
    var _orderId = null;
    var _orderNumber = null;
    var _futureOrder = false;
    var _fulfillmentTime = null;
    var _ordersPlaced = [];
    var _gratuity = 0;
    var _gratuityPercentage = 0;
    var _gratuityAccepted = false;
    var _acceptingCash = false;
    var _cashAccetped = false;
    var _couponAccepted = false;
    var _selectedReservation = null;
    var _specials = null;
    var _orderReviewMenuId = null;
    var _deliveryFee = 0;
    var _forceDicoPrompt = false;

    // Any custom or customer specific data on the order.
    self.customData = {};

    self.receiptFormatType = {
        "PAPER": "0",
        "EMAIL": "1",
        "NONE": "2"
    };

    self.currentOrder = null;

    self.startOrder = function (creditCard) {

        self.currentOrder = new Order();
        self.currentOrder.creditCard = creditCard || null;

        self._orderId = null;
        self._orderNumber = null;

        self._ordersPlaced = []; // FUTURE USE

        self._gratuity = 0;
        self._gratuityPercentage = 0;
        self._gratuityAccepted = false;
        self._acceptingCash = false;
        self._cashAccetped = false;
        self._couponAccepted = false;
        self._orderReviewMenuId = null;
        self._selectedReservation = null; // FUTURE USE
        self._specials = null;
    };

    self.resetCurrentOrder = function () {
        self.currentOrder = new Order();
    };

    self.NEXTEPOrderType = {
        DineIn: "0",
        TakeOut: "1", //aka: pickup
        Delivery: "2",
        DriveThru: "3"
    };

    self.OrderOriginType = {
        Kiosk: "0",
        NextepMobile: "3",
        Pos: "5",
        DriveThru: "6",
        SelfCheckout: "7"
    };

}