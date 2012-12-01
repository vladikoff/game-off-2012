(function (exports) {

    var CoreCommit = function (project) {
        // standard global variables
        var container, scene, camera, stats, self = this;

        this.setGameVariables(project);
        // enable events for this object
        this.extendAsEventDispatcher();
        // add custom events
        this.addCustomEvents();

        // CAMERA
        var VIEW_ANGLE = 45, ASPECT = this.SCREEN_WIDTH / this.SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
        camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
        camera.position.set(1200, 0, 4000);

        this.camera = camera;
        this.camera.up.set(0,0,0);

        // SCENE
        scene = new THREE.Scene();
        scene.position.set(0, 0, 0);
        this.scene = scene;
        scene.add(camera);

        // ROTATOR
        var crateMaterial = new THREE.MeshBasicMaterial({ color:0xff4747, transparent:true, opacity:0 });
        this.__rotator = new THREE.Mesh(THREE.GeometryUtils.clone(new THREE.CubeGeometry(60, 25, 25)), crateMaterial);
        this.__rotator.position.set(0,0,0);
        this.scene.add(this.__rotator);

        // RENDERER
        this.renderer = new THREE.WebGLRenderer({antialias:false});
        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        container = document.createElement('div');
        document.body.appendChild(container);
        container.appendChild(this.renderer.domElement);

        // EVENTS
        THREEx.WindowResize(this.renderer, this.camera);
        //THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
        // CONTROLS
        //controls = new THREE.TrackballControls( camera );

        // STATS
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.bottom = '0px';
        stats.domElement.style.zIndex = 100;
        this.stats = stats;
        //container.appendChild(stats.domElement);

        // Create git branches
        this.generateBranches();
        // Load Textures
        this.loadTextures();

        // GAMEPAD SUPPORT
        // Add gamepad support
        this.prevRawGamepadTypes = [];
        this.gamepad = new GamepadSupport();

        // Add a new player
        this.player = new Player();
        // set the current view
        this.player.view = 4;
        scene.add(this.player.mesh);
    };


    /**
     * Animate the game
     */
    CoreCommit.prototype.start = function () {
        var self = this;
        this.dispatchEvent({type:'start'});
        var endAnim = new TWEEN.Tween(this.camera.position)
            .onUpdate(function(){
                self.camera.lookAt(self.scene.position);
            })
            .to({ x:0, z:2200 }, 1500)
            .easing(TWEEN.Easing.Sinusoidal.In).start();



        this.animate(); // keep last

        this.addEventListener('handleCollision', function (e) {
            self.handleCollision(e.data);
        });
    };


    /**
     * Animate the game
     */
    CoreCommit.prototype.animate = function () {
        // support gamepads
        this.gamepad.checkGamepadSupport();

        // game frame update
        this.update();

        // animates tweens
        TWEEN.update();

        // increase frames
        this.FRAME++;

        // game over
        if (!this.PAUSED) window.requestAnimFrame(this.animate.bind(this));
    };


    CoreCommit.prototype.sendSession = function (s) {
        this.dispatchEvent(this.sendSessionEvent);
    };


    /**
     * increase game level, change difficulty and speeds
     */
    CoreCommit.prototype.trackGameLevel = function () {
        var level,
            minSpeed = 17000;

        if (this.FRAME > 1000) {
            level = parseInt(this.FRAME / 1000, 10);
            if (level > this.SESSION.LEVEL) {
                // up level!
                this.SESSION.LEVEL = level;
                this.dispatchEvent(new CustomEvent('levelUpdate', { 'detail':this.SESSION.LEVEL  }));

                if (this.__CRATE_RATE > 65) this.__CRATE_RATE -= 8;
                // Increase speed here too.
                if (this.SPEED > minSpeed) this.SPEED -= 700;
            }
        }
    };


    /**
     * update frame
     */
    CoreCommit.prototype.update = function () {

        this.renderer.render(this.scene, this.camera);

        var self = this,
            kb = this.keyboard; // keyboard


        if (this.LIFE <= 0) {
            this.endGame();
        }

        // up the speeds, show notifications
        this.trackGameLevel();

        if (this.gamepad.GAMEPADS && this.gamepad.GAMEPADS.length > 0) {
            if (! this.gamepadConnected) {
                this.gamepadConnected = true;
                this.dispatchEvent(new CustomEvent('gamepadConnected'));
            }
            for (var i in this.gamepad.GAMEPADS) {
                var gamepad = this.gamepad.GAMEPADS[i];
                if (gamepad.buttons[0] && this.AMMO) { // A - attack
                    this.AMMO = false;
                    this.NEW_BULLET = this.FRAME + 20;
                    self.playerShoot();
                }

                if (gamepad.buttons[8] || gamepad.buttons[9] || gamepad.buttons[4] || gamepad.buttons[5]) {
                    if (!this.SWITCHING) {
                        if (this.player.view == this.VIEW.TOP) {
                            self.switchMode('3d');
                        } else {
                            self.switchMode('top');
                        }
                    }
                }

                if (gamepad.buttons[2]) {
                    if (!this.SWITCHING && this.player.view != this.VIEW.TOP) {
                        self.rotateMode('left', true);
                    } else if (!this._teleporting) {
                        self.teleportPlayer(null, 'left');
                    }
                }

                if (gamepad.buttons[3]) {
                    if (!this.SWITCHING && this.player.view != this.VIEW.TOP) {
                        self.rotateMode('right', true);
                    } else if (!this._teleporting) {
                        self.teleportPlayer();
                    }
                }

                // feature disabled, always true
                if (gamepad.buttons[6]) {
                    if (!this.SWITCHING && this.player.view != this.VIEW.TOP) {
                        self.rotateMode('left', true);
                    }  else if (!this._teleporting) {
                        self.teleportPlayer(null, 'left');
                    }
                }

                if (gamepad.buttons[7] || gamepad.buttons[3]) {
                    if (!this.SWITCHING && this.player.view != this.VIEW.TOP) {
                        self.rotateMode('right', true);
                    } else if (!this._teleporting) {
                        self.teleportPlayer();
                    }
                }

                if (gamepad.buttons[1]) {
                    if (!this._teleporting) {
                        self.teleportPlayer();
                    }
                }

                if (gamepad.buttons[12] || gamepad.axes[1] < -0.25 || gamepad.axes[3] < -0.25) { // up
                    this.player.moveUpLeft(this.player.branch, this.VIEW);
                }
                if (gamepad.buttons[13] || gamepad.axes[1] > 0.25 || gamepad.axes[3] > 0.25) { // down
                    this.player.moveDownRight(this.player.branch, this.VIEW);
                }
                if (gamepad.buttons[14] || gamepad.axes[0] < -0.25 || gamepad.axes[2] < -0.25) { // left
                    this.player.moveUpLeft(this.player.branch, this.VIEW);
                }
                if (gamepad.buttons[15] || gamepad.axes[0] > 0.25 || gamepad.axes[2] > 0.25) { // right
                    this.player.moveDownRight(this.player.branch, this.VIEW);
                }
            }
        } else {
            if (this.gamepadConnected) {
                this.gamepadConnected = false;
                this.dispatchEvent('gamepadDisconnected');
            }
        }

        // teleport between branches
        if (kb.pressed('tab')) {
            if (!this.SWITCHING && this.player.view != this.VIEW.TOP) {
                self.rotateMode('right', true);
            } else if (!this._teleporting) {
                self.teleportPlayer();
            }
        }

        if (( kb.pressed('up') || kb.pressed('left') )) {
            this.player.moveUpLeft(this.player.branch, this.VIEW);
        }

        if (kb.pressed('down') || kb.pressed('right')) {
            this.player.moveDownRight(this.player.branch, this.VIEW);
        }


        if (kb.pressed('space') && (this.AMMO)) {
                this.AMMO = false;
                this.NEW_BULLET = this.FRAME + 20;
                self.playerShoot();
        }

        if ((this.NEW_BULLET == this.FRAME)) {
            this.AMMO = true;
        }

        if (kb.pressed('e')) {
            if (!this.SWITCHING) {
                if (this.player.view == this.VIEW.TOP) {
                    self.switchMode('3d');
                } else {
                    self.switchMode('top');
                }
            }
        }


        if (kb.pressed('q')) {
            if (!this.SWITCHING && this.player.view != this.VIEW.TOP) {
                self.rotateMode('left', true);
            } else if (!this._teleporting) {
                self.teleportPlayer(null, 'left');
            }
        }

        if (kb.pressed('w')) {
            if (!this.SWITCHING && this.player.view != this.VIEW.TOP) {
                self.rotateMode('right', true);
            } else if (!this._teleporting) {
                self.teleportPlayer();
            }
        }

        // generate game grates
        if (this.NEW_CRATE_TIMER == this.FRAME) {
            this.NEW_CRATE_TIMER = this.FRAME + this.__CRATE_RATE;
            self.generateCrates();
        }

        _.each(self.BULLETS, function (bullet) {
            // detect bullet collisions
            self.detectCollision(bullet);

        });

        var timer = ( Date.now() * 0.04 );
        if (self.CRATES_GENERATING) {
            _.each(self.CRATES, function (crate) {

                crate.rotation.y = 0.01 * timer;
                crate.rotation.x = 0.01 * timer;
            });
        }

        // STATS
        //this.stats.update();
    };


    /**
     * detect collision
     * @param bullet
     */
    CoreCommit.prototype.detectCollision = function (bullet) {
        var self = this,
            cObj,
            originPoint = bullet.position.clone();

        // strange issue here, .intersectObjects(objects) used to report a lot of false collisions.
        _.each(self.CRATES, function (crate) {
            for (var vertexIndex = 0; vertexIndex < bullet.geometry.vertices.length; vertexIndex++) {
                var localVertex = bullet.geometry.vertices[vertexIndex].clone();
                //var globalVertex = bullet.matrix.multiplyVector3(localVertex);
                //var directionVector = globalVertex.subSelf(bullet.position);

                var ray = new THREE.Ray(originPoint, localVertex.clone().normalize());
                var collisionResults = ray.intersectObject(crate);
                if (collisionResults.length > 0 ) {
                    cObj = collisionResults[0].object;
                    break;
                }
            }
        });

        if (cObj) {
            self.scene.remove(cObj);
            self.scene.remove(bullet);
            cObj.dead = true;
            bullet.tween.stop();
            self.BULLETS = _.without(self.BULLETS, bullet);
            self.CRATES = _.without(self.CRATES, cObj);

            // TODO: this works, but wrong. fix later
            var e = {type:'handleCollision', data:cObj };
            self.dispatchEvent(e);
        }
    };


    /**
     * switch to a different branch
     */
    CoreCommit.prototype.gameSwitchBranch = function () {
        var newBranch = this.GAME_BRANCH;
        while (newBranch == this.GAME_BRANCH) {
            newBranch = parseInt(Math.random() * 3, 10); // choose a branch from 0 to 2
        }
        this.GAME_BRANCH = newBranch;
        _.each(this.branches, function (branch) {
            branch.unsetCurrent();
        });
        this.branches[this.GAME_BRANCH].setCurrent();
    };


    /**
     * handleCollision for the crates
     * @param crate
     */
    CoreCommit.prototype.handleCollision = function (crate) {
        var crateType = crate.type;
        if (crate.regularCrate) {
            // switch branch if you killed a good code crate :(
            if (crate.goodCrate) {
                this.decreaseLife();
                if (this.GAME_BRANCH == crate.targetBranch) {
                    this.gameSwitchBranch();
                }
            }
        } else {
            switch (crateType) {
                case 0: // changeBranch
                    this.gameSwitchBranch();
                    break;
                case 1: // star
                    this.sendSession(this.SESSION);
                    break;
                default:
                    this.sendSession(this.SESSION);
                    break
            }
        }
    };


    /**
     * endGame
     */
    CoreCommit.prototype.endGame = function () {
        var self = this;

        if (! self._gameover_anim) {
            self._gameover_anim = true;
            this.SESSION.END_TIME = Date.now();
            this.SESSION.GAMEOVER = true;
            var endAnim = new TWEEN.Tween(self.camera.position)
                .to({ z:25000 }, 4000)
                .easing(TWEEN.Easing.Sinusoidal.In).start();

            endAnim.onComplete(function () {
                self.PAUSED = true;
            });

            this.dispatchEvent(this.gameOverEvent);
            this.dispatchEvent(this.sendSessionEvent);
        }
    };


    /**
     * rotate 3d view;
     * @param type , type of rotation
     */
    CoreCommit.prototype.rotateMode = function (type, teleport) {
        this.SWITCHING = true;
        var self = this;
        // TODO: this can be optimized.
        var poses = [
            new THREE.Vector3(0, -1600, 900),
            new THREE.Vector3(-1600, 0, 900),
            new THREE.Vector3(0, 1600, 900)
        ];

        if (type == 'left') {
            this.player.view = (this.player.view < 2) ? ++this.player.view : 0;
        } else {
            this.player.view = (this.player.view > 0) ? --this.player.view : 2;
        }

        var anim2 = new TWEEN.Tween(this.camera.position).to(poses[this.player.view], 500)
            .easing(TWEEN.Easing.Back.Out)
            .onUpdate(function () {
                self.camera.lookAt(self.__rotator.position);
            })
            .onComplete(function(){
               self.SWITCHING = false;
            })
            .start();

        if (teleport) {
            this.teleportPlayer(this.player.view);
        }
    };


    /**
     * switch view mode
     * @param direction
     */
    CoreCommit.prototype.switchMode = function (direction) {
        var self = this,
            animPos,
            cameraLookAt;

        this.SWITCHING = true;

        // switch mode between top and 3d
        if(direction == 'top') {
            this.camera.up.set(0,0,0);
            this.player.view = this.VIEW.TOP;
            animPos = new THREE.Vector3(0, 0 , 2200);
        } else {
            animPos = this.branches[this.player.branch]._cameraPos;
        }

        if(direction == '3d') {
            this.camera.up.set(0,0,1);
            // if we are entering 3D, go to the player branch
            animPos = this.branches[this.player.branch]._cameraPos;
            this.player.view = this.player.branch;

        }

        var anim2 = new TWEEN.Tween(this.camera.position).to(animPos, 250)
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(function () {
                self.camera.lookAt(self.__rotator.position);
            })
            .start();

        anim2.onComplete(function () {
            self.SWITCHING = false;
        });
    };


    /**
     * handle shooting
     */
    CoreCommit.prototype.playerShoot = function () {
        var self = this,
            shootRate = 1200,
            shootAt,
            geom;

        // TODO: fix this
        var crateMaterial = new THREE.MeshBasicMaterial({ color:0xff4747, transparent:true, opacity:1 });

        if (this.player.branch == 0 || this.player.branch == 2) {
            geom = new THREE.CubeGeometry(25, 60, 25)
        } else {
            geom = new THREE.CubeGeometry(60, 25, 25)
        }

        var bullet = new THREE.Mesh(THREE.GeometryUtils.clone(geom), crateMaterial);

        bullet.position.set(this.player.mesh.position.x, this.player.mesh.position.y, 0);
        bullet.bulletId = self.BULLETS.length;
        this.scene.add(bullet);


        switch (this.player.branch) {
            case 0:
                shootAt = { y:950 };
                break;
            case 1:
                shootAt = { x:950 };
                break;
            case 2:
                shootAt = { y:-950 };
                break;
        }

        bullet.tween = new TWEEN.Tween(bullet.position).to(shootAt, shootRate)
            .easing(TWEEN.Easing.Linear.None).start();

        bullet.tween.onComplete(function () {
            if (bullet) {
                self.BULLETS = _.without(self.BULLETS, bullet);
                self.scene.remove(bullet);
            }
        });

        self.BULLETS.push(bullet);
    };


    /**
     * Generate game crates
     */
    CoreCommit.prototype.generateCrates = function () {
        var self = this,
            textureFile,
            regularCrate = false,
            crateType,
            cStartDistance = 3100,
            extraDistance = 0;

        this.CRATES_GENERATING = true;

        // decide if we want to create a special crate
        var lucky = parseInt(Math.random() * 50, 10); // random between 0 - 5
        if (lucky < 10) {
            // set the lucky crate type
            crateType = parseInt(Math.random() * 2, 10); // random between 0 =>< 3
            textureFile = self.otherCrateList[crateType];
            regularCrate = false;
            if (crateType == 1) { // if it is a star
                extraDistance = 95;
            }
        } else {
            // create a branch create
            regularCrate = true;
            crateType = parseInt(Math.random() * 5, 10); // random between 0 - 5
            textureFile = self.branchCrateList[crateType];
        }

        this.__CRATE_SIZE = (this.__CRATE_SIZE >= 50) ? --this.__CRATE_SIZE : 50;
        var size = this.__CRATE_SIZE;
        // crate mesh
        var crateMaterial = new THREE.MeshBasicMaterial({ map:textureFile }),
            crate = new THREE.Mesh(THREE.GeometryUtils.clone(new THREE.CubeGeometry(size, size, size)), crateMaterial);

        // crate points
        var landingPointTween,
            startingP = Math.floor(Math.random() * 931) - 465, // random starting point
            landingRandomPoint = Math.floor(Math.random() * 931) - 465; // random landing point

        // depending on the branch, the starting point should be different
        // also define the tween to fly properly
        if (this.GAME_BRANCH == 0) { // from the right
            crate.position.set(startingP, cStartDistance, 0);
            landingPointTween = { x:landingRandomPoint, y:-485 - extraDistance };
        }
        else if (this.GAME_BRANCH == 1) { // from the top
            crate.position.set(cStartDistance, startingP, 0);
            landingPointTween = { x:-485 - extraDistance, y:landingRandomPoint };
        }
        else if (this.GAME_BRANCH == 2) { // from the bottom
            crate.position.set(startingP, -cStartDistance, 0);
            landingPointTween = { x:landingRandomPoint, y:485 + extraDistance };
        }

        crate.regularCrate = regularCrate;
        crate.type = crateType;
        crate.dead = false;
        crate.targetPosition = landingPointTween;

        // set the targetBranch
        var tb;
        if ((crate.type == 4) || (crate.type == 5)) tb = 0;
        if ((crate.type == 2) || (crate.type == 3)) tb = 1;
        if ((crate.type == 0) || (crate.type == 1)) tb = 2;

        crate.branch = tb;
        crate.targetBranch = this.GAME_BRANCH;
        crate.goodCrate = !!((this.GAME_BRANCH == tb));
        this.scene.add(crate);

        crate.animation = new TWEEN.Tween(crate.position)
            .to(landingPointTween, this.SPEED).start();

        crate.animation.onComplete(function () {  // the crate is landing
            if (crate) {
                self.scene.remove(crate);
                self.CRATES = _.without(self.CRATES, crate);
                self.checkCrateLanding(crate);
            }
        });

        this.CRATES.push(crate);
    };


    /**
     * Checking if the landed crate is in the the right branch
     * checking if the player captured the crate
     */
    CoreCommit.prototype.checkCrateLanding = function (crate) {
        var pl = this.player.mesh;

        // branch switcher
        if (!crate.regularCrate && crate.type == 0) {
            this.gameSwitchBranch();
        }

        // star
        if (!crate.regularCrate && crate.type == 1) {
            if (pl.position.x) {
                var originPoint = pl.position.clone();

                for (var vertexIndex = 0; vertexIndex < pl.geometry.vertices.length; vertexIndex++) {
                    var localVertex = pl.geometry.vertices[vertexIndex].clone();
                    var globalVertex = pl.matrix.multiplyVector3(localVertex);
                    var directionVector = globalVertex.subSelf(pl.position);

                    var ray = new THREE.Ray(originPoint, directionVector.clone().normalize());
                    var collisionResults = ray.intersectObject(crate);

                    // if the player position is close to a crate, the player captures it.
                    if (collisionResults.length > 0 &&
                        collisionResults[0].distance < directionVector.length()) {
                        this.SESSION.STARS++;
                        this.dispatchEvent(this.sendSessionEvent);
                        this.branches[crate.targetBranch].commit();
                        this.collectStar(crate);
                        break;
                    }
                }
            }
        }

        // regular crates
        if ((!crate.dead) && crate.regularCrate) {
            if ((crate.targetBranch != crate.branch)) {
                // if the crate is not dead, and if it does not match a proper branch
                this.decreaseLife();
                // bad collision, add effects to this branch
                this.branches[crate.targetBranch].hit();
            } else {
                this.SESSION.COMMITS++;
                this.dispatchEvent(this.sendSessionEvent);
                this.collectStar(crate);
            }
        }
    };


    /**
     * decreaseLife
     */
    CoreCommit.prototype.decreaseLife = function () {
        this.LIFE -= 10;
        // TODO: fix this.
        var e = {type:'decreaseLife', data:this.LIFE };
        this.dispatchEvent(e);
    };


    /**
     * collectStar
     */
    CoreCommit.prototype.collectStar = function (crate) {
        var self = this,
            starMesh = crate.material,
            starCollect = new THREE.Mesh(THREE.GeometryUtils.clone(new THREE.CubeGeometry(50, 50, 50)), starMesh);

        starCollect.position.set(crate.targetPosition.x, crate.targetPosition.y, 0);
        this.scene.add(starCollect);
        var cP = this.camera.position;
        var cameraPos = new THREE.Vector3(cP.x, cP.y, cP.z);
        cameraPos.x -= 200;
        starCollect.animation = new TWEEN.Tween(starCollect.position)
            .to(cameraPos, 500)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();

        starCollect.animation.onComplete(function () {
            if (starCollect) {
                self.scene.remove(starCollect);
            }
        });
    };


    /**
     * teleportPlayer between branch positions
     */
    CoreCommit.prototype.teleportPlayer = function (branch, direction) {
        var self = this;

        this._teleporting = true;
        // depending on which branch you are on, clockwise teleport between branches
        if (branch != null) {
            this.player.branch = branch;
        } else {
            if (direction == "left") {
                this.player.branch = (this.player.branch == 0) ? 2 : this.player.branch - 1;
            } else {
                this.player.branch = (this.player.branch == 2) ? 0 : this.player.branch + 1;
            }
        }
        var r = new TWEEN.Tween(this.player.mesh.position)
            .to(this.branches[this.player.branch].getCenter(), 300)
            .easing(TWEEN.Easing.Back.InOut).start();

        r.onComplete(function () {
            self.player.changeTexture(self.player.branch);
            self._teleporting = false;
        });
    };



    /**
     * Create Game Branches
     */
    CoreCommit.prototype.generateBranches = function () {
        this.branches = [
            // posX, posY, posZ, color, cameraPos, cameraLookAtPos, playerShift
            new Branch(0, -480, 50, 0xd23aa1, new THREE.Vector3(0, -1600, 900), new THREE.Vector3(0, 1000, -100), -75), // purple
            new Branch(-480, 0, 50, 0xffb139, new THREE.Vector3(-1600, 0, 900), new THREE.Vector3(1000, 0, -100), -75), // orange
            new Branch(0, 480, 50, 0x2bc3db, new THREE.Vector3(0, 1600, 900), new THREE.Vector3(0, -1000, 220), 75) // teal
        ];

        this.branches[0].mesh.rotation.z = 90 * Math.PI / 180;
        this.branches[2].mesh.rotation.z = 90 * Math.PI / 180;

        this.branches[this.GAME_BRANCH].setCurrent();

        this.scene.add(this.branches[0].mesh);
        this.scene.add(this.branches[1].mesh);
        this.scene.add(this.branches[2].mesh);

    };


    /**
     * Load crate textures
     */
    CoreCommit.prototype.loadTextures = function () {

        // Code crate textures
        this.branchCrateList = [
            new THREE.ImageUtils.loadTexture('img/crTealPCode.png'), // 0
            new THREE.ImageUtils.loadTexture('img/crTealMCode.png'), // 1
            new THREE.ImageUtils.loadTexture('img/crOrangePCode.png'), // 2
            new THREE.ImageUtils.loadTexture('img/crOrangeMCode.png'), // 3
            new THREE.ImageUtils.loadTexture('img/crPurplePCode.png'), // 4
            new THREE.ImageUtils.loadTexture('img/crPurplePCode.png')  // 5
        ];

        // Other crate textures
        this.otherCrateList = [
            new THREE.ImageUtils.loadTexture('img/crPR.png'), // 0
            new THREE.ImageUtils.loadTexture('img/crStar.png') // 1
        ];
    };


    /**
     * Setup custom events
     */
    CoreCommit.prototype.addCustomEvents = function () {
        this.sendSessionEvent = new CustomEvent('session', { 'detail':this.SESSION });
        this.gameOverEvent = new CustomEvent('gameOver', { 'detail':this.SESSION });
    };


    /**
     * Setup custom events
     */
    CoreCommit.prototype.setGameVariables = function (project) {
        // game session
        this.SESSION = {
            START_TIME:Date.now(), END_TIME:Date.now(), LEVEL:0, STARS:0, COMMITS:0, GAMEOVER:false,
            SWITCHED_BRANCH:0, PROJECT:project
        };

        // types of views
        this.VIEW = {TOP:4, CENTER:1, LEFT:2, RIGHT:0};

        // game branch
        this.GAME_BRANCH = 1; // current git branch bottom - 0, left - 1, top - 2

        // create a counter for frames
        this.FRAME = 0;
        this.SPEED = 25000;
        this.__CRATE_RATE = 145;
        this.__CRATE_SIZE = 100;

        // a timer for crates
        this.NEW_CRATE_TIMER = 0;
        // a timer for bullets
        this.NEW_BULLET = 0;
        this.AMMO = true;

        // paused state
        this.PAUSED = false;

        // enable keyboard plugin
        this.keyboard = new THREEx.KeyboardState();

        // setup player life level
        this.LIFE = 100;

        // CAMERA
        this.SCREEN_WIDTH = window.innerWidth;
        this.SCREEN_HEIGHT = window.innerHeight;


        this.BULLETS = [];  // track bullets
        this.CRATES = []; // track crates
    };


    /**
     * Object that during their initialization can call this function
     * This will extend the calling object with basic
     * Event Dispatching functionality
     *
     */
    CoreCommit.prototype.extendAsEventDispatcher = function () {
        if (this._listeners == null) {
            this._listeners = [];
        }
        this.isEventDispatcher = true;
        if (typeof(this.dispatchEvent) == 'undefined') {
            this.dispatchEvent = function (eventObject) {
                for (var i = 0; i < this._listeners.length; i++) {
                    var test = this._listeners[i];
                    if (test.type === eventObject.type) {
                        test.callback(eventObject);
                        break;
                    }
                }
            };
        }
        if (typeof(this.addEventListener) == 'undefined') {
            this.addEventListener = function (type, callback, capture) {
                // no dupes
                var declared = false;
                for (var i = 0; i < this._listeners.length; i++) {
                    var test = this._listeners[i];
                    if (test.type === type && test.callback === callback) {
                        declared = true;
                        break;
                    }
                }
                if (!declared) {
                    this._listeners.push({'type':type, 'callback':callback, 'capture':capture});
                }
            };
        }
    };

    exports.CoreCommit = CoreCommit;

})(window);
