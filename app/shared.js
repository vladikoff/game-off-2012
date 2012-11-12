Projects = new Meteor.Collection("projects");
Plays = new Meteor.Collection("plays");



SessionUpdates = new Meteor.Collection("sessions");
/**
Projects.allow({
    update: function (userId, parties, fields, modifier) {
        return true;
    }
});

 */
