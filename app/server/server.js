/**
 * Meteor startup
 */
Meteor.startup(function () {
    // On server startup, create some players if the database is empty.
    if (Projects.find().count() === 0) {
        populateProjects();
    }
});


/**
 * Publish a list of projects
 */
Meteor.publish("projects", function () {
    return Projects.find({}, { sort:{ commits: -1, stars: -1  }, fields:{} });
});


/**
 * Publish Recent Scores
 */
Meteor.publish("recent_scores", function () {
    var self = this;

    var handle = Plays.find({}, { sort:{ start_time:-1 }, limit:8, fields:{}}).observe({
        added:function (item) {
            self.set("recent_scores", item._id, item);
            self.flush();
        },
        changed:function (item) {
            self.set("recent_scores", item._id, item);
            self.flush();
        }
    });

    this.onStop(function () {
        handle.stop();
    });
});


/**
 * Publish top scores
 */
Meteor.publish("top_scores", function () {
    var self = this;

    var handle = Plays.find({}, { sort:{ commits:-1 }, limit:8, fields:{}}).observe({
        added:function (item) {
            self.set("top_scores", item._id, item);
            self.flush();
        },
        changed:function (item) {
            self.set("top_scores", item._id, item);
            self.flush();
        }
    });

    this.onStop(function () {
        handle.stop();
    });
});


/**
 * Populate the projects
 * runs on app 'install'
 */
function populateProjects() {

    var projects = [
        {
            code:'jquery',
            name:'jQuery',
            commits:0,
            stars:0,
            color:'#3584ad'
        },
        {
            code:'grunt',
            name:'Grunt',
            commits:0,
            stars:0,
            color:'#5a360f'
        },
        {
            code:'lodash',
            name:'Lo-dash',
            commits:0,
            stars:0,
            color:'#0a1629'
        },
        {
            code:'android',
            name:'Android',
            commits:0,
            stars:0,
            color:'#99c726'
        },
        {
            code:'node',
            name:'Node',
            commits:0,
            stars:0,
            color:'#8bc451'
        },
        {
            code:'three',
            name:'Three.js',
            commits:0,
            stars:0,
            color:'#444449'
        },
        {
            code:'firefox',
            name:'Firefox',
            commits:0,
            stars:0,
            color:'#d74618'
        },
        {
            code:'modernizr',
            name:'Modernizr',
            commits:0,
            stars:0,
            color:'#de2d75'
        }
    ].forEach(function (project) {
            Projects.insert(project);
        });
}


/**
 * Server methods
 * Used with .call by the client
 */
Meteor.methods({
    // options should include: title, description, x, y, public
    sessionUpdate:function (e) {
        if (e.data) {
            var p = Projects.findOne({_id:e.data.PROJECT});

            if (p) {
                var u = Meteor.user();


                if (e.data.GAMEOVER && Plays.find({user:u, start_time:e.data.START_TIME }).count() == 0) {
                    // TODO: fix this later, no time right now.
                    e.data.SECONDS_PLAYED = (e.data.END_TIME - e.data.START_TIME) / 1000;
                    e.data.SECONDS_PLAYED_STRING = secondsToString(e.data.SECONDS_PLAYED);
                    Plays.insert({
                        user:u,
                        start_time:e.data.START_TIME,
                        commits:e.data.COMMITS,
                        session:e.data,
                        project_name:p.name
                    });
                    Projects.update({_id:e.data.PROJECT}, { $inc:{ stars:e.data.STARS, commits:e.data.COMMITS } });
                }
            }
        }
    },
    userUpdate:function (e) {
        Plays.update({start_time:e.data},{$set: {user: Meteor.user()}});
    }
});


/**
 * Create User event
 */
Accounts.onCreateUser(function (options, user) {
    if (options.profile)
        user.profile = options.profile;
    return user;
});


/**
 * Temporary quick util
 * Quick seconds util
 * TODO: Remove.
 * @param seconds
 * @return {String}
 */
function secondsToString(seconds) {
    var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    var numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
    return numminutes + "min " + parseInt(numseconds, 10) + "sec";

}
