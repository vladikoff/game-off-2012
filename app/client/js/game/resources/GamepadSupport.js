(function (exports) {


    var GamepadSupport = function () {

        window.addEventListener('MozGamepadConnected', this.onGamepadConnect, false);
        window.addEventListener('MozGamepadDisconnected', this.onGamepadDisconnect, false);
        this.prevRawGamepadTypes = []
    };

    /**
     * Enable gamepad support if available
     */
    GamepadSupport.prototype.checkGamepadSupport = function () {

        if (Modernizr.gamepads) {
            var rawGamepads =
                (navigator.webkitGetGamepads && navigator.webkitGetGamepads()) || navigator.webkitGamepads;

            if (rawGamepads) {
                this.GAMEPADS = [];
                if (typeof rawGamepads[i] != this.prevRawGamepadTypes[i]) {
                    //this.dispatchEvent('gamepadConnected');
                    //console.log('gamepadConnected');
                    for (var i = 0; i < rawGamepads.length; i++) {
                        if (rawGamepads[i]) {
                            this.GAMEPADS.push(rawGamepads[i]);
                        }
                    }
                }
            }
        }
    };


    /**
     * onGamepadConnect
     * @type {Function}
     */
    GamepadSupport.prototype.onGamepadConnect = function (event) {
        this.dispatchEvent('gamepadConnected');
        this.GAMEPADS.push(event.gamepad);
    };


    /**
     * onGamepadConnect
     * @param event
     */
    GamepadSupport.prototype.onGamepadDisconnect = function (event) {
        for (var i in this.GAMEPADS) {
            if (this.GAMEPADS[i].index == event.gamepad.index) {
                this.GAMEPADS.splice(i, 1);
                break;
            }
        }
        //console.log('gamepadDisconnected');
        //this.dispatchEvent('gamepadDisconnected');
    };

    exports.GamepadSupport = GamepadSupport;
})(window);
