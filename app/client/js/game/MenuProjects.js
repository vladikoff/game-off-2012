/**
 * List the project for the choosing menu
 */
Template.projects.list = function() {
    return Projects.find();
};

/**
 * Chosen project id
 */
Template.projects.selected = function() {
    return Session.get('pid');
};

