import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { api } from '../services/api';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const KPICard = ({ title, value, icon, color, trend, scaled }) => (
  <View style={styles.kpiCard}>
    <View style={[styles.kpiIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={scaled(20)} color={color} />
    </View>
    <Text style={[styles.kpiTitle, { fontSize: scaled(12) }]}>{title}</Text>
    <Text style={[styles.kpiValue, { fontSize: scaled(20) }]}>{value}</Text>
    {trend && (
      <View style={styles.trendRow}>
        <Ionicons name={trend.direction === 'up' ? 'arrow-up' : 'arrow-down'} size={scaled(12)} color={trend.direction === 'up' ? '#10B981' : '#EF4444'} />
        <Text style={[styles.trendText, { color: trend.direction === 'up' ? '#10B981' : '#EF4444', fontSize: scaled(11) }]}>{trend.percent}%</Text>
      </View>
    )}
  </View>
);

const AgentPipeline = ({ agents, scaled }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pipelineScroll}>
      {agents.map((agent, index) => (
        <React.Fragment key={index}>
          <View style={styles.agentNode}>
            <View style={[styles.agentStatus, { backgroundColor: agent.status === 'done' ? '#10B981' : agent.status === 'processing' ? '#3B82F6' : '#374151' }]}>
              {agent.status === 'done' ? <Ionicons name="checkmark" size={scaled(12)} color="#fff" /> : 
               agent.status === 'processing' ? <Ionicons name="sync" size={scaled(12)} color="#fff" /> : null}
            </View>
            <Text style={[styles.agentName, { fontSize: scaled(10) }]}>{agent.name}</Text>
            <Text style={[styles.agentTime, { fontSize: scaled(10) }]}>{agent.time || '--'}</Text>
          </View>
          {index < agents.length - 1 && (
            <Ionicons name="chevron-forward" size={scaled(16)} color="#374151" style={styles.pipelineArrow} />
          )}
        </React.Fragment>
      ))}
    </ScrollView>
  );
};

export default function DashboardScreen({ navigation }) {
  const { currentScale, darkMode } = useTheme();
  const [incidents, setIncidents] = useState([]);
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

  const chartData = {
    labels: ["4h", "8h", "12h", "16h", "20h", "24h"],
    datasets: [{
      data: [5, 12, 8, 15, 20, 18],
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 2
    }]
  };

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#000000' : '#F3F4F6' }]}>
      {darkMode && <LinearGradient colors={['#000000', '#0A0E1A']} style={StyleSheet.absoluteFill} />}
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(24) }]}>CIRO Dashboard</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={[styles.statusText, { fontSize: scaled(12) }]}>Live System Connected</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Settings' })}>
          <Ionicons name="settings-outline" size={scaled(24)} color={darkMode ? '#F3F4F6' : '#111827'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <KPICard scaled={scaled} title="Active Crises" value="5" icon="warning-outline" color="#EF4444" trend={{ direction: 'up', percent: 20 }} />
          <KPICard scaled={scaled} title="Affected People" value="5.2k" icon="people-outline" color="#3B82F6" />
          <KPICard scaled={scaled} title="Response Time" value="7.7s" icon="time-outline" color="#10B981" />
          <KPICard scaled={scaled} title="Accuracy" value="92%" icon="analytics-outline" color="#F59E0B" />
        </View>

        {/* Agent Pipeline */}
        <Text style={[styles.sectionTitle, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(16) }]}>Agent Orchestration Pipeline</Text>
        <AgentPipeline scaled={scaled} agents={[
          { name: 'Fusion', status: 'done', time: '1.2s' },
          { name: 'Classifier', status: 'done', time: '1.6s' },
          { name: 'Severity', status: 'done', time: '1.0s' },
          { name: 'Resource', status: 'processing', time: '0.8s' },
          { name: 'Simulator', status: 'pending' },
          { name: 'Notifier', status: 'pending' },
          { name: 'Verifier', status: 'pending' },
        ]} />

        {/* Timeline Chart */}
        <Text style={[styles.sectionTitle, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(16) }]}>Crisis Timeline (24h)</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={width - 32}
            height={180}
            chartConfig={{
              backgroundColor: darkMode ? "#111827" : "#FFFFFF",
              backgroundGradientFrom: darkMode ? "#111827" : "#FFFFFF",
              backgroundGradientTo: darkMode ? "#111827" : "#FFFFFF",
              decimalPlaces: 0,
              color: (opacity = 1) => darkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => darkMode ? `rgba(156, 163, 175, ${opacity})` : `rgba(107, 114, 128, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: "4", strokeWidth: "2", stroke: "#3B82F6" }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Recent Incidents */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(16) }]}>Active Incidents</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Incidents')}>
            <Text style={[styles.viewAll, { fontSize: scaled(14) }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {incidents.slice(0, 3).map((inc, i) => (
          <TouchableOpacity key={i} style={styles.incidentCard} onPress={() => navigation.navigate('MainTabs', { screen: 'Incidents', params: { incidentId: inc.incident_id } })}>
            <View style={[styles.severityLine, { backgroundColor: inc.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B' }]} />
            <View style={styles.incidentContent}>
              <View style={styles.incidentHeader}>
                <Text style={[styles.incidentType, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(16) }]}>{inc.crisis_type}</Text>
                <Text style={[styles.incidentTime, { fontSize: scaled(12) }]}>13m ago</Text>
              </View>
              <Text style={[styles.incidentLoc, { fontSize: scaled(13) }]}>{inc.location_address || 'Downtown Zone A'}</Text>
              <View style={styles.incidentFooter}>
                <View style={styles.stat}>
                  <Ionicons name="people" size={scaled(14)} color="#9CA3AF" />
                  <Text style={[styles.statText, { fontSize: scaled(12) }]}>{inc.affected_population} affected</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={[styles.statusBadgeText, { fontSize: scaled(10) }]}>ACTIVE</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('ReportCrisis')}>
          <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.reportGradient}>
            <Ionicons name="add" size={scaled(24)} color="#fff" />
            <Text style={[styles.reportText, { fontSize: scaled(18) }]}>Report New Crisis</Text>
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
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
  statusText: { color: '#9CA3AF' },
  iconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  kpiCard: { width: (width - 44) / 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  kpiTitle: { color: '#9CA3AF', marginBottom: 4 },
  kpiValue: { fontWeight: '700', color: '#F3F4F6' },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  trendText: { fontWeight: '600' },
  sectionTitle: { fontWeight: '700', marginBottom: 16, marginTop: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAll: { color: '#3B82F6', fontWeight: '600' },
  pipelineScroll: { paddingBottom: 20 },
  agentNode: { alignItems: 'center', width: 70 },
  agentStatus: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  agentName: { fontWeight: '600', color: '#9CA3AF' },
  agentTime: { color: '#6B7280', marginTop: 2 },
  pipelineArrow: { marginTop: 4, marginHorizontal: 4 },
  chartContainer: { backgroundColor: '#111827', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  chart: { marginVertical: 8, borderRadius: 16 },
  incidentCard: { 
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, 
    marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' 
  },
  severityLine: { width: 4 },
  incidentContent: { flex: 1, padding: 16 },
  incidentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  incidentType: { fontWeight: '700' },
  incidentTime: { color: '#6B7280' },
  incidentLoc: { color: '#9CA3AF', marginBottom: 12 },
  incidentFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: '#9CA3AF' },
  statusBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusBadgeText: { fontWeight: '700', color: '#10B981' },
  reportBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  reportGradient: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  reportText: { color: '#fff', fontWeight: '700' },
});
