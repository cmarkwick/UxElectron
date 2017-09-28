// Constructor.
function CardParser(theme) {
    var self = this;

    // CardParser depends on the theme for certain things. This dependency is passed in.
    self._theme = theme;

    // Keep a list of all the credit cards accepted.
    self._creditCards = [];

    // Keep track of whether or not this card type is accepted.
    self._isCardTypeAccepted = false;

    // Store the card data parsed off the card.
    self.cardData = {};

    // Store any errors reading the card data.
    self.lastErrorMessage = "";

    // PUBLIC METHODS

    // CardParser parses the track data and returns a CardData object. 
    // Returns null if there was a problem with the card data.
    // Optionally pass in a successCallback and an errorCallback to use instead of
    // returning the card data.
    self.parse = function (track1, track2, successCallback, errorCallback) {

        // Default the result to null.
        var result = null;

        // Initialize local variables for the card parser.
        self._initialize(self._theme);
        self.cardData = new CardData();

        // Try and parse the data.
        var parseResult = self._parseCard(track1, track2);

        // If it succeeded.
        if (parseResult === true) {
            // Set the result.
            result = self.cardData;

            // If a successcallback was specified, call it.
            if (successCallback) {
                successCallback(result);
            }
        } else {
            // If an error callback was specified, call it.
            if (errorCallback) {
                // Pass along the message of what went wrong so it can be logged.
                errorCallback(self.lastErrorMessage);
            }
        }

        // If no callbacks were specified, simply return the result.
        if ((!successCallback) && (!errorCallback)) {
            // Return the result.
            return result;
        }
    };

    // PRIVATE/HELPER METHODS

    // Parse all the data out of track1 and track2.
    // Returns true if the card data was parsed, and the card type is accepted.
    // Returns false if there was some type of issue.
    self._parseCard = function (track1, track2) {
        // This logic is mostly copied from the Flash.
        var result = false;

        // Track 1 might be empty.
        if (!track1) {
            track1 = "";
        }

        // Reader returns an error
        if ((track1 === "%E?") || (track2 === ";E?")) {
            self.lastErrorMessage = "ERROR IN TRACK 1 OR TRACK 2";
            return result;
        }

        // track 1 and 2 do not start and end with the proper sentinels
        if ((track1.indexOf("%") !== 0) && (track1.indexOf("?") !== (track1.length - 1))) {
            self.lastErrorMessage = "TRACK1: CARD READ ERROR WITH SENTINELS";
            return result;
        }

        if ((track2.indexOf(";") !== 0) && (track2.indexOf("?") !== (track2.length - 1))) {
            self.lastErrorMessage = "TRACK2: CARD READ ERROR WITH SENTINELS";
            return result;
        }

        // validate the length of track 1 and 2
        if ((track1.length !== 0) && (track1.length > 79)) {
            self.lastErrorMessage = "TRACK1 OR TRACK2: length is incorrect";
            return result;
        }

        //if ((track1.length > 0) && ((track2 === null) || (track2.length === 0)))
        //{
        // cards that are encode with just track1 are to be ignore; credit cards will always have two tracks
        // the only Track1 only cards that exist are the old NEXTEP Admin Cards; these should already be trained
        //return "IGNORE";
        //}
        //
        //if(((track2 === null) || (track2.length === 0) || (track2.length > 40)))
        //{
        //Logger.Publish(Logger.INFO, "Track 2 - The length of the track data is either too short or too long; ");
        //return CreditCard.RESULT_ERROR;
        //}

        // process credit card
        var numdone = false;
        var lastdone = false;
        var firstdone = false;
        var offset = 2;
        var isCreditCard = false;
        var character = '';

        self.cardData.cardNumber = "";
        self.cardData.lastName = "";
        self.cardData.firstName = "";

        var i;

        isCreditCard = (track1.substr(1, 1) === "B");

        for (i = offset; i <= track1.length && !numdone; i++) {
            character = track1.substr(i, 1);
            if (character === "^") {
                numdone = true;
                offset++;
            } else if (!numdone) {
                self.cardData.cardNumber += character;
            }
        }

        for (i = (offset + self.cardData.cardNumber.length) ; i <= track1.length && !lastdone; i++) {
            character = track1.substr(i, 1);
            if (character === "/") {
                lastdone = true;
                offset++;
            }
            else if (character === "^") {
                lastdone = true;
                firstdone = true;
                offset++;
            }
            else if (!lastdone) {
                self.cardData.lastName += character;
            }
        }

        for (i = (4 + self.cardData.cardNumber.length + self.cardData.lastName.length) ; i <= track1.length && !firstdone; i++) {
            character = track1.substr(i, 1);
            if (character === "^") {
                firstdone = true;
                offset++;
            } else if (!firstdone) {
                self.cardData.firstName += character;
            }
        }

        var index = offset + self.cardData.cardNumber.length + self.cardData.lastName.length + self.cardData.firstName.length;
        self.cardData.lastName = self.cardData.lastName.trim();
        self.cardData.firstName = self.cardData.firstName.trim();
        self.cardData.expYear = track1.substr(index, 2);
        self.cardData.expMonth = track1.substr(index + 2, 2);

        // verify that the Card Number and Expiration are parsed from track1 successfully.

        if ((isCreditCard) &&
            (track1.length > 0) &&
            ((self.cardData.cardNumber.length === 0) ||
            (self.cardData.expYear.length === 0) ||
            (self.cardData.expMonth.length === 0))) {
            self.lastErrorMessage = "Card Number or expiration parsing failure";
            return result;
        }
        else if ((!isCreditCard) &&
                    ((track2.length > 0) || ((track1.length > 0) && (track2.length === 0)))) {
            // loyality card
            self.cardData.lastName = "";
            self.cardData.firstName = "";
            self.cardData.expYear = "";
            self.cardData.expMonth = "";
            self.cardData.cardNumber = (track1.length > 0) ? track1.substring(1, track1.length - 1) : track2.substring(1, track2.length); // remove the leading (";") 
            if (self.cardData.cardNumber.indexOf("?") !== -1) {
                self.cardData.cardNumber = self.cardData.cardNumber.substr(0, self.cardData.cardNumber.indexOf("?")); // remove the trailing ("?") chacaters 
            }

            // Try to set the card type by the card id.
            self.cardData.cardType = self._getCardTypeByCardID(self.cardData.cardNumber);
            if (self.cardData.cardType === null) {
                self.cardData.cardType = "LOYALTY";
            }

            // If it is accepted, set the result to true; otherwise, set it to error.
            self._isCardTypeAccepted = self._isCardTypeAcceptedByCardType(self.cardData.cardType);

            // If it is accepted
            if (self._isCardTypeAccepted) {
                result = true;
            }
            else {
                self.lastErrorMessage = "Card type is not accepted";
                return result;
            }
        }
        else
        {
            // Set the card type based on the card number.
            self.cardData.cardType = self._getCardType(self.cardData.cardNumber);

            // Set whether or not it is accepted.
            self._isCardTypeAccepted = self._isCardTypeAcceptedByCardType(self.cardData.cardType);

            // If it is accepted, set the result to true; otherwise, set it to error.
            if (self._isCardTypeAccepted) {
                result = true;
            } else {
                self.lastErrorMessage = "Card type is not accepted";
                return result;
            }
        }
        // Set track1 and track2.
        self.cardData.track1 = track1;
        self.cardData.track2 = track2;
        return result;
    };


    // Initialize local variables.
    self._initialize = function (theme) {
        // Lazy initialize a local array of the credit cards.
        self._initCardArray(theme);
    };

    // Returns the card type. First checks the CREDITCARD list in system.
    // If any of those have the 'hascardid' attribute set, it will try and read get the card type from there;
    // otherwise, it will check the digits on the card.
    self._getCardType = function (cardnumber) {
        var firstDigit = Number(cardnumber.substr(0, 1));
        var secondDigit = Number(cardnumber.substr(1, 1));

        // Try to get the card type by its id.
        var cardType = self._getCardTypeByCardID(cardnumber);
        if (cardType !== null) {
            return cardType;
        }
        // Try to get the card type by the card number digits.
        else if (firstDigit === 1) {
            return "JCB";
        }
        else if ( firstDigit === 2 )
        {
            if ( cardnumber.length >= 6 )
            {
                if ( !isNaN( cardnumber.substring( 0, 6 ) ) )
                {
                    var bin = parseInt( cardnumber.substring( 0, 6 ) );
                    if ( !isNaN( bin ) )
                    {
                        if ( bin >= 222100 && bin <= 272099 )
                        {
                            return "MASTERCARD";
                        }
                    }
                }
            }
            return "JCB";
        }
        else if (firstDigit === 3) {
            if (cardnumber.length === 16) {
                return "JCB";
            }
            if (secondDigit === 6) {
                return "MASTERCARD";
            }
            else if ((secondDigit === 4) || (secondDigit === 7)) {
                return "AMEX";
            }
            else {
                return "DINERS";
            }
        }
        else if (firstDigit === 4) {
            return "VISA";
        }
        else if (firstDigit === 5 && secondDigit === 6) {
            return ""; // Bankcard
        }
        else if (firstDigit === 5 && secondDigit >= 1 && secondDigit <= 5) {
            return "MASTERCARD";
        }
        else if (cardnumber.indexOf("6011") === 0 ||
                cardnumber.indexOf("622") === 0 ||
                cardnumber.indexOf("64") === 0 ||
                cardnumber.indexOf("65") === 0) {
            return "DISCOVER";
        }
        else if (cardnumber.indexOf("564182") === 0 ||
            cardnumber.indexOf("633110") === 0 ||
            cardnumber.indexOf("6333") === 0 ||
            cardnumber.indexOf("6759") === 0) {
            return "MAESTRO"; //used to be SWITCH card types
        }
        else if (cardnumber.indexOf("5018") === 0 ||
            cardnumber.indexOf("5020") === 0 ||
            cardnumber.indexOf("5038") === 0 ||
            cardnumber.indexOf("6304") === 0 ||
            cardnumber.indexOf("6759") === 0 ||
            cardnumber.indexOf("6761") === 0 ||
            cardnumber.indexOf("6762") === 0 ||
            cardnumber.indexOf("6763") === 0 ||
            cardnumber.indexOf("0604") === 0) {
            return "MAESTRO";//a UK company
        }
        else if (firstDigit === 6) {
            return "DISCOVER";
        }
        else if (firstDigit === 5) {
            return "MASTERCARD";
        }
        else {
            return null;
        }
        /*
        else if(firstDigit === 5) 
        {
            if (secondDigit === 6) 
            {
                return ""; // Bankcard
            }
            else 
            {
                return "MASTERCARD";
            }
        }
        else if (firstDigit === 6)
        {
            return "DISCOVER";
        } 
        else
        {
            return null;
        }
        */
    };

    // Initialize the card array variable with a list of credit cards that are accepted.
    self._initCardArray = function (theme) {
        // Guard against bad parameters.
        if (!theme) {
            console.log("CardParser._initCardArray: Missing required parameter theme.");
            return;
        }
        if (!theme.system) {
            console.log("CardParser._initCardArray: Missing required parameter theme.system");
            return;
        }
        // Initialize the array if it hasn't been already.
        if (self._creditCards.length === 0) {
            if (theme.system.CREDITCARD) {
                for (var index = 0; index < theme.system.CREDITCARD.length; index++) {
                    var card = theme.system.CREDITCARD[index];
                    if (card.accept === "true") {
                        self._creditCards.push(card);
                    }
                }
            }
        }
    };

    // Returns the card type by the code attribute if the 'hascardid' attribute is set;
    // otherwise, null.
    self._getCardTypeByCardID = function (cardNumber) {
        var cardType = null;
        try {
            // Loop through the credit cards array.
            for (var i = 0; i < self._creditCards.length && cardType === null; i++) {
                if ((self._creditCards[i].hascardid.toString().toLowerCase() === "true") && (cardNumber.indexOf(self._creditCards[i].cardid) === 0)) {
                    cardType = self._creditCards[i].code;
                }
            }
        }
        catch (e) {
            // This can happen if hascardid attribute is missing. 
        }

        return cardType;
    };

    // Returns true if the 'accept' attribute is set to true.
    self._isCardTypeAcceptedByCardType = function (cardType) {
        //find the card if it is accepted
        for (var i = 0; i < self._creditCards.length; i++) {
            var card = self._creditCards[i];
            if (card.accept === "true" && card.code === cardType) {
                return true;
            }
        }
        return false;
    };

}
