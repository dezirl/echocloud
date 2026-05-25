import { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Trash2, Moon, Sun, Search, ShieldCheck, Cpu, Database, EyeOff } from 'lucide-react';
import { useStore } from '../store';

export default function InterceptorPanel() {
  const interceptorLogs = useStore((state) => state.interceptorLogs);
  const interceptorActive = useStore((state) => state.interceptorActive);
  const toggleInterceptor = useStore((state) => state.toggleInterceptor);
  const clearInterceptorLogs = useStore((state) => state.clearInterceptorLogs);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'API_REQUEST' | 'SESSION_TOKEN' | 'STREAM_EXTRACTION' | 'COOKIE_CAPTURE'>('ALL');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const filteredLogs = interceptorLogs.filter(log => {
    if (activeFilter === 'ALL') return true;
    return log.type === activeFilter;
  });

  const handleCopyLog = (id: string, payload: string) => {
    navigator.clipboard.writeText(payload);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 1500);
  };

  const logStats = {
    total: interceptorLogs.length,
    extractedStreams: interceptorLogs.filter(l => l.type === 'STREAM_EXTRACTION').length,
    cookiesCaught: interceptorLogs.filter(l => l.type === 'COOKIE_CAPTURE').length,
    apiRequests: interceptorLogs.filter(l => l.type === 'API_REQUEST').length,
  };

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-y-auto animate-in fade-in duration-300">
      
      {/* IPC Header Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Terminal className="text-accent" />
            <span>Electron webRequest Session Interceptor</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Diagnose native soundcloud header captures, oauth intercepts, and extracted HLS stream payloads bypassing official API constraints.
          </p>
        </div>

        {/* Console Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active status */}
          <button
            onClick={toggleInterceptor}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${interceptorActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
          >
            <div className={`w-2 h-2 rounded-full ${interceptorActive ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
            <span>{interceptorActive ? 'CAPTURE: ENABLED' : 'CAPTURE: HOVER'}</span>
          </button>

          <button
            onClick={clearInterceptorLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Flush Buffer</span>
          </button>
        </div>
      </div>

      {/* IPC Statistics HUD cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg text-accent">
            <Cpu size={16} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider block">IPC HOOK STATUS</span>
            <span className="text-xs font-bold font-mono">200 OK (LIVE)</span>
          </div>
        </div>

        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
            <Database size={16} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider block">PACKETS CAUGHT</span>
            <span className="text-xs font-bold font-mono text-cyan-400">{logStats.total} / 100 max</span>
          </div>
        </div>

        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <ShieldCheck size={16} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider block">COOKIES RECORDED</span>
            <span className="text-xs font-bold font-mono text-emerald-400">{logStats.cookiesCaught}</span>
          </div>
        </div>

        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
            <Terminal size={16} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider block">HLS STREAMS RESOLVED</span>
            <span className="text-xs font-bold font-mono text-orange-400">{logStats.extractedStreams}</span>
          </div>
        </div>
      </div>

      {/* Terminal View Container */}
      <div className="flex-1 bg-neutral-950/70 border border-white/5 rounded-2xl flex flex-col font-mono text-xs overflow-hidden h-[400px]">
        {/* Terminal Header */}
        <div className="px-4 py-2 bg-zinc-900 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-zinc-500 font-mono font-bold tracking-wider ml-2">ECHO_CLIENT_WEBREQUEST_LOGS.EXE</span>
          </div>

          <div className="flex items-center gap-1">
            <button className="px-1.5 py-0.5 text-zinc-600 hover:text-zinc-400">
              <EyeOff size={11} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap border-b border-white/5 px-4 py-2 bg-[#ffffff01] gap-1.5">
          {(['ALL', 'API_REQUEST', 'SESSION_TOKEN', 'STREAM_EXTRACTION', 'COOKIE_CAPTURE'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-2.5 py-1 text-[10px] rounded-md border font-semibold tracking-tight cursor-pointer ${activeFilter === tab ? 'bg-accent/25 text-white border-accent/20' : 'bg-[#ffffff01] border-transparent text-[#ffffff40] hover:text-zinc-300'}`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Logs Log-Lines Scroll panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 Scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600 text-center">
              <Terminal size={24} className="mb-2 text-zinc-700" />
              <span>LOG STREAM IS COLD</span>
              <p className="text-[10px] text-zinc-700 max-w-sm mt-1">Activate background hooks and skip or play elements above to trigger live webRequest listener callbacks.</p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div 
                key={log.id} 
                className="bg-[#00000062] border border-white/[0.03] rounded-xl p-3.5 hover:border-white/10 transition-colors flex flex-col gap-2 relative group"
              >
                {/* Meta line */}
                <div className="flex items-center justify-between text-[11px] select-text">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-semibold">[{log.timestamp}]</span>
                    
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      log.type === 'COOKIE_CAPTURE' ? 'bg-emerald-500/10 text-emerald-400' :
                      log.type === 'STREAM_EXTRACTION' ? 'bg-orange-500/10 text-orange-400' :
                      log.type === 'SESSION_TOKEN' ? 'bg-purple-500/10 text-purple-400' :
                      'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {log.type}
                    </span>

                    <span className={`font-extrabold ${log.method === 'GET' ? 'text-amber-500' : log.method === 'POST' ? 'text-cyan-400' : 'text-purple-400'}`}>
                      {log.method}
                    </span>

                    <span className="text-zinc-400 select-all max-w-[140px] truncate md:max-w-xs">{log.url}</span>
                  </div>

                  <span className="text-zinc-500 font-bold">{log.status}</span>
                </div>

                {/* Sub payload block */}
                <pre className="text-[10.5px] text-[#22c55e] bg-black/40 p-2.5 rounded-lg border border-white/[0.02] overflow-x-auto whitespace-pre-wrap leading-relaxed select-text font-mono">
                  {log.payload}
                </pre>

                {/* Copy logs helper */}
                <button
                  onClick={() => handleCopyLog(log.id, log.payload)}
                  className="absolute bottom-2 right-2 p-1.5 bg-[#121212] hover:bg-zinc-800 border border-white/5 rounded text-[9px] hover:text-white text-zinc-500 transition-opacity cursor-pointer flex items-center gap-1 font-mono"
                >
                  <span>{copiedLogId === log.id ? 'Copied' : 'Copy Payload'}</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
