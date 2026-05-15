# 3D Baseball Swing Visualization

A production-grade web-based 3D visualization of baseball swing biomechanics using Three.js, displaying skeletal animation, bat path, and comprehensive metrics from Driveline's OpenBiomechanics dataset.

## Player Selection

**Selected Player: User 222**
- **Why selected**: This player had the highest combined deviation above dataset averages across bat speed, attack angle, and X-factor (hip-shoulder separation), representing the most consistently elite performer.
- **Bat Speed**: 68.44 mph (vs dataset avg 66.06 mph, +2.38 mph above avg)
- **Attack Angle**: 15.22° (vs dataset avg 3.74°, +11.48° above avg)
- **X-Factor**: 3.66° (vs dataset avg -4.75°, +8.41° above avg)
- **Swing Used**: 509_1 (bat speed 68.94 mph, closest to player's average of 68.44 mph)

## Features

- **Skeletal Animation**: 23 joints with anatomical bone connections, smooth 60 FPS motion
- **Bat Path & Trail**: Gold bat body with red fading trail of last 40 frames
- **Metrics Panel**: Real POI data with percentile comparisons
- **Computed Metrics**: Derived analytics with tooltips and sparklines
- **Camera Controls**: Orbit, zoom, pan, preset views
- **Playback**: Scrubber, speed controls, loop/pause options

## Running the Project

```bash
cd ~/Desktop/driveline-swing-viz
npx serve .
```

Open http://localhost:3000 in your browser.

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **3D Engine**: Three.js r128 (CDN)
- **Data**: Local CSV files from Driveline OpenBiomechanics
- **Server**: npx serve for local development