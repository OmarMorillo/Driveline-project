// main.js - Scene setup and initialization

class SwingVisualizer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.isPlaying = false;
        this.isScrubbing = false;
        this.wasPlayingBeforeScrub = false;
        this.currentFrame = 0;
        this.totalFrames = 0;
        this.animationSpeed = 1;
        this.loop = true;
        this.pauseAtContact = false;
        this.contactFrame = 0;

        this.init();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupGrid();
        this.setupHomePlate();
        this.setupArrow();
        this.loadData();
        this.animate();
    }

    init() {
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050c18); // Dark navy

        // Data uses Z-up coordinate system (per OBP README); Three.js default is Y-up.
        // Rotate the world so +Z becomes "up" in the rendered scene.
        // We'll instead transform incoming joint coordinates: (x, y, z) -> (x, z, -y)
        // This keeps Three.js Y-up convention and gives a natural camera setup.

        // Fog for depth
        this.scene.fog = new THREE.Fog(0x050c18, 10, 50);
    }

    setupCamera() {
        // Camera created here; Controls.init() sets position + target
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    }

    setupRenderer() {
        const canvas = document.getElementById('threejs-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point light for highlights
        const pointLight = new THREE.PointLight(0x3ab0e0, 0.5, 100);
        pointLight.position.set(-5, 5, 5);
        this.scene.add(pointLight);
    }

    setupGrid() {
        // Dark navy grid 6m x 6m, 30 subdivisions
        const gridHelper = new THREE.GridHelper(6, 30, 0x3ab0e0, 0x3ab0e0);
        gridHelper.position.y = 0;
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }

    setupHomePlate() {
        // Home plate pentagon at origin
        const shape = new THREE.Shape();
        const points = [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(-0.5, 0.5),
            new THREE.Vector2(-0.25, 0.75),
            new THREE.Vector2(0.25, 0.75),
            new THREE.Vector2(0.5, 0.5)
        ];
        shape.setFromPoints(points);

        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.05 });
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const homePlate = new THREE.Mesh(geometry, material);
        homePlate.rotation.x = -Math.PI / 2;
        homePlate.position.y = 0.025;
        homePlate.receiveShadow = true;
        this.scene.add(homePlate);
    }

    setupArrow() {
        // Arrow pointing toward pitcher (+X direction)
        const arrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const arrowMaterial = new THREE.MeshLambertMaterial({ color: 0x3ab0e0 });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.set(2.5, 0.15, 0);
        arrow.rotation.z = -Math.PI / 2;
        this.scene.add(arrow);

        // Arrow shaft
        const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2);
        const shaft = new THREE.Mesh(shaftGeometry, arrowMaterial);
        shaft.position.set(1.5, 0.15, 0);
        shaft.rotation.z = -Math.PI / 2;
        this.scene.add(shaft);
    }

    loadData() {
        // Load data using parser
        Parser.loadData(() => {
            this.totalFrames = Parser.frames.length;
            this.contactFrame = Parser.contactFrameIndex || Math.floor(this.totalFrames * 0.8);
            this.updateUI();

            // Initialize components
            Skeleton.init(this.scene);
            Bat.init(this.scene);
            if (typeof Metrics !== 'undefined' && Metrics.init) Metrics.init();
            Controls.init(this.camera, this.renderer, this);

            // Auto-play
            this.play();
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        if (this.isPlaying && !this.isScrubbing && this.totalFrames > 0) {
            this.currentFrame += deltaTime * 60 * this.animationSpeed;
            if (this.currentFrame >= this.totalFrames) {
                if (this.loop) {
                    this.currentFrame = 0;
                    if (typeof Bat !== 'undefined' && Bat.reset) Bat.reset();
                } else {
                    this.currentFrame = this.totalFrames - 1;
                    this.pause();
                }
            }
            if (this.pauseAtContact && Math.floor(this.currentFrame) === this.contactFrame) {
                this.pause();
            }
            this.updateFrameCounter();
            document.getElementById('scrubber').value = this.currentFrame;
        }

        // Update scene objects
        this.updateScene();

        // Always update frame counter (covers both playback and scrubber drag)
        if (this.totalFrames > 0) this.updateFrameCounter();

        // Update camera controls
        if (typeof Controls !== 'undefined' && Controls.update) Controls.update();

        this.renderer.render(this.scene, this.camera);
    }

    updateScene() {
        // Update skeleton, bat, metrics based on current frame
        if (!Parser.frames || Parser.frames.length === 0) return;
        if (!Skeleton.initialized || !Bat.initialized) return;

        const cf = this.currentFrame;
        const lo = Math.floor(cf);
        const hi = Math.min(lo + 1, Parser.frames.length - 1);
        const f1 = Parser.frames[Math.min(lo, Parser.frames.length - 1)];
        const f2 = Parser.frames[hi];
        if (!f1) return;

        // Smoothstep interpolation between bracketing frames
        const t = cf - lo;
        const sT = t * t * (3 - 2 * t);

        const interpolated = {};
        for (const key in f1) {
            if (typeof f1[key] === 'number' && typeof f2[key] === 'number') {
                interpolated[key] = f1[key] + (f2[key] - f1[key]) * sT;
            } else {
                interpolated[key] = f1[key];
            }
        }

        Skeleton.update(interpolated);
        Bat.update(interpolated);
        if (typeof Metrics !== 'undefined' && Metrics.update) Metrics.update(interpolated);
        if (typeof Computed !== 'undefined' && Computed.update) Computed.update(interpolated);
    }

    play() {
        this.isPlaying = true;
        document.getElementById('play-pause').textContent = 'Pause';
    }

    pause() {
        this.isPlaying = false;
        document.getElementById('play-pause').textContent = 'Play';
    }

    updateUI() {
        document.getElementById('scrubber').max = this.totalFrames;
        this.updateFrameCounter();
    }

    updateFrameCounter() {
        const phase = this.getPhaseLabel(Math.floor(this.currentFrame));
        document.getElementById('frame-counter').textContent = `Frame: ${Math.floor(this.currentFrame)} / ${this.totalFrames} (${phase})`;
    }

    getPhaseLabel(frame) {
        const progress = frame / this.totalFrames;
        if (progress < 0.2) return 'Stance';
        if (progress < 0.4) return 'Load';
        if (progress < 0.6) return 'Stride';
        if (progress < 0.8) return 'Contact';
        return 'Follow Through';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new SwingVisualizer();
});