import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function IncidentsScreen({ navigation }) {
  const { currentScale, darkMode } = useTheme();
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const scaled = (size) => size * currentScale;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await api.getIncidents();
    setIncidents(data);
    setLoading(false);
  };

  const filteredIncidents = incidents.filter(inc => 
    inc.crisis_type.toLowerCase().includes(search.toLowerCase()) ||
    inc.location_address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#000000' : '#F3F4F6' }]}>
      {darkMode && <LinearGradient colors={['#000000', '#111827']} style={StyleSheet.absoluteFill} />}
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scaled(24)} color={darkMode ? '#F3F4F6' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(20) }]}>Incident History</Text>
        <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={scaled(20)} color={darkMode ? '#F3F4F6' : '#111827'} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Ionicons name="search" size={scaled(20)} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(15) }]}
          placeholder="Search incidents..."
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filteredIncidents.length > 0 ? filteredIncidents.map((inc, i) => (
            <View key={i} style={[styles.incidentCard, { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={[styles.severityBar, { backgroundColor: inc.severity === 'CRITICAL' ? '#EF4444' : inc.severity === 'HIGH' ? '#F97316' : '#F59E0B' }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.typeText, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(16) }]}>{inc.crisis_type}</Text>
                  <Text style={[styles.timeText, { fontSize: scaled(12) }]}>2h ago</Text>
                </View>
                <Text style={[styles.locText, { fontSize: scaled(13) }]} numberOfLines={1}>{inc.location_address || 'Downtown Zone A'}</Text>
                <View style={styles.cardFooter}>
                  <View style={styles.statRow}>
                    <Ionicons name="people" size={scaled(14)} color="#9CA3AF" />
                    <Text style={[styles.statText, { fontSize: scaled(12) }]}>{inc.affected_population} people</Text>
                  </View>
                  <View style={[styles.syncBadge, { backgroundColor: inc.sync_status === 'SYNCED' ? '#10B98120' : '#F59E0B20' }]}>
                    <Text style={[styles.syncText, { color: inc.sync_status === 'SYNCED' ? '#10B981' : '#F59E0B', fontSize: scaled(10) }]}>
                      {inc.sync_status === 'SYNCED' ? 'SYNCED' : 'PENDING'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={scaled(64)} color="#374151" />
              <Text style={[styles.emptyTitle, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(18) }]}>No Incidents Found</Text>
              <Text style={[styles.emptySub, { fontSize: scaled(14) }]}>Past reports and historical data will appear here.</Text>
            </View>
          )}
        </ScrollView>
      )}
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
  refreshBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { 
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 44 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  incidentCard: { 
    flexDirection: 'row', borderRadius: 16, 
    marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' 
  },
  severityBar: { width: 4 },
  cardBody: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  typeText: { fontWeight: '700' },
  timeText: { color: '#6B7280' },
  locText: { color: '#9CA3AF', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: '#9CA3AF' },
  syncBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  syncText: { fontWeight: '800' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontWeight: '700', marginTop: 20 },
  emptySub: { color: '#6B7280', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
});
