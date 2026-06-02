import React, { useState } from 'react';
import { UserNotification } from '../types';
import { Bell, Check, Trash2, Mail, ExternalLink, Copy, CheckCircle } from 'lucide-react';

interface NotificationCenterProps {
  notifications: UserNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onSelectRequest: (requestId: string) => void;
}

export default function NotificationCenter({ notifications, onMarkRead, onClearAll, onSelectRequest }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleCopyLink = (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative inline-block">
      {/* Bell Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        id="notification-bell-trigger"
        title="View Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold font-mono text-[9px] rounded-full h-4.5 w-4.5 flex items-center justify-center animate-bounce border border-white dark:border-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Overlay click catcher */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Popover Card */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800"
          id="notification-dropdown-panel"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/20 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-250 font-display">Notification Feed</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/50 text-indigo-707 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button 
                onClick={() => {
                  onClearAll();
                  setIsOpen(false);
                }}
                className="text-[10px] font-semibold text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-355 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Clear archive
              </button>
            )}
          </div>

          {/* List of alerts */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 divide-dashed">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <Bell className="h-8 w-8 text-slate-200 dark:text-slate-800 mx-auto" />
                <p className="text-xs">All links are caught up. Ready to generate notifications on creator replies.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                // If message contains a copyable markdown style, parse briefly or just check for link actions
                const extractLink = notif.message.match(/https?:\/\/[^\s]+/);
                const hasUrl = extractLink ? extractLink[0] : null;

                return (
                  <div 
                    key={notif.id}
                    onClick={() => {
                      onMarkRead(notif.id);
                      onSelectRequest(notif.requestId);
                      setIsOpen(false);
                    }}
                    className={`p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer flex gap-3 items-start relative ${
                      !notif.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/15' : ''
                    }`}
                  >
                    {!notif.isRead && (
                      <span className="absolute left-1.5 top-[20px] w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                    
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Mail className="h-2.5 w-2.5" /> For: {notif.recipientEmail}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Immediate action to copy details inside alert bubble */}
                      {hasUrl && (
                        <div className="flex items-center gap-2 pt-1">
                          <button 
                            onClick={(e) => handleCopyLink(e, notif.id, hasUrl)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-mono py-1 px-2.5 rounded flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedId === notif.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700 dark:text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-slate-400" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                          
                          <span className="text-[10px] text-slate-300 dark:text-slate-700">|</span>

                          <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5">
                            Details <ExternalLink className="h-2 w-2" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer stats overview */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/20 rounded-b-xl text-[10px] text-center text-slate-400 dark:text-slate-500 font-mono border-t border-slate-100 dark:border-slate-800">
            Requires email simulation to active workers.
          </div>
        </div>
      )}
    </div>
  );
}
