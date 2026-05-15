// bat.js - Bat path and trail rendering

class Bat {
    static batMesh = null;
    static trailPoints = [];
    static trailMesh = null;
    static contactSphere = null;
    static initialized = false;

    // Helper: convert OBP (x_pitcher, y_rhhbox, z_up) -> Three.js (x, z_up, -y)
    static toWorld(x, y, z) {
        return new THREE.Vector3(x || 0, z || 0, -(y || 0));
    }

    static init(scene) {
        this.scene = scene;
        this.createBat();
        this.createTrail();
        this.createContactSphere();
        this.initialized = true;
    }

    static createBat() {
        // Bat as cylinder from knob to barrel (scaled per-frame)
        const geometry = new THREE.CylinderGeometry(0.02, 0.03, 1, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0xf0c040 }); // Gold
        this.batMesh = new THREE.Mesh(geometry, material);
        this.batMesh.castShadow = true;
        this.scene.add(this.batMesh);
    }

    static createTrail() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.9
        });
        this.trailMesh = new THREE.Line(geometry, material);
        this.scene.add(this.trailMesh);
    }

    static createContactSphere() {
        const geometry = new THREE.SphereGeometry(0.08, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffaa33,
            transparent: true,
            opacity: 0.7
        });
        this.contactSphere = new THREE.Mesh(geometry, material);
        this.contactSphere.visible = false;
        this.scene.add(this.contactSphere);
    }

    static update(frame) {
        // Use blast_hand (knob) and sweet_spot (barrel) — tracked directly.
        const knob = this.toWorld(frame.blast_hand_x, frame.blast_hand_y, frame.blast_hand_z);
        const barrel = this.toWorld(frame.sweet_spot_x, frame.sweet_spot_y, frame.sweet_spot_z);

        const direction = new THREE.Vector3().subVectors(barrel, knob);
        const length = direction.length();
        const midpoint = new THREE.Vector3().addVectors(knob, barrel).multiplyScalar(0.5);

        if (length > 0.01) {
            this.batMesh.position.copy(midpoint);
            this.batMesh.scale.set(1, length, 1);
            const up = new THREE.Vector3(0, 1, 0);
            const quat = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
            this.batMesh.quaternion.copy(quat);
        }

        this.trailPoints.push(barrel.clone());
        if (this.trailPoints.length > 40) {
            this.trailPoints.shift();
        }

        if (this.trailPoints.length > 1) {
            const positions = [];
            const colors = [];
            for (let i = 0; i < this.trailPoints.length; i++) {
                const point = this.trailPoints[i];
                positions.push(point.x, point.y, point.z);
                const brightness = (i + 1) / this.trailPoints.length;
                colors.push(brightness, 0, 0);
            }
            this.trailMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            this.trailMesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        }

        // Contact sphere
        const contactTime = frame.contact_time || 0;
        const isContact = Math.abs((frame.time || 0) - contactTime) < 0.02;
        this.contactSphere.visible = isContact;
        if (isContact) {
            this.contactSphere.position.copy(barrel);
        }
    }

    static reset() {
        this.trailPoints = [];
    }
}