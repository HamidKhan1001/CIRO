import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { darkMode, fontSizeIndex, updateDarkMode, updateFontSize, currentScale } = useTheme();
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const url = await AsyncStorage.getItem('backend_url');
    if (url) setBackendUrl(url);
  };

  const handleSave = async () => {
    await AsyncStorage.setItem('backend_url', backendUrl);
    api.setBaseUrl(backendUrl);
    Alert.alert('Success', 'Settings saved successfully.');
  };

  const handleShowLogs = () => {
    Alert.alert(
      "Developer Logs",
      "System: CIRO 3.0\nUptime: 1h 01m\nAgents: 7 Active\nMemory: 242MB\nLast Sync: 2m ago",
      [{ text: "Close", style: "cancel" }]
    );
  };

  // Dynamic Styles based on Theme Context
  const currentBgColor = darkMode ? '#000000' : '#F3F4F6';
  const currentTextColor = darkMode ? '#F3F4F6' : '#111827';
  const currentCardColor = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const currentBorderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  // Scaled Font Size Helper
  const scaled = (size) => size * currentScale;

  return (
    <View style={[styles.container, { backgroundColor: currentBgColor }]}>
      {darkMode && <LinearGradient colors={['#000000', '#0A0E1A']} style={StyleSheet.absoluteFill} />}
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={currentTextColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTextColor, fontSize: scaled(20) }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { fontSize: scaled(13) }]}>Backend Connection</Text>
        <View style={[styles.inputGroup, { backgroundColor: currentCardColor, borderColor: currentBorderColor }]}>
          <Text style={[styles.label, { fontSize: scaled(12) }]}>Backend URL</Text>
          <TextInput
            style={[styles.input, { backgroundColor: currentCardColor, borderColor: currentBorderColor, color: currentTextColor, fontSize: scaled(14) }]}
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="http://..."
            placeholderTextColor="#6B7280"
          />
          <TouchableOpacity style={styles.testBtn} onPress={handleSave}>
            <Text style={[styles.testBtnText, { fontSize: scaled(14) }]}>Apply & Save</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { fontSize: scaled(13) }]}>Appearance</Text>
        <View style={[styles.settingCard, { backgroundColor: currentCardColor, borderColor: currentBorderColor }]}>
          <View style={styles.appearanceRow}>
            <View>
              <Text style={[styles.settingLabel, { color: currentTextColor, fontSize: scaled(16) }]}>Dark Theme</Text>
              <Text style={[styles.settingSub, { fontSize: scaled(12) }]}>OLED optimized dashboard</Text>
            </View>
            <Switch value={darkMode} onValueChange={updateDarkMode} trackColor={{ true: '#3B82F6' }} />
          </View>

          <View style={styles.separator} />

          <Text style={[styles.settingLabel, { color: currentTextColor, marginTop: 16, fontSize: scaled(16) }]}>Text Scale</Text>
          <View style={styles.sliderContainer}>
            <View style={[styles.sliderTrack, { backgroundColor: currentBorderColor }]} />
            
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => {
                const x = e.nativeEvent.locationX;
                if (x < 80) updateFontSize(0);
                else if (x < 160) updateFontSize(1);
                else updateFontSize(2);
              }}
              style={styles.sliderTouchArea}
            >
              <View style={[styles.sliderThumb, { left: fontSizeIndex === 0 ? '0%' : fontSizeIndex === 1 ? '50%' : '100%', marginLeft: fontSizeIndex === 0 ? 0 : fontSizeIndex === 1 ? -11 : -22 }]} />
            </TouchableOpacity>

            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabelText, fontSizeIndex === 0 && styles.activeLabel, { fontSize: scaled(10) }]}>Small</Text>
              <Text style={[styles.sliderLabelText, fontSizeIndex === 1 && styles.activeLabel, { fontSize: scaled(10) }]}>Medium</Text>
              <Text style={[styles.sliderLabelText, fontSizeIndex === 2 && styles.activeLabel, { fontSize: scaled(10) }]}>Large</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { fontSize: scaled(13) }]}>Preferences</Text>
        <View style={[styles.settingRow, { backgroundColor: currentCardColor, borderColor: currentBorderColor }]}>
          <View>
            <Text style={[styles.settingLabel, { color: currentTextColor, fontSize: scaled(16) }]}>Push Notifications</Text>
            <Text style={[styles.settingSub, { fontSize: scaled(12) }]}>Alerts for critical crises</Text>
          </View>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: '#3B82F6' }} />
        </View>

        <View style={[styles.settingRow, { backgroundColor: currentCardColor, borderColor: currentBorderColor }]}>
          <View>
            <Text style={[styles.settingLabel, { color: currentTextColor, fontSize: scaled(16) }]}>Auto-Sync Data</Text>
            <Text style={[styles.settingSub, { fontSize: scaled(12) }]}>Sync offline reports automatically</Text>
          </View>
          <Switch value={autoSync} onValueChange={setAutoSync} trackColor={{ true: '#3B82F6' }} />
        </View>

        <Text style={[styles.sectionTitle, { fontSize: scaled(13) }]}>Advanced</Text>
        <View style={[styles.infoBox, { backgroundColor: currentCardColor, borderColor: currentBorderColor }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { fontSize: scaled(14) }]}>App Version</Text>
            <Text style={[styles.infoValue, { color: currentTextColor, fontSize: scaled(14) }]}>3.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { fontSize: scaled(14) }]}>Build Number</Text>
            <Text style={[styles.infoValue, { color: currentTextColor, fontSize: scaled(14) }]}>42</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { fontSize: scaled(14) }]}>Device ID</Text>
            <Text style={[styles.infoValue, { color: currentTextColor, fontSize: scaled(14) }]}>CIRO-77-X9</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.debugBtn} onPress={handleShowLogs}>
          <Text style={[styles.debugBtnText, { fontSize: scaled(14) }]}>View Developer Logs</Text>
          <Ionicons name="code" size={18} color="#9CA3AF" />
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
  sectionTitle: { fontWeight: '700', color: '#3B82F6', marginTop: 32, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.5 },
  inputGroup: { borderRadius: 20, padding: 20, borderWidth: 1 },
  label: { color: '#9CA3AF', marginBottom: 8 },
  input: { borderRadius: 12, padding: 12, borderWidth: 1 },
  testBtn: { marginTop: 16, height: 44, backgroundColor: '#3B82F620', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3B82F6' },
  testBtnText: { color: '#3B82F6', fontWeight: '700' },
  settingCard: { padding: 20, borderRadius: 20, borderWidth: 1 },
  appearanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  settingLabel: { fontWeight: '600' },
  settingSub: { color: '#6B7280', marginTop: 2 },
  sliderContainer: { marginTop: 12, height: 80, justifyContent: 'center' },
  sliderTrack: { height: 2, width: '100%', position: 'absolute', top: 30 },
  sliderTouchArea: { width: '100%', height: 60, position: 'absolute', top: 0 },
  sliderThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#3B82F6', position: 'absolute', top: 20, borderWidth: 3, borderColor: '#000000' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
  sliderLabelText: { fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  activeLabel: { color: '#3B82F6' },
  infoBox: { borderRadius: 20, padding: 20, gap: 16, borderWidth: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { color: '#9CA3AF' },
  infoValue: { fontWeight: '600' },
  debugBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 40, padding: 16 },
  debugBtnText: { color: '#9CA3AF', fontWeight: '600' },
});
