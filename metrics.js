// metrics.js - Stats panel from POI data

class Metrics {
    static panel = null;
    static data = null;

    static init() {
        this.panel = document.getElementById('metrics-content');
        this.loadData();
    }

    static loadData() {
        // Data loaded in parser.js
        this.data = Parser.poiData;
        this.render();
    }

    static render() {
        if (!this.data) return;

        const metrics = [
            {
                label: 'Bat Speed (mph)',
                key: 'bat_speed_mph_contact_x',
                avg: 66.06,
                format: (v) => v.toFixed(1)
            },
            {
                label: 'Attack Angle (degrees)',
                key: 'attack_angle_contact_x',
                avg: 3.74,
                format: (v) => v.toFixed(1)
            },
            {
                label: 'Vertical Bat Angle (degrees)',
                key: 'bat_torso_angle_connection_x', // Approximate
                avg: 0,
                format: (v) => v.toFixed(1)
            },
            {
                label: 'Hip-Shoulder Separation (degrees)',
                key: 'x_factor_hs_x',
                avg: -4.75,
                format: (v) => v.toFixed(1)
            },
            {
                label: 'Time to Contact (ms)',
                key: 'fp_10_time', // Approximate
                avg: 150,
                format: (v) => (v * 1000).toFixed(0)
            },
            {
                label: 'Connection Angle (degrees)',
                key: 'bat_torso_angle_connection_x',
                avg: 0,
                format: (v) => v.toFixed(1)
            }
        ];

        let html = '';
        metrics.forEach(metric => {
            const value = this.data[metric.key] || 0;
            const avg = metric.avg;
            const percentile = this.calculatePercentile(value, avg, metrics);
            const barWidth = Math.min(percentile, 100);

            html += `
                <div class="metric-item">
                    <div class="metric-label">${metric.label}</div>
                    <div class="metric-value">${metric.format(value)}</div>
                    <div class="metric-avg">Avg: ${metric.format(avg)}</div>
                    <div class="metric-bar">
                        <div class="metric-bar-fill" style="width: ${barWidth}%"></div>
                    </div>
                    <div class="metric-percentile">${percentile.toFixed(0)}th %ile</div>
                </div>
            `;
        });

        this.panel.innerHTML = html;
    }

    static calculatePercentile(value, avg, metrics) {
        // Simple percentile calculation (in real app, use full dataset)
        const diff = value - avg;
        const stdDev = 10; // Approximate
        const zScore = diff / stdDev;
        return (0.5 + 0.5 * this.erf(zScore / Math.sqrt(2))) * 100;
    }

    static erf(x) {
        // Approximation of error function
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);

        const t = 1 / (1 + p * x);
        const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    static update(frame) {
        // Metrics are static from POI data, no update needed
    }
}

// Initialize metrics when DOM is loaded
// (Metrics.init() is called from main.js after data loads)