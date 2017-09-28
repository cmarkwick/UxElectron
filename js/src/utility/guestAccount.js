//Represents a Guest Account
function GuestAccount(guestAccountId, firstName, lastName, email, thumbnail64, accounts)
{
	var self = this;

	self.guestAccountId = guestAccountId;
	self.firstName = firstName;
	self.lastName = lastName;
	self.email = email;
	self.thumbnail64 = thumbnail64;

	self.chargeableLocalAccounts = [];

	var index = 0;

	if(Array.isArray(accounts))
	{
		accounts.forEach(function(account)
		{
			index++;
			self.chargeableLocalAccounts.push(new GuestAccountLocal(index, account.guestaccountlocalid, account.guestaccountlocaltypeid, account.typename, account.usagetype, account.accountnumber, account.pin));
		});
	}
	else
	{
		self.chargeableLocalAccounts.push(new GuestAccountLocal(1, accounts.guestaccountlocalid, accounts.guestaccountlocaltypeid, accounts.typename, accounts.usagetype, accounts.accountnumber, accounts.pin));
	}

	self.getGuestAccountLocalByPaymentClipTenderType = function(paymentClipTenderType)
	{
		for(var i = 0; i < self.chargeableLocalAccounts.length; i++)
		{
			if(self.chargeableLocalAccounts[i].paymentClipTenderType === paymentClipTenderType)
			{
				return self.chargeableLocalAccounts[i];
			}
		}
	};
}

//Represents a generic tender account associated to a Guest Account
function GuestAccountLocal(index, guestAccountLocalId, guestAccountLocalTypeId, typeName, usageType, accountNumber, pin)
{
	var self = this;

	self.index = index;
	self.paymentClipTenderType = "gaincliningbalancetender" + index.toString();
	self.guestAccountLocalId = guestAccountLocalId;
	self.guestAccountLocalTypeId = guestAccountLocalTypeId;
	self.typeName = typeName;
	self.usageType = usageType.toLowerCase();
	self.accountNumber = accountNumber;
	self.pin = pin;

	self.genericTenderId = null;
	self.genericTenderIndex = null;

	//associate a generic tender (enabled in the payment profile) to the chargeable local account...
	var genericTender = _nex.assets.theme.getGenericTenderByGuestAccountLocalType(guestAccountLocalTypeId);
	if(genericTender !== null && genericTender !== undefined)
	{
		self.genericTenderId = genericTender.type;
		self.genericTenderIndex = genericTender.type.slice(-1);
	}

	//mask the account number to display in the UI...
	self.maskedAccountNumber = function()
	{
		var maskedLength = self.accountNumber.length - 3;

		var maskString = "";
		for(var i = 0; i < maskedLength; i++)
		{
			maskString += "*";
		}

		return self.accountNumber.replace(/\b(\d{2})\d+(\d)/, "$1" + maskString + "$2");
	};
}
