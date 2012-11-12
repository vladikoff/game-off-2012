
/**
 * WebGl Notice
 */
Template.webgl.events({
    'click .continue': function () {
        $('.req-webgl').animate({ top: PX_HIDE }, PX_SPEED, function() {
            $('.req-welcome').animate({ top: PX_SHOW });
        });
    }
});