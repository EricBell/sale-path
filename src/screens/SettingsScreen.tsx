import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { loadSettings, saveSettings } from '../services/settings';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const [radiusMiles, setRadiusMiles] = useState('');

  useEffect(() => {
    loadSettings().then((s) => setRadiusMiles(String(s.clusterRadiusMiles)));
  }, []);

  const handleSave = async () => {
    const val = parseFloat(radiusMiles);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid value', 'Enter a positive number of miles.');
      return;
    }
    try {
      await saveSettings({ clusterRadiusMiles: val });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error — settings were not saved.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Cluster radius (miles)</Text>
      <Text style={styles.hint}>
        Sales within this distance are grouped by color on the map. Default is 0.5 mi.
      </Text>
      <TextInput
        style={styles.input}
        value={radiusMiles}
        onChangeText={setRadiusMiles}
        keyboardType="decimal-pad"
        selectTextOnFocus
      />
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 6 },
  hint: { fontSize: 13, color: '#777', marginBottom: 16, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    backgroundColor: '#fafafa',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2ECC71',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
