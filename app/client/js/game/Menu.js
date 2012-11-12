/**
 * Welcome Notice
 */
Template.welcome.events({
    'click .continue': function () {
        $('.req-welcome').animate({ top: PX_HIDE }, PX_SPEED, function() {
            $('.req-tutorial').animate({ top: PX_SHOW });
        });
    }
});


/**
 * Project Choice
 */
Template.choose.events({
    'click .project': function (event, template) {
        Session.set("pid", this._id);

        $('.req-project').animate({ top: PX_HIDE }, PX_SPEED, function() { });
        startGame();

        return false;
    }
});


/**
 * Welcome Notice
 */
Template.tutorial.events({
    'click .continue': function () {
        $('.req-tutorial').animate({ top: PX_HIDE }, PX_SPEED, function() {
            $('.req-project').animate({ top: PX_SHOW });
        });
    }
});

Template.help.status = function () {
    return Session.get('gamepadStatus');
};

Template.help.musicStatus = function () {
    return Session.get('musicStatus');
};


/**
 * Project Choice
 */
Template.help.events({
    'click .music': function (event, template) {
        if (Session.get('musicStatus', 'on')) {
            Session.set('musicStatus', 'off');
            MUSIC.pause();
        } else {
            Session.set('musicStatus', 'on');
            if (Session.get('gameOn')) {
                MUSIC.play();
            }
        }
    }
});


