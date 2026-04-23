import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Camera } from '../types';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Eye, 
  ShieldAlert, 
  MoreHorizontal, 
  Clock, 
  MapPin,
  Lock,
  Unlock,
  Radio,
  WifiOff,
  Wifi,
  X,
  Activity,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Camera Feed Component
const CameraFeed = ({
  camera,
  onClose,
  streamFailed,
  onStreamError,
  onStreamLoad,
}: {
  camera: Camera,
  onClose: () => void,
  streamFailed: boolean,
  onStreamError: () => void,
  onStreamLoad: () => void
}) => {
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());
  const canRenderStream = !!camera.ip_simulated && !camera.is_blocked && !streamFailed;
  const resolvedStatus = canRenderStream ? 'online' : camera.status;

  useEffect(() => {
    const timer = setInterval(() => setTimestamp(new Date().toLocaleTimeString()), 1000);
    return () => {
       clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative w-full max-w-5xl glass-card overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10"
      >
        {/* Top Header */}
        <div className="p-4 flex justify-between items-center bg-white/[0.03] border-b border-white/5 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`status-pulse ${resolvedStatus === 'online' ? 'status-pulse-online' : 'status-pulse-offline'}`}></div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight leading-none">{camera.name}</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-1.5 uppercase tracking-widest">Global Node Identifier: 0x{camera.id.toString(16).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">IP ADDRESS</span>
                <span className="text-[10px] text-blue-500 font-mono font-bold tracking-widest">{camera.ip_simulated}</span>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all">
               <X size={20} />
             </button>
          </div>
        </div>

        {/* FEED AREA */}
        <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden group">
          {camera.is_blocked ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/10 text-center p-12 z-20">
              <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                 <Lock size={40} className="text-rose-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-[0.4em]">Node Restricted</h2>
              <p className="text-slate-500 text-xs font-medium max-w-sm leading-relaxed uppercase tracking-widest">Authorization error: Administrative protocol override. Access denied by Security Clearance Level 5.</p>
              <div className="mt-10 flex gap-4">
                 <button className="btn-action border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white">Emergency Override</button>
                 <button onClick={onClose} className="btn-action">Return to Hub</button>
              </div>
            </div>
          ) : !canRenderStream ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-bg text-center z-20">
              <WifiOff size={60} className="text-slate-700 mb-6" />
              <h2 className="text-xl font-black text-slate-500 mb-2 uppercase tracking-[0.3em]">No Signal</h2>
              <p className="text-slate-600 text-[10px] font-mono tracking-widest">Camera offline or unreachable</p>
            </div>
          ) : (
            <>
               <img
                 src={camera.ip_simulated}
                 className="w-full h-full object-cover"
                 alt={camera.name}
                 onError={onStreamError}
                 onLoad={onStreamLoad}
               />
               <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_50%,rgba(0,0,0,0.4)_100%)]" />
               <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
               
               <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                <div className="flex justify-between items-end">
                    <div className="text-[10px] text-white/50 font-mono tracking-widest leading-relaxed uppercase">
                      SECURE FEED ● {new Date().toISOString().split('T')[0]} {timestamp}<br/>
                      ENCODING: HEVC H.265 / GCM-256 / 4K-ULTRA<br/>
                      METRIC: 12.4 Mbps / 32ms LATENCY
                    </div>
                    <div className="flex gap-3">
                        <button className="btn-action bg-white/5 border-white/10 hover:bg-white/10 text-white">Capture Frame</button>
                        <button className="btn-action bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20">Vector Analysis</button>
                    </div>
                </div>
              </div>
            </>
          )}
          
          <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/5 opacity-40">
             <div className="grid grid-cols-4 grid-rows-4 w-full h-full opacity-20">
                {Array.from({length: 16}).map((_, i) => <div key={i} className="border-[0.5px] border-white/20" />)}
             </div>
          </div>
          
          {/* Overlay scanning line */}
          {canRenderStream && (
            <motion.div 
               animate={{ top: ['0%', '100%'] }}
               transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
               className="absolute left-0 right-0 h-px bg-blue-500/30 shadow-[0_0_15px_#3b82f6] z-10 pointer-events-none"
            />
          )}

          <div className="absolute top-6 left-6 p-3 glass-card bg-black/40 border-white/10 backdrop-blur-md">
             <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${resolvedStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-mono font-black text-white tracking-[0.2em] uppercase">{camera.name} • {camera.zone}</span>
                {resolvedStatus === 'online' && <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[8px] font-black tracking-widest">LIVE</span>}
             </div>
          </div>
        </div>

        {/* Tactical Info Panel */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-brand-bg">
           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Node Telemetry</h4>
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: 'Signal', val: camera.signal_percent != null ? `${camera.signal_percent}%` : 'N/A', color: 'text-emerald-500' },
                   { label: 'Uptime', val: camera.uptime_hours != null ? `${camera.uptime_hours}h` : 'N/A', color: 'text-blue-400' },
                   { label: 'Thermal', val: camera.thermal_celsius != null ? `${Number(camera.thermal_celsius).toFixed(1)}°C` : 'N/A', color: 'text-amber-500' },
                   { label: 'Load', val: camera.load_percent != null ? `${camera.load_percent}%` : 'N/A', color: 'text-slate-400' }
                 ].map(i => (
                   <div key={i.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1">{i.label}</p>
                      <p className={`text-[11px] font-mono font-bold ${i.color}`}>{i.val}</p>
                   </div>
                 ))}
              </div>
           </div>
           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Storage Archive</h4>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <Clock size={14} className="text-blue-500" />
                       <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Retain Cycle</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">
                      {camera.retain_days_remaining != null ? `${camera.retain_days_remaining} Days Remaining` : 'N/A'}
                    </span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, camera.retain_days_remaining != null ? (camera.retain_days_remaining / 30) * 100 : 0))}%` }}
                      className="h-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"
                    />
                 </div>
                 <p className="text-[9px] text-slate-600 font-medium leading-relaxed">
                   {camera.storage_node_label && camera.storage_used_tb != null
                     ? `Storage cluster node ${camera.storage_node_label} identifying ${Number(camera.storage_used_tb).toFixed(2)}TB of proprietary vector data for this node.`
                     : 'No storage telemetry available for this node yet.'}
                 </p>
              </div>
           </div>
           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Access Vectors</h4>
              <div className="space-y-2">
                 {['ADMIN_ROOT', 'OPERATOR_4', 'AUDIT_SYSTEM'].map(who => (
                   <div key={who} className="flex justify-between items-center p-2 rounded-lg bg-white/[0.01] border border-white/5">
                      <div className="flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-blue-500" />
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{who}</span>
                      </div>
                      <span className="text-[8px] font-mono text-slate-700">AUTHORIZED</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

interface CameraCardProps {
  camera: Camera;
  onClick: () => void | Promise<void>;
  onBlock: () => void | Promise<void>;
  isAdmin: boolean;
}

function CameraCard({ camera, onClick, onBlock, isAdmin }: CameraCardProps) {
  const [streamFailed, setStreamFailed] = useState(false);
  const [streamLive, setStreamLive] = useState(camera.status === 'online');
  const canRenderStream = !!camera.ip_simulated && !camera.is_blocked && !streamFailed;
  const resolvedStatus = streamLive && !camera.is_blocked ? 'online' : camera.status;

  useEffect(() => {
    setStreamFailed(false);
    setStreamLive(camera.status === 'online');
  }, [camera.ip_simulated, camera.status, camera.is_blocked]);

  return (
    <motion.div
        whileHover={{ y: -4 }}
        className={`glass-card glass-card-hover h-full overflow-hidden group flex flex-col relative ${camera.is_blocked ? 'border-rose-500/30 bg-rose-500/[0.02]' : ''}`}
    >
        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
            <div className={`w-2 h-2 rounded-full ${resolvedStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">{resolvedStatus}</span>
        </div>

        {/* Zone Badge */}
        <div className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
            <MapPin size={12} className="text-blue-500" />
        </div>

        {/* Media Preview */}
        <div className="aspect-[16/10] bg-[#050507] relative cursor-pointer overflow-hidden border-b border-white/5" onClick={onClick}>
            {canRenderStream ? (
                <>
                <img 
                    src={camera.ip_simulated}
                    className="w-full h-full object-cover transition-all duration-1000 opacity-60 group-hover:opacity-100 group-hover:scale-110"
                    alt={camera.name}
                    onError={() => {
                      setStreamFailed(true);
                      setStreamLive(false);
                    }}
                    onLoad={() => {
                      setStreamFailed(false);
                      setStreamLive(true);
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="absolute bottom-4 left-4">
                        <div className="flex items-center gap-2">
                           <Activity size={12} className="text-emerald-500 animate-pulse" />
                           <span className="text-[9px] font-bold text-white uppercase tracking-widest font-mono">Stream Active: 12.4 Mbps</span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-4 right-4 px-2 py-1 rounded bg-rose-500 text-white text-[9px] font-black tracking-widest">
                  LIVE
                </div>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    {camera.is_blocked ? (
                        <>
                        <Lock size={32} className="text-rose-500 mb-3 opacity-50" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Blocked</span>
                        </>
                    ) : (
                        <>
                        <WifiOff size={32} className="text-slate-800 mb-3" />
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Camera offline or unreachable</span>
                        </>
                    )}
                </div>
            )}
            <div className="absolute left-4 bottom-4 px-2.5 py-1 rounded bg-black/60 border border-white/10 text-[10px] text-white font-semibold">
              {camera.name} • {camera.zone}
            </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-grow flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 flex-1 pr-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight truncate group-hover:text-blue-500 transition-colors">{camera.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5 opacity-60">
                        <Radio size={10} className="text-slate-400" />
                        <span className="text-[9px] text-slate-400 font-mono tracking-widest">{camera.ip_simulated}</span>
                    </div>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{camera.zone}</span>
                </div>
            </div>

            <div className="mt-auto space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Last Handshake</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">{new Date(camera.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                   <div className="h-4 w-px bg-white/5" />
                   <div className="text-right">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Security Pool</span>
                      <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                         <div className="w-1 h-1 rounded-full bg-blue-500" />
                         <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Vector A1</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                    {isAdmin ? (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onBlock(); }}
                            className={`flex-1 btn-action ${
                                camera.is_blocked 
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' 
                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white'
                            }`}
                        >
                            {camera.is_blocked ? 'Sync Node' : 'Block Sink'}
                        </button>
                    ) : (
                        <div className="flex-1 py-1 px-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-center gap-2">
                             <Lock size={12} className="text-slate-700" />
                             <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Restricted</span>
                        </div>
                    )}
                    <button 
                        onClick={onClick}
                        className="p-2.5 bg-blue-600/10 text-blue-500 border border-blue-500/20 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                    >
                        <Maximize2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    </motion.div>
  );
};

export default function Cameras() {
  const { token, user } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [streamErrors, setStreamErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchCameras();
  }, [token]);

  const fetchCameras = async () => {
    try {
      const res = await fetch('/api/cameras', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCameras(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (id: number, blocked: boolean) => {
    try {
      const res = await fetch(`/api/cameras/${id}/block`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ blocked: !blocked }),
      });
      if (res.ok) fetchCameras();
    } catch (err) {
      console.error(err);
    }
  };

  const handleView = async (camera: Camera) => {
    try {
      await fetch('/api/logs/view', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ camera_id: camera.id }),
      });
      setSelectedCamera(camera);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCameras = cameras.filter(cam => {
    const matchesSearch = cam.name.toLowerCase().includes(search.toLowerCase()) || cam.ip_simulated.includes(search);
    const matchesZone = zoneFilter === 'All' || cam.zone === zoneFilter;
    const matchesStatus = statusFilter === 'All' || cam.status === statusFilter.toLowerCase();
    return matchesSearch && matchesZone && matchesStatus;
  });

  const zones = ['All', ...Array.from(new Set(cameras.map(c => c.zone)))];
  const statuses = ['All', 'Online', 'Offline', 'Maintenance'];

  if (loading) return null;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Imaging Acquisition Grid</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-black flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
             Active nodes identified: {filteredCameras.length} / Global Cluster Alpha
          </p>
        </div>
        <div className="flex gap-4">
           <div className="flex glass-card p-1 items-center bg-white/[0.02]">
             <button className="p-2 bg-blue-600/20 text-blue-400 rounded-lg shadow-sm"><Grid size={16} /></button>
             <button className="p-2 text-slate-600 hover:text-white transition-colors"><List size={16} /></button>
           </div>
           <button className="btn-action bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20 hover:bg-blue-500">Node Provisioning</button>
        </div>
      </header>

      {/* Advanced Filter Interface */}
      <div className="glass-card p-2 bg-white/[0.02] border-white/5">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-2">
           <div className="xl:col-span-4 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search node label, ip or mac index..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-soc w-full pl-12 h-14 bg-transparent border-transparent focus:bg-white/[0.02] text-sm uppercase tracking-widest font-black placeholder:text-slate-700"
              />
           </div>
           
           <div className="xl:col-span-8 flex flex-col md:flex-row items-center gap-2 p-2 px-4 border-t xl:border-t-0 xl:border-l border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] whitespace-nowrap">Tactical Sectors</span>
                 <div className="flex flex-wrap gap-1">
                    {zones.map(zone => (
                      <button
                        key={zone}
                        onClick={() => setZoneFilter(zone)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                          zoneFilter === zone 
                            ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' 
                            : 'bg-transparent text-slate-600 border-transparent hover:bg-white/5 hover:text-slate-400'
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                 </div>
              </div>
              
              <div className="hidden md:block w-px h-6 bg-white/5 mx-2" />

              <div className="flex items-center gap-4 w-full md:w-auto">
                 <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] whitespace-nowrap">Sink Status</span>
                 <div className="flex flex-wrap gap-1">
                    {statuses.map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                          statusFilter === status 
                            ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-transparent text-slate-600 border-transparent hover:bg-white/5 hover:text-slate-400'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Node Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 relative">
        <AnimatePresence mode="popLayout">
          {filteredCameras.map((camera) => (
            <motion.div key={camera.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CameraCard 
                  camera={camera}
                  isAdmin={user?.role === 'admin'}
                  onClick={() => handleView(camera)}
                  onBlock={() => toggleBlock(camera.id, camera.is_blocked)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredCameras.length === 0 && (
         <div className="flex flex-col items-center justify-center py-40 opacity-20 text-center">
            <Radio size={80} className="mb-6 animate-pulse" />
            <h3 className="text-xl font-black uppercase tracking-[0.5em]">No Cluster Response</h3>
            <p className="text-xs uppercase tracking-widest mt-2">Modify filtration protocols to re-index node library</p>
         </div>
      )}

      {/* Global Camera View Modal */}
      <AnimatePresence>
        {selectedCamera && (
          <CameraFeed 
            camera={(cameras.find(c => c.id === selectedCamera.id) || selectedCamera)} 
            onClose={() => setSelectedCamera(null)}
            streamFailed={!!streamErrors[selectedCamera.id]}
            onStreamError={() => setStreamErrors(prev => ({ ...prev, [selectedCamera.id]: true }))}
            onStreamLoad={() => setStreamErrors(prev => ({ ...prev, [selectedCamera.id]: false }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
