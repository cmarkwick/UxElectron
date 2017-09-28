// Helper for getting and setting focus to elements in the DOM.
function DomFocus() {
    var self = this;
    self.looped = false;

    // Debugging.
    self.debugEnabled = false;
    self.debug = function () {
        if (self.debugEnabled) {
            console.debug("DomFocus", arguments);
        }
    };
    self.error = function (message) {
        console.log("DomFocus Error: ", message);
    };

    // Called when an item receives focus.
    self.focusIn = function () {
        _nex.assets.soundManager.cancelSpeak();
        self.debug("Focusin event");
        var text = $(this).find(".caption").text();
        var hasDownState = $(this).hasClass("button-down-state");

       // If we didn't find text in the caption, get text from the element itself.
        if (!text || text.length <= 0) {
            text = $(this).text();
        }
        if (text && text.length > 0) {
            if (hasDownState) {
                text = "selected " + text;
            }
            
            self.debug("Speaking text " + text);
            _nex.assets.soundManager.speak(text);
        } else {
            //self.cycleFocus();
        }
    };

    // Positive numbers (1,2,3, ...) are handled in tab order.
    // 0 is handled in source order (the order it appears in the DOM)
    // -1 is ignored during tabbing but is focusable.

    // Cycle focus to the next element.
    // If nothing has focus, it cycles to the first focusable element.
    // If previous is set to true, cycle to the previous element.
    self.cycleFocus = function (prev) {
        self.debug("Cycle focus", "enter");
        var anythingHasFocus = self.anythingHasFocus();
        if (!anythingHasFocus) {
            self.debug("Cycle focus", "Nothing has focus... Cycling focus to the first tabable element.");
            self.cycleFocusDefault();
            return;
        }
        if (_nex.kviReader) {
            _nex.kviReader.rebind();
        }

        var $focused = self.getCurrentFocus();
        var tabables = self.getTabableElements();
        var maxIndex = tabables.length - 1;
        var currentIndex = tabables.index($focused);
        var nextIndex;
        if (prev) {
            nextIndex = self.getPrevIndex(currentIndex, maxIndex);
        } else {
            nextIndex = self.getNextIndex(currentIndex, maxIndex);
        }
        if (self.looped) {
            self.playLoopSound();
        }

        self.debug("Cycle focus", "Cycling focus from the current focused item " + currentIndex + " to " + nextIndex);
       
        // Add a slight delay between the chime and the next item when it loops around.
        if (self.looped) {
            window.setTimeout(function () {
                tabables.eq(nextIndex).focus();
            }, 500);
        } else {
            tabables.eq(nextIndex).focus();
        }
         
        self.debug("Cycle focus", "exit");
    };

    // Play a sound to let the user know they went from the last to the first thing, or the first to the last.
    self.playLoopSound = function () {
        _nex.assets.soundManager.playChime();
    };

    // Cycle focus to the first tabable element.
    self.cycleFocusDefault = function () {
        var tabables = self.getTabableElements();
        if (tabables.length <= 0) {
            self.error("No tabable element found to focus to for default");
            return;
        }
        tabables.first().focus();
        if (_nex.kviReader) {
            _nex.kviReader.rebind();
        }
    };

    // Check if anything currently has focus.
    self.anythingHasFocus = function () {
        var result = false;
        var $focused = self.getCurrentFocus();
        if ($focused.length > 0) {
            result = true;
        }
        return result;
    };

    // Helper function. Return the order based on the tab index and also the index within the document.
    function getDomOrder(element, tabindex) {
        return $("[tabindex='" + tabindex + "']").index(element);
    }

    // Helper function. Return the tabable elements in sorted order.
    function getSorted(tabableElements) {
        return tabableElements.toArray().sort(function (a, b) {
            var aTab = parseInt(a.getAttribute("tabindex"));
            var bTab = parseInt(b.getAttribute("tabindex"));
            if (aTab === bTab) {
                // If they have the same tab index, defer to DOM order.
                var aOrder = getDomOrder(a, aTab);
                var bOrder = getDomOrder(b, bTab);
                return aOrder - bOrder;
            } else {
                return aTab - bTab;
            }            
        });
    }

    // Return a jQuery object of all the elements we can tab to.
    self.getTabableElements = function () {
        var tabableElements = $(self.tabableElementString()).not("[tabindex='-1']");
        var sortedTabableElements = getSorted(tabableElements); // sort by tab order

        return $(sortedTabableElements);
    };

    // Return a jQuery string of all the elements we can tab to.
    self.tabableElementString = function () {
        var result = "";
        if ($(".modal-open").length > 0) {
            // There is a modal dialog open. Only tab to items on the dialog.
            result = ".modal [tabindex]:visible"; 
        } else {
            result += "a:visible";
            // For mobile in the future.
            //result += ", area[href]:not([tabindex='-1'])";
            //result += ", input:visible:not([disabled]))";
            //result += ", select:visible:not([disabled]):not([tabindex='-1'])";
            //result += ", textarea:visible:not([disabled]):not([tabindex='-1'])";
            //result += ", button:visible:not([disabled]):not([tabindex='-1'])";
            //result += ", iframe:visible:not([tabindex='-1'])";
            result += ", [tabindex]:visible";
            //result += ", [contentEditable=true]:visible:not([tabindex='-1'])";
        }
       

        return result;
    };

    // Return the current element that has focus.
    self.getCurrentFocus = function () {
        return $(':focus');
    };

    // Set the focus on a specific element by id.
    self.setFocusById = function (elementId) {
        $("#" + elementId).focus();
    };

    // Based on the current index, get the next index we can cycle to.
    self.getNextIndex = function (currentIndex, lastIndex) {
        var nextIndex = currentIndex + 1;
        self.looped = false;
        if (nextIndex > lastIndex) {
            nextIndex = 0;
            self.looped = true;
        }
        return nextIndex;
    };

    // Based on the current index, get the previous index we can cycle to.
    self.getPrevIndex = function (currentIndex, lastIndex) {
        var nextIndex = currentIndex - 1;
        self.looped = false;
        if (nextIndex < 0) {
            nextIndex = lastIndex;
            self.looped = true;
        }
        return nextIndex;
    };

    self.focusOrderingHeader = function () {
        window.setTimeout(function () {
            self.debug("Setting focus on menu header");
            $(".menu-header-text").first().focus();
        }, 50);
    };

    self.loadContent = function () {
        self.focusDefault(); 
    };

    self.loadMedia = function () {
        self.focusDefault();
    };

    self.focusDefault = function () {
        var html = "";
        if ($(".page-header").length > 0) {
            window.setTimeout(function () {
                // For things like change password, add a hidden copy of the page header to announce to the user
                if ($("#pageHeaderCopy").length === 0) {
                    text = $(".page-header").first().text();
                    $("#clip-header").append('<div aria-hidden="false" tabindex="1" id="pageHeaderCopy" style="opacity: 0;">' + text + "</div>");
                }
                if (!$("#pageHeaderCopy").is(":focus")) {
                    $("#pageHeaderCopy").focus();
                }

            }, 100);
        } else if ($("a#btnStart").length > 0) {
            $("a#btnStart").attr("tabindex", 1);
            window.setTimeout(function () {
                console.debug("Setting focus on start button");
                $("a#btnStart").first().focus();
            }, 100);
        }
    };
}

/**
 * FilterCriteria
 * @constructor
 */
function FilterCriteria() {
    var self = this;
    self.itemFilter = null;
    self.hideUpsellMenus = false;
    self.hideAlcoholMenus = false;
    self.tenderFilter = null;//if set, only tenders in this list are shown during selectpayment
    self.itemIncludePriceLevel = "";//for ux; will only show items that have this price level and will use this price level

    // remove all criteria
    self.clear = function () {
        //console.debug("Clearing Filter");
        self.itemFilter = null;
        self.tenderFilter = null;
        self.hideUpsellMenus = false;
        self.hideAlcoholMenus = false;
        self.itemIncludePriceLevel = "";
    };

    self.applyItemFilter = function (filter) {
        self.clear();
        self.itemFilter = $.extend(true, {}, filter.ITEMFILTER); // create a copy of the filter

        // convert data to arrays
        self.itemFilter.INCLUDEATTRIBUTES = self._convertToArray(self.itemFilter.INCLUDEATTRIBUTES);
        self.itemFilter.EXCLUDEATTRIBUTES = self._convertToArray(self.itemFilter.EXCLUDEATTRIBUTES);
        self.itemFilter.INCLUDETEXTS = self._convertToArray(self.itemFilter.INCLUDETEXTS);

        if (self.itemFilter.hasOwnProperty('pricelevel')) {
            self.itemIncludePriceLevel = self.itemFilter.pricelevel;
        } else {
            self.itemIncludePriceLevel = "";
        }
        self.tenderFilter = self._convertToArray(filter.TENDERFILTER).slice(); // create a copy of the tender filter
        self.hideUpsellMenus = (filter.MENUFILTER.hideupsell.toLowerCase() === "true");
        self.hideAlcoholMenus = (filter.MENUFILTER.hidealcohol.toLowerCase() === "true");
    };

    self._convertToArray = function (val) {
        if (!Array.isArray(val)) {
            val = val.hasOwnProperty("value") ? new Array(val) : [];
        }

        return val;
    };

    // returns true if the passed in tender name is allowed per the filtering
    self.doesTenderPassFilter = function (tenderType) {
        var pass = false;
        if ((self.tenderFilter !== null) &&
            (self.tenderFilter.length > 0)) {
            for (var i = 0; i < self.tenderFilter.length && !pass; i++) {
                if (self.tenderFilter[i].name === tenderType) {
                    pass = true;
                }
            }
        } else {
            pass = true;
        }

        return pass;
    };

    // returns true if the item passes the existing item filters...
    /*
        {
            "type": "filter",
            "ITEMFILTER": {
                "INCLUDEATTRIBUTES": [],
                "EXCLUDEATTRIBUTES": [],
                "INCLUDETEXTS": []
            },
            "MENUFILTER": {
                "hideupsell": "false",
                "hidealcohol": "true"
            },
            "TENDERFILTER": []
        }
     */
    self.doesItemPassFilter = function (item) {
        var pass = true;
        var i = 0;
        var attr = null;

        if (self.itemFilter !== null) {
            //if the item has excluded attributes....
            for (i = 0; i < self.itemFilter.EXCLUDEATTRIBUTES.length && pass; i++) {
                attr = _nex.assets.theme.findItemAttribute(item, self.itemFilter.EXCLUDEATTRIBUTES[i].name);
                if ((attr !== null) &&
                    (attr.value === self.itemFilter.EXCLUDEATTRIBUTES[i].value)) {
                    pass = false; //if any attribute is found then FAIL! since it is on the exclude list
                }
            }

            if (pass) {
                //if the item doesn't have all include attributes....
                for (i = 0; i < self.itemFilter.INCLUDEATTRIBUTES.length && pass; i++) {
                    attr = _nex.assets.theme.findItemAttribute(item, self.itemFilter.INCLUDEATTRIBUTES[i].name);
                    if ((attr === null) ||
                        ((attr !== null) &&
                        (attr.value === self.itemFilter.INCLUDEATTRIBUTES[i].value))) {
                        pass = false; //if any attribute is not found then FAIL since is is not on the include list
                    }
                }
            }

            if (pass) {
                ////fail if the item text doesn't match all filtered item text values (based on text type)
                for (i = 0; i < self.itemFilter.INCLUDETEXTS.length && pass; i++) {
                    var realText = _nex.assets.theme.itemTextByType(item, self.itemFilter.INCLUDETEXTS[i].textType);
                    if (realText.indexOf(self.itemFilter.INCLUDETEXTS[i].value) < 0) {
                        pass = false;
                    }
                }
            }

            // Price level filtering is only for UX and not NEXTEP Mobile
            if (_nex.context === "UX") {
                if (pass) {
                    if (self.itemIncludePriceLevel !== null && self.itemIncludePriceLevel.length > 0) {
                        ////fail if the item text doesn't match all filtered item text values (based on text type)
                        priceLevelObj = _nex.assets.theme.findPriceLevel(item, self.itemIncludePriceLevel);
                        if (priceLevelObj === null) {
                            pass = false;
                        }
                        else {
                            pass = true;
                        }
                    }
                }
            }

        }
        return pass;
    };
}
/**
 * Prepends labels on inputs that don't already have them for screen readers.
 * @constructor
 */
function LabelManager() {
    var self = this;

    // Help debug what is going on.
    var debugEnabled = true;
    self.debug = function () {
        if (debugEnabled) {
            console.debug("LabelManager", arguments);
        }
    }

    /**
     * Add missing labels to a page for inputs without labels.
     * @memberof LabelManager
     */
    self.addMissingLabels = function () {   
        $('input[type="text"], textarea, select').each(function (index, item) {
            self.debug("Checking index " + index + " of inputs.");
            var $item = $(item);
            self.addMissingIdToInput($item);
            self.addMissingLabelToInput($item);
        });
    };

    /**
     * Add a missing id to an input if it has a name but not an id.
     * @memberof LabelManager
     */
    self.addMissingIdToInput = function ($item) {
        var itemId = $item.attr("id");
        var itemName = $item.attr("name");
        if (itemName && (!itemId)) {
            self.debug("Giving id of " + itemName);
            $item.attr("id", itemName);
        }
    };

    /**
     * Add a missing label in front of an element if there isn't one already.
     * @memberof LabelManager
     */
    self.addMissingLabelToInput = function ($item) {
        var id = $item.attr("id");
        if (!self.hasLabel(id)) {
            self.prependLabel(id, id);
        } else {
            self.debug("Input with id of " + id + " already has a label.");
        }
    };

    /**
     * Detect if an input already has a label or not.
     * @memberof LabelManager
     */
    self.hasLabel = function (inputId) {
        var result = false;
        var $input = $("#" + inputId);
        if ($input.length > 0) {
            var labelSelector = 'label[for="' + inputId + '"]';
            self.debug("Checking if anything has label with criteria " + labelSelector);
            var $label = $(labelSelector);
            if ($label.length > 0) {
                result = true;
            }
        }
        return result;
    };

    /**
     * Add a label in front of an element.
     * @memberof LabelManager
     */
    self.prependLabel = function (inputId, labelText) {
        var $input = $("#" + inputId);
        if ($input.length > 0) {
            // make the label invisible by setting its width and height to 0px.
            self.debug("Adding label to id " + inputId);
            var labelText = '<label class="specialHidden" for="' + inputId + '">' + labelText + '</label>';
            $input.before(labelText);
        }
    };
}
/**
 * MenuInfo
 * @constructor
 */
function MenuInfo(menuId) {
    var self = this;

    self.menuId = menuId;
    self.skipped = false;
    self.scrollIndex = 0;
    self.posids = [];
    self.removePosid = function (posid) {
        // remove from the menu stack
        for (var i = 0; i < self.posids.length; i++) {
            if (self.posids[i] === posid) {
                self.posids.splice(i, 1);
                break;
            }
        }
    };
}
// Add mergeSort to the array prototype. Browsers are allowed to implement their own implementations of
// the built in sort algorithm, so one browser may sort ties differently than another. This will always
// leave ties in place, and work the same way across different browsers.
// Adapted from:
// http://stackoverflow.com/questions/1427608/fast-stable-sorting-algorithm-implementation-in-javascript
(function () {

    // define a simple comparison function
    var simpleCompare = function (left, right) {
        if (left < right) {
            return -1;
        }
        if (left == right) {
            return 0;
        } else {
            return 1;
        }
    }; 

    // merge helper function
    var merge = function (left, right, compare) {
        var result = [];

        while (left.length > 0 || right.length > 0) {
            if (left.length > 0 && right.length > 0) {
                if (compare(left[0], right[0]) <= 0) {
                    result.push(left[0]);
                    left = left.slice(1);
                }
                else {
                    result.push(right[0]);
                    right = right.slice(1);
                }
            }
            else if (left.length > 0) {
                result.push(left[0]);
                left = left.slice(1);
            }
            else if (right.length > 0) {
                result.push(right[0]);
                right = right.slice(1);
            }
        }

        // return the result
        return result;
    };

    // the actual sort function
    var mergeSort = function (compare) {
        var self = this;
        var length = self.length;
        var middle = Math.floor(length / 2);

        // if a comparison function wasn't specified, just use one
        if (!compare) {
            compare = simpleCompare;
        }

        // base case: one or no items are already sorted
        if (length <= 1) {
            return self;
        }

        // merge csae: merge the left and merge the right
        return merge(
            self.slice(0, middle).mergeSort(compare), // recursively merge the left side
            self.slice(middle, length).mergeSort(compare),// recursively merge the right side
            compare
        );
    };

    // Register the sort on the prototype.
    Array.prototype.mergeSort = mergeSort;
})();
// Manages displaying nutrition information on the screen.
// @constructor
// An instance of NutionSummary is used for updating the running total nutrition information.
// @param clipId - element id of the clip. 
// @param orderManager - a dependency we are injecting. Used to get the current order object.
function NutritionSummary(clipId, orderManager) {
    var self = this;

    self.debugEnabled = false;
    self.debug = function () {
        if (self.debugEnabled) {
            console.debug(arguments);
        }
    };

    // In the Flash there is a NutritionInfo object.
    // This tries to use similar functionality.
    // It is only used by this object, so it is declared inline here.
    function NutritionInfo() {
        var self = this;
        //self.SERVING = "Serving Size";
        self.CALORIES = "Calories Per Serving";
        self.TOTALFAT = "Total Fat";
        self.SATFAT = "Saturated Fat";
        self.TRANSFAT = "Trans Fat";
        self.CHOLESTEROL = "Cholesterol";
        self.SODIUM = "Sodium";
        self.TOTALCARBS = "Total Carbohydrates";
        self.SUGARS = "Sugar";
        self.PROTEIN = "Protein";
        self.FIBER = "Fiber";

        // In the future we will support other nutritional information besides calories.
        //valueSet = fillNutritionAmount("Serving Size", "serving", html, item);
        //valueSet = fillNutritionAmount("Calories Per Serving", "calories", html, item) || valueSet;
        //valueSet = fillNutritionAmount("Total Fat", "totalFat", html, item) || valueSet;
        //valueSet = fillNutritionAmount("Saturated Fat", "satFat", html, item) || valueSet;
        //valueSet = fillNutritionAmount("Trans Fat", "transFat", html, item) || valueSet;
        //valueSet = fillNutritionAmount("Cholesterol", "cholesterol", html, item) || valueSet;
        //valueSet = fillNutritionAmount("Sodium", "sodium", html, item) || valueSet;
        //valueSet = fillNutritionAmount("Total Carbohydrates", "totalCarbs", html, item) || valueSet;
        //valueSet = fillNutritionAmount("Sugar", "sugars", html, item) || valueSet;
        //valueSet = fillNutritionAmount("Protein", "protein", html, item) || valueSet;
        //valueSet = fillNutritionAmount("Fiber", "fiber", html, item) || valueSet;
    }

    var nutritionInfo = new NutritionInfo();
    self._clip = clipId;
    self._orderManager = orderManager;

    self.update = function () {
        self._amount = 0;
        if (self._clip) {
            var show = false;
            var orderManager = self._orderManager;

            // If there is at least one item.
            if (orderManager.currentOrder !== null && orderManager.currentOrder.ITEM.length > 0) {
                //var servingData = new NutritionSummaryData(self._nutritionClip, nutritionInfo.SERVING, "serving");
                var caloriesData = new NutritionSummaryData(self._nutritionClip, nutritionInfo.CALORIES, "calories", "nutritionTextCalories");
                var totalFatData = new NutritionSummaryData(self._nutritionClip, nutritionInfo.TOTALFAT, "totalFat", "nutritionTextTotalFat");
                var satFatData = new NutritionSummaryData(self._nutritionClip, nutritionInfo.SATFAT, "satFat", "nutritionTextSatFat");
                var transFatData = new NutritionSummaryData(self._nutritionClip, nutritionInfo.TRANSFAT, "transFat", "nutritionTextTransFat");
                var cholesterolData = new NutritionSummaryData(self._nutritionClip, nutritionInfo.CHOLESTEROL, "cholesterol", "nutritionTextCholesterol");
                var sodiumData = new NutritionSummaryData(self._nutritionClip, nutritionInfo.SODIUM, "sodium", "nutritionTextSodium");
                var totalCarbsData = new NutritionSummaryData(self._nutritionClip, nutritionInfo.TOTALCARBS, "totalCarbs", "nutritionTextTotalCarbs");
                var sugarsData = new NutritionSummaryData(self._nutritionClip, nutritionInfo.SUGARS, "sugars", "nutritionTextSugars");
                var proteinData = new NutritionSummaryData(self._nutritionClip, nutritionInfo.PROTEIN, "protein", "nutritionTextProtein");
                var fiberData = new NutritionSummaryData(self._nutritionClip, nutritionInfo.FIBER, "fiber", "nutritionTextFiber");

                //sum up the nutritional amounts for each value

                
                for (var i = 0; i < orderManager.currentOrder.ITEM.length; i++) {
                    //self.calcTotalNutritionForItem(orderManager.currentOrder.ITEM[i], servingData);
                    self.calcTotalNutritionForItem(orderManager.currentOrder.ITEM[i], caloriesData);
                    self.calcTotalNutritionForItem(orderManager.currentOrder.ITEM[i], totalFatData);
                    self.calcTotalNutritionForItem(orderManager.currentOrder.ITEM[i], satFatData);
                    self.calcTotalNutritionForItem(orderManager.currentOrder.ITEM[i], transFatData);
                    self.calcTotalNutritionForItem(orderManager.currentOrder.ITEM[i], cholesterolData);
                    self.calcTotalNutritionForItem(orderManager.currentOrder.ITEM[i], sodiumData);
                    self.calcTotalNutritionForItem(orderManager.currentOrder.ITEM[i], totalCarbsData);
                    self.calcTotalNutritionForItem(orderManager.currentOrder.ITEM[i], sugarsData);
                    self.calcTotalNutritionForItem(orderManager.currentOrder.ITEM[i], proteinData);
                    self.calcTotalNutritionForItem(orderManager.currentOrder.ITEM[i], fiberData);
                }

                //calculations are done! update the UI 
                //servingData.updateUI(self._nutritionClip);
                caloriesData.updateUI(self._nutritionClip);
                totalFatData.updateUI(self._nutritionClip);
                satFatData.updateUI(self._nutritionClip);
                transFatData.updateUI(self._nutritionClip);
                cholesterolData.updateUI(self._nutritionClip);
                sodiumData.updateUI(self._nutritionClip);
                totalCarbsData.updateUI(self._nutritionClip);
                sugarsData.updateUI(self._nutritionClip);
                proteinData.updateUI(self._nutritionClip);
                fiberData.updateUI(self._nutritionClip);

                //only showif all are found
                show = caloriesData.isFoundOnAllItems() &&
                totalFatData.isFoundOnAllItems() &&
                satFatData.isFoundOnAllItems() &&
                transFatData.isFoundOnAllItems() &&
                cholesterolData.isFoundOnAllItems() &&
                sodiumData.isFoundOnAllItems() &&
                totalCarbsData.isFoundOnAllItems() &&
                sugarsData.isFoundOnAllItems() &&
                proteinData.isFoundOnAllItems() &&
                fiberData.isFoundOnAllItems();
                //servingData.isFoundOnAllItems() &&

                self.debug("Show = " + show);

                if (!_nex.nutritionData) {
                    _nex.nutritionData = {};
                }

                _nex.nutritionData = {
                    NUTRITIONDATA: [
                        //servingData.write(),
                        caloriesData.write(),
                        totalFatData.write(),
                        satFatData.write(),
                        transFatData.write(),
                        cholesterolData.write(),
                        sodiumData.write(),
                        totalCarbsData.write(),
                        fiberData.write(),
                        sugarsData.write(),
                        proteinData.write()
                    ]
                };

            }

            if (!show) {
                self.debug("hiding nutritional summary because at least one item is missing the required nutrition information");
                self.hide();
            } else {
                self.show();
            }
        }
    };

    function getItemObject(itemData, attributeName) {
        var result = null;
        if (itemData) {
            var item = _nex.assets.theme.itemByPosid(itemData.posid);
            result = _nex.assets.theme.findItemAttribute(item, attributeName);
        } else {
            self.debug("Could not find attribute " + attributeName);
            self.debug("Item: ");
            self.debug(itemData);
        }
        return result;
    }


    self.calcTotalNutritionForItem = function (orderItem, summaryData) {

        // Get the item information, e.g. calories.
        var itemInfo = getItemObject(orderItem, summaryData.getName());
        if (itemInfo) {
            // Get the amount and quantity from the order item.
            var quantity = 1;
            var amount = itemInfo.value;
            if (orderItem.modquantity) {
                quantity = Number(orderItem.modquantity);
            }
            else if (orderItem.quantity) {
                quantity = Number(orderItem.quantity);
            }

            var lowRange = 0;
            var highRange = 0;
            //check for nutrition range
            if (amount.toString().indexOf("-") != -1) {
                var splitRange = amount.split("-");
                lowRange = Number(splitRange[0]);
                highRange = Number(splitRange[1]);
            } else {
                lowRange = Number(amount);
                highRange = Number(amount);
            }

            // Add to the running total.
            if (summaryData.addAmount(lowRange * quantity, highRange * quantity)) {
                // Take into consideration the mods.
                var mods = orderItem.ITEM;
                if (mods) {
                    for (var i = 0; i < mods.length; i++) {
                        // Recursive call for the mods.
                        self.calcTotalNutritionForItem(mods[i], summaryData);
                    }
                }
            } else {
                // Just in case a bad amount is in.
                summaryData.foundMissingItem();
            }
        } else {
            summaryData.foundMissingItem();
        }
    };

    self.hide = function () {
        $("#" + self._clip).hide();
    };

    self.show = function () {
        $("#" + self._clip).show();
    };
}

// Constructor. 
function NutritionSummaryData(clipId, name, uiName, uiHTML) {
    // Follows along with the Flash.
    var self = this;

    // Private properties.
    if (clipId) {
        self._clipId = clipId;
    } else if (_nex.context === "UX") {
        self._clipId = "clip-nutritionSummary";
    } else {
        self._clipId = "nutritionSummary";
    }

    if (name) {
        self._nutritionName = name;
    } else {
        self._nutritionName = "Total Calories";
    }

    if (uiName) {
        self._nutritionUiName = uiName;
    } else {
        self._nutritionUiName = "calories";
    }

    if (uiHTML) {
        self._nutritionUiHTML = uiHTML;
    } else {
        self._nutritionUiHTML = "";
    }

    self._lowRange = 0;
    self._highRange = 0;

    self._isFoundOnAllItems = true;
    self._isUiAvailable = true;

    // Public getters.
    self.getName = function () {
        return self._nutritionName;
    };
    self.getUiName = function () {
        return self._nutritionUiName;
    };
    self.getAmount = function () {
        return self._amount;
    };
    self.isFoundOnAllItems = function () {
        return self._isFoundOnAllItems;
    };
    self.isUiAvailable = function () {
        return self._isUiAvailable;
    };

    // Called as soon as an item is found missing nutrition information.
    self.foundMissingItem = function () {
        self._isFoundOnAllItems = false;
    };

    // Add/subtract from the running total.
    // Returns true if the value was added; otherwise, false.
    self.addAmount = function (lowRange, highRange) {
        var result = false;
        
        if (typeof lowRange === "number" && typeof highRange === "number") {
            if (!window.isNaN(lowRange) && !window.isNaN(highRange)) { // NaN is still a number in JavaScript, oddly
                if (window.isFinite(lowRange) && window.isFinite(highRange)) {
                    self._lowRange += lowRange;
                    self._highRange += highRange;
                    result = true;
                }
            }
        }
        return result;
    };

    // Refresh the UI/DOM.
    self.updateUI = function () {
        var rangeDivider = "-";
        // Write the amount out.
        if (_nex.kviReader && _nex.kviReader.jackedIn()) {
            rangeDivider = " to ";
        }

        // verify the element exists
        var nutritionElement = document.getElementById(self._nutritionUiHTML);

        if (nutritionElement !== null) {
            // if the low range and high range match, display the single value
           if (self._lowRange === self._highRange) {
               self._setNutritionField(self._nutritionUiHTML, self._lowRange.toFixed(0));
            }else{
               self._setNutritionField(self._nutritionUiHTML, self._lowRange.toFixed(0) + rangeDivider + self._highRange.toFixed(0));
            }
        }
    };

    // Helper method.
    self._setNutritionField = function (elementId, value) {
        var selector = "#" + self._clipId + " #" + elementId;
        var fieldText = $(selector);
        var escapedValue = htmlEscape(value);
        if (fieldText.length > 0) {
            fieldText.html(escapedValue); // escaped value
        } else {
            //console.debug("Could not find field " + selector);
        }
    };

    self.write = function () {
        var result = {};
        result.type = self._nutritionUiName;

        // if the low range and high range match, display the single value
        if (self._lowRange === self._highRange) {
            result.amount = self._lowRange;
        } else {
            // format the low/high range
            result.amount = self._lowRange + "-" + self._highRange;
        }

        // default values
        var attributeValue = "";
        switch (result.type) {
            case "calories":
                attributeValue = " cals";
                break;
            case "totalFat":
            case "satFat":
            case "transFat":
            case "totalCarbs":
            case "fiber":
            case "sugars":
            case "protein":
                attributeValue = " g";
                break;
            case "cholesterol":
            case "sodium":
                attributeValue = " mg";
                break;
            default:
                break;
        }
        // check for kiosktext.xml values
        result.amount += " " + _nex.assets.theme.getTextAttribute("RECEIPTTEXT", result.type, attributeValue);

        result.isfoundonallitems = self._isFoundOnAllItems;
        result.name = self._nutritionName;

        return result;
    };
}
/// <reference path="c:\projects\products\shared\javascript\nextep.commonjs\grunt\gruntfile.js" />
/**
 * Ordering phase.
 * @constructor
 * @param orderingParams - contains the theme and order manager
 */
