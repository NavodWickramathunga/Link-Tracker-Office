import React from 'react';
import { LinkRequest, CampaignSource } from '../types';
import { Link, Clock, CheckCircle2, Globe, MessageSquare, AlertCircle } from 'lucide-react';

interface StatsGridProps {
  requests: LinkRequest[];
}

export default function StatsGrid({ requests }: StatsGridProps) {
  const total = requests.length;
  const pending = requests.filter(r => r.status === 'Pending').length;
  const completed = requests.filter(r => r.status === 'Completed').length;
  const rejected = requests.filter(r => r.status === 'Rejected').length;

  const sources: CampaignSource[] = ['Meta', 'Google', 'SMS', 'Email', 'TikTok', 'Other'];
  
  const getSourceStats = (source: CampaignSource) => {
    const list = requests.filter(r => r.source === source);
    const count = list.length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return { count, pct };
  };

  return (
    <div className="space-y-6">
      {/* Status Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Link className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Requirements</p>
            <h3 className="text-2xl font-bold font-display text-slate-800 dark:text-white">{total}</h3>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-400">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Creation</p>
            <h3 className="text-2xl font-bold font-display text-slate-800 dark:text-white">{pending}</h3>
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Live & Active</p>
            <h3 className="text-2xl font-bold font-display text-slate-800 dark:text-white">{completed}</h3>
          </div>
        </div>

        {/* Rejected/Needs Review Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Declined Requests</p>
            <h3 className="text-2xl font-bold font-display text-slate-800 dark:text-white">{rejected}</h3>
          </div>
        </div>
      </div>

      {/* Campaign Source Metrics Tracker */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 shadow-xs">
        <h4 className="text-sm font-semibold font-display text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          Link requirement distribution by campaign source
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {sources.map(source => {
            const { count, pct } = getSourceStats(source);
            let colorClass = 'bg-slate-100 dark:bg-slate-800';
            let barColor = 'bg-slate-400 dark:bg-slate-600';
            let textColor = 'text-slate-600 dark:text-slate-350';

            switch (source) {
              case 'Meta':
                colorClass = 'bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30';
                barColor = 'bg-blue-600 dark:bg-blue-500';
                textColor = 'text-blue-700 dark:text-blue-400';
                break;
              case 'Google':
                colorClass = 'bg-red-50/70 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30';
                barColor = 'bg-red-500 dark:bg-red-400';
                textColor = 'text-red-700 dark:text-red-400';
                break;
              case 'SMS':
                colorClass = 'bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30';
                barColor = 'bg-emerald-500 dark:bg-emerald-400';
                textColor = 'text-emerald-700 dark:text-emerald-400';
                break;
              case 'Email':
                colorClass = 'bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30';
                barColor = 'bg-amber-500 dark:bg-amber-400';
                textColor = 'text-amber-700 dark:text-amber-400';
                break;
              case 'TikTok':
                colorClass = 'bg-fuchsia-50/70 dark:bg-fuchsia-950/30 border border-fuchsia-100 dark:border-fuchsia-900/30';
                barColor = 'bg-fuchsia-600 dark:bg-fuchsia-500';
                textColor = 'text-fuchsia-700 dark:text-fuchsia-400';
                break;
              default:
                colorClass = 'bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700';
                barColor = 'bg-slate-500 dark:bg-slate-400';
                textColor = 'text-slate-700 dark:text-slate-300';
                break;
            }

            return (
              <div 
                key={source} 
                className={`${colorClass} rounded-lg p-3.5 flex flex-col justify-between transition-all hover:scale-[1.02]`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-semibold ${textColor}`}>{source}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{count}</span>
                </div>
                <div>
                  <div className="w-full bg-slate-200/50 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 block">{pct}% of total</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
