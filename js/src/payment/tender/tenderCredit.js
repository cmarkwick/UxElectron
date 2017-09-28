// Constructor.
function TenderCredit(amount) {
    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(this);

    // Copy a reference to the object instance.
    var self = this;
    self._tenderType = paymentConstants.TENDER_CREDIT;
    self._tenderTypeCode = "1"; // credit is 1 in the Flash
    
    // Get the amount from the parameter if it is valid.
    self._amount = 0.00;
    if (typeof amount === "number") {
        if (amount && amount > 0.00) {
            self._amount = amount;
        }
    }

    // Keep track of the data on the card.
    self.cardData = {};

    // Credit is always a final tender
    self.isFinalTender = function () {
        // return (_tenderXml.@final.toString().toLowerCase() == "true");
        return true;
    };

    // Parse card data given track1 and track2.
    self.update = function (track1, track2) {
        // Initialize the card parser.
        var cardParser = new CardParser(_nex.assets.theme);

        // Parse the data out of track1 and track2.
        var cardData = cardParser.parse(track1, track2);
            
        // Set the card data to whatever comes back. This will be null if there is an issue in track1 or track2.
        self.cardData = cardData;
    };

    // If card data is available, use this to initialize the cardData property.
    // TODO2: Test this!
    self.setCardData = function (cardData) {
        self.cardData = new CardData();

        self.cardData.cardNumber = cardData.CardNumber;
        self.cardData.expMonth = cardData.ExpMonth;
        self.cardData.expYear = cardData.ExpYear;
        self.cardData.cardType = cardData.CardType;
        self.cardData.firstName = cardData.FirstName;
        self.cardData.lastName = cardData.LastName;
        self.cardData.track1 = cardData.Track1;
        self.cardData.track2 = cardData.Track2;
        self.cardData.userData = cardData.UserData;
        self.cardData.userDataLength = self.cardData.userData.length; 
    };

    
    self._write = function (tender) {
        // The _write method is called by baseTenders write method.

        tender.CREDITCARD = {};
        //tender.CREDITCARD.TotalAmount = self._amount;

        tender.CREDITCARD.CardNum = self.cardData.cardNumber;
        tender.CREDITCARD.CardExpMonth = self.cardData.expMonth;
        tender.CREDITCARD.CardExpYear = self.cardData.expYear;
       
        tender.CREDITCARD.CardType = self.cardData.cardType;
        //tender.CREDITCARD.PreAuth = "false"; // always false for UX regardless of settings (hard coded server side in the credit tender)
        tender.CREDITCARD.Track1 = (self.cardData.track1 != null) ? self.cardData.track1 : "";
        tender.CREDITCARD.Track2 = (self.cardData.track2 != null) ? self.cardData.track2 : "";
        tender.CREDITCARD.UserData = (self.cardData.userData != null) ? self.cardData.userData : "";
        tender.CREDITCARD.TaxExempt = self.cardData.isTaxExempt;
        tender.CREDITCARD.cardid = self.cardData.cardId;;
        tender.CREDITCARD.billingstreet = self.cardData.billingStreet;
        tender.CREDITCARD.billingzip = self.cardData.billingZip;
        

        if (self.cardData.firstName.length > 0) {
            tender.CREDITCARD.NameOnCard = self.cardData.firstName + " " + self.cardData.lastName;
        }
        else {
            tender.CREDITCARD.NameOnCard = self.cardData.lastName;
        }
        return tender;
    };
}
TenderCredit.prototype = Object.create(_BaseTender.prototype);