function Ordering(orderingParams) {
    var self = this;
    if (orderingParams) {
        self.theme = orderingParams.theme;
        self.orderManager = orderingParams.orderManager || null;
    }
    ////self.alcoholEnabled = true; moved to common
    ////self.ageVerified = false;
    self.cancelled = false;
    self.currentMenuId = -1;
    self.pages_topindex = 0;
    self.pagination = "none";
    self.buttonfill = "partialbot";
    self.currentMenu = {};
    self.currentTemplateClass = "";
    self.menus = [];
    self.menustack = [];
    self.menuScrollIndex = 0;
    self.startMenu = 1;
    ////self.order = { "ITEM": [] }; the order object i on the Ordering phase for mobile and tracked by the order manager for UX
    ////self.totals = new TotalsModel();
    self.buttons = [];
    self.removeIndex = -1;
    self.removeDelta = 0;
    self.pending = false;
    self.orderUpdated = function () { }; // event fired when the order is updated
    self.pullDownShown = function () { };
    self.currentIButton = null;
    self.pulldownVisible = false;
    self.currentMenuBg = "";
    self.orderingModel = null;
    self.togo = true;
    self.dragalongtext = "";
    self.dragalongmedia = null;
    self.dragalongdesc = "";
    self.nutritionSummary = null;
    self.processingerrormessage = "";
    self.pfmCallback = null;

    // UX ONLY
    self.commandListener = null;
    self.isOrderReview = null; // to detect if we are on the order review screen, and if so, don't let the user pull down the receipt

    /**
     * @memberof Ordering
     */
    self.loadActions = function (buttonName) {

        var buttonNameParts = buttonName.split('-');
        if (buttonNameParts.length >= 3) {
            var buttonIndex = Number(buttonNameParts[2]);
            var buttonObj = self.buttons[buttonIndex];

            // assign the menu items to the next menu
            if (buttonObj !== null) {
                buttonObj.executeActions();
            }
        }
    };

    /**
     * @memberof Ordering
     */
    self.loadMenuAndButtons = function (menuId, buttonName, callback) {

        var buttonNameParts = buttonName.split('-');
        if (buttonNameParts.length >= 3) {
            var buttonIndex = Number(buttonNameParts[2]);
            var buttonObj = self.buttons[buttonIndex];

            // assign the menu items to the next menu
            self.menus[menuId - 1].MENUITEM = []; // remove the existing menu items
            self.menus[menuId - 1].MENUITEM = buttonObj.getMenuItems();

            self.loadMenu(menuId, callback);
        }
    };

    /**
     * @memberof Ordering
     */
    self.addItem = function () {
        self.loadMenu(self.startMenu);
    };

    /**
     * @memberof Ordering
     */
    self.loadMenu = function (menuId, callback) {
        self.isOrderReview = false;

        if (menuId === undefined) {
            menuId = self.startMenu;

            // goto the start menu or order review
            if ((self.order.ITEM !== undefined) &&
                (self.order.ITEM.length > 0)) {
                menuId = self.findOrderReview();
            }
        } else if (typeof (menuId) === "string") {
            menuId = isNaN(menuId) ? 1 : Number(menuId);
        }

        // reset scroll position so the first button on the next menu is visible
        // this also fixes the positioning of the top and bottom nav (need to confirm)
        $(window).scrollTop(0);

        // reset orderEvent
        self.orderUpdated = function () { };

        // determine if the next menu is order Order Review
        var isOrderReview = _nex.assets.templateManager.isOrderReview(self.menus[menuId - 1].template);
        if (_nex.context === "UX" && isOrderReview) {
            $("#receipt").attr('tabindex', 3);
        } else {
            $("#receipt").attr('tabindex', -1);
        }

        var nextMenu = self.menus[menuId - 1];
        // reset the menuStack if the menu is a startMenu
        if ((nextMenu.hasOwnProperty("startmenu") &&
            (nextMenu.startmenu.toString().toLowerCase() === "true")) ||
            (menuId === 1)) {
            if (_nex.context === "UX") {
                _nex.assets.theme.filter.clear();
            }

            self.startMenu = menuId;
            self.menustack = [];
            // send a message to the ordering service that the menu stack is being reset
            // this is done to reset things like combos
            if (_nex.context !== "UX") {
                _iorderfast.command.send(new _nex.commands.MenuStackReset()); // ignore the response
            } else {
                _nex.communication.send(new _nex.commands.MenuStackReset());
            }
        }

        self.currentMenuId = menuId;
        self.menustack.push(new MenuInfo(menuId));

        // reset iButton
        if (self.currentIButton !== null) {
            self.currentIButton.popover('destroy');
            self.currentIButton.removeClass("ibutton-showing");
            self.currentIButton = null;
        }

        // unload the current template
        if (self.currentMenu){
            _nex.assets.templateManager.templateUnloaded(self.currentMenu);
        }

        // make a copy of the menu
        // menu id in the json is base 1; the array of menus is base 0 so always subtract 1 from the menu id
        self.currentMenu = {};
        self.currentTemplateClass = "";
        self.menuScrollIndex = 0;

        $.extend(true, self.currentMenu, nextMenu);

        if (isOrderReview) {
            self.isOrderReview = true;
            self.executePFM();
        } else {
            self.loadTemplate();
        }

            $('#template').removeClass();
            $('#template').attr("class", "menu-" + self.currentMenuId.toString());
            if ((self.currentMenu.tag !== null) && (self.currentMenu.tag !== undefined)) {
                $('#template').addClass(self.currentMenu.tag.toString());
            }
            //Add class to targets for better menu manipulation.
            $('#targets').removeClass();
            $('#targets').attr("class", "menu-id-" + self.currentMenuId.toString());
            if ((self.currentMenu.tag !== null) && (self.currentMenu.tag !== undefined) && (self.currentMenu.tag !== "")) {
                $('#targets').addClass("menu-tag-" + self.currentMenu.tag.toString());
            }

        // inject the layout to allow the UX template to have more info on how to style a particular menu
        var templateDetail = _nex.assets.templateManager.findTemplate(self.currentMenu.template);
        if (templateDetail.hasOwnProperty("layout") &&
            templateDetail.layout.length) {
            var layouts = templateDetail.layout.split(" ");
            for (var i = 0; i < layouts.length; i++) {
                if (layouts[i].length > 0) {
                    $("#targets").addClass(layouts[i]);
                }
            }
        }

            if (isOrderReview) {
                $('#targets').addClass("order-review");
            }

        self.updateControlButtons();
        self.updateReceipt();

        _nex.tabManager.ordering();
        if (_nex.context === "UX") {
            // raise an event that the menu has changed; used by the UX previewer to know which menu we are on.
            var menuObject = {
                "menuId": self.currentMenuId,
                "menuName": self.currentMenu.title
            };
            window.parent.$('body').trigger('loadMenuEvent', menuObject);
            if (_nex.kviReader) {
                _nex.kviReader.ordering(); // bind so when tabable elements get focus, they get read
            }
            if (refreshOrderTimer) {
                refreshOrderTimer();
            }

        }




        if (callback !== undefined) {
            callback();
        }

        if (_nex.domFocus) {
            _nex.domFocus.focusOrderingHeader(); // focus on the first element
        }
    };


    self.orderUpdatedEvent = function () {
        _nex.assets.templateManager.executeBehavior(self.currentMenu);
        _nex.assets.templateManager.refreshButtons(self.currentMenu, self.buttons);
        self.updateControlButtons();
    };

    /**
     * @memberof Ordering
     */
    self.loadTemplate = function (callback) {

        // Reset.
        $('#header-text').empty();
        $('#menuDescription').empty();
        $('#template').empty();

        self.orderUpdated = self.orderUpdatedEvent;

        // Setup order updated event; load the header and menu description.
        if (_nex.context === "UX") {
            self.stopNudge();
            $('#header-text').append(self.theme.itemTextByType(self.currentMenu, "HEADER"));
            $('#menuDescription').append(itemFormatting.buttonText(self.theme.itemTextByType(self.currentMenu, "MENUDESCRIPTION")));

            // play voice over
            if(self.currentMenu.hasOwnProperty("voiceover") &&
                self.currentMenu.voiceover.length > 0) {
                _nex.assets.soundManager.playVoiceover(self.currentMenu.voiceover);
            }
        } else {
            $('#header-text').append(self.currentMenu.HEADER[0].headertext);
            $('#header-text').attr("tabindex", 1);
            if (self.currentMenu.MENUDESCRIPTION.length !== 0) {
                $('#menuDescription').append(itemFormatting.buttonText(self.currentMenu.MENUDESCRIPTION[0].menudescriptiontext));
            }
        }
        $('#header-text').attr("tabindex", 1);
        $('#menuDescription').attr("tabindex", 2);

        // Load advertisement.
        if (self.loadAd) {
            self.loadAd(self.currentMenu.ad, self.currentMenu.template);
        }

        // Load drag-a-long.
        self.loadDragALong(self.currentMenu.template);

    	// Get the template details.
        var templateDetail = _nex.assets.templateManager.findTemplate(self.currentMenu.template);

        // Add template buttons.
        $('#template').attr("class", "");

        self.pagination = "none";
        if (_nex.context === "UX" && templateDetail.hasOwnProperty("pagination")) {
        	self.pagination = templateDetail.pagination.toLowerCase();
        	//backwards compatability fix
        	if (self.pagination === "true") {
        		self.pagination = "moreforward";
        	}
        	if (self.pagination === "false") {
        		self.pagination = "none";
        	}
        }
        self.buttonfill = "partialbot";
        if (templateDetail.hasOwnProperty("buttonfill")) {
        	self.buttonfill = templateDetail.buttonfill.toLowerCase();
        }

        if (self.pagination !== "none") {
        	//turn off buttonfill,otherwise we have a very stupid looking menu
        	self.buttonfill = "partialbot";
        }


        if (self.pagination==="carousel") {
        	$('#template').append("<div id='buttonscarousel' class='carousel slide' data-interval='false' data-wrap='true' data-ride='carousel' ><div id='buttons' class='carousel-inner buttons' role='listbox'></div></div>");
        }
        else {
        	$('#template').append("<div id='buttons' class='buttons' ></div>");
        }
        var templateButtons = $('#template').find('#buttons');
        templateButtons.empty();

        // Get all the available buttons.
        self.buttons = self.getAvailableButtons();



        // Load any custom HTML and JavaScript if needed.


        // If we are in UX, and the template truly should have no buttons ...
        if ((_nex.context === "UX") && (!_nex.assets.templateManager.hasButtons(self.currentMenu))) {
            if (templateDetail.hasOwnProperty('buttonrendermode') &&
                (templateDetail.buttonrendermode.toLowerCase() === "asset")) {
            // asset button rendering - buttons are loaded from a specific file
            self._loadTemplateHtml(templateDetail, templateButtons);
        }
            // If we are in NEXTEP Mobile or UX, and there are buttons ...
            } else if (self.buttons.length > 0) {
                // Load those buttons.
                self._loadButtons(templateButtons, templateDetail);
                // If there aren't any buttons or custom HTML or JS ...
            } else {
                // Let the user know that there are no items are currently available.
                self._showNoItemsPopup();
            }
    };

    self._loadTemplateHtml = function (templateDetail, templateButtons) {
        // asset button rendering - buttons are loaded from a specific file
        var htmlFileName = templateDetail.name;
        if (templateDetail.hasOwnProperty("htmlsrc") &&
            (templateDetail.htmlsrc.length > 0)) {
            htmlFileName = templateDetail.htmlsrc;
        }
        if (htmlFileName.indexOf(".html") === -1) {
            htmlFileName += ".html";
        }

        self.theme.loadMedia("templates/" + htmlFileName, self.currentMenu.id, null, function (mediaId, data) {
            if (data !== null) {
                templateButtons.append(data);
                self._loadTemplateAssetButtons(templateDetail, templateButtons, self.buttons);
            } else {
                self._unableToLoadMenu();
            }
        });
    };

    /**
     * Used by loadTemplate to show all the menu buttons.
     * @memberof Ordering
     */
    self._loadButtons = function (templateButtons, templateDetail) {
    	// load buttons
    	var buttonCount = 0;
    	var rowCount = -1;
    	var rowId = "";
    	var visibleButtons = 0;

    	var loadButtons = true;
    	// if there is only one button determine if menu can be auto advanced
    	if ((self.buttons.length === 1) &&
            (self.theme.system.USERINTERFACE.autoselectmenu.toLowerCase() == "true")) {
    		// do not allow the button loop on to itself
    		if ((self.buttons[0].name === "MENUBUTTON") && (self.buttons[0].nextMenu !== self.currentMenuId)) {
    			loadButtons = false;

    			self.menustack[self.menustack.length - 1].skipped = true;
    			self.loadMenu(self.buttons[0].nextMenu());
    		} else if (self.buttons[0].name === "SELECTONEMODIFIER") {
    			loadButtons = false;
    			self.menustack[self.menustack.length - 1].skipped = true;
    			self.addToOrder(self.buttons[0].item.posid, self.buttons[0].priceLevel(), self.buttons[0].buttonName, self.buttons[0].nextMenu());
    		}
    	}

    	if (loadButtons &&
            (self.currentMenuId === 1)) {
    		// if menu 1 look to see if a menubutton test was passed as part of the query string
    		if (_nex.hasOwnProperty("parameters") &&
                _nex.parameters.hasOwnProperty("menubutton") &&
                (_nex.parameters.menubutton.length > 0)) {

    			// look to see if the button text of any of the buttons matches the menubutton parameter
    			for (var b = 0; (b < self.buttons.length) && loadButtons; b++) {
    				if (self.buttons[b].buttonText().toLowerCase().indexOf(_nex.parameters.menubutton.toLowerCase()) > -1) {

    					loadButtons = false;

    					self.menustack[self.menustack.length - 1].skipped = true;
    					self.loadMenu(self.buttons[b].nextMenu());
    				}
    			}
    		}
    	}

    	if (loadButtons) {

    		var buttonsPerRow = _nex.assets.templateManager.getColumnCount(self.currentMenu.template, self.buttons.length);

    		// add the template name as a css classname
    		templateButtons.addClass(self.currentMenu.template.replace(/ /g, "-") + "-buttons");

    		if (templateDetail !== null) {
    			self.currentTemplateClass = templateDetail.classname || "";

    			if (templateDetail.hasOwnProperty('buttonrendermode') &&
                    (templateDetail.buttonrendermode.toLowerCase() === "asset")) {
    				self._loadTemplateHtml(templateDetail, templateButtons);
    			} else {
    				// determine if pagination is being used
    				var maxButtons = templateDetail.hasOwnProperty("maxbuttons") ? Number(templateDetail.maxbuttons) : -1;
    				var hideRows = false;
    				var pageNumber = 0;
    				// pre-process buttons to insert the more button
    				self._paginateButtons(maxButtons, templateDetail);

					// partial top is the fill method where it's an upside down pyramid
    				var modus = 0;
    				if (self.buttonfill === "partialtop") {
    					modus = (Math.round(self.buttons.length % buttonsPerRow)) - 1;
    					if (modus <= 0) modus = buttonsPerRow;
    				}

					// Append a separate div with the page number
    				if (self.pagination === "carousel" && pageNumber === 0) {
    					if (!$("#pagin" + pageNumber).length){
    						templateButtons.append("<div id='pagin" + pageNumber + "' class='active item'></div>");
    					}
    				}

    				for (var i = 0; (i < self.buttons.length) ; i++) {
						//This creates the rows
    					if ((rowCount === -1) || (buttonCount >= buttonsPerRow) || (self.buttonfill === "partialtop" && (buttonCount > modus && rowCount <= 0))) {
    						//check if we are in "partialtop" buttonfill mode, if so, put the least number of buttons up top and flow down
    						rowCount++;
    						buttonCount = 0;
    						rowId = "row" + rowCount;
    						if (self.pagination !== "carousel") {
    							var rowVisiblity = (hideRows) ? "row-hidden" : "";
    							templateButtons.append("<div id='" + rowId + "' class='row row-centered " + rowVisiblity + "' data-pagenumber=" + pageNumber + " ></div>");
    						}
    						else {
    							$("#pagin" + pageNumber).append("<div id='" + rowId + "' class='row row-centered' data-pagenumber=" + pageNumber + " ></div>");
    						}
    					}

    					var buttonName = "button" + "-" + rowCount + "-" + i.toString();
    					buttonCount++;
    					var button = self.buttons[i];
    					button.descriptionType = (templateDetail.hasOwnProperty("descriptiontype") && (templateDetail.descriptiontype.length > 0)) ? templateDetail.descriptiontype : "i-button";
    					button.loadButton(buttonName);

    					//populate rows with the button
    					if (button.html !== null) {
    						button.html.addClass("col-" + buttonCount.toString());
    						button.html.appendTo('#' + rowId);
    					}

    				    if(button.name !== "BLANK"){
    					    visibleButtons++;
    				    }
    				    //console.log("button.name : " + button.name);
    					//if we hit a "more" button force a new page
    					if (button.name === "MORE") {
    				    	pageNumber++;
    				    	buttonCount = buttonsPerRow; // make sure the next time through the loop it creates a new row
    						//button.html.removeClass("right carousel-control");
    						//if (self.pagination === "carousel") {
    						//	button.html.addClass("right carousel-control");
    						//}
    						//console.log("MORE BUTTON DETECTED, NEW PAGE " + pageNumber);
    						hideRows = true;
    						self.pages_topindex = pageNumber;

    						if (self.pagination === "carousel") {
    							if (i < self.buttons.length-1) {
    								if (!$("#pagin" + pageNumber).length) {
    									templateButtons.append("<div id='pagin" + pageNumber + "' class='item' data-pagenumber=" + pageNumber + "></div>");
    								}
    							}
    						}
    					}
    				}

    				//console.log("ordering._loadButtons - pagination: [" + self.pagination + "]");
    				if ((self.pagination.toLowerCase() === "false") ||
                        (self.pagination.toLowerCase() === "none") ||
                        (self.pagination.length === 0)) {
    				    $('#template').attr("data-button-count", visibleButtons.toString());
                    }

    				self._showPage();

    				// update the menustack with the posids for mod on the current item
    				var current = self.currentItem();
    				if ((current !== null) && (current.ITEM !== undefined)) {
    					for (var m = 0; m < current.ITEM.length; m++) {
    						if (current.ITEM[m].menuid === self.currentMenu.id) {
    							self.menustack[self.menustack.length - 1].posids.push(current.ITEM[m].posid);
    						}
    					}
    				}
    			}
    		} else {
    			var gotoSplash = (self.currentMenuId === self.startMenu);
    			var templateErrorProp = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
    			templateErrorProp.message = _nex.assets.theme.getTextAttribute("ORDERING", "loadmenuerror", "Sorry, unable to load menu.");
    			_nex.assets.popupManager.showPopup(templateErrorProp, function () {
    				if (gotoSplash) {
    					if (_nex.context === "UX") {
    						_nex.manager.cancelCurrentPhase();
    					} else {
    						_iorderfast.nav.loadContent("splash");
    					}
    				} else {
    					self.goBack();
    				}
    			});
    		}

    		// load menu background
    		if (self.currentMenu.menubg.length > 0) {
    			// only change the menubg if it is different
    			if (self.currentMenuBg !== self.currentMenu.menubg) {
    				self.currentMenuBg = self.currentMenu.menubg;
    				// set the background-image on the #ordering target so the image is behind all content
    				if (inPreviewer()) {
    					$("#ordering").attr("style", "background-image: url('../Media.aspx?media=other/" + self.currentMenuBg + "');");
    				} else {
    					if (_nex.context === "UX") {
    						var url = _nex.assets.theme.mediaPath() + "other/" + self.currentMenuBg;
    						$("#ordering").attr("style", "background-image: url('" + url + "');");
    					} else {
    						$("#ordering").attr("style", "background-image: url('themes/" + _iorderfast.assets.theme.id + "/media/other/" + self.currentMenuBg + "');");
    					}
    				}
    			}
    		} else {
    			$("#ordering").attr("style", "background-image: none");
    		}

    		// update the menu stack with modifiers that are on the order
    		var currentMenuStackIndex = (self.menustack.length - 1);
    		//console.debug("self.currentMenu : " + JSON.stringify(self.currentMenu));
    		_nex.assets.templateManager.templateLoaded(self.currentMenu);
    	}

    };

    self._createMoreButton = function (templateDetail) {
    	// create a new more button
    	var moreButton = new _nex.assets.buttons.More();
    	if (templateDetail.hasOwnProperty("morebuttonid") &&
			templateDetail.morebuttonid.length > 0) {
    		moreButton.templateButtonName(templateDetail.morebuttonid);
    	} else {
    		//console.log("MISSING MORE BUTTON IN TEMPLATE");
    	}
    	return moreButton;
    };

    self._paginateButtons = function (maxButtons, templateDetail) {
    	//console.debug("maxButtons : " + maxButtons + "; self.pagination: " + self.pagination + "; self.buttons.length: " + self.buttons.length);
    	//console.debug("self.buttons : " + JSON.stringify(self.buttons, null, 2));
    	var morebuttonCount = 0;

    	if (self.pagination !== "none") {
    		var newArray = [];

    		var buttonsSoFar = 0;
    		for (var i = 0; i < self.buttons.length; i++) {
    			try {
    				newArray.push(self.buttons[i]);
    				buttonsSoFar++;

					// if we are at the right number of buttons, or we are on the last page, add a more button
    				if (buttonsSoFar === maxButtons - 1) {
    					newArray.push(self._createMoreButton(templateDetail));
    					morebuttonCount++;
    					buttonsSoFar = 0;
    				} else if ((self.pagination === "carousel") && (i === self.buttons.length - 1)) {
    					//console.debug("Last button case");
    					if (buttonsSoFar > 0) {
    						newArray.push(self._createMoreButton(templateDetail));
    						morebuttonCount++;
    				}
    				}
    			}
    			catch (err) {
    				console.debug("Error : " + err.message);
    				return;
    			}
    		}
    		self.buttons = newArray;

    	}

    };


    /**
     * Used by loadTemplate to show no items are currently available.
     * @memberof Ordering
     */
    self._showNoItemsPopup = function () {
        var errorProp = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
        var popupClosed = false;
        // if there is a continue menu then goto the next menu
        // otherwise show an error when no buttons are available
        if (self.currentMenu.continuemenu.length > 0) {
            self.menustack[self.menustack.length - 1].skipped = true;
            self.loadMenu(Number(self.currentMenu.continuemenu));
        } else if (self.currentMenuId === self.startMenu) {
            // go to the splash
            errorProp.message = _nex.assets.theme.getTextAttribute("ORDERING", "noitemserrortrylater","Sorry, no items are currently available. Please try again later.");
            _nex.assets.popupManager.showPopup(errorProp, function () {
                if (_nex.context === "UX") {
                    if (!popupClosed) {
                        popupClosed = true;
                        _nex.manager.cancelCurrentPhase();
                    }
                } else {
                    _iorderfast.nav.loadContent("splash");
                }
            });
        } else {
            // go back one menu
            errorProp.message = _nex.assets.theme.getTextAttribute("ORDERING", "noitemserror", "Sorry, no items are currently available.");
            _nex.assets.popupManager.showPopup(errorProp, function () {
                self.goBack();
            });
        }
    };

    // load each button of a template based on what is in html
    self._loadTemplateAssetButtons = function (templateDetail, templateHtml, buttons) {
        var buttonCount = 0;
        for (var i = 0; (i < self.buttons.length) ; i++) {
            var buttonName = "button-0-" + i.toString();

            var button = self.buttons[i];
            var buttonHtml = templateHtml.find("#" + buttonName);
            buttonHtml.show();
            button.descriptionType = (templateDetail.hasOwnProperty("descriptiontype") && (templateDetail.descriptiontype.length > 0)) ? templateDetail.descriptiontype : "i-button";
            button.loadButton(buttonName, buttonHtml);
        }

        // hide buttons that are skipped
        var maxButtons = 0;
        if (templateDetail.hasOwnProperty("maxbuttons")) {
            maxButtons = Number(templateDetail.maxbuttons);

            var skipped = maxButtons - buttons.length;
            if (skipped > 0) {
                for (var i = buttons.length; i <= (buttons.length + skipped) ; i++) {
                    var skipButtonName = "button-0-" + i.toString();
                    var skipButtonHtml = templateHtml.find("#" + skipButtonName);
                    skipButtonHtml.hide();
                }
            }
        }

        _nex.assets.templateManager.templateLoaded(self.currentMenu);
    };

    self._unableToLoadMenu = function () {

        var gotoSplash = (self.currentMenuId === self.startMenu);
        var templateErrorProp = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
        templateErrorProp.message = "Sorry, unable to load menu.";
        _nex.assets.popupManager.showPopup(templateErrorProp, function () {
            if (gotoSplash) {
                _nex.manager.cancelCurrentPhase();
                //_iorderfast.nav.loadContent("splash"); TODO - update NEXTEP Mobile
            } else {
                self.goBack();
            }
        });
    };

    /**
     * @memberof Ordering
     */
    self.gotoNextMenu = function () {

        var continueMenuId = self.startMenu;

        if ((self.currentMenu.continuemenu !== undefined) &&
                (self.currentMenu.continuemenu.toString().length > 0)) {
            continueMenuId = self.currentMenu.continuemenu;
        }

        if ((self.currentMenu.upsell !== undefined) &&
            (self.currentMenu.upsell.toLowerCase() === "true") &&
            (self.menustack[self.menustack.length - 1].posids.length === 0)) {

            if ((self.currentMenu.nothanksmenu !== undefined) &&
                (self.currentMenu.nothanksmenu.toString().length > 0)) {
                continueMenuId = self.currentMenu.nothanksmenu;
            }
        }

        self.loadMenu(continueMenuId);
    };

    // update the menu scroll index when the guest touches the "MORE" button
    self.scrollMenu = function () {
        self.menuScrollIndex++;
        self._showPage();
    };

    // hide/show the appropriate rows based on the current scroll index
    self._showPage = function () {

        self.menustack[self.menustack.length - 1].scrollIndex = self.menuScrollIndex;

        if (self.pagination !== "carousel") {
        	var rowId = 0;
        	var rowHtml = $("#row" + rowId);
        	while (rowHtml.length > 0) {
        		if (rowHtml.data("pagenumber") === self.menuScrollIndex) {
        			rowHtml.removeClass("row-hidden");
        		} else {
        			rowHtml.addClass("row-hidden");
        		}
        		rowId++;
        		rowHtml = $("#row" + rowId);
        	}
        } else {
        	//console.debug("self._showPage; self.menuScrollIndex: " + self.menuScrollIndex + " ;self.pages_topindex: " + self.pages_topindex);
        	if (self.menuScrollIndex > self.pages_topindex || !$("#pagin" + self.menuScrollIndex).length) {
        		$('#template').find('#buttonscarousel').carousel(0);
        		self.menuScrollIndex = 0;
        		//$('#template').find('#buttonscarousel').carousel("next");

        	}
        	else {
        		$('#template').find('#buttonscarousel').carousel(self.menuScrollIndex);
        	}
        }


        self.updateControlButtons();
    };

    /**
     * @memberof Ordering
     */
    self.goBack = function () {
    	if (self.pagination === "carousel") {
    		self.menuScrollIndex = 0;
    	}
    	if (!self.pending) {
    	    if (self.menuScrollIndex > 0) {
    	        self.menuScrollIndex--;
    	        if (self.menuScrollIndex < 0) {
    	            self.menuScrollIndex = 0;
    	        }
    	        self._showPage();
    	    } else {
    	        var gotoStart = false;

    	        if (self.menustack.length > 0) {
    	            // remove current menu
    	            var menuInfoObj = self.menustack.pop();
    	            var index = -1;

    	            // remove many modifiers/item
    	            var waitForRemove = false;
    	            var menuRemoved = self.menus[menuInfoObj.menuId - 1];
    	            var template = _nex.assets.templateManager.findTemplate(menuRemoved.template);

    	            if (template !== null) {

    	                if (_nex.context === "UX") {
    	                    if ((!template.itemtype || template.itemtype.length === 0)) {

    	                        if (template.hasOwnProperty("classname") &&
                                    (template.classname.toLowerCase() === "selectmanyofnintegratedflavor")) {
    	                            template.itemtype = "modifier";
    	                        } else {
    	                            template.itemtype = "item";
    	                        }
    	                    }
    	                }

    	                if ((template.defaultbuttontype === "SELECTMANYMODIFIER") ||
                            (template.defaultbuttontype === "SELECTNE") ||
                            (template.defaultbuttontype === "LESSMORE") ||
                            ((template.defaultbuttontype === "SELECTONEQUANTITY") &&
                                template.hasOwnProperty("itemtype") &&
                                (template.itemtype.toLowerCase() !== "item"))) {

    	                    // remove all mods on the current item which is the last on the order
    	                    if (self.order.ITEM !== undefined) {
    	                        index = self.order.ITEM.length - 1;
    	                        waitForRemove = true;
    	                        self.removeMods(menuRemoved.id, index, function () {
    	                            self.removePreviousMenu();
    	                        });
    	                    }

    	                } else if ((template.defaultbuttontype === "SELECTMANYITEM") ||
                                    ((template.defaultbuttontype === "SELECTONEQUANTITY") &&
                                     template.hasOwnProperty("itemtype") &&
                                     (template.itemtype.toLowerCase() === "item"))) {
    	                    waitForRemove = true;
    	                    self.removeItemsByMenu(menuRemoved.id, function () {
    	                        self.removePreviousMenu();
    	                    });
    	                }

    	                if (!waitForRemove) {
    	                    self.removePreviousMenu();
    	                }
    	            } else {
    	                gotoStart = true;
    	            }
    	        } else {
    	            gotoStart = true;
    	        }

    	        if (gotoStart) {
    	            // return the start menu
    	            if (self.currentMenuId !== self.startMenu) {
    	                self.loadMenu(self.startMenu);
    	            } else {
    	                // navigate away from the ordering process
    	                if (_nex.context === "UX") {
    	                    _nex.manager.cancelCurrentPhase();
    	                } else {
    	                    _iorderfast.nav.loadContent('splash');
    	                }
    	            }
    	        }
    	    }
    	}
    };

    /**
     * @memberof Ordering
     */
    self.currentItem = function () {
        var current = null;
        if ((self.order.ITEM !== undefined) &&
            (self.order.ITEM.length > 0)) {
            current = self.order.ITEM[self.order.ITEM.length - 1];
        }
        return current;
    };

    /**
     * @memberof Ordering
     */
    self.currentItemIndex = function () {
        var index = -1;
        if ((self.order.ITEM !== undefined) &&
            (self.order.ITEM.length > 0)) {
            index = (self.order.ITEM.length - 1);
        }
        return index;
    };

    /**
     * Used by buttons like SelectNE and SelectOther
     * @memberof Ordering
     */
    self.isOnCurrentItem = function (posid) {
        var found = false;
        var currentItem = self.currentItem();
        for (var i = 0; (i < currentItem.ITEM.length) && !found; i++) {
            found = (currentItem.ITEM[i].posid === posid);
        }
        return found;
    };

    /**
     * @memberof Ordering
     */
    self.over21 = function (isOver21) {
        self.order.ageVerified = isOver21; // for ux the order object has been moved
    };

    /**
     * @memberof Ordering
     */
    self.ageVerificationPrompt = function (menuId) {
        // show age verification popup
        var ageVerifyProp = $.extend(true, {}, _nex.assets.popupManager.ageVerificationPopup);
        ageVerifyProp.header = _nex.assets.theme.getTextAttribute("AGEVERIFICATION", "title", "VERIFY YOUR AGE");

        var disclaimerKioskText = _nex.assets.theme.getTextAttribute("DISCLAIMER", "alcohol", "");

        if (disclaimerKioskText) {
            ageVerifyProp.message = itemFormatting.buttonText(disclaimerKioskText);
        }
        else {
            ageVerifyProp.message = itemFormatting.buttonText(_nex.assets.theme.getFileTextAttribute("AlcoholDisclaimer", "Are you old enough to purchase alcohol?"));
        }

        ageVerifyProp.buttons[0].clickEvent = "_nex.ordering.over21(true)";
        ageVerifyProp.buttons[1].clickEvent = "_nex.ordering.over21(false)";
        _nex.assets.popupManager.showPopup(ageVerifyProp, function () {
            if (self.order.ageVerified) {
                self.loadMenu(menuId);
            }
        });
    };

    /**
     * @memberof Ordering
     */
    self.addAlcoholToOrder = function (posid, priceLevel, buttonName, nextMenu, callback) {

        if (!self.pending) {
            if (!self.order.ageVerified) {
                // show age verification popup
                var ageVerifyProp = $.extend(true, {}, _nex.assets.popupManager.ageVerificationPopup);
                ageVerifyProp.header = _nex.assets.theme.getTextAttribute("AGEVERIFICATION", "title", "VERIFY YOUR AGE");

                var disclaimerKioskText = _nex.assets.theme.getTextAttribute("DISCLAIMER", "alcohol", "");

                if (disclaimerKioskText) {
                    ageVerifyProp.message = itemFormatting.buttonText(disclaimerKioskText);
                }
                else {
                    ageVerifyProp.message = itemFormatting.buttonText(_nex.assets.theme.getFileTextAttribute("AlcoholDisclaimer", "Are you old enough to purchase alcohol?"));
                }

                ageVerifyProp.buttons[0].clickEvent = "_nex.ordering.over21(true)";
                ageVerifyProp.buttons[1].clickEvent = "_nex.ordering.over21(false)";
                _nex.assets.popupManager.showPopup(ageVerifyProp, function () {
                    if (self.order.ageVerified) {
                        self.addToOrder(posid, priceLevel, buttonName, nextMenu, callback);
                    }
                });
            } else {
                self.addToOrder(posid, priceLevel, buttonName, nextMenu, callback);
            }
        }
    };

    /**
     * @memberof Ordering
     */
    self.loadDragALong = function (templateName) {
        var templateDetail = _nex.assets.templateManager.findTemplate(templateName);
        if ((templateDetail !== null) &&
            templateDetail.hasOwnProperty("displaydragalong") &&
            (templateDetail.displaydragalong.toString().toLowerCase() == "true") &&
            (self.dragalongtext.length > 0)) {

            // create an ad target
            $('#template').append("<div id='dragalong' ></div>");
            var dragalongTarget = $('#template').find('#dragalong');
            if (self.dragalongmedia !== null) {
                if (_nex.context === "UX") {
                    if (inPreviewer()) {
                        var url = "../Media.aspx?media=banners/" + self.dragalongmedia;
                        dragalongTarget.attr("style", "background-image: url('" + url + "');");
                    } else {
                        var url = self.theme.mediaRootUri;
                        if (self.theme.mediaRootUri.toLowerCase().indexOf(self.theme.id.toLowerCase()) === -1) {
                            url += "/" + self.theme.id;
                        }
                        url += "/media/banners/" + self.dragalongmedia;
                        dragalongTarget.attr("style", "background-image: url('" + url + "');");
                    }
                } else {
                    dragalongTarget.attr("style", "background-image: url('" + self.theme.mediaRootUri + "/" + self.theme.id + "/media/banners/" + self.dragalongmedia + "');");
                }
            }

            dragalongTarget.append("<div id='dragalongtext'>" + self.dragalongtext + "</div>");
            dragalongTarget.append("<div id='dragalongdesc'>" + self.dragalongdesc + "</div>");

            var classNames = "dragalong";
            if (templateName !== undefined) {
                classNames += " " + templateName.replace(/ /g, "-") + "-dragalong";
            }
            dragalongTarget.attr("class", classNames);

            $('#template').append(dragalongTarget);
        }
    };

    /**
     * @memberof Ordering
     */
    self.setDragALong = function (buttonName, callback) {

        var templateDetail = _nex.assets.templateManager.findTemplate(self.currentMenu.template);
        if ((templateDetail !== null) &&
            templateDetail.hasOwnProperty("setdragalong") &&
            (templateDetail.setdragalong.toString().toLowerCase() == "true") &&
            (buttonName !== undefined)) {
            var buttonNameParts = buttonName.split('-');
            if (buttonNameParts.length >= 3) {
                var buttonIndex = Number(buttonNameParts[2]);
                var buttonObj = self.buttons[buttonIndex];

                // assign the menu items to the next menu
                if (buttonObj !== null) {
                    self.dragalongtext = buttonObj.buttonText();
                    self.dragalongdesc = buttonObj.descriptionText();
                    self.dragalongmedia = buttonObj.image();

                    // console.log("drag-a-long text: " + self.dragalongtext);
                }
            }
        }
    };

    /**
     * @memberof Ordering
     */
    self.sortButtonTextOrder = function (item1, item2) {
        if (item1.hasOwnProperty("sortvalue") && item2.hasOwnProperty("sortvalue")) {
            var sortValue1 = item1.sortvalue;
            var sortValue2 = item2.sortvalue;

            // if both sort values are numbers then cast values to a number so they sort correctly
            if (!isNaN(sortValue1) && !isNaN(sortValue2)) {
                sortValue1 = Number(sortValue1);
                sortValue2 = Number(sortValue2);
            }

            if (sortValue1 < sortValue2) {
                return -1;
            } else if (sortValue1 > sortValue2) {
                return 1;
            } else {
                return 0;
            }
        } else {
            return -1; // not sorted
        }
    };

    /**
     * @memberof Ordering
     */
    self.getButtonInfo = function (buttonName) {

        var buttonInfo = {};
        if (buttonName !== undefined) {
            var buttonNameParts = buttonName.split('-');
            if (buttonNameParts.length >= 3) {
                var buttonIndex = Number(buttonNameParts[2]);
                var buttonObj = self.buttons[buttonIndex];

                // assign the menu items to the next menu
                if (buttonObj !== null) {
                    buttonInfo = buttonObj.buttonInfo();
                }
            }
        }

        return buttonInfo;
    };

    /**
     * @memberof Ordering
     */
    self.addManyModifier = function (posid, priceLevel, buttonName, callback) {

        var button = $("#" + buttonName);
        if (button.length > 0) {

            var buttonNameParts = buttonName.split('-');
            var buttonIndex = Number(buttonNameParts[2]);
            var buttonObj = self.buttons[buttonIndex];

            var itemType = button.data("item-type");
            if (itemType === "modifier") {
                self.addToOrder(posid, priceLevel, undefined, undefined, callback);
            } else {
                if (button.data("state") === "up") {
                    self.addToOrder(posid, priceLevel, undefined, undefined, callback);
                } else {
                    self.removeFromOrder(posid, callback);
                }
            }

            var checkMark = button.find('#check');

            if (button.data("state") === "up") {
                button.data("state", "down");
                button.addClass("button-down-state");
                if (checkMark.length > 0) {
                    checkMark.removeClass("button-many-unselected");
                    checkMark.addClass("button-many-selected");
                }
            } else {
                button.data("state", "up");
                button.removeClass("button-down-state");
                if (checkMark.length > 0) {
                    checkMark.removeClass("button-many-selected");
                    checkMark.addClass("button-many-unselected");
                }
            }

            buttonObj.update();
        }
    };

    /**
     * @memberof Ordering
     */
    self.updateMultiState = function (posid, priceLevel, buttonName, event, callback) {
        //console.debug("updateMultiState - posid: " + posid + "; priceLevel: " + priceLevel + "; button: " + buttonName);
        refreshOrderTimer();
        if ((event !== null) && (event.stopPropagation !== undefined)) event.stopPropagation();
        var buttonNameParts = buttonName.split('-');
        if (buttonNameParts.length >= 3) {
            var buttonIndex = Number(buttonNameParts[2]);
            var buttonHtml = $("#" + buttonName);
            var buttonObj = self.buttons[buttonIndex];

            if (buttonHtml.data("active-posid") !== posid) {
                self.substituteModifier(buttonObj, buttonIndex, posid, priceLevel, undefined, undefined, undefined, callback);
            }

            buttonObj.click(posid, priceLevel, buttonName);
        }
    };

    /**
     * Set special instructions on a specific item.
     * @memberof Ordering
     */
    self.updateComment = function (orderItemIndex, comment) {
        _iorderfast.command.send(new _nex.commands.UpdateComment(orderItemIndex, comment), function (data) {
            var result = JSON.parse(data);
            //if (result.success === "true") {
            // NOT SETUP IN UX YET... For UX use responseReceived; for iorderfast use success
            //}
            //if (result.responseReceived === "true") {

            //}
        });
    };

    /**
     * @memberof Ordering
     */
    self.getAvailableFilteredMenuItems = function (filterAtributesList, itemClassId, buttonItemType, priceLevel, selectRecipe, selectSuggested) {

        var items = [];
        var startingItems = _nex.assets.theme.items;

        if (!priceLevel) {
            priceLevel = "";
        }

        //console.log("class id: " + itemClassId + "; attr list: " + filterAtributesList.length + ", priceLevel: " + priceLevel.toString() + ", selectRecipe " + selectRecipe.toString() + ", selectSuggested: " + selectSuggested.toString());

        if (selectRecipe || selectSuggested) {

            var currentItem = "";
            if (_nex.context === "UX") {
                currentItem = _nex.orderManager.currentOrder.currentItem();
            } else {
                currentItem = self.currentItem();
            }
            if (currentItem) {

                startingItems = []; // make a new array for the starting items

                if (selectRecipe) {
                    var currentItemWithRecipes = _nex.assets.theme.itemByPosid(currentItem.posid);
                    var recipesArray = [];
                    var recipes = currentItemWithRecipes.RECIPE;

                    if (recipes) {
                        if (!Array.isArray(recipes)) {
                            recipesArray.push(recipes);
                        }
                        else {
                            recipesArray = recipes;
                        }

                        for (var ri = 0; ri < recipesArray.length; ri++) {
                            var recipeItem = _nex.assets.theme.itemByPosid(recipesArray[ri].posid);
                            if (recipeItem) {
                                startingItems.push(recipeItem);
                            }
                        }
                    }
                }

                if (selectSuggested) {
                    var currentItemWithSuggested = _nex.assets.theme.itemByPosid(currentItem.posid);
                    var suggestedArray = [];
                    var suggesteds = currentItemWithSuggested.SUGGESTED;

                    if (suggesteds) {
                        if (!Array.isArray(suggesteds)) {
                            suggestedArray.push(suggesteds);
                        }
                        else {
                            suggestedArray = suggesteds;
                        }

                        for (var si = 0; si < suggestedArray.length; si++) {
                            var suggestedItem = _nex.assets.theme.itemByPosid(suggestedArray[si].posid);
                            if (suggestedItem) {
                                startingItems.push(suggestedItem);
                            }
                        }
                    }
                }
            }
            else {
                console.log("There is no current item. selectRecipe and selectSuggested menu genie options require a current item to work");
            }
        }


        if ((filterAtributesList.length > 0) || (itemClassId.length > 0)) {
            var item = {};


            //get the first filter and search for items that match it
            var filtername = "";
            var filtervalue = "";
            var filterOperator = "";
            var attributeIndex = 0;

            //console.log(filtername + "-" + filterOperator + "-" + filtervalue);

            var foundItemsList = [];

            if (itemClassId.length > 0) {
                foundItemsList = self.theme.itemsByClassId(startingItems, itemClassId);
            } else if (filterAtributesList.length > 0) {
                filtername = filterAtributesList[attributeIndex].name.toString();
                filtervalue = filterAtributesList[attributeIndex].value.toString();
                filterOperator = filterAtributesList[attributeIndex].operator;
                if (filterOperator === undefined) { filterOperator = "Equals"; }
                foundItemsList = self.theme.itemsByAttribute(startingItems, filtername, filtervalue, filterOperator);
                attributeIndex++;
            }

            //console.log("items found: " + foundItemsList.length);
            //for each item that matched  the first filter, loop through and:
            //1. compare against the rest of the filters
            //2. make sure the item is available
            for (var j = 0; j < foundItemsList.length; j++) {
                var containsAllFilters = true;

                item = foundItemsList[j];

                //make sure the itemtype matches the itemtype of the button
                if ((item.DETAIL.itemtype.toString().toLowerCase() !== buttonItemType.toLowerCase()) &&
                    (buttonItemType.length > 0)) {
                    containsAllFilters = false;
                }

                //loop through all filters or until a filter is not found for this item.
                for (var i = attributeIndex; i < filterAtributesList.length && containsAllFilters; i++) {
                    filtername = filterAtributesList[i].name;
                    filtervalue = filterAtributesList[i].value;
                    filterOperator = filterAtributesList[i].operator;
                    if (filterOperator === undefined) { filterOperator = "equals"; }

                    //console.log(filtername + "-" + filterOperator + "-" + filtervalue);

                    var attr = self.theme.findItemAttribute(item, filtername);
                    if (attr === null) {
                        containsAllFilters = false;
                    }
                    else {
                        if (filterOperator.toLowerCase() === "equals") {
                            if (attr.value !== filtervalue) {
                                containsAllFilters = false;
                            }
                        }
                        else if (filterOperator.toLowerCase() === "not equal") {
                            if (attr.value === filtervalue) {
                                containsAllFilters = false;
                            }
                        }
                    }
                }

                //make sure pricelevel exists on the item if a price level exists
                if (containsAllFilters && priceLevel !== "") {
                    var priceLevelFound = false;
                    for (var p = 0; p < item.PRICELEVEL.length && !priceLevelFound; p++) {
                        priceLevelFound = (item.PRICELEVEL[p].name === priceLevel);
                    }
                    containsAllFilters = priceLevelFound;
                }

                if (containsAllFilters && self.theme.itemIsAvailable(item.posid)) {
                    items.push(item);
                }
            }

            return items;
        }
        else if (selectSuggested || selectRecipe) {
            //no other filters are being used, so just accept all startingItems from the suggested mods and recipe filter
            return startingItems;
        }

    };

    /**
     * @memberof Ordering
     */
    self.updateSubButton = function (posid, priceLevel, buttonName, quantity, event, callback) {
        if (refreshOrderTimer) { refreshOrderTimer(); }
        if ((event !== null) && (event.stopPropagation !== undefined)) event.stopPropagation();
        //console.log("updateSubButton - posid: " + posid + "; priceLevel: " + priceLevel + "; button: " + buttonName);
        var buttonNameParts = buttonName.split('-');
        if (buttonNameParts.length >= 3) {
            var buttonIndex = Number(buttonNameParts[2]);
            var buttonHtml = $("#" + buttonName);
            var buttonObj = self.buttons[buttonIndex];

            if ((buttonHtml.data("active-posid") !== posid) &&
                (posid !== "")) {
                self.substituteModifier(buttonObj, buttonIndex, posid, priceLevel, buttonHtml.data("active-posid"), buttonHtml.data("active-pricelevel"), quantity, callback);
            } else if ((buttonObj.hasRecipe) &&
                      (posid !== "")) {
                self.substituteModifier(buttonObj, buttonIndex, buttonObj.noPosid(), buttonObj.noPriceLevel(), buttonHtml.data("active-posid"), buttonHtml.data("active-pricelevel"), quantity, callback);
            } else {
                self.substituteModifier(buttonObj, buttonIndex, undefined, undefined, buttonHtml.data("active-posid"), buttonHtml.data("active-pricelevel"), quantity, callback);
            }

            // update the html
            buttonObj.update(posid, quantity);
        }
        else {
            console.log('unable to find button index');
        }
    };

    /**
     * Used by multistate buttons to update the order and pricing.
     * @memberof Ordering
     */
    self.substituteModifier = function (button, buttonIndex, posid, pricelevel, removePosid, removePriceLevel, quantity, callback) {
        if (self.pending) {
            return;
        }
        self.pending = true;

        // request the pricing to be updated if the template uses included quantities
        var menu = self.currentMenu;
        var template = _nex.assets.templateManager.findTemplate(self.currentMenu.template);
        var updatePricing = ((template !== null) &&
                            template.hasOwnProperty("incquantity") &&
                            template.incquantity.toLowerCase() === "true");

        if (!updatePricing) {
            menu = undefined;
            template = undefined;
        }

        var pricedBy = _nex.assets.templateManager.templatePricedBy(self.currentMenu.template);
        quantity = quantity || 1;

        if (_nex.context === "UX") {
            var cmd = new _nex.commands.SubstituteModifier(posid, pricelevel, removePosid, removePriceLevel, quantity, self.currentMenuId, (self.menustack.length - 1), self.currentMenu.upsell, pricedBy, buttonIndex, button.buttonInfo(), menu, template);
            _nex.communication.send(cmd, function (result) {

                var currentItem = _nex.orderManager.currentOrder.currentItem();
                if (currentItem && currentItem.hasOwnProperty("ITEM") && currentItem.ITEM) {
                    var currentMenuStackIndex = self.menustack.length - 1;
                    self.menustack[currentMenuStackIndex].posids = []; // clear the current posids

                    for (var j = 0; j < currentItem.ITEM.length; j++) {
                        if (currentMenuStackIndex === Number(currentItem.ITEM[j].menustackindex)) {
                            self.menustack[currentMenuStackIndex].posids.push(currentItem.ITEM[j].posid);
                        }
                    }

                    // update all the buttons for all modifiers on the current menu
                    var mods = currentItem.ITEM;
                    for (var i = 0; i < mods.length; i++) {
                        if (Number(mods[i].menuid) === self.currentMenuId) {
                            var index = Number(mods[i].buttonindex);
                            if ((index >= 0) && (self.buttons[index].html.data("active-posid") !== mods[i].posid)) {
                                self.buttons[index].update(mods[i].posid, mods[i].modquantity);
                            }
                        }
                    }

                    self.updateControlButtons();

                    self.pending = false;

                    if (callback !== undefined) {
                        if (result) {
                            callback(result);
                        } else {
                            callback();
                        }
                    }
                }
            }, "ADDTOORDERRESPONSE");

        } else {
            var cmd2 = new _nex.commands.SubstituteModifier(posid, pricelevel, removePosid, removePriceLevel, quantity.toString(), self.currentMenuId, (self.menustack.length - 1), self.currentMenu.upsell, pricedBy, buttonIndex, button.buttonInfo(), menu, template);
            _iorderfast.command.send(cmd2, function (data) {

                var result = JSON.parse(data);
                if (result.success === "true") {
                    self.order = result.ORDER;

                    self.checkAlcoholLimit();

                    var currentItem = self.currentItem();
                    var currentMenuStackIndex = self.menustack.length - 1;
                    self.menustack[currentMenuStackIndex].posids = []; // clear the current posids

                    for (var j = 0; j < currentItem.ITEM.length; j++) {
                        if (currentMenuStackIndex === Number(currentItem.ITEM[j].menustackindex)) {
                            self.menustack[currentMenuStackIndex].posids.push(currentItem.ITEM[j].posid);
                        }
                    }

                    // update order totals
                    if (self.order.subtotal !== undefined) {
                        self.totals.subtotal(currency.formatAsDollars(Number(self.order.subtotal), true));
                        self.totals.salestax(currency.formatAsDollars(0, true));
                        self.totals.salestax2(currency.formatAsDollars(0, true));
                        self.totals.deliveryfee(currency.formatAsDollars(0, true));
                        self.totals.gratuity('');
                        self.totals.amountdue(currency.formatAsDollars(0, true));
                        self.totals.discount(currency.formatAsDollars(0, true));
                    }

                    // update all the buttons for all modifiers on the current menu
                    var mods = self.currentItem().ITEM;
                    for (var i = 0; i < mods.length; i++) {
                        if (Number(mods[i].menuid) === self.currentMenuId) {
                            var index = Number(mods[i].buttonindex);
                            if ((index >= 0) && (self.buttons[index].html.data("active-posid") !== mods[i].posid)) {
                                self.buttons[index].update(mods[i].posid, mods[i].modquantity);
                            }
                        }
                    }

                    self.updateReceipt();

                    if (self.orderUpdated !== undefined) {
                        self.orderUpdated();
                    }
                }
            });

            self.pending = false;

            if (callback !== undefined) {
                if (result) {
                    callback(result);
                } else {
                    callback();
                }
            }
        }// end ux vs mobile
    };

    /** @memberof Ordering */
    self.updateQuantityButton = function (posid, priceLevel, buttonName, event) {
        if (refreshOrderTimer) { refreshOrderTimer(); }
        if (event.stopPropagation !== undefined) event.stopPropagation();

        self.addToOrder(posid, priceLevel, buttonName);

        var buttonNameParts = buttonName.split('-');
        if (buttonNameParts.length >= 3) {
            var buttonIndex = Number(buttonNameParts[2]);
            var buttonObj = self.buttons[buttonIndex];

            buttonObj.click(posid);
        }
    };

    /** @memberof Ordering */
    self.changeQuantity = function (posid, buttonName, delta, event) {
        if (refreshOrderTimer) { refreshOrderTimer(); }
        if (event.stopPropagation !== undefined) event.stopPropagation();
        var buttonNameParts = buttonName.split('-');
        if (buttonNameParts.length >= 3) {
            var buttonIndex = Number(buttonNameParts[2]);
            var buttonObj = self.buttons[buttonIndex];

            if (!self.pending) {
                // only pending when quantity plus the delta is greater than zero
                // when zero the item will be removed and the pending variable will be set by that code
                self.pending = ((buttonObj.quantity + delta) > 0);

                // search the list from the bottom up to find the item
                var itemIndex = -1;
                for (var i = (self.order.ITEM.length - 1) ; (i >= 0) && (itemIndex == -1) ; i--) {
                    if (self.order.ITEM[i].posid == posid) {
                        itemIndex = self.order.ITEM[i].index; // get the item index to pass to the service to update the correct item on the order
                    }
                }

                buttonObj.update(delta, itemIndex);
            }
        }
    };

    self.updateModifierQuantity = function (index, delta, posid, buttonName, callback) {

        var menu = null;
        var template = null;

        buttonName = buttonName || "";
        var buttonNameParts = buttonName.split('-');
        var buttonIndex = (buttonNameParts.length >= 3) ? Number(buttonNameParts[2]) : -1;

        //console.log("ordering.updateModifierQuantity - index: " + index.toString() + "; buttons length: " + self.buttons.length.toString() + "; buttonIndex: " + buttonIndex.toString());

        // this method is used by the SELECTONEQUANTITY and SELECTNE button types.
        if ((buttonIndex > 0) &&
            (self.buttons[buttonIndex].name === "SELECTNE")) {
            menu = self.currentMenu;
            template = _nex.assets.templateManager.findTemplate(self.currentMenu.template);
            var updatePricing = ((template !== null) &&
                                template.hasOwnProperty("incquantity") &&
                                template.incquantity.toLowerCase() === "true");

            if (!updatePricing) {
                menu = null;
                template = null;
            }
        }

        self.sendUpdateQuantity(index, delta, true, posid, function () {

            // update all the buttons for all modifiers on the current menu
            if ((buttonIndex > 0) &&
                (self.buttons[buttonIndex].hasOwnProperty("name") &&
                (self.buttons[buttonIndex].name === "SELECTNE"))) {
                self.buttons[buttonIndex].update(posid, self.buttons[buttonIndex].modQuantity + Number(delta));

                // update all the buttons for all modifiers on the current menu
                var mods = self.currentItem().ITEM;
                for (var i = 0; i < mods.length; i++) {
                    if (Number(mods[i].menuid) === self.currentMenuId) {
                        buttonIndex = Number(mods[i].buttonindex);
                        if ((index >= 0) && (self.buttons[buttonIndex].html.data("active-posid") !== mods[i].posid)) {
                            self.buttons[buttonIndex].update(mods[i].posid, mods[i].modquantity);
                        }
                    }
                }
            }

            self.pending = false;
        });
    };

    /** @memberof Ordering */
    self.showDescription = function (buttonName, ibuttonId, event) {

        var that = self;

        // close the currently visible item description
        if (self.currentIButton !== null) {
            self.currentIButton.on('hidden.bs.popover', function () {
                that.currentIButton.removeClass("ibutton-showing");

                // remove the html from DOM
                var popover = $("#" + that.currentIButton.data("parent-button")).find(".popover");
                if (popover.length > 0) {
                    popover.remove();
                }
                var tempId = that.currentIButton.attr('id');
                that.currentIButton = null;
                if (_nex.context === "UX") {
                    that.currentPopover = null;
                }
                if (tempId !== ibuttonId) {
                    that.showDescription(buttonName, ibuttonId, event);
                }
            });
            self.currentIButton.popover("destroy");
            return; // this method will be called once the popover is hidden
        }

        // show the item button description
        var buttonNameParts = buttonName.split('-');
        if ((buttonNameParts.length >= 3) &&
            ((self.currentIButton === null) ||
                ((self.currentIButton !== null) && (self.currentIButton.attr('id') !== ibuttonId)))) {
            var buttonIndex = Number(buttonNameParts[2]);
            var buttonObj = self.buttons[buttonIndex];

            if ($("#itemDescriptionContent").length > 0) {
                var itemDescription = $("#itemDescriptionContent").clone();
                itemDescription.css("display", "");

                // get the item description
                var descText = itemDescription.find("#infoText");
                descText.empty();
                descText.append(buttonObj.descriptionText());

                var addButton = itemDescription.find("#addButton");
                if (addButton.length === 0) {
                    // if the is a nutrition button set the click event
                    var nutritionButton = itemDescription.find("#nutritionButton");
                    if (nutritionButton.length > 0) {
                        nutritionButton.attr("onclick", "_nex.ordering.showNutrition('" + buttonName + "');");
                    }
                } else {
                    // set the onclick of the addbutton to the onclick event of the parent button
                    var nextMenu = buttonObj.html.find("#nextmenu");
                    addButton.attr("onclick", nextMenu.attr("onclick"));
                }

                var nutritionInfo = itemDescription.find("#nutritionInfo");
                if (nutritionInfo.length > 0) {
                    buttonObj.loadNutrition(nutritionInfo);
                }

                // get the placement of the popover from the data-placement attribute
                var popoverPlacement = "top";

                // look for the default placement
                if ((itemDescription.data("placement") !== undefined) &&
                    (itemDescription.data("placement") !== "")) {
                    popoverPlacement = itemDescription.data("placement");
                }

                // look for placement based on size of the media
                if ((itemDescription.data("placement-media") !== undefined) &&
                    (itemDescription.data("placement-media") !== "")) {
                    try {
                        var placementMedia = itemDescription.data("placement-media");
                        // the value of placement media is JSON
                        // ex. [ {"width" : 1024, "placement" : "right"}, {"width" : 767, "placement" : "left"} ]
                        for (var i = 0; i < placementMedia.length; i++) {
                            if (placementMedia[i].width >= $(window).width()) {
                                popoverPlacement = placementMedia[i].placement;
                            }
                        }
                    } catch (e) {
                        // fail gracefully
                        console.log("Unable to parse placement-media; value: " + itemDescription.data("placement-media"));
                        console.log(e.description);
                    }
                }

                var options = {
                    content: itemDescription.html(),
                    html: true,
                    placement: popoverPlacement
                };

                self.currentIButton = $("#" + ibuttonId);

                if (_nex.context !== "UX") {
                    self.currentIButton.data("parent-button", buttonName);
                    self.currentIButton.popover(options);
                    self.currentIButton.popover("toggle");

                    self.currentIButton.addClass("ibutton-showing");
                } else {
                    if (self.currentIButton.length > 0) {
                        self.currentIButton.on('shown.bs.popover', function () {
                            self.currentPopover = $(".popover-content");
                        });
                        self.currentIButton.data("parent-button", buttonName);
                        self.currentIButton.popover(options);
                        self.currentIButton.popover("toggle");

                        self.currentIButton.addClass("ibutton-showing");

                        $(document).on("mousedown", self._popoverHitTest);

                        self.currentIButton.blur(function () {
                            if ((self.currentPopover !== null) && (self.currentPopover.data("keepshowing") !== "true") && (that.currentIButton !== null)) {
                                that.currentIButton.removeClass("ibutton-showing");
                                that.currentIButton.on('hidden.bs.popover', function () {
                                    that.currentIButton.removeClass("ibutton-showing");

                                    // remove the html from DOM
                                    var popover = $("#" + that.currentIButton.data("parent-button")).find(".popover");
                                    if (popover.length > 0) {
                                        popover.remove();
                                    }
                                    that.currentIButton = null;
                                    that.currentPopover = null;
                                });
                                $(document).off("mousedown", self._popoverHitTest);
                                self.currentIButton.popover("destroy");
                            }
                        });
                    }
                }
            }
        } else {
            self.currentIButton = null;
        }
    };

    self.executePFM = function (callback) {
        //console.log("execute pfm...");
        var executePFM = false;
        _nex.pfmCallback = callback;

        executePFM = (self.theme.system.hasOwnProperty("ORDERREVIEW") &&
                        self.theme.system.ORDERREVIEW.hasOwnProperty("executepfm") &&
                        (self.theme.system.ORDERREVIEW.executepfm.toLowerCase() == "true"));

        if (executePFM) {

            self.showProcessingPopup(self.theme.getTextAttribute("PAYMENT", "processingorder", "Calculating Total"));
            // Send the command to calculate the total for the current order. This will take into account tax on the previous balance.
            _nex.communication.send(new _nex.commands.CalculateTotal(_nex.orderManager.currentOrder), function (result) {
                self.hideProcessingPopup();

                // if a response was received, update the order totals
                if (result.responseReceived === "true") {
                    self.order.update(result, false);
                }

                // update the receipt. executePFM is true and the amountdue should be displayed
                self.updateReceipt(true);

                self.loadOrderReview();
            }, "ORDERTOTAL");

        } else {
            self.loadOrderReview();
        }
    };

    self.showProcessingPopup = function (message, callback) {
        //console.log("ordering-showing processing popup");
        var processingPopup = $.extend(true, {}, _nex.assets.popupManager.processingPopup);
        processingPopup.message = message ? message : "Processing ...";
        _nex.assets.popupManager.showPopup(processingPopup, callback);
    };

    // Hide the processing popup.
    self.hideProcessingPopup = function (callback) {
        //console.log("ordering-hiding processing popup");
        _nex.assets.popupManager.hidePopup(_nex.assets.popupManager.processingPopup, callback);
    };

    /**
     * Called just before going to order review. The performConsolidate parameter determines
     * if the consolidation should be skipped which is a use case when updating the quantity at order review.
     * @memberof Ordering
     **/
    self.consolidateOrder = function (performConsolidate, callback) {
        if ((performConsolidate === undefined) ||
            (performConsolidate === null)) {
            performConsolidate = true;
        }

        if (_nex.context === "UX" && self.theme.consolidate && performConsolidate) {
            _nex.communication.send(new _nex.commands.ConsolidateOrder(), function (result) {
                if (result.responseReceived === "true") {
                    self.order.update(result.ORDER);
                }

                if (callback !== undefined) {
                    callback();
                }
            }, "CONSOLIDATEORDERRESPONSE");
        } else if (_nex.context !== "UX" && _iorderfast.assets.theme.consolidate && performConsolidate) {
            _iorderfast.command.send(new _nex.commands.ConsolidateOrder(), function (data) {

                var result = JSON.parse(data);
                if (result.success === "true") {
                    self.order = result.ORDER;
                }

                if (callback !== undefined) {
                    callback();
                }
            });
        } else {
            if (callback !== undefined) {
                callback();
            }
        }
    };

    /** @memberof Ordering */
    self.loadOrderReview = function (performConsolidate, callback) {
        if (performConsolidate === undefined) {
            performConsolidate = true;
        }

        //remove class from targets on phase change to prevent css mishaps
        $('#targets').removeAttr('class');
        $('#template').removeAttr('class');
        $('#targets').addClass("order-review");
        //Add class to targets for better menu manipulation.
        $('#targets').addClass( "menu-id-" + self.currentMenuId.toString());
        if ((self.currentMenu.tag !== null) && (self.currentMenu.tag !== undefined) && (self.currentMenu.tag !== "")) {
            $('#targets').addClass("menu-tag-" + self.currentMenu.tag.toString());
        }

        // inject the layout to allow the UX template to have more info on how to style a particular menu
        var templateDetail = _nex.assets.templateManager.findTemplate(self.currentMenu.template);
        if (templateDetail.hasOwnProperty("layout") &&
            templateDetail.layout.length) {
            var layouts = templateDetail.layout.split(" ");
            for (var i = 0; i < layouts.length; i++) {
                if (layouts[i].length > 0) {
                    $("#targets").addClass(layouts[i]);
                }
            }
        }

        var alcoholEnabled = false;
        if (_nex.context === "UX") {
            alcoholEnabled = _nex.orderManager.currentOrder.alcoholEnabled;
        } else {
            alcoholEnabled = _iorderfast.ordering.alcoholEnabled;
        }

        if ((self.order.ITEM === undefined) ||
            (self.order.ITEM.length === 0)) {
            self.loadMenu(self.startMenu);
        } else {

            self.orderUpdated = function () {
                // this only occurs when the user is at the order review screen so do not perform the consolidate since the quantity of items are changing
                self.loadOrderReview(false);
            };

            $('#header-text').empty();
            if (_nex.context === "UX") {
                $('#header-text').append(self.theme.itemTextByType(self.currentMenu, "HEADER"));// self.currentMenu.HEADER[0].headertext : self.currentMenu.HEADER.headertext);
                $('#menuDescription').empty();
                $('#menuDescription').append(itemFormatting.buttonText(self.theme.itemTextByType(self.currentMenu, "MENUDESCRIPTION")));

                // play voiceover
                if (self.currentMenu.hasOwnProperty("voiceover") &&
                    self.currentMenu.voiceover.length > 0) {
                    _nex.assets.soundManager.playVoiceover(self.currentMenu.voiceover);
                }
            } else {
                $('#header-text').append(self.currentMenu.HEADER[0].headertext);
                $('#menuDescription').empty();
                if (self.currentMenu.MENUDESCRIPTION.length !== 0) {
                    $('#menuDescription').append(itemFormatting.buttonText(self.currentMenu.MENUDESCRIPTION[0].menudescriptiontext));
                }
            }

            if (self.currentMenu.menubg.length > 0) {
                // only change the menubg if it is different
                if (self.currentMenuBg !== self.currentMenu.menubg) {
                    self.currentMenuBg = self.currentMenu.menubg;
                    // set the background-image on the #ordering target so the image is behind all content
                    if (inPreviewer()) {
                        $("#ordering").attr("style", "background-image: url('../Media.aspx?media=other/" + self.currentMenuBg + "');");
                    } else {
                        if (_nex.context === "UX") {
                            var url = _nex.assets.theme.mediaPath() + "other/" + self.currentMenuBg;
                            $("#ordering").attr("style", "background-image: url('" + url + "');");
                        } else {
                            $("#ordering").attr("style", "background-image: url('themes/" + _iorderfast.assets.theme.id + "/media/other/" + self.currentMenuBg + "');");
                        }
                    }
                }
            } else {
                $("#ordering").attr("style", "background-image: none");
            }

            self.consolidateOrder(performConsolidate, function () {
                // Store the scroll position of the order review buttons for UX.
               if (_nex.context === "UX" && $('.order-review-buttons').length) {
                    self.scrollTop = $('.order-review-buttons').scrollTop();
               }

               $('#template').empty();
               $('#template').append("<div id='buttons' class='buttons order-review-buttons' ></div>");

                if (_nex.context === "UX") {
                    self.isOrderReview = true; // set this flag so we can hide the receipt; there is probably a better place for setting this.
                } else {
                    self.loadAd(self.currentMenu.ad, self.currentMenu.template);
                }

                // load menu background
                if (self.currentMenu.menubg.length > 0) {
                    // only change the menubg if it is different
                    if (self.currentMenuBg !== self.currentMenu.menubg) {
                        self.currentMenuBg = self.currentMenu.menubg;
                        // set the background-image on the #ordering target so the image is behind all content
                        if (_nex.context === "UX" && inPreviewer()) {
                            var url = "../Media.aspx?media=other/" + self.currentMenuBg;
                            $("#ordering").attr("style", "background-image: url('" + url + "');");
                        } else if (_nex.context === "UX") {
                            var url = _nex.assets.theme.mediaPath() + "other/" + self.currentMenuBg;
                            $("#ordering").attr("style", "background-image: url('" + url + "');");
                        } else {
                            $("#ordering").attr("style", "background-image: url('themes/" + self.theme.id + "/media/other/" + self.currentMenuBg + "');");
                        }

                    }
                } else {
                    $("#ordering").attr("style", "background-image: none");
                }

                if (self.order.ITEM !== undefined) {

                    var orderItems = [];
                    var lastItem = null;
                    // pre-process items - remove hidden items and combine linked items
                    for (var i = 0; i < self.order.ITEM.length; i++) {
                        if (self.order.ITEM[i].hidden === "false") {
                            if ((self.order.ITEM[i].linkid.length > 0) && (lastItem !== null)) {
                                if (lastItem.ITEM === undefined) {
                                    lastItem.ITEM = [];
                                }
                                // linked items are added to the menu item
                                lastItem.ITEM.push($.extend(true, {}, self.order.ITEM[i]));

                                // add the modifiers to the last item
                                if (self.order.ITEM[i].hasOwnProperty("ITEM")) {
                                    for (var m = 0; m < self.order.ITEM[i].ITEM.length; m++) {
                                        lastItem.ITEM.push($.extend(true, {}, self.order.ITEM[i].ITEM[m]));
                                    }
                                }
                            }
                            else {
                                lastItem = $.extend(true, {}, self.order.ITEM[i]);
                                orderItems.push(lastItem);
                            }
                        }
                    }

                    for (var j = 0; j < orderItems.length; j++) {
                        var orderReviewItem = $('#orderreview').clone();

                        orderReviewItem.addClass('col-xs-12');  // TODO: set class in html
                        orderReviewItem.addClass('order-review-item');

                        var itemQuantity = Number(orderItems[j].quantity);

                        var minus = orderReviewItem.find("#quantMinus");
                        if (minus !== undefined) {
                            minus.attr("onclick", "_nex.assets.soundManager.playButtonHit();_nex.ordering.updateItemQuantity(" + orderItems[j].index + ",-1, false); _nex.utility.buttonTracking.track('', '-', '" + self.currentMenuId + "', 'Review Order', 'control');");
                        }

                        var plus = orderReviewItem.find("#quantPlus");
                        if (plus !== undefined) {
                            plus.css("visibility", "hidden");
                            if (orderItems[j].alcoholflag.toLowerCase() === "true") {
                                if (alcoholEnabled) {
                                    plus.attr("onclick", "_nex.assets.soundManager.playButtonHit();_nex.ordering.updateItemQuantity(" + orderItems[j].index + ",1, true);_nex.utility.buttonTracking.track('', '+', '" + self.currentMenuId + "', 'Review Order', 'control');");
                                    plus.css("visibility", "visible");
                                }
                            } else if (itemQuantity < self.theme.quantityLimit) {
                                plus.attr("onclick", "_nex.assets.soundManager.playButtonHit();_nex.ordering.updateItemQuantity(" + orderItems[j].index + ",1, true); _nex.utility.buttonTracking.track('', '+', '" + self.currentMenuId + "', 'Review Order', 'control');");
                                plus.css("visibility", "visible");
                            }
                        }

                        // If it is in the custom filter, do not allow us to increase or decrease the quantity.
                        if (self.hasOwnProperty("checkCustomFilter") && self.checkCustomFilter(orderItems[j].posid) && plus !== undefined) {
                            plus.css("visibility", "hidden");
                            minus.css("visibility", "hidden");
                        }

                        // set quantity
                        var quantity = orderReviewItem.find('#quantity');
                        quantity.empty();
                        quantity.append(orderItems[j].quantity);

                        //set image to the theme's item image
                        var bimage = orderReviewItem.find('#bimage');
                        bimage.empty();
                        var posid = orderItems[j].posid;

                        orderReviewItem.data("posid", posid);

                        var item = _nex.assets.theme.itemByPosid(posid);
                        if (item !== null) {
                        var imageurl = item.DETAIL.image;
                        if (imageurl.length > 0) {
                            if (_nex.context === "UX" && inPreviewer()) {
                                var url = "../Media.aspx?media=images/" + imageurl;
                                $(bimage).css({
                                        "background-image": "url(" + url + ")"
                                });
                            }
                            else {
                                $(bimage).css({
                                    "background-image": "url(themes/" + self.theme.id + "/media/images/" + imageurl + ")"
                                });
                            }
                        }
                        }
                        // set receipt text
                        var itemtext = orderReviewItem.find('#receipttext');
                        itemtext.empty();
                        itemtext.append(itemFormatting.buttonText(orderItems[j].receipttext));

                        var modReceiptText = itemFormatting.buildModReceiptText(orderItems[j]);
                        var modtext = orderReviewItem.find('#modtext');
                        modtext.empty();
                        modtext.append(modReceiptText);

                        // special instructions
                        var comment = orderReviewItem.find("#comment");
                        if (comment.length > 0) {

                            // hide the comment if the attribute 'Disable Instructions' is true
                            var item = self.theme.itemByPosid(orderItems[j].posid);
                            var disableInstruct = self.theme.findItemAttribute(item, "Disable Instructions");
                            if ((disableInstruct !== null) &&
                                (disableInstruct.value.toLowerCase() === "true")) {
                                comment.css("display", "none");
                            } else {
                                // set the comment if it exists
                                if (orderItems[j].hasOwnProperty("comment")) {
                                    comment.val(orderItems[j].comment);
                                }
                                comment.css("display", "");
                                comment.attr("onblur", "_nex.ordering.updateComment(" + orderItems[j].index + ", this.value)");
                                comment.attr("onkeypress", "return restrictCharacters(this, event, alphaNumOnly);");
                            }
                        }

                        // price
                        var amountDue = orderReviewItem.find('#amountdue');
                        amountDue.empty();
                        amountDue.append(currency.formatAsDollars(itemFormatting.getPrice(orderItems[j]), true));
                        if (_nex.mviReader) {
                            var mviContent = '<div id="invisibleLabel' + j + '" class="invisible" aria-hidden="false" tabindex="2">' + itemQuantity + ' ' + itemFormatting.buttonText(orderItems[j].receipttext) + ' ' + modReceiptText + ' ' + currency.formatAsDollars(itemFormatting.getPrice(orderItems[j]), true) + ' </div>';
                            $('#template').find('#buttons').append(mviContent);
                        }
                        $('#template').find('#buttons').append(orderReviewItem);
                        orderReviewItem = null;
                    }

                    _nex.assets.templateManager.templateLoaded(self.currentMenu);
                }
            });

            // Restore the scroll position if applicable.
            if (self.scrollTop) {
                $('.order-review-buttons').scrollTop(self.scrollTop);
            }
        }
    };

    /** @memberof Ordering */
    self.gotoOrderReview = function (callback) {
        var menuId = self.findOrderReview();
        self.loadMenu(menuId);
    };

    /** @memberof Ordering */
    self.findOrderReview = function () {
        var menuId = -1;

        for (var i = 0; (i < self.menus.length) && (menuId === -1) ; i++) {
            var template = _nex.assets.templateManager.findTemplate(self.menus[i].template);
            if ((template !== null) &&
                template.hasOwnProperty("classname") &&
                ((template.classname.toString().toLowerCase() === "orderreview") ||
                (_nex.context === "UX" && template.classname.toString().toLowerCase() === "checkout"))) {
                console.debug("Found menu for order review");
                menuId = self.menus[i].id;
            }
        }

        if (menuId === -1) {
            menuId = 1;
        }

        return menuId;
    };

    /** @memberof Ordering */
    self.findMenuByTag = function (tagName) {
        var menuId = -1;

        for (var i = 0; (i < self.menus.length) && (menuId === -1) ; i++) {
            var menu = self.menus[i];
            if (menu && menu.hasOwnProperty("tag") && menu.tag === tagName) {
                console.debug("Found menu for " + tagName);
                menuId = self.menus[i].id;
            }
        }

        if (menuId === -1) {
            menuId = 1;
        }

        return menuId;
    };


    // Updating and showing the receipt

    /** @memberof Ordering */
    self.updateReceipt = function (executePFM) {
        if (executePFM === null) {
            executePFM = false;
        }
        var receipt = $("#receipt");
        if (receipt.length > 0) {

            var pulldownScript = "";
            var isReceiptVisible = false;
            var receiptBehavior = receipt.data("receipt-behavior");
            receiptBehavior = receiptBehavior || "pulldown";
            var updatedTotal = 0;

            if (_nex.context === "UX") {
                // check if executePFM is true and use the amountdue if its available
                if (executePFM === true && self.order.totals.amountdue !== undefined)
                {
                    var amount = correctMathError(Number(self.order.totals.amountdue()));
                }
                else if (self.order.totals.subtotal !== undefined)
                {
                    // default to the subtotal if available
                    var amount = correctMathError(Number(self.order.totals.subtotal()));
                }
                // if the amount is valid set the updatedTotal
                if (amount !== undefined) {
                        pulldownScript = ($('#receiptItemTemplate').length > 0) ? "_nex.ordering.showPulldownReceipt()" : "";
                    updatedTotal = Number(amount);
                            }
            } else {
                if (self.order.subtotal !== undefined) {
                    var subtotal = correctMathError(Number(self.order.subtotal));

                        pulldownScript = ($('#receiptItemTemplate').length > 0) ? "_iorderfast.ordering.showPulldownReceipt()" : "";
                    updatedTotal = Number(self.order.subtotal);
                }
            }

            isReceiptVisible = _nex.assets.templateManager.isReceiptVisible(self.currentMenu.template, updatedTotal);
            var totalText = receipt.find('#txtTotal');
            if (totalText.length > 0) {
                totalText.empty();
                totalText.append(currency.formatAsDollars(updatedTotal, true));
            }

            var plusTax = receipt.find('#txtPlusTax');
            if (plusTax.length > 0) {
                plusTax.empty();
                // only show the txtPlusTax element if it is styled, and has absolute positioning set.
                // otherwise, it can push the content down in ordering, and you can't see any order items.
                if ($("#txtPlusTax").css("position").toLowerCase() === 'absolute') {
                    plusTax.append(self.theme.getTextAttribute("ORDER", "plustax", "Found tax"));
                }
            }

            if (receiptBehavior.toLowerCase() === "visible") {
                // build receipt content
                var visibleReceipt = $("#visibleReceipt");
                if (visibleReceipt.length > 0) {
                    var receiptContent = self._buildReceiptContent();
                    visibleReceipt.empty();
                    visibleReceipt.append(receiptContent);
                }
            } else {
                receipt.attr("onclick", pulldownScript);
                receipt.css("cursor", "pointer");
            }

            receipt.css("visibility", (isReceiptVisible) ? "visible" : "hidden");

            // set template class info
            receipt.parent().attr("class", "");
            receipt.parent().addClass(self.currentMenu.template.replace(/ /g, "-"));
            if (self.currentTemplateClass &&
               (self.currentTemplateClass.length > 0)) {
                receipt.parent().addClass(self.currentTemplateClass);
            }
        }

        // hide the pulldown if it is visible
        if (self.pulldownVisible) {
            self.showPulldownReceipt();
        }

        // update the nutrition summary as well
        self.updateNutritionSummary();
    };

    /** @memberof Ordering */
    self.showPulldownReceipt = function () {
        if (_nex.context === "UX" && self.isOrderReview) {
            return; // We don't want to show the pull down receipt on order review for UX
        }

        console.debug("showpulldownreceipt - " + self.pulldownVisible.toString());
        if (self.pulldownVisible) {
            self.pulldownVisible = false;

            var content = $("#receipt").find("receiptContent");
            if (content.length > 0) {
                content.remove();
            }

            $("#receipt").off("shown.bs.popover", function () {});
            $("#receipt").off("hide.bs.popover", function () { });
            $("#receipt").off("hidden.bs.popover", function () { });

            $("#receipt").popover("destroy");

        } else {

            var receiptContent = self._buildReceiptContent();

            var placementPosition = "bottom";
            if((receiptContent.data("placement-media") !== undefined) &&
                (receiptContent.data("placement-media") !== "")) {
                placementPosition = receiptContent.data("placement-media");
            }

            var options = {
                content: $('<div>').append(receiptContent.clone()).html(),
                html: true,
                placement: placementPosition,
                trigger: "focus"
            };
            self.pulldownVisible = true;

            $("#receipt").popover(options);

            $("#receipt").on("shown.bs.popover", function () {
                self.pullDownShown();
            });

            $("#receipt").on("hide.bs.popover", function () {
                self.pulldownVisible = false;
            });

            $("#receipt").on("hidden.bs.popover", function () {
                window.setTimeout(function () {
                    $("#receipt").popover("destroy");
                }, 0);
            });

            $("#receipt").popover("show");
        }
    };

    self._buildReceiptContent = function () {

        var receiptContent = $('<div id="receiptContent" class="receipt-content" ></div>');

        var pulldownReceipt = $('#pulldownReceipt');
        if((pulldownReceipt.length > 0) &&
            (pulldownReceipt.data("placement-media") !== undefined) &&
            (pulldownReceipt.data("placement-media") !== "")) {
            receiptContent.data("placement-media", pulldownReceipt.data("placement-media"));
        }
            // build receipt text
            if (self.order.ITEM !== undefined) {

                var orderItems = [];
                var lastItem = null;
                // pre-process items - remove hidden items and combine linked items
                for (var i = 0; i < self.order.ITEM.length; i++) {
                    if (self.order.ITEM[i].hidden === "false") {
                        if ((self.order.ITEM[i].linkid.length > 0) && (lastItem !== null)) {
                            if (lastItem.ITEM === undefined) {
                                lastItem.ITEM = [];
                            }
                            // linked items are added to the menu item
                            lastItem.ITEM.push($.extend(true, {}, self.order.ITEM[i]));
                        }
                        else {
                            lastItem = $.extend(true, {}, self.order.ITEM[i]);
                            orderItems.push(lastItem);
                        }
                    }
                }

                for (var j = 0; j < orderItems.length; j++) {
                    var itemTemplate = $('#receiptItemTemplate').clone();

                    itemTemplate.attr("id", "receiptItem" + j.toString());
                    // set receipt text
                    var itemtext = itemTemplate.find('#receiptItemText');
                    itemtext.empty();
                    itemtext.append(orderItems[j].quantity + "-" + itemFormatting.buttonText(orderItems[j].receipttext));

                    //// price
                    var amountDue = itemTemplate.find('#receiptItemAmount');
                    amountDue.empty();

                    var isSingleLine = self.isSingleLineModifier();
                    if (isSingleLine) {
                    amountDue.append(currency.formatAsDollars(itemFormatting.getPrice(orderItems[j]), true));
                    } else {
                        amountDue.append(currency.formatAsDollars(orderItems[j].amountdue, true));
                    }

                    // add modifiers
                    if (orderItems[j].ITEM !== undefined) {
                        var modHtml = itemTemplate.find('#receiptMod').clone();
                        itemTemplate.find('#receiptMod').remove(); // remove the original

                        var modText = null;
                        var modAmountDue = null;

                        for (var m = 0; m < orderItems[j].ITEM.length; m++) {

                            if (!isSingleLine || m == 0) {
                                modText = modHtml.find("#receiptModText");
                                modText.empty();
                                modText.append("* ");

                                modAmountDue = modHtml.find('#receiptModAmount');
                                modAmountDue.empty();
                            }
                            else if (isSingleLine && m > 0) {
                                modText.append(", ");
                            }

                            var priceString = "";
                            if (Number(orderItems[j].ITEM[m].amountdue) > 0) {
                                priceString = currency.formatAsDollars(itemFormatting.getPrice(orderItems[j].ITEM[m]), true);
                            }

                        if (priceString.length > 0) {
                                if (isSingleLine) {
                                    //uncomment to add the price to the single line mods
                                    //modText.append(priceString);
                                    //modText.append(" - ");
                                }
                                else {
                                    modAmountDue.append(priceString);
                                }
                            }

                            modText.append(itemFormatting.buildSingleModReceiptText(orderItems[j].ITEM[m]));

                            if (!isSingleLine || m + 1 >= orderItems[j].ITEM.length) {
                                itemTemplate.append(modHtml.clone());
                            }
                        }
                    }

                    receiptContent.append(itemTemplate);
                    itemTemplate = null;
                }
            }

        return receiptContent;
    };

    self.isSingleLineModifier = function () {
        var singleLine = (_nex.assets.theme.system.RECEIPT.singlelinemodifiers !== undefined) ? (_nex.assets.theme.system.RECEIPT.singlelinemodifiers.toLowerCase() === "true") : false;
        return singleLine;
    };

    // Cancelling the order

    /** Shows the cancel order popup. @memberof Ordering */
    self.cancelOrderPrompt = function () {
        var cancelOrder = $.extend(true, {}, _nex.assets.popupManager.yesNoPopup);
        cancelOrder.message = _nex.assets.theme.getTextAttribute("ORDER", "cancelorder", "Cancel your order?");
        cancelOrder.buttons[0].clickEvent = "_nex.ordering.cancelOrder(true)";
        cancelOrder.buttons[1].clickEvent = "_nex.ordering.cancelOrder(false)";
        cancelOrder.voiceover = "Cancel Order.mp3"; // the default voiceover can be overridden in htmltheme.xml
        _nex.assets.popupManager.showPopup(cancelOrder, function () {
            if (self.cancelled) {
                self.cancelOrderPromptCallback();
            }
        });
    };

    /**
     * Called from the cancel order popup.
     * @memberof Ordering
     */
    self.cancelOrder = function (cancel) {
        self.cancelled = cancel;
        if (cancel) {
            self.resetOrder();
        }
    };

    // Removing an item from the order

    /**
     * Removes an item from the order.
     * @memberof Ordering
     **/
    self.removeFromOrder = function (posid, callback) {
        var posids = [];
        posids.push(posid);
        self.removeMultipleFromOrder(posids, callback);
    };

    /**
     * Called from a popup when the user confirms they want to remove the item.
     * @memberof Ordering
     **/
    self.confirmRemoveItem = function (remove) {
        if (!remove) {
            self.removeIndex = -1;
            self.removeDelta = 0;
        }
    };

    /** @memberof Ordering */
    self.removeMods = function (menuId, itemIndex, callback) {
        // clone the object since the original item will be updated asynchronously
        var item = $.extend(true, {}, self.order.ITEM[itemIndex]);
        if (item.ITEM !== undefined) {
            var posids = [];
            for (var i = 0; (i < (item.ITEM.length)) ; i++) {
                if (item.ITEM[i].menuid === menuId) {
                    //self.removeFromOrder(item.ITEM[i].posid);
                    posids.push(item.ITEM[i].posid);
                }
            }

            self.removeMultipleFromOrder(posids, function () {
                if (callback !== undefined) {
                    callback();
                }
            });
        } else { // Note: UX called the callback for the undefined case; merged to common, not sure if this will cause any unexpected issues
            if (callback !== undefined) {
                callback();
            }
        }
    };

    /** @memberof Ordering */
    self.removeItemsByMenu = function (menuId, callback) {
        // clone the object since the original order will be updated asynchronously
        var orderClone = $.extend(true, {}, self.order);
        var posids = [];
        for (var i = 0; (i < (orderClone.ITEM.length)) ; i++) {
            if (orderClone.ITEM[i].menuid === menuId) {
                posids.push(orderClone.ITEM[i].posid);
            }
        }

        if (posids.length > 0) {
            self.removeMultipleFromOrder(posids, function () {
                if (callback !== undefined) {
                    callback();
                }
            });
        } else {
            if (callback !== undefined) {
                callback();
            }
        }
    };

    /** @memberof Ordering */
    self.popupRemoveClosed = function () {
        if (self.removeIndex !== -1) {
            self.updateItemQuantity(self.removeIndex, self.removeDelta, true);
        }
    };


    // Updating an items quantity

    /** @memberof Ordering */
    self.updateItemQuantity = function (index, delta, force, callback) {

        // if the delta is negative check to see if the item is to be removed
        // show a popup if the item is to be removed
        var itemQuantity = Number(self.order.ITEM[index].quantity);
        if (((itemQuantity + delta) <= 0) &&
            (force !== undefined) &&
            (!force)) {

            // prompt the guest to confirm they would like the item removed
            self.removeIndex = index;
            self.removeDelta = delta;

            var cancelItem = $.extend(true, {}, _nex.assets.popupManager.yesNoPopup);
            cancelItem.message = _nex.assets.theme.getTextAttribute("ORDERREVIEW", "removemessage", "Remove this item?");
            cancelItem.buttons[0].clickEvent = "_nex.ordering.confirmRemoveItem(true);";
            cancelItem.buttons[1].clickEvent = "_nex.ordering.confirmRemoveItem(false);";
            cancelItem.voiceover = "Remove This Item.mp3"; // the default sound can be overridden in htmltheme.xml
            _nex.assets.popupManager.showPopup(cancelItem, self.popupRemoveClosed);

        } else {
            // Implemented differently in UX from NEXTEP Mobile
            self.sendUpdateQuantity(index, delta, false, "", callback);
        }
    };


    // Nutrition
    /** @memberof Ordering */
    self.showNutrition = function (buttonName) {
        var buttonNameParts = buttonName.split('-');
        if (buttonNameParts.length >= 3) {

            var buttonIndex = Number(buttonNameParts[2]);
            var buttonObj = self.buttons[buttonIndex];
            var nutritionProp = $.extend(true, {}, _nex.assets.popupManager.nutritionPopup);
            nutritionProp.item = buttonObj.item;

            _nex.assets.popupManager.showPopup(nutritionProp);
        }
    };

    /** @memberof Ordering */
    self.updateNutritionSummary = function () {
        if (!self.nutritionSummary) {
            // initialize it if it hasn't been already
            var clipId = "clip-nutritionSummary";
            self.nutritionSummary = new NutritionSummary(clipId, _nex.orderManager);
        }
        self.nutritionSummary.update();
    };


    self.getAvailableButtons = function (menu, state) {
        var buttonFactory = new _nex.assets.buttons.ButtonFactory();
        var availableButtons = [];
        // if the menu parameter is not passed in use the current menu
        if (menu === undefined) {
            menu = self.currentMenu;
        }
        if (state === undefined) {
            state = "";
        }

        var templateDetail = _nex.assets.templateManager.findTemplate(menu.template);
        var menuItems = (Array.isArray(menu.MENUITEM)) ? menu.MENUITEM : new Array(menu.MENUITEM);
        var menuSortByPopularity = menu.hasOwnProperty("sortby") && menu.sortby.toUpperCase() === "POPULARITY";
        var posid = "";

        for (var i = 0; (i < menuItems.length) ; i++) {
            var itemRank = "zzzzzzzzzz";
            var button = buttonFactory.createButton(menuItems[i], menu.template);
            if (button !== null) {
            button.hasItemRank = false;
                button.init(menuItems[i]);
                // check if the menu item is enabled
                if (button.enabled(state)) {

                    // determine if the button contains a filter (aka Menu Genie); non-filtering buttons are add to the available button array
                    if (!button.hasFilter()) {
                        // non-filter button with menu items to be sorted by popularity
                        if (menuSortByPopularity && _nex.assets.theme.hasOwnProperty("itemRank")) {
                            posid = menuItems[i][menuItems[i].buttontype].posid;
                            //use posid2 for LESSMORE, SELECTNND, SELECTNNL, SELECTNLN  & SELECTNE
                            if (typeof (posid) === "undefined") posid = menuItems[i][menuItems[i].buttontype].posid2;
                            itemRank = self.findItemRank(posid);
                            if (itemRank !== "zzzzzzzzzz") {
                                button.sortvalue = itemRank;
                                button.hasItemRank = true;
                            }
                        }

                        // custom logic per customer to check available buttons, injected outside of this method
                        if(_nex.assets.templateManager.isButtonAvailable(self.currentMenu, templateDetail, button)) {
                            // add it to the list
                            availableButtons.push(button);
                        }
                    } else {
                        // filtered button (aka Menu Genie)
                        var filtered = true;

                        if ((button.attributes().length === 0) && (button.itemClassId().length === 0) && button.selectRecipe() !== true && button.selectSuggested() !== true) {
                            filtered = false;
                        } else {
                            var itemType = buttonFactory.getItemTypeForButton(button.name);
                            var filteredItemsList = self.getAvailableFilteredMenuItems(button.attributes(), button.itemClassId(), itemType, button.priceLevel(), button.selectRecipe(), button.selectSuggested());
                            if (filteredItemsList.length === 0) {
                                filtered = false;
                            } else {

                                //add the filtered items.
                                for (var j = 0; j < filteredItemsList.length; j++) {
                                    var menuItem = menuItems[i];
                                    var tempMenuItem = $.extend(true, {}, menuItem);
                                    var tempButton = buttonFactory.createButton(tempMenuItem, menu.template);

                                    tempMenuItem[menuItem.buttontype].posid = filteredItemsList[j].posid;
                                    tempMenuItem[menuItem.buttontype] = self.setPriceLevelFromMenuFilter(tempMenuItem[menuItem.buttontype]);

                                    // determine button sort order
                                    var sortby = menuItem[menuItem.buttontype].sortby.toLowerCase();
                                    switch (sortby) {
                                        case "attribute":
                                        // sort by attribute
                                        var attr = self.theme.findItemAttribute(filteredItemsList[j], menuItem[menuItem.buttontype].sortattribute);
                                        tempButton.sortvalue = (attr !== null) ? attr.value.toLowerCase() : "";
                                        if (tempButton.sortvalue.toString().length === 0) {
                                            tempButton.sortvalue = "zzzzzzzzzz";
                                        }
                                            break;
                                        case "popularity":
                                        // sort by popularity
                                        if (_nex.assets.theme.itemRank) {
                                                posid = tempMenuItem[menuItem.buttontype].posid;
                                                if (typeof (posid) === "undefined") posid = tempMenuItem[menuItem.buttontype].posid2;
                                                itemRank = self.findItemRank(posid);
                                            if (itemRank !== "zzzzzzzzzz") {
                                                tempButton.sortvalue = itemRank;
                                                tempButton.hasItemRank = true;
                                            }
                                                tempButton.sortvalue = self.findItemRank(posid);
                                    }
                                            break;
                                        default:
                                        // default sort by name (button text)
                                        tempButton.sortvalue = self.theme.itemTextByType(filteredItemsList[j], "BUTTONTEXT");
                                            break;
                                    }

                                    tempButton.init(tempMenuItem);
                                    if (_nex.assets.templateManager.isButtonAvailable(self.currentMenu, templateDetail, tempButton)) {
                                        // add it to the list
                                        availableButtons.push(tempButton);
                                    }
                                    tempMenuItem = null;
                                }
                            }
                        }
                    }
                }
            }
        }

        // sort the buttons
        for (i = 0; i < availableButtons.length; i++) {
            if (!availableButtons[i].hasOwnProperty("sortvalue")) {
                //give non ranked buttons lower presidence by adding 10000.
                //the menu sortby property takes presidence.
                if (!availableButtons[i].hasItemRank && menu.hasOwnProperty("sortby") && menu.sortby.toLowerCase() === "popularity") availableButtons[i].sortvalue = String(i + 10000);
            }
        }

        availableButtons = availableButtons.mergeSort(self.sortButtonTextOrder);

        return availableButtons;
    };

    self.setPriceLevelFromMenuFilter = function (menu) {

        if (menu !== undefined &&
            (self.theme !== null && self.theme !== undefined) &&
            self.theme.filter !== undefined &&
            (self.theme.filter.itemIncludePriceLevel !== undefined &&
            self.theme.filter.itemIncludePriceLevel !== null &&
            self.theme.filter.itemIncludePriceLevel.length > 0)) {
            var priceleveltouse = self.theme.filter.itemIncludePriceLevel;
            if (menu.posid.length > 0) {
                menu.pricelevel = priceleveltouse;
            }
            else {
                menu.pricelevel1 = priceleveltouse;
                menu.pricelevel2 = priceleveltouse;
                menu.pricelevel3 = priceleveltouse;
            }
        }
        return menu;
    };

    self._menuRankExists = function () {
        var result = true;
        if (!_nex.assets.theme.hasOwnProperty("itemRank")) {
            result = false;
        }
        else if (typeof _nex.assets.theme.itemRank !== 'object') {
            result = false;
        }
        else if (!_nex.assets.theme.itemRank.hasOwnProperty("MENURANK")) {
            result = false;
        }
        return result;
    };

    self.findItemRank = function(posid) {
        var itemRank = "zzzzzzzzzz";
        if (!self._menuRankExists()) {
            return itemRank;
        }

        if (!Array.isArray(_nex.assets.theme.itemRank.MENURANK)) {
            _nex.assets.theme.itemRank.MENURANK = self.convertToArray(_nex.assets.theme.itemRank.MENURANK);
        }
        _nex.assets.theme.itemRank.MENURANK.forEach(function(menu) {
            //case where item rank contains multiple items
            if (!Array.isArray(menu) && Array.isArray(menu.ITEM)) {
                menu.ITEM.forEach(function(item) {
                    if (item.posid === posid) {
                        itemRank = item.rank;
                    }
                });
            }
            //case where menu has only one item
            else {
                if (menu.ITEM.posid === posid) {
                    itemRank = menu.ITEM.rank;
                }
            }
        });

        return itemRank;
    };

    self.selectOtherPressed = function (buttonName) {
        var buttonNameParts = buttonName.split('-');
        var buttonIndex = Number(buttonNameParts[2]);
        var buttonObj = self.buttons[buttonIndex];
        buttonObj.click();
    };

    self.convertToArray = function (obj) {
        var result = [];
        if (obj) {
            if (obj instanceof Array) {
                result = obj;
            } else {
                result.push(obj);
            }
        }
        return result;
    };

}
/**
 * The PhaseManager sets a div up for each phase; it keeps track of all the phases specified in the htmltheme;
 * it also keeps track of the current phase.
 * @constructor
 * @param phaseParams - an object that contains the theme and offlinePhase for UX.
 */
