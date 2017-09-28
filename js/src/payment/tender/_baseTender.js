function _BaseTender() {
    var self = this;
    self._amount = 0;//Number;
    self._tenderType = "";//String ;//= "counter"; // Counter is the default tender types
    self._tenderTypeCode = 0;//String;// = "0";
    self._tenderName = "";//String = null; // user friendly name displayed to the user
    self._isAuthorized = false;//Boolean  = false;
    self._tenderDiscount = 0;//Number = 0;
    self._usedAsPayment = false;//Boolean = false;
    self._errorMessage = "";//String = null;
    self._allowGratuity = false;//Boolean = false; 

    self._isValidated = false;//Boolean  = false;
    self._saveTender = true;//Boolean  = true;

    self._validationData = "";//String = "";
    self._tenderXml = "";//XML;
    self._paymentText = "";//XML;

    self._currentValidateSequence = 0;//int;
    self._maxValidates = 1;//int = 1;
    self._validationDataBySequence = null;//Object;
    self._overrideAllreadyUsed = false;//Boolean;

    self._isCharged = false;//Boolean;
    self._discountXml = "";//XMLList;
    self._showProcessingOnPreAuth = true;//Boolean = true;


    self.isFinalTender = function () {
        // return (_tenderXml.@final.toString().toLowerCase() == "true");

    }

    self.isPreAuthRequired = function () {

        // return (_tenderXml.@preauth.toString().toLowerCase() == "true");		
    };
    self.write = function () {
        // Start the tender object with a type property.
        var tender = {
            type: self._tenderType, // the string, e.g. "credit"
            typeCode: self._tenderTypeCode, // the code, e.g. 1
            
        };

        // Pass that in to the write method, implemented in the derived class.
        var result = self._write(tender);

        // Return the result.
        return result;
    };
}


