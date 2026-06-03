import React, { useState, useEffect } from 'react';
import { LinkRequest, UserNotification } from '../types';
import { X, Copy, Check, FileText, Send, Calendar, User, Eye, Sparkles, AlertCircle, RefreshCw, Clock, Ban, AlertTriangle } from 'lucide-react';

interface LinkDetailsModalProps {
  request: LinkRequest | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onFulfill: (requestId: string, status: 'Pending' | 'Completed' | 'Rejected', createdLongLink: string, createdShortLink: string, replyMessage: string) => void;
}

export default function LinkDetailsModal({ request, isOpen, onClose, isAdmin, onFulfill }: LinkDetailsModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  
  // Fulfillment Form States
  const [createdLongLink, setCreatedLongLink] = useState('');
  const [createdShortLink, setCreatedShortLink] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (request) {
      setCreatedLongLink(request.createdLongLink || request.createdLink || '');
      setCreatedShortLink(request.createdShortLink || '');
      setReplyMessage(request.replyMessage || `Hi ${request.requestedBy || 'Team'},\n\nWe have successfully updated your deep tracking details for the "${request.campaignName}" campaign.\n\nLet us know if you have any questions!`);
    } else {
      setCreatedLongLink('');
      setCreatedShortLink('');
      setReplyMessage('');
    }
    setValidationError('');
  }, [request]);

  if (!isOpen || !request) return null;

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = (status: 'Pending' | 'Completed' | 'Rejected') => {
    if (status === 'Completed') {
      if (!createdLongLink.trim()) {
        setValidationError("Please paste the Long Tracking Link.");
        return;
      }
      if (!createdShortLink.trim()) {
        setValidationError("Please paste the Short Tracking Link.");
        return;
      }
    } else if (status === 'Rejected') {
      if (!replyMessage.trim()) {
        setValidationError("Please enter your comment/reason in the comment section for rejecting the request.");
        return;
      }
    }
    
    setValidationError('');
    onFulfill(request.id, status, createdLongLink.trim(), createdShortLink.trim(), replyMessage.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="details-modal-overlay">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Backdrop overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-slate-950/80 backdrop-blur-xs" 
          onClick={onClose}
        />

        {/* Modal panel container */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="relative z-10 inline-block align-bottom bg-white dark:bg-slate-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-slate-100 dark:border-slate-800">
          
          {/* Header */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full">
                  {request.id}
                </span>
                <span className={`text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-sm ${
                  request.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' :
                  request.status === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' :
                  'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                }`}>
                  {request.status}
                </span>
              </div>
              <h3 className="text-lg font-bold font-display text-slate-800 dark:text-white">{request.campaignName}</h3>
            </div>
            <button 
              onClick={onClose}
              id="close-details-btn"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-450 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            
            {/* Req Info & Audit Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Requester Info
                </h4>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Name:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{request.requestedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Department:</span>
                    <span className="font-semibold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-350 rounded text-xs">{request.businessUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Email:</span>
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200">{request.requestedEmail}</span>
                  </div>
                  {request.requesterPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Contact Address:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{request.requesterPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Created At:</span>
                    <span className="text-xs flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                      <Calendar className="h-3 w-3 text-slate-400 dark:text-slate-500" /> {new Date(request.requestedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Campaign Parameters
                </h4>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Launch Urgency:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      request.urgency === 'Critical' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/30' :
                      request.urgency === 'Urgent' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {request.urgency || 'Standard'}
                    </span>
                  </div>
                  {request.launchDate && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Expected Launch:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{request.launchDate}</span>
                    </div>
                  )}
                  {request.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Link Expiry Date:</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{request.expiryDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Source (Channel):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{request.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Medium:</span>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{request.medium}</span>
                  </div>
                  {request.campaignTerm && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Term:</span>
                      <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{request.campaignTerm}</span>
                    </div>
                  )}
                  {request.campaignContent && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Content:</span>
                      <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{request.campaignContent}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Target URL Info */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Landing Page Name / Target Destination URL</span>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex justify-between items-center">
                <code className="text-xs text-indigo-700 dark:text-indigo-350 font-mono break-all pr-4">{request.targetUrl}</code>
                <button 
                  onClick={() => handleCopy(request.targetUrl, setCopiedRaw)}
                  className="p-1.5 text-slate-450 hover:text-indigo-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors shrink-0"
                  title="Copy Target URL"
                >
                  {copiedRaw ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Special Requirements */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Business Unit Requirements & Instructions</span>
              <div className="bg-amber-50/40 dark:bg-amber-950/15 border border-amber-150/50 dark:border-amber-900/30 rounded-lg p-3.5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed list-inside">
                {request.specialRequirements ? request.specialRequirements : "No custom technical instructions specified. Paste standard campaign routing URL parameters."}
              </div>
            </div>

             {/* Completed Link & Reply info */}
            {request.status === 'Completed' && (
              <div className="border-t border-slate-100 dark:border-slate-805 pt-6 space-y-4">
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-500 animate-spin-slow" /> Issued Campaign Tracking Links
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Pasted on {request.resolvedAt ? new Date(request.resolvedAt).toLocaleDateString() : 'recent'}</span>
                  </div>

                  <div className="space-y-3">
                    {/* Long Link */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Long link (Recommended to used for  push notifications, splash screens)</span>
                      <div className="bg-white dark:bg-slate-900 border border-emerald-200/50 dark:border-emerald-900/35 rounded-lg p-3 flex justify-between items-center gap-4 shadow-sm">
                        <a 
                          href={request.createdLongLink || request.createdLink} 
                          target="_blank" 
                          rel="referrer noopener"
                          className="text-xs font-mono text-emerald-600 dark:text-emerald-400 break-all select-all font-semibold underline hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                        >
                          {request.createdLongLink || request.createdLink}
                        </a>
                        <button 
                          onClick={() => handleCopy(request.createdLongLink || request.createdLink || '', setCopiedLink)}
                          className="p-1.5 bg-emerald-600 dark:bg-emerald-700 text-white rounded hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                          title="Copy Long Link"
                        >
                          {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Short Link */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">short link (Recommended for used only of SMS and Social Media Campaigns)</span>
                      <div className="bg-white dark:bg-slate-900 border border-emerald-200/50 dark:border-emerald-900/35 rounded-lg p-3 flex justify-between items-center gap-4 shadow-sm">
                        <a 
                          href={request.createdShortLink || ''} 
                          target="_blank" 
                          rel="referrer noopener"
                          className="text-xs font-mono text-indigo-600 dark:text-indigo-400 break-all select-all font-semibold underline hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                        >
                          {request.createdShortLink || 'Not configured'}
                        </a>
                        <button 
                          onClick={() => handleCopy(request.createdShortLink || '', setCopiedRaw)}
                          className="p-1.5 bg-indigo-600 dark:bg-indigo-700 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                          title="Copy Short Link"
                        >
                          {copiedRaw ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {request.replyMessage && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Creation Team Reply Message:</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 px-3 py-2.5 rounded-lg whitespace-pre-wrap leading-relaxed">
                        {request.replyMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rejected Info section */}
            {request.status === 'Rejected' && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-rose-500" /> Request Rejected
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Rejected on {request.resolvedAt ? new Date(request.resolvedAt).toLocaleDateString() : 'recent'}</span>
                  </div>

                  {request.replyMessage && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Rejection Comments & Feedback:</span>
                      <p className="text-xs text-rose-700 dark:text-rose-300 bg-white/70 dark:bg-slate-900/70 border border-rose-100 dark:border-rose-900/20 px-3 py-2.5 rounded-lg whitespace-pre-wrap leading-relaxed">
                        {request.replyMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Response Section Form (If Viewed in Admin mode or is Pending) */}
            {isAdmin ? (
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                <div className="bg-indigo-50/40 dark:bg-indigo-950/15 rounded-xl border border-indigo-100/50 dark:border-indigo-900/35 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold font-display text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Send className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                      {request.status === 'Pending' ? 'Fulfill Requirements & Reply (Admin)' : 'Update Tracking Links & Status'}
                    </h4>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/50 px-2 py-0.5 rounded-sm uppercase font-semibold">
                      Link Team Workflow
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paste the new tracking links (long and short format) and add any comments. Select one of the action buttons to update the status.
                  </p>



                  <div className="space-y-4">
                    {/* Created Long tracking link */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Long link (Recommended to used for  push notifications, splash screens) *</label>
                      <div className="relative flex items-center w-full">
                        <input 
                          type="url"
                          value={createdLongLink}
                          onChange={(e) => setCreatedLongLink(e.target.value)}
                          placeholder="e.g. https://links.mycompany.com/app/deep?utm_source=meta&utm_medium=cpc..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-xs font-mono text-slate-800 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                        {createdLongLink && (
                          <button
                            type="button"
                            onClick={() => setCreatedLongLink('')}
                            className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 focus:outline-hidden cursor-pointer"
                            title="Clear long link"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Created Short tracking link */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">short link (Recommended for used only of SMS and Social Media Campaigns) *</label>
                      <div className="relative flex items-center w-full">
                        <input 
                          type="url"
                          value={createdShortLink}
                          onChange={(e) => setCreatedShortLink(e.target.value)}
                          placeholder="e.g. https://myco.link/xyz789"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-xs font-mono text-slate-800 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                        {createdShortLink && (
                          <button
                            type="button"
                            onClick={() => setCreatedShortLink('')}
                            className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 focus:outline-hidden cursor-pointer"
                            title="Clear short link"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Comment section */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Comments & Instructions Section</label>
                      <div className="relative flex items-center w-full">
                        <textarea 
                          rows={3}
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Explain redirection rules, fallback guidelines or shortener mapping details..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                        {replyMessage && (
                          <button
                            type="button"
                            onClick={() => setReplyMessage('')}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-hidden cursor-pointer"
                            title="Clear message"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {validationError && (
                    <div className="p-2 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                      {validationError}
                    </div>
                  )}

                  {request.status === 'Pending' && (
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
                      {/* Set Pending Button */}
                      <button
                        type="button"
                        onClick={() => handleAction('Pending')}
                        className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Clock className="h-3.5 w-3.5" /> Set Pending
                      </button>

                      {/* Reject Button */}
                      <button
                        type="button"
                        onClick={() => handleAction('Rejected')}
                        className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-750 dark:hover:bg-rose-600 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Ban className="h-3.5 w-3.5" /> Reject
                      </button>

                      {/* Complete Button */}
                      <button
                        type="button"
                        onClick={() => handleAction('Completed')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4.5 py-2 rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" /> Complete & Fulfill
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              request.status === 'Pending' && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Requirement is awaiting link generation. Switch to <strong className="text-slate-700 dark:text-slate-300">Link Creation Team (Admin Mode)</strong> in the top navigation panel to reply and complete this link request.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
          
          {/* Footer view */}
          <div className="bg-slate-50 dark:bg-slate-900/60 px-6 py-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
              Double check target destination redirection before deploying.
            </span>
            <button 
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Close Archive Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
