import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { SavedMap } from '../types';
import { loadSavedMaps, deleteMap, renameMap } from '../services/savedMaps';

type Props = NativeStackScreenProps<RootStackParamList, 'SavedMaps'>;

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('default', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SavedMapsScreen({ navigation }: Props) {
  const [maps, setMaps] = useState<SavedMap[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadSavedMaps().then(setMaps);
    }, [])
  );

  const handleLoad = useCallback(
    (map: SavedMap) => {
      navigation.navigate('Map', {
        sales: map.sales,
        clusters: map.clusters,
        home: map.home,
        clusterRadiusMiles: map.clusterRadiusMiles,
        savedMapId: map.id,
      });
    },
    [navigation]
  );

  const handleDelete = useCallback((map: SavedMap) => {
    Alert.alert('Delete Map', `Delete "${map.name}"?`, [
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMap(map.id);
          setMaps((prev) => prev.filter((m) => m.id !== map.id));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const startRename = useCallback((map: SavedMap) => {
    setEditingId(map.id);
    setEditingName(map.name);
  }, []);

  const commitRename = useCallback(async () => {
    if (!editingId) return;
    const trimmed = editingName.trim();
    if (trimmed) {
      await renameMap(editingId, trimmed);
      setMaps((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, name: trimmed } : m))
      );
    }
    setEditingId(null);
  }, [editingId, editingName]);

  const renderItem = ({ item }: { item: SavedMap }) => {
    const stopCount = item.sales.filter((s) => s.lat !== null).length;
    const isEditing = editingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardMain}>
          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={editingName}
              onChangeText={setEditingName}
              onBlur={commitRename}
              onSubmitEditing={commitRename}
              autoFocus
            />
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <TouchableOpacity onPress={() => startRename(item)} style={styles.renameBtn}>
                <Text style={styles.renameBtnText}>✎</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.meta}>
            {stopCount} stop{stopCount !== 1 ? 's' : ''} · Created {formatDate(item.createdAt)}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.loadBtn} onPress={() => handleLoad(item)}>
            <Text style={styles.loadBtnText}>Load</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {maps.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No saved maps yet.</Text>
          <Text style={styles.emptyHint}>Build a route and tap Save on the map screen.</Text>
        </View>
      ) : (
        <FlatList
          data={maps}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
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
    borderWidth: 1,
    borderColor: '#e8e8e8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMain: { flex: 1, marginRight: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#222', flex: 1 },
  nameInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    borderBottomWidth: 1,
    borderColor: '#2980B9',
    paddingVertical: 2,
    marginBottom: 2,
  },
  renameBtn: { paddingHorizontal: 6 },
  renameBtnText: { fontSize: 16, color: '#999' },
  meta: { fontSize: 13, color: '#888', marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadBtn: {
    backgroundColor: '#2980B9',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  loadBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { color: '#E74C3C', fontSize: 18, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#555', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#999', textAlign: 'center' },
});
