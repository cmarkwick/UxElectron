_nex.commands.CouponInquiry = function (couponNumber) {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "COUPONINQUIRY";
    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "locationid": _nex.assets.theme.system.storeid, // send the 8 character location id for this command
            "couponnumber": couponNumber
        };
        console.debug(msg);
        return msg;
    };
};
_nex.commands.CouponInquiry.prototype = Object.create(_nex.commands._BaseRequest.prototype);