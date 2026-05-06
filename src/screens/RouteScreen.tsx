import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { YardSale } from '../types';
import { useRoute } from '../hooks/useRoute';
import { CLUSTER_COLORS } from '../services/clustering';
import { navigateTo } from '../services/externalNav';

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

      <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.doneBtnText}>Done — Back to Map</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 12, paddingBottom: 80 },
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
  doneBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2C3E50',
    padding: 18,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
