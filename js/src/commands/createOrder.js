_nex.commands.CreateOrder = function (hasvideo, frenabled) {
	_nex.commands._BaseRequest.call(this);

	var self = this;
	self.name = "CREATEORDER";

	self.hasvideo = false;
	if (hasvideo) {
		self.hasvideo = true;
	}

	self.frenabled = false;
	if(frenabled)
	{
		self.frenabled = true;
	}

	self.write = function () {
		var msg = self.msgHeader();
		msg[self.name] = {
			"hasvideo": self.hasvideo,
			"frenabled": self.frenabled
		};

		return msg;
	};
};
_nex.commands.CreateOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype);