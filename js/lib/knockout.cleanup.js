// accepts jQuery node and remove boolean
ko.unapplyBindings = function ($node, clean) {
    console.log('ko.unapplyBindings');
    // unbind events
    $node.find("*").each(function () {
        $(this).unbind();
    });

    // Remove KO subscriptions and references
    if (clean) {
        ko.cleanNode($node[0]);        
    } else {
        ko.removeNode($node[0]);
    }
};