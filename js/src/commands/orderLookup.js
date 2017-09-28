_nex.commands.OrderLookup = function (orderDate, searchType, searchTerm, updateOrderTime) {
    var self = this;

    _nex.commands._BaseRequest.call(self);
    self.name = 'ORDERLOOKUP';

    self._orderDate = "";
    self._searchType = "";
    self._searchTerm = "";
    self._updateOrderTime = false;

    if (orderDate) {
        self._orderDate = new Date(orderDate);
    }

    if (searchType) {
        self._searchType = searchType;
    }

    if (searchTerm) {
        self._searchTerm = searchTerm;
    }

    if (updateOrderTime) {
        self._updateOrderTime = updateOrderTime;
    }

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "orderdate": self._orderDate,
            "searchtype": self._searchType,
            "searchterm": self._searchTerm,
            "updateordertime" : self._updateOrderTime
        };
        // console.debug(msg);
        return msg;
    };
};
_nex.commands.OrderLookup.prototype = Object.create(_nex.commands._BaseRequest.prototype);
