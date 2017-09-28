// Constructor. Returns an object that represents a collection of card data.
// This data is usually parsed from track data with the CardParser.
function CardData() {
    var self = this;

    // Clear method.
    self.clear = function () {
        self.tenderType = paymentConstants.TENDER_CREDIT;
        self.tenderTypeCode = "1";
        self.cardData = null;
        self.cardNumber = "";
        self.expMonth = "";
        self.expYear = "";
        self.amount = 0.00;
        self.cardType = "";
        self.track1 = "";
        self.track2 = "";
        self.userData = "";
        self.isTaxExempt = false;
        self.cardId = "";
        self.billingStreet = "";
        self.billingZip = "";
        self.firstName = "";
        self.lastName = "";

        // Added for things like Loyalty where there is a card name based on the card type.
        self.cardName = "";
    };

    // Call the clear method initially to initialize variables.
    self.clear();

    // Returns true if the card type is loyalty.
    self.isLoyalty = function() {
        // For loyalty cards, if it can't find the card type, the card parser sets it to LOYALTY.
        return self.cardType === "LOYALTY";
    };

    // Returns the full name on the card.
    self.fullName = function () {
        // Used for previous order lookup, for example.
        return self.firstName + " " + self.lastName;
    };
}