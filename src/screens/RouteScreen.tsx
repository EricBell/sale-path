import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { RootStackParamList } from '../../App';
import { YardSale } from '../types';
import { useRoute } from '../hooks/useRoute';
import { clusterSales, CLUSTER_COLORS } from '../services/clustering';
import { navigateTo } from '../services/externalNav';
import { loadSettings, DEFAULT_SETTINGS } from '../services/settings';

type Props = NativeStackScreenProps<RootStackParamList, 'Route'>;

function priorityLabel(p: number): string {
  return '★'.repeat(p) + '☆'.repeat(5 - p);
}

function clusterColor(sale: YardSale): string {
  return sale.clusterId !== null ? CLUSTER_COLORS[sale.clusterId % CLUSTER_COLORS.length] : '#aaa';
}

export default function RouteScreen({ navigation, route: navRoute }: Props) {
  const { sales, home } = navRoute.params;
  const { route, skip } = useRoute(sales, home);
  const [clusterRadiusMiles, setClusterRadiusMiles] = useState(DEFAULT_SETTINGS.clusterRadiusMiles);

  useEffect(() => {
    loadSettings().then((s) => setClusterRadiusMiles(s.clusterRadiusMiles));
  }, []);

  const handleSave = useCallback(async () => {
    const remaining = route.orderedStops.filter((s) => !s.skipped);
    if (remaining.length === 0) return;

    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const cc = String(remaining.length).padStart(2, '0');
    const filename = `${yy}${mo}${dd}_${hh}${mi}_${cc}_Addresses.txt`;

    const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!dir) { Alert.alert('Error', 'Storage not available.'); return; }

    try {
      const fileUri = dir + filename;
      await FileSystem.writeAsStringAsync(fileUri, remaining.map((s) => s.rawAddress).join('\n'));
      await Sharing.shareAsync(fileUri, { mimeType: 'text/plain', dialogTitle: 'Save address list', UTI: 'public.plain-text' });
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Unknown error');
    }
  }, [route.orderedStops]);

  const handleRebuildMap = useCallback(() => {
    const remaining = route.orderedStops.filter((s) => !s.skipped);
    if (remaining.length === 0) return;
    const copies = remaining.map((s) => ({ ...s }));
    const clusters = clusterSales(copies, clusterRadiusMiles * 1.60934);
    navigation.push('Map', { sales: copies, clusters, home, clusterRadiusMiles });
  }, [route.orderedStops, clusterRadiusMiles, home, navigation]);

  useEffect(() => {
    const hasRemaining = route.orderedStops.some((s) => !s.skipped);
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          {hasRemaining && (
            <>
              <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
                <Text style={styles.headerBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRebuildMap} style={styles.headerBtn}>
                <Text style={styles.headerBtnText}>Rebuild Map</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>← Map</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handleSave, handleRebuildMap, route.orderedStops]);

  return (
    <View style={styles.container}>
      <FlatList
        data={route.orderedStops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.clusterDot, { backgroundColor: clusterColor(item) }]} />
              <Text style={styles.stopNumber}>{index + 1}</Text>
              <Text style={styles.address} numberOfLines={2}>
                {item.rawAddress}
              </Text>
            </View>

            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

            <View style={styles.cardFooter}>
              <Text style={styles.priority}>{priorityLabel(item.priority)}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.btnNavigate}
                  onPress={() => navigateTo(item)}
                >
                  <Text style={styles.btnText}>Navigate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnSkip}
                  onPress={() => skip(item.id)}
                >
                  <Text style={styles.btnText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>All stops visited or skipped.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  clusterDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  stopNumber: { fontSize: 18, fontWeight: '700', color: '#2C3E50', marginRight: 8, minWidth: 24 },
  address: { flex: 1, fontSize: 14, color: '#222' },
  notes: { fontSize: 13, color: '#777', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priority: { fontSize: 14, color: '#F39C12', letterSpacing: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  btnNavigate: {
    backgroundColor: '#3498DB',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnSkip: {
    backgroundColor: '#E74C3C',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 16 },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  headerBtnText: { fontSize: 15, color: '#2980B9', fontWeight: '600' },
});
