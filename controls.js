// controls.js - Camera and playback controls with custom locked-target orbit

class Controls {
    // Orbit state
    static isPointerDown = false;
    static prevMouseX = 0;
    static prevMouseY = 0;

    // Default 3/4 view from third-base side
    static DEFAULT_THETA = 2.2;
    static DEFAULT_PHI = 1.05;
    static DEFAULT_RADIUS = 4.0;

    static theta = 2.2;
    static phi = 1.05;
    static radius = 4.0;
    static target = null;

    static init(camera, renderer, visualizer) {
        this.camera = camera;
        this.renderer = renderer;
        this.visualizer = visualizer;
        this.target = new THREE.Vector3(-0.7, 0.9, -0.5);

        this.applyCameraPosition();
        this.setupOrbitListeners();
        this.setupEventListeners();
    }

    static applyCameraPosition() {
        this.camera.position.x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        this.camera.position.y = this.target.y + this.radius * Math.cos(this.phi);
        this.camera.position.z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        this.camera.lookAt(this.target);
    }

    static update() {
        // Camera always looks at target (keeps skeleton centered)
        if (this.camera && this.target) this.camera.lookAt(this.target);
    }

    static setupOrbitListeners() {
        const canvas = this.renderer.domElement;

        // Mousedown on canvas — start drag
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // left click only
                this.isPointerDown = true;
                this.prevMouseX = e.clientX;
                this.prevMouseY = e.clientY;
            }
        });

        // Mousemove on document — orbit while dragging
        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerDown) return;

            const deltaX = e.clientX - this.prevMouseX;
            const deltaY = e.clientY - this.prevMouseY;

            this.theta -= deltaX * 0.008;
            this.phi = Math.max(0.1, Math.min(1.4, this.phi - deltaY * 0.008));

            this.prevMouseX = e.clientX;
            this.prevMouseY = e.clientY;

            this.applyCameraPosition();
        });

        // Mouseup on document — end drag
        document.addEventListener('mouseup', () => {
            this.isPointerDown = false;
        });

        // Wheel on canvas — zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.radius = Math.max(1.5, Math.min(10, this.radius + e.deltaY * 0.005));
            this.applyCameraPosition();
        }, { passive: false });
    }

    static setupEventListeners() {
        document.getElementById('play-pause').addEventListener('click', () => {
            if (this.visualizer.isPlaying) {
                this.visualizer.pause();
            } else {
                this.visualizer.play();
            }
        });

        const scrubber = document.getElementById('scrubber');

        // On drag start: freeze the animation loop, remember play state
        const onScrubStart = () => {
            this.visualizer.wasPlayingBeforeScrub = this.visualizer.isPlaying;
            this.visualizer.isScrubbing = true;
            this.visualizer.isPlaying = false;
            document.getElementById('play-pause').textContent = 'Play';
        };
        scrubber.addEventListener('mousedown', onScrubStart);
        scrubber.addEventListener('touchstart', onScrubStart, { passive: true });

        // While dragging: set frame position (loop renders it but doesn't advance)
        scrubber.addEventListener('input', (e) => {
            this.visualizer.currentFrame = parseFloat(e.target.value);
        });

        // On drag end: resume from this exact frame.
        // Use document-level mouseup/touchend — the scrubber's own `change`
        // event fires mid-drag on some browsers, which prematurely resumes
        // playback and lets the animation loop leapfrog the slider position.
        const onScrubEnd = () => {
            if (!this.visualizer.isScrubbing) return;
            this.visualizer.isScrubbing = false;
            if (this.visualizer.wasPlayingBeforeScrub) {
                this.visualizer.clock.getDelta(); // drain accumulated delta so no jump
                this.visualizer.play();
            }
        };
        document.addEventListener('mouseup', () => {
            if (this.visualizer.isScrubbing) onScrubEnd();
        });
        document.addEventListener('touchend', () => {
            if (this.visualizer.isScrubbing) onScrubEnd();
        });

        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.visualizer.animationSpeed = parseFloat(btn.dataset.speed);
            });
        });

        // View presets — set theta/phi/radius for each view
        document.getElementById('view-3q').addEventListener('click', () => {
            this.theta = this.DEFAULT_THETA;
            this.phi = this.DEFAULT_PHI;
            this.radius = this.DEFAULT_RADIUS;
            this.applyCameraPosition();
        });
        document.getElementById('view-side').addEventListener('click', () => {
            this.theta = Math.PI;
            this.phi = 1.2;
            this.radius = 4.0;
            this.applyCameraPosition();
        });
        document.getElementById('view-top').addEventListener('click', () => {
            this.theta = this.DEFAULT_THETA;
            this.phi = 0.15;
            this.radius = 5.0;
            this.applyCameraPosition();
        });
        document.getElementById('view-front').addEventListener('click', () => {
            this.theta = Math.PI / 2;
            this.phi = 1.2;
            this.radius = 4.0;
            this.applyCameraPosition();
        });
        document.getElementById('reset-camera').addEventListener('click', () => {
            this.theta = this.DEFAULT_THETA;
            this.phi = this.DEFAULT_PHI;
            this.radius = this.DEFAULT_RADIUS;
            this.applyCameraPosition();
        });

        document.getElementById('loop-toggle').addEventListener('change', (e) => {
            this.visualizer.loop = e.target.checked;
        });

        document.getElementById('pause-contact-toggle').addEventListener('change', (e) => {
            this.visualizer.pauseAtContact = e.target.checked;
        });
    }
}