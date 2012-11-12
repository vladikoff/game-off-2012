var PX_HIDE = -1500,
    PX_SHOW = 0,
    PX_SPEED = 300,
    MUSIC;

var RecentScores = new Meteor.Collection("recent_scores"),
    TopScores = new Meteor.Collection("top_scores");


// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame   ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

Meteor.subscribe('projects');
Meteor.subscribe("recent_scores");
Meteor.subscribe("top_scores");


/**
 * Meteor startup!
 */
Meteor.startup(function () {
    Session.set('gameOn', false);
    Session.set('sessionLevel', 0);
    Session.set('sessionStars', 0);
    Session.set('sessionCommits', 0);
    Session.set('pid', null);
    Session.set('stats', null);
    Session.set('gamepadStatus', 'off');

    if (! Session.get('musicStatus')) Session.set('musicStatus', 'on');

    if (Modernizr.audio) {
        MUSIC = new SoundTrack();
    }
    //if (Modernizr.webgl){
    if ( Detector.webgl ) {
        //$('.req-webgl').animate({ top: PX_SHOW });
        $('.req-welcome').animate({ top: PX_SHOW });
        //startGame(); // sup debug

    } else {
        $('.req-webgl').animate({ top: PX_SHOW });
    }
});


/**
 * Meteor autorun
 */
Meteor.autorun(function() {
    if (Meteor.user() && Session.equals("gameOver", true)) {
        Meteor.call('userUpdate', { data: Session.get('st') });
        Session.set('gameOver', false);
    }
});

/**
 * GitHub Login setup
 */
Meteor.loginWithGithub({
    requestPermissions: ['user', 'public_repo']
}, function (err) {
    if (err) {
        Session.set('errorMessage', err.reason || 'Unknown error');
    }
});


/**
 * Let the games begin
 */
function startGame() {

    var cc;
    var $lifeBar = $('.life'),
        $progress = $('.progress');


    cc = new CoreCommit(Session.get("pid"));
    cc.addEventListener('decreaseLife', function (e) {
        $lifeBar.css('width', e.data + '%');
    });

    cc.addEventListener('decreaseLife', function (e) {
        $lifeBar.css('width', e.data + '%');
    });

    cc.addEventListener('start', function (e) {
        $progress.fadeIn();
    });

    cc.addEventListener('session', function (e) {
        Session.set('sessionCommits', e.detail.COMMITS);
        Session.set('sessionStars', e.detail.STARS);
        Meteor.call('sessionUpdate', { data: e.detail });
    });

    cc.addEventListener('gamepadConnected', function (e) {
        Session.set('gamepadStatus', 'on');
    });

    cc.addEventListener('gamepadDisconnected', function (e) {
        Session.set('gamepadStatus', 'off');
    });

    cc.addEventListener('levelUpdate', function (e) {
        Session.set("sessionLevel", e.detail);
    });

    cc.addEventListener('gameOver', function (e) {
        $('.req-gameover').animate({ top: PX_SHOW });
        Session.set("gameOver", true);
        if (e.detail.LEVEL == 0 && e.detail.COMMITS == 0 && e.detail.STARS == 0) {
            e.detail.EPIC_FAIL = true;
        }
        Session.set('stats', e.detail);
        Session.set('st', e.detail.START_TIME);
        $progress.slideUp();
        Session.set('gameOn', false);
    });

    cc.start();
    Session.set('gameOn', true);
    if (Session.get('musicStatus') == 'on') {
        MUSIC.play();
    }

}