function PhaseManager(phaseParams) {
    var self = this;

    self.currentPhase = "";
    self.clipsLoaded = 0;
    self.paymentClipsLoaded = 0;
    self.phases = [];
    self.clips = null;
    self.paymentClips = null;
    self.phaseId = "";
    self.phaseLoaded = function () { }; // event fired when the phase has been loaded
    self.phaseUnloaded = function () { }; // event fired when the phase is unloaded

    $('#targets').empty();

    // Initialize additional properties for UX.
    if (_nex.context === "UX") {

        // add an offline div
        $('#targets').append('<div id="__offline" style="display:none" ></div>');

        // enum of phases for ux
        self.phaseType = {
            "SPLASH": "splash",
            "PREVIOUS_ORDERS": "previousorders",
            "ORDERING": "ordering",
            "POST_ORDERING": "postordering",
            "OFFLINE": "__offline",
            "PAYMENT": "payment",
            "SURVEY": "survey",
            "COMPLETE": "complete",
            "ORDER_GOVERNOR": "ordergovernor",
            "MENUBOARD": "menuboard",
            "SMS": "sms",
            "GREEN_RECEIPT": "greenreceipt",
            "DDMD": "ddmd",
            "STATUS": "status"
        };

        self.phaseMover = new PhaseMover("wrap");
        self.phaseMover.bind('moveUp', 'moveDown', 'moveLeft', 'moveRight');
        self.phaseMover.hide();

        if (!phaseParams) {
            console.log("ERROR: Missing phaseParams to PhaseManager");
        }

        self.theme = phaseParams.theme;
        self.offlinePhase = phaseParams.offlinePhase || {
            id: self.phaseType.OFFLINE,
            CLIP: [
                {
                    id: "offline",
                    filename: "offline.html",
                    mediafolder: "html"
                }
            ]
        };
    }

    self.debugEnabled = false;
    self.debug = function () {
        if (self.debugEnabled) {
            console.debug(arguments);
        }
    };

    // Creates a div for each of the phases.
    self.loadTheme = function (phases) {

        // for ux, remove all phase target divs except for offline for existing phases
        if (_nex.context === "UX") {
            for (var j = 0; j < self.phases.length; j++) {
                if (self.phases[j].id !== self.offlinePhase.id) {
                    $('#' + self.phases[j].id).remove();
                }
            }
        }

        self.currentPhase = "";
        self.phases = phases;

        // create a target for each phase
        for (var i = 0; i < self.phases.length; i++) {
            $('#targets').append('<div id="' + self.phases[i].id + '" style="display:none" ></div>');
        }

        // for ux, add the offline phase as well
        if (_nex.context === "UX") {
            self.phases.push(self.offlinePhase);
        }
    };

    self.loadPhase = function (phaseid) {

        // empty the contents of current phase
        if (self.currentPhase !== '') {
            // phase unload
            self.phaseUnloaded();

            $('#' + self.currentPhase).css("display", "none");
            $('#' + self.currentPhase).empty();
        }

        if (self.phases !== undefined) {
            self.phaseId = phaseid;
            self.clips = self.findPhaseClips(phaseid);
        }
        else {
            self.clips = [];
        }

        self.currentPhase = phaseid;
        return self.clips;
    };

    self.findPhaseClips = function (phaseId) {

        if ((phaseId === undefined) ||
            (phaseId === "")) {
            phaseId = self.currentPhase;
        }

        var clips = null;
        try {
            for (var i = 0; ((i < self.phases.length) && (clips === null)) ; i++) {
                if (self.phases[i].id === phaseId) {
                    clips = self.phases[i].CLIP;
                    clips = $.isArray(clips) ? clips : new Array(clips);
                }
            }
        }
        catch (ex)
        {
            console.log("Exception finding phase clips for phase " + phaseId + "!");
            console.log(ex);
        }

        if (clips === undefined || clips === null) {
            clips = [];
        }

        return clips;
    };

    self.changePhase = function (phaseId, callback, scriptCallback) {

        if (_nex.context === "UX") {
            self.phaseLoaded = callback || function () { };
            self.loadPhaseMover(phaseId);
            if (self.currentPhase === phaseId) {
                self.phaseLoaded();
                return;
            }
        }
        //remove class from targets on phase change to prevent css mishaps
        $('#targets').removeAttr('class');
        $('#template').removeAttr('class');

        // load each clip
        self.clipsLoaded = 0;
        self.paymentClipsLoaded = 0;
        self.clips = self.loadPhase(phaseId);
        self.paymentClips = [];
        for (var i = 0; i < self.clips.length; i++) {
            // load each clip into the 'ordering' div
            var clipId = self.clips[i].id;

            if (clipId.length > 0) {
                var clipName = "clip-" + self.clips[i].id;
                var scriptUri = null;

                if (self.clips[i].hasOwnProperty('script')) {
                    scriptUri = self.clips[i].script;
                }

                if ($('#' + clipName).length > 0) {
                    $('#' + clipName).empty();
                } else {
                    $('#' + phaseId).append("<div id='" + clipName + "'></div>");
                }

                if (_nex.context !== "UX") {
                    _iorderfast.nav.loadMedia((self.clips[i].mediafolder + "/" + self.clips[i].filename),
                        clipName,
                        scriptUri,
                        self.clipLoaded);
                } else {
                    var clip = self.clips[i];

                    self.theme.loadMedia((clip.mediafolder + "/" + clip.filename),
                        clipName,
                        scriptUri,
                        self.clipLoaded,
                        scriptCallback);

                    // If there are any payment clips load those as well.
                    if (clip.hasOwnProperty("PAYMENTCLIP") && clip.PAYMENTCLIP.length > 0) {
                        self.paymentClips = $.isArray(clip.PAYMENTCLIP) ? clip.PAYMENTCLIP : new Array(clip.PAYMENTCLIP);
                        self.loadPaymentClips(phaseId, clip);
                    }
                }

            } else {
                self.clipsLoaded++;
            }
        }
    };

    self.clipLoaded = function (mediaId, data, isPaymentClip) {
        $('#' + mediaId).append(data);

        if (isPaymentClip) {
            self.paymentClipsLoaded++;
        } else {
            self.clipsLoaded++;
        }
        // we want to make sure all the clips are loaded and all the payment clips
        if (self.clipsLoaded === self.clips.length && self.paymentClipsLoaded === self.paymentClips.length) {
            // let DOM updates finish
            window.setTimeout(function () {
                self.phaseLoaded();
                $('#' + self.currentPhase).css("display", "");
            }, 0);
        }
    };

    self.paymentClipLoaded = function (mediaId, data) {
        self.clipLoaded(mediaId, data, true);
    };

    // Load the payment clip children for a specific clip.
    // Assumes there is a clip id.
    // Does nothing if there aren't any <PAYMENTCLIP children.
    self.loadPaymentClips = function (phaseId, clip, paymentScriptLoaded) {

        var paymentClipArray = clip.PAYMENTCLIP;
        if (paymentClipArray) {
            for (var index = 0; index < paymentClipArray.length; index++) {
                var paymentClip = paymentClipArray[index];
                var paymentClipId = paymentClip.id;
                if (paymentClipId) {
                    var paymentClipName = "paymentclip-" + paymentClipId;
                    // Look for the script property. This is required currently.
                    var scriptUri = null;
                    if (paymentClip.hasOwnProperty('script')) {
                        scriptUri = paymentClip.script;
                    }
                    // Append the div. We set the class to the hidden class for fine control over when we show the specific payment clips we want.
                    $('#' + phaseId).append("<div class='paymentclip' id='" + paymentClipName + "' style='display: none;'></div>");

                    // Load the related HTML into the div. Load the related script.
                    self.theme.loadMedia((paymentClip.mediafolder + "/" + paymentClip.filename),
                                                paymentClipName,
                                                scriptUri,
                                                self.paymentClipLoaded,
                                                paymentScriptLoaded);
                }
            }
        }
    };

    // This will change the phase to OFFLINE, and load the offline HTML file and JavaScript file.
    // Once the HTML is done it calls callback.
    // Once the JavaScript is done it calls scriptCallback.
    self.goOffline = function (callback, scriptCallback) {

        // center the offline screen
        var wrap = document.getElementById('wrap');
        if (wrap) {
            wrap.style.left = "0%";
            wrap.style.transform = 'translateX(0%)';
        }

        // load the offline media
        self.changePhase(self.phaseType.OFFLINE, callback, scriptCallback);

    };


    // Loads the phase mover for situations like drive-thru.
    self.loadPhaseMover = function (phaseId) {
        // This logic follows along with the Flash, where there is a PhaseMover that manages
        // where on the screen the phase is shown. For locked screens, sush as the OFFLINE and SPLASH,
        // there is no phase mover. On other screens, if the system is configured like a drive-thru, you get
        // the option of moving the screen around.

        // Positions 0-8 are top-left, top-center, etc.
        // The 9th option is 'touch' positioning, where it puts the screen where you touch.
        var TOUCH_POSITIONING = '9';

        // Setup screen moving.
        if (phaseId === self.phaseType.OFFLINE || phaseId === self.phaseType.SPLASH) {
            // Hide the screen mover for 'locked' phases like OFFLINE and SPLASH.
            self.phaseMover.reset();
            self.phaseMover.hide();
        } else {
            // Read the configuration.
            var splashTouchBehavior = (_nex.assets.theme.system.USERINTERFACE.hasOwnProperty("POSITION")) ? (_nex.assets.theme.system.USERINTERFACE.POSITION.align || 9) : 9;
            var resolution = (_nex.assets.theme.system.USERINTERFACE.hasOwnProperty("POSITION")) ? (_nex.assets.theme.system.USERINTERFACE.POSITION.resolution || 8) : 8;

            // Read any configuration overrides.
            if (_nex.splashPhase.splashSettings) {
                if (_nex.splashPhase.splashSettings.align) {
                    splashTouchBehavior = _nex.splashPhase.splashSettings.align;
                }
                if (_nex.splashPhase.splashSettings.resolution) {
                    resolution = _nex.splashPhase.splashSettings.resolution;
                }
            }
            if (!_nex.splashPhase.handledSplashClick) {
                // If we are coming from the touch on the splash screen,
                // position according to the 'splash touch behavior' setting.
                if (splashTouchBehavior === TOUCH_POSITIONING) {
                    self.phaseMover.show(_nex.splashPhase.clickX, _nex.splashPhase.clickY);
                } else {
                    // all the others are 0-8 for the top-left, top-center, etc.
                    self.phaseMover.positionToSpot(splashTouchBehavior);
                    self.phaseMover.show();
                }
                _nex.splashPhase.handledSplashClick = true;
            }

            // Resize.
            self.phaseMover.size(resolution);
        }
    };
};
/**
 * The PopupManager shows and hides popups.
 * @constructor
 */
