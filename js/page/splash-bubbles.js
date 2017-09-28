console.debug('splash.js');

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
        copyright: "Copyright 2005-2016 NEXTEP SYSTEMS. U.S. Patent 8,190,483. Additional Patents Pending.",
        message1: "Touch the\nScreen to\nBegin",
        message2: "Scan or\nWeigh Your\nItems",
        message3: "Pay with\nYour Credit\nCard",
        message4: "Scan an Item or Touch the Screen to Begin",
        backgroundId: "PeachesBG",
        background: _nex.assets.theme.mediaPath() + "images/PeachesBG.jpg", //"../Themes/NationwideInsurance/Media/html/images/Images/PeachesBG.jpg",
        color: "#CECFCC",
        fps: 19,
        width: 1280,
        height: 720
    }
};

splashglobal.elements = {
    canvasElementId: "canvas",
    btnElementId: "btnStart"
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
 
    (lib.PeachesBG = function () {
        this.initialize(img.PeachesBG);
    }).prototype = p = new cjs.Bitmap();
    p.nominalBounds = new cjs.Rectangle(0, 0, 1280, 720);


    (lib.Symbol2copy = function () {
        this.initialize();

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.f("#F6A800").s().p("Eg2rAg0MAAAhBnMBtXAAAMAAABBng");
        this.shape.setTransform(350, 210);

        this.addChild(this.shape);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(0, 0, 700, 420);


    (lib.popup = function () {
        this.initialize();

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.f("#8F8B77").s().p("AwZQaQmymzAApnQAApmGymzQGzmyJmAAQJnAAGyGyQG0GzAAJmQAAJnm0GzQmyGypnAAQpmAAmzmyg");
        this.shape.setTransform(148.5, 148.5);

        this.addChild(this.shape);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(0, 0, 297, 297);

    (lib.number3_ring = function () {
        this.initialize();

        // number
        this.txtSequence = new cjs.Text("3", "69px 'Arial'", "#FFFFFF");
        this.txtSequence.name = "txtSequence";
        this.txtSequence.textAlign = "center";
        this.txtSequence.lineHeight = 69;
        this.txtSequence.lineWidth = 70;
        this.txtSequence.setTransform(-335.8, -73.7);

        this.addChild(this.txtSequence);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(-370.6, -73.7, 73.6, 88.3);

    (lib.number2_ring = function () {
        this.initialize();

        // number
        this.txtSequence = new cjs.Text("2", "69px 'Arial'", "#FFFFFF");
        this.txtSequence.name = "txtSequence";
        this.txtSequence.textAlign = "center";
        this.txtSequence.lineHeight = 69;
        this.txtSequence.lineWidth = 70;
        this.txtSequence.setTransform(-335.8, -73.7);

        this.addChild(this.txtSequence);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(-370.6, -73.7, 73.6, 88.3);

    (lib.number1_ring = function () {
        this.initialize();

        // number
        this.txtSequence = new cjs.Text("1", "69px 'Arial'", "#FFFFFF");
        this.txtSequence.name = "txtSequence";
        this.txtSequence.textAlign = "center";
        this.txtSequence.lineHeight = 69;
        this.txtSequence.lineWidth = 70;
        this.txtSequence.setTransform(-335.8, -73.7);

        this.addChild(this.txtSequence);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(-370.6, -73.7, 73.6, 88.3);


    (lib.languagebevel = function () {
        this.initialize();

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.lf(["#8C8C8C", "#FFFFFF", "#808080"], [0, 0.518, 1], 0, 47, 0, -47).s().p("AwGHWQiCAAAAiCIAAqnQAAiCCCAAMAgNAAAQCCAAAACCIAAKnQAACCiCAAg");
        this.shape.setTransform(116.2, 47.1);

        this.addChild(this.shape);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(0, 0, 232.4, 94.2);


    (lib.defaultLanguage = function () {
        this.initialize();

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.f("#33FF00").s().p("EhQHA8JMAAAh4UMCgPAAAMAAAB4Xg");
        this.shape.setTransform(640, 360, 1.248, 0.935);

        this.addChild(this.shape);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(0, 0, 1280, 720);


    (lib.buttonborderdown = function () {
        this.initialize();

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.f("#BFD852").s().p("AvkFeQgyAAglgjQgjgkAAgyIAAnIQAAgzAjgkQAlgjAyAAIfKAAQAyAAAjAjQAkAkAAAzIAAHIQAAAygkAkQgjAjgyAAgAwwkvQgfAfgBAtIAAHIQABAsAfAfQAfAgAtAAIfKAAQAsAAAfggQAggfAAgsIAAnIQAAgtgggfQgfgggsAAI/KAAQgtAAgfAgg");
        this.shape.setTransform(112, 35.1);

        this.addChild(this.shape);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(0, 0, 223.9, 70.2);


    (lib.buttonbody = function () {
        this.initialize();

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.lf(["#FFFFFF", "#E5E4E4"], [0, 1], -8.7, -33.6, -8.7, 33.6).s().p("AvkFQQgtAAgfggQgfgfgBgsIAAnIQABgtAfgfQAfggAtAAIfKAAQAsAAAfAgQAgAfAAAtIAAHIQAAAsggAfQgfAggsAAg");
        this.shape.setTransform(110.5, 33.6);

        this.addChild(this.shape);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(0, 0, 221, 67.3);

    (lib._1touchcopy = function () {
        this.initialize();

        // flash6.ai
        this.txtMessage = new cjs.Text(args.message1, "62px 'Arial'", "#FFFFFF");
        this.txtMessage.name = "txtMessage";
        this.txtMessage.textAlign = "center";
        this.txtMessage.lineHeight = 65;
        this.txtMessage.lineWidth = 344;
        this.txtMessage.setTransform(237.9, 161.3);

        this.addChild(this.txtMessage);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(66.1, 161.3, 347.7, 214.8);

    // lib._2touchcopy and lib._3touchcopy were added
    (lib._2touchcopy = function () {
        this.initialize();

        // flash6.ai
        this.txtMessage = new cjs.Text(args.message2, "62px 'Arial'", "#FFFFFF");
        this.txtMessage.name = "txtMessage2";
        this.txtMessage.textAlign = "center";
        this.txtMessage.lineHeight = 65;
        this.txtMessage.lineWidth = 344;
        this.txtMessage.setTransform(237.9, 161.3);

        this.addChild(this.txtMessage);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(66.1, 161.3, 347.7, 214.8);

    (lib._3touchcopy = function () {
        this.initialize();

        // flash6.ai
        this.txtMessage = new cjs.Text(args.message3, "62px 'Arial'", "#FFFFFF");
        this.txtMessage.name = "txtMessage3";
        this.txtMessage.textAlign = "center";
        this.txtMessage.lineHeight = 65;
        this.txtMessage.lineWidth = 344;
        this.txtMessage.setTransform(237.9, 161.3);

        this.addChild(this.txtMessage);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(66.1, 161.3, 347.7, 214.8);

    (lib.spanishhit = function () {
        this.initialize();

        // Layer 1
        this.instance = new lib.languagebevel();
        this.instance.setTransform(91.4, 37, 0.786, 0.786, 0, 0, 0, 116.2, 47.1);

        this.addChild(this.instance);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(0, 0, 182.7, 74);


    (lib.popupcopy2 = function () {
        this.initialize();

        // Layer 1
        this.instance = new lib.Symbol2copy();
        this.instance.setTransform(350, 210, 1, 1, 0, 0, 0, 350, 210);

        this.addChild(this.instance);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(0, 0, 700, 420);


    (lib.PopupBox = function () {
        this.initialize();

        // Layer 2
        this.instance = new lib.popup();
        this.instance.setTransform(350, 210, 1, 1, 0, 0, 0, 350, 210);

        this.addChild(this.instance);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(0, 0, 297, 297);


    (lib.buttonskindown = function () {
        this.initialize();

        // Layer 2
        this.instance = new lib.buttonbody();
        this.instance.setTransform(112, 35.1, 1, 1, 0, 0, 0, 110.5, 33.6);

        // Layer 1
        this.instance_1 = new lib.buttonborderdown();
        this.instance_1.setTransform(112, 35.1, 1, 1, 0, 0, 0, 112, 35.1);

        this.addChild(this.instance_1, this.instance);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(0, 0, 223.9, 70.2);


    (lib.buttonskin = function () {
        this.initialize();

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.f().s("#FFFFFF").ss(3).p("AXcAAQAAJtm4G3Qm3G3ptAAQpsAAm4m3Qm3m3AAptQAApsG3m3QG4m3JsAAQJtAAG3G3QG4G3AAJsg");
        this.shape.setTransform(150, 150);

        // Layer 2
        this.instance = new lib.PopupBox();
        this.instance.setTransform(466.9, 163.9, 1, 1, 0, 0, 0, 466.9, 163.9);

        this.addChild(this.instance, this.shape);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(-1.5, -1.5, 303, 303);


    (lib.boxcopy = function () {
        this.initialize();

        // Layer 2
        this.instance = new lib.popupcopy2();
        this.instance.setTransform(350, 210, 1, 1, 0, 0, 0, 350, 210);

        this.addChild(this.instance);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(0, 0, 700, 420);


    (lib.languagebutton = function (mode, startPosition, loop) {
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

        // hit
        this.instance = new lib.spanishhit();
        this.instance.setTransform(123.3, 33, 1.545, 1, 0, 0, 0, 91.3, 37);
        this.instance.alpha = 0;
        new cjs.ButtonHelper(this.instance, 0, 1, 1);

        this.timeline.addTween(cjs.Tween.get(this.instance).wait(2));

        // text
        this.btext = new cjs.Text("ESPANOL", "35px 'Ubuntu Light'", "#5D5F63");
        this.btext.name = "btext";
        this.btext.textAlign = "center";
        this.btext.lineHeight = 41;
        this.btext.lineWidth = 217;
        this.btext.setTransform(111.1, 14.4);

        this.timeline.addTween(cjs.Tween.get(this.btext).wait(2));

        // button
        this.instance_1 = new lib.buttonskindown();
        this.instance_1.setTransform(112, 35.1, 1, 1, 0, 0, 0, 112, 35.1);
        this.instance_1._off = true;

        this.timeline.addTween(cjs.Tween.get(this.instance_1).wait(1).to({ _off: false }, 0).wait(1));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(-17.8, -4, 282.2, 74);


    (lib.instructionloop = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, { beginLoop: 0, endLoop: 149 });

        // Number
        this.Sequence0 = new lib.number1_ring();
        this.Sequence0.setTransform(-305.3, 208, 1, 1, 0, 0, 0, 39.9, 37.4);

        this.timeline.addTween(cjs.Tween.get(this.Sequence0).wait(1).to({ regX: -333.9, regY: -29.6, x: -679.8, y: 141 }, 0).wait(1).to({ x: -680.6 }, 0).wait(1).to({ x: -681.3 }, 0).wait(1).to({ x: -682.1 }, 0).wait(1).to({ x: -682.8 }, 0).wait(1).to({ x: -683.6 }, 0).wait(1).to({ x: -684.3 }, 0).wait(1).to({ x: -685.1 }, 0).wait(1).to({ x: -685.8 }, 0).wait(1).to({ x: -686.6 }, 0).wait(1).to({ x: -687.3 }, 0).wait(1).to({ x: -688.1 }, 0).wait(1).to({ x: -688.8 }, 0).wait(1).to({ x: -689.6 }, 0).wait(1).to({ x: -690.3 }, 0).wait(1).to({ x: -691.1 }, 0).wait(1).to({ x: -691.8 }, 0).wait(1).to({ x: -692.5 }, 0).wait(1).to({ x: -693.3 }, 0).wait(1).to({ x: -694.1 }, 0).wait(1).to({ x: -694.8 }, 0).wait(1).to({ x: -695.6 }, 0).wait(1).to({ x: -696.3 }, 0).wait(1).to({ x: -697.1 }, 0).wait(1).to({ x: -697.8 }, 0).wait(1).to({ x: -698.6 }, 0).wait(1).to({ x: -699.3 }, 0).wait(1).to({ x: -700.1 }, 0).wait(1).to({ x: -700.8 }, 0).wait(1).to({ x: -701.5 }, 0).wait(1).to({ x: -702.3 }, 0).wait(1).to({ x: -703.1 }, 0).wait(1).to({ x: -703.8 }, 0).wait(1).to({ x: -704.6 }, 0).wait(1).to({ x: -705.3 }, 0).wait(1).to({ x: -705.1, y: 142.4 }, 0).wait(1).to({ x: -704.8, y: 143.8 }, 0).wait(1).to({ x: -704.6, y: 145.2 }, 0).wait(1).to({ x: -704.4, y: 146.6 }, 0).wait(1).to({ x: -704.2, y: 148 }, 0).wait(1).to({ x: -703.9, y: 149.5 }, 0).wait(1).to({ x: -703.7, y: 150.9 }, 0).wait(1).to({ x: -703.5, y: 152.3 }, 0).wait(1).to({ x: -703.2, y: 153.7 }, 0).wait(1).to({ x: -703, y: 155.1 }, 0).wait(1).to({ x: -702.8, y: 156.6 }, 0).wait(1).to({ x: -702.6, y: 158 }, 0).wait(1).to({ x: -702.3, y: 159.4 }, 0).wait(1).to({ x: -702.1, y: 160.8 }, 0).wait(1).to({ x: -701.9, y: 162.2 }, 0).wait(1).to({ x: -701.6, y: 163.7 }, 0).wait(1).to({ x: -701.4, y: 165.1 }, 0).wait(1).to({ x: -701.2, y: 166.5 }, 0).wait(1).to({ x: -701, y: 167.9 }, 0).wait(1).to({ x: -700.7, y: 169.3 }, 0).wait(1).to({ x: -700.5, y: 170.7 }, 0).wait(1).to({ x: -700.3, y: 172.2 }, 0).wait(1).to({ x: -700, y: 173.6 }, 0).wait(1).to({ x: -699.8, y: 175 }, 0).wait(1).to({ x: -699.6, y: 176.4 }, 0).wait(1).to({ x: -699.3, y: 177.8 }, 0).wait(1).to({ x: -699.1, y: 179.3 }, 0).wait(1).to({ x: -698.9, y: 180.7 }, 0).wait(1).to({ x: -698.7, y: 182.1 }, 0).wait(1).to({ x: -698.4, y: 183.5 }, 0).wait(1).to({ x: -698.2, y: 184.9 }, 0).wait(1).to({ x: -698, y: 186.4 }, 0).wait(1).to({ x: -697.7, y: 187.8 }, 0).wait(1).to({ x: -697.5, y: 189.2 }, 0).wait(1).to({ x: -697.3, y: 190.6 }, 0).wait(1).to({ x: -697.1, y: 192 }, 0).wait(1).to({ x: -696.8, y: 193.5 }, 0).wait(1).to({ x: -695.9, y: 192.8 }, 0).wait(1).to({ x: -695, y: 192.1 }, 0).wait(1).to({ x: -694, y: 191.4 }, 0).wait(1).to({ x: -693.1, y: 190.7 }, 0).wait(1).to({ x: -692.1, y: 190.1 }, 0).wait(1).to({ x: -691.2, y: 189.4 }, 0).wait(1).to({ x: -690.3, y: 188.7 }, 0).wait(1).to({ x: -689.3, y: 188 }, 0).wait(1).to({ x: -688.4, y: 187.4 }, 0).wait(1).to({ x: -687.4, y: 186.7 }, 0).wait(1).to({ x: -686.5, y: 186 }, 0).wait(1).to({ x: -685.6, y: 185.3 }, 0).wait(1).to({ x: -684.6, y: 184.7 }, 0).wait(1).to({ x: -683.7, y: 184 }, 0).wait(1).to({ x: -682.8, y: 183.3 }, 0).wait(1).to({ x: -681.8, y: 182.6 }, 0).wait(1).to({ x: -680.9, y: 182 }, 0).wait(1).to({ x: -679.9, y: 181.3 }, 0).wait(1).to({ x: -679, y: 180.6 }, 0).wait(1).to({ x: -678.1, y: 179.9 }, 0).wait(1).to({ x: -677.1, y: 179.3 }, 0).wait(1).to({ x: -676.2, y: 178.6 }, 0).wait(1).to({ x: -675.3, y: 177.9 }, 0).wait(1).to({ x: -674.3, y: 177.2 }, 0).wait(1).to({ x: -673.4, y: 176.6 }, 0).wait(1).to({ x: -672.4, y: 175.9 }, 0).wait(1).to({ x: -671.5, y: 175.2 }, 0).wait(1).to({ x: -670.6, y: 174.5 }, 0).wait(1).to({ x: -669.6, y: 173.9 }, 0).wait(1).to({ x: -668.7, y: 173.2 }, 0).wait(1).to({ x: -667.7, y: 172.5 }, 0).wait(1).to({ x: -666.8, y: 171.8 }, 0).wait(1).to({ x: -665.9, y: 171.2 }, 0).wait(1).to({ x: -664.9, y: 170.5 }, 0).wait(1).to({ x: -664, y: 169.8 }, 0).wait(1).to({ x: -663.1, y: 169.1 }, 0).wait(1).to({ x: -662.1, y: 168.5 }, 0).wait(1).to({ x: -662.5, y: 167.8 }, 0).wait(1).to({ x: -663, y: 167.1 }, 0).wait(1).to({ x: -663.4, y: 166.4 }, 0).wait(1).to({ x: -663.8, y: 165.7 }, 0).wait(1).to({ x: -664.2, y: 165 }, 0).wait(1).to({ x: -664.7, y: 164.3 }, 0).wait(1).to({ x: -665.1, y: 163.6 }, 0).wait(1).to({ x: -665.5, y: 163 }, 0).wait(1).to({ x: -665.9, y: 162.3 }, 0).wait(1).to({ x: -666.3, y: 161.6 }, 0).wait(1).to({ x: -666.8, y: 160.9 }, 0).wait(1).to({ x: -667.2, y: 160.2 }, 0).wait(1).to({ x: -667.6, y: 159.5 }, 0).wait(1).to({ x: -668, y: 158.8 }, 0).wait(1).to({ x: -668.5, y: 158.1 }, 0).wait(1).to({ x: -668.9, y: 157.5 }, 0).wait(1).to({ x: -669.3, y: 156.8 }, 0).wait(1).to({ x: -669.7, y: 156.1 }, 0).wait(1).to({ x: -670.2, y: 155.4 }, 0).wait(1).to({ x: -670.6, y: 154.7 }, 0).wait(1).to({ x: -671, y: 154 }, 0).wait(1).to({ x: -671.4, y: 153.3 }, 0).wait(1).to({ x: -671.9, y: 152.6 }, 0).wait(1).to({ x: -672.3, y: 152 }, 0).wait(1).to({ x: -672.7, y: 151.3 }, 0).wait(1).to({ x: -673.1, y: 150.6 }, 0).wait(1).to({ x: -673.5, y: 149.9 }, 0).wait(1).to({ x: -674, y: 149.2 }, 0).wait(1).to({ x: -674.4, y: 148.5 }, 0).wait(1).to({ x: -674.8, y: 147.8 }, 0).wait(1).to({ x: -675.2, y: 147.1 }, 0).wait(1).to({ x: -675.7, y: 146.5 }, 0).wait(1).to({ x: -676.1, y: 145.8 }, 0).wait(1).to({ x: -676.5, y: 145.1 }, 0).wait(1).to({ x: -676.9, y: 144.4 }, 0).wait(1).to({ x: -677.4, y: 143.7 }, 0).wait(1).to({ x: -677.8, y: 143 }, 0).wait(1).to({ x: -678.2, y: 142.3 }, 0).wait(1).to({ x: -678.6, y: 141.6 }, 0).wait(1).to({ x: -679.1, y: 141 }, 0).wait(1));

        // text
        this.Message0 = new lib._1touchcopy();
        this.Message0.setTransform(-914.8, 35.9);

        this.timeline.addTween(cjs.Tween.get(this.Message0).wait(1).to({ regX: 239.9, regY: 268.7, x: -675.7, y: 304.6 }, 0).wait(1).to({ x: -676.4 }, 0).wait(1).to({ x: -677.2 }, 0).wait(1).to({ x: -677.9 }, 0).wait(1).to({ x: -678.7 }, 0).wait(1).to({ x: -679.4 }, 0).wait(1).to({ x: -680.2 }, 0).wait(1).to({ x: -680.9 }, 0).wait(1).to({ x: -681.6 }, 0).wait(1).to({ x: -682.4 }, 0).wait(1).to({ x: -683.2 }, 0).wait(1).to({ x: -683.9 }, 0).wait(1).to({ x: -684.7 }, 0).wait(1).to({ x: -685.4 }, 0).wait(1).to({ x: -686.1 }, 0).wait(1).to({ x: -686.9 }, 0).wait(1).to({ x: -687.7 }, 0).wait(1).to({ x: -688.4 }, 0).wait(1).to({ x: -689.1 }, 0).wait(1).to({ x: -689.9 }, 0).wait(1).to({ x: -690.6 }, 0).wait(1).to({ x: -691.4 }, 0).wait(1).to({ x: -692.2 }, 0).wait(1).to({ x: -692.9 }, 0).wait(1).to({ x: -693.7 }, 0).wait(1).to({ x: -694.4 }, 0).wait(1).to({ x: -695.2 }, 0).wait(1).to({ x: -695.9 }, 0).wait(1).to({ x: -696.7 }, 0).wait(1).to({ x: -697.4 }, 0).wait(1).to({ x: -698.2 }, 0).wait(1).to({ x: -698.9 }, 0).wait(1).to({ x: -699.7 }, 0).wait(1).to({ x: -700.4 }, 0).wait(1).to({ x: -701.2 }, 0).wait(1).to({ x: -700.9, y: 306 }, 0).wait(1).to({ x: -700.7, y: 307.4 }, 0).wait(1).to({ x: -700.5, y: 308.8 }, 0).wait(1).to({ x: -700.2, y: 310.2 }, 0).wait(1).to({ x: -700, y: 311.6 }, 0).wait(1).to({ x: -699.8, y: 313.1 }, 0).wait(1).to({ x: -699.5, y: 314.5 }, 0).wait(1).to({ x: -699.3, y: 315.9 }, 0).wait(1).to({ x: -699.1, y: 317.3 }, 0).wait(1).to({ x: -698.9, y: 318.7 }, 0).wait(1).to({ x: -698.6, y: 320.2 }, 0).wait(1).to({ x: -698.4, y: 321.6 }, 0).wait(1).to({ x: -698.2, y: 323 }, 0).wait(1).to({ x: -697.9, y: 324.4 }, 0).wait(1).to({ x: -697.7, y: 325.8 }, 0).wait(1).to({ x: -697.5, y: 327.3 }, 0).wait(1).to({ x: -697.3, y: 328.7 }, 0).wait(1).to({ x: -697, y: 330.1 }, 0).wait(1).to({ x: -696.8, y: 331.5 }, 0).wait(1).to({ x: -696.6, y: 332.9 }, 0).wait(1).to({ x: -696.3, y: 334.3 }, 0).wait(1).to({ x: -696.1, y: 335.8 }, 0).wait(1).to({ x: -695.9, y: 337.2 }, 0).wait(1).to({ x: -695.7, y: 338.6 }, 0).wait(1).to({ x: -695.4, y: 340 }, 0).wait(1).to({ x: -695.2, y: 341.4 }, 0).wait(1).to({ x: -695, y: 342.9 }, 0).wait(1).to({ x: -694.7, y: 344.3 }, 0).wait(1).to({ x: -694.5, y: 345.7 }, 0).wait(1).to({ x: -694.3, y: 347.1 }, 0).wait(1).to({ x: -694.1, y: 348.5 }, 0).wait(1).to({ x: -693.8, y: 350 }, 0).wait(1).to({ x: -693.6, y: 351.4 }, 0).wait(1).to({ x: -693.4, y: 352.8 }, 0).wait(1).to({ x: -693.1, y: 354.2 }, 0).wait(1).to({ x: -692.9, y: 355.6 }, 0).wait(1).to({ x: -692.7, y: 357.1 }, 0).wait(1).to({ x: -691.7, y: 356.4 }, 0).wait(1).to({ x: -690.8, y: 355.7 }, 0).wait(1).to({ x: -689.9, y: 355 }, 0).wait(1).to({ x: -688.9, y: 354.3 }, 0).wait(1).to({ x: -688, y: 353.7 }, 0).wait(1).to({ x: -687.1, y: 353 }, 0).wait(1).to({ x: -686.1, y: 352.3 }, 0).wait(1).to({ x: -685.2, y: 351.6 }, 0).wait(1).to({ x: -684.2, y: 351 }, 0).wait(1).to({ x: -683.3, y: 350.3 }, 0).wait(1).to({ x: -682.4, y: 349.6 }, 0).wait(1).to({ x: -681.4, y: 348.9 }, 0).wait(1).to({ x: -680.5, y: 348.3 }, 0).wait(1).to({ x: -679.5, y: 347.6 }, 0).wait(1).to({ x: -678.6, y: 346.9 }, 0).wait(1).to({ x: -677.7, y: 346.2 }, 0).wait(1).to({ x: -676.7, y: 345.6 }, 0).wait(1).to({ x: -675.8, y: 344.9 }, 0).wait(1).to({ x: -674.9, y: 344.2 }, 0).wait(1).to({ x: -673.9, y: 343.5 }, 0).wait(1).to({ x: -673, y: 342.9 }, 0).wait(1).to({ x: -672, y: 342.2 }, 0).wait(1).to({ x: -671.1, y: 341.5 }, 0).wait(1).to({ x: -670.2, y: 340.8 }, 0).wait(1).to({ x: -669.2, y: 340.2 }, 0).wait(1).to({ x: -668.3, y: 339.5 }, 0).wait(1).to({ x: -667.3, y: 338.8 }, 0).wait(1).to({ x: -666.4, y: 338.1 }, 0).wait(1).to({ x: -665.5, y: 337.5 }, 0).wait(1).to({ x: -664.5, y: 336.8 }, 0).wait(1).to({ x: -663.6, y: 336.1 }, 0).wait(1).to({ x: -662.7, y: 335.4 }, 0).wait(1).to({ x: -661.7, y: 334.8 }, 0).wait(1).to({ x: -660.8, y: 334.1 }, 0).wait(1).to({ x: -659.8, y: 333.4 }, 0).wait(1).to({ x: -658.9, y: 332.7 }, 0).wait(1).to({ x: -658, y: 332.1 }, 0).wait(1).to({ x: -658.4, y: 331.4 }, 0).wait(1).to({ x: -658.8, y: 330.7 }, 0).wait(1).to({ x: -659.2, y: 330 }, 0).wait(1).to({ x: -659.7, y: 329.3 }, 0).wait(1).to({ x: -660.1, y: 328.6 }, 0).wait(1).to({ x: -660.5, y: 327.9 }, 0).wait(1).to({ x: -660.9, y: 327.2 }, 0).wait(1).to({ x: -661.4, y: 326.6 }, 0).wait(1).to({ x: -661.8, y: 325.9 }, 0).wait(1).to({ x: -662.2, y: 325.2 }, 0).wait(1).to({ x: -662.6, y: 324.5 }, 0).wait(1).to({ x: -663, y: 323.8 }, 0).wait(1).to({ x: -663.5, y: 323.1 }, 0).wait(1).to({ x: -663.9, y: 322.4 }, 0).wait(1).to({ x: -664.3, y: 321.7 }, 0).wait(1).to({ x: -664.7, y: 321.1 }, 0).wait(1).to({ x: -665.2, y: 320.4 }, 0).wait(1).to({ x: -665.6, y: 319.7 }, 0).wait(1).to({ x: -666, y: 319 }, 0).wait(1).to({ x: -666.4, y: 318.3 }, 0).wait(1).to({ x: -666.9, y: 317.6 }, 0).wait(1).to({ x: -667.3, y: 316.9 }, 0).wait(1).to({ x: -667.7, y: 316.2 }, 0).wait(1).to({ x: -668.1, y: 315.6 }, 0).wait(1).to({ x: -668.5, y: 314.9 }, 0).wait(1).to({ x: -669, y: 314.2 }, 0).wait(1).to({ x: -669.4, y: 313.5 }, 0).wait(1).to({ x: -669.8, y: 312.8 }, 0).wait(1).to({ x: -670.2, y: 312.1 }, 0).wait(1).to({ x: -670.7, y: 311.4 }, 0).wait(1).to({ x: -671.1, y: 310.7 }, 0).wait(1).to({ x: -671.5, y: 310.1 }, 0).wait(1).to({ x: -671.9, y: 309.4 }, 0).wait(1).to({ x: -672.4, y: 308.7 }, 0).wait(1).to({ x: -672.8, y: 308 }, 0).wait(1).to({ x: -673.2, y: 307.3 }, 0).wait(1).to({ x: -673.6, y: 306.6 }, 0).wait(1).to({ x: -674.1, y: 305.9 }, 0).wait(1).to({ x: -674.5, y: 305.2 }, 0).wait(1).to({ x: -674.9, y: 304.6 }, 0).wait(1));

        // Layer
        this.instance_2 = new lib.buttonskin();
        this.instance_2.setTransform(-672.8, 289, 1.32, 1.32, 0, 0, 0, 150, 150.1);

        this.timeline.addTween(cjs.Tween.get(this.instance_2).wait(1).to({ regY: 150, x: -673.5, y: 288.8 }, 0).wait(1).to({ x: -674.3 }, 0).wait(1).to({ x: -675 }, 0).wait(1).to({ x: -675.8 }, 0).wait(1).to({ x: -676.5 }, 0).wait(1).to({ x: -677.3 }, 0).wait(1).to({ x: -678 }, 0).wait(1).to({ x: -678.8 }, 0).wait(1).to({ x: -679.5 }, 0).wait(1).to({ x: -680.3 }, 0).wait(1).to({ x: -681 }, 0).wait(1).to({ x: -681.8 }, 0).wait(1).to({ x: -682.5 }, 0).wait(1).to({ x: -683.3 }, 0).wait(1).to({ x: -684 }, 0).wait(1).to({ x: -684.8 }, 0).wait(1).to({ x: -685.5 }, 0).wait(1).to({ x: -686.2 }, 0).wait(1).to({ x: -687 }, 0).wait(1).to({ x: -687.8 }, 0).wait(1).to({ x: -688.5 }, 0).wait(1).to({ x: -689.3 }, 0).wait(1).to({ x: -690 }, 0).wait(1).to({ x: -690.8 }, 0).wait(1).to({ x: -691.5 }, 0).wait(1).to({ x: -692.3 }, 0).wait(1).to({ x: -693 }, 0).wait(1).to({ x: -693.8 }, 0).wait(1).to({ x: -694.5 }, 0).wait(1).to({ x: -695.2 }, 0).wait(1).to({ x: -696 }, 0).wait(1).to({ x: -696.8 }, 0).wait(1).to({ x: -697.5 }, 0).wait(1).to({ x: -698.3 }, 0).wait(1).to({ x: -699 }, 0).wait(1).to({ x: -698.8, y: 290.2 }, 0).wait(1).to({ x: -698.5, y: 291.6 }, 0).wait(1).to({ x: -698.3, y: 293.1 }, 0).wait(1).to({ x: -698.1, y: 294.5 }, 0).wait(1).to({ x: -697.9, y: 295.9 }, 0).wait(1).to({ x: -697.6, y: 297.3 }, 0).wait(1).to({ x: -697.4, y: 298.7 }, 0).wait(1).to({ x: -697.2, y: 300.2 }, 0).wait(1).to({ x: -696.9, y: 301.6 }, 0).wait(1).to({ x: -696.7, y: 303 }, 0).wait(1).to({ x: -696.5, y: 304.4 }, 0).wait(1).to({ x: -696.3, y: 305.8 }, 0).wait(1).to({ x: -696, y: 307.2 }, 0).wait(1).to({ x: -695.8, y: 308.7 }, 0).wait(1).to({ x: -695.6, y: 310.1 }, 0).wait(1).to({ x: -695.3, y: 311.5 }, 0).wait(1).to({ x: -695.1, y: 312.9 }, 0).wait(1).to({ x: -694.9, y: 314.3 }, 0).wait(1).to({ x: -694.7, y: 315.8 }, 0).wait(1).to({ x: -694.4, y: 317.2 }, 0).wait(1).to({ x: -694.2, y: 318.6 }, 0).wait(1).to({ x: -694, y: 320 }, 0).wait(1).to({ x: -693.7, y: 321.4 }, 0).wait(1).to({ x: -693.5, y: 322.9 }, 0).wait(1).to({ x: -693.3, y: 324.3 }, 0).wait(1).to({ x: -693.1, y: 325.7 }, 0).wait(1).to({ x: -692.8, y: 327.1 }, 0).wait(1).to({ x: -692.6, y: 328.5 }, 0).wait(1).to({ x: -692.4, y: 329.9 }, 0).wait(1).to({ x: -692.1, y: 331.4 }, 0).wait(1).to({ x: -691.9, y: 332.8 }, 0).wait(1).to({ x: -691.7, y: 334.2 }, 0).wait(1).to({ x: -691.4, y: 335.6 }, 0).wait(1).to({ x: -691.2, y: 337 }, 0).wait(1).to({ x: -691, y: 338.5 }, 0).wait(1).to({ x: -690.8, y: 339.9 }, 0).wait(1).to({ x: -690.5, y: 341.3 }, 0).wait(1).to({ x: -689.6, y: 340.6 }, 0).wait(1).to({ x: -688.7, y: 339.9 }, 0).wait(1).to({ x: -687.7, y: 339.3 }, 0).wait(1).to({ x: -686.8, y: 338.6 }, 0).wait(1).to({ x: -685.8, y: 337.9 }, 0).wait(1).to({ x: -684.9, y: 337.2 }, 0).wait(1).to({ x: -684, y: 336.6 }, 0).wait(1).to({ x: -683, y: 335.9 }, 0).wait(1).to({ x: -682.1, y: 335.2 }, 0).wait(1).to({ x: -681.1, y: 334.5 }, 0).wait(1).to({ x: -680.2, y: 333.9 }, 0).wait(1).to({ x: -679.3, y: 333.2 }, 0).wait(1).to({ x: -678.3, y: 332.5 }, 0).wait(1).to({ x: -677.4, y: 331.8 }, 0).wait(1).to({ x: -676.5, y: 331.2 }, 0).wait(1).to({ x: -675.5, y: 330.5 }, 0).wait(1).to({ x: -674.6, y: 329.8 }, 0).wait(1).to({ x: -673.6, y: 329.1 }, 0).wait(1).to({ x: -672.7, y: 328.5 }, 0).wait(1).to({ x: -671.8, y: 327.8 }, 0).wait(1).to({ x: -670.8, y: 327.1 }, 0).wait(1).to({ x: -669.9, y: 326.4 }, 0).wait(1).to({ x: -669, y: 325.8 }, 0).wait(1).to({ x: -668, y: 325.1 }, 0).wait(1).to({ x: -667.1, y: 324.4 }, 0).wait(1).to({ x: -666.1, y: 323.7 }, 0).wait(1).to({ x: -665.2, y: 323.1 }, 0).wait(1).to({ x: -664.3, y: 322.4 }, 0).wait(1).to({ x: -663.3, y: 321.7 }, 0).wait(1).to({ x: -662.4, y: 321 }, 0).wait(1).to({ x: -661.4, y: 320.4 }, 0).wait(1).to({ x: -660.5, y: 319.7 }, 0).wait(1).to({ x: -659.6, y: 319 }, 0).wait(1).to({ x: -658.6, y: 318.3 }, 0).wait(1).to({ x: -657.7, y: 317.7 }, 0).wait(1).to({ x: -656.8, y: 317 }, 0).wait(1).to({ x: -655.8, y: 316.3 }, 0).wait(1).to({ x: -656.2, y: 315.6 }, 0).wait(1).to({ x: -656.7, y: 314.9 }, 0).wait(1).to({ x: -657.1, y: 314.2 }, 0).wait(1).to({ x: -657.5, y: 313.5 }, 0).wait(1).to({ x: -657.9, y: 312.9 }, 0).wait(1).to({ x: -658.4, y: 312.2 }, 0).wait(1).to({ x: -658.8, y: 311.5 }, 0).wait(1).to({ x: -659.2, y: 310.8 }, 0).wait(1).to({ x: -659.6, y: 310.1 }, 0).wait(1).to({ x: -660, y: 309.4 }, 0).wait(1).to({ x: -660.5, y: 308.7 }, 0).wait(1).to({ x: -660.9, y: 308 }, 0).wait(1).to({ x: -661.3, y: 307.4 }, 0).wait(1).to({ x: -661.7, y: 306.7 }, 0).wait(1).to({ x: -662.2, y: 306 }, 0).wait(1).to({ x: -662.6, y: 305.3 }, 0).wait(1).to({ x: -663, y: 304.6 }, 0).wait(1).to({ x: -663.4, y: 303.9 }, 0).wait(1).to({ x: -663.9, y: 303.2 }, 0).wait(1).to({ x: -664.3, y: 302.5 }, 0).wait(1).to({ x: -664.7, y: 301.9 }, 0).wait(1).to({ x: -665.1, y: 301.2 }, 0).wait(1).to({ x: -665.6, y: 300.5 }, 0).wait(1).to({ x: -666, y: 299.8 }, 0).wait(1).to({ x: -666.4, y: 299.1 }, 0).wait(1).to({ x: -666.8, y: 298.4 }, 0).wait(1).to({ x: -667.2, y: 297.7 }, 0).wait(1).to({ x: -667.7, y: 297 }, 0).wait(1).to({ x: -668.1, y: 296.4 }, 0).wait(1).to({ x: -668.5, y: 295.7 }, 0).wait(1).to({ x: -668.9, y: 295 }, 0).wait(1).to({ x: -669.4, y: 294.3 }, 0).wait(1).to({ x: -669.8, y: 293.6 }, 0).wait(1).to({ x: -670.2, y: 292.9 }, 0).wait(1).to({ x: -670.6, y: 292.2 }, 0).wait(1).to({ x: -671.1, y: 291.5 }, 0).wait(1).to({ x: -671.5, y: 290.9 }, 0).wait(1).to({ x: -671.9, y: 290.2 }, 0).wait(1).to({ x: -672.3, y: 289.5 }, 0).wait(1).to({ x: -672.8, y: 288.8 }, 0).wait(1));


        // Number
        this.Sequence1 = new lib.number2_ring();
        this.Sequence1.setTransform(197.2, 530.2, 1, 1, 0, 0, 0, 39.9, 37.4);

        this.timeline.addTween(cjs.Tween.get(this.Sequence1).wait(1).to({ regX: -333.9, regY: -29.6, x: -176.1, y: 462.6 }, 0).wait(1).to({ x: -175.5, y: 462 }, 0).wait(1).to({ x: -174.9, y: 461.4 }, 0).wait(1).to({ x: -174.3, y: 460.8 }, 0).wait(1).to({ x: -173.7, y: 460.2 }, 0).wait(1).to({ x: -173.1, y: 459.6 }, 0).wait(1).to({ x: -172.5, y: 459 }, 0).wait(1).to({ x: -171.9, y: 458.4 }, 0).wait(1).to({ x: -171.3, y: 457.8 }, 0).wait(1).to({ x: -170.7, y: 457.2 }, 0).wait(1).to({ x: -170.1, y: 456.6 }, 0).wait(1).to({ x: -169.5, y: 456 }, 0).wait(1).to({ x: -168.9, y: 455.4 }, 0).wait(1).to({ x: -168.3, y: 454.8 }, 0).wait(1).to({ x: -167.7, y: 454.3 }, 0).wait(1).to({ x: -167.1, y: 453.7 }, 0).wait(1).to({ x: -166.5, y: 453.1 }, 0).wait(1).to({ x: -165.9, y: 452.5 }, 0).wait(1).to({ x: -165.3, y: 451.9 }, 0).wait(1).to({ x: -164.7, y: 451.3 }, 0).wait(1).to({ x: -164.1, y: 450.7 }, 0).wait(1).to({ x: -163.5, y: 450.1 }, 0).wait(1).to({ x: -162.9, y: 449.5 }, 0).wait(1).to({ x: -162.3, y: 448.9 }, 0).wait(1).to({ x: -161.7, y: 448.3 }, 0).wait(1).to({ x: -161.1, y: 447.7 }, 0).wait(1).to({ x: -160.5, y: 447.1 }, 0).wait(1).to({ x: -159.9, y: 446.5 }, 0).wait(1).to({ x: -159.3, y: 445.9 }, 0).wait(1).to({ x: -158.8, y: 445.3 }, 0).wait(1).to({ x: -158.2, y: 444.7 }, 0).wait(1).to({ x: -157.6, y: 444.1 }, 0).wait(1).to({ x: -157, y: 443.5 }, 0).wait(1).to({ x: -156.4, y: 442.9 }, 0).wait(1).to({ x: -155.8, y: 442.3 }, 0).wait(1).to({ x: -155.2, y: 441.7 }, 0).wait(1).to({ x: -154.6, y: 441.1 }, 0).wait(1).to({ x: -154, y: 440.5 }, 0).wait(1).to({ x: -153.4, y: 439.9 }, 0).wait(1).to({ x: -152.8, y: 439.3 }, 0).wait(1).to({ x: -152.2, y: 438.7 }, 0).wait(1).to({ x: -151.6, y: 438.1 }, 0).wait(1).to({ x: -151, y: 437.5 }, 0).wait(1).to({ x: -150.4, y: 437 }, 0).wait(1).to({ y: 435.5 }, 0).wait(1).to({ y: 434.1 }, 0).wait(1).to({ y: 432.7 }, 0).wait(1).to({ y: 431.3 }, 0).wait(1).to({ y: 429.9 }, 0).wait(1).to({ y: 428.4 }, 0).wait(1).to({ y: 427 }, 0).wait(1).to({ y: 425.6 }, 0).wait(1).to({ y: 424.2 }, 0).wait(1).to({ y: 422.8 }, 0).wait(1).to({ y: 421.3 }, 0).wait(1).to({ y: 419.9 }, 0).wait(1).to({ y: 418.5 }, 0).wait(1).to({ y: 417.1 }, 0).wait(1).to({ y: 415.7 }, 0).wait(1).to({ y: 414.2 }, 0).wait(1).to({ y: 412.8 }, 0).wait(1).to({ y: 411.4 }, 0).wait(1).to({ y: 410 }, 0).wait(1).to({ y: 408.6 }, 0).wait(1).to({ y: 407.2 }, 0).wait(1).to({ y: 405.7 }, 0).wait(1).to({ y: 404.3 }, 0).wait(1).to({ y: 402.9 }, 0).wait(1).to({ y: 401.5 }, 0).wait(1).to({ y: 400.1 }, 0).wait(1).to({ y: 398.6 }, 0).wait(1).to({ y: 397.2 }, 0).wait(1).to({ y: 395.8 }, 0).wait(1).to({ y: 394.4 }, 0).wait(1).to({ y: 393 }, 0).wait(1).to({ y: 391.5 }, 0).wait(1).to({ y: 390.1 }, 0).wait(1).to({ y: 388.7 }, 0).wait(1).to({ y: 387.3 }, 0).wait(1).to({ y: 385.9 }, 0).wait(1).to({ y: 384.5 }, 0).wait(1).to({ x: -151.8 }, 0).wait(1).to({ x: -153.2 }, 0).wait(1).to({ x: -154.7 }, 0).wait(1).to({ x: -156.1 }, 0).wait(1).to({ x: -157.5 }, 0).wait(1).to({ x: -158.9 }, 0).wait(1).to({ x: -160.3 }, 0).wait(1).to({ x: -161.8 }, 0).wait(1).to({ x: -163.2 }, 0).wait(1).to({ x: -164.6 }, 0).wait(1).to({ x: -166 }, 0).wait(1).to({ x: -167.4 }, 0).wait(1).to({ x: -168.8 }, 0).wait(1).to({ x: -170.3 }, 0).wait(1).to({ x: -171.7 }, 0).wait(1).to({ x: -173.1 }, 0).wait(1).to({ x: -174.5 }, 0).wait(1).to({ x: -175.9 }, 0).wait(1).to({ x: -177.4 }, 0).wait(1).to({ x: -178.8 }, 0).wait(1).to({ x: -180.2 }, 0).wait(1).to({ x: -181.6 }, 0).wait(1).to({ x: -183 }, 0).wait(1).to({ x: -184.5 }, 0).wait(1).to({ x: -185.9 }, 0).wait(1).to({ x: -187.3 }, 0).wait(1).to({ x: -188.7 }, 0).wait(1).to({ x: -190.1 }, 0).wait(1).to({ x: -191.5 }, 0).wait(1).to({ x: -193 }, 0).wait(1).to({ x: -194.4 }, 0).wait(1).to({ x: -195.8 }, 0).wait(1).to({ x: -197.2 }, 0).wait(1).to({ x: -198.6 }, 0).wait(1).to({ x: -200.1 }, 0).wait(1).to({ x: -201.5 }, 0).wait(1).to({ x: -202.9 }, 0).wait(1).to({ x: -202.1, y: 387 }, 0).wait(1).to({ x: -201.2, y: 389.5 }, 0).wait(1).to({ x: -200.4, y: 392.1 }, 0).wait(1).to({ x: -199.5, y: 394.6 }, 0).wait(1).to({ x: -198.7, y: 397.2 }, 0).wait(1).to({ x: -197.8, y: 399.7 }, 0).wait(1).to({ x: -197, y: 402.2 }, 0).wait(1).to({ x: -196.1, y: 404.8 }, 0).wait(1).to({ x: -195.3, y: 407.3 }, 0).wait(1).to({ x: -194.4, y: 409.9 }, 0).wait(1).to({ x: -193.6, y: 412.4 }, 0).wait(1).to({ x: -192.7, y: 414.9 }, 0).wait(1).to({ x: -191.9, y: 417.5 }, 0).wait(1).to({ x: -191, y: 420 }, 0).wait(1).to({ x: -190.2, y: 422.6 }, 0).wait(1).to({ x: -189.4, y: 425.1 }, 0).wait(1).to({ x: -188.5, y: 427.6 }, 0).wait(1).to({ x: -187.7, y: 430.2 }, 0).wait(1).to({ x: -186.8, y: 432.7 }, 0).wait(1).to({ x: -186, y: 435.3 }, 0).wait(1).to({ x: -185.1, y: 437.8 }, 0).wait(1).to({ x: -184.3, y: 440.3 }, 0).wait(1).to({ x: -183.4, y: 442.9 }, 0).wait(1).to({ x: -182.6, y: 445.4 }, 0).wait(1).to({ x: -181.7, y: 448 }, 0).wait(1).to({ x: -180.9, y: 450.5 }, 0).wait(1).to({ x: -180, y: 453 }, 0).wait(1).to({ x: -179.2, y: 455.6 }, 0).wait(1).to({ x: -178.3, y: 458.1 }, 0).wait(1).to({ x: -177.5, y: 460.7 }, 0).wait(1).to({ x: -176.6, y: 463.2 }, 0).wait(1));

        // text
        this.Message1 = new lib._2touchcopy();
        this.Message1.setTransform(-412.4, 358.1);

        this.timeline.addTween(cjs.Tween.get(this.Message1).wait(1).to({ regX: 239.9, regY: 268.7, x: -171.9, y: 626.2 }, 0).wait(1).to({ x: -171.3, y: 625.6 }, 0).wait(1).to({ x: -170.7, y: 625 }, 0).wait(1).to({ x: -170.1, y: 624.4 }, 0).wait(1).to({ x: -169.5, y: 623.8 }, 0).wait(1).to({ x: -168.9, y: 623.2 }, 0).wait(1).to({ x: -168.3, y: 622.6 }, 0).wait(1).to({ x: -167.7, y: 622 }, 0).wait(1).to({ x: -167.1, y: 621.4 }, 0).wait(1).to({ x: -166.5, y: 620.8 }, 0).wait(1).to({ x: -165.9, y: 620.2 }, 0).wait(1).to({ x: -165.3, y: 619.6 }, 0).wait(1).to({ x: -164.7, y: 619 }, 0).wait(1).to({ x: -164.1, y: 618.4 }, 0).wait(1).to({ x: -163.5, y: 617.9 }, 0).wait(1).to({ x: -162.9, y: 617.3 }, 0).wait(1).to({ x: -162.3, y: 616.7 }, 0).wait(1).to({ x: -161.7, y: 616.1 }, 0).wait(1).to({ x: -161.1, y: 615.5 }, 0).wait(1).to({ x: -160.5, y: 614.9 }, 0).wait(1).to({ x: -159.9, y: 614.3 }, 0).wait(1).to({ x: -159.3, y: 613.7 }, 0).wait(1).to({ x: -158.7, y: 613.1 }, 0).wait(1).to({ x: -158.1, y: 612.5 }, 0).wait(1).to({ x: -157.5, y: 611.9 }, 0).wait(1).to({ x: -156.9, y: 611.3 }, 0).wait(1).to({ x: -156.3, y: 610.7 }, 0).wait(1).to({ x: -155.7, y: 610.1 }, 0).wait(1).to({ x: -155.1, y: 609.5 }, 0).wait(1).to({ x: -154.6, y: 608.9 }, 0).wait(1).to({ x: -154, y: 608.3 }, 0).wait(1).to({ x: -153.4, y: 607.7 }, 0).wait(1).to({ x: -152.8, y: 607.1 }, 0).wait(1).to({ x: -152.2, y: 606.5 }, 0).wait(1).to({ x: -151.6, y: 605.9 }, 0).wait(1).to({ x: -151, y: 605.3 }, 0).wait(1).to({ x: -150.4, y: 604.7 }, 0).wait(1).to({ x: -149.8, y: 604.1 }, 0).wait(1).to({ x: -149.2, y: 603.5 }, 0).wait(1).to({ x: -148.6, y: 602.9 }, 0).wait(1).to({ x: -148, y: 602.3 }, 0).wait(1).to({ x: -147.4, y: 601.7 }, 0).wait(1).to({ x: -146.8, y: 601.1 }, 0).wait(1).to({ x: -146.2, y: 600.6 }, 0).wait(1).to({ y: 599.1 }, 0).wait(1).to({ y: 597.7 }, 0).wait(1).to({ y: 596.3 }, 0).wait(1).to({ y: 594.9 }, 0).wait(1).to({ y: 593.5 }, 0).wait(1).to({ y: 592 }, 0).wait(1).to({ y: 590.6 }, 0).wait(1).to({ y: 589.2 }, 0).wait(1).to({ y: 587.8 }, 0).wait(1).to({ y: 586.4 }, 0).wait(1).to({ y: 584.9 }, 0).wait(1).to({ y: 583.5 }, 0).wait(1).to({ y: 582.1 }, 0).wait(1).to({ y: 580.7 }, 0).wait(1).to({ y: 579.3 }, 0).wait(1).to({ y: 577.8 }, 0).wait(1).to({ y: 576.4 }, 0).wait(1).to({ y: 575 }, 0).wait(1).to({ y: 573.6 }, 0).wait(1).to({ y: 572.2 }, 0).wait(1).to({ y: 570.8 }, 0).wait(1).to({ y: 569.3 }, 0).wait(1).to({ y: 567.9 }, 0).wait(1).to({ y: 566.5 }, 0).wait(1).to({ y: 565.1 }, 0).wait(1).to({ y: 563.7 }, 0).wait(1).to({ y: 562.2 }, 0).wait(1).to({ y: 560.8 }, 0).wait(1).to({ y: 559.4 }, 0).wait(1).to({ y: 558 }, 0).wait(1).to({ y: 556.6 }, 0).wait(1).to({ y: 555.1 }, 0).wait(1).to({ y: 553.7 }, 0).wait(1).to({ y: 552.3 }, 0).wait(1).to({ y: 550.9 }, 0).wait(1).to({ y: 549.5 }, 0).wait(1).to({ y: 548.1 }, 0).wait(1).to({ x: -147.6 }, 0).wait(1).to({ x: -149 }, 0).wait(1).to({ x: -150.5 }, 0).wait(1).to({ x: -151.9 }, 0).wait(1).to({ x: -153.3 }, 0).wait(1).to({ x: -154.7 }, 0).wait(1).to({ x: -156.1 }, 0).wait(1).to({ x: -157.6 }, 0).wait(1).to({ x: -159 }, 0).wait(1).to({ x: -160.4 }, 0).wait(1).to({ x: -161.8 }, 0).wait(1).to({ x: -163.2 }, 0).wait(1).to({ x: -164.6 }, 0).wait(1).to({ x: -166.1 }, 0).wait(1).to({ x: -167.5 }, 0).wait(1).to({ x: -168.9 }, 0).wait(1).to({ x: -170.3 }, 0).wait(1).to({ x: -171.7 }, 0).wait(1).to({ x: -173.2 }, 0).wait(1).to({ x: -174.6 }, 0).wait(1).to({ x: -176 }, 0).wait(1).to({ x: -177.4 }, 0).wait(1).to({ x: -178.8 }, 0).wait(1).to({ x: -180.3 }, 0).wait(1).to({ x: -181.7 }, 0).wait(1).to({ x: -183.1 }, 0).wait(1).to({ x: -184.5 }, 0).wait(1).to({ x: -185.9 }, 0).wait(1).to({ x: -187.3 }, 0).wait(1).to({ x: -188.8 }, 0).wait(1).to({ x: -190.2 }, 0).wait(1).to({ x: -191.6 }, 0).wait(1).to({ x: -193 }, 0).wait(1).to({ x: -194.4 }, 0).wait(1).to({ x: -195.9 }, 0).wait(1).to({ x: -197.3 }, 0).wait(1).to({ x: -198.7 }, 0).wait(1).to({ x: -197.9, y: 550.6 }, 0).wait(1).to({ x: -197, y: 553.1 }, 0).wait(1).to({ x: -196.2, y: 555.7 }, 0).wait(1).to({ x: -195.3, y: 558.2 }, 0).wait(1).to({ x: -194.5, y: 560.8 }, 0).wait(1).to({ x: -193.6, y: 563.3 }, 0).wait(1).to({ x: -192.8, y: 565.8 }, 0).wait(1).to({ x: -191.9, y: 568.4 }, 0).wait(1).to({ x: -191.1, y: 570.9 }, 0).wait(1).to({ x: -190.2, y: 573.5 }, 0).wait(1).to({ x: -189.4, y: 576 }, 0).wait(1).to({ x: -188.5, y: 578.5 }, 0).wait(1).to({ x: -187.7, y: 581.1 }, 0).wait(1).to({ x: -186.8, y: 583.6 }, 0).wait(1).to({ x: -186, y: 586.2 }, 0).wait(1).to({ x: -185.2, y: 588.7 }, 0).wait(1).to({ x: -184.3, y: 591.2 }, 0).wait(1).to({ x: -183.5, y: 593.8 }, 0).wait(1).to({ x: -182.6, y: 596.3 }, 0).wait(1).to({ x: -181.8, y: 598.9 }, 0).wait(1).to({ x: -180.9, y: 601.4 }, 0).wait(1).to({ x: -180.1, y: 603.9 }, 0).wait(1).to({ x: -179.2, y: 606.5 }, 0).wait(1).to({ x: -178.4, y: 609 }, 0).wait(1).to({ x: -177.5, y: 611.6 }, 0).wait(1).to({ x: -176.7, y: 614.1 }, 0).wait(1).to({ x: -175.8, y: 616.6 }, 0).wait(1).to({ x: -175, y: 619.2 }, 0).wait(1).to({ x: -174.1, y: 621.7 }, 0).wait(1).to({ x: -173.3, y: 624.3 }, 0).wait(1).to({ x: -172.5, y: 626.8 }, 0).wait(1));

        // Layer
        this.instance_1 = new lib.buttonskin();
        this.instance_1.setTransform(-170.3, 611.1, 1.32, 1.32, 0, 0, 0, 150.1, 150);

        this.timeline.addTween(cjs.Tween.get(this.instance_1).wait(1).to({ regX: 150, x: -169.8, y: 610.5 }, 0).wait(1).to({ x: -169.2, y: 609.9 }, 0).wait(1).to({ x: -168.6, y: 609.3 }, 0).wait(1).to({ x: -168, y: 608.7 }, 0).wait(1).to({ x: -167.4, y: 608.1 }, 0).wait(1).to({ x: -166.8, y: 607.5 }, 0).wait(1).to({ x: -166.2, y: 606.9 }, 0).wait(1).to({ x: -165.6, y: 606.3 }, 0).wait(1).to({ x: -165, y: 605.7 }, 0).wait(1).to({ x: -164.4, y: 605.1 }, 0).wait(1).to({ x: -163.8, y: 604.5 }, 0).wait(1).to({ x: -163.2, y: 603.9 }, 0).wait(1).to({ x: -162.6, y: 603.3 }, 0).wait(1).to({ x: -162, y: 602.7 }, 0).wait(1).to({ x: -161.4, y: 602.1 }, 0).wait(1).to({ x: -160.8, y: 601.6 }, 0).wait(1).to({ x: -160.2, y: 601 }, 0).wait(1).to({ x: -159.6, y: 600.4 }, 0).wait(1).to({ x: -159, y: 599.8 }, 0).wait(1).to({ x: -158.4, y: 599.2 }, 0).wait(1).to({ x: -157.8, y: 598.6 }, 0).wait(1).to({ x: -157.2, y: 598 }, 0).wait(1).to({ x: -156.6, y: 597.4 }, 0).wait(1).to({ x: -156, y: 596.8 }, 0).wait(1).to({ x: -155.4, y: 596.2 }, 0).wait(1).to({ x: -154.8, y: 595.6 }, 0).wait(1).to({ x: -154.2, y: 595 }, 0).wait(1).to({ x: -153.6, y: 594.4 }, 0).wait(1).to({ x: -153.1, y: 593.8 }, 0).wait(1).to({ x: -152.5, y: 593.2 }, 0).wait(1).to({ x: -151.9, y: 592.6 }, 0).wait(1).to({ x: -151.3, y: 592 }, 0).wait(1).to({ x: -150.7, y: 591.4 }, 0).wait(1).to({ x: -150.1, y: 590.8 }, 0).wait(1).to({ x: -149.5, y: 590.2 }, 0).wait(1).to({ x: -148.9, y: 589.6 }, 0).wait(1).to({ x: -148.3, y: 589 }, 0).wait(1).to({ x: -147.7, y: 588.4 }, 0).wait(1).to({ x: -147.1, y: 587.8 }, 0).wait(1).to({ x: -146.5, y: 587.2 }, 0).wait(1).to({ x: -145.9, y: 586.6 }, 0).wait(1).to({ x: -145.3, y: 586 }, 0).wait(1).to({ x: -144.7, y: 585.4 }, 0).wait(1).to({ x: -144.1, y: 584.8 }, 0).wait(1).to({ y: 583.4 }, 0).wait(1).to({ y: 582 }, 0).wait(1).to({ y: 580.6 }, 0).wait(1).to({ y: 579.2 }, 0).wait(1).to({ y: 577.8 }, 0).wait(1).to({ y: 576.3 }, 0).wait(1).to({ y: 574.9 }, 0).wait(1).to({ y: 573.5 }, 0).wait(1).to({ y: 572.1 }, 0).wait(1).to({ y: 570.7 }, 0).wait(1).to({ y: 569.2 }, 0).wait(1).to({ y: 567.8 }, 0).wait(1).to({ y: 566.4 }, 0).wait(1).to({ y: 565 }, 0).wait(1).to({ y: 563.6 }, 0).wait(1).to({ y: 562.1 }, 0).wait(1).to({ y: 560.7 }, 0).wait(1).to({ y: 559.3 }, 0).wait(1).to({ y: 557.9 }, 0).wait(1).to({ y: 556.5 }, 0).wait(1).to({ y: 555.1 }, 0).wait(1).to({ y: 553.6 }, 0).wait(1).to({ y: 552.2 }, 0).wait(1).to({ y: 550.8 }, 0).wait(1).to({ y: 549.4 }, 0).wait(1).to({ y: 548 }, 0).wait(1).to({ y: 546.5 }, 0).wait(1).to({ y: 545.1 }, 0).wait(1).to({ y: 543.7 }, 0).wait(1).to({ y: 542.3 }, 0).wait(1).to({ y: 540.9 }, 0).wait(1).to({ y: 539.4 }, 0).wait(1).to({ y: 538 }, 0).wait(1).to({ y: 536.6 }, 0).wait(1).to({ y: 535.2 }, 0).wait(1).to({ y: 533.8 }, 0).wait(1).to({ y: 532.3 }, 0).wait(1).to({ x: -145.5 }, 0).wait(1).to({ x: -146.9 }, 0).wait(1).to({ x: -148.4 }, 0).wait(1).to({ x: -149.8 }, 0).wait(1).to({ x: -151.2 }, 0).wait(1).to({ x: -152.6 }, 0).wait(1).to({ x: -154 }, 0).wait(1).to({ x: -155.5 }, 0).wait(1).to({ x: -156.9 }, 0).wait(1).to({ x: -158.3 }, 0).wait(1).to({ x: -159.7 }, 0).wait(1).to({ x: -161.1 }, 0).wait(1).to({ x: -162.5 }, 0).wait(1).to({ x: -164 }, 0).wait(1).to({ x: -165.4 }, 0).wait(1).to({ x: -166.8 }, 0).wait(1).to({ x: -168.2 }, 0).wait(1).to({ x: -169.6 }, 0).wait(1).to({ x: -171.1 }, 0).wait(1).to({ x: -172.5 }, 0).wait(1).to({ x: -173.9 }, 0).wait(1).to({ x: -175.3 }, 0).wait(1).to({ x: -176.7 }, 0).wait(1).to({ x: -178.2 }, 0).wait(1).to({ x: -179.6 }, 0).wait(1).to({ x: -181 }, 0).wait(1).to({ x: -182.4 }, 0).wait(1).to({ x: -183.8 }, 0).wait(1).to({ x: -185.3 }, 0).wait(1).to({ x: -186.7 }, 0).wait(1).to({ x: -188.1 }, 0).wait(1).to({ x: -189.5 }, 0).wait(1).to({ x: -190.9 }, 0).wait(1).to({ x: -192.3 }, 0).wait(1).to({ x: -193.8 }, 0).wait(1).to({ x: -195.2 }, 0).wait(1).to({ x: -196.6 }, 0).wait(1).to({ x: -195.8, y: 534.9 }, 0).wait(1).to({ x: -194.9, y: 537.4 }, 0).wait(1).to({ x: -194.1, y: 540 }, 0).wait(1).to({ x: -193.2, y: 542.5 }, 0).wait(1).to({ x: -192.4, y: 545 }, 0).wait(1).to({ x: -191.5, y: 547.6 }, 0).wait(1).to({ x: -190.7, y: 550.1 }, 0).wait(1).to({ x: -189.8, y: 552.7 }, 0).wait(1).to({ x: -189, y: 555.2 }, 0).wait(1).to({ x: -188.1, y: 557.8 }, 0).wait(1).to({ x: -187.3, y: 560.3 }, 0).wait(1).to({ x: -186.4, y: 562.8 }, 0).wait(1).to({ x: -185.6, y: 565.4 }, 0).wait(1).to({ x: -184.7, y: 567.9 }, 0).wait(1).to({ x: -183.9, y: 570.5 }, 0).wait(1).to({ x: -183.1, y: 573 }, 0).wait(1).to({ x: -182.2, y: 575.5 }, 0).wait(1).to({ x: -181.4, y: 578.1 }, 0).wait(1).to({ x: -180.5, y: 580.6 }, 0).wait(1).to({ x: -179.7, y: 583.2 }, 0).wait(1).to({ x: -178.8, y: 585.7 }, 0).wait(1).to({ x: -178, y: 588.2 }, 0).wait(1).to({ x: -177.1, y: 590.8 }, 0).wait(1).to({ x: -176.3, y: 593.3 }, 0).wait(1).to({ x: -175.4, y: 595.9 }, 0).wait(1).to({ x: -174.6, y: 598.4 }, 0).wait(1).to({ x: -173.7, y: 600.9 }, 0).wait(1).to({ x: -172.9, y: 603.5 }, 0).wait(1).to({ x: -172, y: 606 }, 0).wait(1).to({ x: -171.2, y: 608.6 }, 0).wait(1).to({ x: -170.4, y: 611.1 }, 0).wait(1));


        // Number
        this.Sequence2 = new lib.number3_ring();
        this.Sequence2.setTransform(799.7, 330.1, 1, 1, 0, 0, 0, 39.9, 37.4);

        this.timeline.addTween(cjs.Tween.get(this.Sequence2).wait(1).to({ regX: -333.9, regY: -29.6, x: 425.9, y: 264.7 }, 0).wait(1).to({ y: 266.4 }, 0).wait(1).to({ y: 268.1 }, 0).wait(1).to({ y: 269.8 }, 0).wait(1).to({ y: 271.5 }, 0).wait(1).to({ y: 273.2 }, 0).wait(1).to({ y: 274.9 }, 0).wait(1).to({ y: 276.6 }, 0).wait(1).to({ y: 278.3 }, 0).wait(1).to({ y: 280 }, 0).wait(1).to({ y: 281.7 }, 0).wait(1).to({ y: 283.4 }, 0).wait(1).to({ y: 285.1 }, 0).wait(1).to({ y: 286.8 }, 0).wait(1).to({ y: 288.5 }, 0).wait(1).to({ y: 290.1 }, 0).wait(1).to({ y: 291.8 }, 0).wait(1).to({ y: 293.5 }, 0).wait(1).to({ y: 295.2 }, 0).wait(1).to({ y: 296.9 }, 0).wait(1).to({ y: 298.6 }, 0).wait(1).to({ y: 300.3 }, 0).wait(1).to({ y: 302 }, 0).wait(1).to({ y: 303.7 }, 0).wait(1).to({ y: 305.4 }, 0).wait(1).to({ y: 307.1 }, 0).wait(1).to({ y: 308.8 }, 0).wait(1).to({ y: 310.5 }, 0).wait(1).to({ y: 312.2 }, 0).wait(1).to({ y: 313.9 }, 0).wait(1).to({ y: 315.6 }, 0).wait(1).to({ x: 424.8, y: 314.8 }, 0).wait(1).to({ x: 423.7, y: 314 }, 0).wait(1).to({ x: 422.6, y: 313.3 }, 0).wait(1).to({ x: 421.5, y: 312.5 }, 0).wait(1).to({ x: 420.4, y: 311.8 }, 0).wait(1).to({ x: 419.3, y: 311 }, 0).wait(1).to({ x: 418.2, y: 310.2 }, 0).wait(1).to({ x: 417.1, y: 309.5 }, 0).wait(1).to({ x: 416, y: 308.7 }, 0).wait(1).to({ x: 414.9, y: 308 }, 0).wait(1).to({ x: 413.8, y: 307.2 }, 0).wait(1).to({ x: 412.7, y: 306.4 }, 0).wait(1).to({ x: 411.6, y: 305.7 }, 0).wait(1).to({ x: 410.5, y: 304.9 }, 0).wait(1).to({ x: 409.4, y: 304.2 }, 0).wait(1).to({ x: 408.4, y: 303.4 }, 0).wait(1).to({ x: 407.3, y: 302.6 }, 0).wait(1).to({ x: 406.2, y: 301.9 }, 0).wait(1).to({ x: 405.1, y: 301.1 }, 0).wait(1).to({ x: 404, y: 300.4 }, 0).wait(1).to({ x: 402.9, y: 299.6 }, 0).wait(1).to({ x: 401.8, y: 298.8 }, 0).wait(1).to({ x: 400.7, y: 298.1 }, 0).wait(1).to({ x: 399.6, y: 297.3 }, 0).wait(1).to({ x: 399.9, y: 295.8 }, 0).wait(1).to({ x: 400.1, y: 294.3 }, 0).wait(1).to({ x: 400.4, y: 292.7 }, 0).wait(1).to({ x: 400.6, y: 291.2 }, 0).wait(1).to({ x: 400.9, y: 289.7 }, 0).wait(1).to({ x: 401.1, y: 288.2 }, 0).wait(1).to({ x: 401.4, y: 286.6 }, 0).wait(1).to({ x: 401.6, y: 285.1 }, 0).wait(1).to({ x: 401.9, y: 283.6 }, 0).wait(1).to({ x: 402.1, y: 282.1 }, 0).wait(1).to({ x: 402.4, y: 280.5 }, 0).wait(1).to({ x: 402.6, y: 279 }, 0).wait(1).to({ x: 402.9, y: 277.5 }, 0).wait(1).to({ x: 403.2, y: 276 }, 0).wait(1).to({ x: 403.4, y: 274.5 }, 0).wait(1).to({ x: 403.7, y: 272.9 }, 0).wait(1).to({ x: 403.9, y: 271.4 }, 0).wait(1).to({ x: 404.2, y: 269.9 }, 0).wait(1).to({ x: 404.4, y: 268.4 }, 0).wait(1).to({ x: 404.7, y: 266.8 }, 0).wait(1).to({ x: 404.9, y: 265.3 }, 0).wait(1).to({ x: 405.2, y: 263.8 }, 0).wait(1).to({ x: 405.4, y: 262.3 }, 0).wait(1).to({ x: 405.7, y: 260.7 }, 0).wait(1).to({ x: 405.9, y: 259.2 }, 0).wait(1).to({ x: 406.2, y: 257.7 }, 0).wait(1).to({ x: 406.5, y: 256.2 }, 0).wait(1).to({ x: 406.7, y: 254.6 }, 0).wait(1).to({ x: 407, y: 253.1 }, 0).wait(1).to({ x: 407.2, y: 251.6 }, 0).wait(1).to({ x: 407.5, y: 250.1 }, 0).wait(1).to({ x: 407.7, y: 248.5 }, 0).wait(1).to({ x: 408, y: 247 }, 0).wait(1).to({ x: 408.2, y: 245.5 }, 0).wait(1).to({ x: 408.5, y: 244 }, 0).wait(1).to({ x: 408.7, y: 242.4 }, 0).wait(1).to({ x: 409, y: 240.9 }, 0).wait(1).to({ x: 409.2, y: 239.4 }, 0).wait(1).to({ x: 409.5, y: 237.9 }, 0).wait(1).to({ x: 409.8, y: 236.3 }, 0).wait(1).to({ x: 410, y: 234.8 }, 0).wait(1).to({ x: 410.3, y: 233.3 }, 0).wait(1).to({ x: 410.5, y: 231.8 }, 0).wait(1).to({ x: 410.8, y: 230.2 }, 0).wait(1).to({ x: 411.9, y: 230 }, 0).wait(1).to({ x: 413.1, y: 229.8 }, 0).wait(1).to({ x: 414.3, y: 229.6 }, 0).wait(1).to({ x: 415.5, y: 229.3 }, 0).wait(1).to({ x: 416.6, y: 229.1 }, 0).wait(1).to({ x: 417.8, y: 228.9 }, 0).wait(1).to({ x: 419, y: 228.6 }, 0).wait(1).to({ x: 420.2, y: 228.4 }, 0).wait(1).to({ x: 421.3, y: 228.2 }, 0).wait(1).to({ x: 422.5, y: 228 }, 0).wait(1).to({ x: 423.7, y: 227.7 }, 0).wait(1).to({ x: 424.8, y: 227.5 }, 0).wait(1).to({ x: 426, y: 227.3 }, 0).wait(1).to({ x: 427.2, y: 227.1 }, 0).wait(1).to({ x: 428.4, y: 226.8 }, 0).wait(1).to({ x: 429.5, y: 226.6 }, 0).wait(1).to({ x: 430.7, y: 226.4 }, 0).wait(1).to({ x: 431.9, y: 226.2 }, 0).wait(1).to({ x: 433.1, y: 225.9 }, 0).wait(1).to({ x: 434.2, y: 225.7 }, 0).wait(1).to({ x: 435.4, y: 225.5 }, 0).wait(1).to({ x: 436.6, y: 225.2 }, 0).wait(1).to({ x: 437.7, y: 225 }, 0).wait(1).to({ x: 438.9, y: 224.8 }, 0).wait(1).to({ x: 440.1, y: 224.6 }, 0).wait(1).to({ x: 441.3, y: 224.3 }, 0).wait(1).to({ x: 442.4, y: 224.1 }, 0).wait(1).to({ x: 443.6, y: 223.9 }, 0).wait(1).to({ x: 444.8, y: 223.7 }, 0).wait(1).to({ x: 446, y: 223.4 }, 0).wait(1).to({ x: 445, y: 225.4 }, 0).wait(1).to({ x: 443.9, y: 227.4 }, 0).wait(1).to({ x: 442.9, y: 229.4 }, 0).wait(1).to({ x: 441.9, y: 231.4 }, 0).wait(1).to({ x: 440.9, y: 233.3 }, 0).wait(1).to({ x: 439.9, y: 235.3 }, 0).wait(1).to({ x: 438.9, y: 237.3 }, 0).wait(1).to({ x: 437.9, y: 239.3 }, 0).wait(1).to({ x: 436.9, y: 241.3 }, 0).wait(1).to({ x: 435.9, y: 243.2 }, 0).wait(1).to({ x: 434.9, y: 245.2 }, 0).wait(1).to({ x: 433.9, y: 247.2 }, 0).wait(1).to({ x: 432.9, y: 249.2 }, 0).wait(1).to({ x: 431.9, y: 251.2 }, 0).wait(1).to({ x: 430.9, y: 253.1 }, 0).wait(1).to({ x: 429.9, y: 255.1 }, 0).wait(1).to({ x: 428.9, y: 257.1 }, 0).wait(1).to({ x: 427.9, y: 259.1 }, 0).wait(1).to({ x: 426.9, y: 261.1 }, 0).wait(1).to({ x: 425.9, y: 263.1 }, 0).wait(1));

        // text
        this.Message2 = new lib._3touchcopy();
        this.Message2.setTransform(190.1, 158);

        this.timeline.addTween(cjs.Tween.get(this.Message2).wait(1).to({ regX: 239.9, regY: 268.7, x: 430, y: 428.3 }, 0).wait(1).to({ y: 430 }, 0).wait(1).to({ y: 431.7 }, 0).wait(1).to({ y: 433.4 }, 0).wait(1).to({ y: 435.1 }, 0).wait(1).to({ y: 436.8 }, 0).wait(1).to({ y: 438.5 }, 0).wait(1).to({ y: 440.2 }, 0).wait(1).to({ y: 441.9 }, 0).wait(1).to({ y: 443.6 }, 0).wait(1).to({ y: 445.3 }, 0).wait(1).to({ y: 447 }, 0).wait(1).to({ y: 448.7 }, 0).wait(1).to({ y: 450.4 }, 0).wait(1).to({ y: 452.1 }, 0).wait(1).to({ y: 453.7 }, 0).wait(1).to({ y: 455.4 }, 0).wait(1).to({ y: 457.1 }, 0).wait(1).to({ y: 458.8 }, 0).wait(1).to({ y: 460.5 }, 0).wait(1).to({ y: 462.2 }, 0).wait(1).to({ y: 463.9 }, 0).wait(1).to({ y: 465.6 }, 0).wait(1).to({ y: 467.3 }, 0).wait(1).to({ y: 469 }, 0).wait(1).to({ y: 470.7 }, 0).wait(1).to({ y: 472.4 }, 0).wait(1).to({ y: 474.1 }, 0).wait(1).to({ y: 475.8 }, 0).wait(1).to({ y: 477.5 }, 0).wait(1).to({ y: 479.2 }, 0).wait(1).to({ x: 428.9, y: 478.4 }, 0).wait(1).to({ x: 427.8, y: 477.6 }, 0).wait(1).to({ x: 426.7, y: 476.9 }, 0).wait(1).to({ x: 425.6, y: 476.1 }, 0).wait(1).to({ x: 424.5, y: 475.4 }, 0).wait(1).to({ x: 423.4, y: 474.6 }, 0).wait(1).to({ x: 422.3, y: 473.8 }, 0).wait(1).to({ x: 421.3, y: 473.1 }, 0).wait(1).to({ x: 420.2, y: 472.3 }, 0).wait(1).to({ x: 419.1, y: 471.6 }, 0).wait(1).to({ x: 418, y: 470.8 }, 0).wait(1).to({ x: 416.9, y: 470 }, 0).wait(1).to({ x: 415.8, y: 469.3 }, 0).wait(1).to({ x: 414.7, y: 468.5 }, 0).wait(1).to({ x: 413.6, y: 467.8 }, 0).wait(1).to({ x: 412.5, y: 467 }, 0).wait(1).to({ x: 411.4, y: 466.2 }, 0).wait(1).to({ x: 410.3, y: 465.5 }, 0).wait(1).to({ x: 409.2, y: 464.7 }, 0).wait(1).to({ x: 408.1, y: 464 }, 0).wait(1).to({ x: 407, y: 463.2 }, 0).wait(1).to({ x: 405.9, y: 462.4 }, 0).wait(1).to({ x: 404.8, y: 461.7 }, 0).wait(1).to({ x: 403.8, y: 460.9 }, 0).wait(1).to({ x: 404, y: 459.4 }, 0).wait(1).to({ x: 404.3, y: 457.9 }, 0).wait(1).to({ x: 404.5, y: 456.3 }, 0).wait(1).to({ x: 404.8, y: 454.8 }, 0).wait(1).to({ x: 405, y: 453.3 }, 0).wait(1).to({ x: 405.3, y: 451.8 }, 0).wait(1).to({ x: 405.5, y: 450.2 }, 0).wait(1).to({ x: 405.8, y: 448.7 }, 0).wait(1).to({ x: 406, y: 447.2 }, 0).wait(1).to({ x: 406.3, y: 445.7 }, 0).wait(1).to({ x: 406.5, y: 444.1 }, 0).wait(1).to({ x: 406.8, y: 442.6 }, 0).wait(1).to({ x: 407.1, y: 441.1 }, 0).wait(1).to({ x: 407.3, y: 439.6 }, 0).wait(1).to({ x: 407.6, y: 438.1 }, 0).wait(1).to({ x: 407.8, y: 436.5 }, 0).wait(1).to({ x: 408.1, y: 435 }, 0).wait(1).to({ x: 408.3, y: 433.5 }, 0).wait(1).to({ x: 408.6, y: 432 }, 0).wait(1).to({ x: 408.8, y: 430.4 }, 0).wait(1).to({ x: 409.1, y: 428.9 }, 0).wait(1).to({ x: 409.3, y: 427.4 }, 0).wait(1).to({ x: 409.6, y: 425.9 }, 0).wait(1).to({ x: 409.8, y: 424.3 }, 0).wait(1).to({ x: 410.1, y: 422.8 }, 0).wait(1).to({ x: 410.4, y: 421.3 }, 0).wait(1).to({ x: 410.6, y: 419.8 }, 0).wait(1).to({ x: 410.9, y: 418.2 }, 0).wait(1).to({ x: 411.1, y: 416.7 }, 0).wait(1).to({ x: 411.4, y: 415.2 }, 0).wait(1).to({ x: 411.6, y: 413.7 }, 0).wait(1).to({ x: 411.9, y: 412.1 }, 0).wait(1).to({ x: 412.1, y: 410.6 }, 0).wait(1).to({ x: 412.4, y: 409.1 }, 0).wait(1).to({ x: 412.6, y: 407.6 }, 0).wait(1).to({ x: 412.9, y: 406 }, 0).wait(1).to({ x: 413.1, y: 404.5 }, 0).wait(1).to({ x: 413.4, y: 403 }, 0).wait(1).to({ x: 413.7, y: 401.5 }, 0).wait(1).to({ x: 413.9, y: 399.9 }, 0).wait(1).to({ x: 414.2, y: 398.4 }, 0).wait(1).to({ x: 414.4, y: 396.9 }, 0).wait(1).to({ x: 414.7, y: 395.4 }, 0).wait(1).to({ x: 414.9, y: 393.8 }, 0).wait(1).to({ x: 416.1, y: 393.6 }, 0).wait(1).to({ x: 417.3, y: 393.4 }, 0).wait(1).to({ x: 418.4, y: 393.2 }, 0).wait(1).to({ x: 419.6, y: 392.9 }, 0).wait(1).to({ x: 420.8, y: 392.7 }, 0).wait(1).to({ x: 422, y: 392.5 }, 0).wait(1).to({ x: 423.1, y: 392.2 }, 0).wait(1).to({ x: 424.3, y: 392 }, 0).wait(1).to({ x: 425.5, y: 391.8 }, 0).wait(1).to({ x: 426.6, y: 391.6 }, 0).wait(1).to({ x: 427.8, y: 391.3 }, 0).wait(1).to({ x: 429, y: 391.1 }, 0).wait(1).to({ x: 430.2, y: 390.9 }, 0).wait(1).to({ x: 431.3, y: 390.7 }, 0).wait(1).to({ x: 432.5, y: 390.4 }, 0).wait(1).to({ x: 433.7, y: 390.2 }, 0).wait(1).to({ x: 434.9, y: 390 }, 0).wait(1).to({ x: 436, y: 389.8 }, 0).wait(1).to({ x: 437.2, y: 389.5 }, 0).wait(1).to({ x: 438.4, y: 389.3 }, 0).wait(1).to({ x: 439.5, y: 389.1 }, 0).wait(1).to({ x: 440.7, y: 388.8 }, 0).wait(1).to({ x: 441.9, y: 388.6 }, 0).wait(1).to({ x: 443.1, y: 388.4 }, 0).wait(1).to({ x: 444.2, y: 388.2 }, 0).wait(1).to({ x: 445.4, y: 387.9 }, 0).wait(1).to({ x: 446.6, y: 387.7 }, 0).wait(1).to({ x: 447.8, y: 387.5 }, 0).wait(1).to({ x: 448.9, y: 387.3 }, 0).wait(1).to({ x: 450.1, y: 387 }, 0).wait(1).to({ x: 449.1, y: 389 }, 0).wait(1).to({ x: 448.1, y: 391 }, 0).wait(1).to({ x: 447.1, y: 393 }, 0).wait(1).to({ x: 446.1, y: 395 }, 0).wait(1).to({ x: 445.1, y: 396.9 }, 0).wait(1).to({ x: 444.1, y: 398.9 }, 0).wait(1).to({ x: 443.1, y: 400.9 }, 0).wait(1).to({ x: 442.1, y: 402.9 }, 0).wait(1).to({ x: 441.1, y: 404.9 }, 0).wait(1).to({ x: 440.1, y: 406.8 }, 0).wait(1).to({ x: 439, y: 408.8 }, 0).wait(1).to({ x: 438, y: 410.8 }, 0).wait(1).to({ x: 437, y: 412.8 }, 0).wait(1).to({ x: 436, y: 414.8 }, 0).wait(1).to({ x: 435, y: 416.7 }, 0).wait(1).to({ x: 434, y: 418.7 }, 0).wait(1).to({ x: 433, y: 420.7 }, 0).wait(1).to({ x: 432, y: 422.7 }, 0).wait(1).to({ x: 431, y: 424.7 }, 0).wait(1).to({ x: 430, y: 426.7 }, 0).wait(1));

        // Layer
        this.instance = new lib.buttonskin();
        this.instance.setTransform(432.2, 411, 1.32, 1.32, 0, 0, 0, 150, 150);

        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1).to({ x: 432.1, y: 412.6 }, 0).wait(1).to({ y: 414.3 }, 0).wait(1).to({ y: 416 }, 0).wait(1).to({ y: 417.7 }, 0).wait(1).to({ y: 419.4 }, 0).wait(1).to({ y: 421.1 }, 0).wait(1).to({ y: 422.8 }, 0).wait(1).to({ y: 424.5 }, 0).wait(1).to({ y: 426.2 }, 0).wait(1).to({ y: 427.9 }, 0).wait(1).to({ y: 429.6 }, 0).wait(1).to({ y: 431.3 }, 0).wait(1).to({ y: 433 }, 0).wait(1).to({ y: 434.7 }, 0).wait(1).to({ y: 436.4 }, 0).wait(1).to({ y: 438 }, 0).wait(1).to({ y: 439.7 }, 0).wait(1).to({ y: 441.4 }, 0).wait(1).to({ y: 443.1 }, 0).wait(1).to({ y: 444.8 }, 0).wait(1).to({ y: 446.5 }, 0).wait(1).to({ y: 448.2 }, 0).wait(1).to({ y: 449.9 }, 0).wait(1).to({ y: 451.6 }, 0).wait(1).to({ y: 453.3 }, 0).wait(1).to({ y: 455 }, 0).wait(1).to({ y: 456.7 }, 0).wait(1).to({ y: 458.4 }, 0).wait(1).to({ y: 460.1 }, 0).wait(1).to({ y: 461.8 }, 0).wait(1).to({ y: 463.4 }, 0).wait(1).to({ x: 431.1, y: 462.7 }, 0).wait(1).to({ x: 430, y: 461.9 }, 0).wait(1).to({ x: 428.9, y: 461.2 }, 0).wait(1).to({ x: 427.8, y: 460.4 }, 0).wait(1).to({ x: 426.7, y: 459.7 }, 0).wait(1).to({ x: 425.6, y: 458.9 }, 0).wait(1).to({ x: 424.5, y: 458.1 }, 0).wait(1).to({ x: 423.4, y: 457.4 }, 0).wait(1).to({ x: 422.3, y: 456.6 }, 0).wait(1).to({ x: 421.2, y: 455.9 }, 0).wait(1).to({ x: 420.1, y: 455.1 }, 0).wait(1).to({ x: 419, y: 454.3 }, 0).wait(1).to({ x: 417.9, y: 453.6 }, 0).wait(1).to({ x: 416.8, y: 452.8 }, 0).wait(1).to({ x: 415.7, y: 452.1 }, 0).wait(1).to({ x: 414.6, y: 451.3 }, 0).wait(1).to({ x: 413.6, y: 450.5 }, 0).wait(1).to({ x: 412.5, y: 449.8 }, 0).wait(1).to({ x: 411.4, y: 449 }, 0).wait(1).to({ x: 410.3, y: 448.3 }, 0).wait(1).to({ x: 409.2, y: 447.5 }, 0).wait(1).to({ x: 408.1, y: 446.7 }, 0).wait(1).to({ x: 407, y: 446 }, 0).wait(1).to({ x: 405.9, y: 445.2 }, 0).wait(1).to({ x: 406.2, y: 443.7 }, 0).wait(1).to({ x: 406.4, y: 442.2 }, 0).wait(1).to({ x: 406.7, y: 440.6 }, 0).wait(1).to({ x: 406.9, y: 439.1 }, 0).wait(1).to({ x: 407.2, y: 437.6 }, 0).wait(1).to({ x: 407.4, y: 436.1 }, 0).wait(1).to({ x: 407.7, y: 434.5 }, 0).wait(1).to({ x: 407.9, y: 433 }, 0).wait(1).to({ x: 408.2, y: 431.5 }, 0).wait(1).to({ x: 408.4, y: 430 }, 0).wait(1).to({ x: 408.7, y: 428.4 }, 0).wait(1).to({ x: 408.9, y: 426.9 }, 0).wait(1).to({ x: 409.2, y: 425.4 }, 0).wait(1).to({ x: 409.5, y: 423.9 }, 0).wait(1).to({ x: 409.7, y: 422.3 }, 0).wait(1).to({ x: 410, y: 420.8 }, 0).wait(1).to({ x: 410.2, y: 419.3 }, 0).wait(1).to({ x: 410.5, y: 417.8 }, 0).wait(1).to({ x: 410.7, y: 416.3 }, 0).wait(1).to({ x: 411, y: 414.7 }, 0).wait(1).to({ x: 411.2, y: 413.2 }, 0).wait(1).to({ x: 411.5, y: 411.7 }, 0).wait(1).to({ x: 411.7, y: 410.2 }, 0).wait(1).to({ x: 412, y: 408.6 }, 0).wait(1).to({ x: 412.2, y: 407.1 }, 0).wait(1).to({ x: 412.5, y: 405.6 }, 0).wait(1).to({ x: 412.8, y: 404.1 }, 0).wait(1).to({ x: 413, y: 402.5 }, 0).wait(1).to({ x: 413.3, y: 401 }, 0).wait(1).to({ x: 413.5, y: 399.5 }, 0).wait(1).to({ x: 413.8, y: 398 }, 0).wait(1).to({ x: 414, y: 396.4 }, 0).wait(1).to({ x: 414.3, y: 394.9 }, 0).wait(1).to({ x: 414.5, y: 393.4 }, 0).wait(1).to({ x: 414.8, y: 391.9 }, 0).wait(1).to({ x: 415, y: 390.3 }, 0).wait(1).to({ x: 415.3, y: 388.8 }, 0).wait(1).to({ x: 415.5, y: 387.3 }, 0).wait(1).to({ x: 415.8, y: 385.8 }, 0).wait(1).to({ x: 416.1, y: 384.2 }, 0).wait(1).to({ x: 416.3, y: 382.7 }, 0).wait(1).to({ x: 416.6, y: 381.2 }, 0).wait(1).to({ x: 416.8, y: 379.7 }, 0).wait(1).to({ x: 417.1, y: 378.1 }, 0).wait(1).to({ x: 418.2, y: 377.9 }, 0).wait(1).to({ x: 419.4, y: 377.7 }, 0).wait(1).to({ x: 420.6, y: 377.5 }, 0).wait(1).to({ x: 421.8, y: 377.2 }, 0).wait(1).to({ x: 422.9, y: 377 }, 0).wait(1).to({ x: 424.1, y: 376.8 }, 0).wait(1).to({ x: 425.3, y: 376.5 }, 0).wait(1).to({ x: 426.5, y: 376.3 }, 0).wait(1).to({ x: 427.6, y: 376.1 }, 0).wait(1).to({ x: 428.8, y: 375.9 }, 0).wait(1).to({ x: 430, y: 375.6 }, 0).wait(1).to({ x: 431.1, y: 375.4 }, 0).wait(1).to({ x: 432.3, y: 375.2 }, 0).wait(1).to({ x: 433.5, y: 375 }, 0).wait(1).to({ x: 434.7, y: 374.7 }, 0).wait(1).to({ x: 435.8, y: 374.5 }, 0).wait(1).to({ x: 437, y: 374.3 }, 0).wait(1).to({ x: 438.2, y: 374.1 }, 0).wait(1).to({ x: 439.4, y: 373.8 }, 0).wait(1).to({ x: 440.5, y: 373.6 }, 0).wait(1).to({ x: 441.7, y: 373.4 }, 0).wait(1).to({ x: 442.9, y: 373.1 }, 0).wait(1).to({ x: 444, y: 372.9 }, 0).wait(1).to({ x: 445.2, y: 372.7 }, 0).wait(1).to({ x: 446.4, y: 372.5 }, 0).wait(1).to({ x: 447.6, y: 372.2 }, 0).wait(1).to({ x: 448.7, y: 372 }, 0).wait(1).to({ x: 449.9, y: 371.8 }, 0).wait(1).to({ x: 451.1, y: 371.6 }, 0).wait(1).to({ x: 452.3, y: 371.3 }, 0).wait(1).to({ x: 451.2, y: 373.3 }, 0).wait(1).to({ x: 450.2, y: 375.3 }, 0).wait(1).to({ x: 449.2, y: 377.3 }, 0).wait(1).to({ x: 448.2, y: 379.3 }, 0).wait(1).to({ x: 447.2, y: 381.2 }, 0).wait(1).to({ x: 446.2, y: 383.2 }, 0).wait(1).to({ x: 445.2, y: 385.2 }, 0).wait(1).to({ x: 444.2, y: 387.2 }, 0).wait(1).to({ x: 443.2, y: 389.2 }, 0).wait(1).to({ x: 442.2, y: 391.1 }, 0).wait(1).to({ x: 441.2, y: 393.1 }, 0).wait(1).to({ x: 440.2, y: 395.1 }, 0).wait(1).to({ x: 439.2, y: 397.1 }, 0).wait(1).to({ x: 438.2, y: 399.1 }, 0).wait(1).to({ x: 437.2, y: 401 }, 0).wait(1).to({ x: 436.2, y: 403 }, 0).wait(1).to({ x: 435.2, y: 405 }, 0).wait(1).to({ x: 434.2, y: 407 }, 0).wait(1).to({ x: 433.2, y: 409 }, 0).wait(1).to({ x: 432.1, y: 410.9 }, 0).wait(1));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(-872.8, 88.8, 1505, 722.3);


    (lib.ctrlbuttonbar = function () {
        this.initialize();

        // Layer 1
        this.shape = new cjs.Shape();
        this.shape.graphics.f().s("#FFFFFF").ss(3, 1, 1).p("EBMAAE4MiX/AAAEhL/gE3MCX/AAA");
        this.shape.setTransform(640, 31.3, 1.316, 1);

        // Layer 2
        this.instance = new lib.boxcopy();
        this.instance.setTransform(853.8, 21.5, 1.829, 0.16, 0, 0, 0, 466.9, 164.1);
        this.instance.alpha = 0.59;

        this.addChild(this.instance, this.shape);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(-1.5, -4.8, 1283, 68.8);


    (lib.SplashElements = function () {
        this.initialize();

        // Layer 1
        this.txtHeader = new cjs.Text(args.message4, "bold 36px 'Calibri'", "#FFFFFF");
        this.txtHeader.name = "txtHeader";
        this.txtHeader.textAlign = "center";
        this.txtHeader.lineHeight = 36;
        this.txtHeader.lineWidth = 1230;
        this.txtHeader.setTransform(636.1, 7.5);
        this.txtHeader.shadow = new cjs.Shadow("rgba(0,0,0,1)", 0, 0, 2);

        // Layer 3
        this.instance = new lib.ctrlbuttonbar();
        this.instance.setTransform(630, 37.5, 0.978, 1, 0, 0, 0, 630, 37.5);

        this.addChild(this.instance, this.txtHeader);
    }).prototype = p = new cjs.Container();
    p.nominalBounds = new cjs.Rectangle(12.3, -4.8, 1255, 68.8);


    (lib.Animation = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, { splashState: 0, splashStartOrder: 13, splashOut: 14 });

        // timeline functions:
        this.frame_0 = function () {
            this.stop();
        };
        this.frame_13 = function () {
            this.stop();
        };
        this.frame_28 = function () {
            /* gotoAndStop('splashState');*/
        };

        // actions tween:
        this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(13).call(this.frame_13).wait(15).call(this.frame_28).wait(1));

        // please touch text
        this.HeaderClip = new lib.SplashElements();
        this.HeaderClip.setTransform(318.6, 25.2, 1, 1, 0, 0, 0, 318.6, 25.2);
        this.HeaderClip.cache(10, -7, 1259, 73);

        this.timeline.addTween(cjs.Tween.get(this.HeaderClip).wait(1).to({ regX: 639.8, regY: 29.6, x: 639.8, y: 29.6, alpha: 0.833 }, 0).wait(1).to({ alpha: 0.667 }, 0).wait(1).to({ alpha: 0.5 }, 0).wait(1).to({ alpha: 0.333 }, 0).wait(1).to({ alpha: 0.167 }, 0).wait(1).to({ alpha: 0 }, 0).wait(16).to({ alpha: 0.143 }, 0).wait(1).to({ alpha: 0.286 }, 0).wait(1).to({ alpha: 0.429 }, 0).wait(1).to({ alpha: 0.571 }, 0).wait(1).to({ alpha: 0.714 }, 0).wait(1).to({ alpha: 0.857 }, 0).wait(1).to({ alpha: 1 }, 0).wait(1));

        // instructions
        this.InstClip = new lib.instructionloop();
        this.InstClip.setTransform(1010.3, 170.4, 0.763, 0.763, 0, 0, 0, 343.8, 120.2);

        this.timeline.addTween(cjs.Tween.get(this.InstClip).wait(1).to({ regX: -123.4, regY: 449.9, x: 653.9, y: 421.8, alpha: 0.833 }, 0).wait(1).to({ alpha: 0.667 }, 0).wait(1).to({ alpha: 0.5 }, 0).wait(1).to({ alpha: 0.333 }, 0).wait(1).to({ alpha: 0.167 }, 0).wait(1).to({ alpha: 0 }, 0).wait(16).to({ alpha: 0.143 }, 0).wait(1).to({ alpha: 0.286 }, 0).wait(1).to({ alpha: 0.429 }, 0).wait(1).to({ alpha: 0.571 }, 0).wait(1).to({ alpha: 0.714 }, 0).wait(1).to({ alpha: 0.857 }, 0).wait(1).to({ alpha: 1 }, 0).wait(1));

    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(12.3, -4.8, 1255, 702);


    // stage content:



    (lib.Splash2HTML = function (mode, startPosition, loop) {
        this.initialize(mode, startPosition, loop, { on: 0, animate: 1, splashFrame: 2, off: 3 });

        // timeline functions:
        this.frame_0 = function () {
            this.stop();
        };
        this.frame_1 = function () {
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

        // Spanish Button
        this.button1 = new lib.languagebutton();
        this.button1.setTransform(-218.5, 692, 1, 1, 0, 0, 0, 118.2, 49.1);
        this.button1.shadow = new cjs.Shadow("rgba(0,0,0,1)", 0, 0, 7);

        this.timeline.addTween(cjs.Tween.get(this.button1).wait(4));

        // hit
        this.button0 = new lib.defaultLanguage();
        this.button0.setTransform(512.9, 385.2, 1, 1, 0, 0, 0, 512.9, 385.2);
        this.button0.alpha = 0;

        this.timeline.addTween(cjs.Tween.get(this.button0).to({ _off: true }, 1).wait(1).to({ _off: false }, 0).to({ _off: true }, 1).wait(1));

        // copyright
        this.txtCopyright = new cjs.Text(args.copyright, "12px 'Calibri'", "#333333");
        this.txtCopyright.name = "txtCopyright";
        this.txtCopyright.textAlign = "right";
        this.txtCopyright.lineHeight = 14;
        this.txtCopyright.lineWidth = 675;
        this.txtCopyright.setTransform(1270, 695.5);
        this.txtCopyright.shadow = new cjs.Shadow("rgba(255,255,255,1)", 0, 0, 2);

        this.timeline.addTween(cjs.Tween.get(this.txtCopyright).wait(4));

        // CHARACTER
        this.startInst = new lib.Animation();
        // ADDED THIS
        this.startInst.set({ alpha: 0.5 });

        this.timeline.addTween(cjs.Tween.get(this.startInst).to({ _off: true }, 3).wait(1));

        // bg
        this.instance = new lib.PeachesBG();

        this.timeline.addTween(cjs.Tween.get(this.instance).wait(4));



    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(281.5, 355.2, 1639.5, 725.6);

    // ------------------
    // END GENERATED CODE
    // ------------------

})(splashglobal.animation.lib, splashglobal.animation.images, window.createjs, splashglobal.animation.ss, splashglobal.animation.args);

// The original flash export called this in body onload. Moved to here to have all the JavaScript in one place.
(function () {

    // This init function is modified from the original. It has been changed to use the existing global variables (lib, images, createjs, ss)
    // and not introduce new ones where the scope of the variable is just in init (canvas, stage, exportroot).
    function init(canvasElementId, lib, images, createjs, ss, flashHeight) {
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
            var newScale = (window.innerHeight / flashHeight) * 1;
            _exportRoot.scaleX = _exportRoot.scaleY = newScale;
        }

        function handleFileLoad(evt) {
            if (evt.item.type == "image") { images[evt.item.id] = evt.result; }
        }

        function handleComplete(evt) {
            _exportRoot = new lib.Splash2HTML();

            var stage = new createjs.Stage(_canvas);

            // Added this to scale the canvas to the stage.
            scaleCanvas(stage);
            stage.addChild(_exportRoot);
            stage.update();
            stage.enableMouseOver();

            createjs.Ticker.setFPS(lib.properties.fps);
            createjs.Ticker.addEventListener("tick", stage);
        }

        var loader = new createjs.LoadQueue(false);
        loader.addEventListener("fileload", handleFileLoad);
        loader.addEventListener("complete", handleComplete);
        loader.loadManifest(lib.properties.manifest);
    }


    function creativeInit(canvasElementId, btnElementId) {
        var canvasElement = document.getElementById(canvasElementId);

        // UI Event Handlers
        // Login button
        var navStart = $("#" + btnElementId);
        navStart.button();
        navStart.click(function () {
            navStart.button('loading');
            _nex.assets.phaseManager.changePhase(_nex.assets.phaseManager.phaseType.ORDERING, function () {
                _nex.ordering.start();
                navStart.button('reset');
            });
            //_iorderfast.nav.loadContent('ordering', function () {
            //    navStart.button('reset');
            //});
        });
    }

    // Call the init function. This function mostly comes from the exported Flash to HTML/JavaScript tool.
    init(splashglobal.elements.canvasElementId, splashglobal.animation.lib, splashglobal.animation.images, window.createjs, splashglobal.animation.ss, splashglobal.animation.args.height);

    // Call the creativeInit function. This function is not exported from the Flash.
    creativeInit(splashglobal.elements.canvasElementId, splashglobal.elements.btnElementId);


})(undefined);

