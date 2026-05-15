// parser.js - CSV loading and parsing

class Parser {
    static frames = [];
    static rawFrames = [];
    static poiData = null;
    static metadata = null;
    static contactFrameIndex = 0;
    static contactTime = 0;
    static fp10Time = 0;
    static fp100Time = 0;

    static async loadData(callback) {
        try {
            const landmarksResponse = await fetch('swing_509.csv');
            const landmarksText = await landmarksResponse.text();
            this.parseLandmarks(landmarksText);

            const poiResponse = await fetch('data/poi/poi_metrics.csv');
            const poiText = await poiResponse.text();
            this.parsePOI(poiText);

            const metaResponse = await fetch('data/metadata.csv');
            const metaText = await metaResponse.text();
            this.parseMetadata(metaText);

            callback();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    static parseLandmarks(text) {
        const lines = text.trim().split('\n');
        // swing_509.csv was created via grep, so it has no header row. Use the header from the original.
        const headers = [
            'session_swing','time',
            'blast_hand_x','blast_hand_y','blast_hand_z',
            'sweet_spot_x','sweet_spot_y','sweet_spot_z',
            'lhjc_x','lhjc_y','lhjc_z',
            'left_hip_x','left_hip_y','left_hip_z',
            'lsjc_x','lsjc_y','lsjc_z',
            'lejc_x','lejc_y','lejc_z',
            'lkjc_x','lkjc_y','lkjc_z',
            'lajc_x','lajc_y','lajc_z',
            'lwjc_x','lwjc_y','lwjc_z',
            'rhjc_x','rhjc_y','rhjc_z',
            'right_hip_x','right_hip_y','right_hip_z',
            'rsjc_x','rsjc_y','rsjc_z',
            'rejc_x','rejc_y','rejc_z',
            'rkjc_x','rkjc_y','rkjc_z',
            'rajc_x','rajc_y','rajc_z',
            'rwjc_x','rwjc_y','rwjc_z',
            'thorax_ap_x','thorax_ap_y','thorax_ap_z',
            'thorax_dist_x','thorax_dist_y','thorax_dist_z',
            'thorax_prox_x','thorax_prox_y','thorax_prox_z',
            'centerofmass_x','centerofmass_y','centerofmass_z',
            'fp_10_time','fp_100_time','contact_time'
        ];

        const swingData = lines.filter(line => line.startsWith('509_1,'));

        const rawFrames = swingData.map(line => {
            const values = line.split(',');
            const frame = {};
            headers.forEach((header, index) => {
                if (header === 'session_swing') {
                    frame[header] = values[index];
                } else {
                    frame[header] = parseFloat(values[index]);
                }
            });
            return frame;
        });

        this.rawFrames = rawFrames;
        if (rawFrames.length === 0) {
            console.error('No frames found for 509_1');
            return;
        }

        // Event times
        this.fp10Time = rawFrames[0].fp_10_time;
        this.fp100Time = rawFrames[0].fp_100_time;
        this.contactTime = rawFrames[0].contact_time;

        // Compute raw sample rate from time deltas
        const t0 = rawFrames[0].time;
        const t1 = rawFrames[1] ? rawFrames[1].time : t0 + 1/1080;
        const dtRaw = t1 - t0;
        const tEnd = rawFrames[rawFrames.length - 1].time;
        const duration = tEnd - t0;

        // Target 60 FPS with smoothstep interpolation
        const targetDt = 1 / 60;
        const targetCount = Math.max(2, Math.floor(duration / targetDt) + 1);

        this.frames = [];
        const interpolatedKeys = headers.filter(h => h !== 'session_swing' && h !== 'time' &&
            h !== 'fp_10_time' && h !== 'fp_100_time' && h !== 'contact_time');

        for (let i = 0; i < targetCount; i++) {
            const targetTime = t0 + i * targetDt;

            // Find bracketing raw frames
            const rawIdxFloat = (targetTime - t0) / dtRaw;
            const rawIdxLow = Math.floor(rawIdxFloat);
            const rawIdxHigh = Math.min(rawIdxLow + 1, rawFrames.length - 1);
            const tFrac = rawIdxFloat - rawIdxLow;

            // Smoothstep ease
            const sT = tFrac * tFrac * (3 - 2 * tFrac);

            const f1 = rawFrames[Math.min(rawIdxLow, rawFrames.length - 1)];
            const f2 = rawFrames[rawIdxHigh];

            const out = {
                session_swing: '509_1',
                time: targetTime,
                fp_10_time: this.fp10Time,
                fp_100_time: this.fp100Time,
                contact_time: this.contactTime
            };

            interpolatedKeys.forEach(k => {
                out[k] = f1[k] + (f2[k] - f1[k]) * sT;
            });

            this.frames.push(out);
        }

        // Find contact frame index in resampled array
        this.contactFrameIndex = Math.round((this.contactTime - t0) / targetDt);

        console.log(`Parsed ${rawFrames.length} raw frames -> ${this.frames.length} @ 60 FPS. Contact frame: ${this.contactFrameIndex}`);
    }

    static parsePOI(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');

        const poiRow = lines.slice(1).find(line => line.startsWith('509_1,'));
        if (poiRow) {
            const values = poiRow.split(',');
            this.poiData = {};
            headers.forEach((header, index) => {
                const n = parseFloat(values[index]);
                this.poiData[header] = isNaN(n) ? values[index] : n;
            });
        }
    }

    static parseMetadata(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');

        const metaRow = lines.slice(1).find(line => line.startsWith('509_1,'));
        if (metaRow) {
            const values = metaRow.split(',');
            this.metadata = {};
            headers.forEach((header, index) => {
                const n = parseFloat(values[index]);
                this.metadata[header] = isNaN(n) ? values[index] : n;
            });
        }
    }
}