function PopupManager(popupParams, callback) {
    var self = this;

    self.popupInfo = new Array();
    self.popupstarttime = null;

    // properties
    if (_nex.context === "UX") {
        self.popups = popupParams.popups;   
        self.theme = popupParams.theme;

        if (self.popups.hasOwnProperty("POPUP")) {
            self.popupInfo = $.isArray(self.popups.POPUP) ? self.popups.POPUP : new Array(self.popups.POPUP);
        }
    } else {
        self.popups = popupParams;
        self.theme = _iorderfast.assets.theme;
    }

    self.debugEnabled = false;
    self.debug = function () {
        if (self.debugEnabled) {
            console.debug("PopupManager", arguments);
        }
    };

    self.initCallback = callback;

    // methods
    self.popupsLoaded = function (mediaId, data) {
        $('#' + mediaId).append(data);

        // console.log("popupManager - popupsLoaded");

        if (self.initCallback !== null) {
            self.initCallback();
        }
    };

    // initialization
    if (self.popups !== undefined) {
        // create a target for the popups
        // load it into the targets
        var popups = $("#targets").find("#popups");
        if (popups.length > 0) {
            popups.remove();
        }
        $('#targets').append('<div id="' + self.popups.id + '" ></div>');

        var scriptUri = null;
        if (self.popups.hasOwnProperty('script')) {
            scriptUri = self.popups.script;
        }

        if (_nex.context === "UX") {
            self.theme.loadMedia((self.popups.mediafolder + "/" + self.popups.filename),
            self.popups.id,
            scriptUri,
            self.popupsLoaded);
        } else {
            _iorderfast.nav.loadMedia((self.popups.mediafolder + "/" + self.popups.filename),
                self.popups.id,
                scriptUri,
                self.popupsLoaded);
        }

    }

    self._getPopup = function (id) {
        var popup = null;

        for (var i = 0; (i < self.popupInfo.length) && (popup === null); i++) {
            if (self.popupInfo[i].id.toLowerCase() === id.toLowerCase()) {
                popup = self.popupInfo[i];
            }
        }

        return popup;
    }

    /*
     * Parameters:
     * popup - object of properties of the popoup
     * {
     *  name: (string),
     *  message: (string),
     *  buttons: [
     *      text: (string),
     *      clickEvent: (string)
     *  ]
     * }
     */
    self.showPopup = function (popupProp, callback, timeout) {
        var popupHtml = null;
        if (typeof popupProp === "object") {
            popupHtml = $('#' + popupProp.name);
            if (popupHtml.length > 0) {

                var messageText = popupHtml.find('#messageText');
                if ((messageText.length > 0) && (popupProp.message.length > 0)) {
                    messageText.empty();
                    messageText.append(popupProp.message);
                    messageText.attr("tabindex", "1");
                }

                if (popupProp.hasOwnProperty("roundUpYesAmount")) {
                    var roundUpYesAmountText = popupHtml.find('#roundUpYesAmountText');
                    if ((roundUpYesAmountText.length > 0) && (popupProp.roundUpYesAmount.length > 0)) {
                        roundUpYesAmountText.empty();
                        roundUpYesAmountText.append(popupProp.roundUpYesAmount);
                    }
                }
                if (popupProp.hasOwnProperty("roundUpNoAmount")) {
                    var roundUpNoAmountText = popupHtml.find('#roundUpNoAmountText');
                    if ((roundUpNoAmountText.length > 0) && (popupProp.roundUpNoAmount.length > 0)) {
                        roundUpNoAmountText.empty();
                        roundUpNoAmountText.append(popupProp.roundUpNoAmount);
                    }
                }

                if (popupProp.hasOwnProperty("setContent")) {
                    popupProp.setContent(popupHtml);
                }

                self.debug(popupProp.buttons);
                if (popupProp.buttons !== undefined) {
                    for (var i = 0; i < popupProp.buttons.length; i++) {
                        var button = popupHtml.find("#" + popupProp.buttons[i].id);
                        if (button.length > 0) {
                            // reset the state of the button
                            button.button();
                            button.button("reset");

                            // Hide the button if the hidden property is set to true.
                            if (popupProp.buttons[i].hidden) {
                                button.hide();
                            }

                            // Show button text if it exists.
                            if (popupProp.buttons[i].text !== undefined) {
                                button.empty();
                                button.append(popupProp.buttons[i].text);
                            }

                            // Setup the click event.
                            var clickEvent = popupProp.buttons[i].clickEvent || "";

                            // Only for UX, also play a button hit sound.
                            if (_nex.context === "UX") {
                                if (clickEvent.length > 0) {
                                    clickEvent = "_nex.assets.soundManager.playButtonHit();" + clickEvent;
                                }
                            }

                            // Set the event info.
                            self.debug("setting click event to " + clickEvent);
                            button.attr("onclick", clickEvent);
                            if (!button.attr("tabindex")) {
                                button.attr("tabindex", "1");
                            }
                        }
                    }
                }

                if(popupProp.hasOwnProperty('onShowCallback') &&
                   (popupProp.onShowCallback) && (typeof popupProp.onShowCallback === "function")) {
                    popupHtml.off('shown.bs.modal');
                    popupHtml.on('shown.bs.modal', function () {
                        self._kviReader(messageText);
                        popupProp.onShowCallback();
                        popupProp.onShowCallback = function () { }; // reset the callback after so it is not available when the popup is reused
                    });
                } else {
                    popupHtml.off('shown.bs.modal');
                    popupHtml.on('shown.bs.modal', function () {
                        self._kviReader(messageText);
                    });
                }


                popupHtml.modal('show');

                if (self._kviReader && self._kviReader.rebind) {
                    self._kviReader.rebind();
                }

                // set the start time, if the popup type uses a delay
                if (popupProp.usedelay) {
                    self.popupstarttime = new Date();
                }

                if (_nex.context === "UX") {
                    // Move the backdrop under popup, but in front of the rest of the page.                    
                    $(".modal-backdrop").appendTo("#wrap");
                    if (popupProp.autotimeout) {
                        setTimeout(function () {
                            popupHtml.modal('hide');
                        }, timeout || 4000);
                    }
                    
                    // play voiceover
                    if(popupProp.hasOwnProperty("voiceover") &&
                        popupProp.voiceover.length > 0) {
                        
                        var voiceover = popupProp.voiceover;
                        var popupInfo = self._getPopup(popupProp.name);
                        if((popupInfo !== null) &&
                            popupInfo.hasOwnProperty("voiceover") &&
                            popupInfo.voiceover.length > 0) {
                            voiceover = popupInfo.voiceover;
                        }

                        _nex.assets.soundManager.playVoiceover(voiceover);
                    }
                }

                popupHtml.off('hidden.bs.modal');

                // If there is a callback, call it when the popup hides.
                if (callback !== undefined) {
                    popupHtml.on('hidden.bs.modal', function (e) {
                        try {
                            if (popupProp.hasOwnProperty("clearContent")) {
                                popupProp.clearContent(popupHtml);
                            }
                        } catch (e) { }
                        if (!_nex.timingOut) {
                            callback();
                        } else {
                            window.setTimeout(function () {
                                _nex.timingOut = false;
                            }, 0);
                        }
                    });
                }
            } else {
                console.error("PopupManager: popup " + popupProp.name + " not found");
                if (callback !== undefined) {
                    callback();
                }
            }
        } else {
            console.error("PopupManager: Could not find popup " + popupProp.name);
        }
        return popupHtml;
    };

    self._kviReader = function ($messageText) {
        if (_nex.kviReader && _nex.kviReader.rebind) {
            _nex.kviReader.rebind();
            if ($messageText.length > 0) {
                $messageText.focus()
            }
        }
    };

    // Hide a specific popup.
    self.hidePopup = function (popupProp, callback) {

        // The name of the popup is the id of the element.
        var elementId = popupProp.name;

        // Use jQuery to get and hide the element.
        var element = $("#" + elementId);

        if (element.length <= 0) {
            callback();
        }
        // set the delay
        var delay = 0;
        if (popupProp.usedelay) {
            var delaytimesetting = 0;
            // check for the delay setting in system.xml
            if (self.theme.system.USERINTERFACE.popupdelaytime != undefined && $.isNumeric(self.theme.system.USERINTERFACE.popupdelaytime)) {
                delaytimesetting = Number(self.theme.system.USERINTERFACE.popupdelaytime);
            }
            // subtract the time the popup has already been open
            delay = delaytimesetting - self.popupElapsedTime(self.popupstarttime);
            if (delay < 0) {
                delay = 0;
            }
            // reset the global variable
            self.popupstarttime = null;
        }

        // If a callback was given, call it.
        if (callback !== undefined) {
            console.log("popupmanager.hidePopup - listen for popup to be hidden");
            element.on('hidden.bs.modal', function (e) {
                console.log("popupmanager.hidePopup - popup hidden");
                element.off('hidden.bs.modal');
                callback();
            });
        }

        setTimeout(function () {
            if (element.length > 0) {
                // Because we are using .modal('show') to show the popup, use .modal('hide') to hide it.
                element.modal("hide");

                // Cleanup the backdrop in case it is left behind.
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
            }
            else {
                // For the UX previewer, suppress the error that the popup is missing.
                if (!inPreviewer()) {
                    console.log("popupManager: Missing element " + elementId + " to hide.");
                }
            }
        }, delay);
    };

    // Hide not just one popup, but all the popups.
    self.hideAllPopups = function (callback) {
        console.log("hide all popups called.");

        var modalCount = $(".modal:visible").length;

        // If there aren't any modals to close, simply return early.
        if (modalCount <= 0) {
            console.log("No popups. Calling callback.");
            if (callback) {
                callback();
            }
            return;
        }

        // This is a safer way to close all modals.
        // They must be closed one at a time.
        // Also, only try to close visible modals.
        var id = "";
        $(".modal:visible").each(function (index) {
            if (index !== (modalCount - 1)) {
                // all the popups beside the last one
                $(this).modal("hide");

                // Cleanup the backdrop in case it is left behind.
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
            } else {
                // last one, when it is hidden, call the callback.
                if (callback) {
                    $(this).on('hidden.bs.modal', function (e) {
                        $(this).off('hidden.bs.modal');
                        callback();
                    });
                }
                $(this).modal("hide");
            }
        });
    };

    // determine the amount of time the popup has been open
    self.popupElapsedTime = function (starttime) {
        var timeperiod = 0;
        var currdatetime = new Date();

        // if the starttime is valid
        if (starttime != undefined && $.isNumeric(starttime.getTime())) {
            // milliseconds between start and now 
            timeperiod = currdatetime.getTime() - starttime.getTime();
            if (timeperiod < 0) {
                timeperiod = 0;
            }
        }
        return timeperiod;
    };

    self.errorPopup = {
        name: "popup-error",
        message: "",
        buttons: [],
        autotimeout: true
    };

    self.messagePopup = {
        name: "popup-message",
        message: "",
        buttons: [],
        autotimeout: true
    };

    self.processingPopup = {
        name: "popup-processing",
        message: "Processing...",
        buttons: [],
        usedelay: true,
        onShowCallback: function () { }
    };

    self.futurePopup = {
        name: "popup-future",
        message: "",
        buttons: [
            {
                id: "yes",
                text: self.theme.getTextAttribute("ORDER", "yes", "YES"),
                clickEvent: ""
            },
            {
                id: "no",
                text: self.theme.getTextAttribute("ORDER", "no", "NO"),
                clickEvent: ""
            }
        ]
    };

    self.yesNoPopup = {
        name: "popup-yes-no",
        message: "",
        buttons: [
            {
                id: "yes",
                text: self.theme.getTextAttribute("ORDER", "yes", "YES"),
                clickEvent: ""
            },
            {
                id: "no",
                text: self.theme.getTextAttribute("ORDER", "no", "NO"),
                clickEvent: ""
            }
        ]
    };

    self.charityYesNoPopup = {
        name: "popup-charity-yes-no",
        message: "",
        roundUpYesAmount: "",
        roundUpNoAmount: "",
        buttons: [
            {
                id: "yes",
                text: self.theme.getTextAttribute("ORDER", "yes", "YES"),
                clickEvent: ""
            },
            {
                id: "no",
                text: self.theme.getTextAttribute("ORDER", "no", "NO"),
                clickEvent: ""
            }
        ]
    };

    self.dicoPopup = {
        name: "popup-dico",
        message: "",
        buttons: [
            {
                id: "dinein",
                text: self.theme.getTextAttribute("ORDERREVIEW", "dinetext", "DINE IN"),
                clickEvent: ""
            },
            {
                id: "takeout",
                text: self.theme.getTextAttribute("ORDERREVIEW", "taketext", "TAKE OUT"),
                clickEvent: ""
            }
        ],
        voiceover: "Dine In or Take Out.mp3"
    };

    self.needMoreTimePopup = {
        name: "popup-need-more-time",
        message: "",
        buttons: [
            {
                id: "yes",
                text: self.theme.getTextAttribute("ORDER", "yes", "YES"),
                clickEvent: ""
            }
        ],
        voiceover: "Need More Time.mp3"
    };

    self.dismissibleMessagePopup = {
        name: "popup-dismissible-message",
        message: "",
        buttons: [
            {
                id: "dismissibleok",
                text: self.theme.getTextAttribute("ORDER", "ok", "OK"),
                clickEvent: ""
            }
        ]
    };

    self.ageVerificationPopup = {
        name: "popup-age-verification",
        header: "",
        message: "",
        buttons: [
            {
                id: "over21",
                text: self.theme.getTextAttribute("AGEVERIFICATION", "over21", "I am over 21"),
                clickEvent: ""
            },
            {
                id: "under21",
                text: self.theme.getTextAttribute("AGEVERIFICATION", "under21", "I am under 21"),
                clickEvent: ""
            }
        ]
    };

    self.nutritionPopup = {
        name: "popup-nutrition",
        header: "",
        message: "",
        buttons: [],
        item: null,
        setContent: function (popupHtml) {
            if (this.item !== null) {
                self.theme.setNutrition(this.item, popupHtml, false);
            }
        }
    };

    // Popup for on screen keyboard
    self.keyboardPopup = {
        name: "popup-keyboard",
        message: "",
        buttons: [
            {
                id: "ok",
                text: self.theme.getTextAttribute("ORDER", "save", "SAVE"),
                clickEvent: ""
            },
            {
                id: "cancel",
                text: self.theme.getTextAttribute("ORDER", "cancel", "CANCEL"),
                clickEvent: ""
            }
        ]
    };

    // Popup for on screen keyboard with additional keys to help with email
    self.emailPopup = {
        name: "popup-email",
        message: "",
        buttons: [
            {
                id: "ok",
                text: self.theme.getTextAttribute("ORDER", "save", "SAVE"),
                clickEvent: ""
            },
            {
                id: "cancel",
                text: self.theme.getTextAttribute("ORDER", "cancel", "CANCEL"),
                clickEvent: ""
            }
        ]
    };

    // Popup for just entering numbers.
    self.numpadPopup = {
        name: "popup-numpad",
        message: "",
        buttons: [
            {
                id: "ok",
                text: self.theme.getTextAttribute("ORDER", "ok", "OK"),
                clickEvent: ""
            },
            {
                id: "cancel",
                text: self.theme.getTextAttribute("ORDER", "cancel", "CANCEL"),
                clickEvent: ""
            }
        ],
        onShowCallback: function () { }
    };

    self.upcpadPopup = {
        name: "popup-upcpad",
        message: "",
        buttons: [
            {
                id: "ok",
                text: self.theme.getTextAttribute("ORDER", "save", "SAVE"),
                clickEvent: ""
            },
            {
                id: "cancel",
                text: self.theme.getTextAttribute("ORDER", "cancel", "CANCEL"),
                clickEvent: ""
            }
        ]
    };

    // Popup for entering a pin
    self.pinpadPopup = {
        name: "popup-pinpad",
        message: "",
        buttons: [
            {
                id: "ok",
                text: self.theme.getTextAttribute("ORDER", "save", "SAVE"),
                clickEvent: ""
            },
            {
                id: "cancel",
                text: self.theme.getTextAttribute("ORDER", "cancel", "CANCEL"),
                clickEvent: ""
            }
        ],
        autotimeout: true
    };

    // Popup for a phon enumber
    self.phonepadPopup = {
        name: "popup-phonepad",
        message: "",
        buttons: [
            {
                id: "ok",
                text: self.theme.getTextAttribute("ORDER", "ok", "OK"),
                clickEvent: ""
            },
            {
                id: "cancel",
                text: self.theme.getTextAttribute("ORDER", "cancel", "CANCEL"),
                clickEvent: ""
            }
        ]
    };
    // Popup for name
    self.NamePopup = {
        name: "popup-name",
        message: "",
        buttons: [
            {
                id: "ok",
                text: self.theme.getTextAttribute("ORDER", "ok", "OK"),
                clickEvent: ""
            },
            {
                id: "cancel",
                text: self.theme.getTextAttribute("ORDER", "cancel", "CANCEL"),
                clickEvent: ""
            }
        ]
    };
    // Popup for name
    self.PagerPopup = {
        name: "popup-pager",
        message: "",
        buttons: [
            {
                id: "ok",
                text: self.theme.getTextAttribute("ORDER", "ok", "OK"),
                clickEvent: ""
            },
            {
                id: "cancel",
                text: self.theme.getTextAttribute("ORDER", "cancel", "CANCEL"),
                clickEvent: ""
            }
        ],
        onShowCallback: function () { }
    };
    self.orderOptionsPopup = {
        name: "popup-orderOptions",
        message: "",
        buttons: [
            {
                id: "lookupPin",
                text: self.theme.getTextAttribute("ORDER", "pin", "I HAVE AN ORDER PIN"),
                clickEvent: ""
            },
            {
                id: "previousOrder",
                text: self.theme.getTextAttribute("ORDER", "previous", "LOOKUP PREVIOUS ORDERS"),
                clickEvent: ""
            },
            {
                id: "newOrder",
                text: self.theme.getTextAttribute("ORDER", "new", "START A NEW ORDER"),
                clickEvent: ""
            }
        ]
    };

    self.lookupPopupVideo = {
        name: "popup-lookupvideo",
        message: "",
        buttons: [
            {
                id: "cancel",
                text: self.theme.getTextAttribute("ORDER", "cancel", "CANCEL"),
                clickEvent: ""
            }
        ],
        setContent: function (popupHtml) {
            // Show the video feed.
            self.theme.setVideoFeed(popupHtml);
        },
        clearContent: function(popupHtml){
            self.theme.clearVideoFeed(popupHtml);
        },
        autotimeout : false
    };

    self.lookupPopup = {
        name: "popup-lookup",
        message: "",
        buttons: [
            {
                id: "ok",
                text: self.theme.getTextAttribute("ORDER", "ok", "OK"),
                clickEvent: ""
            },
            {
                id: "cancel",
                text: self.theme.getTextAttribute("ORDER", "cancel", "CANCEL"),
                clickEvent: ""
            }
        ]
    };

    self.offersPopup = {
        name: "popup-offers",
        message: "",
        buttons: [
            {
                id: "ok",
                text: self.theme.getTextAttribute("OFFERS", "ok", "OK"),
                clickEvent: ""
            }
        ]
    };


}
/**
 * Manages the tabindexes on elements.
 * @constructor
 */
