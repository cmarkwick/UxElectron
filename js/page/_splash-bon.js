// console.debug('splash.js');

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
        message: function (index) {
            return getSplashMessage(index, "");
        },
        get numMessages() { return getMessageCount(); },
        //message4: "Scan an Item or Touch the Screen to Begin",
        backgroundId: "Bitmap4",
        background: _nex.assets.theme.mediaPath() + "images/Bitmap4.jpg", //"../Themes/NationwideInsurance/Media/html/images/Images/PeachesBG.jpg",
        color: "#000000",
        fps: 24,
        width: 1280,
        height: 720
    }
};
function getMessageCount() {
    return _nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION.length;
}
function getSplashMessage(index, defaultMessage) {
    var result = defaultMessage;
    try {
        result = _nex.splashPhase.splashSettings.SPLASHTEXT.INSTRUCTION[index].message;
    } catch (err) {
        console.error('splash.js - error fetching message ' + index + " from splash settings.");
    }
    return result;
}

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

    // --------------------
    // BEGIN GENERATED CODE
    // --------------------

    // symbols:

    (lib.Bitmap4 = function () {
        this.initialize(img.Bitmap4);
    }).prototype = p = new cjs.Bitmap();
    p.nominalBounds = new cjs.Rectangle(0, 0, 1280, 720);


    (lib.yesnohitarea = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, {});

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.f("rgba(0,255,0,0)").s().p("A59HJQgqAAgdgUQgdgSAAgcIAAsOQAAgbAdgTQAdgTAqAAMAz7AAAQAqAAAdATQAdATAAAbIAAMOQAAAbgdATQgfAUgoAAg");
        this.shape.setTransform(100, 25, 0.567, 0.546);

        this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(0, 0, 200, 50);


    (lib.SplashElements = function () {
        this.initialize();

        // Layer 1
        this.txtHeader = new cjs.Text("Please Touch The Screen To Begin", "32px 'Arial'");
        this.txtHeader.name = "txtHeader";
        this.txtHeader.textAlign = "center";
        this.txtHeader.lineHeight = 31;
        this.txtHeader.lineWidth = 948;
        this.txtHeader.setTransform(480.4, -3.9);

        this.addChild(this.txtHeader);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(6.5, -3.9, 952, 46.6);


    (lib.number1_ring = function () {
        this.initialize();

        // number
        this.txtSequence = new cjs.Text("2", "230px 'Mostra Nuova Regular'");
        this.txtSequence.name = "txtSequence";
        this.txtSequence.textAlign = "center";
        this.txtSequence.lineHeight = 230;
        this.txtSequence.lineWidth = 233;
        this.txtSequence.setTransform(-10.5, -113.9);

        // Layer 4
        this.shape = new cjs.Shape();
        this.shape.graphics.f().s("#000000").ss(10, 1, 1).p("ATiAAQAAIFlvFuQluFuoFAAQoEAAlvluQluluAAoFQAAoEFuluQFvluIEAAQIFAAFuFuQFvFuAAIEg");
        this.shape.setTransform(-5.7, -0.4);

        this.addChild(this.shape, this.txtSequence);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(-135.7, -130.4, 260, 260);


    (lib.logoaces = function () {
        this.initialize();

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.f("#FFFFFF").s().p("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");
        this.shape.setTransform(795.8, 142.5);

        this.addChild(this.shape);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(622.6, 105, 346.4, 75);


    (lib.defaultLanguage = function () {
        this.initialize();

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.f("#33FF00").s().p("EhQHA8JMAAAh4UMCgPAAAMAAAB4Xg");
        this.shape.setTransform(512.9, 385.2);

        this.addChild(this.shape);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(0, 0, 1025.8, 770.5);


    (lib._1touchcopy = function () {
        this.initialize();

        // Layer 1
        this.txtMessage = new cjs.Text(args.message(1), "37px 'Arial'", "#FFFFFF");
        this.txtMessage.name = "txtMessage1";
        this.txtMessage.textAlign = "center";
        this.txtMessage.lineHeight = 37;
        this.txtMessage.lineWidth = 461;
        this.txtMessage.setTransform(305, -27.5, 1.299, 1.299);

        this.addChild(this.txtMessage);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(5.9, -27.5, 603.6, 122.6);

    // Note: This was added.
    (lib._2touchcopy = function () {
        this.initialize();

        // Layer 1
        this.txtMessage = new cjs.Text(args.message2, "37px 'Arial'", "#FFFFFF");
        this.txtMessage.name = "txtMessage2";
        this.txtMessage.textAlign = "center";
        this.txtMessage.lineHeight = 37;
        this.txtMessage.lineWidth = 461;
        this.txtMessage.setTransform(305, -27.5, 1.299, 1.299);

        this.addChild(this.txtMessage);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(5.9, -27.5, 603.6, 122.6);

    // Note: This was added.
    (lib._3touchcopy = function () {
        this.initialize();

        // Layer 1
        this.txtMessage = new cjs.Text(args.message3, "37px 'Arial'", "#FFFFFF");
        this.txtMessage.name = "txtMessage3";
        this.txtMessage.textAlign = "center";
        this.txtMessage.lineHeight = 37;
        this.txtMessage.lineWidth = 461;
        this.txtMessage.setTransform(305, -27.5, 1.299, 1.299);

        this.addChild(this.txtMessage);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(5.9, -27.5, 603.6, 122.6);


    (lib.instructionloop = function (mode, startPosition, loop) {

        this.initialize(mode, startPosition, loop, { beginLoop: 0, endLoop: 69 });

        // numbers
        this.Sequence = new lib.number1_ring();
        this.Sequence.setTransform(570, -548, 0.169, 0.171, 0, 0, 0, 4.2, -11.4);
        this.Sequence.alpha = 0;

        this.timeline.addTween(cjs.Tween.get(this.Sequence).wait(1).to({ regX: -5.7, regY: -0.4, x: 568.3, y: -546, alpha: 0.143 }, 0).wait(1).to({ alpha: 0.286 }, 0).wait(1).to({ alpha: 0.429 }, 0).wait(1).to({ alpha: 0.571 }, 0).wait(1).to({ alpha: 0.714 }, 0).wait(1).to({ alpha: 0.857 }, 0).wait(1).to({ alpha: 1 }, 0).wait(55).to({ alpha: 0.875 }, 0).wait(1).to({ alpha: 0.75 }, 0).wait(1).to({ alpha: 0.625 }, 0).wait(1).to({ alpha: 0.5 }, 0).wait(1).to({ alpha: 0.375 }, 0).wait(1).to({ alpha: 0.25 }, 0).wait(1).to({ alpha: 0.125 }, 0).wait(1).to({ alpha: 0 }, 0).wait(1));

        // NOTE: CHANGES WERE MADE HERE FROM THE GENERATED CODE
        // THE ORIGINAL CODE IS COMMENTED OUT FOR REFERENCE

        // text 1
        //this.Message1 = new lib._1touchcopy();
        //this.Message1.setTransform(0, 7.2, 1, 1, 0, 0, 0, 0, 14.4);
        ////this.Messsage3.set({ alpha: 1.0 }); // show initially
        //// store the tweens in variables so we can chain them together later on
        //var tween1 = cjs.Tween.get(this.Message1).wait(10).to({alpha:0.0},20);// .to({ alpha: 0.875 }, 0).wait(1).to({ alpha: 0.75 }, 0).wait(1).to({ alpha: 0.625 }, 0).wait(1).to({ alpha: 0.5 }, 0).wait(1).to({ alpha: 0.375 }, 0).wait(1).to({ alpha: 0.25 }, 0).wait(1).to({ alpha: 0.125 }, 0).wait(1).to({ alpha: 0 }, 0).wait(1);

        //// text 2
        //this.Message2 = new lib._2touchcopy();
        //this.Message2.setTransform(0, 7.2, 1, 1, 0, 0, 0, 0, 14.4);
        ////this.Messsage3.set({ alpha: 0.0 }); // hide initially
        //var tween2 = cjs.Tween.get(this.Message2).wait(10).to({ alpha: 0.0 }, 20); //.wait(1).to({ regX: 307.6, regY: 33.8, x: 307.6, y: 26.6 }, 0);//.to({alpha:1.0},0).wait(10).to({alpha:0.0},20); //to({ alpha: 0.875 }, 0).wait(1).to({ alpha: 0.75 }, 0).wait(1).to({ alpha: 0.625 }, 0).wait(1).to({ alpha: 0.5 }, 0).wait(1).to({ alpha: 0.375 }, 0).wait(1).to({ alpha: 0.25 }, 0).wait(1).to({ alpha: 0.125 }, 0).wait(1).to({ alpha: 0 }, 0).wait(1);

        //// text 3
        //this.Message3 = new lib._3touchcopy();
        //this.Message3.setTransform(0, 7.2, 1, 1, 0, 0, 0, 0, 14.4);
        ////this.Messsage3.set({alpha:0.0}); // hide initially
        //var tween3 = cjs.Tween.get(this.Message3).wait(10).to({ alpha: 0.0 }, 20); //.wait(1).to({ regX: 307.6, regY: 33.8, x: 307.6, y: 26.6 }, 0);//.to({ alpha: 1.0 }, 0).wait(10).to({ alpha: 0.0 }, 20); //.to({ alpha: 0.875 }, 0).wait(1).to({ alpha: 0.75 }, 0).wait(1).to({ alpha: 0.625 }, 0).wait(1).to({ alpha: 0.5 }, 0).wait(1).to({ alpha: 0.375 }, 0).wait(1).to({ alpha: 0.25 }, 0).wait(1).to({ alpha: 0.125 }, 0).wait(1).to({ alpha: 0 }, 0).wait(1);
        //console.log(this.Message3);


        var txt = new createjs.Text(args.message(0), "37px 'Arial'", "#FFFFFF");
        //var txt = new lib._1touchcopy(); // Tired to get this to work a number of ways but couldn't.
        txt.name = "txtMessage";
        txt.textAlign = "center";
        txt.lineHeight = 37;
        txt.lineWidth = 461;
        // This is copied from the original _1touchcopy
        // txt.setTransform(305, -27.5 + 7.2, 1.299, 1.299); // first transform
        txt.setTransform(0, -27.5 + 7.2 * 1.299, 1.299, 1.299, 0, 0, 0, 307.6, 14.4); // second transform


        // If you add all the tweens at once, they display in parallel.
        // tween1.chain(tween2);
        // tween2.chain(tween3);
        // tween3.chain(tween1);

        // It should be possible to have tweens play other tweens. Tried this several ways and could not get it to work... 
        // var tweenChain = tween1.wait(20).to({ alpha: 0.0 }, 20).play(tween2).to( {alpha: 1.0 },20); // keep the first frame up a bit
        // .to({ alpha: 1.0 }, 0).play(tween2).wait(20).to({ alpha: 0.0 }, 20)
        // .to({ alpha: 1.0 }, 0).play(tween3).wait(20).to({ alpha: 0.0 }, 20)
        // .to({ alpha: 1.0 }, 0); // Now when it loops back, it should show the first frame again

        // This tween chain is a simplified version of what was exported.
        var tweenChain = createjs.Tween.get(txt, { loop: false, ignoreGlobalPause: true })
          .to({ regX: 0, regY: 33.8, x: 300, y: 26.6 }, 0)
       .wait(61).to({ alpha: 0.0 }, 8); // This was the original transition to alpha 0wait(61).to({alpha:0.875},0).wait(1).to({alpha:0.75},0).wait(1).to({alpha:0.625},0).wait(1).to({alpha:0.5},0).wait(1).to({alpha:0.375},0).wait(1).to({alpha:0.25},0).wait(1).to({alpha:0.125},0).wait(1).to({alpha:0},0).wait(1)
        for (var index = 1; index < args.numMessages; index++) {
            if (args.message(index)) {
                tweenChain.to({ alpha: 1.0, text: args.message(index) }, 0).wait(61).to({ alpha: 0.0 }, 8);
            }
        }
        // Add the tween to the timeline
        this.timeline.addTween(tweenChain);

        // END CHANGES
    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(5.9, -568.4, 603.6, 656.3);


    (lib.greenbuttonback = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, { up: 0, down: 1 });

        // timeline functions:
        this.frame_0 = function () {
            this.stop();
        };
        this.frame_1 = function () {
            this.stop();
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
        this.btext.lineHeight = 24;
        this.btext.lineWidth = 156;
        this.btext.setTransform(98, 12);

        this.timeline.addTween(cjs.Tween.get(this.btext).wait(2));

        // Layer 2
        this.shape = new cjs.Shape();
        this.shape.graphics.f().s("#FFFFFF").ss(2, 1, 1).p("Avnj5IfPAAIAAHzI/PAAg");
        this.shape.setTransform(100, 25);

        this.timeline.addTween(cjs.Tween.get(this.shape).wait(2));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(-1, -1, 202, 52);


    (lib.Animation = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, { splashState: 0, splashStartOrder: 13, splashOut: 14 });

        // timeline functions:
        this.frame_0 = function () {
            this.stop();
        };
        this.frame_13 = function () {
            // frame 13 and 28 don't get called!
            this.stop();
        };
        this.frame_28 = function () {
            this.gotoAndStop('splashState');
        };

        // actions tween:
        this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(13).call(this.frame_13).wait(15).call(this.frame_28).wait(1));

        // please touch text
        this.HeaderClip = new lib.SplashElements();
        this.HeaderClip.setTransform(-21.6, -460.9, 1, 1, 0, 0, 0, 318.6, 25.2);
        this.HeaderClip.cache(5, -6, 956, 51);

        this.timeline.addTween(cjs.Tween.get(this.HeaderClip).wait(29));

        // logo
        this.instance = new lib.logoaces();
        this.instance.setTransform(-215.2, -90.1, 1.578, 1.578, 0, 0, 0, 580.6, 152);

        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1).to({ regX: 795.8, regY: 142.5, x: 124.4, y: -105.1 }, 0).wait(4).to({ y: -111.8, alpha: 0.833 }, 0).wait(1).to({ y: -118.4, alpha: 0.667 }, 0).wait(1).to({ y: -125.1, alpha: 0.5 }, 0).wait(1).to({ y: -131.8, alpha: 0.333 }, 0).wait(1).to({ y: -138.4, alpha: 0.167 }, 0).wait(1).to({ y: -145.1, alpha: 0 }, 0).wait(1).to({ y: -142.9 }, 0).wait(1).to({ y: -140.7 }, 0).wait(1).to({ y: -138.4 }, 0).wait(1).to({ y: -136.2 }, 0).wait(1).to({ y: -134 }, 0).wait(1).to({ y: -131.8 }, 0).wait(1).to({ y: -129.5 }, 0).wait(1).to({ y: -127.3 }, 0).wait(1).to({ y: -125.1 }, 0).wait(1).to({ y: -122.9 }, 0).wait(1).to({ y: -120.7 }, 0).wait(1).to({ y: -118.4 }, 0).wait(1).to({ y: -116.2 }, 0).wait(1).to({ y: -114, alpha: 0.2 }, 0).wait(1).to({ y: -111.8, alpha: 0.4 }, 0).wait(1).to({ y: -109.5, alpha: 0.6 }, 0).wait(1).to({ y: -107.3, alpha: 0.8 }, 0).wait(1).to({ y: -105.1, alpha: 1 }, 0).wait(1));

        // instructions
        this.InstClip = new lib.instructionloop();
        this.InstClip.setTransform(-137.9, 12.6, 0.85, 0.85);

        this.timeline.addTween(cjs.Tween.get(this.InstClip).wait(29));// this doesn't work....call(console.log, ["instloop"], console));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(-333.8, -490, 952, 577.4);


    // stage content:
    (lib.SplashbgHTML = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, { on: 0, animate: 1, splashFrame: 2, off: 3 });

        // timeline functions:
        this.frame_0 = function () {
            this.stop();
        };
        this.frame_1 = function () {
            // frame1, 2, and 3 don't get called!!
            this.stop();
        };
        this.frame_2 = function () {
            this.stop();
        };
        this.frame_3 = function () {
            this.stop();
        };

        // actions tween:
        this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1).call(this.frame_1).wait(1).call(this.frame_2).wait(1).call(this.frame_3).wait(1));

        // Splash Elements
        this.button1 = new lib.greenbuttonback();
        this.button1.setTransform(-305.2, 608.7, 1.5, 1.5, 0, 0, 0, 74.5, -37.9);
        this.timeline.addTween(cjs.Tween.get(this.button1).wait(4));

        // hit
        this.button0 = new lib.defaultLanguage();
        this.button0.setTransform(0, -0.9, 1.248, 0.935, 0, 0, 0, 496.9, -1);
        this.button0.alpha = 0.0;

        this.timeline.addTween(cjs.Tween.get(this.button0).to({ _off: true }, 1).wait(1).to({ _off: false, regX: 524.9, regY: 5.8, x: 655, y: 5.4 }, 0).to({ _off: true }, 1).wait(1));

        // copyright
        this.txtCopyright = new cjs.Text(args.copyright, "bold 14px 'Calibri'", "#FFFFFF");
        this.txtCopyright.name = "txtCopyright";
        this.txtCopyright.textAlign = "right";
        this.txtCopyright.lineHeight = 16;
        this.txtCopyright.lineWidth = 1236;
        this.txtCopyright.setTransform(1256, 692.6);
        this.txtCopyright.shadow = new cjs.Shadow("rgba(0,0,0,1)", 0, 0, 2);

        this.timeline.addTween(cjs.Tween.get(this.txtCopyright).wait(4));

        // CHARACTER
        this.startInst = new lib.Animation();
        this.startInst.setTransform(498.2, 414.9);
        this.timeline.addTween(cjs.Tween.get(this.startInst).to({ _off: true }, 3).wait(1)); // this doesn't work. .call(console.log, ["animation"], console));

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.f().s("#F6A800").ss(3, 1, 1).p("Egq9gJwMBV7AAAIAAThMhV7AAAg");
        this.shape.setTransform(620.2, 457.9);

        this.timeline.addTween(cjs.Tween.get(this.shape).wait(4));

        // BG
        this.instance = new lib.Bitmap4();

        this.timeline.addTween(cjs.Tween.get(this.instance).wait(4));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(221.5, 284.9, 1698.5, 817.2);

    // ------------------
    // END GENERATED CODE
    // ------------------

})(splashglobal.animation.lib, splashglobal.animation.images, window.createjs, splashglobal.animation.ss, splashglobal.animation.args);

// The original flash export called this in body onload. Moved to here to have all the JavaScript in one place.
(function () {

    // This init function is modified from the original. It has been changed to use the existing global variables (lib, images, createjs, ss)
    // and not introduce new ones where the scope of the variable is just in init (canvas, stage, exportroot).
    function init(canvasElementId, lib, images, createjs, ss, flashHeight, flashWidth) {
        var _exportRoot;
        var _canvas = document.getElementById(canvasElementId);

        if (!_canvas) {
            console.error("Could not find element " + canvasElementId);
        }

        function scaleCanvas(stage) {
            // Scale the canvas to the width of the window.
            stage.canvas.width = window.innerWidth;
            stage.canvas.height = window.innerHeight;

            // Scale the exportRoot to the scale of the window
            var newScaleX = (window.innerWidth / flashWidth);
            var newScaleY = (window.innerHeight / flashHeight);
            _exportRoot.scaleY = newScaleY;
            _exportRoot.scaleX = newScaleX;
        }

        function handleFileLoad(evt) {
            if (evt.item.type == "image") { images[evt.item.id] = evt.result; }
        }

        function handleComplete(evt) {
            // Note: This line may need to be changed from theme to theme.  
            // For example, one says SplashbgHTML, and another may say Splash2HTML
            _exportRoot = new lib.SplashbgHTML();
            //console.log(_exportRoot);
            var stage = new createjs.Stage(_canvas);

            // Added this to scale the canvas to the stage.
            scaleCanvas(stage);
            stage.addChild(_exportRoot);
            stage.update();
            stage.enableMouseOver();

            createjs.Ticker.setFPS(lib.properties.fps);
            createjs.Ticker.addEventListener("tick", stage);

            // If DOM events are enabled on the SPLASH, they can interfere with 
            // events after the Splash stage.
            if (stage.enableDOMEvents) {
                stage.enableDOMEvents(false);
            }

            //window.EXPORT_ROOT = _exportRoot;
        }

        var loader = new createjs.LoadQueue(false);
        loader.addEventListener("fileload", handleFileLoad);
        loader.addEventListener("complete", handleComplete);
        loader.loadManifest(lib.properties.manifest);
    }



    // Call the init function. This function mostly comes from the exported Flash to HTML/JavaScript tool.
    init(splashglobal.elements.canvasElementId, splashglobal.animation.lib, splashglobal.animation.images, window.createjs, splashglobal.animation.ss, splashglobal.animation.args.height, splashglobal.animation.args.width);

    // Call the splash phse start function. This function is not exported from the Flash.
    _nex.splashPhase.start(splashglobal.elements.canvasElementId, splashglobal.elements.btnFirstTimeId, splashglobal.elements.btnReturningGuestId);


})(undefined);

