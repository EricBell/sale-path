import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { YardSale } from '../types';
import { ValidatedEntry, ValidationIssue } from '../services/validation';
import { useGeocoding } from '../hooks/useGeocoding';
import { clusterSales } from '../services/clustering';

type Props = NativeStackScreenProps<RootStackParamList, 'Validation'>;

interface Item {
  address: string;
  issues: ValidationIssue[];
  duplicateOf?: number;
  sale: YardSale;
  removed: boolean;
}

const ISSUE_LABEL: Record<ValidationIssue, string> = {
  duplicate: 'Duplicate',
  'no-number': 'No house #',
  'too-short': 'Incomplete?',
  junk: 'Looks like junk',
};

function issueColor(issues: ValidationIssue[]): string {
  if (issues.includes('duplicate') || issues.includes('junk')) return '#E74C3C';
  if (issues.length > 0) return '#E67E22';
  return '#27AE60';
}

function statusIcon(issues: ValidationIssue[]): string {
  if (issues.includes('duplicate') || issues.includes('junk')) return '✕';
  if (issues.length > 0) return '⚠';
  return '✓';
}

export default function ValidationScreen({ navigation, route: navRoute }: Props) {
  const { entries, sales, homeAddress, clusterRadiusMiles } = navRoute.params;
  const { geocodeAll, loading, progress, error } = useGeocoding();

  const [items, setItems] = useState<Item[]>(() =>
    (entries as ValidatedEntry[]).map((entry, i) => ({
      address: entry.normalized,
      issues: entry.issues,
      duplicateOf: entry.duplicateOf,
      sale: sales[i],
      removed: false,
    }))
  );

  const updateAddress = useCallback((index: number, text: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, address: text } : item)));
  }, []);

  const toggleRemove = useCallback((index: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, removed: !item.removed } : item))
    );
  }, []);

  const handleProceed = useCallback(async () => {
    const kept = items.filter((item) => !item.removed);
    if (kept.length === 0) return;
    const keptSales: YardSale[] = kept.map((item) => ({
      ...item.sale,
      rawAddress: item.address,
    }));
    const result = await geocodeAll(keptSales, homeAddress);
    if (!result) return;
    const radiusKm = clusterRadiusMiles * 1.60934;
    const clusters = clusterSales(result.sales, radiusKm);
    navigation.navigate('Map', { sales: result.sales, clusters, home: result.home });
  }, [items, geocodeAll, homeAddress, clusterRadiusMiles, navigation]);

  const keptCount = items.filter((i) => !i.removed).length;
  const issueCount = items.filter((i) => i.issues.length > 0 && !i.removed).length;

  const renderItem = ({ item, index }: { item: Item; index: number }) => {
    const color = item.removed ? '#bbb' : issueColor(item.issues);
    const icon = item.removed ? '○' : statusIcon(item.issues);

    return (
      <View style={[styles.row, item.removed && styles.rowRemoved]}>
        <Text style={[styles.icon, { color }]}>{icon}</Text>
        <View style={styles.middle}>
          <TextInput
            style={[styles.addressInput, item.removed && styles.addressRemoved]}
            value={item.address}
            onChangeText={(t) => updateAddress(index, t)}
            editable={!item.removed}
            autoCorrect={false}
          />
          {item.issues.length > 0 && !item.removed && (
            <View style={styles.badges}>
              {item.issues.map((issue) => (
                <View key={issue} style={[styles.badge, { backgroundColor: color }]}>
                  <Text style={styles.badgeText}>
                    {ISSUE_LABEL[issue]}
                    {issue === 'duplicate' && item.duplicateOf !== undefined
                      ? ` of #${item.duplicateOf + 1}`
                      : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => toggleRemove(index)} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>{item.removed ? 'Keep' : '✕'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {issueCount > 0
            ? `${issueCount} possible issue${issueCount > 1 ? 's' : ''} — review before continuing`
            : 'All addresses look good'}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.proceedBtn, (loading || keptCount === 0) && styles.proceedDisabled]}
        onPress={handleProceed}
        disabled={loading || keptCount === 0}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
            {progress ? <Text style={styles.progressText}>{progress}</Text> : null}
          </View>
        ) : (
          <Text style={styles.proceedText}>Proceed with {keptCount} address{keptCount !== 1 ? 'es' : ''}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  summary: {
    backgroundColor: '#fff',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryText: { fontSize: 14, color: '#555', fontWeight: '500' },
  list: { padding: 12, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  rowRemoved: { opacity: 0.45 },
  icon: { fontSize: 16, fontWeight: '700', marginTop: 3, marginRight: 8, width: 18 },
  middle: { flex: 1 },
  addressInput: { fontSize: 14, color: '#222', paddingVertical: 2 },
  addressRemoved: { textDecorationLine: 'line-through', color: '#999' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  removeBtn: { paddingLeft: 10, paddingTop: 2 },
  removeBtnText: { fontSize: 14, color: '#999', fontWeight: '600' },
  error: { color: '#E74C3C', fontSize: 13, marginHorizontal: 16, marginBottom: 8 },
  proceedBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2ECC71',
    padding: 18,
    alignItems: 'center',
  },
  proceedDisabled: { opacity: 0.5 },
  proceedText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressText: { color: '#fff', fontSize: 14 },
});
