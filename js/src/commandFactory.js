function CommandFactory() {
	var self = this;

	self.isCommandSupport = function (cmd) {

		var isSupported = false;
		switch (cmd.name) {
			case "ADDTOORDERRESPONSE":
			case "TENDERADDED":
			case "CANCELORDERRESPONSE":
			case "CONSOLIDATEORDERRESPONSE":
			case "COUPONRESPONSE":
			case "CREATEORDERRESPONSE":
			case "CUSTOMERRESPONSE":	//this response is returned from the TM if facial recognition is configured on the kiosk
		    case "DEVICELOOKUPRESPONSE":
		    case "EMPLOYEERESPONSE":
			case "GENERICINQUIRYRESPONSE":
			case "LICENSEUPDATE":
			case "LOADORDERRESPONSE":
			case "LOYALTYRESPONSE":
			case "ORDERPROCESSED":
			case "ORDERTOTAL":
			case "PAYMENTRESPONSE": // This command comes back when a payment device processes a payment.
			case "PREVIOUSORDERS":
			case "PROCESSLOYALTYRESPONSE":
			case "PROCESSTENDERRESPONSE":
			case "REMOVEFROMORDERRESPONSE":
			case "SERVERSTATUS":
			case "SETSERVICEMODE":
			case "UPDATEQUANTITYRESPONSE":
			case "UPDATETENDERRESPONSE":
			case "EMPLOYEESECURITYCHECK":
			case "EMPLOYEESECURITYCHECKRESPONSE":
			case "SWITCHAPPLICATION":
			case "ITEMWEIGHT":
			case "ITEMLOOKUP":
			case "ITEMLOOKUPRESPONSE":
			case "ORDERLOOKUP":
			case "ORDERLOOKUPRESPONSE":
			case "UPDATEKIOSK": {
				isSupported = true;
				break;
			}
			default: {
				console.log("command is not supported; name: " + cmd.name);
				break;
			}
		}
		// Note: The Manager is where responses are listened for in Manager.commandReceived.

		return isSupported;
	};
}