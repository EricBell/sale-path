import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { YardSale } from '../types';
import { useGeocoding } from '../hooks/useGeocoding';
import { clusterSales } from '../services/clustering';

type Props = NativeStackScreenProps<RootStackParamList, 'Input'>;

function parseAddresses(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function makeSale(address: string, id: string): YardSale {
  return {
    id,
    rawAddress: address,
    notes: '',
    priority: 3,
    lat: null,
    lng: null,
    clusterId: null,
    visited: false,
    skipped: false,
  };
}

export default function InputScreen({ navigation }: Props) {
  const [homeAddress, setHomeAddress] = useState('');
  const [addressText, setAddressText] = useState('');
  const [sales, setSales] = useState<YardSale[]>([]);
  const { geocodeAll, loading, error } = useGeocoding();

  const handleAddressTextChange = useCallback((text: string) => {
    setAddressText(text);
    const addresses = parseAddresses(text);
    setSales((prev) =>
      addresses.map((addr, i) => {
        const existing = prev.find((s) => s.rawAddress === addr);
        return existing ?? makeSale(addr, `${Date.now()}-${i}`);
      }),
    );
  }, []);

  const updatePriority = useCallback((id: string, priority: YardSale['priority']) => {
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, priority } : s)));
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, notes } : s)));
  }, []);

  const handleBuildRoute = useCallback(async () => {
    if (!homeAddress.trim()) {
      Alert.alert('Home address required', 'Enter your starting address.');
      return;
    }
    if (sales.length === 0) {
      Alert.alert('No addresses', 'Paste at least one yard sale address.');
      return;
    }
    const result = await geocodeAll(sales, homeAddress.trim());
    if (!result) return;
    const clusters = clusterSales(result.sales);
    navigation.navigate('Map', { sales: result.sales, clusters, home: result.home });
  }, [homeAddress, sales, geocodeAll, navigation]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Starting address</Text>
      <TextInput
        style={styles.input}
        value={homeAddress}
        onChangeText={setHomeAddress}
        placeholder="Your home or starting address"
        autoCorrect={false}
      />

      <Text style={styles.label}>Yard sale addresses (one per line)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={addressText}
        onChangeText={handleAddressTextChange}
        placeholder="Paste addresses here…"
        multiline
        autoCorrect={false}
        textAlignVertical="top"
      />

      {sales.map((sale) => (
        <View key={sale.id} style={styles.saleRow}>
          <Text style={styles.saleAddress} numberOfLines={1}>
            {sale.rawAddress}
          </Text>
          <TextInput
            style={styles.notesInput}
            value={sale.notes}
            onChangeText={(t) => updateNotes(sale.id, t)}
            placeholder="notes (tools, furniture…)"
          />
          <View style={styles.stars}>
            {([1, 2, 3, 4, 5] as YardSale['priority'][]).map((n) => (
              <TouchableOpacity key={n} onPress={() => updatePriority(sale.id, n)}>
                <Text style={sale.priority >= n ? styles.starOn : styles.starOff}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleBuildRoute}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Build Route</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 4, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  multiline: { height: 120 },
  saleRow: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#f9f9f9',
  },
  saleAddress: { fontSize: 14, fontWeight: '500', color: '#222', marginBottom: 4 },
  notesInput: {
    borderBottomWidth: 1,
    borderColor: '#ddd',
    fontSize: 13,
    paddingVertical: 2,
    marginBottom: 8,
    color: '#555',
  },
  stars: { flexDirection: 'row', gap: 6 },
  starOn: { fontSize: 24, color: '#F39C12' },
  starOff: { fontSize: 24, color: '#ddd' },
  error: { color: '#E74C3C', marginTop: 8, fontSize: 13 },
  button: {
    backgroundColor: '#2ECC71',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 48,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
