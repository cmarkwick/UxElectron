//Represents a payment clip for a Guest Account Inclining Balance Generic Tender Account
function GAIncliningBalancePaymentClip(gaIncliningBalanceTenderId)
{
	var self = this;

	self._gaIncliningBalanceId = gaIncliningBalanceTenderId;
	self._elementId = paymentConstants.GAINCLININGBALANCE_CLIP_ELEMENT_ID;
	self._tenderType = "gaincliningbalancetender" + gaIncliningBalanceTenderId.toString();

	self._guestAccountLocal = _nex.guestAccount.getGuestAccountLocalByPaymentClipTenderType(self._tenderType);
	self._guestAccountLocalTypeId = self._guestAccountLocal.guestAccountLocalTypeId;
	self._genericTenderId = self._guestAccountLocal.genericTenderId;
	self._paymentTypeId = Number(self._guestAccountLocal.genericTenderIndex) + 50;

	self._enableDebugging = true;

	//write debugging information to the console
	self._debug = function(message)
	{
		if(self._enableDebugging)
		{
			console.debug(message);
		}
	};

	//show the clip
	self.show = function()
	{
		//transition out the select payment clip.
		$("#" + paymentConstants.SELECT_CLIP_ELEMENT_ID).hide();

		//show the new clip.
		$("#paymentclip-" + self._tenderType).show();
		$("#" + self._elementId).show();

		//determine next step -- prompt for pin or generic inquiry...
		var tenderConfig = _nex.assets.theme.getGenericTenderByType(self._genericTenderId);
		if(_nex.assets.theme.isKioskValidationRequired(tenderConfig))
		{
			//prompt for pin
			self._debug("generic tender validation required; prompting for pin");
			self.promptForPin();
		}
		else
		{
			_nex.payment.genericInquiry(self._guestAccountLocal.pin, self._guestAccountLocalTypeId, self._paymentTypeId, self._guestAccountLocal.accountNumber);
		}
	};

	//hide the clip
	self.hide = function()
	{
		$("#" + self._elementId).hide();
		$("#paymentclip-" + self._tenderType).hide();
	};

	//reset the clip
	self.reset = function()
	{
		self.hide();
		self.show();
	};

	//prompt the user to enter their pin.
	self.promptForPin = function()
	{
		var popup = $.extend(true, {}, _nex.assets.popupManager.pinpadPopup);
		popup.buttons[0].clickEvent = "_nex.payment.genericInquiry(_nex.keyboard.numpad.data, \"" + self._guestAccountLocalTypeId.toString() + "\"," + self._paymentTypeId.toString() + ", \"" + self._guestAccountLocal.accountNumber + "\");";
		popup.buttons[1].clickEvent = "_nex.payment._paymentManager._currentClip.show();";

		popup.message = _nex.assets.theme.getTextAttribute("ORDER", "genericpin", "Please enter your PIN");
		_nex.assets.popupManager.showPopup(popup);
		_nex.keyboard.numpad.bindKeys();
	};
}

GAIncliningBalancePaymentClip.prototype = Object.create(BasePaymentClip.prototype);