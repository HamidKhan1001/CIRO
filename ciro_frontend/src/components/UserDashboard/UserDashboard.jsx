import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShieldAlert, Navigation, PhoneCall, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customUserIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const UserDashboard = () => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex items-center justify-between shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] hover:-translate-y-1 transition-all duration-300">
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Status</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xl font-bold text-white">Safe Zone</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex items-center justify-between shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] hover:-translate-y-1 transition-all duration-300">
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Location Tracking</h3>
            {position ? (
              <span className="text-xl font-bold text-white tracking-widest">ACTIVE</span>
            ) : (
              <span className="text-xl font-bold text-gray-500">SEARCHING...</span>
            )}
          </div>
          <div className={`p-3 rounded-lg ${position ? 'bg-blue-500/10' : 'bg-gray-500/10'}`}>
            <Navigation className={`w-6 h-6 ${position ? 'text-blue-500' : 'text-gray-500'}`} />
          </div>
        </div>

        <div className="bg-red-500/5 backdrop-blur-2xl border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:shadow-[0_0_50px_rgba(239,68,68,0.3)] hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 flex items-center justify-between cursor-pointer" onClick={() => setIsReporting(true)}>
          <div>
            <h3 className="text-red-400 text-sm font-medium mb-1">Emergency</h3>
            <span className="text-xl font-bold text-red-500">Report Incident</span>
          </div>
          <div className="p-3 rounded-lg bg-red-500/20">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 relative shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] transition-all duration-500">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Navigation className="w-5 h-5 text-blue-500" />
            Live Tracker Map
          </h3>
          {error && <span className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg">{error}</span>}
          {!error && position && <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg">GPS SYNCED</span>}
        </div>
        
        <div className="h-[350px] md:h-[500px] w-full rounded-xl overflow-hidden border border-white/10 relative z-0">
          {!position ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0E1A]">
              <Navigation className="w-12 h-12 text-blue-500 animate-bounce mb-4" />
              <p className="text-gray-400">Acquiring GPS Signal...</p>
            </div>
          ) : (
            <MapContainer 
              center={[position.lat, position.lng]} 
              zoom={15} 
              style={{ height: '100%', width: '100%', background: '#0A0E1A' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <Marker position={[position.lat, position.lng]} icon={customUserIcon}>
                <Popup className="dark-popup">
                  <div className="font-bold text-gray-800">You are here</div>
                  <div className="text-xs text-gray-500">Accuracy: {Math.round(position.accuracy)}m</div>
                </Popup>
              </Marker>
              <Circle 
                center={[position.lat, position.lng]} 
                pathOptions={{ fillColor: '#3B82F6', color: '#3B82F6', opacity: 0.2 }} 
                radius={position.accuracy} 
              />
            </MapContainer>
          )}
        </div>
      </div>
      
      {/* Emergency Contacts */}
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] transition-all duration-500">
        <h3 className="text-lg font-bold flex items-center gap-2 text-white mb-6">
          <PhoneCall className="w-5 h-5 text-green-500" />
          Quick Emergency Contacts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors">
            <span className="font-bold text-gray-200">Police / Rescue</span>
            <span className="text-blue-500 font-mono font-bold">15</span>
          </button>
          <button className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors">
            <span className="font-bold text-gray-200">Ambulance</span>
            <span className="text-green-500 font-mono font-bold">1122</span>
          </button>
          <button className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors">
            <span className="font-bold text-gray-200">Fire Department</span>
            <span className="text-red-500 font-mono font-bold">16</span>
          </button>
        </div>
      </div>
    </div>
  );
};
