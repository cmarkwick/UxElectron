    // Constructor. 
function PaymentButtons(paymentManager) {

    //
    // Guard against bad parameters
    //
    if (!paymentManager) {
        throw "ERROR IN PAYMENTBUTTONS! You must specify a paymentManager";
    }

    // Make self synonymous with this.
    var self = this;

    // Keep a reference to the payment manager to going to clips.
    self._paymentManager = paymentManager;

    // Keep track of the button elements.
    self._$cashButtonElement = null;
    self._$counterButtonElement = null;
    self._$couponButtonElement = null;
    self._$creditButtonElement = null;

    self._$debitButtonElement = null;
    self._$discountButtonElement = null;
    self._$employeeButtonElement = null;
    self._$loyaltyButtonElement = null;

    self._$genericTender1ButtonElement = null;
    self._$genericTender2ButtonElement = null;
    self._$genericTender3ButtonElement = null;
    self._$genericTender4ButtonElement = null;
    self._$genericTender5ButtonElement = null;
    self._$genericTender6ButtonElement = null;
    self._$genericTender7ButtonElement = null;
    self._$genericTender8ButtonElement = null;
    self._$genericTender9ButtonElement = null;
    self._$genericTender10ButtonElement = null;

	self._$gaIncliningBalanceTender1ButtonElement = null;
	self._$gaIncliningBalanceTender2ButtonElement = null;
	self._$gaIncliningBalanceTender3ButtonElement = null;
	self._$gaIncliningBalanceTender4ButtonElement = null;
	self._$gaIncliningBalanceTender5ButtonElement = null;
	self._$gaIncliningBalanceTender6ButtonElement = null;
	self._$gaIncliningBalanceTender7ButtonElement = null;
	self._$gaIncliningBalanceTender8ButtonElement = null;
	self._$gaIncliningBalanceTender9ButtonElement = null;
	self._$gaIncliningBalanceTender10ButtonElement = null;

    self._numButtons = 0;

    //
    // Public methods
    //

    // Wireup the buttons to JavaScript functions.
    self.initialize = function () {
        var tendersAvailable = _nex.assets.theme.tendersAvailable();
        console.debug("PaymentButtons: Initializing with buttons available: ");
        console.debug(tendersAvailable);
        var btext = null;

        self._$cashButtonElement = $("#" + paymentConstants.CASH_BUTTON_ID);
        self._$counterButtonElement = $("#" + paymentConstants.COUNTER_BUTTON_ID);
        self._$couponButtonElement = $("#" + paymentConstants.COUPON_BUTTON_ID);
        self._$creditButtonElement = $("#" + paymentConstants.CREDIT_BUTTON_ID);

        self._$debitButtonElement = $("#" + paymentConstants.DEBIT_BUTTON_ID);
        self._$discountButtonElement = $("#" + paymentConstants.DISCOUNT_BUTTON_ID);
        self._$employeeButtonElement = $("#" + paymentConstants.EMPLOYEE_BUTTON_ID);
        self._$loyaltyButtonElement = $("#" + paymentConstants.LOYALTY_BUTTON_ID);
        
        //up to 10 generic tender UIs could be there! unlikely we use more than a couple but need to check for all supported
		self._$genericTender1ButtonElement = $("#" + paymentConstants.GENERICTENDER1_BUTTON_ID);
		self._$genericTender2ButtonElement = $("#" + paymentConstants.GENERICTENDER2_BUTTON_ID);
		self._$genericTender3ButtonElement = $("#" + paymentConstants.GENERICTENDER3_BUTTON_ID);
		self._$genericTender4ButtonElement = $("#" + paymentConstants.GENERICTENDER4_BUTTON_ID);
		self._$genericTender5ButtonElement = $("#" + paymentConstants.GENERICTENDER5_BUTTON_ID);
		self._$genericTender6ButtonElement = $("#" + paymentConstants.GENERICTENDER6_BUTTON_ID);
		self._$genericTender7ButtonElement = $("#" + paymentConstants.GENERICTENDER7_BUTTON_ID);
		self._$genericTender8ButtonElement = $("#" + paymentConstants.GENERICTENDER8_BUTTON_ID);
		self._$genericTender9ButtonElement = $("#" + paymentConstants.GENERICTENDER9_BUTTON_ID);
		self._$genericTender10ButtonElement = $("#" + paymentConstants.GENERICTENDER10_BUTTON_ID);

		//up to 10 Guest Account Chargeable Local Inclining Balance Accounts could be there!
		self._$gaIncliningBalanceTender1ButtonElement = $("#" + paymentConstants.GAINCLININGBALANCETENDER1_BUTTON_ID);
		self._$gaIncliningBalanceTender2ButtonElement = $("#" + paymentConstants.GAINCLININGBALANCETENDER2_BUTTON_ID);
		self._$gaIncliningBalanceTender3ButtonElement = $("#" + paymentConstants.GAINCLININGBALANCETENDER3_BUTTON_ID);
		self._$gaIncliningBalanceTender4ButtonElement = $("#" + paymentConstants.GAINCLININGBALANCETENDER4_BUTTON_ID);
		self._$gaIncliningBalanceTender5ButtonElement = $("#" + paymentConstants.GAINCLININGBALANCETENDER5_BUTTON_ID);
		self._$gaIncliningBalanceTender6ButtonElement = $("#" + paymentConstants.GAINCLININGBALANCETENDER6_BUTTON_ID);
		self._$gaIncliningBalanceTender7ButtonElement = $("#" + paymentConstants.GAINCLININGBALANCETENDER7_BUTTON_ID);
		self._$gaIncliningBalanceTender8ButtonElement = $("#" + paymentConstants.GAINCLININGBALANCETENDER8_BUTTON_ID);
		self._$gaIncliningBalanceTender9ButtonElement = $("#" + paymentConstants.GAINCLININGBALANCETENDER9_BUTTON_ID);
		self._$gaIncliningBalanceTender10ButtonElement = $("#" + paymentConstants.GAINCLININGBALANCETENDER10_BUTTON_ID);


        var NOT_FOUND = -1; // jQuery returns -1 if it is not found in the array.
        self._numButtons = 0;

        // Note: If more than one click listener is needed, addeventlistener can be used.
        if (self._$cashButtonElement) {
            if ($.inArray('cash', tendersAvailable) === NOT_FOUND) {
                self._$cashButtonElement.hide();
                self._$cashButtonElement.parent().hide();
            } else {
                ++self._numButtons;
                self._setPaymentButtonText(self._$cashButtonElement, "cashtext", "CASH");
                self._$cashButtonElement.unbind("click");
                self._$cashButtonElement.click(function () {
                    self._cashButtonClicked(self._$cashButtonElement);
                });
            }
        }
        if (self._$counterButtonElement) {
            if ($.inArray('counter', tendersAvailable) === NOT_FOUND) {
                self._$counterButtonElement.hide();
                self._$counterButtonElement.parent().hide();
            } else {
                ++self._numButtons;
                self._setPaymentButtonText(self._$counterButtonElement, "countertext", "COUNTER");
                self._$counterButtonElement.unbind("click");
                self._$counterButtonElement.click(function () {
                    self._counterButtonClicked(self._$counterButtonElement);
                });
            }
        }
        if (self._$couponButtonElement) {
            if ($.inArray('coupon', tendersAvailable) === NOT_FOUND) {
                self._$couponButtonElement.hide();
                self._$couponButtonElement.parent().hide();
            } else {
                ++self._numButtons;
                self._setPaymentButtonText(self._$couponButtonElement, "coupontext", "COUPON");
                self._$couponButtonElement.unbind("click");
                self._$couponButtonElement.click(function () {
                    self._couponButtonClicked(self._$couponButtonElement);
                });
            }
        }
        if (self._$creditButtonElement) {
            if ($.inArray('credit', tendersAvailable) === NOT_FOUND) {
                self._$creditButtonElement.hide();
                self._$creditButtonElement.parent().hide();
            } else {
                ++self._numButtons;
                self._setPaymentButtonText(self._$creditButtonElement, "credittext", "CREDIT");
                self._$creditButtonElement.unbind("click");
                self._$creditButtonElement.click(function () {
                    self._creditButtonClicked(self._$creditButtonElement);
                });
            }
        }

        if (self._$debitButtonElement) {
            if ($.inArray('debit', tendersAvailable) === NOT_FOUND) {
                self._$debitButtonElement.hide();
                self._$debitButtonElement.parent().hide();
            } else {
                ++self._numButtons;
                self._setPaymentButtonText(self._$debitButtonElement, "debittext", "DEBIT");
                self._$debitButtonElement.unbind("click");
                self._$debitButtonElement.click(function () {
                    self._debitButtonClicked(self._$debitButtonElement);
                });
            }
        }
        if (self._$discountButtonElement) {
            if ($.inArray('discount', tendersAvailable) === NOT_FOUND) {
                self._$discountButtonElement.hide();
                self._$discountButtonElement.parent().hide();
            } else {
                ++self._numButtons;
                self._setPaymentButtonText(self._$discountButtonElement, "discounttext", "DISCOUNTS");
                self._$discountButtonElement.unbind("click");
                self._$discountButtonElement.click(function () {
                    self._discountButtonClicked(self._$discountButtonElement);
                });
            }
        }
        if (self._$employeeButtonElement) {
            if ($.inArray('employee', tendersAvailable) === NOT_FOUND) {
                self._$employeeButtonElement.hide();
                self._$employeeButtonElement.parent().hide();
            } else {
                ++self._numButtons;
                self._setPaymentButtonText(self._$employeeButtonElement, "employeetext", "EMPLOYEE");
                self._$employeeButtonElement.unbind("click");
                self._$employeeButtonElement.click(function () {
                    self._employeeButtonClicked(self._$employeeButtonElement);
                });
            }
        }
        if (self._$loyaltyButtonElement) {
            if ($.inArray('loyalty', tendersAvailable) === NOT_FOUND) {
                self._$loyaltyButtonElement.hide();
                self._$loyaltyButtonElement.parent().hide();
            } else {
                ++self._numButtons;
                self._setPaymentButtonText(self._$loyaltyButtonElement, "loyaltytext", "GIFT CARD");
                self._$loyaltyButtonElement.unbind("click");
                self._$loyaltyButtonElement.click(function () {
                    self._loyaltyButtonClicked(self._$loyaltyButtonElement);
                });
            }
        }

        //add any generic tender buttons as needed
		self._validateGenericTender(tendersAvailable, self._$genericTender1ButtonElement, "generictender1", 1);
		self._validateGenericTender(tendersAvailable, self._$genericTender2ButtonElement, "generictender2", 2);
		self._validateGenericTender(tendersAvailable, self._$genericTender3ButtonElement, "generictender3", 3);
		self._validateGenericTender(tendersAvailable, self._$genericTender4ButtonElement, "generictender4", 4);
		self._validateGenericTender(tendersAvailable, self._$genericTender5ButtonElement, "generictender5", 5);
		self._validateGenericTender(tendersAvailable, self._$genericTender6ButtonElement, "generictender6", 6);
		self._validateGenericTender(tendersAvailable, self._$genericTender7ButtonElement, "generictender7", 7);
		self._validateGenericTender(tendersAvailable, self._$genericTender8ButtonElement, "generictender8", 8);
		self._validateGenericTender(tendersAvailable, self._$genericTender9ButtonElement, "generictender9", 9);
		self._validateGenericTender(tendersAvailable, self._$genericTender10ButtonElement, "generictender10", 10);

		//add any Guest Account Chargeable Local Inclining Balance Generic Tender Accounts as needed...
		for(var i = 0; i < 10; i++)
		{
			var buttonElement = self._getGAIncliningBalanceButtonElement(i);

			if(_nex.hasGuestAccount && i < _nex.guestAccount.chargeableLocalAccounts.length)
			{
				self._validateGAIncliningBalanceTender(_nex.guestAccount.chargeableLocalAccounts[i], buttonElement, i);
			}
			else
			{
				buttonElement.hide();
				buttonElement.parent().hide();
			}
		}

		self._showHeaderMessage();
    };

    self._setPaymentButtonText = function (tenderUI, attribute, defaultText) {
        var btext = tenderUI.find('#btext');
        if (btext) {
            btext.empty();
            btext.append(_nex.assets.theme.getTextAttribute("PAYMENT", attribute, defaultText));
        }
    };

    self._validateGenericTender = function (tendersAvailable, genericTenderButtonElement, genericTenderName, genericTenderIndex) {
        var NOT_FOUND = -1;
        if (genericTenderButtonElement) {
            if ($.inArray(genericTenderName, tendersAvailable) === NOT_FOUND) {
                genericTenderButtonElement.hide();
                genericTenderButtonElement.parent().hide();
            } else {
                ++self._numButtons;
                
                //pull default text from the tender in system.xml
                var defaultName = "GENERIC";
                var gtender = _nex.assets.theme.getGenericTenderByType(genericTenderName);
                if (gtender) {
                    defaultName = gtender.name.toString();
                }

                self._setPaymentButtonText(genericTenderButtonElement, genericTenderName.toString() + "text", defaultName);

                genericTenderButtonElement.unbind("click");
                genericTenderButtonElement.click(function () {
                    self._genericButtonClicked(genericTenderButtonElement, genericTenderName, genericTenderIndex);
                });
            }
        }
    };

	self._getGAIncliningBalanceButtonElement = function(index)
	{
		var buttonElement;
		switch(index)
		{
			case 0:
				buttonElement = self._$gaIncliningBalanceTender1ButtonElement;
				break;
			case 1:
				buttonElement = self._$gaIncliningBalanceTender2ButtonElement;
				break;
			case 2:
				buttonElement = self._$gaIncliningBalanceTender3ButtonElement;
				break;
			case 3:
				buttonElement = self._$gaIncliningBalanceTender4ButtonElement;
				break;
			case 4:
				buttonElement = self._$gaIncliningBalanceTender5ButtonElement;
				break;
			case 5:
				buttonElement = self._$gaIncliningBalanceTender6ButtonElement;
				break;
			case 6:
				buttonElement = self._$gaIncliningBalanceTender7ButtonElement;
				break;
			case 7:
				buttonElement = self._$gaIncliningBalanceTender8ButtonElement;
				break;
			case 8:
				buttonElement = self._$gaIncliningBalanceTender9ButtonElement;
				break;
			case 9:
				buttonElement = self._$gaIncliningBalanceTender10ButtonElement;
				break;
			default:
				buttonElement = null;
		}

		return buttonElement;
	};

	self._validateGAIncliningBalanceTender = function(account, buttonElement, index)
	{
		//only inclining balance accounts should be displayed...
		if(account.usageType === "incliningbalance")
		{
			var genericTender = _nex.assets.theme.getGenericTenderByGuestAccountLocalType(account.guestAccountLocalTypeId);

			//only accounts associated to an enabled generic tender in the payment profile should be displayed...
			if(genericTender !== undefined && genericTender !== null)
			{
				++self._numButtons;

				var buttonText = genericTender.name.toString() + " Account Number: " + account.maskedAccountNumber();
				self._setPaymentButtonText(buttonElement, "gaincliningbalancetender" + (index + 1).toString() + "text", buttonText);

				buttonElement.unbind("click");
				buttonElement.click(function()
				{
					self._gaIncliningBalanceButtonClicked(buttonElement, "gaincliningbalancetender" + (index + 1).toString());
				});

				return;
			}
		}

		if(buttonElement !== undefined && buttonElement !== null)
		{
			buttonElement.hide();
			buttonElement.parent().hide();
		}

		return;
	};

    //
    // Private / helper methods
    //
	self._showHeaderMessage = function () {
        var msg = $("#selectPaymentMessage");
        if (msg.length > 0) {
            msg.empty();
            msg.append(_nex.assets.theme.getTextAttribute("PAYMENT", "paymenttype", "Select Type of Payment"));
        }
    };

    // Helper method common to all payment buttons being clicked.
    self._trackPaymentClick = function (id, button, context) {
        _nex.utility.buttonTracking.track(id, button.text(), self.currentMenuId, context, "payment");
    };

    // Button click handlers.
    self._cashButtonClicked = function (button) {
        console.debug("PaymentButtons: Cash button clicked.");
        self._trackPaymentClick(1, button, "Cash Button");
        _nex.assets.soundManager.playButtonHit();
        _nex.payment.paymentSelected('cash');

    };
    self._counterButtonClicked = function (button) {
        console.debug("PaymentButtons: Counter button clicked.");
        self._trackPaymentClick(1, button, "Counter Button");
        _nex.assets.soundManager.playButtonHit();
        _nex.payment.paymentSelected('counter');
    };
    self._couponButtonClicked = function (button) {
        console.debug("PaymentButtons: Coupon button clicked.");
        self._trackPaymentClick(1, button, "Coupon Button");
        _nex.assets.soundManager.playButtonHit();
        _nex.payment.paymentSelected('coupon');
    };
    self._creditButtonClicked = function (button) {
        console.debug("PaymentButtons: Credit button clicked.");
        self._trackPaymentClick(1, button, "Credit Button");
        _nex.assets.soundManager.playButtonHit();
        _nex.payment.paymentSelected('credit');

    };
    self._debitButtonClicked = function (button) {
        console.debug("PaymentButtons: Debit button clicked.");
        self._trackPaymentClick(1, button, "Debit Button");
        _nex.assets.soundManager.playButtonHit();
        _nex.payment.paymentSelected('debit');

    };
    self._discountButtonClicked = function (button) {
        console.debug("PaymentButtons: Discount button clicked.");
        self._trackPaymentClick(1, button, "Discount Button");
        _nex.assets.soundManager.playButtonHit();
        _nex.payment.paymentSelected('discount');

    };
    self._employeeButtonClicked = function (button) {
        console.debug("PaymentButtons: Employee button clicked.");
        self._trackPaymentClick(1, button, "Employee Button");
        _nex.assets.soundManager.playButtonHit();
        _nex.payment.paymentSelected('employee');

    };
    self._loyaltyButtonClicked = function (button) {
        console.debug("PaymentButtons: Loyalty button clicked.");
        self._trackPaymentClick(1, button, "Loyalty Button");
        _nex.assets.soundManager.playButtonHit();
        _nex.payment.paymentSelected('loyalty');
    };

    self._genericButtonClicked = function (button, genericTenderId, genericTenderIndex) {
        console.debug("PaymentButtons: Generic Tender button clicked...generic tenderid:" + genericTenderId.toString());
        self._trackPaymentClick(1, button, "Generic Button");
        _nex.assets.soundManager.playButtonHit();
        _nex.payment.paymentSelected(genericTenderId);
    };

	self._gaIncliningBalanceButtonClicked = function(button, gaIncliningBalanceTenderId)
	{
		console.debug("PaymentButtons: Guest Account Inclining Balance Tender button clicked... id:" + gaIncliningBalanceTenderId.toString());
		self._trackPaymentClick(1, button, "Guest Account Inclining Balance Button");
		_nex.assets.soundManager.playButtonHit();
		_nex.payment.paymentSelected(gaIncliningBalanceTenderId);
	};
}