/**
 * Show game stats
 */
Template.recentScores.list = function() {
    // the server controls the limit, but we are forcing it here as well.
    return RecentScores.find().fetch().slice(0,8);
};


/**
 * Show top scores
 */
Template.topScores.list = function() {
    return TopScores.find().fetch().slice(0,8);
};