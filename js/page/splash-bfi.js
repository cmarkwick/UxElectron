// Introduce new global variable splashglobal just for this file.
var splashglobal = {};

// Add the animation piece to the global namespace.
splashglobal.animation = {
    // lib, images, createjs, ss are from the exported flash.
    lib: {},
    images: {},
    ss: {},
    // args has been added to make it easy for us to override values in the flash.
    args: {
        copyright: copyrightNotice(),
        message1: "TOUCH THE SCREEN TO ORDER!",
        message2: "PAY WITH YOUR CREDIT CARD...",
        message3: "WAIT FOR YOUR PAGER TO BUZZ",
        //message4: "Scan an Item or Touch the Screen to Begin",
        backgroundId: "Bitmap2",
        background: _nex.assets.theme.mediaPath() + "images/Burger Background.png",
        color: "#000000",
        fps: 24,
        width: 1280,
        height: 720
    }
};
console.debug(_nex.assets.theme.mediaPath());

splashglobal.elements = {
    canvasElementId: "canvas",
    btnFirstTimeId: "btnFirst", // There are two buttons... One for the first time, and one for returning guest.
    btnReturningGuestId: "btnReturning"
};

// This closure is exported from the flash. The only new variable is parameters.
(function (lib, img, cjs, ss, args) {
    // library properties:
    lib.properties = {
        width: args.width,
        height: args.height,
        fps: args.fps,
        color: args.color,
        manifest: [
			{ src: args.background, id: args.backgroundId }
        ]
    };
    var p; // shortcut to reference prototypes


    // symbols:



    (lib.Bitmap2 = function () {
        this.initialize(img.Bitmap2);
    }).prototype = p = new cjs.Bitmap();
    p.nominalBounds = new cjs.Rectangle(0, 0, 1127, 298);


    (lib.yesnohitarea = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, {});

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.f("rgba(0,255,0,0)").s().p("A59HJQgqAAgdgUQgdgSAAgcIAAsOQAAgbAdgTQAdgTAqAAMAz7AAAQAqAAAdATQAdATAAAbIAAMOQAAAbgdATQgfAUgoAAg");
        this.shape.setTransform(100, 25, 0.567, 0.546);

        this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(0, 0, 200, 50);


    (lib.Symbol1 = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, {});

        // Layer 1
        this.instance = new lib.Bitmap2();
        this.instance.setTransform(0, 0, 1.136, 1.136);

        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(0, 0, 1279.9, 338.5);


    (lib.SplashElements = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, {});

        // Layer 1
        this.txtHeader = new cjs.Text("PLEASE TOUCH THE SCREEN TO BEGIN", "40px 'Brandon Grotesque Bold'");
        this.txtHeader.name = "txtHeader";
        this.txtHeader.textAlign = "center";
        this.txtHeader.lineHeight = 56;
        this.txtHeader.lineWidth = 948;
        this.txtHeader.setTransform(480.4, -3.9);

        this.timeline.addTween(cjs.Tween.get(this.txtHeader).wait(1));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(6.5, -3.9, 952, 61.2);


    (lib.number1_ring = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, {});

        // number
        this.txtSequence = new cjs.Text("2", "230px 'Mostra Nuova Regular'");
        this.txtSequence.name = "txtSequence";
        this.txtSequence.textAlign = "center";
        this.txtSequence.lineHeight = 230;
        this.txtSequence.lineWidth = 233;
        this.txtSequence.setTransform(-10.5, -113.9);

        this.timeline.addTween(cjs.Tween.get(this.txtSequence).wait(1));

        // Layer 4
        this.shape = new cjs.Shape();
        this.shape.graphics.f().s("#000000").ss(10, 1, 1).p("ATiAAQAAIFlvFuQluFuoFAAQoEAAlvluQluluAAoFQAAoEFuluQFvluIEAAQIFAAFuFuQFvFuAAIEg");
        this.shape.setTransform(-5.7, -0.4);

        this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(-135.7, -130.4, 260, 260);


    (lib.logo = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, {});

        // Layer 2
        this.shape = new cjs.Shape();
        this.shape.graphics.f("#010101").s().p("AgTAUQgJgIAAgMQAAgLAJgIQAIgJALAAQALAAAKAJQAIAIAAALQAAAMgIAIQgKAJgLAAQgLAAgIgJgAgPgPQgHAHAAAIQAAAJAHAHQAHAHAIAAQAJAAAHgHQAHgHAAgJQAAgIgHgHQgHgHgJAAQgIAAgHAHgAAGAOIgCgBIgEgKIgDAAIAAAKQAAAAAAAAQAAABAAAAQgBAAAAAAQAAAAAAAAIgEAAQAAAAAAAAQAAAAgBAAQAAAAAAgBQAAAAAAAAIAAgZQAAgBAAAAQAAAAAAAAQABgBAAAAQAAAAAAAAIALAAQAJAAABAKQgBAGgGABIAFAJQAAABAAAAQAAAAAAABQAAAAAAAAQgBAAgBAAgAgDAAIAFAAQAEAAAAgEQAAgEgEAAIgFAAg");
        this.shape.setTransform(1206.4, 130.7, 2.772, 2.772);

        this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

        // Layer 1
        this.shape_1 = new cjs.Shape();
        this.shape_1.graphics.f("#8CC03F").s().p("AB8DtIhhisIigAAIAACsIhcAAIAAnZIEZAAQBOAAArAoQArAnAABIQAAA+gnAnQgZAbgkAOIBqC0gAiFgJICUAAQAzABAZgNQAjgSAAguQABgjgTgSQgPgQgfgEQgQgDgfgBIiUAAg");
        this.shape_1.setTransform(959, 79.2, 2.439, 2.439);

        this.shape_2 = new cjs.Shape();
        this.shape_2.graphics.f("#8CC03F").s().p("AjUDtIAAnZIGpAAIAABLIlMAAIAAB9IDkAAIAABHIjkAAIAACAIFMAAIAABKg");
        this.shape_2.setTransform(828.5, 79.2, 2.439, 2.439);

        this.shape_3 = new cjs.Shape();
        this.shape_3.graphics.f("#8CC03F").s().p("AB8DtIhhisIigAAIAACsIhcAAIAAnZIEZAAQBNAAAsAoQArAnAABIQAAA+gnAnQgZAbgkAOIBqC0gAiFgJICVAAQAzAAAZgNQAhgRABguQABgjgTgSQgPgQgfgEQgQgDgfgBIiUAAg");
        this.shape_3.setTransform(554, 79.2, 2.439, 2.439);

        this.shape_4 = new cjs.Shape();
        this.shape_4.graphics.f("#8CC03F").s().p("AjvDsIAAnXIEyAAIAZACQAdAEAYAKQBNAfAABJQABA/gzAlQAeASASAdQAcArgLA1QgRBDhNAbQgYAJgcADIgYACgAiTCjIDNAAIAsgJQApgRAAgrQAAgqgpgRQgOgGgQgCIgOgBIjNAAgAiTgvIDBAAIAZgDQAcgGAOgOQANgNAAgVQgBgWgOgNQgNgMgXgGQgPgEgMAAIjDAAg");
        this.shape_4.setTransform(287.1, 79.1, 2.439, 2.439);

        this.shape_5 = new cjs.Shape();
        this.shape_5.graphics.f("#8CC03F").s().p("AAGD4QiCgChHhLQghgigQgtQgQguABgyQAAhNAzhDQBAhSBxgOQBogNBjAkQAyASAfAWIAHAGIg0BFIgHgGQgYgTgogQQhQghhOAOQgiAGgjAYQhFAvgDBWQgDAtAcAvQAnBCBQALQA+AJA+gMQAlgIAcgNIAAhMIiXAAIAAhIIDuAAIAADEIgEADQgYAPgpANQhQAbheAAg");
        this.shape_5.setTransform(690.7, 79.2, 2.439, 2.439);

        this.shape_6 = new cjs.Shape();
        this.shape_6.graphics.f("#8CC03F").s().p("AAADyQiQAAgyhDQgcglAAhRIAAkqIBcAAIAAEqQAAAxARAUQAcAkBVAAIAAAAQBRAAAegeQAOgOAFgWQACgNAAgaIAAkqIBbAAIAAEqQAAAygFAaQgJAlgXAXQgZAZgtAMQguAMhFAAg");
        this.shape_6.setTransform(420.7, 80.8, 2.439, 2.439);

        this.shape_7 = new cjs.Shape();
        this.shape_7.graphics.f("#010101").s().p("AgtDtIAAnZIBbAAIAAHZg");
        this.shape_7.setTransform(1176.1, 79.2, 2.439, 2.439);

        this.shape_8 = new cjs.Shape();
        this.shape_8.graphics.f("#010101").s().p("AjUDtIAAnZIGpAAIAABLIlMAAIAAB9IDkAAIAABHIjkAAIAADKg");
        this.shape_8.setTransform(1091.3, 79.2, 2.439, 2.439);

        this.shape_9 = new cjs.Shape();
        this.shape_9.graphics.f("#8CC03F").s().p("AAABmIh5BSIAsiKIh3hYICVgBIAviMIAwCMICWABIh4BYIAsCKg");
        this.shape_9.setTransform(95, 64.5, 2.439, 2.439);

        this.shape_10 = new cjs.Shape();
        this.shape_10.graphics.f("#010101").s().p("AgcAiQgFgjgQggIBjAAIAABDg");
        this.shape_10.setTransform(157.7, 53.4, 2.439, 2.439);

        this.shape_11 = new cjs.Shape();
        this.shape_11.graphics.f("#010101").s().p("AgxAiIAAhDIBjAAQgQAggFAjg");
        this.shape_11.setTransform(32.2, 53.4, 2.439, 2.439);

        this.shape_12 = new cjs.Shape();
        this.shape_12.graphics.f("#010101").s().p("AgeBEIAAgxQg1gWgcg0QgCgGAEgEQAEgEAFADQAhAUAlAKQAfAJAkAAIASgBQAJAdAQAbQAPAYARAQg");
        this.shape_12.setTransform(27.5, 92.1, 2.439, 2.439);

        this.shape_13 = new cjs.Shape();
        this.shape_13.graphics.f("#010101").s().p("ADDBRQgfgxgzgeQg1gcg8AAQg8AAg0AcQgzAegfAxIhwAAQAAhDBTgvQBSgvB1gBIAyAAQB1ABBSAvQBSAvAABDg");
        this.shape_13.setTransform(95, 20, 2.439, 2.439);

        this.shape_14 = new cjs.Shape();
        this.shape_14.graphics.f("#010101").s().p("AkVAwQgMAAgIgJQgJgJAAgMIAAhAICnAAQA+AuBNAAQBOAAA+guICnAAIAABAQAAAMgJAJQgIAJgMAAg");
        this.shape_14.setTransform(95, 125.6, 2.439, 2.439);

        this.shape_15 = new cjs.Shape();
        this.shape_15.graphics.f("#010101").s().p("AhvBLQAlglARgwQAHgVADgWIACgUIAKgBQAtAAApAaQAnAYAWAnQACAGgEADQgEAEgFgDQghgTglgIIAABNg");
        this.shape_15.setTransform(162.4, 90.5, 2.439, 2.439);

        this.timeline.addTween(cjs.Tween.get({}).to({ state: [{ t: this.shape_15 }, { t: this.shape_14 }, { t: this.shape_13 }, { t: this.shape_12 }, { t: this.shape_11 }, { t: this.shape_10 }, { t: this.shape_9 }, { t: this.shape_8 }, { t: this.shape_7 }, { t: this.shape_6 }, { t: this.shape_5 }, { t: this.shape_4 }, { t: this.shape_3 }, { t: this.shape_2 }, { t: this.shape_1 }] }).wait(1));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(0, 0, 1214.6, 139.9);


    (lib.defaultLanguage = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, {});

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.f("#33FF00").s().p("EhQHA8JMAAAh4UMCgPAAAMAAAB4Xg");
        this.shape.setTransform(512.9, 385.2);

        this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(0, 0, 1025.8, 770.5);


    (lib._1touchcopy = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, {});

        // Layer 1
        this.txtMessage = new cjs.Text("TOUCH THE SCREEN TO ORDER", "54px 'Brandon Grotesque Bold'");
        this.txtMessage.name = "txtMessage";
        this.txtMessage.textAlign = "center";
        this.txtMessage.lineHeight = 77;
        this.txtMessage.lineWidth = 1154;
        this.txtMessage.setTransform(326.1, 24.3, 1.299, 1.299);

        this.timeline.addTween(cjs.Tween.get(this.txtMessage).wait(1));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(-423, 24.3, 1503.5, 105.5);


    (lib.instructionloop = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, { beginLoop: 0, endLoop: 69 });

        // numbers
        this.Sequence = new lib.number1_ring();
        this.Sequence.setTransform(570, -548, 0.169, 0.171, 0, 0, 0, 4.2, -11.4);
        this.Sequence.alpha = 0;

        this.timeline.addTween(cjs.Tween.get(this.Sequence).wait(1).to({ regX: -5.7, regY: -0.4, x: 568.3, y: -546, alpha: 1.0 }, 0).wait(1).to({ alpha: 1.0 }, 0).wait(1).to({ alpha: 1.0 }, 0).wait(1).to({ alpha: 1.0 }, 0).wait(1).to({ alpha: 1.0 }, 0).wait(1).to({ alpha: 1.0 }, 0).wait(1).to({ alpha: 1 }, 0).wait(55).to({ alpha: 1.0 }, 0).wait(1).to({ alpha: 1.0 }, 0).wait(1).to({ alpha: 1.0 }, 0).wait(1).to({ alpha: 1.0 }, 0).wait(1).to({ alpha: 1.0 }, 0).wait(1).to({ alpha: 1.0 }, 0).wait(1).to({ alpha: 1.0 }, 0).wait(1).to({ alpha: 1 }, 0).wait(1));

        // text
        this.Message = new lib._1touchcopy();
        this.Message.setTransform(0, -219.6, 1, 1, 0, 0, 0, 0, 14.4);

        // CHANGED
        //this.timeline.addTween(cjs.Tween.get(this.Message).wait(1)
        //    .to({ regX: 328.7, regY: 77, x: 328.7, y: -157 }, 0).wait(61)
        //    .to({ alpha: 0.875 }, 0).wait(1)
        //    .to({ alpha: 0.75 }, 0).wait(1)
        //    .to({ alpha: 0.625 }, 0).wait(1)
        //    .to({ alpha: 0.5 }, 0).wait(1)
        //    .to({ alpha: 0.375 }, 0).wait(1)
        //    .to({ alpha: 0.25 }, 0).wait(1)
        //    .to({ alpha: 0.125 }, 0).wait(1)
        //    .to({ alpha: 0 }, 0).wait(1));

        // COPIED FROM MESSAGE 1
        var txt = new createjs.Text(args.message1, "54px brandon", "#000000");
        txt.name = "txtMessage";
        txt.textAlign = "center";
        txt.lineHeight = 77;
        txt.lineWidth = 1154;
        txt.setTransform(326.1, 24.3, 1.299, 1.299);
        //txt.setTransform(0, -219.6, 1, 1, 0, 0, 0, 0, 14.4);

        //txt.setTransform(0, 0, 1.299, 1.299); // This transform makes the text larger... but the position is ignored.
        //txt.setTransform(-200, -219.6, 1, 1, 0, 0, 0, 0, 14.4);

        // This tween chain is a simplified version of what was exported.
        var tweenChain = cjs.Tween.get(txt, { loop: false, ignoreGlobalPause: true })
			.to({ regX: -191 - 60, regY: 0, x: 0, y: -219.6 }, 0)
			.wait(61).to({ alpha: 0.0 }, 8)
			.to({ alpha: 1.0, text: args.message2 }, 0).wait(61).to({ alpha: 0.0 }, 8)
			.to({ alpha: 1.0, text: args.message3 }, 0).wait(61).to({ alpha: 0.0 }, 8);

        // Add the tween to the timeline
        this.timeline.addTween(tweenChain);

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(-423, -568.4, 1503.5, 464.2);


    (lib.greenbuttonback = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, { up: 0, down: 1 });

        // timeline functions:
        this.frame_0 = function () {
            stop();
        };

        this.frame_1 = function () {
            stop();
        };

        // actions tween:
        this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1).call(this.frame_1).wait(1));

        // hit area
        this.instance = new lib.yesnohitarea();
        this.instance.alpha = 0;
        new cjs.ButtonHelper(this.instance, 0, 1, 2);

        this.timeline.addTween(cjs.Tween.get(this.instance).wait(2));

        // text
        this.btext = new cjs.Text("YES", "18px 'Calibri'", "#FFFFFF");
        this.btext.name = "btext";
        this.btext.textAlign = "center";
        this.btext.lineHeight = 28;
        this.btext.lineWidth = 156;
        this.btext.setTransform(98, 12);

        this.timeline.addTween(cjs.Tween.get(this.btext).wait(2));

        // Layer 2
        this.shape = new cjs.Shape();
        this.shape.graphics.f().s("#000000").ss(2, 1, 1).p("Avnj5IfPAAIAAHzI/PAAg");
        this.shape.setTransform(100, 25);

        this.shape_1 = new cjs.Shape();
        this.shape_1.graphics.f("#000000").s().p("AvnD6IAAnzIfOAAIAAHzg");
        this.shape_1.setTransform(100, 25);

        this.timeline.addTween(cjs.Tween.get({}).to({ state: [{ t: this.shape_1 }, { t: this.shape }] }).wait(2));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(-1, -1, 202, 52);


    (lib.Animation = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, false, { splashState: 0, splashStartOrder: 8, splashOut: 9 });

        // timeline functions:
        this.frame_0 = function () {
            stop();
        };

        this.frame_8 = function () {
            stop();
        };

        this.frame_17 = function () {
            stop();
        };

        // actions tween:
        this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(8).call(this.frame_8).wait(9).call(this.frame_17).wait(1));

        // Layer 2
        this.instance = new lib.logo();
        this.instance.setTransform(123.2, -314.5, 1, 1, 0, 0, 0, 593.7, 70);

        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1)); //.to({ regX: 607.3, regY: 69.9, x: 136.8, y: -317.9, alpha: 1.0 }, 0).wait(1).to({ y: -321.1, alpha: 1.0 }, 0).wait(1).to({ y: -324.4, alpha: 0.625 }, 0).wait(1).to({ y: -327.6, alpha: 0.5 }, 0).wait(1).to({ y: -330.9, alpha: 0.375 }, 0).wait(1).to({ y: -334.1, alpha: 0.25 }, 0).wait(1).to({ y: -337.3, alpha: 0.125 }, 0).wait(1).to({ y: -340.6, alpha: 0 }, 0).wait(1).to({ y: -337.7, alpha: 0.111 }, 0).wait(1).to({ y: -334.8, alpha: 0.222 }, 0).wait(1).to({ y: -331.9, alpha: 0.333 }, 0).wait(1).to({ y: -329, alpha: 0.444 }, 0).wait(1).to({ y: -326.2, alpha: 0.556 }, 0).wait(1).to({ y: -323.3, alpha: 0.667 }, 0).wait(1).to({ y: -320.4, alpha: 0.778 }, 0).wait(1).to({ y: -317.5, alpha: 0.889 }, 0).wait(1).to({ y: -314.6, alpha: 1 }, 0).wait(1));

        // please touch text
        this.HeaderClip = new lib.SplashElements();
        this.HeaderClip.setTransform(-21.6, -460.9, 1, 1, 0, 0, 0, 318.6, 25.2);
        this.HeaderClip.cache(5, -6, 956, 65);

        this.timeline.addTween(cjs.Tween.get(this.HeaderClip).wait(18));

        // instructions
        this.InstClip = new lib.instructionloop();
        this.InstClip.setTransform(-137.9, 12.6, 0.85, 0.85);


        this.timeline.addTween(cjs.Tween.get(this.InstClip).wait(1).to({ regX: 328.7, regY: -336.3, x: 141.5, y: -273.2, alpha: 1.00 }, 0).wait(1));//.to({ alpha: 0.75 }, 0).wait(1).to({ alpha: 0.625 }, 0).wait(1).to({ alpha: 0.5 }, 0).wait(1).to({ alpha: 0.375 }, 0).wait(1).to({ alpha: 0.25 }, 0).wait(1).to({ alpha: 0.125 }, 0).wait(1).to({ alpha: 0 }, 0).wait(1).to({ alpha: 0.111 }, 0).wait(1).to({ alpha: 0.222 }, 0).wait(1).to({ alpha: 0.333 }, 0).wait(1).to({ alpha: 0.444 }, 0).wait(1).to({ alpha: 0.556 }, 0).wait(1).to({ alpha: 0.667 }, 0).wait(1).to({ alpha: 0.778 }, 0).wait(1).to({ alpha: 0.889 }, 0).wait(1).to({ alpha: 1 }, 0).wait(1));

        // logo
        this.instance_1 = new lib.Symbol1();
        this.instance_1.setTransform(142.6, 113, 1, 1, 0, 0, 0, 640, 169.2);

        this.timeline.addTween(cjs.Tween.get(this.instance_1).wait(1).to({ regX: 639.9, x: 142.5, y: 117.9, alpha: 1.0 }, 0).wait(1));//.to({ y: 122.7, alpha: 0.75 }, 0).wait(1).to({ y: 127.6, alpha: 0.625 }, 0).wait(1).to({ y: 132.5, alpha: 0.5 }, 0).wait(1).to({ y: 137.4, alpha: 0.375 }, 0).wait(1).to({ y: 142.2, alpha: 0.25 }, 0).wait(1).to({ y: 147.1, alpha: 0.125 }, 0).wait(1).to({ y: 152, alpha: 0 }, 0).wait(1).to({ y: 147.7, alpha: 0.111 }, 0).wait(1).to({ y: 143.3, alpha: 0.222 }, 0).wait(1).to({ y: 139, alpha: 0.333 }, 0).wait(1).to({ y: 134.7, alpha: 0.444 }, 0).wait(1).to({ y: 130.3, alpha: 0.556 }, 0).wait(1).to({ y: 126, alpha: 0.667 }, 0).wait(1).to({ y: 121.7, alpha: 0.778 }, 0).wait(1).to({ y: 117.3, alpha: 0.889 }, 0).wait(1).to({ y: 113, alpha: 1 }, 0).wait(1));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(-497.4, -490, 1279.9, 772.3);


    // stage content:



    (lib.Splashbg_Canvas = function (mode, startPosition, loop) {
        if (loop === null) { loop = false; } this.initialize(mode, startPosition, loop, {});

        // timeline functions:
        this.frame_0 = function () {
            stop();
        };

        // actions tween:
        this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

        // Splash Elements
        this.button1 = new lib.greenbuttonback();
        this.button1.setTransform(-305.2, 608.7, 1.5, 1.5, 0, 0, 0, 74.5, -37.9);

        this.timeline.addTween(cjs.Tween.get(this.button1).wait(1));

        // hit
        this.button0 = new lib.defaultLanguage();
        this.button0.setTransform(620.1, -0.9, 1.248, 0.935, 0, 0, 0, 496.9, -1);
        this.button0.alpha = 0;

        this.timeline.addTween(cjs.Tween.get(this.button0).wait(1));

        // copyright
        this.txtCopyright = new cjs.Text(args.copyright, "bold 14px 'Calibri'");
        this.txtCopyright.name = "txtCopyright";
        this.txtCopyright.textAlign = "right";
        this.txtCopyright.lineHeight = 19;
        this.txtCopyright.lineWidth = 730;
        this.txtCopyright.setTransform(1269.7, 692.6);

        this.timeline.addTween(cjs.Tween.get(this.txtCopyright).wait(1));

        // CHARACTER
        this.startInst = new lib.Animation();
        this.startInst.setTransform(498.2, 414.9);

        this.timeline.addTween(cjs.Tween.get(this.startInst).wait(1));

        // BG
        this.shape = new cjs.Shape();
        this.shape.graphics.f("#FFFFFF").s().p("Ehj/A4QMAAAhwfMDH+AAAMAAABwfg");
        this.shape.setTransform(640, 360);

        this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(221.5, 284.9, 1699.1, 817.2);

})(lib = lib || {}, images = images || {}, createjs = createjs || {}, ss = ss || {}, splashglobal.animation.args);
var lib, images, createjs, ss;