function TabManager() {
    var self = this;

    self.tabNav = function () {
        $("#navChangeAccount").attr("tabindex", "21");
        $("#navChangePassword").attr("tabindex", "22");
        $("#navLogout").attr("tabindex", "23");
    };

    self.previousOrders = function () {
        self.addTabIndex("a", 2);
        self.addTabIndex("button#ctrl-continue", 3); // continue should come before cancel
        self.addTabIndex("button", 4);
    };

    self.ordering = function () {
        $(".menu-header-text").attr("tabindex", "1");
        self.tabButtons();
    };

    self.tabInputs = function () {
        $('input[type="text"], select,textarea').attr('tabindex', 2);

    };

    self.tabCompleteMobile = function () {

    };

    self.tabButtons = function () {
        // order review buttons are in the middle of the page
        if (_nex.kviReader) {
            $("div#orderreview").each(function (index) {
                if (_nex.kviReader) {
                    $(this).attr("tabindex", "2");
                }
            });
        } else {
            $(".order-review-item", "#orderreview").each(function (index) {
                var text = $(this).text();
                var trimmedText = text.trim();
                if (trimmedText.length > 0) {
                    $(this).attr("tabindex", "2");
                }
            });
        }

        // order review item
        $(".order-review-item").each(function (index) {
            $(this).attr("tabindex", "2");
        });

        // order review quantity
        $(".order-review-quantity-minus, .order-review-quantity-plus").each(function (index) {
            $(this).attr("tabindex", "2");
        });

        // continue, done, submit, orderview... these kind of buttons are in the footer
        $('#ctrl-continue, #ctrl-done, #ctrl-submit, #ctrl-orderreview').each(function (index) {
            $(this).attr("tabindex", "3");
        });
        // add item shows up on order review after that
        $('#ctrl-add-item').each(function (index) {
            $(this).attr("tabindex", "4");
        });
        // then back
        $('#ctrl-back').each(function (index) {
            $(this).attr("tabindex", "5");
        });
        // then cancel last, which doesn't appear in UX, but only in mobile
        $('#ctrl-cancel').each(function (index) {
            $(this).attr("tabindex", "10");
        });
    };

    // Check if a DOM item has a tab index.
    self.hasTabIndex = function ($item) {
        return $($item).is('[tabindex]');
    };

    /**
     * Add a tab index to each item in the selector (if it does not have one already).
     * Use override flag to true to force it when a tab index is already there.
     * @memberof TabManager
     */
    self.addTabIndex = function (selector, tabindex, override) {
        if (!selector || typeof selector !== "string") {
            return;
        }
        var $items = $(selector);
        $items.each(function (index, item) {
            var $item = $(item);
            if ((!self.hasTabIndex($item)) || override) {
                console.debug("Adding tab index " + tabindex + " to " + selector + " index " + index);
                $item.attr('tabindex', tabindex);
            } 
        });
    };

    /**
     * Remove the tab index from an item.
     * @memberof TabManager
     */
    self.removeTabIndex = function (selector) {
        if (!selector || typeof selector !== "string") {
            return;
        }
        var $items = $(selector + " [tabindex]");
        $items.each(function (index, $item) {
            $item.removeAttr('tabindex', tabindex);
        });
    };

}
/**
 * TemplateManager
 * @constructor
 */
