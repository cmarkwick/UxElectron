// TenderLoyalty relies on the loyalty inquiry to update its data.
function TenderLoyalty() {
    var self = this;

    // This is key to inheriting all the properties on the base tender object.
    _BaseTender.call(self);

    // Private properties.
    self._tenderType = paymentConstants.TENDER_LOYALTY;
    self._tenderTypeCode = "5";
    self._cardData = null;
    self._offerPercent = "percent";
    self._offerValue = "value";
    self._hasOffers = false;
    self._noOffersReturnedFromInquiry = false;
    self._availableOffers = null;
    self._matchedOffers = [];

    //objects send back to TM
    self.LOYALTYRESPONSE = {};

    // Call this method to load the card data found on the card.
    self.setCardData = function (cardData) {
        self._cardData = cardData;
    };

    // Check if this is a valid account.
    self.isValidAccount = function () {
        var result = false;
        if (self.LOYALTYRESPONSE) {
            // If it has a vallid number, it is a valid account.
            if (self.LOYALTYRESPONSE.number) {
                result = true;
            }
        }
        return result;
    };

    // Get the remaining balance on the card.
    self.remainingBalance = function () {
        return self.LOYALTYRESPONSE.value;
    };

    // Has non-zero balance.
    self.hasBalance = function () {
        var result = false;
        if (self.LOYALTYRESPONSE.value > 0.0) {
            result = true;
        }
        return result;
    };

    // Returns true if there are multiple values.
    self.hasMultipleValues = function () {
        var result = false;
        if (self.LOYALTYRESPONSE.multiplevalues) {
            result = true;
        }
        return result;
    };

    // Returns true if it has already been charged.
    self.isCharged = function () {
        return self.LOYALTYRESPONSE.ischarged;
    };

    // Return the amount on the loyalty tender object.
    self.getValue = function () {
        return self.LOYALTYRESPONSE.value;
    };

    // Set the amount on the tender.
    self.setValue = function (value) {
        self.LOYALTYRESPONSE.value = value;
    };

    self.hideProcessingPopup = function (callback) {
        _nex.assets.popupManager.hidePopup(_nex.assets.popupManager.processingPopup, callback);
    };

    // Call this method to update the loyalty tender with what comes back from loyaltyInquiry.
    self.update = function (response) {
        var data = {};
        data.ischarged = response.ischarged === "true" ? true : false;
        data.isoffline = response.isoffline === "true" ? true : false;
        data.name = response.name ? response.name : "";
        data.number = response.number ? response.number : "";
        //make consistent with POS. CardNum is an attribute of the LOYALTY ELEMENT XML
        debugger
        data.CardNum = response.number ? response.number : "";
        data.responseReceived = response.responseReceived ? response.responseReceived : "";
        data.status = response.status ? response.status : "";
        data.usedphone = response.usedphone ? response.usedphone : "";
        data.value = response.value ? response.value : "";
        data.totalamount = response.value ? response.value : "";
        data.multiplevalues = response.multiplevalues === "true" ? true : false;
        data.DISCOUNTS = {};
        if (response.hasOwnProperty("DISCOUNTS") && response.DISCOUNTS.hasOwnProperty("DISCOUNT")) {
            data.DISCOUNTS = response.DISCOUNTS;
            console.log("UPDATING DISCOUNT ", data.discount);
        }
        data.OFFERS = { OFFER: [] };
        self._hasOffers = false;
        self._noOffersReturnedFromInquiry = false;
        if (response.hasOwnProperty("OFFERS") && response.OFFERS.hasOwnProperty("OFFER")) {
            self._matchedOffers = [];
            self._hasOffers = true;
            self._availableOffers = response.OFFERS.OFFER;
            self._populateOffers(response.OFFERS.OFFER);
            data.OFFERS.OFFER = self._matchedOffers;

        } else {
            self._noOffersReturnedFromInquiry = true;
        }

        if (self._hasOffers) data.value = self._calculateOfferValue();

        // Put the data on the tender object.
        self.LOYALTYRESPONSE = data;
    };

    self._calculateOfferValue = function () {
        var offerAmount = 0.00;
        self._matchedOffers.forEach(function (offer) {
            if (offer.type === self._offerPercent) {
                offerAmount += self._calculatePercentOff(offer.price, offer.value);
            } else if (offer.type === self._offervalue) {
                offerAmount += self._calculateAmountOff(offer.price, offer.value);
            } else {
                console.log("Unknown Offer Type ", offer.type);
            }
        });
        return offerAmount;
    }

    self._calculatePercentOff = function (price, amount) {
        var percentage = Number(amount);

        //50% = 50 not 0.5, 100% = 1
        if (percentage > 1) {
            percentage = NumericUtilities.CorrectMathError(percentage / 100);
        }
        return percentage * price;

    };

    self._calculateAmountOff = function(price, amount) {
        var offerAmount = Number(amount);

        return price - offerAmount;
    };

    // The _write method is called by baseTenders write method.
    self._write = function (tender) {
        tender.LOYALTY = {
            LOYALTYRESPONSE: self.LOYALTYRESPONSE
        };
        return tender;
    };

    self._offersPopup = function (routeTender, offers) {
        var popup = $.extend(true, {}, _nex.assets.popupManager.offersPopup);
        if (!popup.hasOwnProperty("message")) {
            console.log("Offers Popup Not Found", "");
            return;
        }

        if (self._hasOffers) {
            $("#popup-offers").on("show.bs.modal", function (e) { self._showOffers(e, offers) });
            popup.message = _nex.assets.theme.getTextAttribute("OFFERS", "hasoffersmessage", "Congratulations you have offers!");
        } else {
            popup.message = _nex.assets.theme.getTextAttribute("OFFERS", "hasnooffersmessage", "Sorry no offers found!");
        }

        popup.buttons[0].clickEvent = "";
        popup.buttons[0].text = _nex.assets.theme.getTextAttribute("ORDER", "ok", "OK");
        _nex.assets.popupManager.showPopup(popup, routeTender);
    };

    self._showOffers = function (popup, offers) {
        var $target = $(popup.target);
        var $offer = $target.find("#offer1");
        var $noOffer = $target.find("#noOffer");
        var matched = false;

        $noOffer.hide();
        $offer.nextAll().remove();

        if (!Array.isArray(offers)) offers = [offers];

        if (Array.isArray(offers)) {
            offers.forEach(function (offer) {
                matched = self._matchedOffers;
                //matched = self._matchOffersWithCurrentOrder(offer);
                if (self._matchedOffers.indexOf(offer) !== -1) {
                    $target.find("#offer1:last").text(offer.name);
                    $offer.clone().insertAfter("#offer1:last");
                }
            });
            $offer.last().remove();
        } else {
            if (self._matchedOffers.length === 0) {
                $noOffer.show();
            }
        }
    }

    self._populateOffers = function (offers) {

        if (!Array.isArray(offers)) offers = [offers];
        if (Array.isArray(offers)) {
            offers.forEach(function (offer) {
                self._matchOffersWithCurrentOrder(offer);
            });
        }
    }


    self._matchOffersWithCurrentOrder = function (offer) {
        var items = _nex.orderManager.currentOrder.ITEM;
        var itemsIsArray = Array.isArray(items);
        var matched = {};
        if (itemsIsArray) {
            matched = $.grep(items, function (i) { return i.posid === offer.posid; });
            if (matched.length > 0) {
                offer.price = matched[0].price;
                offer.quantity = matched[0].quantity;
                self._matchedOffers.push(offer);
            }
        }

        return matched.length > 0;
    }
}
TenderLoyalty.prototype = Object.create(_BaseTender.prototype);