import React, { useCallback, useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useRoute } from '../hooks/useRoute';
import { CLUSTER_COLORS } from '../services/clustering';
import { saveMap, generateMapName } from '../services/savedMaps';
import { navigateTo } from '../services/externalNav';
import { YardSale } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

const HOME_COLOR = '#2C3E50';

export default function MapScreen({ navigation, route: navRoute }: Props) {
  const { sales, clusters, home, clusterRadiusMiles, savedMapId } = navRoute.params;
  const { route } = useRoute(sales, home);

  const [visitedIds, setVisitedIds] = useState<Set<string>>(
    () => new Set(sales.filter((s) => s.visited).map((s) => s.id))
  );
  const [selectedSale, setSelectedSale] = useState<{ sale: YardSale; index: number } | null>(null);

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
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        onPress={() => setSelectedSale(null)}
      >
        <Marker
          coordinate={{ latitude: home.lat, longitude: home.lng }}
          title="Home"
          pinColor={HOME_COLOR}
        />

        {route.orderedStops.map((sale, index) => {
          if (sale.lat === null || sale.lng === null) return null;
          const isVisited = visitedIds.has(sale.id);
          const coord = { latitude: sale.lat, longitude: sale.lng };
          const onPress = () => setSelectedSale({ sale, index });
          if (isVisited) {
            return (
              <Marker key={sale.id} coordinate={coord} onPress={onPress} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                <View style={styles.visitedMarker}>
                  <Text style={styles.visitedMarkerCheck}>✓</Text>
                </View>
              </Marker>
            );
          }
          return (
            <Marker
              key={sale.id}
              coordinate={coord}
              pinColor={sale.clusterId !== null ? clusterColorById.get(sale.clusterId) ?? '#888' : '#888'}
              onPress={onPress}
            />
          );
        })}

        <Polyline coordinates={polyline} strokeColor="#2C3E50" strokeWidth={2} lineDashPattern={[6, 3]} />
      </MapView>

      {selectedSale && (
        <View style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <Text style={styles.overlayTitle} numberOfLines={2}>
              {`${selectedSale.index + 1}. ${selectedSale.sale.rawAddress}`}
            </Text>
            <TouchableOpacity onPress={() => setSelectedSale(null)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          {selectedSale.sale.notes ? (
            <Text style={styles.overlayNotes}>{selectedSale.sale.notes}</Text>
          ) : null}
          <View style={styles.overlayActions}>
            <TouchableOpacity
              style={styles.navigateBtn}
              onPress={() => navigateTo(selectedSale.sale)}
            >
              <Text style={styles.overlayBtnText}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.visitBtn, visitedIds.has(selectedSale.sale.id) && styles.visitedBtn]}
              onPress={() => {
                toggleVisited(selectedSale.sale.id);
                setSelectedSale(null);
              }}
            >
              <Text style={styles.overlayBtnText}>
                {visitedIds.has(selectedSale.sale.id) ? 'Mark Unvisited' : 'Mark Visited ✓'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  overlay: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  overlayHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  overlayTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#222' },
  closeBtn: { paddingLeft: 10, paddingTop: 2 },
  closeBtnText: { fontSize: 16, color: '#999', fontWeight: '700' },
  overlayNotes: { fontSize: 13, color: '#666', marginBottom: 8 },
  overlayActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  navigateBtn: {
    flex: 1,
    backgroundColor: '#3498DB',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  visitBtn: {
    flex: 1,
    backgroundColor: '#2980B9',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  visitedBtn: { backgroundColor: '#27AE60' },
  overlayBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
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
  visitedMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
  },
  visitedMarkerCheck: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 18 },
});
