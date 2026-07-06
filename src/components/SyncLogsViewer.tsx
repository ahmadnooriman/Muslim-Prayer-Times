import React, { useState } from 'react';
import { ApiLog } from '../types';
import { Activity, Clock, Globe, ShieldCheck, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface SyncLogsViewerProps {
  logs: ApiLog[];
}

export const SyncLogsViewer: React.FC<SyncLogsViewerProps> = ({ logs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-serif font-bold text-xl text-stone-800 dark:text-stone-100 flex items-center gap-3">
          <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
          API Sync Logs
        </h4>
        {logs.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-8 h-8 rounded-full text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            aria-label={isExpanded ? "Collapse logs" : "Expand logs"}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
          Detailed request and response logs from recent synchronization processes. This shows exactly what data is being fetched from the selected online database.
        </p>
        
        {logs.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 dark:bg-stone-950/40 rounded-2xl border border-stone-200/50 dark:border-stone-800/50">
            <Globe className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-sm text-stone-500 dark:text-stone-400">No sync logs recorded yet.</p>
          </div>
        ) : (
          isExpanded && (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={index} className="bg-stone-50 dark:bg-stone-950/40 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 overflow-hidden">
                  <div className={`px-4 py-3 border-b flex items-center justify-between gap-4 ${log.error ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-900/50' : 'border-stone-200/50 dark:border-stone-800/50'}`}>
                    <div className="flex items-center gap-2">
                      {log.error ? (
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                      )}
                      <span className={`text-xs font-bold uppercase tracking-wider ${log.error ? 'text-amber-800 dark:text-amber-400' : 'text-stone-700 dark:text-stone-300'}`}>
                        {log.source}
                      </span>
                      {log.status && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${log.status >= 200 && log.status < 300 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'}`}>
                          {log.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                      <Clock className="w-3 h-3" />
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Request URL</div>
                      <div className="text-xs font-mono text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 break-all">
                        {log.url}
                      </div>
                    </div>
                    
                    {log.error && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-semibold text-amber-600/80 dark:text-amber-500/80 uppercase tracking-wider">Error Message</div>
                        <div className="text-xs font-mono text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/50 break-all">
                          {log.error}
                        </div>
                      </div>
                    )}
                    
                    {log.responseBody && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Response Body</div>
                        <div className="text-[10px] font-mono text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 max-h-64 overflow-y-auto custom-scrollbar">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(log.responseBody, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
