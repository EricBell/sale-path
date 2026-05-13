import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { version } from '../../package.json';

export default function HelpScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.version}>Sale Path v{version}</Text>
      <Text style={styles.heading}>Map Colors & Clustering</Text>
      <Text style={styles.body}>
        The colors come from the clustering algorithm. When you hit "Build Route", the app runs a
        union-find over all your geocoded addresses — any two sales within the configured radius of
        each other get merged into the same cluster. Every sale in a cluster shares the same color,
        picked by cycling through a palette of 6 colors by cluster ID.
      </Text>
      <Text style={styles.body}>
        So pins that are the same color are geographically close enough to walk between (or park
        once and hit on foot). Isolated sales that aren't near anything else get their own unique
        color.
      </Text>
      <Text style={styles.body}>
        The clusters also affect the map view — the map shows a single marker at each cluster's
        centroid, not individual pins, so you see the neighborhood grouping at a glance rather than
        overlapping pins.
      </Text>
      <Text style={styles.heading}>Cluster Radius</Text>
      <Text style={styles.body}>
        You can change the clustering radius in Settings (⚙ on the main screen). The default is
        0.5 miles. A larger radius groups more distant sales together; a smaller radius keeps groups
        tighter.
      </Text>
      <Text style={styles.heading}>Route Scoring</Text>
      <Text style={styles.body}>
        The route is not simply the shortest path. Each stop is scored by priority, time-of-morning
        freshness, and distance. High-priority sales are biased toward the start of the route, even
        if they're slightly out of the way.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 48 },
  version: { fontSize: 13, color: '#888', marginBottom: 16 },
  heading: { fontSize: 16, fontWeight: '700', color: '#222', marginTop: 20, marginBottom: 8 },
  body: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 12 },
});