function TemplateManager(templates) {
    var self = this;

    self._pendingScan = false;

    self.templates = templates.TEMPLATE;
    self.buttonRegions = $.isArray(templates.BUTTONREGIONS) ? templates.BUTTONREGIONS : new Array(templates.BUTTONREGIONS);
    
    // preload scripts
    try {
        for (var i = 0; i < self.templates.length; i++) {
            if (self.templates[i].hasOwnProperty("scripturl") &&
                (self.templates[i].scripturl.length > 0)) {

                if (_nex.assets.theme.loadScript) {
                    var baseJSPath = _nex.assets.theme.mediaPath() + "html/js/";
                    var jsPath = baseJSPath + self.templates[i].scripturl;
                    _nex.assets.theme.loadScript(jsPath);
                }
            }
        }
    }
    catch (e) { }

    self.findTemplate = function (templateName) {

        var template = null;

        for (var i = 0; (i < self.templates.length) && (template === null) ; i++) {
            if (self.templates[i].name === templateName) {
                template = $.extend(true, {}, self.templates[i]); // copy the template so if an object changes the template it does not impact other objects
            }
        }

        return template;
    };

    self.templatePricedBy = function (templateName) {
        var pricedBy = "item";
        var template = self.findTemplate(templateName);

        if ((template !== null) &&
            template.hasOwnProperty("pricedby")) {
            pricedBy = template.pricedby;
        }

        return pricedBy;
    };

    self.isOrderReview = function (templateName) {

        var isOrderReview = false;

        var template = self.findTemplate(templateName);
        if ((template !== null) &&
            template.hasOwnProperty("classname")) {
            isOrderReview = ((templateName.toLowerCase() === "order review") ||
            (template.classname.toLowerCase() === "orderreview"));
        } else {
            isOrderReview = (templateName.toLowerCase() === "order review");
        }

        return isOrderReview;
    };

    self.isReceiptVisible = function (templateName, orderTotal) {
        var displayReceipt = true;

        var template = self.findTemplate(templateName);
        if ((template !== null) &&
            template.hasOwnProperty("displayreceipt")) {
            displayReceipt = (template.displayreceipt.toLowerCase() === "true");
        }

        displayReceipt = ((orderTotal > 0) ||
                         (_nex.assets.theme.system.USERINTERFACE.hasOwnProperty("alwaysshowreceipt") && (_nex.assets.theme.system.USERINTERFACE.alwaysshowreceipt.toLowerCase() === "true")));

        return displayReceipt;
    };

    self.findButtonRegions = function (buttonRegionsId) {

        var buttonRegions = null;
        buttonRegionsId = buttonRegionsId || "";

        if (buttonRegionsId.length > 0) {
            for (var i = 0; (i < self.buttonRegions.length) && (buttonRegions === null) ; i++) {
                if (self.buttonRegions[i].id === buttonRegionsId) {
                    buttonRegions = self.buttonRegions[i];
                }
            }
        } else if (self.buttonRegions.length > 0) {
            buttonRegions = self.buttonRegions[0]; // return the first button region when a button region id is not specified
        }

        return buttonRegions;
    };

    self.getButtonId = function (templateName, buttonType) {

        var buttonId = "";

        if ((templateName !== undefined) && (buttonType !== undefined)) {
            var template = self.findTemplate(templateName);
            if ((template !== null) &&
                template.hasOwnProperty('SUPPORTEDBUTTONTYPE')) {

                var buttonTypes = $.isArray(template.SUPPORTEDBUTTONTYPE) ? template.SUPPORTEDBUTTONTYPE : new Array(template.SUPPORTEDBUTTONTYPE);
                for (var i = 0; (i < buttonTypes.length) && (buttonId === "") ; i++) {
                    if ((buttonTypes[i].buttontype === buttonType) &&
                        (buttonTypes[i].buttonid !== undefined)) {
                        buttonId = buttonTypes[i].buttonid;
                    }
                }
            }
        }

        return buttonId;
    };

    self.getColumnCount = function (templateName, buttonCount) {
        var columnCount = 4;

        try {
            if ((templateName !== undefined) && (templateName !== null)) {
                var template = self.findTemplate(templateName);
                if (template !== null) {

                    if ((template.hasOwnProperty('buttonrendermode')) &&
                        (template.buttonrendermode.toLowerCase() === "dynamic")) {

                        var buttonRegions = self.findButtonRegions(template.buttonregionsid);
                        
                        if (buttonRegions !== null) {
                            var buttonRegion = $.isArray(buttonRegions.BUTTONREGION) ? buttonRegions.BUTTONREGION : new Array(buttonRegions.BUTTONREGION);
                            for (var i = 0; i < buttonRegion.length; i++) {
                                if ((buttonCount <= Number(buttonRegion[i].buttoncount)) ||
                                    (i === buttonRegion.length - 1)) {

                                    columnCount = Number(buttonRegion[i].columns);
                                    if ((buttonCount < columnCount) && (buttonRegion[i].colalign === "center")) {
                                        // set the column count to button to ensure the columns are centered
                                        columnCount = buttonCount;
                                    }

                                    break;
                                }
                            }
                        }
                    } else if ((template.hasOwnProperty('htmlcolumns')) &&
                                (template.htmlcolumns.length > 0)) {
                        columnCount = Number(template.htmlcolumns);
                    }
                }
            }
        } catch (e) {
            // fail gracefully
        }

        return columnCount;
    };

    self.executeBehavior = function (menu) {
        var template = self.findTemplate(menu.template);
        if (template !== null) {
            if (self.templateBehaviors.hasOwnProperty(template.classname)) {
                if (self.templateBehaviors[template.classname].hasOwnProperty("executeBehavior")) {
                    return self.templateBehaviors[template.classname].executeBehavior(menu, template);
                }
            }
        }
    };

    self.hasButtons = function (menu) {
        var hasBtns = true;
        var template = self.findTemplate(menu.template);
        if (template !== null) {
            if (self.templateBehaviors.hasOwnProperty(template.classname)) {
                if (self.templateBehaviors[template.classname].hasOwnProperty("hasButtons")) {
                    return self.templateBehaviors[template.classname].hasButtons(menu, template);
                }
            }
        }

        return hasBtns;
    };

    self.templateLoaded = function (menu) {
        var template = self.findTemplate(menu.template);
        if (template !== null) {
            if (self.templateBehaviors.hasOwnProperty(template.classname)) {
                if (self.templateBehaviors[template.classname].hasOwnProperty("templateLoaded")) {
                    return self.templateBehaviors[template.classname].templateLoaded(menu, template);
                }
            }
        }
    };

    self.templateUnloaded = function (menu) {
        try {
            //cleanup any objects left over from previous templates
            if (self.barListener !== undefined && self.barListener !== null) {
                self.barListener.stop();
            }
        
            if (menu) {
                var template = self.findTemplate(menu.template);
                if (template !== null) {
                    var className = self._getClassName(template);
                    if (self.templateBehaviors[className].hasOwnProperty("templateUnloaded")) {
                        return self.templateBehaviors[className].templateUnloaded(menu, template);
                    }
                }
            }
        } catch (e) {

        }
    };

    // performs template specific logic to update the buttons on the current template
    self.refreshButtons = function (menu, buttons) {

        var template = self.findTemplate(menu.template);
        if (template !== null) {
            var className = self._getClassName(template);
            
            if (self.templateBehaviors[className].hasOwnProperty("refreshButtons")) {
                return self.templateBehaviors[className].refreshButtons(menu, template, buttons);
            }
        }
    };

    self.isButtonAvailable = function (menu, template, button) {
        var isAvailable = true;

        if (template) {
            var className = self._getClassName(template);
            
            if (self.templateBehaviors.hasOwnProperty(className) &&
                self.templateBehaviors[className].hasOwnProperty("isButtonAvailable")) {
                isAvailable = self.templateBehaviors[className].isButtonAvailable(menu, template, button);
            }
        }

        return isAvailable;
    };

    self.getPriceOverride = function (templateName, posid) {
        var priceOverride = "";

        if (templateName) {
            var template = self.findTemplate(templateName);
            var className = self._getClassName(template);

            if (self.templateBehaviors.hasOwnProperty(className) &&
                self.templateBehaviors[className].hasOwnProperty("getPriceOverride")) {
                priceOverride = self.templateBehaviors[className].getPriceOverride(posid);
            }
        }

        return priceOverride;
    };

    self._getClassName = function (template) {
        var className = "_defaultBehavior"; // if the template does not have a behavior return the default behavior

        if(template.classname &&
           self.templateBehaviors.hasOwnProperty(template.classname)) {
            className = template.classname;
        }

        return className;
    };

    self.isContinueVisible = function (menu) {
        var isVisible = true;
        var template = self.findTemplate(menu.template);
        if (template !== null) {
            if (self.templateBehaviors.hasOwnProperty(template.classname)) {
                if (self.templateBehaviors[template.classname].hasOwnProperty("continueButton")) {
                    return self.templateBehaviors[template.classname].continueButton(menu, template);
                }
            }
        }

        return isVisible;
    };

    /*
     * template behaviors
     * classname : {
     *  executeBehavior : function(menu) {
     *          // perform logic specific to the template        
     *      },
     *  templateLoaded : function(menu, template) {
     *          // perform logic specific to the template        
     *      },
     *  templateUnloaded : function (menu, template) {
     *          // perform logic when a template is about to be unloaded
     *       },
     *  refreshButtons : function(menu, template, buttons) {
     *          // performs logic to update the current visible buttons
     *          //  for example, button state changes when a quantity threshold is reached
     *      },
     *  continueButton : function(menu, template) {
     *          // return true/false if the continue button is visible
     *      },
     *  doneButton : function(menu, template) {
     *          // return true/false if the done button is visible
     *      },
     *  isButtonAvailable : function (menu, template, button) {
     *          // return true/false if the button is available
     *      },
     *  getPriceOverride : function(price) {
     *          // return a price if exists; if an override does not exist then return an empty string
     *      }
     * }
     */
    self.templateBehaviors = {
        _defaultBehavior :{
            refreshButtons: function (menu, template, buttons, isLoading) {
                // calculate max quantity
                var _scrollIndex = 0; // TODO - Future use if pagination is added
                var currentItem = null;
                if (_nex.context === "UX") {
                    currentItem = _nex.orderManager.currentOrder.currentItem();
                } else {
                    currentItem = _iorderfast.ordering.currentItem();
                }

                var maxQuantity = (menu.hasOwnProperty("maxquantity") && (menu.maxquantity.length > 0)) ? Number(menu.maxquantity) : 0;
                if ((maxQuantity > 0)  && (currentItem !== null)) {
                    var total = 0;
                    var mods = currentItem.ITEM; // array
                    var byMenu = (template.hasOwnProperty("pricedby") && (template.pricedby.toLowerCase() === "menu"));
				
                    if (mods) {
                        // count the total number of mods
                        for (var i = 0; i < mods.length; i++) {
                            // skip "-NO" items
                            var includeQuantity = true;
                            var buttonInfo = mods[i].BUTTONINFO;
                            if (((buttonInfo) &&
                                (buttonInfo.hasOwnProperty("removeposid")) &&
                                (buttonInfo.removeposid === mods[i].posid)) ||
                                (mods[i].posid.toLowerCase().indexOf("-no") !== -1)) {
                                includeQuantity = false;
                            }

                            if (includeQuantity) {
                                if (byMenu) {
                                    if (mods[i].menuid === _nex.ordering.currentMenuId.toString()) {
                                        total += Number(mods[i].modquantity);
                                    }
                                } else {
                                    total += Number(mods[i].modquantity);
                                }
                            }
                        }
                    }

                    if (total >= maxQuantity) {
                        for (var i = 0; i < buttons.length; i++) {
                            var found = false;
                            for (var j = 0; j < mods.length && !found; j++) {
                                found = (Number(mods[j].bindex) === (i + _scrollIndex)) && 
                                        (mods[j].menuid === _nex.ordering.currentMenuId.toString());
                            }
						
                            // disable the button if it is not a selected modifier; found will be false if it is not selected mod
                            if (!found) {
                                var state = buttons[i].html.data("state");
                                if ((state) && (state.toLowerCase() === "up")) {
                                    buttons[i].html.addClass("gray-out");
                                }
                            }
                        }
					
                        if (!isLoading && (_nex.assets.theme.system.USERINTERFACE.autoadvance.toLowerCase() !== "false")) {
                            _nex.ordering.loadMenu(Number(menu.continuemenu));
                        }
                    } else {
                        // re-enable all disabled buttons
                        for (var j = 0; j < buttons.length; j++) {
                            // disable the button if it is not a selected modifier; found will be false if it is not selected mod
                            buttons[j].html.removeClass("gray-out");
                        }
                    }
                }
            }
        },
        SelectManyofNIntegratedFlavor: {
            templateLoaded: function (menu, template) {
                if (template.hasOwnProperty("itemtype") &&
                    (template.itemtype.toLowerCase() === "item")) {
                    // future use
                } else {
                    var currentItem = _nex.ordering.currentItem();

                    var maxCount = this.calcMaxCount(menu, template, currentItem);
                    var flavorCount = this.getModifierCount(menu, template, currentItem);

                    currentItem.flavorcount = flavorCount;
                }

                this.refreshButtons(menu, template, _nex.ordering.buttons, true);
            },
            executeBehavior: function (menu, template) {

                if (template.hasOwnProperty("itemtype") &&
                    template.itemtype.toLowerCase() === "item") {
                    // future use
                } else {
                    var currentItem = _nex.ordering.currentItem();
                    var maxCount = this.calcMaxCount(menu, template, currentItem);
                    var flavorCount = this.getModifierCount(menu, template, currentItem);

                    currentItem.flavorcount = flavorCount;

                    // auto advance if the limit has been reached
                    if ((currentItem !== null) &&
                        (currentItem.flavorcount >= maxCount) &&
                        (_nex.assets.theme.system.USERINTERFACE.autoadvance.toLowerCase() !== "false")) {
                        _nex.ordering.loadMenu(menu.continuemenu);
                    }
                }
            },
            refreshButtons: function (menu, template, buttons, isLoading) {

                if (template.hasOwnProperty("itemtype") &&
                    (template.itemtype.toLowerCase() === "item")) {

                    var total = _nex.orderManager.currentOrder.alcoholCount(); // TODO - need to update for nextep mobile
                    var maxQuantity = ((menu.maxquantity !== "") && (!isNaN(menu.maxquantity))) ? Number(menu.maxquantity) : -1;
                    if (_nex.ordering.currentMenu.alcohol.toLowerCase() === "true") {
                        maxQuantity = _nex.assets.theme.alcoholLimit;
                    }

                    if (maxQuantity > -1) {
                        

                        if (total >= maxQuantity) {
                            for (var b = 0; b < buttons.length; b++) {
                                var state = buttons[b].html.data("state");

                                //// disable the button if it is not a selected modifier; found will be false if it is not selected mod
                                if ((state) && (state.toLowerCase() === "up")) {
                                    buttons[b].html.addClass("gray-out");
                                } else {
                                    buttons[b].quantityLimitReached = true;
                                    buttons[b].refreshSubButtons();
                                }
                            }

                            if (!isLoading && (_nex.assets.theme.system.USERINTERFACE.autoadvance.toLowerCase() !== "false")) {
                                _nex.ordering.loadMenu(Number(menu.continuemenu));
                            }
                        } else {
                            // re-enable all disabled buttons
                            for (var j = 0; j < buttons.length; j++) {

                                // disable the button if it is not a selected modifier; found will be false if it is not selected mod
                                buttons[j].html.removeClass("gray-out");

                                if ((buttons[j].quantity < maxQuantity) &&
                                    (buttons[j].quantityLimitReached)) {
                                    buttons[j].quantityLimitReached = false;
                                    buttons[j].refreshSubButtons();
                                }
                            }
                        }
                    }
                } else {

                    //modifier - update buttons
                    // call the state method on each button
                    for (var i = 0; i < buttons.length; i++) {
                        buttons[i].state();
                    }
                }
            },
            continueButton: function (menu, template) {
                var isVisible = true;

                if (template.hasOwnProperty("itemtype") &&
                    template.itemtype.toLowerCase() === "item") {

                    var minQuantity = ((menu.incquantity !== "") && (!isNaN(menu.incquantity))) ? Number(menu.incquantity) : 1;
                    var itemCount = this.getItemCount(menu);

                    //// update the control button in the ordering phase
                    isVisible = (itemCount >= minQuantity);

                } else {
                    // find the most recent item on the order from the previous menu
                    var currentItem = _nex.ordering.currentItem();
                    var maxCount = this.calcMaxCount(menu, template, currentItem);

                    if ((currentItem !== null) &&
                        currentItem.hasOwnProperty("flavorcount") &&
                        (currentItem.flavorcount >= maxCount)) {
                        isVisible = true;
                    } else {
                        // update the control button in the ordering phase
                        isVisible = (template.hasOwnProperty("allownoselection") && (template.allownoselection.toLowerCase() === "true"));
                    }
                }

                return isVisible;
            },
            getItemCount: function (menu) {
                var itemCount = 0;
                // private function to count the items on the current menu
                for (var i = 0; i < _nex.ordering.order.ITEM.length; i++) {
                    var item = _nex.ordering.order.ITEM[i];
                    if (item.menuid === menu.id) {
                        itemCount += Number(item.quantity);
                    }
                }
                return itemCount;
            },
            getModifierCount: function (menu, template, currentItem) {
                var modCount = 0;
                if (currentItem.ITEM) {
                    var mods = $.isArray(currentItem.ITEM) ? currentItem.ITEM : new Array(currentItem.ITEM);
                    for (var i = 0; i < mods.length; i++) {
                        if (mods[i].menuid === menu.id) {
                            modCount += Number(mods[i].modquantity);
                        }
                    }
                }

                return modCount;
            },
            calcMaxCount: function (menu, template, currentItem) {
                // private function to cal max
                var maxCount = menu.hasOwnProperty("incquantity") ? Number(menu.incquantity) : 1;
                var quantity = 0;

                if (template.hasOwnProperty("currentitemonly") &&
                (template.currentitemonly.toLowerCase() === "false")) {
                    // sum the quantity of all items that are not on the current menu
                    for (var i = 0; i < _nex.ordering.order.ITEM.length; i++) {
                        var item = _nex.ordering.order.ITEM[i];
                        if (item.menuid !== menu.id) {
                            quantity += Number(item.quantity);
                        }
                    }
                } else {
                    quantity = (currentItem !== null) ? Number(currentItem.quantity) : 0;
                }

                if (template.hasOwnProperty("productofitem") && (template.productofitem.toLowerCase() === "true")) {
                    maxCount *= quantity;
                }

                return maxCount;
            }
        },
        SelectManyofNIntegrated: {
            templateLoaded: function (menu, template) {
                this.refreshButtons(menu, template, _nex.ordering.buttons, true);
            },
            refreshButtons: function (menu, template, buttons, isLoading) {

                if (isLoading === undefined) {
                    isLoading = false;
                }

                var maxQuantity = (menu.hasOwnProperty("maxquantity") && (menu.maxquantity.length > 0)) ? Number(menu.maxquantity) : 0;
                if ((maxQuantity > 0) && (_nex.ordering.currentItem() !== null)) {
                    console.log("menu " + menu.id + " - maxquanity: " + maxQuantity);

                    var total = 0;
                    var mods = _nex.ordering.currentItem().ITEM;
                    var byMenu = (template.hasOwnProperty("pricedby") && (template.pricedby.toString().toLowerCase() === "menu"));

                    if (mods !== undefined) {
                        // count the total number of mods
                        for (var i = 0; i < mods.length; i++) {
                            if (byMenu) {
                                if (mods[i].menuid === menu.id) {
                                    total += (mods[i].modquantity.length > 0) ? Number(mods[i].modquantity) : 1;
                                }
                            } else {
                                total += (mods[i].modquantity.length > 0) ? Number(mods[i].modquantity) : 1;
                            }
                        }
                    }

                    if (total >= maxQuantity) {
                        for (var b = 0; b < buttons.length; b++) {
                            var state = buttons[b].html.data("state");

                            //// disable the button if it is not a selected modifier; found will be false if it is not selected mod
                            if ((state) && (state.toLowerCase() === "up")) {
                                buttons[b].html.addClass("gray-out");
                            }
                        }

                        if (!isLoading && (_nex.assets.theme.system.USERINTERFACE.autoadvance.toLowerCase() !== "false")) {
                            _nex.ordering.loadMenu(Number(menu.continuemenu));
                        }
                    } else {
                        // re-enable all disabled buttons
                        for (var j = 0; j < buttons.length; j++) {

                            // disable the button if it is not a selected modifier; found will be false if it is not selected mod
                            buttons[j].html.removeClass("gray-out");
                        }
                    }

                    // refresh select other buttons
                    for (var k = 0; k < buttons.length; k++) {
                        if (buttons[k].name === "SELECTOTHER") {
                            buttons[k].orderUpdated();
                        }
                    }
                }
            }
        },
        Toggle: {
            _selectedButtons: [],
            _isProcessing: false,
            templateLoaded: function (menu, template) {

                var buttons = _nex.ordering.buttons;
                this._selectedButtons = new Array(buttons.length);

                if (template.hasOwnProperty("RULE")) {

                    var rules = $.isArray(template.RULE) ? template.RULE : new Array(template.RULE);

                    for (var r = 0; r < rules.length; r++) {
                        for (var i = 0; i < buttons.length; i++) {
                            this._selectedButtons[i] = ((buttons[i].name.toUpperCase() === "SELECTMANYMODIFIER") &&
                                                        (buttons[i].html.data("state") === "down"));
                        }
                    }
                }

                console.log("Toggle.templateLoaded - _selectedButtons count: " + this._selectedButtons.length.toString());
                this.refreshButtons(menu, template, buttons, true);
            },
            refreshButtons: function (menu, template, buttons, isLoading) {
                if (template.hasOwnProperty("RULE") && !this._isProcessing) {
                    this._isProcessing = true;
                    var rules = $.isArray(template.RULE) ? template.RULE : new Array(template.RULE);

                    for (var r = 0; r < rules.length; r++) {

                        try {
                            var rule = rules[r];
                            var startIndex = Number(rule.startbutton);
                            var endIndex = Number(rule.endbutton);
                            var maxSelected = Number(rule.maxselected);
                            var selectedCount = 0;
                            var i = 0;

                            console.log("Toggle.refreshButtons - executing rule w/ start: " + startIndex.toString() + "; end: " + endIndex.toString() + "; max selected: " + maxSelected.toString());
                            for (var b = startIndex; (b <= endIndex) && (b < buttons.length) ; b++) {
                                if ((buttons[b].name.toUpperCase() === "SELECTMANYMODIFIER") &&
                                   (buttons[b].html.data("state") === "down")) {
                                    selectedCount++;
                                }
                            }

                            console.log("Toggle.refreshButtons - selected count: " + selectedCount.toString());

                            if (maxSelected === 1) {

                                for (i = startIndex; (i <= endIndex) && (i < buttons.length) ; i++) {
                                    if ((buttons[i].name.toUpperCase() === "SELECTMANYMODIFIER") &&
                                        (buttons[i].html.data("state") === "down")) {
                                        console.log("Toggle.refreshButtons -button down: " + i.toString() + "; isselected: " + this._selectedButtons[i].toString());
                                        if ((this._selectedButtons[i]) &&
                                           (selectedCount > maxSelected)) {
                                            console.log("Toggle.refreshButtons -autclick button; index: " + i.toString());
                                            this._selectedButtons[i] = false;
                                            buttons[i].autoClick();
                                        }
                                        else if ((!this._selectedButtons[i]) &&
                                                (selectedCount >= maxSelected)) {
                                            console.log("Toggle.refreshButtons -set isselected: " + i.toString());
                                            this._selectedButtons[i] = true;
                                        }
                                    }
                                    else if ((buttons[i].name.toLowerCase() === "SELECTMANYMODIFIER") &&
                                           (buttons[i].html.data("state") === "up")) {

                                        if ((this._selectedButtons[i]) &&
                                           (selectedCount === 0)) {
                                            console.log("Toggle.refreshButtons -autclick button; index: " + i.toString());
                                            this._selectedButtons[i] = false;
                                            buttons[i].autoClick();
                                        }
                                    }
                                }
                            } else {

                                if (selectedCount >= maxSelected) {
                                    for (i = startIndex; i <= endIndex; i++) {
                                        if (buttons[i].name.toUpperCase() === "SELECTMANYMODIFIER") {

                                            if (buttons[i].html.data("state") === "down") {
                                                buttons[i].disableButton(false);
                                            } else {
                                                if (!this._selectedButtons[i]) {
                                                    this._selectedButtons[i] = true;
                                                    buttons[i].disableButton(true);
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    for (i = startIndex; i <= endIndex; i++) {
                                        buttons[i].disableButton(false);
                                        if (buttons[i].name.toUpperCase() === "SELECTMANYMODIFIER") {
                                            if (buttons[i].html.data("state") === "up") {
                                                if (this._selectedButtons[i]) {
                                                    this._selectedButtons[i] = false;
                                                }
                                            } else {
                                                if (!this._selectedButtons[i]) {
                                                    this._selectedButtons[i] = true;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            console.log(e.message);
                        }
                    }
                    this._isProcessing = false;
                }
            }
        },
        WeighItem: {
            hasButtons: function (menu, template) {
                return false;
            },
            templateLoaded: function (menu, template) {
                var errorPopup = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
                _nex.communication.send(new _nex.commands.EnableScale("EnableScale"), function (result) {
                    if (result.responseReceived) {
                        if (_nex.ordering.buttons.length > 0) {
                            // Call self.AddWeight once we receive a successful response from the scale.
                            self.AddWeight(_nex.ordering.buttons[0].posid(), result.weight, result.uom);
                        } else {
                            console.error("EnableScale Failed! Weight modifier not found");
                        }
                    } else if (result.result === "1") {
                        errorPopup.message = _nex.assets.theme.getTextAttribute("ORDER", "weighitemtimeout", "Item not weighed, please place the item on the scale");
                        _nex.assets.popupManager.showPopup(errorPopup);
                    } else if (result.result === "2") {
                        errorPopup.message = _nex.assets.theme.getTextAttribute("ORDER", "weighitemerror", "Item not weighed, please place the item on the scale");
                        _nex.assets.popupManager.showPopup(errorPopup);
                    }
                }, "ITEMWEIGHT");
            }
        },
        ScanItems: {
            hasButtons: function (menu, template) {
                return false;
            },
            templateLoaded: function (menu, template) {
                // If the user scanned a barcode to start, then when this template loads, add that barcode item to the order.
                if (_nex.splashPhase.hasOwnProperty("barcodeData") && _nex.splashPhase.barcodeData) {
                    self.addItemBarcode(_nex.splashPhase.barcodeData);
                    _nex.splashPhase.barcodeData = null; // reset this variable so we don't add it more than once
                }
                console.debug('Scan template loaded');
                self.upcOverride($("#ctrl-scanoverride"));
                self.barListener = new DeviceListener("BARCODE", self.addItemBarcode, false);
                self.barListener.start();
                console.debug('Listener started');
                ko.applyBindings(new ScanItems(), document.getElementById("scanItems"));
            }
        }
    };

    // Called once we receive a successful response from the scale.
    self.AddWeight = function (posid, weight, uom) {
        _nex.communication.send(new _nex.commands.AddWeight(posid, weight, uom), function (result) {
            if (_nex.kviReader && _nex.kviReader.jackedIn()) {
                // Update the order early rather than waiting for the global ADDTOORDERRESPONSE listener to do it so we can get at the current items price.
                _nex.orderManager.currentOrder.update(result.ORDER);
                console.log(result.ORDER);
                var currentItem = _nex.orderManager.currentOrder.currentItem();
                if (currentItem && currentItem.hasOwnProperty("amountdue")) {
                    var priceString = "$" + currency.formatAsDollars(itemFormatting.getPrice(currentItem), false);
                    self._accounceWeight(posid, weight, uom, priceString, function () {
                    _nex.ordering.loadMenu();
                    });
                } else {
                    console.log("error getting at current item");
                }
            } else {
                _nex.ordering.loadMenu();
            }
        }, "ADDTOORDERRESPONSE");
    };

    // Accounces how much the item weighs. 
    self._accounceWeight = function (posid, weight, uom, priceString, callback) {
        var units = new Array(1);
        units[0] = "pounds"; // If the C# enum is given more values, this will need to be updated as well. There is only one unit right now... Pounds.
        var unitsSpoken = _nex.assets.theme.getTextAttribute("ORDER", "defaultweight", "pounds");
        try {
            unitsSpoken = units[uom];
        } catch (e) {
            console.log("Unknown unit encountered " + uom);
        }
        var messagePopup = $.extend(true, {}, _nex.assets.popupManager.messagePopup);
        var messageTemplate = _nex.assets.theme.getTextAttribute("ORDER", "kviweight", "This item weighs {0} " + unitsSpoken + " and costs {1}");
       

        var message = messageTemplate.replace("{0}", weight);
        message = message.replace("{1}", priceString);
        messagePopup.message = message; 
        _nex.assets.popupManager.showPopup(messagePopup, function () {
            callback();
        }, 7000); // Give the user time to hear the message.
    };

    //handle upc override button clicked
    self.upcOverride = function ($btnUpcOverride) {

        if ($btnUpcOverride === null || $btnUpcOverride === undefined) return;

        $btnUpcOverride.click(function () {
            var popup = $.extend(true, {}, _nex.assets.popupManager.upcpadPopup);
            popup.buttons[0].clickEvent = "_nex.assets.templateManager.addUpcOverrideItem()";
            popup.message = _nex.assets.theme.getTextAttribute("ORDER", "scanoverride", "Please enter a upc code");
            _nex.assets.popupManager.showPopup(popup);
            _nex.keyboard.numpad.bindKeys();
        });
    };

    self.addUpcOverrideItem = function () {
        var upc = _nex.keyboard.numpad.data;
        self.addItemBarcode(upc);
    };

    //callback called after bar code is read by barcode listener or after manual upc entry via pinpad. 
    self.addItemBarcode = function (upc) {

        if (!self._pendingScan) {
            self._pendingScan = true;
            var errorPopup = $.extend(true, {}, _nex.assets.popupManager.errorPopup);
            _nex.communication.send(new _nex.commands.ItemLookup(2, upc, "ItemLookup"), function (result) {

                if (!result.responseReceived) {
                    errorPopup.message = _nex.assets.theme.getTextAttribute("ORDER", "scanitems", "An error occured during scanning. Please scan again");
                    _nex.assets.popupManager.showPopup(errorPopup);
                    console.log("No response received from server after scan.");
                    self._pendingScan = false;
                }

                if (result.ITEM === undefined) {
                    errorPopup.message = _nex.assets.theme.getTextAttribute("ORDER", "scanitems", "Item not recognized. Please scan again");
                    _nex.assets.popupManager.showPopup(errorPopup, function () {
                        self._pendingScan = false; // do not allow another scan to occur until the popup is closed
                    });
                    console.log("Server response - Item Undefined.");
                } else if (result.responseReceived) {
                    self._pendingScan = false;
                    // Convert To items to array to handle single item returns. 
                    var items = [];
                    if (result.ITEM instanceof Array) {
                        items = result.ITEM;
                    } else {
                        items.push(result.ITEM);
                    }
                    // Check to make sure the item is available and that the first item on the order is and Item not a Modifier
                    var available = true;
                    for (var i = 0; i < items.length ; i++) {

                        if (items[i].DETAIL.itemtype !== "Item" & i === 0) {
                            errorPopup.message = _nex.assets.theme.getTextAttribute("ORDER", "scanitems", "Item not recognized. Please scan again");
                            _nex.assets.popupManager.showPopup(errorPopup);
                            console.log("The first item on the scan is not an ITEM - POSID: " + items[i].posid);
                            return undefined;
                        }

                        //available = _nex.assets.theme.itemIsAvailable(items[i].posid);
                        available = _nex.assets.theme.itemIsAvailableXml(items[i]);
                        if (available === false) {
                            errorPopup.message = _nex.assets.theme.getTextAttribute("ORDER", "scanitems", "Item not recognized. Please scan again");
                            _nex.assets.popupManager.showPopup(errorPopup);
                            console.log("Item unavilable on scanned barcode - POSID: " + items[i].posid);
                            return undefined;
                        }
                    }

                    if (items.length > 0) {
                        self.processScan(items, 0);
                    }

                    return result;
                }

                return undefined;

            }, "ITEMLOOKUPRESPONSE");
        }
    };

    self.processScan = function (items, i) {
        
        var price = items[i].price;
        var description = _nex.assets.theme.itemTextByType(items[i], "RECEIPTTEXT");
        _nex.ordering.addToOrder(items[i].posid, undefined, undefined, undefined, function () {
            _nex.scanItems.addItem(description, price);

            if (_nex.kviReader && _nex.kviReader.jackedIn()) {
                var messagePopup = $.extend(true, {}, _nex.assets.popupManager.messagePopup);
                var messageTemplate = _nex.assets.theme.getTextAttribute("ORDER", "kvibarcode", "Item scanned: {0} " + " for " + " {1}");

                var message = messageTemplate.replace("{0}", description);
                message = message.replace("{1}", "$" + price);
                messagePopup.message = message;
                _nex.assets.popupManager.showPopup(messagePopup, function () {
                    _nex.kviReader.rebind();
                    $("#scan-current-item-prompt").focus();
                }, 7000); // Give the user time to hear the message.
            }

            i++;
            if (i < items.length) {
                window.setTimeout(function () {
                    self.processScan(items, i);
                }, 0);
            }
        }, true);
    };
}
/*
 * Theme
 * @constructor
 */
function Theme(themeId, themeMediaPath) {
    var self = this;

    self.menus = null;
    self.items = null;
    self.times = null;
    self.system = null;
    self.id = themeId || null;
    self.kioskText = null;
    self.priceLevels = null;
    self.paymentProfile = null;
    self.filter = new FilterCriteria();
    self.consolidate = false;
    self.mediaRootUri = themeMediaPath || ""; // default downloads the media from the host website
    self.alcoholLimit = 2; // get from system
    self.quantityLimit = 9; // get from self.system
    self.itemRank = null;
    self.loaded = function () { };
    self.voiceoversEnabled = false;
    self.splashVoiceover = "";

    self.load = function (callback) {
        _iorderfast.command.send(new loadMenuCmd(), function (data) {
            console.log("menu download complete");
            var result = JSON.parse(data);

            if (result.success === "true") {
                self.id = result.SYSTEM.themeid;
                self.system = result.SYSTEM;
                //add store id for consistency with UX
                self.system.storeid = _iorderfast.loc.id;
                // store the menus/items to be use
                self.dayparts = result.DAYPARTS.DAYPART;
                self.menus = result.MENUS.MENU;
                self.items = result.ITEMS.ITEM;
                self.times = result.TIME;
                self.kioskText = result.KIOSKTEXT;
                self.priceLevels = result.PRICELEVELS;
                self.paymentProfile = result.PAYMENTPROFILE;

                if (result.hasOwnProperty("PAYPALMERCHANTID")) {
                    _iorderfast.settings.paypal.merchantId = result.PAYPALMERCHANTID;
                }

                _iorderfast.assets.phaseManager = new PhaseManager();
                _iorderfast.assets.phaseManager.loadTheme(result.THEME.PHASE);

                _iorderfast.assets.templateManager = new TemplateManager(result.TEMPLATES);

                // set limits
                if (self.system.hasOwnProperty('quantitylimit')) {
                    self.quantityLimit = Number(self.system.quantitylimit);
                }

                if (self.system.hasOwnProperty('alcohollimit')) {
                    self.alcoholLimit = Number(self.system.alcohollimit);
                }

                if (self.system.hasOwnProperty('consolidate')) {
                    self.consolidate = (self.system.consolidate.toLowerCase() === "true");
                }

                if (result.hasOwnProperty("thememediapath")) {
                    self.mediaRootUri = result.thememediapath;
                }

                if (result.hasOwnProperty("ITEMRANK")) {
                    self.itemRank = result.ITEMRANK;
                }

                // popup need to be loaded before calling the loaded method since popup could be used within the method
                _iorderfast.assets.popupManager = new PopupManager(result.THEME.POPUPS, function () {
                    self.loaded();

                    // request previous orders
                    _iorderfast.previousOrders.request(function (success) {
                        // return regardless if loading of previous orders was successful
                        if (callback !== undefined) {
                            callback(result);
                        }
                    });
                });

            } else {
                // todo: what is displayed if the menu fails to download? retry button?
            }
        });
    };

    self.isDayPartActive = function (daypart) {
        var active = false;

        if (self.dayparts !== null) {
            for (var i = 0; (i < self.dayparts.length) && (!active) ; i++) {
                if (daypart.toLowerCase() == self.dayparts[i].name.toLowerCase()) {
                    active = true;
                }
            }
        }

        return active;
    };

    self.itemByPosid = function (posid) {

        var item = null;
        for (var i = 0; ((i < self.items.length) && (item === null)) ; i++) {
            if (self.items[i].posid === posid) {
                item = $.extend(true, {}, self.items[i]); //clone item
            }
        }

        return item;
    };

    // Returns the price assigned to an for a specific price level. If the price level
    // does not exist the default price of the item will be returned
    self.itemPrice = function (item, priceLevel) {
        var price = item.price;
        if ((priceLevel !== undefined) && (priceLevel.length > 0)) {

            if (item.hasOwnProperty("PRICELEVEL")) {

                var priceLevelObj = self.findPriceLevel(item, priceLevel);

                if (priceLevelObj !== null) {
                    price = priceLevelObj.price;
                }
            }
        }
        return price;
    };

    self.findPriceLevel = function (item, priceLevel) {

        var priceLevelObj = null;
        if (item.hasOwnProperty("PRICELEVEL")) {

            for (var i = 0; (i < item.PRICELEVEL.length) && (priceLevel !== null) ; i++) {
                if (item.PRICELEVEL[i].name === priceLevel) {
                    priceLevelObj = item.PRICELEVEL[i];
                }
            }
        }

        return priceLevelObj;
    };

    self.itemRecipe = function (posid) {

        var item = self.itemByPosid(posid);
        var recipe = [];

        if ((item !== null) &&
            (item.RECIPE !== undefined)) {
            recipe = $.isArray(item.RECIPE) ? item.RECIPE : new Array(item.RECIPE);
        }

        return recipe;
    };

    self.itemTextByType = function (item, textType) {
        // Note: pricelevel used to be a parameter, but it was never being used, so it has been removed.
        var text = "";
        var textAttribute = textType.toLowerCase();

        switch (textType) {
            case "DESCRIPTION": {
                textAttribute = "descriptiontext";
                break;
            }
            case "HEADER": {
                textAttribute = "headertext";
                break;
            }
            case "MENUDESCRIPTION": {
                textAttribute = "menudescriptiontext";
                break;
            }
        }

        var itemText = null;
        if (item.hasOwnProperty("TEXT")) {
            itemText = item.TEXT[textType.toUpperCase()];
        } else if (item.hasOwnProperty(textType.toUpperCase())) {
            itemText = item[textType.toUpperCase()];
        }

        if (itemText !== null) {
            if (_nex.context === "UX") {
                text = self.getActiveLanguageText(itemText, textAttribute);
            } else {
                text = itemText[textAttribute];
            }
        }

        // Hack for issue found where the text was coming back undefined
        if (!text) {
            if (itemText && itemText[0] && itemText[0].buttontext) {
                text = itemText[0].buttontext;
            }
        }
        return text;
    };

    self.itemIsAvailableXml = function (item) {
        var isAvailable = false;

        if (item !== null) {
            // item enabled
            isAvailable = (item.enabled.toString().toLowerCase() == "true");

            //	day parting
            if (isAvailable && item.DETAIL.daypart.toString().length > 0) {
                isAvailable = self.isDayPartActive(item.DETAIL.daypart);
            }
            // check if the item is alcohol and if the alcohol is being display
            if ((isAvailable) && (item.DETAIL.alcoholflag.toLowerCase() == "true") && (item.DETAIL.itemtype == "Item")) {
                if (_nex.context === "UX") {
                    isAvailable = _nex.orderManager.currentOrder.alcoholEnabled;
                } else {
                    isAvailable = _iorderfast.ordering.alcoholEnabled;
                }

            }

            if (isAvailable) {
                isAvailable = this.filter.doesItemPassFilter(item);
            }
        }
        return isAvailable;
    };

    self.itemIsAvailable = function (posid) {
        var isAvailable = false;
        var item = self.itemByPosid(posid);

        if (item !== null) {
            // item enabled
            isAvailable = (item.enabled.toString().toLowerCase() == "true");

            //	day parting
            if (isAvailable && item.DETAIL.daypart.toString().length > 0) {
                isAvailable = self.isDayPartActive(item.DETAIL.daypart);
            }
            // check if the item is alcohol and if the alcohol is being display
            if ((isAvailable) && (item.DETAIL.alcoholflag.toLowerCase() == "true") && (item.DETAIL.itemtype == "Item")) {
                if (_nex.context === "UX") {
                    isAvailable = _nex.orderManager.currentOrder.alcoholEnabled;
                } else {
                    isAvailable = _iorderfast.ordering.alcoholEnabled;
                }

            }

            if (isAvailable) {
                isAvailable = this.filter.doesItemPassFilter(item);
            }
        }
        return isAvailable;
    };

    self.itemsByClassId = function (itemsToSearchArray, itemClassId) {
        var items = [];
        for (var i = 0; i < itemsToSearchArray.length ; i++) {
            if ((itemsToSearchArray[i].hasOwnProperty("itemclassid") &&
				(itemsToSearchArray[i].itemclassid === itemClassId)) ||
				(itemsToSearchArray[i].hasOwnProperty("parentitemclassid") &&
				(itemsToSearchArray[i].parentitemclassid === itemClassId))) {

                items.push($.extend(true, {}, itemsToSearchArray[i])); //clone item
            }
        }

        return items;
    };

    self.itemsByAttribute = function (itemsToSearchArray, attrName, attrValue, operator) {
        var items = [];
        for (var i = 0; i < itemsToSearchArray.length ; i++) {
            if (itemsToSearchArray[i].hasOwnProperty("ATTRIBUTE")) {
                var attr = self.findItemAttribute(itemsToSearchArray[i], attrName, attrValue);
                if (attr !== null) {
                    if (operator.toLowerCase() === "equals" && attr.value.toLowerCase() === attrValue.toLowerCase()) {
                        items.push($.extend(true, {}, itemsToSearchArray[i])); //clone item
                    }
                    else if (operator.toLowerCase() === "not equal" && attr.value.toLowerCase() !== attrValue.toLowerCase()) {
                        items.push($.extend(true, {}, itemsToSearchArray[i])); //clone item
                    }
                }
            }
        }

        return items;
    };

    self.findItemAttribute = function (item, attrName) {
        var attr = null; // return null if the attribute does not exist

        if ((item) && (item.hasOwnProperty("ATTRIBUTE"))) {
            item.ATTRIBUTE = $.isArray(item.ATTRIBUTE) ? item.ATTRIBUTE : new Array(item.ATTRIBUTE);
            for (var i = 0; (i < item.ATTRIBUTE.length) && (attr === null) ; i++) {
                if (item.ATTRIBUTE[i].name === attrName) {
                    attr = item.ATTRIBUTE[i];
                }
            }
        }

        return attr;
    };

    self.getText = function (textName) {
        var textObj = null;

        if ((self.kioskText !== null) &&
             self.kioskText.hasOwnProperty(textName)) {
            textObj = self.kioskText[textName];
        }

        return textObj;
    };

    self.itemPriceLevelText = function (item) {
        var priceLevelText = "";

        if ((item !== null) && item.hasOwnProperty("pricelevel")) {
            priceLevelText = item.pricelevel;

            if (self.priceLevels !== null) {
                var found = false;
                for (var i = 0; i < self.priceLevels.length && !found; i++) {
                    if ((self.priceLevels[i].name === item.pricelevel) &&
                        (self.priceLevels[i].hasOwnProperty('display'))) {

                        priceLevelText = self.priceLevels[i].display;
                        found = true;
                    }
                }
            }
        }

        return priceLevelText;
    };

    // Returns the attribute text for a given KioskText element. Will return the default text if the attribute is not found
    self.getTextAttribute = function (textName, attributeName, defaultText) {

        if (defaultText === undefined) {
            defaultText = "";
        }
        var text = defaultText;

        var textObj = self.getText(textName);
        if ((textObj !== null) &&
            textObj.hasOwnProperty(attributeName) &&
            textObj[attributeName] !== "") {

            text = textObj[attributeName];
        }

        if (_nex.context !== "UX") {
            return text;
        }

        // For UX, if another language was selected ...
        if (self.languageSelected !== 'english') {
            // override it.
            if (self.otherLanguages) {
                textObj = self.getLanguageText(self.languageSelected, textName);
                if ((textObj !== null) && textObj.hasOwnProperty(attributeName) && textObj[attributeName] !== "") {
                    text = textObj[attributeName];
                }
            }
        }
        return itemFormatting.buttonText(text); // button text trims text and replaces "~" with a <br/>
    };

    // returns text in kiosk text that is stored in a separate file on the server
    self.getFileTextAttribute = function (fileId, defaultText) {

        if (defaultText === undefined) {
            defaultText = "";
        }

        var text = "";

        if (self.kioskText.hasOwnProperty("FILE")) {
            for (var i = 0; (i < self.kioskText.FILE.length) && (text === "") ; i++) {
                if (self.kioskText.FILE[i].id === fileId) {
                    text = self.kioskText.FILE[i].contents;
                }
            }
        }

        if ((text === undefined) || (text === "")) {
            text = defaultText;
        }

        return _nex.context === "UX" ? itemFormatting.buttonText(text) : text;
    };

    // determine if a menu is flag as an alcohol menu
    self.menuHasAlcohol = function (menuId) {
        var hasAlcohol = false;
        var menuIndex = Number(menuId) - 1;
        if (menuIndex < self.menus.length) {
            var menu = self.menus[menuIndex];
            hasAlcohol = ((menu !== null) && (menu.alcohol.toLowerCase() === "true"));
        }

        return hasAlcohol;
    };

    // determine if the tender is tax exempt
    self.isTenderTaxExempt = function (tenderType) {
        var taxExempt = false;

        for (var i = 0; i < self.system.TENDER.length && !taxExempt; i++) {
            if (self.system.TENDER[i].type === tenderType) {
                taxExempt = (self.system.TENDER[i].istaxexempt.toLowerCase() === "true");
            }
        }

        return taxExempt;
    };

    // determine if the tender requires a pre-auth
    self.isPreAuthRequired = function (tenderType) {
        var preAuth = false;

        for (var i = 0; i < self.system.TENDER.length && !preAuth; i++) {
            if (self.system.TENDER[i].type === tenderType) {
                preAuth = ((self.system.TENDER[i].preauth.toLowerCase() === "true") ||
                           (self.system.TENDER[i].hasOwnProperty("preauthandpay") && (self.system.TENDER[i].preauthandpay.toLowerCase() === "true")));
            }
        }

        return preAuth;
    };

    self.isPreAuthAndPay = function (tenderType) {
        var preAuthAndPay = false;

        for (var i = 0; i < self.system.TENDER.length && !preAuthAndPay; i++) {
            if (self.system.TENDER[i].type === tenderType) {
                preAuth = ((self.system.TENDER[i].hasOwnProperty("preauthandpay") && (self.system.TENDER[i].preauthandpay.toLowerCase() === "true")));
            }
        }

        return preAuth;
    };

    // determine if the tender is a final tender
    self.isFinal = function (tenderType) {
        var isFinal = true;

        for (var i = 0; i < self.system.TENDER.length; i++) {
            if (self.system.TENDER[i].type === tenderType) {
                isFinal = (self.system.TENDER[i].final.toLowerCase() === "true");
                break;
            }
        }

        return isFinal;
    };

    self.setControlButtonText = function (buttonId, buttonText) {
        var button = $("#" + buttonId);
        if (button.length > 0) {
            var btext = button.find("#btext");
            if (btext.length > 0) {
                btext.empty();
                btext.append(buttonText);
            } else {
                button.empty();
                button.append(buttonText);
            }
        }
    };

    self.setButtonText = function (buttonId, buttonText) {
        var button = $("#" + buttonId);
        if (button.length > 0) {
            var btext = button.find(".buttonText");
            if (btext.length > 0) {
                btext.empty();
                btext.append(buttonText);
            } else {
                button.empty();
                button.append(buttonText);
            }
        }
    };

    self.setNutrition = function (item, html) {

        var fillNutritionAmount = function (attrName, elementId, htmlSnippet, itemObj) {
            var itemAttr = _iorderfast.assets.theme.findItemAttribute(itemObj, attrName);
            var amount = (itemAttr !== null) ? itemAttr.value : "";

            var amountText = htmlSnippet.find("#" + elementId);
            if (amountText.length > 0) {
                amountText.empty();
                amountText.append(amount);
            }
        };

        if (item !== null) {
            fillNutritionAmount("Serving Size", "serving", html, item);
            fillNutritionAmount("Calories Per Serving", "calories", html, item);
            fillNutritionAmount("Total Fat", "totalFat", html, item);
            fillNutritionAmount("Saturated Fat", "satFat", html, item);
            fillNutritionAmount("Trans Fat", "transFat", html, item);
            fillNutritionAmount("Cholesterol", "cholesterol", html, item);
            fillNutritionAmount("Sodium", "sodium", html, item);
            fillNutritionAmount("Total Carbohydrates", "totalCarbs", html, item);
            fillNutritionAmount("Sugar", "sugars", html, item);
            fillNutritionAmount("Protein", "protein", html, item);
            fillNutritionAmount("Fiber", "fiber", html, item);
        }
    };
}
function TotalsModel() {
    var self = this;

    self.subtotal = ko.observable("0.00");
    self.salestax = ko.observable("");
    self.salestax2 = ko.observable("");
    self.deliveryfee = ko.observable("");
    self.roundupcharity = ko.observable("");
    self.amountdue = ko.observable("");
    self.gratuity = ko.observable(""); // used for online tips
    self.discount = ko.observable("0.00");
    self.remainingbalance = ko.observable("0.00"); // used for split tenders in UX
}

_nex.assets.buttons._BaseButton = function () {

    var self = this;
    self.name = "";
    self.buttonId = "";
    self.menuItem = {};
    self.html = null;
    self.getProperty = function (propertyName, defaultValue) {
        var val = defaultValue;
        if (self.menuItem.hasOwnProperty(self.name) &&
            self.menuItem[self.name].hasOwnProperty(propertyName)) {
            val = self.menuItem[self.name][propertyName];

            // convert the return value to an array if the default is an array
            if (!Array.isArray(val) && Array.isArray(defaultValue)) {
                val = new Array(val);
            }
        }
        return val;
    };

    self.action = function () { };
    self.attributes = function () {
        return self.getProperty("ATTRIBUTE", []);
    };

    self.autoClick = function (posid, callback) {
        if ((callback !== undefined) &&
            (callback !== null)) {
            callback();
        }
    };

    self.buttonText = function () { };
    self.buttonInfo = function () { return { "name": self.buttonName }; };
    self.descriptionText = function () { return ""; };
    self.descriptionType = "description-text";
    self._disabled = false;
    self.hasItemRank = false;
    self.hasFilter = function () { return false; };
    self.hasPosid = function () { return false; };
    self.image = function () { };

    self.overlayimages = function () {
        var images = [];
        if (self.item && self.item.ATTRIBUTE) {
            var attrs = (Array.isArray(self.item.ATTRIBUTE)) ? self.item.ATTRIBUTE : new Array(self.item.ATTRIBUTE);
            for (var i = 0; i < attrs.length;i++) {
                var attribute = attrs[i];
                if (attribute.name.toLowerCase().indexOf('imageoverlay') === 0) {
                    images.push(itemFormatting.buttonImage(attribute.value));
                }
            }
        }
        return images;
    };

    self.itemsEnabled = function () { return true; };
    self.itemClassId = function () {
        return self.getProperty("itemclassid", "");
    };
    self.isIButtonVisible = function () {
        return ((self.descriptionText().length > 0) &&
                (self.descriptionType !== undefined) &&
                (self.descriptionType.toLowerCase() === "i-button"));
    };
    // isNutritionButton is of an iButton style nutrition; instead
    // of popping up the item description the nutrition popup is displayed
    self.isNutritionButtonVisible = function () {
        return false;
    };

    self.isComesWithVisible = function (visible) {

        if (self.html !== null) {
            var comesWith = self.html.find("#comeswith");
            comesWith.addClass("comeswith");
            comesWith.removeClass("comeswith-visible");

            if (visible) {
                comesWith.addClass("comeswith-visible");
            }
        }
    };

    self.loadItem = function () { };
    self.posid = function () { return ""; };
    self.nextMenu = function () { return ""; };
    self.nutrition = function () {
        if ((self.item !== null) && (self.html !== null)) {
            // look to see if there is a nutrition clip in the html
            var nutritionInfo = self.html.find("#nutritionInfo");
            if (nutritionInfo.length > 0) {
                self.loadNutrition(nutritionInfo);
            }
        }
    };

    self.loadNutrition = function (nutritionHtml) {
        _nex.assets.theme.setNutrition(self.item, nutritionHtml, true);
    };

    self.price = function () { return 0.0; };

    self.showPriceFlag = function () {
        return (self.getProperty("showpriceflag", "false").toLowerCase() === "true");
    };
    self.priceLevel = function () {
        return self.getProperty("pricelevel", "");
    };

    self.selectRecipe = function () {
        return (self.getProperty("selectrecipe", "false").toLowerCase() === "true");
    };

    self.selectSuggested = function () {
        return (self.getProperty("selectsuggested", "false").toLowerCase() === "true");
    };

    self.state = function () { };
    // this function can be called to either set the buttonId or get the buttonId
    // to set pass in the button Id of button
    // to get the button do not pass in the buttonId or null
    self.templateButtonName = function (buttonId) {
        if ((buttonId !== undefined) &&
            (buttonId !== null) &&
            (buttonId !== "")) {
            self.buttonId = buttonId;
        }
        return self.buttonId;
    };
    self.init = function (menuItem) {
        self.menuItem = menuItem;
        self.loadItem();
    };
    self.enabled = function (state) {
        return ((self.menuItem.enabled.toLowerCase() === "true") &&
                self.itemsEnabled(state) &&
                !self._disabled);
    };
    self.disableButton = function (disable) {
        if (disable === undefined) {
            disbable = true;
        }
        self._disabled = disable;

        if (self._disabled) {
            self.html.addClass("disabled");
        } else {
            self.html.removeClass("disabled");
        }
    };

    // Returns the correct media path for NEXTEP Mobile, UX, or the UX Previewer depending on the context.
    self._getMediaPath = function (directory, filename) {
        var url = "";
        if (_nex.context === "UX") {
            if (inPreviewer()) {
                // For the UX previewer the media comes from Media.aspx in mynextep.
                url = "../Media.aspx?media=" + directory +"/" + filename;
            } else {
                // For the UX kiosk the media path does not contain a themes directory.
                url = _nex.assets.theme.mediaRootUri;
                if (url.toLowerCase().indexOf(_nex.assets.theme.id.toLowerCase()) === -1) {
                    url += "/" + _nex.assets.theme.id;
                }
                url += "/media/" + directory + "/" + filename;
            }
        } else {
            // For NEXTEP Mobile the media path contains a 'themes' directory.
            url =  _iorderfast.assets.theme.mediaRootUri + "themes/" + _iorderfast.assets.theme.id + "/media/" + directory + "/" + filename;
        }
        return url;
    };

    // Sets the background image for an element.
    self._setBackgroundImage = function (element, filename) {
        var url = self._getMediaPath("images", filename);
        element.attr("style", "background-image: url('" + url + "');");
    };

    // Sets the background container for an element.
    self._setOverlayContainer = function (overlaycontainer, filename) {
        var url = self._getMediaPath("images", filename);
        //console.debug("Applying overlay " + url);
        overlaycontainer.append("<div class='overlay' style='background-image: url(\"" + url + "\")'></div>");
    };

    self.loadButton = function (buttonName, buttonHtml) {
        self.buttonName = buttonName;

        if (buttonHtml) {
            self.html = buttonHtml;
        } else {
            self.html = $("#" + self.templateButtonName().toLowerCase()).clone();
        }

        if (self.html.length > 0) {

            // button id
            self.html.attr("id", self.buttonName);

            // add button id as a css class name
            if (self.buttonId !== "") {
                self.html.addClass(self.buttonId);
            }

            // button text
            var btext = self.html.find('#btext');
            btext.empty();
            btext.append(self.buttonText());

            // KVI/MVI ordering buttons
            if (_nex.kviReader) {
                // For KVI, just give the buttons a tabindex.
                self.html.attr("tabindex", "2");
            } else if (_nex.mviReader) {
                // For mobile visually impaired we need to put a label and tabindex on the link to be semantically correct and make screen readers work.
                // This way we can announce to the user the caption even if the caption is not visible, for things like concept menus, where it is all logos.
                // Using aria-label is better than alt or title.
                if (self.html.find('a').length > 0) {
                    self.html.find('a').attr("tabindex", "2");
                    self.html.find('a').attr("aria-label", self.buttonText());
                    self.html.find("a").removeAttr("href"); // otherwise it can say 'void(0)' which is normally put in the href and we use onclick instead
                } else {
                    // Sometimes we have clickable divs... If this is the case, put the tabindex and label on the button itself.
                    self.html.attr("tabindex", "2");
                    self.html.attr("aria-label", self.buttonText());
                    self.html.removeAttr("href");
                }
            }

            if (self.descriptionType.toLowerCase() === "description-text") {
                var desc = self.html.find('#textDesc');
                if (desc.length > 0) {
                    desc.empty();
                    desc.append(self.descriptionText());
                }
            }

            // set background image on the button
            if (self.image() !== "") {
                var element = self.html.find("#bimage");
                if (element.length > 0) {
                    self._setBackgroundImage(element, self.image());
                }
            }

            // apply all overlays
            var overlaycontainer = self.html.find('.overlaycontainer');
            if (overlaycontainer) {
                var overlays = self.overlayimages();
                for (var oimage in overlays) {
                    if (overlays.hasOwnProperty(oimage)) { // property is not inherited
                        self._setOverlayContainer(overlaycontainer, overlays[oimage]);
                    }
                }
            }

            // load nutrition
            self.nutrition();

            // next menu
            var next = self.html.find('#nextmenu');
            // if the button has actions assigned to it then load the actions before executing its click event
            var clickScript = (self.getProperty("ACTION", []).length > 0) ? "_nex.ordering.loadActions('" + self.buttonName + "');" : "";
            clickScript += self.clickEvent();

            // track the button click
            clickScript += "_nex.ordering.trackClick('" + self.buttonName + "','" + htmlEscape(self.buttonText()) + "');";

            // anytime they hit a button, play the button hit sound.
            next.attr("onclick", "_nex.assets.soundManager.playButtonHit();" + clickScript);

            // price
            var price = self.html.find('#price');
            if (price.length > 0) {
                price.empty();
                if ((self.price() > 0)) {
                    if (_nex.kviReader && _nex.kviReader.jackedIn()) {
                        price.append(currency.formatAsDollars(self.price(), true));
                    } else {
                        price.append(currency.formatAsDollars(self.price(), self._showCurrencySymbol()));
                    } 
                    price.removeClass("button-price-hidden");
                } else {
                    price.css('visibility', "hidden");
                    price.addClass("button-price-hidden");
                }
            }

            // set the iButton
            var iButton = self.html.find("#iButton");
            if (iButton.length > 0) {
                if (self.isIButtonVisible()) {
                    var iButtonId = self.buttonName + "-ibutton";
                    iButton.attr("id", iButtonId);
                    iButton.attr("onclick", "_nex.ordering.showDescription('" + self.buttonName + "','" + iButtonId + "', event)");
                } else {
                    iButton.css("display", "none");
                }
            } else {
                iButton = self.html.find("#nutritionButton");
                if (iButton.length > 0) {
                    if (self.isNutritionButtonVisible()) {
                        iButton.attr("onclick", "_nex.ordering.showNutrition('" + self.buttonName + "');");
                    } else {
                        iButton.css("display", "none");
                    }
                }
            }

            self.state();
        } else {
            console.log("Unable to load button; id: " + self.templateButtonName());
            if (_nex.authToken.hasOwnProperty("debug") &&
                (_nex.authToken.debug === "true")) {
                self.html = $("<div class='has-error' ><span class='help-block' >Unable to load " + self.templateButtonName() + "</span></div>");
            }
        }
    };

    self._showCurrencySymbol = function () {
        var result = false;
        if (_nex.assets.theme.system.USERINTERFACE.hasOwnProperty("showcurrencyonitems") &&
            _nex.assets.theme.system.USERINTERFACE.showcurrencyonitems.toString().toLowerCase() === "true") {
            result = true;
        }
        return result;
    };

    self.executeActions = function () {

        var actions = self.getProperty("ACTION", []);
        for (var i = 0; i < actions.length; i++) {
            switch (actions[i].type.toLowerCase()) {
                case "dico": {
                    if (actions[i].hasOwnProperty("value") &&
                        (typeof actions[i].value === "string") &&
                        (actions[i].value.length > 0)) {
                        _nex.ordering.togo = (actions[i].value.toLowerCase() === "togo");
                    }
                    break;
                }
                case "filter": {
                    _nex.assets.theme.filter.applyItemFilter(actions[i]);
                    //_iorderfast.ordering.alcoholEnabled = ((_iorderfast.ordering.alcoholEnabled) && (!_iorderfast.assets.theme.filter.hideAlcoholMenus));
                    break;
                }
                case "clearfilter": {
                    _nex.assets.theme.filter.clear();
                    break;
                }
            }
        }
    };

    self.getPriceFromNextMenu = function (nextMenu, itemIndex) {

        var price = 0;

        try {
            var menuIndex = Number(nextMenu) - 1;
            var menu = _nex.assets.theme.menus[menuIndex];
            var menuItems = _nex.ordering.getAvailableButtons(menu);
            if (itemIndex < menuItems.length) {

                var button = menuItems[itemIndex];
                var menuButton = button.menuItem[button.menuItem.buttontype];
                var posid = null;
                var priceLevel = "";

                switch (button.menuItem.buttontype.toUpperCase()) {
                    case "SELECTONE":
                    case "SELECTONEMODIFIER":
                    case "SELECTMANYMODIFIER":
                    case "SELECTMANYITEM":
                    case "SELECTONEQUANTITY":
                        {
                            posid = menuButton.posid;
                            priceLevel = menuButton.pricelevel;
                            break;
                        }
                    case "LESSMORE":
                    case "SELECTNND":
                    case "SELECTNNL":
                    case "SELECTNLN":
                    case "SELECTNE":
                        {
                            posid = menuButton.posid2;
                            priceLevel = menuButton.priceleve2;
                            break;
                        }
                }

                if ((posid !== null) && (posid.length > 0)) {
                    var item = _nex.assets.theme.itemByPosid(posid);
                    if (item !== null) {
                        price = _nex.assets.theme.itemPrice(item, priceLevel);
                    }
                }
            }
        }
        catch (e)
        { }
        return price;

    };

    self.getDescriptionFromNextMenu = function (nextMenu, itemIndex) {
        var desc = "";

        try {
            var menuIndex = Number(nextMenu) - 1;
            var menu = _nex.assets.theme.menus[menuIndex];
            var menuItems = _nex.ordering.getAvailableButtons(menu);
            if (menuItems.length <= itemIndex) {
                return "";
            }

            var button = menuItems[itemIndex];
            var menuButton = button.menuItem[button.menuItem.buttontype];
            var posid = null;

            switch (button.menuItem.buttontype.toUpperCase()) {
                case "SELECTONE":
                case "SELECTONEMODIFIER":
                case "SELECTMANYMODIFIER":
                case "SELECTMANYITEM":
                case "SELECTONEQUANTITY": {
                    posid = menuButton.posid;
                    break;
                }
                case "LESSMORE":
                case "SELECTNND":
                case "SELECTNNL":
                case "SELECTNLN":
                case "SELECTNE": {
                    posid = menuButton.posid2;
                    break;
                }
            }

            if ((posid !== null) && (posid.length > 0)) {
                var item = _nex.assets.theme.itemByPosid(posid);
                if (item !== null) {
                    desc = _nex.assets.theme.itemTextByType(item, "DESCRIPTION");
                }
            }
        }
        catch (e) {
            console.log(e.message);
        }

        return desc;
    };
};

_nex.assets.buttons.SelectOne = function () {

    _nex.assets.buttons._BaseButton.call(this);

    var self = this;
    self.item = null;
    self.name = "SELECTONE";
    self.buttonId = "selectone";
    self.descriptionText = function () {
        return itemFormatting.buttonText(_nex.assets.theme.itemTextByType(self.item, "DESCRIPTION"));
    };
    self.isNutritionButtonVisible = function () {
        return true;
    };
    self.hasFilter = function () {
        return ((self.menuItem[self.name].hasOwnProperty("filter")) &&
                (self.menuItem[self.name].filter.toLowerCase() === "true"));
    };
    self.itemsEnabled = function () {

        var enabled = true;

        if (self.item !== null) {

            if (_nex.context === "UX") {
                enabled = ((self.item.DETAIL.alcoholflag.toLowerCase() !== "true") ||
                            ((self.item.DETAIL.alcoholflag.toLowerCase() === "true") && _nex.orderManager.currentOrder.alcoholEnabled));
            } else {
                enabled = ((self.item.DETAIL.alcoholflag.toLowerCase() !== "true") ||
                                            ((self.item.DETAIL.alcoholflag.toLowerCase() === "true") && _iorderfast.ordering.alcoholEnabled));
            }
        }

        if (enabled) {
            enabled = (self.hasFilter() || _nex.assets.theme.itemIsAvailable(self.menuItem[self.name].posid));
        }
        return enabled;
    };

    self.loadItem = function () {
        self.item = _nex.assets.theme.itemByPosid(self.menuItem.SELECTONE.posid);
    };
    self.buttonText = function () {
        return itemFormatting.buttonText(_nex.assets.theme.itemTextByType(self.item, "BUTTONTEXT"));
    };
    self.image = function () {
        return itemFormatting.buttonImage(self.item.DETAIL.image);
    };

    self.posid = function () {
        return self.menuItem[self.name].posid;
    };

    self.nextMenu = function () {
        return self.menuItem.SELECTONE.nextmenu;
    };
    self.hasPosid = function (posid) {
        return (self.menuItem.SELECTONE.posid === posid);
    };

    self.clickEvent = function () {
        //console.debug("_selectOne.clickEvent");
        var clickScript = "_nex.ordering.setDragALong('" + self.buttonName + "');";
        //clickScript += "_nex.ordering.trackClick('" + self.buttonName + "','" + self.buttonText() + "');";

        if (self.item.DETAIL.alcoholflag.toLowerCase() === "true") {
            clickScript += "_nex.ordering.addAlcoholToOrder('" + self.item.posid + "','" + self.priceLevel() + "','" + self.buttonName + "'," + self.nextMenu() + ");";
        } else {
            clickScript += "_nex.ordering.addToOrder('" + self.item.posid + "','" + self.priceLevel() + "','" + self.buttonName + "'," + self.nextMenu() + ");";
        }
        return clickScript;
    };

    self.price = function () {
        var itemPrice = _nex.assets.theme.itemPrice(self.item, self.priceLevel());
        if ((itemPrice.length > 0) && (self.showPriceFlag())) {
            return Number(itemPrice);
        } else {
            return 0.0;
        }
    };
};
_nex.assets.buttons.SelectOne.prototype = Object.create(_nex.assets.buttons._BaseButton.prototype);
// blank button
_nex.assets.buttons.Blank = function () {

    _nex.assets.buttons._BaseButton.call(this);

    var self = this;

    self.name = "BLANK";
    self.clickEvent = function () { };

    self.enabled = function () {
        return ((_nex.context === "UX") &&
                (self.menuItem.enabled.toLowerCase() === "true") &&
                !self._disabled);
    };

    // override load button to hide the html
    self.loadButton = function (buttonName, buttonHtml) {
        if (buttonHtml) {
            buttonHtml.css("visibility", "hidden");
        }
    };
};
_nex.assets.buttons.Blank.prototype = Object.create(_nex.assets.buttons._BaseButton.prototype);
// buttonFactory.js
_nex.assets.buttons.ButtonFactory = function () {
    var self = this;
    self.ITEM_TYPE_ITEM = "Item";
    self.ITEM_TYPE_MOD = "Modifier";

    self.createButton = function (menuItem, templateName) {
        var button = null;

        if (!menuItem || !menuItem.buttontype) {
            console.log("no button available on this menu. template: " + templateName);
            return null;
        }

        var buttonId = _nex.assets.templateManager.getButtonId(templateName, menuItem.buttontype);

        switch (menuItem.buttontype) {
            case "MENUBUTTON":
                {
                    button = new _nex.assets.buttons.MenuButton();
                    break;
                }
            case "SELECTONE":
                {
                    button = new _nex.assets.buttons.SelectOne();
                    break;
                }
            case "MULTIMENUBUTTON":
                {
                    button = new _nex.assets.buttons.MultiMenuButton();
                    break;
                }
            case "SELECTONEMODIFIER":
                {
                    button = new _nex.assets.buttons.SelectOneModifier();
                    break;
                }
            case "SELECTMANYITEM":
                {
                    button = new _nex.assets.buttons.SelectManyItem();
                    break;
                }
            case "SELECTMANYMODIFIER":
                {
                    button = new _nex.assets.buttons.SelectManyModifier();
                    break;
                }
            case "SELECTONEQUANTITY":
                {
                    button = new _nex.assets.buttons.SelectOneQuantity();
                    break;
                }
            case "SELECTOTHER":
                {
                    button = new _nex.assets.buttons.SelectOther();
                    break;
                }
            case "LESSMORE":
                {
                    button = new _nex.assets.buttons.LessMore();
                    break;
                }
            case "SELECTNE":
                {
                    button = new _nex.assets.buttons.SelectNE();
                    break;
                }
            default:
                {
                    button = new _nex.assets.buttons.Blank();
                    break;
                }
        }

        // set the button id
        if ((button !== null) && (buttonId !== "")) {
            button.templateButtonName(buttonId);
        }

        return button;
    };

    self.hasNoItems = function (buttonType) {
        return ((buttonType === null) ||
                (buttonType.toUpperCase() === "BLANK") ||
                (buttonType.toUpperCase() === "MENUBUTTON") ||
                (buttonType.toUpperCase() === "MULTIMENUBUTTON") ||
                (buttonType.toUpperCase() === "ORDERREVIEWITEM") ||
                (buttonType.toUpperCase() === "SELECTALL") ||
                (buttonType.toUpperCase() === "SELECTOTHER") ||
                (buttonType.toUpperCase() === "SELECTMODIFIERPOPUP"));
    };

    self.getItemTypeForButton = function (buttonType) {
        if (self.hasNoItems(buttonType)) {
            return self.ITEM_TYPE_ITEM;
        }
        else {
            if (buttonType.toUpperCase() == "SELECTONE") {
                return self.ITEM_TYPE_ITEM;
            }
            else if (buttonType.toUpperCase() == "SELECTONEQUANTITY") {
                return "";
            }
            else {
                return self.ITEM_TYPE_MOD;
            }
        }
    };
};

// lessmore button
_nex.assets.buttons.LessMore = function () {

    _nex.assets.buttons.SelectOne.call(this);

    var self = this;
    self.hasRecipe = false;
    self.recipePosidAttr = "";
    self.recipePriceLevelAttr = "";
    self.isDown = false;
    self.activePosidAttr = "posid2";
    self.activePriceLevelAttr = "pricelevel2";

    self.name = "LESSMORE";
    self.buttonInfo = function () {
        return {
            "name": self.buttonName,
            "removeposid": self.menuItem[self.name].posid2 + "-NO",
            "removequantity": -1,
            "defaultposid": self.menuItem[self.name].posid2,
            "defaultquantity": 1,
            "chargeableposid": self.menuItem[self.name].posid3,
	        "chargeablequantity": 2,
	        "posid1": self.menuItem[self.name].posid1,
	        "posid2": self.menuItem[self.name].posid2,
	        "posid3": self.menuItem[self.name].posid3
        };
    };
	self.noPosid = function () {
	    return self.menuItem[self.name].noposid || "";
	};
	self.noPriceLevel = function () {
	    return self.menuItem[self.name].pricelevelno || "";
	};
    // set the initial state of the button when the template is loaded
    self.loadItem = function () {

        self.item = _nex.assets.theme.itemByPosid(self.menuItem[self.name].posid2);

        // create the noposid attribute to be used as part of a recipe
        self.menuItem[self.name].noposid = self.menuItem[self.name].posid2 + "-NO";
    	self.menuItem[self.name].pricelevelno = self.menuItem[self.name].pricelevel2;

        var currentItem = _nex.ordering.currentItem();
        if (currentItem !== null) {

            // get recipe items since item on the order has the minimum info
            var recipe = _nex.assets.theme.itemRecipe(currentItem.posid);
            // determine if the modifier is on the recipe
            for (var i = 0; (i < recipe.length) && (!self.hasRecipe) ; i++) {
                if (recipe[i].posid === self.menuItem[self.name].posid1) {
                    self.hasRecipe = true;
                    self.recipePosidAttr = "posid1";
                    self.recipePriceLevelAttr = "pricelevel1";
                } else if (recipe[i].posid === self.menuItem[self.name].posid2) {
                    self.hasRecipe = true;
                    self.recipePosidAttr = "posid2";
                    self.recipePriceLevelAttr = "pricelevel2";
                } else if (recipe[i].posid === self.menuItem[self.name].posid3) {
                    self.hasRecipe = true;
                    self.recipePosidAttr = "posid3";
                    self.recipePriceLevelAttr = "pricelevel3";
                }
            }

            // determine if the item is already on the order
            var found = false;
            if ((currentItem.ITEM !== undefined) &&
                (currentItem.ITEM.length > 0)) {

                for (var j = 0; (j < currentItem.ITEM.length) && (!self.isOnOrder) ; j++) {
                    if (currentItem.ITEM[j].menuid === String(_nex.ordering.currentMenuId)) {
                        if (currentItem.ITEM[j].posid === (self.menuItem[self.name].posid1)) {
                            found = true; // posid1 is the no item
                            self.activePosidAttr = "posid1";
                            self.activePriceLevelAttr = "pricelevel1";
                        } else if (currentItem.ITEM[j].posid === (self.menuItem[self.name].posid2)) {
                            found = true;
                            self.activePosidAttr = "posid2";
                            self.activePriceLevelAttr = "pricelevel2";
                        } else if (currentItem.ITEM[j].posid === (self.menuItem[self.name].posid3)) {
                            found = true;
                            self.activePosidAttr = "posid3";
                            self.activePriceLevelAttr = "pricelevel3";
                        } else if (currentItem.ITEM[j].posid === (self.menuItem[self.name].posid2 + "-NO")) {
                            found = true;
                            self.activePosidAttr = "noposid";
                            self.activePriceLevelAttr = "";
                        }
                    }
                }
            }

            if ((found) ||
                (!found && self.hasRecipe)) {

                self.isDown = true;
            }
        }
    };

    self.nextMenu = function () {
        return "";
    };
    self.buttonId = "lessmore";
    self.itemsEnabled = function () {
        return _nex.assets.theme.itemIsAvailable(self.menuItem[self.name].posid1) &&
            _nex.assets.theme.itemIsAvailable(self.menuItem[self.name].posid2) &&
            _nex.assets.theme.itemIsAvailable(self.menuItem[self.name].posid3);
    };
    self.buttonText = function () {
        var posidAttr = self.activePosidAttr;
        var priceLeveAttr = self.activePriceLevelAttr;
        if ((self.hasRecipe) && (!self.isDown)) {
            posidAttr = "noposid";
            priceLeveAttr = "";
        }
        var activeItem = _nex.assets.theme.itemByPosid(self.menuItem[self.name][posidAttr]);
        return itemFormatting.buttonText(_nex.assets.theme.itemTextByType(activeItem, "BUTTONTEXT", priceLeveAttr));
    };
    self.image = function () {
        return itemFormatting.buttonImage(self.item.DETAIL.image);
    };
    self.priceLevel = function () {
        return self.menuItem[self.name][self.activePriceLevelAttr];
    };

    self.price = function () {
        var posidAttr = self.activePosidAttr;
        var priceLevelAttr = self.activePriceLevelAttr;
        if ((self.hasRecipe) && (!self.isDown)) {
            posidAttr = "posid1";
            priceLevelAttr = "pricelevel1";
        }
        var activeItem = _nex.assets.theme.itemByPosid(self.menuItem[self.name][posidAttr]);

        var itemPrice = _nex.assets.theme.itemPrice(activeItem, self.menuItem[self.name][priceLevelAttr]);
        if ((itemPrice.length > 0) && (self.showPriceFlag())) {
            return Number(itemPrice);
        } else {
            return 0.0;
        }
    };
    self.hasPosid = function (posid) {
        return (self.menuItem[self.name].posid1 === posid) ||
            (self.menuItem[self.name].posid2 === posid) ||
            (self.menuItem[self.name].posid3 === posid);
    };
    self.clickEvent = function () {
        return "void(0);"; // default click event is void since the click event script changes based on the state of the button
    };
    self._clickScript = function () {
        // when button is part of a recipe and the button and button is in the up state then the no modifier needs to be removed from the order
        var posidAttr = "posid2";
        var priceLevelAttr = "pricelevel2";

        if ((self.hasRecipe) && (!self.isDown)) {
            posidAttr = "noposid";
        	priceLevelAttr = "pricelevelno";
        }

        var primaryClickEvent = "_nex.ordering.updateMultiState('" + self.menuItem[self.name][posidAttr] + "','" + self.menuItem[self.name][priceLevelAttr] + "','" + self.buttonName + "', event);";
        if (self.isDown) {
            primaryClickEvent = "void(0);";
        } else {
            primaryClickEvent += "_nex.ordering.trackClick('" + self.buttonName + "','" + htmlEscape(self.buttonText()) + "');";
            // anytime they hit a button, play the button hit sound.
            primaryClickEvent += "_nex.assets.soundManager.playButtonHit();";
        }
        return primaryClickEvent;
    };
    self.autoClick = function (posid, callback) {

        var priceLevel = self.menuItem[self.name].pricelevel2;

        var priceLevelAttr = "";
        if (self.menuItem[self.name].posid1 == posid) {
            priceLevelAttr = self.menuItem[self.name].pricelevel1;
        } else if (self.menuItem[self.name].posid3 == posid) {
            priceLevelAttr = self.menuItem[self.name].pricelevel3;
        }

        if (self._clickScript().indexOf("updateMultiState") !== -1) {
            _nex.ordering.updateMultiState(posid, priceLevelAttr, self.buttonName, null, function () {
                if (callback !== undefined) {
                    callback();
                }
            });
        } else {
            _nex.ordering.updateSubButton(posid, priceLevelAttr, self.buttonName, null, 1, function () {
                if (callback !== undefined) {
                    callback();
                }
            });
        }
    };
    self.state = function () {

        var subButtonVisibilty = "hidden";
        if (self.isDown) {
            self.html.addClass("button-down-state");

            subButtonVisibilty = "visible";
            self.subButtonState("less", "posid1", "pricelevel1");
            self.subButtonState("normal", "posid2", "pricelevel2");
            self.subButtonState("more", "posid3", "pricelevel3");

            self.html.data("state", "down");

        } else {
            self.html.removeClass("button-down-state");
            self.subButtonState("less", null, null);
            self.subButtonState("normal", null, null);
            self.subButtonState("more", null, null);
            self.html.data("state", "up");
        }

        // update the onclick of the button
        var next = self.html.find('#nextmenu');
        next.attr("onclick", self._clickScript());

        // update visibility  of the sub buttons
        var subButtons = self.html.find("#subButtons");
        if (subButtons !== undefined) {
            subButtons.css("visibility", subButtonVisibilty);
        }

        // button text
        var btext = self.html.find('#btext');
        btext.empty();
        btext.append(self.buttonText());

        // button text
        var price = self.html.find('#price');
        if (price.length > 0) {
            price.empty();
            var priceValue = self.price();
            if (priceValue > 0) {
                price.append(currency.formatAsDollars(self.price(), false));
                price.css("visibility", "visible");
                price.addClass("button-price-hidden");
            } else {
                price.css("visibility", "hidden");
                price.removeClass("button-price-hidden");
            }
        }

        // set the active-posid unless it is part of the recipe
        if (self.hasRecipe) {
            self.html.data("active-posid", (self.recipePosidAttr === self.activePosidAttr) ? "" : self.menuItem[self.name][self.activePosidAttr]);
            self.html.data("active-pricelevel", (self.recipePriceLevelAttr === self.activePriceLevelAttr) ? "" : self.menuItem[self.name][self.activePriceLevelAttr]);
        } else {
            self.html.data("active-posid", (!self.isDown) ? "" : self.menuItem[self.name][self.activePosidAttr]);
            self.html.data("active-pricelevel", (!self.isDown) ? "" : self.menuItem[self.name][self.activePriceLevelAttr]);
        }
        self.html.data("item-type", "modifier");
    };

    self.subButtonState = function (name, posidAttr, priceLevelAttr) {
        var subButton = self.html.find("#" + name);
        if (subButton !== undefined) {
            var checkMark = subButton.find('#check');
            var active = (self.activePosidAttr === posidAttr);
            checkMark.css("visibility", (active) ? "visible" : "hidden");

            if (active) {
                subButton.addClass("sub-button-down-state");
            } else {
                subButton.removeClass("sub-button-down-state");
            }

            var clickEvent = "void(0)";

            if ((posidAttr !== null) &&
                (posidAttr !== undefined)) {
                // add sub button onclick event
                // when the button in on the recipe and the active posid is a the recipe modifier
                // then add the "-NO" pass the no item
                if (self.hasRecipe) {
                    if ((self.recipePosidAttr === posidAttr) &&
                        (self.activePosidAttr !== "posid3")) {
                        posidAttr = "noposid"; // posid1 is the NO modifier
                    	priceLevelAttr = "pricelevelno";
                    } else if (self.recipePosidAttr === posidAttr) {
                        // this will cause the active posid to be removed from the order
                        // and prevent the recipe posid from being added to the order
                        posidAttr = "";
                        priceLevelAttr = "";
                    }
                }

                var buttonText = subButton.find("#btext" + name);
                if (buttonText.length > 0) {
                    buttonText.empty();
                    buttonText.append(_nex.assets.theme.getTextAttribute("ORDER", name, name.toUpperCase()));
                }

                var posid = (posidAttr !== "") ? self.menuItem[self.name][posidAttr] : "";
                var priceLevel = (priceLevelAttr !== "") ? self.menuItem[self.name][priceLevelAttr] : "";

                if (posid.length > 0) {
                    // show the button price on the sub-button (if a price field exists)
                    var priceField = "price1text";
                    if (posidAttr === "posid1") {
                        priceField = "price0text";
                    } else if (posidAttr === "posid3") {
                        priceField = "price2text";
                    }

                    var priceText = subButton.find("#" + priceField);
                    if (priceText.length > 0) {
                        priceText.empty();

                        if (active) {
                            var mod = _nex.assets.theme.itemByPosid(posid);
                            var modPrice = _nex.assets.theme.itemPrice(mod, priceLevel);

                            if ((modPrice.length > 0) &&
                                (Number(modPrice) > 0) &&
                                self.showPriceFlag()) {
                                priceText.append(currency.formatAsDollars(modPrice, false));
                            }
                        }
                    }
                }

                clickEvent = "_nex.ordering.updateSubButton('" + posid + "','" + priceLevel + "','" + self.buttonName + "',1, event);";
                clickEvent += "_nex.ordering.trackClick('" + self.buttonName + "','" + htmlEscape(self.buttonText()) + "');";
                // anytime they hit a button, play the button hit sound.
                clickEvent += "_nex.assets.soundManager.playButtonHit();";
            }

            subButton.attr("onclick", clickEvent);
        }
    };

    // click method puts the button in the down state
    self.click = function (posid) {
        self.isDown = true;

        if (self.hasRecipe) {
            // the active posid to the recipe attribute when the button is enabled
            self.activePosidAttr = self.recipePosidAttr;
            self.activePriceLevelAttr = self.recipePriceLevelAttr;
        } else {
            if (self.menuItem[self.name].posid1 === posid) {
                self.activePosidAttr = "posid1";
                self.activePriceLevelAttr = "pricelevel1";
            } else if (self.menuItem[self.name].posid2 === posid) {
                self.activePosidAttr = "posid2";
                self.activePriceLevelAttr = "pricelevel2";
            } else if (self.menuItem[self.name].posid3 === posid) {
                self.activePosidAttr = "posid3";
                self.activePriceLevelAttr = "pricelevel3";
            } else if (self.menuItem[self.name].noposid === posid) {
                self.activePosidAttr = "noposid";
            	self.activePriceLevelAttr = "pricelevelno";
            }
        }

        self.state();
    };

    // update is called to update the sub buttons or to put the button in the up state
    self.update = function (posid) {

        if (posid === "") {
            posid = self.menuItem[self.name][self.recipePosidAttr];
        }
        // determine the state of the button
        // toggle the button on off
        if (self.menuItem[self.name][self.activePosidAttr] === posid) {
            // the active posid is the one selected - toggle the button on/off
            self.isDown = !self.isDown;
	    } else if ((self.hasRecipe) && (posid === self.menuItem[self.name].noposid)) {
	        self.isDown = false;
        }

        // update sub button
        if (self.isDown) {
            if (self.menuItem[self.name].posid1 === posid) {
                self.activePosidAttr = "posid1";
                self.activePriceLevelAttr = "pricelevel1";
            } else if (self.menuItem[self.name].posid2 === posid) {
                self.activePosidAttr = "posid2";
                self.activePriceLevelAttr = "pricelevel2";
            } else if (self.menuItem[self.name].posid3 === posid) {
                self.activePosidAttr = "posid3";
                self.activePriceLevelAttr = "pricelevel3";
            }
        } else {
            self.activePosidAttr = "posid2";
            self.activePriceLevelAttr = "pricelevel2";
        }

        self.state();
    };
};
_nex.assets.buttons.LessMore.prototype = Object.create(_nex.assets.buttons.SelectOne.prototype);
_nex.assets.buttons.MenuButton = function () {

    _nex.assets.buttons._BaseButton.call(this);

    var self = this;
    self.name = "MENUBUTTON";
    self.buttonId = "menubutton";
    self.itemsEnabled = function (state) {
        var display = (self.menuItem.enabled.toLowerCase() === "true");

        if (display) {
            display = _nex.assets.theme.isDayPartActive(self.menuItem[self.name].daypart);

            if (display) {

                if (display) {

                    var menuToSearch = _nex.ordering.menus[Number(self.nextMenu()) - 1];
                    if (menuToSearch) {

                        var template = _nex.assets.templateManager.findTemplate(menuToSearch.template);
                        if ((template !== null) &&
                            (template.classname !== undefined) &&
                            (template.classname.toLowerCase() !== "orderreview") &&
                            (template.classname.toLowerCase() !== "buffet") &&
                            (template.classname.toLowerCase() !== "buffetreservation") &&
                            (template.classname.toLowerCase() !== "checkout") &&
                            (template.classname.toLowerCase() !== "merchandising") &&
                            (template.classname.toLowerCase() !== "pager") &&
                            (template.classname.toLowerCase() !== "scanitems") &&
                            (template.classname.toLowerCase() !== "smsprompt") &&
                            (template.classname.toLowerCase() !== "weighitem")) {

                            var currentKey = menuToSearch.id.toString() + ",";
                            if (state === undefined) {
                                state = "";
                            }

                            //console.debug("current state: " + state);
                            if (state.indexOf(currentKey) >= 0) {
                                console.log("Found a loop in processing the menu enabled logic. Existing that loop. Menu: " + menuToSearch.id.toString());
                                return display;
                            }
                            else {
                                state = state + currentKey;
                            }

                            if (template.hasOwnProperty("htmlsrc") && (template.htmlsrc.length > 0)) {
                                display = true;
                            } else {
                                if (!_nex.assets.theme.system.USERINTERFACE.hasOwnProperty("searchmenubuttons") ||
                                    _nex.assets.theme.system.USERINTERFACE.searchmenubuttons.toString().toLowerCase() === "true") {
                                    var menuItems = _nex.ordering.getAvailableButtons(menuToSearch, state);
                                    if (menuItems.length === 0) {
                                        console.log("hiding menu button because no items are available");
                                        display = false;
                                    }
                                }
                            }
                        }
                    }
                }

                if (!display && self.name === "MULTIMENUBUTTON") {
                    for (var i = 0; i < self.menuItem.MULTIMENUBUTTON.MENUITEM.length; i++) {
                        var mmItem = self.menuItem.MULTIMENUBUTTON.MENUITEM[i];
                        if (mmItem.SELECTONE && _nex.assets.theme.itemIsAvailable(mmItem.SELECTONE.posid)) {
                            //console.debug("showing multi menu button because one of the child buttons is enabled!");
                            display = true;
                            break;
                        }
                    }
                }
            }
        }

        if (display) {
            var alcoholEnabled = false;
            if (_nex.context === "UX") {
                alcoholEnabled = _nex.orderManager.currentOrder.alcoholEnabled;
            } else {
                alcoholEnabled = _iorderfast.ordering.alcoholEnabled;
            }

            if ((!alcoholEnabled) && _nex.assets.theme.menuHasAlcohol(self.nextMenu())) {
                display = false;
            }
        }

        // Check if this menu is visible for online ordering.
        if ((display) && self.menuItem[self.name].hasOwnProperty("VISIBILITY")) {
            if (_nex.context !== "UX") {
                display = ((self.menuItem[self.name].VISIBILITY.online.toLowerCase() === "true") ||
                        (self.menuItem[self.name].VISIBILITY.mobile.toLowerCase() === "true"));
            } else {
                if (self.menuItem[self.name].VISIBILITY.hasOwnProperty("kiosk")) {
                    display = self.menuItem[self.name].VISIBILITY.kiosk.toLowerCase() === "true";

                    if (display && 
                        self.menuItem[self.name].VISIBILITY.hasOwnProperty("devicenamefilter") &&
                        self.menuItem[self.name].VISIBILITY.devicenamefilter.length > 0) {

                        var devicefilter = self.menuItem[self.name].VISIBILITY.devicenamefilter;
                        //if there is a comma in the list then append that to the PCID to find the device.
                        //this is done for backwards compat because the new way of saving the device list appends 
                        //a comma to each device, the old code didn't have commas and the device names just ran together
                        var postFix = "";
                        if (devicefilter.indexOf(",") > 0)
                        {
                            postFix = ",";
                        }
										
                        if (devicefilter.toLowerCase().indexOf(_nex.device.computerName().toLowerCase() + postFix, 0) == -1) {
                            display = false;
                        }else {
                            display = true;
                        }
                    }
                }
            }
        }

        return display;
    };

    self.descriptionText = function () {
        var desc = "";

        if (self.menuItem[self.name].showdescription.toLowerCase() === "true") {
            desc = self.getDescriptionFromNextMenu(self.nextMenu(), 0);
        }
        return itemFormatting.buttonText(desc);
    };

    self.buttonText = function () {
        return itemFormatting.buttonText(_nex.assets.theme.itemTextByType(self.menuItem[self.name], "BUTTONTEXT")); // TODO - multi-lingual; does not work for NEXTEP Mobile
    };

    self.image = function () {
        return itemFormatting.buttonImage(self.menuItem[self.name].image);
    };

    self.clickEvent = function () {
        var script = "";

        if (!_nex.ordering.order.ageVerified &&
             _nex.assets.theme.menuHasAlcohol(self.nextMenu())) {
            script = "_nex.ordering.ageVerificationPrompt(" + self.nextMenu() + ");";
        } else {
            script = "_nex.ordering.setDragALong('" + self.buttonName + "');";
            script += "_nex.ordering.loadMenu(" + self.nextMenu() + ");";
        }
        return script;
    };

    self.showPriceFlag = function () {
        return false;
    };

    self.nextMenu = function () {
        return self.menuItem[self.name].nextmenu;
    };
};
_nex.assets.buttons.MenuButton.prototype = Object.create(_nex.assets.buttons._BaseButton.prototype);

// blank button
_nex.assets.buttons.More = function () {

    _nex.assets.buttons._BaseButton.call(this);

    var self = this;

    self.name = "MORE";
    self.buttonId = "moreforward";

    self.buttonText = function () {
        return _nex.assets.theme.getTextAttribute("ORDER", "scroll","MORE");
    };

    self.clickEvent = function () {
        return "_nex.ordering.scrollMenu();";
    };

    self.enabled = function () {
        return (_nex.context === "UX");
    };
};
_nex.assets.buttons.More.prototype = Object.create(_nex.assets.buttons._BaseButton.prototype);
// multi-menu button
_nex.assets.buttons.MultiMenuButton = function () {

    _nex.assets.buttons.MenuButton.call(this);

    var self = this;
    self.name = "MULTIMENUBUTTON";
    self.clickEvent = function () {
        var result = "_nex.ordering.setDragALong('" + self.buttonName + "');";
        result += "_nex.ordering.loadMenuAndButtons(" + self.nextMenu() + ",'" + self.buttonName + "');";
        return result;
    };
    self.getMenuItems = function () {
        return self.menuItem.MULTIMENUBUTTON.MENUITEM;
    };
};
_nex.assets.buttons.MultiMenuButton.prototype = Object.create(_nex.assets.buttons.MenuButton.prototype);
// select many item
_nex.assets.buttons.SelectManyItem = function () {

    _nex.assets.buttons.SelectOne.call(this);

    var self = this;
    self.hasRecipe = false;
    self.isSelected = false;
    self.name = "SELECTMANYITEM";
    self.buttonId = "selectmanyitem";
    self.itemType = "item";

    self.loadItem = function () {

        self.item = _nex.assets.theme.itemByPosid(self.menuItem[this.name].posid);

        var currentItem = _nex.ordering.currentItem();
        if ((currentItem !== null) && (self.item !== null)) {
            var item = _nex.assets.theme.itemByPosid(currentItem.posid);
            // determine if the modifier is on the recipe
            if (item.RECIPE !== undefined) {
                item.RECIPE = $.isArray(item.RECIPE) ? item.RECIPE : new Array(item.RECIPE);
                for (var i = 0; (i < item.RECIPE.length) && (!self.hasRecipe) ; i++) {
                    self.hasRecipe = (item.RECIPE[i].posid === self.item.posid);
                }
            }

            // determine if the item is already on the order
            if ((currentItem.ITEM !== undefined) &&
                (currentItem.ITEM.length > 0)) {

                for (var j = 0; (j < currentItem.ITEM.length) && (!self.isSelected) ; j++) {
                    if (self.hasRecipe) {
                        self.isSelected = (currentItem.ITEM[j].posid === (self.item.posid + "-NO"));
                    } else {
                        self.isSelected = (currentItem.ITEM[j].posid === self.item.posid);
                    }
                }
            }
        }
    };

    self.nextMenu = function () {
        return "";
    };

    self.clickEvent = function () {
        var posid = (self.hasRecipe) ? (self.item.posid + "-NO") : self.item.posid;
        var result = "_nex.ordering.addManyModifier('" + posid + "','" + self.priceLevel() + "','" + self.buttonName + "');";
        return result;
    };

    self.autoClick = function (callback) {
        var posid = (self.hasRecipe) ? (self.item.posid + "-NO") : self.item.posid;
        _nex.ordering.addManyModifier(posid, self.priceLevel(), self.buttonName, function () {
            if (callback !== undefined) {
                callback();
            }
        });
    };

    self.state = function () {

        var $checkMark = self.html.find('#check');
        var showCheck = false;
        if (self.hasRecipe) {
            self.html.addClass("button-down-state");
            self.html.data("state", "down");
            showCheck = true;
            self.isComesWithVisible(true);
        } else {

            if (self.isSelected) {
                self.html.addClass("button-down-state");
                self.html.data("state", "down");
                showCheck = true;
            } else {
                self.html.removeClass("button-down-state");
                self.html.data("state", "up");
            }
            
            self.isComesWithVisible(false);
        }

        if (showCheck) {
            $checkMark = self.html.find('#check');
            if ($checkMark !== undefined) {
                $checkMark.removeClass("button-many-unselected");
                $checkMark.addClass("button-many-selected");
            }

        }

        self.html.data("item-type", self.itemType);
    };

    self.update = function () {

        if (self.hasRecipe) {
            var modText = self.buttonText();
            if (self.html.data("state") === "up") {
                var mod = _nex.assets.theme.itemByPosid(self.item.posid + "-NO");
                if (mod !== null) {
                    modText = itemFormatting.buttonText(_nex.assets.theme.itemTextByType(mod, "BUTTONTEXT"));
                }
            }

            var btext = self.html.find('#btext');
            btext.empty();
            btext.append(modText);
        }
    };

};
_nex.assets.buttons.SelectManyItem.prototype = Object.create(_nex.assets.buttons.SelectOne.prototype);
_nex.assets.buttons.SelectManyModifier = function () {

    _nex.assets.buttons.SelectManyItem.call(this);

    var self = this;
    self.name = "SELECTMANYMODIFIER";
    self.buttonId = "selectmanyof";
    self.itemType = "modifier";
};
_nex.assets.buttons.SelectManyModifier.prototype = Object.create(_nex.assets.buttons.SelectManyItem.prototype);
/* SELECT NE button */
_nex.assets.buttons.SelectNE = function () {

    _nex.assets.buttons.SelectOne.call(this);

    var self = this;
    self.hasRecipe = false;
    self.recipePosidAttr = "";
    self.recipePriceLevelAttr = "";
    self.isDown = false;
    self.activePosidAttr = "posid2";
    self.activePriceLevelAttr = "pricelevel2";
    self.modQuantity = 0;
    self.name = "SELECTNE";
    self.buttonInfo = function () {
        return {
            "name": self.buttonName,
            "removeposid": self.menuItem[self.name].posid1,
            "removequantity": -1,
            "defaultposid": self.menuItem[self.name].posid2,
            "defaultquantity": 1,
            "chargeableposid": self.menuItem[self.name].posid3,
            "chargeablequantity": 2,
            "activeposidattr": self.activePosidAttr,
            "activepricelevelattr": self.activePriceLevelAttr,
            "posid1": self.menuItem[self.name].posid1,
            "posid2": self.menuItem[self.name].posid2,
            "posid3": self.menuItem[self.name].posid3
        };
    };
	self.noPosid = function () {
	    return self.menuItem[self.name].posid1 || "";
	};
	self.noPriceLevel = function () {
	    return self.menuItem[self.name].pricelevel1 || "";
	};
    // set the initial state of the button when the template is loaded
    self.loadItem = function () {

        self.item = _nex.assets.theme.itemByPosid(self.menuItem[self.name].posid2);

        var currentItem = _nex.ordering.currentItem();
        if (currentItem !== null) {

            // get recipe items since item on the order has the minimum info
            var recipe = _nex.assets.theme.itemRecipe(currentItem.posid);
            // determine if the modifier is on the recipe
            for (var i = 0; (i < recipe.length) && (!self.hasRecipe) ; i++) {
                if (recipe[i].posid === self.menuItem[self.name].posid1) {
                    self.hasRecipe = true;
                    self.recipePosidAttr = "posid1";
                    self.recipePriceLevelAttr = "pricelevel1";
                } else if (recipe[i].posid === self.menuItem[self.name].posid2) {
                    self.hasRecipe = true;
                    self.recipePosidAttr = "posid2";
                    self.recipePriceLevelAttr = "pricelevel2";
                } else if (recipe[i].posid === self.menuItem[self.name].posid3) {
                    self.hasRecipe = true;
                    self.recipePosidAttr = "posid3";
                    self.recipePriceLevelAttr = "pricelevel3";
                }
            }

            // determine if the item is already on the order
            var found = false;
            if ((currentItem.ITEM !== undefined) &&
                (currentItem.ITEM.length > 0)) {

                for (var j = 0; (j < currentItem.ITEM.length) && (!self.isOnOrder) ; j++) {
                    if ((currentItem.ITEM[j].posid === (self.menuItem[self.name].posid1)) &&
                        (currentItem.ITEM[j].menuid === _nex.ordering.currentMenu.id)) {
                        found = true; // posid1 is the no item
                        self.activePosidAttr = "posid1";
                        self.activePriceLevelAttr = "pricelevel1";
                    } else if ((currentItem.ITEM[j].posid === (self.menuItem[self.name].posid2)) &&
                        (currentItem.ITEM[j].menuid === _nex.ordering.currentMenu.id)) {
                        found = true;
                        self.activePosidAttr = "posid2";
                        self.activePriceLevelAttr = "pricelevel2";
                    } else if ((currentItem.ITEM[j].posid === (self.menuItem[self.name].posid3))  &&
                        (currentItem.ITEM[j].menuid === _nex.ordering.currentMenu.id)) {
                        found = true;
                        self.activePosidAttr = "posid3";
                        self.activePriceLevelAttr = "pricelevel3";
                    }
                }
            }

            if ((found) ||
                (!found && self.hasRecipe)) {
                self.isDown = true;

                if (self.hasRecipe) {
                    self.activePosidAttr = self.recipePosidAttr;
                    self.activePriceLevelAttr = self.recipePriceLevelAttr;
                }
            }
        }
    };
    self.nextMenu = function () {
        return "";
    };
    self.buttonId = "selectne";
    self.itemsEnabled = function () {
        return _nex.assets.theme.itemIsAvailable(self.menuItem[self.name].posid1) &&
                _nex.assets.theme.itemIsAvailable(self.menuItem[self.name].posid2) &&
                _nex.assets.theme.itemIsAvailable(self.menuItem[self.name].posid3);
    };
    self.buttonText = function () {
        var posidAttr = self.activePosidAttr;
        var priceLevelAttr = self.activePriceLevelAttr;
        if ((self.hasRecipe) && (!self.isDown)) {
            posidAttr = "posid1";
            priceLevelAttr = "pricelevel1";
        }
        var activeItem = _nex.assets.theme.itemByPosid(self.menuItem[self.name][posidAttr]);
        return itemFormatting.buttonText(_nex.assets.theme.itemTextByType(activeItem, "BUTTONTEXT", self.menuItem[self.name][priceLevelAttr]));
    };
    self.image = function () {
        return itemFormatting.buttonImage(self.item.DETAIL.image);
    };
    self.hasPosid = function (posid) {
        return (self.menuItem[self.name].posid1 === posid) ||
            (self.menuItem[self.name].posid2 === posid) ||
            (self.menuItem[self.name].posid3 === posid);
    };
	self._getQuantity = function (posid) {

	    var info = self.buttonInfo();
	    var quantity = info.defaultquantity;

	    if(self.isDown && (posid === self.menuItem[self.name][self.activePosidAttr])) {
	        quantity = self.modQuantity;
	    } else if (posid === info.removeposid) {
	        quantity = info.removequantity;
	    } else if (posid === info.chargeableposid) {
	        quantity = info.chargeablequantity;
	    }

	    return quantity;
	};
	self.clickEvent = function () {
	    return "void(0);"; // default click event is void since the click event script changes based on the state of the button
	};
	self._clickScript = function () {
        // when button is part of a recipe and the button and button is in the up state then the no modifier needs to be removed from the order
        var posidAttr = "posid2";
        var priceLevelAttr = "pricelevel2";

        if ((self.hasRecipe) && (!self.isDown)) {
            posidAttr = "posid1";
            priceLevelAttr = "pricelevel1";
        }

        var primaryClickEvent = "_nex.ordering.updateMultiState('" + self.menuItem[self.name][posidAttr] + "','" + self.menuItem[self.name][priceLevelAttr] + "','" + self.buttonName + "', event);";
        var trackAndSound = true;
        if (self.isDown) {
            var subButtons = self.html.find("#subButtons");
            if (subButtons.length === 0) {
                // determine if there are sub buttons; if no sub buttons exist then treat the entire button as a sub-button
                if (self.hasRecipe) {
                    posidAttr = "posid1";
                    priceLevelAttr = "pricelevel1";
                } else {
                    posidAttr = self.activePosidAttr;
                    priceLevelAttr = self.activePriceLevelAttr;
                }

                var posid = (posidAttr !== "") ? self.menuItem[self.name][posidAttr] : "";
                var priceLevel = (priceLevelAttr !== "") ? self.menuItem[self.name][priceLevelAttr] : "";

                primaryClickEvent = "_nex.ordering.updateSubButton('" + posid + "','" + priceLevel + "','" + self.buttonName + "'," + self._getQuantity(posid).toString() + ", event);";
            } else {
                primaryClickEvent = "void(0)";
                trackAndSound = false;
            }
        }

        if (trackAndSound) {
            primaryClickEvent += "_nex.ordering.trackClick('" + self.buttonName + "','" + htmlEscape(self.buttonText()) + "');";
            // anytime they hit a button, play the button hit sound.
            primaryClickEvent += "_nex.assets.soundManager.playButtonHit();";
        }

        return primaryClickEvent;
    };
    self.autoClick = function (posid, callback) {

        var priceLevel = self.menuItem[self.name].pricelevel2;

        if (self.menuItem[self.name].posid1 == posid) {
            priceLevel = self.menuItem[self.name].pricelevel1;
        } else if (self.menuItem[self.name].posid3 == posid) {
            priceLevel = self.menuItem[self.name].pricelevel3;
        }

        if (self._clickScript().indexOf("updateMultiState") !== -1) {
            _nex.ordering.updateMultiState(posid, priceLevel, self.buttonName, null, function () {
                if (callback !== undefined) {
                    callback();
                }
            });
        } else {
            _nex.ordering.updateSubButton(posid, priceLevel, self.buttonName, null, self._getQuantity(posid).toString(), function () {
                if (callback !== undefined) {
                    callback();
                }
            });
        }
    };
    self.state = function () {

        var subButtonVisibilty = "hidden";
        if (self.isDown) {
            self.html.addClass("button-down-state");

            subButtonVisibilty = "visible";
            self.subButtonState("none", "posid1", "pricelevel1");
            self.subButtonState("normal", "posid2", "pricelevel2");
            self.subButtonState("extra", "posid3", "pricelevel3");

            self.html.data("state", "down");

        } else {
            self.html.removeClass("button-down-state");
            self.subButtonState("none", null, null); // disable the button by not passing a posid attribute
            self.subButtonState("normal", null, null);
            self.subButtonState("extra", null, null);
            self.html.data("state", "up");
        }

        // update the onclick of the button
        var next = self.html.find('#nextmenu');
        next.attr("onclick", self._clickScript());

        // update visibility  of the sub buttons
        var subButtons = self.html.find("#subButtons");
        if (subButtons !== undefined) {
            subButtons.css("visibility", subButtonVisibilty);
        }

        // button text
        var btext = self.html.find('#btext');
        btext.empty();
        btext.append(self.buttonText());

        // button text
        var price = self.html.find('#price');
        if (price.length > 0) {
            price.empty();
            var priceValue = self.price();
            if (priceValue > 0) {
                price.append(currency.formatAsDollars(self.price(), false));
                price.css("visibility", "visible");
                price.addClass("button-price-hidden");
            } else {
                price.css("visibility", "hidden");
                price.removeClass("button-price-hidden");
            }
        }

        // set the active-posid unless it is part of the recipe
        if (self.hasRecipe) {
            self.html.data("active-posid", (self.recipePosidAttr === self.activePosidAttr) ? "" : self.menuItem[self.name][self.activePosidAttr]);
            self.html.data("active-pricelevel", (self.recipePriceLevelAttr === self.activePriceLevelAttr) ? "" : self.menuItem[self.name][self.activePriceLevelAttr]);
        } else {
            self.html.data("active-posid", (!self.isDown) ? "" : self.menuItem[self.name][self.activePosidAttr]);
            self.html.data("active-pricelevel", (!self.isDown) ? "" : self.menuItem[self.name][self.activePriceLevelAttr]);
        }

        self.html.data("item-type", "modifier");

	    if ((self.isDown) && (self.modQuantity === 0)) {
	        self.modQuantity = (self.menuItem[self.name][self.activePosidAttr] === self.buttonInfo().removeposid) ? self.buttonInfo().removequantity : 1;
	    } else if(!self.isDown) {
	        self.modQuantity = 0;
	    }
    };

    self.price = function () {
        var posidAttr = self.activePosidAttr;
        var priceLevelAttr = self.activePriceLevelAttr;
        if ((self.hasRecipe) && (!self.isDown)) {
            posidAttr = "posid1";
            priceLevelAttr = "pricelevel1";
        }
        var activeItem = _nex.assets.theme.itemByPosid(self.menuItem[self.name][posidAttr]);

        var itemPrice = _nex.assets.theme.itemPrice(activeItem, self.menuItem[self.name][priceLevelAttr]);
        if ((itemPrice.length > 0) && (self.showPriceFlag())) {
            return Number(itemPrice);
        } else {
            return 0.0;
        }
    };
	self._isOnCurrentItem = function(posid) {
	    var found = false;

	    var currentItem = _nex.ordering.currentItem();
	    if (currentItem && currentItem.hasOwnProperty("ITEM")) {
	        for (var i = 0; (i < currentItem.ITEM.length) && (!found) ; i++) {
	            found = (currentItem.ITEM[i].posid === posid);
	        }
	    }

	    return found;
	};
    self.subButtonState = function (name, posidAttr, priceLevelAttr) {
        var subButton = self.html.find("#" + name);
        if (subButton !== undefined) {
            var checkMark = subButton.find('#check');
            var active = (self.activePosidAttr === posidAttr);
            checkMark.css("visibility", (active) ? "visible" : "hidden");

            if (active) {
                subButton.addClass("sub-button-down-state");
            } else {
                subButton.removeClass("sub-button-down-state");
            }

            var clickEvent = "void(0)";

            if ((posidAttr !== null) &&
                (posidAttr !== undefined)) {
                // add sub button onclick event
                // when the button in on the recipe and the active posid is a the recipe modifier
                // then add the "-NO" pass the no item
                if (self.hasRecipe) {
                    if ((self.recipePosidAttr === posidAttr) &&
                        (self.activePosidAttr !== "posid3")) {
                        posidAttr = "posid1"; // posid1 is the NO modifier
                        priceLevelAttr = "pricelevel1";
                    } else if ((self.recipePosidAttr === posidAttr) &&
                        (self.activePosidAttr === "posid3")) {
                        // this will cause the active posid to be removed from the order
                        // and prevent the recipe posid from being added to the order
                        posidAttr = "";
                        priceLevelAttr = "";
                    }
                }

                var buttonText = subButton.find("#btext" + name);
                if (buttonText.length > 0) {
                    buttonText.empty();
                    buttonText.append(_nex.assets.theme.getTextAttribute("ORDER", name, name.toUpperCase()));
                }

                var posid = (posidAttr !== "") ? self.menuItem[self.name][posidAttr] : "";
                var priceLevel = (priceLevelAttr !== "") ? self.menuItem[self.name][priceLevelAttr] : "";
	            var splitMod = (self._isOnCurrentItem(self.buttonInfo().defaultposid) && 
	                            self._isOnCurrentItem(self.buttonInfo().chargeableposid));

                if (posid.length > 0) {
                    // show the button price on the sub-button (if a price field exists)
                    var priceField = "price1text";
                    if (posidAttr === "posid1") {
                        priceField = "price0text";
	                    if (!self.hasRecipe) {
	                        posid = (self.activePosidAttr === "posid3") ? self.menuItem[self.name].posid3 : self.menuItem[self.name].posid2; // this will cause the mod to be removed from the order when the none is touched 
	                    } 
	                } else if (posidAttr === "posid2") {
	                    priceField = "price1text";
	                    if (splitMod) {
	                        posid = self.menuItem[self.name][self.activePosidAttr];
	                        priceLevel = self.menuItem[self.name][self.activePriceLevelAttr];
	                        active = false;
	                        checkMark.css("visibility", "hidden");
	                    } else if (self.activePosidAttr === "posid3") {
	                        // the normal button is to show the price and text of the extra button
	                        posid = self.menuItem[self.name][self.activePosidAttr];
	                        priceLevel = self.menuItem[self.name][self.activePriceLevelAttr];

	                        if (self.modQuantity === 1) {
	                            active = true;
	                            checkMark.css("visibility", "visible");
	                        }
	                    } else if ((self.activePosidAttr === "posid2") &&
	                        (self.modQuantity > 1)) {
	                        active = false;
	                        checkMark.css("visibility", "hidden");
	                    }
                    } else if (posidAttr === "posid3") {
                        priceField = "price2text";

	                    if (splitMod) {
	                        active = true;
	                        checkMark.css("visibility", "visible");
	                    } else if (self.activePosidAttr === "posid2") {
	                        posid = self.menuItem[self.name][self.activePosidAttr];
	                        priceLevel = self.menuItem[self.name][self.activePriceLevelAttr];
	                        active = false;
	                        if (self.modQuantity > 1) {
	                            checkMark.css("visibility", "visible");
	                        }
	                    } else if (self.modQuantity > 1) {
	                        active = true;
	                    } else {
	                        active = false;
	                        checkMark.css("visibility", "hidden");
	                    }
	                }

                    var priceText = subButton.find("#" + priceField);
                    if (priceText.length > 0) {
                        priceText.empty();

                        if (active) {
                            var mod = _nex.assets.theme.itemByPosid(posid);
                            var modPrice = _nex.assets.theme.itemPrice(mod, priceLevel);

                            if ((modPrice.length > 0) &&
                                (Number(modPrice) > 0) &&
                                self.showPriceFlag()) {
	                            if (self.modQuantity > 1) {
	                                modPrice = (Number(modPrice) * self.modQuantity).toString();
	                            }
                                priceText.append(currency.formatAsDollars(modPrice, false));
                            }
                        }
                    }
                }

	            if (((posidAttr === "posid2") || (posidAttr === "posid3")) && splitMod) {
	                clickEvent = "_nex.ordering.updateSubButton('" + posid + "','" + priceLevel + "','" + self.buttonName + "', 1, event);";
	            } else if ((posidAttr === "posid2") &&
	                (self.activePosidAttr === "posid3") &&
	                (self.modQuantity === 2)) {
	                clickEvent = "_nex.ordering.updateModifierQuantity('" + _nex.ordering.currentItemIndex() + "','-1','" + posid + "','" + self.buttonName + "');";
	            } else if ((posidAttr === "posid3") &&
	                ((self.activePosidAttr === "posid2") || (self.activePosidAttr === "posid3")) &&
	                (self.modQuantity <= 1)) {
	                clickEvent = "_nex.ordering.updateModifierQuantity('" + _nex.ordering.currentItemIndex() + "','1','" + posid + "','" + self.buttonName + "');";
	            } else {
	                clickEvent = "_nex.ordering.updateSubButton('" + posid + "','" + priceLevel + "','" + self.buttonName + "'," + self._getQuantity(posid).toString() + ", event);";
	            }

	            clickEvent += "_nex.ordering.trackClick('" + self.buttonName + "','" + htmlEscape(self.buttonText()) + "');";
                // anytime they hit a button, play the button hit sound.
	            clickEvent += "_nex.assets.soundManager.playButtonHit();";
	        }

            subButton.attr("onclick", clickEvent);
        }
    };

    // click method puts the button in the down state
    self.click = function (posid) {
        self.isDown = true;

        if (self.hasRecipe) {
            // the active posid to the recipe attribute when the button is enabled
            self.activePosidAttr = self.recipePosidAttr;
        } else {
            if (self.menuItem[self.name].posid1 === posid) {
                self.activePosidAttr = "posid1";
                self.activePriceLevelAttr = "pricelevel1";
            } else if (self.menuItem[self.name].posid2 === posid) {
                self.activePosidAttr = "posid2";
                self.activePriceLevelAttr = "pricelevel2";
            } else if (self.menuItem[self.name].posid3 === posid) {
                self.activePosidAttr = "posid3";
                self.activePriceLevelAttr = "pricelevel3";
            }
        }

        self.state();
    };

    // update is called to update the sub buttons or to put the button in the up state
    self.update = function (posid, quantity) {

	    quantity = quantity || "1";
	    quantity = Number(quantity);

        if (posid === "") {
            posid = self.menuItem[self.name][self.recipePosidAttr];
        }

	    var splitMod = (self._isOnCurrentItem(self.buttonInfo().defaultposid) &&
	                            self._isOnCurrentItem(self.buttonInfo().chargeableposid));

        // determine the state of the button
        // 1. always turn the button off it is the NO posid (posid1)
        // 2. toggle the button on off
        if (self.menuItem[self.name].posid1 === posid) {
            self.isDown = false;
	    } else if (splitMod) {
	        if ((self.menuItem[self.name][self.activePosidAttr] === posid) && 
	            (self.buttonInfo().chargeableposid === posid)) {
	            self.isDown = false;
	        }
	    } else if ((self.menuItem[self.name][self.activePosidAttr] === posid) &&
	                (self.modQuantity === quantity)) {
	        // the active posid is the one selected - toggle the button on/off
	        self.isDown = !self.isDown; 
	    }
	    self.modQuantity = quantity;

        // update sub button
        if (self.isDown) {
            if (self.menuItem[self.name].posid1 === posid) {
                self.activePosidAttr = "posid1";
                self.activePriceLevelAttr = "pricelevel1";
            } else if (self.menuItem[self.name].posid2 === posid) {
                self.activePosidAttr = "posid2";
                self.activePriceLevelAttr = "pricelevel2";
            } else if (self.menuItem[self.name].posid3 === posid) {
                self.activePosidAttr = "posid3";
                self.activePriceLevelAttr = "pricelevel3";
            }
        } else {
            self.activePosidAttr = "posid2";
            self.activePriceLevelAttr = "pricelevel2";
        }

        self.state();
    };
};
_nex.assets.buttons.SelectNE.prototype = Object.create(_nex.assets.buttons.SelectOne.prototype);
_nex.assets.buttons.SelectOneModifier = function () {

    _nex.assets.buttons.SelectOne.call(this);

    var self = this;
    self.hasRecipe = false;
    self.name = "SELECTONEMODIFIER";

    self.loadItem = function () {
        self.item = _nex.assets.theme.itemByPosid(self.menuItem.SELECTONEMODIFIER.posid);

        var currentItem = _nex.ordering.currentItem();
        if ((currentItem !== null) && (self.item !== null)) {
            var item = _nex.assets.theme.itemByPosid(currentItem.posid);
            // determine if the modifier is on the recipe
            if (item.RECIPE !== undefined) {
                item.RECIPE = $.isArray(item.RECIPE) ? item.RECIPE : new Array(item.RECIPE);
                for (var i = 0; (i < item.RECIPE.length) && (!self.hasRecipe) ; i++) {
                    self.hasRecipe = (item.RECIPE[i].posid === self.item.posid);
                }
            }
        }
    };

    self.nextMenu = function () {
        return self.menuItem.SELECTONEMODIFIER.nextmenu;
    };

    self.price = function () {
        var price = 0.0;
        var itemPrice = _nex.assets.theme.itemPrice(self.item, self.priceLevel());
        if ((itemPrice.length > 0) && (self.showPriceFlag())) {
            price = Number(itemPrice);
        }

        if ((price === 0) && (self.priceLevel().length > 0) && self.showPriceFlag()) {
            var currentItem = _nex.ordering.currentItem();
            if (currentItem !== null) {
                var fullItem = _nex.assets.theme.itemByPosid(currentItem.posid);
                itemPrice = _nex.assets.theme.itemPrice(fullItem, self.priceLevel());
                if ((itemPrice.length > 0) && !isNaN(itemPrice)) {
                    price = Number(itemPrice);
                }
            }
        }

        return price;
    };

    self.state = function () {
        // enable/disable the comes with options
        self.isComesWithVisible(self.hasRecipe);
    };
};
_nex.assets.buttons.SelectOneModifier.prototype = Object.create(_nex.assets.buttons.SelectOne.prototype);
_nex.assets.buttons.SelectOneQuantity = function () {

    _nex.assets.buttons.SelectOne.call(this);

    var self = this;
    self.item = null;
    self.name = "SELECTONEQUANTITY";
    self.buttonId = "selectonequantity";
    self.isDown = false;
    self.quantity = 0;
    self.quantityLimitReached = false;

    self.loadItem = function () {
        self.item = _nex.assets.theme.itemByPosid(self.menuItem.SELECTONEQUANTITY.posid);

        // determine if the item is already on the order
        var found = false;
        if (self.item !== null) {
            if (self.item.DETAIL.itemtype.toLowerCase() == "modifier") {
                // look at the current item
                // TODO : needs to be tested with a menu that use selectonequantity with modifiers
                var currentItem = _nex.ordering.currentItem();
                if (currentItem && currentItem.ITEM) {
                    for (var m = 0; m < currentItem.ITEM.length; m++) {
                        if (currentItem.ITEM[m].posid === self.item.posid) {
                            found = true;
                            self.quantity = (currentItem.ITEM[m].hasOwnProperty("modquantity")) ? Number(currentItem.ITEM[m].modquantity) : Number(currentItem.ITEM[m].quantity);
                            self.isDown = true;
                        }
                    }
                }
            } else {
                for (var i = _nex.ordering.order.ITEM.length - 1 ; (i >= 0) && (!found) && (_nex.ordering.order.ITEM.length > 0) ; i--) {
                    if ((_nex.ordering.order.ITEM[i].posid === self.item.posid) &&
                        (_nex.ordering.order.ITEM[i].menuid === String(_nex.ordering.currentMenuId))) {
                        found = true;
                        self.quantity = Number(_nex.ordering.order.ITEM[i].quantity);
                        self.isDown = true;
                    }
                }
            }
        }
    };

    self.nextMenu = function () { return ""; };
    self.clickEvent = function () {
        var primaryClickEvent = "_nex.ordering.updateQuantityButton('" + self.menuItem[self.name].posid + "','" + self.priceLevel() + "','" + self.buttonName + "', event);";
        if (self.isDown ||
           (!self.isDown && self.quantityLimitReached)) {
            primaryClickEvent = "void(0);";
        } else {
            primaryClickEvent += "_nex.assets.soundManager.playButtonHit();_nex.ordering.trackClick('" + self.buttonName + "','" + htmlEscape(self.buttonText()) + "');";
        }

        return primaryClickEvent;
    };

    // click method puts the button in the down state
    self.click = function (posid) {
        self.isDown = true;
        self.quantity = 1;
        self.state();
    };

    self.subButtonState = function (name, delta) {
        var subButton = self.html.find("#" + name);
        if (subButton !== undefined) {

            var visibility = "visible";
            var clickEvent = "void(0);";

            if (((name == "plusButton") && (self.quantityLimitReached)) ||
                (!self.isDown)) {
                visibility = "hidden";
            }

            if ((self.isDown) && (visibility === "visible")) {
                clickEvent = "_nex.ordering.changeQuantity('" + self.item.posid + "','" + self.buttonName + "'," + delta + ", event);";
            }

            clickEvent += "_nex.assets.soundManager.playButtonHit();_nex.ordering.trackClick('" + self.buttonName + "','" + htmlEscape(self.buttonText()) + "');";

            subButton.attr("onclick", clickEvent);

            subButton.css("visibility", visibility);
        }
    };

    //// show/hide the quantity sub buttons
    self.state = function () {

        // determine if the quantity limit as been reached
        self.quantityLimitReached = false;
        var maxQuantity = _nex.assets.theme.quantityLimit;
        if (_nex.ordering.currentMenu.hasOwnProperty("incquantity") &&
            (_nex.ordering.currentMenu.incquantity.length > 0) &&
            !isNaN(_nex.ordering.currentMenu.incquantity)) {
            maxQuantity = Number(_nex.ordering.currentMenu.incquantity);
        }
         
        if (_nex.ordering.currentMenu.alcohol.toLowerCase() === "true") {
            maxQuantity = _nex.assets.theme.alcoholLimit;
        }

        if (self.item.DETAIL.itemtype.toLowerCase() === "modifier") {
            // check the flavor count of the current item
            var currentItem = _nex.ordering.currentItem();
            console.log("selectonequantity - max quant: " + maxQuantity.toString());
            if ((currentItem !== null) &&
                currentItem.hasOwnProperty("flavorcount")) {
                self.quantityLimitReached = (currentItem.flavorcount >= maxQuantity);
            }
        } else { // item
            self.quantityLimitReached = (self.quantity >= maxQuantity);
        }

        self.refreshSubButtons();
    };

    self.refreshSubButtons = function () {

        var subButtonVisibilty = "hidden";

        if (self.isDown) {
            self.html.addClass("button-down-state");

            subButtonVisibilty = "visible";
            self.subButtonState("minusButton", -1);
            self.subButtonState("plusButton", 1);

            // update the quantity text 
            var quantityText = self.html.find("#txtQuantity");
            if (quantityText.length > 0) {
                quantityText.empty();
                quantityText.append(self.quantity.toString());
            }

            self.html.data("state", "down");
        } else {
            self.html.removeClass("button-down-state");
            self.subButtonState("minusButton", 0);
            self.subButtonState("plusButton", 0);
            self.html.data("state", "up");
        }

        // update the onclick of the button
        var next = self.html.find('#nextmenu');
        next.attr("onclick", self.clickEvent());

        // update visibility  of the sub buttons
        var subButtons = self.html.find("#subButtons");
        if (subButtons !== undefined) {
            subButtons.css("visibility", subButtonVisibilty);
        }

        console.log("select one quantity - quantity limit reached: " + self.quantityLimitReached.toString())
        if (self.quantityLimitReached &&
            !self.isDown) {
            self.html.addClass("disabled");
        } else {
            self.html.removeClass("disabled");
        }
    };


    self.modifierPressed = function (delta) {

        // update the quantity
        if (self.quantity > 0) {
            // subtract the current quantity then set the new quantity
            var itemIndex = _nex.ordering.currentItemIndex();
            if (itemIndex > -1) {
                _nex.ordering.updateModifierQuantity(itemIndex, delta, self.menuItem[self.name].posid);
            }
            else {
                // show an error or handle gracefully when no items are on the order (?)
            }
        }
        else {
            // remove the item from the order
            _nex.ordering.addToOrder(self.menuItem[self.name].posid);
        }
    };

    self.itemPressed = function (delta, itemIndex) {
        _nex.ordering.updateItemQuantity(itemIndex, delta, true);
    };

    //// update is called to update the sub buttons or to put the button in the up state
    self.update = function (delta, itemIndex) {

        // determine the state of the button
        self.quantity += delta;
        self.isDown = (self.quantity > 0);
        if (self.item.DETAIL.itemtype.toLowerCase() == "modifier") {
            self.modifierPressed(delta);
        }
        else {
            self.itemPressed(delta, itemIndex);
        }
        
        // update the state of the button
        self.state();
    };
};
_nex.assets.buttons.SelectOneQuantity.prototype = Object.create(_nex.assets.buttons.SelectOne.prototype);
// select other button
_nex.assets.buttons.SelectOther = function () {

    _nex.assets.buttons._BaseButton.call(this);

    var self = this;
    self.selected = false;
    self.itemIndex = 0;
    self.ignoreOrderUpdates = false;

    self.name = "SELECTOTHER";
    self.buttonText = function () {
        return itemFormatting.buttonText(self.menuItem.SELECTOTHER.BUTTONTEXT[0].buttontext);
    };
    self.image = function () {
        return itemFormatting.buttonImage(self.menuItem.SELECTOTHER.image);
    };
    self.itemsEnabled = function () {
        var display = false;

        for (var i = 0; ((i < self.menuItem.SELECTOTHER.SELECTITEM.length) && (!display)) ; i++) {
            var selectItem = _nex.assets.theme.itemByPosid(self.menuItem.SELECTOTHER.SELECTITEM[i].posid);
            if (selectItem !== null) {
                var detail = selectItem.DETAIL;

                // item enabled
                display = (selectItem.enabled.toString().toLowerCase() === "true");

                // check if the item is alcohol and if the alcohol is being display
                if ((display) && (detail.alcoholflag.toString().toLowerCase() === "true")) {
                    if (_nex.context === "UX") {
                        display = _nex.orderManager.currentOrder.alcoholEnabled;
                    } else {
                        display = _iorderfast.ordering.alcoholEnabled;
                    }
                }
            }
        }

        return display;
    };
    self.clickEvent = function () {
        var result = "_nex.ordering.selectOtherPressed('" + self.buttonName + "');";
        return result;
    };
    self.state = function () {

        var checkMark;

        if (self.selected) {
            self.html.addClass("button-down-state");

            checkMark = self.html.find('#check');
            if (checkMark !== undefined) {
                checkMark.removeClass("button-many-unselected");
                checkMark.addClass("button-many-selected");
            }
            self.html.data("state", "down");
        } else {
            self.html.removeClass("button-down-state");

            checkMark = self.html.find('#check');
            if (checkMark !== undefined) {
                checkMark.removeClass("button-many-selected");
                checkMark.addClass("button-many-unselected");
            }

            self.html.data("state", "up");
        }
    };
    self.click = function () {

        self.selected = !self.selected;

        // update the buttons when the posid of the button is on the order
        self.ignoreOrderUpdates = true;
        self.itemIndex = 0;
        self.state();
        self.updateButtons(self.itemIndex);
    };

    self.updateButtons = function (index) {

        var self = this;

        var nextItemCallback = function () {
            self.itemIndex++;
            self.updateButtons(self.itemIndex);
        };

        if ((index !== undefined) &&
            (index < self.menuItem.SELECTOTHER.SELECTITEM.length)) {

            var onMenu = false;
            var posid = self.menuItem.SELECTOTHER.SELECTITEM[index].posid;

            for (var i = 0; i < _nex.ordering.buttons.length && !onMenu; i++) {

                onMenu = _nex.ordering.buttons[i].hasPosid(posid);

                if (onMenu) {
                    var isModSelected = _nex.ordering.isOnCurrentItem(posid);

                    if ((isModSelected && !self.selected) ||
                        (!isModSelected && self.selected)) {

                        _nex.ordering.buttons[i].autoClick(posid, nextItemCallback);
                    } else {
                        // reset the onMenu to false since the mod is already on the order
                        onMenu = false;
                    }
                }
            }

            if (!onMenu) {
                nextItemCallback();
            }

        } else {
            self.ignoreOrderUpdates = false;
        }
    };
    self.orderUpdated = function () {

        if (!self.ignoreOrderUpdates) {
            // if all the items are on the order then the button is on otherwise the button is off
            var found = true;
            for (var i = 0; i < self.menuItem.SELECTOTHER.SELECTITEM.length && found; i++) {
                var posid = self.menuItem.SELECTOTHER.SELECTITEM[i].posid;
                found = _nex.ordering.isOnCurrentItem(posid);

                // if the modifier is not on the current item then look to see if like modifiers of a multi select button are 
                // on the order. Ex. If Tomato is assigned to the SELECTOTHER button but is not on the order then look to 
                // see if the Tomato is assign to a button like LessMore. If it is assigned to a LessMore then look to see if 
                // Less Tomato or More Tomato is on the order. 
                if (!found) {
                    for (var j = 0; j < Number(_nex.ordering.buttons.length) && !found; j++) {
                        var button = _nex.ordering.buttons[j];
                        if (button.hasPosid(posid)) {
                            found = _nex.ordering.isOnCurrentItem(button.getProperty("posid1", ""));
                            if (!found) found = _nex.ordering.isOnCurrentItem(button.getProperty("posid2", ""));
                            if (!found) found = _nex.ordering.isOnCurrentItem(button.getProperty("posid3", ""));
                        }
                    }
                }
            }

            if (!found && self.selected) {
                self.selected = false;
            }
            else if (found && !self.selected) {
                self.selected = true;
            }

            self.state();
        }
    };
};
_nex.assets.buttons.SelectOther.prototype = Object.create(_nex.assets.buttons._BaseButton);
/** 
 * Parent object to all the commands. Implements msgHeader.
 * @constructor 
 */
_nex.commands._BaseRequest = function () {

    var self = this;
    self.name = "";
    self.msgHeader = function () {
        var header = {};

        if (_nex.context !== 'UX') {
            header.authcode = _iorderfast.authToken.code;
        }

        header.name = this.name;

        if (_nex.context !== 'UX') {
            header.locationid = _iorderfast.loc.id;
        }

        header[this.name] = {};

        return header;
    };

    self.write = function () { };
};

_nex.commands.AddToOrder = function (id, priceLevel, quant, menuId, menuStackIndex, upsell, pricedBy, buttonInfo, isScanned, price) {

    _nex.commands._BaseRequest.call(this);
    var self = this;

    self.posid = id;
    self.pricelevel = priceLevel;
    self.quantity = quant;
    self.menuid = menuId;
    self.menuStackIndex = menuStackIndex;
    self.upsell = upsell;
    self.pricedBy = pricedBy;
    self.buttonInfo = (buttonInfo !== undefined) ? buttonInfo : {};
    self.isscanned = isScanned;
    self.price = price;

    self.name = "ADDTOORDER";

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "posid": self.posid,
            "pricelevel": self.pricelevel,
            "quantity": self.quantity.toString(),
            "menuid": self.menuid.toString(),
            "menustackindex": self.menuStackIndex.toString(),
            "upsell": self.upsell,
            "pricedby": self.pricedBy,
            "isscanned": self.isscanned,
            "price": self.price,
            "BUTTONINFO": self.buttonInfo
        };
        console.log(msg);
        return msg;
    };
};
_nex.commands.AddToOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype);

//function addToOrderCmd(id, priceLevel, quant, menuId, menuStackIndex, upsell, pricedBy, buttonInfo) {
//    this.posid = id;
//    this.pricelevel = priceLevel;
//    this.quantity = quant;
//    this.menuid = menuId;
//    this.menuStackIndex = menuStackIndex;
//    this.upsell = upsell;
//    this.pricedBy = pricedBy;
//    this.buttonInfo = (buttonInfo !== undefined) ? buttonInfo : {};
//}
//addToOrderCmd.prototype = new baseCmd();
//addToOrderCmd.prototype.name = 'ADDTOORDER';
//addToOrderCmd.prototype.write = function () {
//    var msg = this.msgHeader();
//    msg[this.name] = {
//        "posid": this.posid,
//        "pricelevel": this.pricelevel,
//        "quantity": this.quantity.toString(),
//        "menuid": this.menuid.toString(),
//        "menustackindex": this.menuStackIndex.toString(),
//        "upsell": this.upsell,
//        "pricedby": this.pricedBy,
//        "BUTTONINFO": this.buttonInfo
//    };
//    return msg;
//};
/** 
 * Calculates all the totals (taxes, fees, sub-totals, grand-totals).
 * @constructor 
 */
_nex.commands.CalculateTotal = function (order) {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = 'CALCULATETOTAL';

    if (order) {
        self.subtotal = order.totals.subtotal().replace("$", "");
        self.togo = order.togo.toString();
        self.roundUpCharitySelected = order.roundUpCharitySelected.toString();
    }

    self.write = function () {
        var msg = self.msgHeader();

        if (_nex.context === "UX") {
            msg[self.name] = {
                "togo": self.togo,
                "subtotal": self.subtotal,
                "roundupcharityselected": self.roundUpCharitySelected,
                "sendtoserver": "true"
            };
        } else {
            msg[self.name] = { "roundupcharityselected": _nex.ordering.roundupcharityselected };
        }

        return msg;
    };
};
_nex.commands.CalculateTotal.prototype = Object.create(_nex.commands._BaseRequest.prototype);
/** 
 * Cancels the order. 
 * @constructor 
 */
_nex.commands.CancelOrder = function () {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "CANCELORDER";
    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "cancel": "true"
        };
        return msg;
    };
};
_nex.commands.CancelOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype);
/** 
 * Consolidate items that are the same just before order review. 
 * @constructor 
 */
_nex.commands.ConsolidateOrder = function () {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "CONSOLIDATEORDER";
    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {};
        return msg;
    };
};
_nex.commands.ConsolidateOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype);





_nex.commands.LoadOrder = function (order) {
    _nex.commands._BaseRequest.call(this);
    var self = this;

    if (order) {
        self.order = order;
    }
    self.name = "LOADORDER";
    self.write = function () {
        var msg = self.msgHeader();

        // The items should still be on this property from the previous order element.
        var items;
        if (_nex.context === "UX") {
            items = self.order.ORDER.ITEM;
        } else {
            items = self.order.ITEM;
        }
        
        msg[self.name] = {
            "orderid": order.orderid,
            "date": order.date,
            "orderintid": order.orderintid,
            "ordernumber": order.ordernumber,
            "time": order.time,
            "previousorderid": order.previousorderid,
            "ITEM": items
        };
        
        return msg;
    };
};
_nex.commands.LoadOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype);
_nex.commands.LoyaltyInquiry = function (cardnumber, userdata, cardtype, track1, track2, preauthandpay) {
    // Constructor logic.
    var self = this;

    _nex.commands._BaseRequest.call(self);

    self._cardnumber = "";
    self._userdata = "";
    self._cardtype = "LOYALTY";
    self._track1 = "";
    self._track2 = "";
    self._preauthandpay = "false";

    // Convert the boolean to a string.
    if (preauthandpay) {
        self._preauthandpay = "true";
    }

    if (cardnumber) {
        self._cardnumber = cardnumber;
    }

    if (userdata) {
        self._userdata = userdata;
    }

    if (track1) {
        self._track1 = track1;
    }

    if (track2) {
        self._track2 = track2;
    }

    if(cardtype) {
        self._cardtype = cardtype;
    }

    self.name = "LOYALTYINQUIRY";

    // Write method.
    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "cardnumber": self._cardnumber,
            "userdata": self._userdata,
            "cardtype": self._cardtype,
            "track1": self._track1,
            "track2": self._track2,
            "preauthandpay": self._preauthandpay
        };
        return msg;
    };
};
_nex.commands.LoyaltyInquiry.prototype = Object.create(_nex.commands._BaseRequest.prototype);

