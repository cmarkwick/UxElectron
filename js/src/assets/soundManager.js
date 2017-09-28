/** @constructor */
function SoundManager(csharpSoundManager) {

    // Make self synonymous with this.
    var self = this;

    // Object to use for playing sounds on the C# side of the code.
    self._csharpSoundManager = csharpSoundManager;

    // Common sound files.
    self._sounds = [
        { index: 0, file: "dtmf0.mp3"},
        { index: 1, file: "dtmf1.mp3"},
        { index: 2, file: "dtmf2.mp3"},
        { index: 3, file: "dtmf3.mp3"},
        { index: 4, file: "dtmf4.mp3"},
        { index: 5, file: "dtmf5.mp3"},
        { index: 6, file: "dtmf6.mp3"},
        { index: 7, file: "dtmf7.mp3"},
        { index: 8, file: "dtmf8.mp3"},
        { index: 9, file: "dtmf9.mp3" },
        { index: 10, file: "button-hit.mp3" },
        { index: 11, file: "Continue-Nudge.mp3" }
    ];

    self.initialize = function (filepath) {
        self._csharpSoundManager.initialize(filepath);
    };

    // Play a specific sound in the list based on its index.
    self.playSoundByIndex = function (index) {
        // Double check we can play this sound.
        var isValidIndex = self._checkSoundByIndex(index);

        if (isValidIndex) {
            // Get the sound.
            var sound = self._getSoundByIndex(index);

            // Play the sound.
            // console.debug("Playing sound " + sound.file);
            self._playMP3(sound.file);
        }
    };


    // Play a specific sound in the list based on its filename.
    //self.playSoundByName = function (filepath) {

    //    // Double check we can play this sound.
    //    self._checkSoundByFilename(filename);

    //    // Get the sound.
    //    self.getSoundByName(filename);

    //    // Play the sound.
    //    self._playMP3(filepath);
    //};

    // Play the button-hit sound.
    self.playButtonHit = function () {
        self._playMP3(self._sounds[10].file);
    };

    // SUPPORTING FUNCTIONS

    self._getSoundByIndex = function (index) {
        return self._sounds[index];
    };

    self._getSoundByName = function (name) {
        for (var index = 0; index < self._sounds.length; index++) {
            var sound = self._sounds[index];
            if (sound.file === name) {
                return sound;
            }
        }
        return false;
    };

    // Check that we can play the sound at the specific index.
    self._checkSoundByIndex = function (index) {
        var result = true;
        // Make sure the index is valid.
        if (index < 0) {
            console.log("Invalid sound index " + index);
            result = false;
        } else if (isNaN(index)) {
            console.log("Invalid sound index " + index);
            result = false;
        }
        return result;
        
    };

    // Check that we can play the sound with the specific name.
    self._checkSoundByFilename = function (filename) {
        // Make sure the index is valid.
        if (!filename) {
            console.log("Missing filename.");
        }
        if (!filename.length) {
            console.log("Invalid filename " + filename);
        }
        if (filename.length <= 0) {
            console.log("Empty string for filename.");
        }
    };

    // Play a sound for a known file. Does not support MP3.
    self._playSound = function (filename) {
        var audio = document.createElement('audio');
        audio.setAttribute('src', filename);
        audio.play();
        // Note: The audio element is not supported in IE-8 and below.
    };

    // Play an MP3 file.
    self._playMP3 = function (filename) {
        // MP3 files are not supported in CEF... so we are playing the sound
        // on the C# side of the application. This will need to be changed for
        // future platforms.
        self._csharpSoundManager.playSound(filename);
    };
}