/*
public class BaseTender extends EventDispatcher implements ITenderType
	{
		protected var _amount:Number;
		protected var _tenderType:String ;//= "counter"; // Counter is the default tender types
		protected var _tenderTypeCode:String;// = "0";
		protected var _tenderName:String = null; // user friendly name displayed to the user
		protected var _isAuthorized:Boolean  = false;
		protected var _tenderDiscount:Number = 0;
		protected var _usedAsPayment:Boolean = false;
		protected var _errorMessage:String = null;
		protected var _allowGratuity:Boolean = false; 
		
		protected var _isValidated:Boolean  = false;
		protected var _saveTender:Boolean  = true;
		
		protected var _validationData:String = "";
		protected var _tenderXml:XML;
		protected var _paymentText:XML;
		
		protected var _currentValidateSequence:int;
		protected var _maxValidates:int = 1;
		protected var _validationDataBySequence:Object;
		protected var _overrideAllreadyUsed:Boolean;
		
		protected var _isCharged:Boolean;
		protected var _discountXml:XMLList;
		protected var _showProcessingOnPreAuth:Boolean = true;
		
		function BaseTender()
		{
			_tenderXml = ThemeManager.CurrentTheme.SystemSettingsXml.TENDERS[0].TENDER.(@type == _tenderType.toLowerCase())[0];
			if (_tenderXml.@allowgratuity.toString().length > 0) _allowGratuity = (_tenderXml.@allowgratuity.toString().toLowerCase() == "true");
			_paymentText = ThemeManager.CurrentTheme.Language.GetActiveText("PAYMENT");
			_amount = 0;
			
			if (MovieManager.MainMovie.MovieName.toLowerCase() == "onlineordering")
			{
				_saveTender = false; 
			}
			
			_discountXml = null;
		}

		public function get AllowGratuity():Boolean
		{
			return _allowGratuity;
		}
		
		public function get Amount():Number
		{
			_amount = NumericUtilities.CorrectMathError(_amount);
			return _amount;
		}
				
		public function set Amount(amount:Number)
		{
			_amount = amount;
		}
		
		public function get DisplayAmount():Number
		{
			return Amount;
		}
		
		public function get Discount():Number
		{
			return _tenderDiscount;
		}
		
		public function set Discount(tenderDiscount:Number)
		{
			_tenderDiscount = tenderDiscount;
		}
		
		public function get DiscountXml():XMLList
		{
			return _discountXml;
		}
		
		public function set DiscountXml(discounts:XMLList)
		{
			_discountXml = discounts;
		}
		
		public function get ErrorMessage():String
		{
			return _errorMessage;
		}
		
		public function get IsAuthorized():Boolean
		{
			return _isAuthorized;
		}
		
		public function get IsValidated():Boolean
		{
			return _isValidated;
		}
		
		public function get IsCharged():Boolean
		{
			return _isCharged;
		}

		public function get UsedAsPayment():Boolean
		{
			return _usedAsPayment;
		}
		
		public function set UsedAsPayment(usedAsPayment:Boolean)
		{
			_usedAsPayment = usedAsPayment;
		}

		public function TenderType():String
		{
			return _tenderType;
		}
		
		public function TenderTypeCode():String
		{
			return _tenderTypeCode;
		}
		
		public function get TenderName():String
		{
			return _tenderName;
		}
		
		public function set TenderName(name:String)
		{
			_tenderName = name;
		}
		
		public function get OverrideAllreadyUsed():Boolean
		{
			return _overrideAllreadyUsed
		}
		
		public function set OverrideAllreadyUsed(value:Boolean)
		{
			_overrideAllreadyUsed = value;
		}
		
		public function get ShowProcessingOnPreAuth():Boolean
		{
			return _showProcessingOnPreAuth;
		}
		
		public function set ShowProcessingOnPreAuth(showProcessingOnPreAuth:Boolean)
		{
			_showProcessingOnPreAuth = showProcessingOnPreAuth;
		}
		
		//
		 // defaults to true. if false then the POP server will not save this tender on the order when processing
		 // if online ordering then it deafaults to false and it triggers OO to save the tender to the customer profile
		 //
public function get SaveTender():Boolean
    {
        return _saveTender;
    }
		
    public function set SaveTender(val:Boolean):void
    {
        _saveTender = val;
    }
		
		
		
    public function PreAuthRequest():void
    {
        if (IsPreAuthRequired() || IsPreAuthAndPayment())
            {
                trace("show processing for PreAuthRequest");
                if (_showProcessingOnPreAuth)
                {
                    var popup:BasePopup = PopupManager.GetPopup(PopupManager.PROCESSING);
                    popup.MessageText = (_paymentText.@preauthmessage.toString().length > 0) ? _paymentText.@preauthmessage : "Authorizing...";
                    popup.Show();
                }
				
                _isAuthorized = false;
            }
        else
        {
            _isAuthorized = true;
            RaiseEvent(TenderEvent.PREAUTH_RESPONSE);				
        }
    }
		
		
        protected function PreAuthResponse(evt:CommunicationEvent):void
		{			
		    if (_showProcessingOnPreAuth)
		    {
		        PopupManager.GetPopup(PopupManager.PROCESSING).Hide();
		    }
			
			if (!this.IsAuthorized)
        {
				var popup:BasePopup = PopupManager.GetPopup(PopupManager.ERROR);
            if (evt.Response.Xml.@errormessage.toString().length > 0)
            {
                popup.MessageText = evt.Response.Xml.@errormessage;
            }
            else
            {
                popup.MessageText = (_paymentText.@preautherror.toString().length > 0) ? _paymentText.@preautherror : "Authorization failed";
            }
            popup.Show(null, true);
        }
        RaiseEvent(TenderEvent.PREAUTH_RESPONSE);
    }
		
    protected function RaiseEvent(eventType:String):void
    {
        dispatchEvent(new TenderEvent(eventType, this));
        }
		
    public function WriteXml(tender:XML)
        {
            tender.@type = this.TenderTypeCode();
            tender.@tenderdiscount = this._tenderDiscount;
			
            tender.@istaxexempt = IsTaxExempt;
            tender.@savetender = (_saveTender ? "true" : "false");
            if (_isCharged)
            {
                //flag that hte tender was already paid for and should not be charged again
                tender.@paid = "true"; 
            }
            tender.@pcid = ThemeManager.KioskXml.@pcid;
        }
		
        public function get IsTaxExempt():Boolean
            {
                var tenderSetting:XML = OrderManager.CurrentOrder.OrderPayment.TenderSettings.TENDER.(@type == this.TenderType().toLowerCase())[0];
                Logger.Publish(Logger.DEBUG, tenderSetting.toXMLString());
                return (tenderSetting.@istaxexempt.toString().toLowerCase() == "true");		
            }
		
            public function IsFinalTender():Boolean
                {
                    return (_tenderXml.@final.toString().toLowerCase() == "true");
                }
		
                public function IsPreAuthRequired():Boolean
                    {
                        return (_tenderXml.@preauth.toString().toLowerCase() == "true");		
                    }
		
                    //
                     // If true then the tender is expected to be charged during the preauth.
                     // Only supported by loyalty currently
                     //
                    public function IsPreAuthAndPayment():Boolean
                        {
                            return (_tenderXml.@preauthandpay.toString().toLowerCase() == "true");		
                        }
		
                        public function IsValidationRequired():Boolean
                            {
                                return (_tenderXml.@validate.toString().toLowerCase() == "true");		
                            }
		
                            public function get ValidationData():String
                                {
                                    return _validationData;
                                }
		
                                public function GetValidationData(validateSequence:int):String
                                    {
                                        if (_validationDataBySequence == null || _validationDataBySequence[validateSequence] == null)
                                        {
                                            return "";
                                        }
			
                                        return String(_validationDataBySequence[validateSequence]);
                                    }
		
                                    protected function SetValidationData(validateSequence:int, validationData:String):void
                                    {
                                        if (_validationDataBySequence == null)
                                            {
                                                _validationDataBySequence = new Object();
                                            }
			
                                            _validationDataBySequence[validateSequence]  = validationData;
                                        }
		
                                    protected function GetValidateType(validateSequence:int):String
                                        {
                                            return "";
                                        }
		
                                        public function GetValidationPopup(validateSequence:int = 1):BaseKeyPadPopup
                                            {
                                                var popup:BaseKeyPadPopup;
                                                var validateAssetAttribute:String = "validateasset";
                                                if (validateSequence > 1)
                                                {
                                                    validateAssetAttribute = validateAssetAttribute + validateSequence.toString();
                                                }
				
                                                var validationAsset:String = _tenderXml.@[validateAssetAttribute].toString().toLowerCase();
                                                switch(validationAsset)
                                                {
                                                    case "assets/pinpad.swf": //this one is included for backwards compatibility
                                                    case "pinpad":
                                                        popup = PopupManager.GetPopup(PopupManager.PIN_PAD) as BaseKeyPadPopup;
                                                        break;
                                                    case "assets/keyboard.swf": //this one is included for backwards compatibility
                                                    case "keyboard":
                                                        popup = PopupManager.GetPopup(PopupManager.KEYBOARD) as BaseKeyPadPopup;
                                                        KeyboardPopup(popup).EnableKeys(true, true, false, true);//if using the keyboard allow letters and numbers
                                                        break;
                                                    case "assets/numberpad.swf": //this one is included for backwards compatibility
                                                    case "numberpad":
                                                    default:
                                                        popup = PopupManager.GetPopup(PopupManager.NUMBER_PAD) as BaseKeyPadPopup;
                                                        break;
                                                }
			
                                                return popup;
                                            }
		
                                            //
                                             // Loads up the selected validate popup for this tender and then preauthorizes the tender once the popup has returned with a value.
                                             //
                                            public function Validate():void
                                            {
                                                //validate for each validate asset setup. create an array of validate data
                                                _currentValidateSequence = 1;
                                                var validateAsset:String;
                                                var bail:Boolean = false;
                                                _maxValidates = 1;
                                                for (var i:int = 2; i < 10 && !bail; i++)
                                                {
                                                    validateAsset = "validateasset" + i.toString();
                                                    if (_tenderXml.@[validateAsset] == null || _tenderXml.@[validateAsset].toString() == "")
                                                {
                                                        bail = true;
                                                }
                                        else
                                        {
                                                    _maxValidates++;
                                        }
                                    }
			
                                        if ((_maxValidates == 1) && (_tenderXml.@validateasset.toString() == ""))
                                        {
                                            PreAuthRequest();
                                        }
                                        else
                                        {
                                            DoValidate(_currentValidateSequence);
                                        }
                                    }
		
		
		
                                    protected function DoValidate(validateSequence:int):void
                                    {
                                        var popup:BaseKeyPadPopup = GetValidationPopup(validateSequence);
			
                                        var minString:String = "minlength" ;
                                        var maxString:String = "maxlength" ;
			
                                        if (validateSequence > 1)
                                        {
                                            minString = "minlength" + validateSequence.toString();
                                            maxString= "maxlength" + validateSequence.toString();
                                        }
			
                                        var maxlength:Number = Number(_tenderXml.@[maxString].toString());
                                        var minlength:Number = Number(_tenderXml.@[minString].toString());
			
                                        if (minlength < 0 || minlength == NaN)
                                        {
                                            minlength = 0;
                                        }
                                        if (maxlength <= 0 || maxlength == NaN)
                                        {
                                            maxlength = 10;
                                        }
			
                                        popup.MaxLength = maxlength;
                                        popup.MinLength = minlength;
			
                                        var validateText:String = ThemeManager.CurrentTheme.Language.GetActiveTextAttribute("VALIDATE", GetValidateType(validateSequence));
                                        if (validateText == null || validateText.length == 0)
                                        {
                                            validateText = "Enter Validation Number";
                                        }
                                        popup.MessageText = validateText;
                                        popup.Show(ValidateResults);
                                    }
		
                                    //
                                     // Called when the validate popup is closed. get the validation retult and send the preauth
                                     //
                                    private function ValidateResults(evt:PopupEvent):void
                                    {
                                        try
                                        {
                                            if (evt.NoClicked)
                                                {
                                                    //clear out the validation data and raise the cancelled event.
                                                    _validationData = "";
                                                    _currentValidateSequence = null;
                                                    RaiseEvent(TenderEvent.VALIDATION_CANCELLED);
                                                }
                                            else
                                            {
                                                //yes clicked so validation data was returned. preauthorize using this data
                                                var popup:BaseKeyPadPopup = evt.target as BaseKeyPadPopup;				
                                                if (_currentValidateSequence == 1)
                                                {
                                                    _validationData = popup.Text;
                                                }
					
                                                SetValidationData(_currentValidateSequence, popup.Text);
					
                                                if (_currentValidateSequence == _maxValidates)
                                                {					
                                                    PreAuthRequest();	
                                                }
                                                else
                                                {
                                                    //get the next piece of validation data.
                                                    _currentValidateSequence++;
                                                    DoValidate(_currentValidateSequence);
                                                }
                                            }
                                        }
                                        catch (e:Error)
                                        {
                                            Logger.PublishError(e);
                                        }
                                    }
		
                                }
                            }

                        */