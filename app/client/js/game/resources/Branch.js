(function (exports) {

    /**
     * Game Branch
     * @param posX
     * @param posY
     * @param posZ
     * @param color
     * @param cameraPos
     * @param cameraLookAtPos
     * @constructor
     */
    var Branch = function (posX, posY, posZ, color, cameraPos, cameraLookAtPos, playerShift) {
        this._posX = posX;
        this._posY = posY;
        this._posZ = posZ;
        this._cameraPos = cameraPos;
        this._cameraLookAtPos = cameraLookAtPos;
        this._orientation = (posY == 0) ? 'x' : 'y';
        this._playerShift = playerShift;

        // branch 1 - left
        this.mesh = new THREE.Mesh(
            THREE.GeometryUtils.clone(new THREE.CubeGeometry(60, 900, 120)),
            new THREE.MeshBasicMaterial({ color:color, transparent:true, opacity:0.35 }));
        this.mesh.position.set(posX, posY, posZ);
    };


    /**
     * Branch hit by an object
     */
    Branch.prototype.hit = function () {
        if (!this._animated)  {
            this._animated = true;
            this._end = new Date(Date.now() + 500);
            this._anim();
        }
    };


    /**
     * Set this branch as current
     */
    Branch.prototype.setCurrent = function () {
        this.current = true;
        this.mesh.material.opacity = 1.0;
    };


    /**
     * Unset this branch as current
     */
    Branch.prototype.unsetCurrent = function () {
        this.current = false;
        this.mesh.material.opacity = 0.35;
    };


    /**
     * Animate the branch hit
     * @private
     */
    Branch.prototype._anim = function  () {
        var self = this;

        var timer = Date.now() * 0.01; // SPEED
        var cos = Math.cos(timer); // Amp
        //this.mesh.position.x += (cos > 0) ? -0.3 : 0.3;
        this.mesh.material.opacity = Math.abs(cos);
        if (this._end < Date.now()) {
            this._animated = false;

            this.mesh.material.opacity = (this.current) ? 1.0 : 0.35 ;
        }

        if (this._animated) window.requestAnimFrame(this._anim.bind(this));
    };


    Branch.prototype.commit = function () {
        // opacity up?
    };


    /**
     * Get the center position for the player teleport
     * @return {Object}
     */
    Branch.prototype.getCenter = function () {
        // TODO: patch this.
        if (this._orientation == 'y') {
            return {x: this._posX, y: this._posY + this._playerShift, z: this._posZ};
        } else {
            return {x: this._posX + this._playerShift, y: this._posY, z: this._posZ};
        }
    };

    exports.Branch = Branch;
})(window);
