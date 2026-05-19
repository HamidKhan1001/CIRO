import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ShieldAlert, Navigation, PhoneCall, AlertTriangle, CheckCircle2,
  Send, Loader2, X, MapPin, Radio, Flame, Droplets, Zap, Car, ThermometerSun,
  Mic, MicOff
} from 'lucide-react';
import { CIROChat } from '../CIROChat/CIROChat';

const API_BASE = (import.meta.env?.VITE_API_URL) || 'http://localhost:8000';

// Default resources payload for orchestration
const DEFAULT_RESOURCES = {
  ambulances: 10, police_units: 15, rescue_teams: 8,
  fire_trucks: 6, shelters: 5, water_tankers: 4,
  helicopters: 2, field_teams: 20,
};

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customUserIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const CRISIS_TYPES = [
  { value: 'FLOODING', label: '🌊 Urban Flooding', icon: Droplets },
  { value: 'FIRE', label: '🔥 Fire / Explosion', icon: Flame },
  { value: 'ACCIDENT', label: '🚗 Road Accident', icon: Car },
  { value: 'POWER_OUTAGE', label: '⚡ Power Outage', icon: Zap },
  { value: 'HEATWAVE', label: '🌡️ Heatwave Emergency', icon: ThermometerSun },
  { value: 'INFRASTRUCTURE', label: '🏗️ Infrastructure Failure', icon: ShieldAlert },
  { value: 'OTHER', label: '📢 Other Emergency', icon: Radio },
];

const EMERGENCY_CONTACTS = [
  { label: 'Police / Rescue', number: '15', color: 'blue' },
  { label: 'Ambulance', number: '1122', color: 'green' },
  { label: 'Fire Department', number: '16', color: 'red' },
];

// ─── Report Incident Modal ────────────────────────────────────────────────────
function ReportModal({ position, onClose, onSuccess }) {
  const [crisisType, setCrisisType] = useState('FLOODING');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Setup Speech Recognition for description field
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setDescription(prev => prev ? prev + ' ' + transcript : transcript);
      setIsListening(false);
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Voice not supported in this browser. Try Chrome.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) { setError('Please describe the incident.'); return; }
    setIsSubmitting(true);
    setError(null);

    try {
      // Use /report — fast direct DB write, always works
      const res = await fetch(`${API_BASE}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crisis_type: crisisType,
          severity,
          description: description.trim(),
          location: position ? { lat: position.lat, lng: position.lng } : null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      onSuccess(data.incident_id || 'submitted');
    } catch (e) {
      setError(`Submission failed: ${e.message}. Is the backend running on port 8000?`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(239,68,68,0.3)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-red-500/20"
          style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(124,58,237,0.1))' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-black text-lg">Report Emergency</h3>
              <p className="text-red-400 text-xs font-bold">This will be sent to Admin Command Center</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Crisis Type */}
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Crisis Type</label>
            <div className="grid grid-cols-2 gap-2">
              {CRISIS_TYPES.map(({ value, label }) => (
                <button key={value} onClick={() => setCrisisType(value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-bold text-left transition-all border ${crisisType === value
                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Severity Level</label>
            <div className="flex gap-2">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => (
                <button key={s} onClick={() => setSeverity(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wider border transition-all ${severity === s
                    ? s === 'CRITICAL' ? 'bg-red-500 text-white border-red-400'
                      : s === 'HIGH' ? 'bg-orange-500/30 text-orange-300 border-orange-500/50'
                      : s === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                      : 'bg-green-500/20 text-green-300 border-green-500/40'
                    : 'bg-white/5 text-gray-500 border-white/10 hover:text-white'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Description + Voice Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
              <button
                type="button"
                onClick={toggleVoice}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                {isListening ? 'Stop Recording' : '🎙️ Voice'}
              </button>
            </div>
            <div className="relative">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={isListening ? '🎤 Listening... Speak your description now' : 'Describe what you see — location details, number of people affected, immediate hazards...'}
                rows={4}
                className={`w-full bg-white/[0.04] border focus:border-red-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-none transition-all ${
                  isListening ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-white/10'
                }`}
              />
              {isListening && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="w-0.5 bg-red-400 rounded-full animate-pulse"
                      style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* GPS status */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${position
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
            <MapPin className="w-4 h-4 flex-shrink-0" />
            {position
              ? `GPS attached: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
              : 'No GPS — location will be approximate'}
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-base transition-all hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]">
            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Dispatching to Command...</> : <><Send className="w-5 h-5" /> Report Emergency Now</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main UserDashboard ───────────────────────────────────────────────────────
