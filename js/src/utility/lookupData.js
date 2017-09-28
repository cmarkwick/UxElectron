function LookupData(type, value, xml) {

    var self = this;

    self.lookupType = type || _nex.types.lookup.CANCEL;
    self.lookupValue = value || "";
    self.lookupXML = xml || null;
}