/**
 * Send a message to the ordering service that the menu stack is being reset.
 * This is done to reset things like combos.
 * @constructor
 */
_nex.commands.MenuStackReset = function () {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = 'MENUSTACKRESET';
    self.write = function () {
        var msg = this.msgHeader();
        msg[this.name] = {};
        return msg;
    };
};
_nex.commands.MenuStackReset.prototype = Object.create(_nex.commands._BaseRequest.prototype);
/**
 * Removes a list of items from the order.
 * @constructor
 */
_nex.commands.RemoveFromOrder = function (ids) {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = 'REMOVEFROMORDER';
    self.posids = [];
    for (var i = 0; i < ids.length; i++) {
        self.posids.push({ "id": ids[i] });
    }

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "POSIDS": self.posids
        };
        return msg;
    };
};
_nex.commands.RemoveFromOrder.prototype = Object.create(_nex.commands._BaseRequest.prototype);
/**
 * For iOrderFast RemoveTender removes a specified tender from the order. 
 * For UX, it removes the most recent tender, and the tenderId is optional.
 * @constructor
 */
_nex.commands.RemoveTender = function (tenderId) {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.name = "REMOVETENDER";

    self.tenderId = "";
    if (tenderId) {
        self.tenderId = tenderId;
    }

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "tenderid": self.tenderId
        };
        return msg;
    };
};
_nex.commands.RemoveTender.prototype = Object.create(_nex.commands._BaseRequest.prototype);