export const UserDashboard = () => {
  const [position, setPosition] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedId, setReportedId] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported.'); return; }
    const watchId = navigator.geolocation.watchPosition(
      pos => { setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }); setGpsError(null); },
      err => setGpsError(err.message),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleReportSuccess = (incidentId) => {
    setShowReportModal(false);
    setReportedId(incidentId);
    setTimeout(() => setReportedId(null), 8000);
  };

  return (
    <div className="space-y-8">
      {/* Success banner */}
      {reportedId && (
        <div className="flex items-center gap-4 px-6 py-4 bg-green-500/10 border border-green-500/30 rounded-2xl animate-fade-in">
          <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-400 font-black">Emergency Reported Successfully!</p>
            <p className="text-green-600 text-sm">Incident ID: <span className="font-mono text-green-500">{reportedId}</span> — Now visible in Admin Command Center</p>
          </div>
          <button onClick={() => setReportedId(null)} className="ml-auto text-green-600 hover:text-green-400"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status */}
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex items-center justify-between shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] hover:-translate-y-1 transition-all duration-300">
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Status</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xl font-bold text-white">Safe Zone</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10"><CheckCircle2 className="w-6 h-6 text-green-500" /></div>
        </div>

        {/* GPS Tracking */}
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex items-center justify-between shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] hover:-translate-y-1 transition-all duration-300">
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Location Tracking</h3>
            {position ? (
              <span className="text-xl font-bold text-white tracking-widest">ACTIVE</span>
            ) : (
              <span className="text-xl font-bold text-gray-500">SEARCHING...</span>
            )}
            {position && <p className="text-xs text-gray-500 mt-1">±{Math.round(position.accuracy)}m accuracy</p>}
          </div>
          <div className={`p-3 rounded-lg ${position ? 'bg-blue-500/10' : 'bg-gray-500/10'}`}>
            <Navigation className={`w-6 h-6 ${position ? 'text-blue-500' : 'text-gray-500'}`} />
          </div>
        </div>

        {/* Report Incident — now functional */}
        <button
          onClick={() => setShowReportModal(true)}
          className="bg-red-500/5 backdrop-blur-2xl border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:shadow-[0_0_50px_rgba(239,68,68,0.35)] hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 flex items-center justify-between cursor-pointer w-full text-left">
          <div>
            <h3 className="text-red-400 text-sm font-medium mb-1">Emergency</h3>
            <span className="text-xl font-bold text-red-500">Report Incident</span>
            <p className="text-xs text-red-600 mt-1">Sends to Admin Panel</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
        </button>
      </div>

      {/* Live Map */}
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 relative shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] transition-all duration-500">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Navigation className="w-5 h-5 text-blue-500" />
            Live Tracker Map
          </h3>
          {gpsError && <span className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg">{gpsError}</span>}
          {!gpsError && position && <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg">GPS SYNCED</span>}
          {!gpsError && !position && <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg animate-pulse">ACQUIRING GPS...</span>}
        </div>

        <div className="h-[350px] md:h-[500px] w-full rounded-xl overflow-hidden border border-white/10 relative z-0">
          {!position ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0E1A]">
              <Navigation className="w-12 h-12 text-blue-500 animate-bounce mb-4" />
              <p className="text-gray-400">Acquiring GPS Signal...</p>
              <p className="text-gray-600 text-xs mt-1">Please allow location access</p>
            </div>
          ) : (
            <MapContainer center={[position.lat, position.lng]} zoom={15} style={{ height: '100%', width: '100%', background: '#0A0E1A' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <Marker position={[position.lat, position.lng]} icon={customUserIcon}>
                <Popup>
                  <div className="font-bold text-gray-800">📍 You are here</div>
                  <div className="text-xs text-gray-500">Accuracy: {Math.round(position.accuracy)}m</div>
                </Popup>
              </Marker>
              <Circle center={[position.lat, position.lng]}
                pathOptions={{ fillColor: '#3B82F6', color: '#3B82F6', opacity: 0.2 }}
                radius={position.accuracy} />
            </MapContainer>
          )}
        </div>
      </div>

      {/* Emergency Contacts — now tel: links */}
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] transition-all duration-500">
        <h3 className="text-lg font-bold flex items-center gap-2 text-white mb-6">
          <PhoneCall className="w-5 h-5 text-green-500" />
          Quick Emergency Contacts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EMERGENCY_CONTACTS.map(({ label, number, color }) => (
            <a
              key={number}
              href={`tel:${number}`}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all group
                ${color === 'blue' ? 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/15 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                  : color === 'green' ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/15 hover:border-green-500/40 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                  : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/15 hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}>
              <div className="flex items-center gap-3">
                <PhoneCall className={`w-4 h-4 ${color === 'blue' ? 'text-blue-400' : color === 'green' ? 'text-green-400' : 'text-red-400'}`} />
                <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{label}</span>
              </div>
              <span className={`font-mono font-black text-lg ${color === 'blue' ? 'text-blue-400' : color === 'green' ? 'text-green-400' : 'text-red-400'}`}>
                {number}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* CIRO Chat — passes live GPS */}
      <CIROChat userPosition={position} />

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          position={position}
          onClose={() => setShowReportModal(false)}
          onSuccess={handleReportSuccess}
        />
      )}
    </div>
  );
};
