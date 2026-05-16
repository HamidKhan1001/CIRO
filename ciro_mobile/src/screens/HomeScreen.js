import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { api } from '../services/api';
import { dbService } from '../services/database';
import { useTheme } from '../context/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { currentScale, darkMode } = useTheme();
  const [backendStatus, setBackendStatus] = useState('CHECKING');
  const [offlineStatus, setOfflineStatus] = useState('READY');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const scaled = (size) => size * currentScale;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    checkStatus();
    dbService.init();
  }, []);

  const checkStatus = async () => {
    setBackendStatus('CHECKING');
    const isOnline = await api.checkHealth();
    setBackendStatus(isOnline ? 'ONLINE' : 'OFFLINE');
  };

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#000000' : '#F3F4F6' }]}>
      {darkMode && <LinearGradient colors={['#000000', '#111827']} style={StyleSheet.absoluteFill} />}
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.topSection}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={styles.logoContainer}>
              <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.logoGradient}>
                <Ionicons name="shield-checkmark" size={scaled(60)} color="#fff" />
              </LinearGradient>
            </View>
          </Animated.View>
          <Text style={[styles.brandTitle, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(32) }]}>CIRO 3.0</Text>
          <Text style={[styles.brandSub, { fontSize: scaled(16) }]}>Crisis Intelligence & Response Orchestrator</Text>
        </View>

        <View style={[styles.statusSection, { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: backendStatus === 'ONLINE' ? '#10B981' : backendStatus === 'CHECKING' ? '#F59E0B' : '#EF4444' }]} />
            <Text style={[styles.statusText, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(14) }]}>Backend Status: {backendStatus}</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.statusText, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(14) }]}>Offline Mode: READY</Text>
          </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[styles.primaryBtn, backendStatus === 'OFFLINE' && styles.disabledBtn]} 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Dashboard' })}
          >
            <Text style={[styles.primaryBtnText, { fontSize: scaled(18) }]}>Continue to Dashboard</Text>
            <Ionicons name="arrow-forward" size={scaled(20)} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Dashboard', params: { offline: true } })}
          >
            <Text style={[styles.secondaryBtnText, { color: darkMode ? '#F3F4F6' : '#111827', fontSize: scaled(16) }]}>Use Offline Mode</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { fontSize: scaled(12) }]}>Version 3.0.0 | Production Grade</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Settings' })}>
            <Ionicons name="settings-outline" size={scaled(24)} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 32, justifyContent: 'space-between' },
  topSection: { alignItems: 'center', marginTop: 60 },
  logoContainer: {
    width: 120, height: 120, borderRadius: 30, overflow: 'hidden',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 15,
  },
  logoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  brandTitle: { fontWeight: '800', marginTop: 24 },
  brandSub: { color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  statusSection: { borderRadius: 20, padding: 20, gap: 12 },
  statusItem: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  statusText: { fontWeight: '600' },
  buttonSection: { gap: 16 },
  primaryBtn: { 
    height: 56, backgroundColor: '#3B82F6', borderRadius: 16, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  disabledBtn: { backgroundColor: '#1F2937' },
  secondaryBtn: { 
    height: 56, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 16, justifyContent: 'center', alignItems: 'center' 
  },
  secondaryBtnText: { fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  versionText: { color: '#6B7280' },
});
