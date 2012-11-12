(function (exports) {

    /**
     * Setup the game player
     * @constructor
     */
    var Player = function () {
        this.branch = 1;
        this.branchTexture = [
            new THREE.ImageUtils.loadTexture('img/player0.png'),
            new THREE.ImageUtils.loadTexture('img/player1.png'),
            new THREE.ImageUtils.loadTexture('img/player2.png')
        ]
        var crateTexture = this.branchTexture[1];
        this.mesh = new THREE.Mesh(
            THREE.GeometryUtils.clone( new THREE.CubeGeometry(90, 90, 90) ),
            new THREE.MeshBasicMaterial({ map:crateTexture })
        );
        this.mesh.position.set(-550, 0, 50);
    };

    // TODO: clean this up;
    /**
     * Move player up / left
     * @type {Function}
     */
    Player.prototype.moveUpLeft = function (branch, view) {
        var pl = this.mesh,
            axis;
        axis = (branch == 1) ? pl.position.y : pl.position.x;

        if (axis > -435 && axis < 435) {
            if (branch == 1) {
                if (axis != 420 ) pl.position.y += 15
            } else {
                // TODO: fix quick hack here

                if (this.view == 2 && this.branch == 2 && axis != 420) {
                    pl.position.x += 15;
                } else if (axis != -420) {
                    pl.position.x -= 15;
                }
            }
        }
    };


    /**
     * Move player down / right
     */
    Player.prototype.moveDownRight = function (branch, view) {
        var pl = this.mesh,
            axis;
        axis = (branch == 1) ? pl.position.y : pl.position.x;


        if (axis > -435 && axis < 435) {
            if (branch == 1) {
                if (axis != -420 ) pl.position.y -= 15
            } else {
                // TODO: fix quick hack here

                    if (this.view == 2 && this.branch == 2 && axis != -420) {
                        pl.position.x -= 15;
                    } else if (axis != 420 ) {
                        pl.position.x += 15;
                    }
            }
        }
    };

    /**
     * Player change texture
     * @type {Function}
     */
    Player.prototype.changeTexture = function (branch) {
        this.mesh.material.map = this.branchTexture[branch];
    };

    exports.Player = Player;
})(window);
