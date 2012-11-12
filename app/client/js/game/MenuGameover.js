/**
 * Return currently logged in user
 */
Template.gameover.user = function() {
    return Meteor.user();
};


/**
 * Show game stats
 */
Template.gameover.stats = function() {
    return Session.get('stats');
};


/**
 * List the projects for the gameover menu
 */
Template.gameover.list = function() {
    return Projects.find();
};


/**
 * Game Over Notice
 */
Template.gameover.events({
    'click .again': function () {
        window.location.reload();
    }
});