/**
 * Used to lookup all the previous orders for the user. 
 * @constructor
 * @param data - For UX, the data has either the phone number entered or card swipe data (not needed for NEXTEP Mobile).
 */
_nex.commands.RequestPreviousOrders = function (data) {
    _nex.commands._BaseRequest.call(this);
    var self = this;
    self.name = 'REQUESTPREVIOUSORDERS';

    self.data = "";
    if (data) {
        self.data = data;
    }

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "cardnumber": self.data, // send the card data (which isn't sensitive credit card data, it's a phone number, or pieces of the user info concatenated) for UX
            "locationid": _nex.assets.theme.system.storeid // send the 8 character location id for this command (for UX)
        };
        return msg;
    };
};
_nex.commands.RequestPreviousOrders.prototype = Object.create(_nex.commands._BaseRequest.prototype);

/**
 * Used by the less-normal-more buttons.
 * @constructor
 */
_nex.commands.SubstituteModifier = function (posid, priceLevel, removePosid, removePriceLevel, quantity, menuid, menustackindex, upsell, pricedby, buttonIndex, buttonInfo, menu, template) {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.posid = posid || "";
    self.priceLevel = priceLevel || "";
    self.removePosid = removePosid || "";
    self.removePriceLevel = removePriceLevel || "";
    self.quantity = quantity || 1;
    self.menuid = menuid || "";
    self.menuStackIndex = menustackindex || "";
    self.upsell = upsell || "false";
    self.pricedBy = pricedby || "";
    self.buttonIndex = buttonIndex;
    self.buttonInfo = buttonInfo || "";
    self.menu = menu || null;
    self.template = template || null;

    self.name = 'SUBSTITUTEMODIFIER';

    self.write = function () {
        var msg = self.msgHeader();
        msg[self.name] = {
            "posid": self.posid,
            "pricelevel": self.priceLevel,
            "removeposid": self.removePosid,
            "removepricelevel": self.removePriceLevel,
            "quantity": self.quantity.toString(),
            "menuid": self.menuid.toString(),
            "menustackindex": self.menuStackIndex.toString(),
            "upsell": self.upsell,
            "pricedby": self.pricedBy,
            "buttonindex": self.buttonIndex,
            "BUTTONINFO": self.buttonInfo
        };

        if (self.menu !== null) {
            msg[self.name].MENU = self.menu;
            msg[self.name].TEMPLATE = self.template;
        }

        return msg;
    };
};
_nex.commands.SubstituteModifier.prototype = Object.create(_nex.commands._BaseRequest.prototype);

/** 
 * Update the special instructions / comment on an individual item.
 * @constructor 
 */
_nex.commands.UpdateComment = function (index, comment) {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.itemIndex = index.toString();
    self.comment = comment;
    self.name = 'UPDATECOMMENT';
    self.write = function () {
        var msg = this.msgHeader();
        msg[this.name] = {
            "index": self.itemIndex,
            "comment": self.comment
        };
        return msg;
    };
};
_nex.commands.UpdateComment.prototype = Object.create(_nex.commands._BaseRequest.prototype);
/** 
 * Update the quantity of an individual item.
 * @constructor 
 * @param menu - for NEXTEP Mobile
 * @param template - for NEXTEP Mobile
 */
_nex.commands.UpdateQuantity = function (index, delta, isModifier, modPosid, menu, template) {
    _nex.commands._BaseRequest.call(this);

    var self = this;
    self.itemIndex = index.toString();
    self.delta = delta.toString();
    self.isModifier = (isModifier === undefined) ? false : isModifier;
    self.modPosid = modPosid;
    self.menu = menu || null;
    self.template = template || null;

    self.name = 'UPDATEQUANTITY';
    self.write = function () {
        var msg = this.msgHeader();
        msg[self.name] = {
            "index": this.itemIndex,
            "delta": this.delta
        };

        if (this.isModifier) {
            msg[self.name].ismodifier = "true";
            msg[self.name].modposid = self.modPosid;
        }

        // For NEXTEP Mobile
        if (self.menu !== null) {
            msg[self.name].MENU = self.menu;
        }
        if (self.template !== null) {
            msg[self.name].TEMPLATE = self.template;
        }

        return msg;
    };
};
_nex.commands.UpdateQuantity.prototype = Object.create(_nex.commands._BaseRequest.prototype);