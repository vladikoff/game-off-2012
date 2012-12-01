(function (exports) {

    var SoundTrack = function () {
        var self = this;
        this.audio = new Audio();
        var tracks = [
            "music/0.ogg",
            "music/1.ogg",
            "music/2.ogg"
        ];
        this.audio.src = tracks[parseInt(Math.random() * 3, 10)];
        this.audio.volume = 0.1;
        this.audio.addEventListener('ended', function() {
            self.audio.src = tracks[parseInt(Math.random() * 3, 10)];
            self.play();
        }, false);
    };

    SoundTrack.prototype.play = function() {
        this.audio.play();
    };

    SoundTrack.prototype.pause = function() {
        this.audio.pause();
    };

    exports.SoundTrack = SoundTrack;
})(window);
