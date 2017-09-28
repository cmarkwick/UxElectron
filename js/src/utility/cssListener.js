function CssListener(paramObj) {
    var self = this;

    self.listener = paramObj.listener;

    self.init = function () {

        // watch for css to be updated
        var cssCount = 0;
        $("link").each(function () {
            var id = $(this).attr('id');
            var href = $(this).attr('href');

            if (id === undefined) {
                id = 'css' + cssCount;
                $(this).attr('id', id);
            }
            self.watch(id, href);
            cssCount++;
        });
    };

    self.watch = function (id, href) {
        if (self.listener !== null) {
            self.listener.watch(id, href);
        }
    };

    self.refresh = function (id) {

        var link = $('#' + id);
        if (link.length > 0) {
            var href = link.attr("href");
            var randomIndex = href.indexOf("?x=");
            if (randomIndex >= 0) {
                href = href.substring(0, randomIndex);
            }
            link.attr("href", href + '?x=' + Math.random());
        }
    };
}