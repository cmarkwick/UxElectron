// buttonFactory.js
function ButtonFactory () {
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
        
        switch (menuItem.buttontype){
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
}
