
function ScanItems() {

    var self = this;
    _nex.scanItems = self;

    self.formatCurrency = function (value) {

        if (value === undefined) return "";

        return "$" + Number(value).toFixed(2);
    };

    self.currentItemDescription = ko.observable();
    self.currentItemPrice = ko.observable();
    self.currentItemPrompt = ko.observable("Scan an Item or Press Continue");
    self.items = ko.observableArray();

    self.itemTotal = ko.computed(function () {
        var total = 0;
        ko.utils.arrayForEach(self.items(), function (item) {
            if (item.itemPrice !== undefined) {
                total += Number(item.itemPrice);
            }
        });
        return total;
    });

    self.addItem = function (description, price) {
        self.currentItemDescription(description);
        self.currentItemPrice(price);
        self.currentItemPrompt("Scan Your Next Item or Press Continue");
        self.items.push({
            itemDescription: description,
            itemPrice: price
        });
    };
}