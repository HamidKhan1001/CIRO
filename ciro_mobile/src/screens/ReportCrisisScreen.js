import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { locationService } from '../services/location';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const CRISIS_TYPES = ['Flooding', 'Fire', 'Heatwave', 'Earthquake', 'Other'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function ReportCrisisScreen({ navigation }) {
  const { currentScale, darkMode } = useTheme();
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [affectedCount, setAffectedCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const scaled = (size) => size * currentScale;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setLocLoading(true);
    const loc = await locationService.getCurrentLocation();
    if (loc) {
      const address = await locationService.reverseGeocode(loc.lat, loc.lon);
      setLocation({ ...loc, address });
    }
    setLocLoading(false);
  };

  const handleSubmit = async () => {
    if (!type || !location) {
      Alert.alert('Error', 'Please select a crisis type and provide a location.');
      return;
    }

    setLoading(true);
    const report = {
      crisis_type: type,
      severity,
      description,
      location,
      affected_count: parseInt(affectedCount) || 0,
    };

    const result = await api.submitCrisis(report);
    setLoading(false);

    if (result.source === 'offline') {
      Alert.alert('Offline Mode', result.message, [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Dashboard' }) }
      ]);
    } else {
      Alert.alert('Success', 'Crisis report submitted successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Dashboard' }) }
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#000000' : '#F3F4F6' }]}>
      {darkMode && <LinearGradient colors={['#000000', '#111827']} style={StyleSheet.absoluteFill} />}
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scaled(24)} color={darkMode ? '#F3F4F6' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(20) }]}>Report Crisis</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.label, { fontSize: scaled(14) }]}>Incident Type</Text>
        <View style={styles.typeGrid}>
          {CRISIS_TYPES.map(t => (
            <TouchableOpacity 
              key={t} 
              style={[styles.typeBtn, type === t && styles.typeBtnActive, { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} 
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive, { fontSize: scaled(14) }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { fontSize: scaled(14) }]}>Location</Text>
        <TouchableOpacity style={[styles.locationBox, { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={getCurrentLocation}>
          <View style={styles.locIcon}>
            {locLoading ? <ActivityIndicator size="small" color="#3B82F6" /> : <Ionicons name="location" size={scaled(20)} color="#3B82F6" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.locAddr, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(14) }]} numberOfLines={1}>{location?.address || 'Detecting location...'}</Text>
            <Text style={[styles.locStats, { fontSize: scaled(11) }]}>{location ? `Accuracy: ±${location.accuracy.toFixed(0)}m` : 'Tap to refresh'}</Text>
          </View>
          <Ionicons name="refresh" size={scaled(18)} color="#6B7280" />
        </TouchableOpacity>

        <Text style={[styles.label, { fontSize: scaled(14) }]}>Severity Estimate</Text>
        <View style={styles.severityRow}>
          {SEVERITIES.map(s => (
            <TouchableOpacity 
              key={s} 
              style={[styles.sevBtn, severity === s && { backgroundColor: s === 'CRITICAL' ? '#EF4444' : s === 'HIGH' ? '#F97316' : s === 'MEDIUM' ? '#F59E0B' : '#10B981' }, { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} 
              onPress={() => setSeverity(s)}
            >
              <Text style={[styles.sevText, severity === s && { color: '#fff' }, { fontSize: scaled(10) }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { fontSize: scaled(14) }]}>Description</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(15) }]}
          placeholder="Describe the situation..."
          placeholderTextColor="#6B7280"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={[styles.label, { fontSize: scaled(14) }]}>Estimated People Affected</Text>
        <TextInput
          style={[styles.input, { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(15) }]}
          placeholder="0"
          placeholderTextColor="#6B7280"
          keyboardType="numeric"
          value={affectedCount}
          onChangeText={setAffectedCount}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.submitGradient}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={[styles.submitText, { fontSize: scaled(18) }]}>Submit Crisis Report</Text>
                <Ionicons name="send" size={scaled(20)} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 20 
  },
  title: { fontWeight: '800' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  label: { fontWeight: '700', color: '#9CA3AF', marginTop: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  typeBtnActive: { backgroundColor: '#3B82F620', borderColor: '#3B82F6' },
  typeBtnText: { color: '#9CA3AF', fontWeight: '600' },
  typeBtnTextActive: { color: '#3B82F6' },
  locationBox: { 
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
  },
  locIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#3B82F620', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  locAddr: { fontWeight: '600' },
  locStats: { color: '#6B7280', marginTop: 2 },
  severityRow: { flexDirection: 'row', gap: 8 },
  sevBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sevText: { fontWeight: '800', color: '#9CA3AF' },
  textArea: { 
    borderRadius: 16, padding: 16, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
  },
  input: { 
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
  },
  submitBtn: { marginTop: 40, borderRadius: 16, overflow: 'hidden' },
  submitGradient: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  submitText: { color: '#fff', fontWeight: '700' },
});
