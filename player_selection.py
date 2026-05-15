import pandas as pd
import numpy as np

# Load the CSV files
metadata_df = pd.read_csv('data/metadata.csv')
poi_metrics_df = pd.read_csv('data/poi/poi_metrics.csv')

# Filter for right-handed hitters (hitter_side == 'R')
rhh_metadata = metadata_df[metadata_df['hitter_side'] == 'R'].copy()

print(f"Total swings in metadata: {len(metadata_df)}")
print(f"Right-handed hitters (RHH) swings: {len(rhh_metadata)}")

# Merge metadata with poi_metrics on session
# metadata has 'session' column, poi_metrics has 'session' column
merged_df = rhh_metadata.merge(
    poi_metrics_df,
    on='session',
    how='inner'
)

print(f"After merge: {len(merged_df)} rows")

# Calculate athlete averages for the three metrics
athlete_metrics = merged_df.groupby('user').agg({
    'bat_speed_mph_contact_x': 'mean',
    'attack_angle_contact_x': 'mean',
    'x_factor_hs_x': 'mean'
}).reset_index()

athlete_metrics.columns = ['user', 'bat_speed_avg', 'attack_angle_avg', 'x_factor_avg']

# Calculate overall averages across all RHH
overall_bat_speed = merged_df['bat_speed_mph_contact_x'].mean()
overall_attack_angle = merged_df['attack_angle_contact_x'].mean()
overall_x_factor = merged_df['x_factor_hs_x'].mean()

print(f"\nOverall Averages (RHH):")
print(f"  Bat Speed: {overall_bat_speed:.4f}")
print(f"  Attack Angle: {overall_attack_angle:.4f}")
print(f"  X Factor: {overall_x_factor:.4f}")

# Calculate sum of deviations for each athlete
athlete_metrics['deviation_sum'] = (
    (athlete_metrics['bat_speed_avg'] - overall_bat_speed) +
    (athlete_metrics['attack_angle_avg'] - overall_attack_angle) +
    (athlete_metrics['x_factor_avg'] - overall_x_factor)
)

# Sort by deviation_sum to find the best athlete
athlete_metrics_sorted = athlete_metrics.sort_values('deviation_sum', ascending=False)

# Get the top athlete
top_athlete = athlete_metrics_sorted.iloc[0]

print(f"\n{'='*70}")
print(f"TOP ATHLETE - Most Above Average Across All Three Metrics:")
print(f"{'='*70}")
print(f"User ID: {top_athlete['user']}")
print(f"\nAthlete Averages:")
print(f"  Bat Speed (contact): {top_athlete['bat_speed_avg']:.4f} mph")
print(f"  Attack Angle (contact): {top_athlete['attack_angle_avg']:.4f}°")
print(f"  X Factor (HS): {top_athlete['x_factor_avg']:.4f}")

print(f"\nOverall Averages (All RHH):")
print(f"  Bat Speed (contact): {overall_bat_speed:.4f} mph")
print(f"  Attack Angle (contact): {overall_attack_angle:.4f}°")
print(f"  X Factor (HS): {overall_x_factor:.4f}")

print(f"\nDeviation from Overall Averages:")
print(f"  Bat Speed deviation: +{top_athlete['bat_speed_avg'] - overall_bat_speed:.4f} mph")
print(f"  Attack Angle deviation: +{top_athlete['attack_angle_avg'] - overall_attack_angle:.4f}°")
print(f"  X Factor deviation: +{top_athlete['x_factor_avg'] - overall_x_factor:.4f}")
print(f"  Total Deviation Sum: {top_athlete['deviation_sum']:.4f}")

print(f"\n{'='*70}")
print(f"EXPLANATION:")
print(f"{'='*70}")
print(f"""
User {top_athlete['user']} was selected because they have the highest combined 
deviation across all three key swing metrics. This athlete demonstrates:

1. Above-average bat speed at contact ({top_athlete['bat_speed_avg']:.2f} vs {overall_bat_speed:.2f})
2. Above-average attack angle ({top_athlete['attack_angle_avg']:.2f}° vs {overall_attack_angle:.2f}°)
3. Above-average X-factor at hand speed ({top_athlete['x_factor_avg']:.2f} vs {overall_x_factor:.2f})

The sum of these deviations ({top_athlete['deviation_sum']:.4f}) represents how far above 
the average this athlete is across all three critical biomechanical metrics, making 
them the most consistently elite performer in terms of power generation and swing mechanics.
""")

# Show top 10 for context
print(f"\nTop 10 Athletes by Combined Deviation:")
print(athlete_metrics_sorted[['user', 'bat_speed_avg', 'attack_angle_avg', 'x_factor_avg', 'deviation_sum']].head(10).to_string(index=False))

# Get swings for top athlete
top_athlete_swings = merged_df[merged_df['user'] == top_athlete['user']][['session_swing_x', 'bat_speed_mph_contact_x']]
print(f"\nSwings for Top Athlete {top_athlete['user']}:")
print(top_athlete_swings.to_string(index=False))