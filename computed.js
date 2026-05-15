// computed.js - Derived metrics from raw frames

class Computed {
    static panel = null;
    static currentValues = {};

    static init() {
        this.panel = document.getElementById('computed-content');
        this.render();
    }

    static render() {
        const metrics = [
            {
                label: 'Peak Pelvis Rotation Velocity (deg/sec)',
                key: 'pelvis_rot_vel',
                tooltip: 'Maximum angular velocity of pelvic rotation during swing, indicating power generation from lower body.'
            },
            {
                label: 'Peak Shoulder Rotation Velocity (deg/sec)',
                key: 'shoulder_rot_vel',
                tooltip: 'Maximum angular velocity of shoulder rotation, showing upper body contribution to bat speed.'
            },
            {
                label: 'Hand Path Efficiency',
                key: 'hand_path_eff',
                tooltip: 'Ratio of straight-line distance to actual path length from hand separation to contact, measuring swing efficiency.'
            },
            {
                label: 'Knee Flex Angle at Contact (degrees)',
                key: 'knee_flex_contact',
                tooltip: 'Amount of knee flexion at contact, indicating loading and stability.'
            },
            {
                label: 'Spine Tilt at Stance (degrees)',
                key: 'spine_tilt_stance',
                tooltip: 'Spinal inclination at setup, affecting swing plane and power transfer.'
            },
            {
                label: 'Spine Tilt at Contact (degrees)',
                key: 'spine_tilt_contact',
                tooltip: 'Spinal position at contact, influencing bat angle and consistency.'
            }
        ];

        let html = '<div class="sparkline-container"><canvas id="separation-sparkline" width="300" height="100"></canvas></div>';
        metrics.forEach(metric => {
            html += `
                <div class="computed-item" title="${metric.tooltip}">
                    <div class="computed-label">${metric.label}</div>
                    <div class="computed-value" id="${metric.key}">--</div>
                </div>
            `;
        });

        this.panel.innerHTML = html;
    }

    static update(frame) {
        // Calculate metrics from frame data
        this.calculateMetrics(frame);
        this.updateDisplay();
        this.updateSparkline();
    }

    static calculateMetrics(frame) {
        // Peak pelvis rotation velocity (approximate from angular velocity)
        const pelvisVel = Math.abs(frame['pelvis_angular_velocity_fm_x'] || 0);
        this.currentValues.pelvis_rot_vel = Math.max(this.currentValues.pelvis_rot_vel || 0, pelvisVel * 180 / Math.PI);

        // Peak shoulder rotation velocity
        const shoulderVel = Math.abs(frame['torso_angular_velocity_fm_x'] || 0);
        this.currentValues.shoulder_rot_vel = Math.max(this.currentValues.shoulder_rot_vel || 0, shoulderVel * 180 / Math.PI);

        // Hand path efficiency (simplified)
        const handX = frame['rwjc_x'] || 0;
        const handY = frame['rwjc_y'] || 0;
        // Track hand path and calculate efficiency

        // Knee flex angle at contact
        if (Math.abs(frame.time - 0.5) < 0.1) { // Approximate contact
            this.currentValues.knee_flex_contact = Math.abs(frame['lkjc_x'] - frame['lajc_x']) || 0; // Simplified
        }

        // Spine tilt
        const spineTilt = Math.atan2(frame['thorax_ap_z'] - frame['centerofmass_z'], frame['thorax_ap_x'] - frame['centerofmass_x']) * 180 / Math.PI;
        if (frame.time < 0.1) { // Stance
            this.currentValues.spine_tilt_stance = spineTilt;
        }
        if (Math.abs(frame.time - 0.5) < 0.1) { // Contact
            this.currentValues.spine_tilt_contact = spineTilt;
        }
    }

    static updateDisplay() {
        Object.keys(this.currentValues).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                const value = this.currentValues[key];
                element.textContent = typeof value === 'number' ? value.toFixed(1) : value;
            }
        });
    }

    static updateSparkline() {
        // Hip-shoulder separation sparkline
        const canvas = document.getElementById('separation-sparkline');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Draw separation over time (simplified)
        ctx.strokeStyle = '#3ab0e0';
        ctx.lineWidth = 2;
        ctx.beginPath();

        // Sample points (in real app, track over frames)
        for (let i = 0; i < width; i++) {
            const t = i / width;
            const separation = Math.sin(t * Math.PI * 2) * 20; // Placeholder
            const y = height / 2 - separation * height / 40;
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
        }

        ctx.stroke();
    }
}

// Initialize computed metrics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Computed.init();
});