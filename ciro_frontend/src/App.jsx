import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Settings, RefreshCcw, Activity, ShieldAlert, 
  Users, Timer, Target, ChevronRight, Zap, Info, Menu, X
} from 'lucide-react';
import { api } from './services/api';
import { CrisisMap } from './components/CrisisMap/CrisisMap';
import { UserDashboard } from './components/UserDashboard/UserDashboard';
import { CIROChat } from './components/CIROChat/CIROChat';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const KPICard = ({ title, value, icon: Icon, trend, color }) => (
  <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 group hover:-translate-y-1 hover:bg-white/[0.08] hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] transition-all duration-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg bg-${color === 'danger' ? 'red' : color === 'success' ? 'green' : 'blue'}-500/10 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-6 h-6 text-${color === 'danger' ? 'red' : color === 'success' ? 'green' : 'blue'}-500`} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend.direction === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.percent}%
        </span>
        <span className="text-gray-500 text-xs">{trend.text}</span>
      </div>
    )}
  </div>
);

const AgentPipeline = ({ agents }) => (
  <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] transition-all duration-500">
    <div className="flex items-center justify-between mb-8">
      <h3 className="text-lg font-bold flex items-center gap-2 text-white">
        <Zap className="w-5 h-5 text-blue-500" />
        Agent Orchestration Pipeline
      </h3>
      <div className="flex items-center gap-4 text-xs font-medium">
        <span className="flex items-center gap-1.5 text-gray-400"><div className="w-2 h-2 rounded-full bg-green-500" /> Completed</span>
        <span className="flex items-center gap-1.5 text-gray-400"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Processing</span>
      </div>
    </div>
    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
      {agents.map((agent, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-3 min-w-[100px]">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${
              agent.status === 'done' ? 'bg-green-500/20 border-green-500 text-green-500' : 
              agent.status === 'processing' ? 'bg-blue-500/20 border-blue-500 text-blue-500 animate-pulse' : 
              'bg-white/5 border-white/10 text-gray-600'
            }`}>
              {agent.status === 'done' ? '✓' : i + 1}
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-200 mb-0.5">{agent.name}</p>
              <p className="text-[10px] text-gray-500">{agent.time || (agent.status === 'pending' ? 'Pending' : '0.0s')}</p>
            </div>
          </div>
          {i < agents.length - 1 && (
            <div className="flex-1 h-[2px] bg-white/5 min-w-[20px] mb-8 relative overflow-hidden">
              {agent.status === 'done' && <div className="absolute inset-0 bg-green-500/40 animate-[slide_2s_infinite]" />}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

function App() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState('online');
  const [fontSize, setFontSize] = useState(1); // 0: Small, 1: Medium, 2: Large
  const [showSettings, setShowSettings] = useState(false);
  const [currentView, setCurrentView] = useState('admin'); // 'admin' | 'user'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const sizes = ['14px', '16px', '18px'];
    document.documentElement.style.setProperty('--base-font-size', sizes[fontSize]);
  }, [fontSize]);

  const fetchData = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      setSystemStatus('online');
    } catch (error) {
      setSystemStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Active Crises',
        data: [12, 19, 15, 25, 22, 30],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Affected (k)',
        data: [8, 15, 12, 20, 18, 25],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F3F4F6',
        bodyColor: '#9CA3AF',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { color: '#6B7280', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#6B7280', font: { size: 10 } }
      }
    }
  };

  return (
    <div className="min-h-screen text-[#F3F4F6] relative overflow-hidden" style={{ 
      backgroundColor: '#0A0E1A',
      backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(37, 99, 235, 0.15), transparent 35%), radial-gradient(circle at 85% 30%, rgba(239, 68, 68, 0.08), transparent 35%)' 
    }}>
      {/* Header */}
      <header className="py-4 border-b border-white/5 bg-[#111827]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">CIRO <span className="text-blue-500">3.0</span></h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${systemStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{systemStatus} Network</span>
              </div>
            </div>
          </div>
          
          {/* Mobile Hamburger Toggle */}
          <button 
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className={`${isMobileMenuOpen ? 'flex flex-col mt-4 p-4 bg-[#111827]/90 backdrop-blur-xl rounded-2xl border border-white/10' : 'hidden'} md:flex flex-wrap items-center justify-center gap-4 md:gap-6 w-full md:w-auto`}>
            {/* View Toggle */}
            <div className="flex bg-[#1F2937] p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currentView === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Admin
              </button>
              <button 
                onClick={() => setCurrentView('user')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currentView === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                User Tracker
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              <Timer className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-mono font-bold text-gray-200">20:26:45</span>
            </div>
            
            {/* Font Size Slider Toggle */}
            <div className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2.5 rounded-xl transition-all ${showSettings ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}
              >
                <Settings className="w-5 h-5" />
              </button>

              {showSettings && (
                <div className="absolute top-14 right-0 w-64 bg-[#1F2937] border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in z-[60]">
                  <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4">Appearance Settings</h4>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold">Text Scale</span>
                    <span className="text-xs text-gray-400 uppercase font-bold">
                      {fontSize === 0 ? 'Small' : fontSize === 1 ? 'Medium' : 'Large'}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="1" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="font-slider"
                  />
                  <div className="slider-labels">
                    <span>S</span>
                    <span>M</span>
                    <span>L</span>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">OLED Dark Mode</span>
                      <div className="w-10 h-5 bg-blue-600 rounded-full flex items-center px-1">
                        <div className="w-3 h-3 bg-white rounded-full ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 text-white w-full md:w-auto">
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-8">
        {currentView === 'user' ? (
          <UserDashboard />
        ) : (
          <>
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard title="Active Crises" value={incidents.filter(i=>i.status==='ACTIVE').length} icon={ShieldAlert} color="danger" trend={{ direction: 'up', percent: 12, text: 'since last hour' }} />
          <KPICard title="Affected Population" value="5.2k" icon={Users} color="primary" trend={{ direction: 'down', percent: 3, text: 'recovery in progress' }} />
          <KPICard title="Avg Response Time" value="7.7s" icon={Timer} color="success" trend={{ direction: 'up', percent: 8, text: 'SLA optimization' }} />
          <KPICard title="System Accuracy" value="92.4%" icon={Target} color="warning" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (Main Analysis) */}
          <div className="lg:col-span-8 space-y-8">
            <AgentPipeline agents={[
              { name: 'Signal Fusion', status: 'done', time: '1.2s' },
              { name: 'Classifier', status: 'done', time: '1.6s' },
              { name: 'Severity Prediction', status: 'done', time: '1.0s' },
              { name: 'Resource Allocator', status: 'processing', time: '0.8s' },
              { name: 'Action Simulator', status: 'pending' },
              { name: 'Notifier', status: 'pending' },
              { name: 'Verification', status: 'pending' },
            ]} />

            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                  <ShieldAlert className="w-5 h-5 text-blue-500" />
                  Live Geolocation Incident Map
                </h3>
                <span className="text-xs font-bold text-green-500 px-2.5 py-1 bg-green-500/10 rounded-lg animate-pulse">GPU-ACCELERATED LIVE VIEW</span>
              </div>
              <div className="h-[350px] md:h-[450px] rounded-xl overflow-hidden border border-white/10 relative">
                <CrisisMap incidents={incidents} />
              </div>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Real-time Crisis Dynamics
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span className="text-xs text-gray-400">Active Count</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-xs text-gray-400">Severity Weight</span>
                  </div>
                </div>
              </div>
              <div className="h-[250px] md:h-[300px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Right Column (Live List) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex flex-col h-full shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Active Incidents</h3>
                <span className="text-xs font-bold text-blue-500 px-2 py-1 bg-blue-500/10 rounded-lg">LIVE FEED</span>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
                {incidents.map((inc, i) => (
                  <div key={i} className="group bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-xl p-4 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`px-2 py-1 rounded text-[10px] font-black tracking-widest text-white ${
                        inc.severity === 'CRITICAL' ? 'bg-red-500' : 
                        inc.severity === 'HIGH' ? 'bg-orange-500' : 'bg-green-500'
                      }`}>
                        {inc.severity}
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold">12 MIN AGO</span>
                    </div>
                    <h4 className="font-bold text-gray-100 group-hover:text-blue-500 transition-colors">{inc.type}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">Downtown Zone A, CIRO-77-X9</p>
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {[1,2,3].map(j=>(
                            <div key={j} className="w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center">
                              <Users className="w-3 h-3 text-gray-500" />
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{inc.affected_population} AFFECTED</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(37,99,235,0.1)] group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Info className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-500 mb-1">System Insight</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Gemini 1.5 Pro is currently optimizing resource allocation paths with a 92.4% confidence score based on multi-modal signal fusion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </main>

      {/* Global floating CIRO Chat — visible on both Admin & User views */}
      {currentView === 'admin' && <CIROChat userPosition={null} />}
    </div>
  );
}

export default App;
