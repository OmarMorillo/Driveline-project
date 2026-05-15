// skeleton.js - Joint and bone rendering

class Skeleton {
    static joints = {};
    static bones = [];
    static initialized = false;

    static init(scene) {
        this.scene = scene;
        this.createJoints();
        this.createBones();
        this.initialized = true;
    }

    static createJoints() {
        // Joint definitions with positions and colors
        const jointDefs = [
            // Head and neck
            { name: 'head', color: 0xD2B48C }, // Skin tone
            { name: 'neck', color: 0x3ab0e0 },

            // Shoulders
            { name: 'lshoulder', color: 0x3ab0e0 },
            { name: 'rshoulder', color: 0x3ab0e0 },

            // Elbows
            { name: 'lelbow', color: 0x3ab0e0 },
            { name: 'relbow', color: 0x3ab0e0 },

            // Wrists
            { name: 'lwrist', color: 0xFFFF00 }, // Yellow
            { name: 'rwrist', color: 0xFFFF00 },

            // Hands
            { name: 'lhand', color: 0xFFFF00 },
            { name: 'rhand', color: 0xFFFF00 },

            // Spine
            { name: 'spine', color: 0x3ab0e0 },

            // Hips
            { name: 'lhip', color: 0x00FF00 }, // Green
            { name: 'rhip', color: 0x00FF00 },

            // Knees
            { name: 'lknee', color: 0x3ab0e0 },
            { name: 'rknee', color: 0x3ab0e0 },

            // Ankles
            { name: 'lankle', color: 0x3ab0e0 },
            { name: 'rankle', color: 0x3ab0e0 }
        ];

        jointDefs.forEach(def => {
            const geometry = new THREE.SphereGeometry(0.05, 8, 8);
            const material = new THREE.MeshLambertMaterial({ color: def.color });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.castShadow = true;
            this.joints[def.name] = sphere;
            this.scene.add(sphere);
        });
    }

    static createBones() {
        // Bone connections
        const boneDefs = [
            // Head to neck
            ['head', 'neck'],

            // Neck to shoulders and spine
            ['neck', 'lshoulder'],
            ['neck', 'rshoulder'],
            ['neck', 'spine'],

            // Shoulders to elbows
            ['lshoulder', 'lelbow'],
            ['rshoulder', 'relbow'],

            // Elbows to wrists
            ['lelbow', 'lwrist'],
            ['relbow', 'rwrist'],

            // Wrists to hands
            ['lwrist', 'lhand'],
            ['rwrist', 'rhand'],

            // Spine to hips
            ['spine', 'lhip'],
            ['spine', 'rhip'],

            // Hips to knees
            ['lhip', 'lknee'],
            ['rhip', 'rknee'],

            // Knees to ankles
            ['lknee', 'lankle'],
            ['rknee', 'rankle']
        ];

        boneDefs.forEach(([start, end]) => {
            const geometry = new THREE.CylinderGeometry(0.02, 0.02, 1);
            const material = new THREE.MeshLambertMaterial({ color: 0x3ab0e0 });
            const cylinder = new THREE.Mesh(geometry, material);
            cylinder.castShadow = true;
            this.bones.push({ cylinder, start, end });
            this.scene.add(cylinder);
        });
    }

    static update(frame) {
        // Update joint positions from frame data
        // Map CSV columns to joint names
        const jointMappings = {
            // Head is computed below (above thorax_prox)
            'neck': ['thorax_prox_x', 'thorax_prox_y', 'thorax_prox_z'],
            'lshoulder': ['lsjc_x', 'lsjc_y', 'lsjc_z'],
            'rshoulder': ['rsjc_x', 'rsjc_y', 'rsjc_z'],
            'lelbow': ['lejc_x', 'lejc_y', 'lejc_z'],
            'relbow': ['rejc_x', 'rejc_y', 'rejc_z'],
            'lwrist': ['lwjc_x', 'lwjc_y', 'lwjc_z'],
            'rwrist': ['rwjc_x', 'rwjc_y', 'rwjc_z'],
            'lhand': ['lhjc_x', 'lhjc_y', 'lhjc_z'],
            'rhand': ['rhjc_x', 'rhjc_y', 'rhjc_z'],
            'spine': ['thorax_dist_x', 'thorax_dist_y', 'thorax_dist_z'],
            'lhip': ['left_hip_x', 'left_hip_y', 'left_hip_z'],
            'rhip': ['right_hip_x', 'right_hip_y', 'right_hip_z'],
            'lknee': ['lkjc_x', 'lkjc_y', 'lkjc_z'],
            'rknee': ['rkjc_x', 'rkjc_y', 'rkjc_z'],
            'lankle': ['lajc_x', 'lajc_y', 'lajc_z'],
            'rankle': ['rajc_x', 'rajc_y', 'rajc_z']
        };

        Object.keys(jointMappings).forEach(jointName => {
            const [xKey, yKey, zKey] = jointMappings[jointName];
            if (frame[xKey] !== undefined) {
                // OBP coordinates: +X toward pitcher, +Y toward RHH box, +Z up.
                // Three.js convention here: +Y up. Map (x, y, z) -> (x, z, -y).
                const dx = frame[xKey] || 0;
                const dy = frame[yKey] || 0;
                const dz = frame[zKey] || 0;
                this.joints[jointName].position.set(dx, dz, -dy);
            }
        });

        // Head: place ~0.2m above thorax_prox along world up
        if (frame['thorax_prox_x'] !== undefined) {
            const neck = this.joints['neck'].position;
            this.joints['head'].position.set(neck.x, neck.y + 0.22, neck.z);
        }

        // Update bone positions and rotations
        this.bones.forEach(bone => {
            const startPos = this.joints[bone.start].position;
            const endPos = this.joints[bone.end].position;

            const direction = new THREE.Vector3().subVectors(endPos, startPos);
            const length = direction.length();
            const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);

            bone.cylinder.position.copy(midpoint);
            bone.cylinder.scale.y = length;
            // Align cylinder's local +Y axis with the bone direction
            const up = new THREE.Vector3(0, 1, 0);
            const quat = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
            bone.cylinder.quaternion.copy(quat);
        });
    }
}

// Initialize skeleton when main is ready
document.addEventListener('DOMContentLoaded', () => {
    // Will be called from main.js after scene setup
});