import React, { useCallback, useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useRoute } from '../hooks/useRoute';
import { CLUSTER_COLORS } from '../services/clustering';
import { saveMap, generateMapName } from '../services/savedMaps';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

const HOME_COLOR = '#2C3E50';

export default function MapScreen({ navigation, route: navRoute }: Props) {
  const { sales, clusters, home, clusterRadiusMiles, savedMapId } = navRoute.params;
  const { route } = useRoute(sales, home);

  const [visitedIds, setVisitedIds] = useState<Set<string>>(
    () => new Set(sales.filter((s) => s.visited).map((s) => s.id))
  );

  const toggleVisited = useCallback((id: string) => {
    setVisitedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const doSave = useCallback(async (id: string) => {
    const salesWithVisited = sales.map((s) => ({ ...s, visited: visitedIds.has(s.id) }));
    const stopCount = salesWithVisited.filter((s) => s.lat !== null).length;
    const now = Date.now();
    await saveMap({
      id,
      name: generateMapName(stopCount),
      createdAt: now,
      updatedAt: now,
      sales: salesWithVisited,
      clusters,
      home,
      clusterRadiusMiles,
    });
    Alert.alert('Saved', 'Map saved successfully.');
  }, [sales, visitedIds, clusters, home, clusterRadiusMiles]);

  const handleSave = useCallback(() => {
    if (savedMapId) {
      Alert.alert('Save Map', 'Update the existing saved map or save as a new entry?', [
        { text: 'Overwrite', onPress: () => doSave(savedMapId) },
        { text: 'Save as New', onPress: () => doSave(Date.now().toString()) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      doSave(Date.now().toString());
    }
  }, [savedMapId, doSave]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSave]);

  const initialRegion = {
    latitude: home.lat,
    longitude: home.lng,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  };

  const polyline = [
    { latitude: home.lat, longitude: home.lng },
    ...route.orderedStops
      .filter((s) => s.lat !== null && s.lng !== null)
      .map((s) => ({ latitude: s.lat!, longitude: s.lng! })),
  ];

  const clusterColorById = new Map(
    clusters.map((c) => [c.id, CLUSTER_COLORS[c.id % CLUSTER_COLORS.length]]),
  );

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        <Marker
          coordinate={{ latitude: home.lat, longitude: home.lng }}
          title="Home"
          pinColor={HOME_COLOR}
        />

        {route.orderedStops.map((sale, index) => {
          if (sale.lat === null || sale.lng === null) return null;
          const isVisited = visitedIds.has(sale.id);
          return (
            <Marker
              key={sale.id}
              coordinate={{ latitude: sale.lat, longitude: sale.lng }}
              pinColor={
                isVisited
                  ? '#AAAAAA'
                  : sale.clusterId !== null
                  ? clusterColorById.get(sale.clusterId) ?? '#888'
                  : '#888'
              }
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{`${index + 1}. ${sale.rawAddress}`}</Text>
                  {sale.notes ? <Text style={styles.calloutNotes}>{sale.notes}</Text> : null}
                  <TouchableOpacity
                    style={[styles.visitBtn, isVisited && styles.visitedBtn]}
                    onPress={() => toggleVisited(sale.id)}
                  >
                    <Text style={styles.visitBtnText}>
                      {isVisited ? 'Mark Unvisited' : 'Mark Visited ✓'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          );
        })}

        <Polyline coordinates={polyline} strokeColor="#2C3E50" strokeWidth={2} lineDashPattern={[6, 3]} />
      </MapView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Route', { sales, home })}
      >
        <Text style={styles.fabText}>View Route List</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  headerBtnText: { fontSize: 15, color: '#2980B9', fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: '#2C3E50',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  callout: { width: 220, padding: 6 },
  calloutTitle: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 2 },
  calloutNotes: { fontSize: 12, color: '#666', marginBottom: 4 },
  visitBtn: {
    backgroundColor: '#2980B9',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  visitedBtn: { backgroundColor: '#27AE60' },
  visitBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
