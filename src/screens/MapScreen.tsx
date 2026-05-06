import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useRoute } from '../hooks/useRoute';
import { CLUSTER_COLORS } from '../services/clustering';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

const HOME_COLOR = '#2C3E50';

export default function MapScreen({ navigation, route: navRoute }: Props) {
  const { sales, clusters, home } = navRoute.params;
  const { route } = useRoute(sales, home);

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
      <MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={initialRegion}>
        <Marker
          coordinate={{ latitude: home.lat, longitude: home.lng }}
          title="Home"
          pinColor={HOME_COLOR}
        />

        {route.orderedStops.map((sale, index) =>
          sale.lat !== null && sale.lng !== null ? (
            <Marker
              key={sale.id}
              coordinate={{ latitude: sale.lat, longitude: sale.lng }}
              title={`${index + 1}. ${sale.rawAddress}`}
              description={sale.notes || undefined}
              pinColor={
                sale.clusterId !== null
                  ? clusterColorById.get(sale.clusterId) ?? '#888'
                  : '#888'
              }
            />
          ) : null,
        )}

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
});
