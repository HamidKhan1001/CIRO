import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Switch, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getBaseUrl, setBaseUrl, checkHealth } from '../services/api';

// Custom Slider Component
const StepSlider = ({ value, onChange, isDark }) => {
  const steps = ['Small', 'Medium', 'Large'];
  const activeIndex = steps.indexOf(value);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Animation for the thumb position
  const animatedValue = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: activeIndex,
      useNativeDriver: false,
      friction: 8,
      tension: 40
    }).start();
  }, [activeIndex]);

  // Calculate thumb position based on container width
  // Padding horizontal is 10, nodeWrapper width is 60, thumb width is 24
  const thumbPosition = animatedValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      10 + 30 - 12, // Left (padding + half-wrapper - half-thumb)
      containerWidth > 0 ? containerWidth / 2 - 12 : 0, // Center
      containerWidth > 0 ? containerWidth - 10 - 30 - 12 : 0 // Right
    ],
  });

  return (
    <View 
      style={sliderStyles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Track */}
      <View style={[sliderStyles.track, { backgroundColor: isDark ? Colors.border : '#E2E8F0' }]} />
      
      {/* Animated Thumb */}
      {containerWidth > 0 && (
        <Animated.View 
          style={[
            sliderStyles.thumb,
            { left: thumbPosition }
          ]} 
        />
      )}
      
      {/* Interactive Labels */}
      <View style={sliderStyles.nodesContainer}>
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          return (
            <TouchableOpacity 
              key={step} 
              style={sliderStyles.nodeWrapper}
              onPress={() => onChange(step)}
              activeOpacity={0.7}
            >
              <View style={sliderStyles.nodePlaceholder} />
              <Text style={[
                sliderStyles.nodeLabel,
                { color: isActive ? Colors.primaryStart : (isDark ? Colors.textMuted : '#64748B') },
                isActive && { fontWeight: '800' }
              ]}>
                {step}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function SettingsScreen({ navigation }) {
  const [url, setUrl] = useState(getBaseUrl());
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState('Medium');

  const testConnection = async () => {
    setTesting(true);
    setBaseUrl(url);
    const result = await checkHealth();
    setStatus(result.connected ? 'connected' : 'failed');
    setTesting(false);
    if (result.connected) {
      Alert.alert('Connected!', 'Successfully connected to CIRO backend.');
    } else {
      Alert.alert('Connection Failed', `Could not reach ${url}\n\nError: ${result.error}`);
    }
  };

  // Dynamic Theme Colors
  const theme = {
    bg: isDarkMode ? Colors.background : '#F8FAFC',
    surface: isDarkMode ? Colors.surface : '#FFFFFF',
    textPrimary: isDarkMode ? Colors.textPrimary : '#0F172A',
    textSecondary: isDarkMode ? Colors.textSecondary : '#334155',
    textMuted: isDarkMode ? Colors.textMuted : '#64748B',
    border: isDarkMode ? Colors.border : '#E2E8F0',
    headerGrad: isDarkMode ? [Colors.background, '#0F172A'] : ['#F8FAFC', '#E2E8F0'],
  };

  // Dynamic Font Scaling
  const getFontSize = (baseSize) => {
    if (fontSize === 'Small') return baseSize - 2;
    if (fontSize === 'Large') return baseSize + 2;
    return baseSize;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.headerGrad} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary, fontSize: getFontSize(26) }]}>Settings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={[styles.homeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="home" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Appearance Settings */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary, fontSize: getFontSize(13) }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={Colors.primaryStart} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary, fontSize: getFontSize(15) }]}>Dark Theme</Text>
            </View>
            <Switch 
              value={isDarkMode} 
              onValueChange={setIsDarkMode}
              trackColor={{ false: theme.border, true: Colors.primaryStart }}
              thumbColor="#fff"
            />
          </View>
          
          <View style={[styles.settingRow, styles.borderTop, { borderTopColor: theme.border, flexDirection: 'column', alignItems: 'flex-start' }]}>
            <View style={[styles.settingLabelRow, { marginBottom: 16 }]}>
              <Ionicons name="text" size={20} color={Colors.primaryStart} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary, fontSize: getFontSize(15) }]}>Font Size</Text>
            </View>
            
            {/* Custom Slider */}
            <StepSlider value={fontSize} onChange={setFontSize} isDark={isDarkMode} />
            
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary, fontSize: getFontSize(13) }]}>Backend Server URL</Text>
        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.textPrimary, fontSize: getFontSize(15) }]}
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.1.100:8000"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Text style={[styles.hint, { color: theme.textMuted, fontSize: getFontSize(12) }]}>
          Enter the IP address of the machine running the CIRO backend.{'\n'}
          Find it by running 'ipconfig' on the backend machine.
        </Text>

        <TouchableOpacity style={styles.testBtn} onPress={testConnection} disabled={testing}>
          <LinearGradient colors={[Colors.primaryStart, Colors.primaryEnd]} style={styles.testBtnGrad}>
            <Ionicons name={testing ? 'hourglass' : 'wifi'} size={18} color="#fff" />
            <Text style={[styles.testBtnText, { fontSize: getFontSize(15) }]}>{testing ? 'Testing...' : 'Test Connection'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {status && (
          <View style={[styles.statusCard, { backgroundColor: status === 'connected' ? Colors.successSoft : Colors.dangerSoft }]}>
            <Ionicons name={status === 'connected' ? 'checkmark-circle' : 'close-circle'} size={20} color={status === 'connected' ? Colors.success : Colors.danger} />
            <Text style={[styles.statusText, { color: status === 'connected' ? Colors.success : Colors.danger, fontSize: getFontSize(14) }]}>
              {status === 'connected' ? 'Backend is reachable!' : 'Connection failed'}
            </Text>
          </View>
        )}

        {/* Info section */}
        <View style={styles.infoSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary, fontSize: getFontSize(13) }]}>About CIRO</Text>
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.infoTitle, { color: theme.textPrimary, fontSize: getFontSize(16) }]}>Crisis Intelligence & Response Orchestrator</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary, fontSize: getFontSize(13) }]}>
              An Agentic AI System powered by Google Gemini that ingests multi-source crisis signals,
              detects emerging situations, generates coordinated response actions, and simulates
              execution outcomes in real-time.
            </Text>
            <View style={styles.techStack}>
              {['Google Gemini', 'Antigravity', 'FastAPI', 'React Native', 'Multi-Agent AI'].map((t, i) => (
                <View key={i} style={styles.techChip}>
                  <Text style={[styles.techText, { fontSize: getFontSize(12) }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { width: '100%', paddingVertical: 10 },
  track: { 
    position: 'absolute', 
    top: 22, 
    left: 25, 
    right: 25, 
    height: 6, 
    borderRadius: 3 
  },
  nodesContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 10
  },
  nodeWrapper: { alignItems: 'center', width: 60, zIndex: 2 },
  nodePlaceholder: { width: 24, height: 24 },
  thumb: { 
    position: 'absolute',
    top: 13,
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: Colors.primaryStart,
    borderWidth: 3,
    borderColor: Colors.primaryStart + '40',
    zIndex: 1,
    shadowColor: Colors.primaryStart,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  nodeLabel: { marginTop: 12, fontSize: 12, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 10,
  },
  title: { fontWeight: '800' },
  homeBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  content: { padding: 20, paddingBottom: 100 },
  sectionLabel: { fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 24 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  borderTop: { borderTopWidth: 1 },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontWeight: '500' },
  inputRow: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  input: { paddingVertical: 14 },
  hint: { marginTop: 8, lineHeight: 18 },
  testBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  testBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  testBtnText: { fontWeight: '600', color: '#fff' },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, padding: 14, borderRadius: 12 },
  statusText: { fontWeight: '600' },
  infoSection: { marginTop: 32 },
  infoCard: { borderRadius: 16, padding: 20, borderWidth: 1 },
  infoTitle: { fontWeight: '700', marginBottom: 8 },
  infoText: { lineHeight: 20 },
  techStack: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  techChip: { backgroundColor: Colors.primaryStart + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  techText: { fontWeight: '600', color: Colors.primaryStart },
});