// Copied from the Flash generated HTML file.
var canvas, stage, exportRoot;
function init() {
    // --- write your JS code here ---

    canvas = document.getElementById("canvas");
    images = images || {};

    var loader = new createjs.LoadQueue(false);
    loader.addEventListener("fileload", handleFileLoad);
    loader.addEventListener("complete", handleComplete);
    loader.loadManifest(lib.properties.manifest);
}

function handleFileLoad(evt) {
    if (evt.item.type == "image") { images[evt.item.id] = evt.result; }
}

function handleComplete(evt) {
    exportRoot = new lib.Splashbg_Canvas();

    stage = new createjs.Stage(canvas);

    // ----------------------
    // Added this to scale the canvas to the stage.
    // ----------------------
    scaleCanvas(stage, exportRoot);
    // ----------------------

    stage.addChild(exportRoot);
    stage.update();
    stage.enableMouseOver();

    createjs.Ticker.setFPS(lib.properties.fps);
    createjs.Ticker.addEventListener("tick", stage);
}

// Start everything off.
init();

// Call the splash phse start function. This function is not exported from the Flash.
_nex.splashPhase.start(splashglobal.elements.canvasElementId, splashglobal.elements.btnFirstTimeId, splashglobal.elements.btnReturningGuestId);


function scaleCanvas(stage, exportRoot) {
    // Scale the canvas to the width of the window.
    stage.canvas.width = window.innerWidth;
    stage.canvas.height = window.innerHeight;

    // Scale the exportRoot to the scale of the window
    var newScaleX = (window.innerWidth / 1280);
    var newScaleY = (window.innerHeight / 720);
    exportRoot.scaleY = newScaleY;
    exportRoot.scaleX = newScaleX;
}