Template.dashboard.stars = function () {
    var stars = Session.get('sessionStars');
    return (stars) ? stars : 0;
};


Template.dashboard.project = function () {
    var p = Projects.findOne({_id:Session.get('pid')});
    if (p && p.name) {
        return p.name
    } else {
        return 'a project'
    }
};


Template.dashboard.commits = function () {
    var commits = Session.get('sessionCommits');
    return (commits) ? commits : 0;
};


Template.dashboard.level = function () {
    var lvl = Session.get('sessionLevel');
    return (lvl) ? lvl : 0;

};

Template.dashboard.rendered = function(){
    // quick hack.
    var s = Session.get('sessionLevel'),
        b = Session.get('sessionLevelBackup');

    if (s != b) {
        Session.set("sessionLevelBackup", s);
        $('.level').fadeIn(300).delay(500).fadeOut(400);
    }
};


Template.level.count = function () {
    var lvl = Session.get('sessionLevel');
    return (lvl) ? lvl : 0;

};

