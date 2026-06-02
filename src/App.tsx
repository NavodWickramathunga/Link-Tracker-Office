import React, { useState, useEffect, useRef } from 'react';
import { 
  LinkRequest, 
  CampaignSource, 
  BusinessUnit, 
  UserNotification 
} from './types';
import { INITIAL_MOCK_REQUESTS } from './data/mockRequests';
import StatsGrid from './components/StatsGrid';
import LinkDetailsModal from './components/LinkDetailsModal';
import AdminLoginModal from './components/AdminLoginModal';
import NotificationCenter from './components/NotificationCenter';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocFromServer
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase';
import { 
  PlusCircle, 
  X,
  Search, 
  SlidersHorizontal, 
  Download, 
  Upload, 
  User, 
  Mail,
  Database, 
  Send, 
  CheckCircle, 
  HelpCircle, 
  RefreshCw, 
  Layers, 
  Trash2, 
  Check, 
  Clock, 
  AlertTriangle, 
  Info,
  Calendar,
  Share2,
  Lock,
  Eye,
  Settings,
  Sun,
  Moon,
  LogOut,
  Cloud,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Helper to recursively remove undefined values from objects before sending to Firestore
function cleanForFirestore<T extends object>(obj: T): T {
  const clean: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        clean[key] = cleanForFirestore(val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
}

const WORKSPACE_PROFILES = [
  {
    name: 'Sarah Jenkins',
    email: 'sarah.j@mycompany.com',
    role: 'requester' as const,
    bu: 'Marketing' as const,
    avatar: 'SJ',
    color: 'from-indigo-500 to-indigo-600 shadow-indigo-100/50',
    desc: 'Growth Marketer setting up Meta Retargeting Ad links.'
  },
  {
    name: 'Marcus Vance',
    email: 'marcus.v@mycompany.com',
    role: 'requester' as const,
    bu: 'Sales' as const,
    avatar: 'MV',
    color: 'from-emerald-500 to-emerald-600 shadow-emerald-100/50',
    desc: 'Sales Campaigner crafting high-priority SMS checkout boosters.'
  },
  {
    name: 'Helena Rostova',
    email: 'helena.r@mycompany.com',
    role: 'requester' as const,
    bu: 'Retail' as const,
    avatar: 'HR',
    color: 'from-purple-500 to-purple-600 shadow-purple-100/50',
    desc: 'Retail Manager planning shoebox labels and offline QR assets.'
  },
  {
    name: 'Link Ops Admin',
    email: 'ops.admin@mycompany.com',
    role: 'admin' as const,
    bu: 'Product' as const,
    avatar: 'LO',
    color: 'from-amber-500 to-amber-600 shadow-amber-100/50',
    desc: 'Operations Administrator tracking and resolving deep link parameters.'
  }
];

// Anti-duplicate prefix suggestion helper for standard campaign slug generation
const getSuggestedValue = (name: string, source: CampaignSource): string => {
  const sanitized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')
    .trim()
    .replace(/\s+/g, source === 'Meta' || source === 'TikTok' ? '_' : '-');

  if (!sanitized) return '';

  let prefix = '';
  if (source === 'Meta') prefix = 'meta_feed_adset_';
  else if (source === 'Google') prefix = 'google_cpc_';
  else if (source === 'SMS') prefix = 'sms_promo_';
  else if (source === 'Email') prefix = 'email_news_';
  else if (source === 'TikTok') prefix = 'tiktok_creator_';
  else prefix = 'custom_source_';

  // Strict check: if sanitized already starts with the exact prefix
  if (sanitized.startsWith(prefix)) {
    return sanitized;
  }

  // Check if sanitized contains the prefix characters with hyphens
  const prefixNormalized = prefix.replace(/_/g, '-');
  if (sanitized.startsWith(prefixNormalized)) {
    const remainder = sanitized.slice(prefixNormalized.length);
    return prefix + remainder;
  }

  // Check if it already has the prefix without the trailing separator
  const prefixNoTrailing = prefix.slice(0, -1);
  const prefixNoTrailingNorm = prefixNormalized.slice(0, -1);
  
  if (sanitized === prefixNoTrailing || sanitized === prefixNoTrailingNorm) {
    return prefix;
  }

  if (sanitized.startsWith(prefixNoTrailing + '_') || sanitized.startsWith(prefixNoTrailing + '-')) {
    const remainder = sanitized.slice(prefixNoTrailing.length + 1);
    return prefix + remainder;
  }

  return prefix + sanitized;
};

export default function App() {
  // Persistence Loading
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState<boolean>(true);

  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  // Firebase Authentication & Database Realtime Synchronization
  useEffect(() => {
    // 1. Test initial network lookup
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration connectivity.");
        }
      }
    };
    testConnection();

    // 2. Sync requests dynamically from Firestore
    const unsubscribeRequests = onSnapshot(collection(db, 'linkRequests'), (snapshot) => {
      const dbRequests: LinkRequest[] = [];
      snapshot.forEach((snapDoc) => {
        dbRequests.push(snapDoc.data() as LinkRequest);
      });

      if (snapshot.metadata.fromCache && dbRequests.length === 0) {
        return;
      }

      if (dbRequests.length === 0) {
        // If entirely empty in Firestore, seed standard preset records to prevent blank onboarding
        INITIAL_MOCK_REQUESTS.forEach((req) => {
          setDoc(doc(db, 'linkRequests', req.id), req).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `linkRequests/${req.id}`);
          });
        });
        setRequests(INITIAL_MOCK_REQUESTS);
        setIsRequestsLoading(false);
      } else {
        // Sort by requested time newest first
        dbRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        setRequests(dbRequests);
        setIsRequestsLoading(false);
      }
    }, (error) => {
      console.warn("Firestore linkRequests subscription warning or permissions lockout:", error);
      setIsRequestsLoading(false);
    });

    // 4. Sync notifications dynamically from Firestore
    const unsubscribeNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const dbNotifications: UserNotification[] = [];
      snapshot.forEach((snapDoc) => {
        dbNotifications.push(snapDoc.data() as UserNotification);
      });

      if (snapshot.metadata.fromCache && dbNotifications.length === 0) {
        return;
      }

      if (dbNotifications.length === 0) {
        const initialNotifications: UserNotification[] = [
          {
            id: 'notif-1',
            requestId: 'REQ-2026-001',
            campaignName: 'Summer Promo App Onboarding',
            recipientEmail: 'sarah.j@mycompany.com',
            type: 'completed',
            message: 'Your link requirements for "Summer Promo App Onboarding" were processed. Ready to use: https://links.mycompany.com/app/promo-summer',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: 'notif-2',
            requestId: 'REQ-2026-005',
            campaignName: 'TikTok Creator Campaign',
            recipientEmail: 'diana.c@mycompany.com',
            type: 'completed',
            message: 'Influencer onboarding destination link was configured successfully! Direct container deep linking is configured.',
            isRead: true,
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
          }
        ];
        initialNotifications.forEach((notif) => {
          setDoc(doc(db, 'notifications', notif.id), notif).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `notifications/${notif.id}`);
          });
        });
      } else {
        dbNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(dbNotifications);
      }
    }, (error) => {
      console.warn("Firestore notifications subscription warning or credentials lockout:", error);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeNotifications();
    };
  }, []);

  // User Authentication State (Workspace Login)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  // User States (Loaded from Persistent Cache)
  const [currentUserRole, setCurrentUserRole] = useState<'requester' | 'admin'>(() => {
    return (localStorage.getItem('portal_user_role') as any) || 'requester';
  });
  const [currentUserEmail, setCurrentUserEmail] = useState(() => {
    return localStorage.getItem('portal_user_email') || 'sarah.j@mycompany.com';
  });
  const [currentUserName, setCurrentUserName] = useState(() => {
    return localStorage.getItem('portal_user_name') || 'Sarah Jenkins';
  });
  const [currentUserBU, setCurrentUserBU] = useState<BusinessUnit>(() => {
    return (localStorage.getItem('portal_user_bu') as any) || 'Marketing';
  });

  // Filters & Search
  const [filterSource, setFilterSource] = useState<CampaignSource | 'All'>('All');
  const [filterBusinessUnit, setFilterBusinessUnit] = useState<BusinessUnit | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<LinkRequest['status'] | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Persistent 'Sort By' state synchronized with Cloud Storage
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'campaignName'>(() => {
    return (localStorage.getItem('cloud_sort_by_pref') as any) || 'newest';
  });

  // Tracking Cloud Auto-Save Status
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Auto-save Sort By view state to simulated workspace cloud profiles
  useEffect(() => {
    localStorage.setItem('cloud_sort_by_pref', sortBy);
    setIsCloudSyncing(true);
    const saveTimer = setTimeout(() => {
      setIsCloudSyncing(false);
    }, 600);
    return () => clearTimeout(saveTimer);
  }, [sortBy]);

  // Active Selected Item for Details Archive View
  const [selectedRequest, setSelectedRequest] = useState<LinkRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Page Navigation State
  const [activePage, setActivePage] = useState<'tracker' | 'archive'>('tracker');
  
  // Toggle to show all cards in the tracker board
  const [showAllCards, setShowAllCards] = useState(false);

  // Force activePage to tracker if user is requester (as requester view has combined intake & tracker and no archive tab)
  useEffect(() => {
    if (currentUserRole === 'requester' && activePage !== 'tracker') {
      setActivePage('tracker');
    }
  }, [currentUserRole, activePage]);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme_mode') === 'dark';
  });

  // Sync Theme State to document element and localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme_mode', 'light');
    }
  }, [isDarkMode]);

  // Form Fields
  const [campaignName, setCampaignName] = useState('');
  const [isCampaignNameFocused, setIsCampaignNameFocused] = useState(false);
  const [targetUrl, setTargetUrl] = useState('https://');
  const [sourceChannel, setSourceChannel] = useState<CampaignSource>('Meta');
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit>('Marketing');
  const [medium, setMedium] = useState('cpc');
  const [campaignTerm, setCampaignTerm] = useState('');
  const [campaignContent, setCampaignContent] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [launchDate, setLaunchDate] = useState('');
  const [urgency, setUrgency] = useState<'Standard' | 'Urgent' | 'Critical'>('Standard');
  const [emailAddress, setEmailAddress] = useState(() => {
    return localStorage.getItem('portal_user_email') || 'sarah.j@mycompany.com';
  });
  const [requesterName, setRequesterName] = useState(() => {
    return localStorage.getItem('portal_user_name') || 'Sarah Jenkins';
  });

  // Keep it sync'd with login actions if they sign in or switch roles, etc.
  useEffect(() => {
    setRequesterName(currentUserName);
    setEmailAddress(currentUserEmail);
  }, [currentUserName, currentUserEmail]);

  // Computed Validation helper for URL format checks
  const isUrlMalformed = targetUrl.trim().length > 0 && 
    (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'));

  // UI Toast Feed
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('deep_link_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('deep_link_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Sync simulated identity to make user testing extremely fast
  useEffect(() => {
    if (currentUserRole === 'admin') {
      setCurrentUserName('Link Generator Admin');
      setCurrentUserEmail('mktg-ops-admin@mycompany.com');
      setCurrentUserBU('Marketing'); // defaults admin profile
    } else {
      setCurrentUserName('Sarah Jenkins');
      setCurrentUserEmail('sarah.j@mycompany.com');
      setCurrentUserBU('Marketing');
    }
  }, [currentUserRole]);

  // Utility to Trigger Custom UI Toast Notification
  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Submit Requirement Intake Form
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();

    // Small cleanups
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      triggerToast('Target destination must begin with http:// or https://', 'error');
      return;
    }

    const uniqueId = `REQ-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newRequest: LinkRequest = {
      id: uniqueId,
      campaignName: campaignName.trim(),
      targetUrl: targetUrl.trim(),
      source: sourceChannel,
      businessUnit: businessUnit,
      medium: medium.trim() || 'cpc',
      campaignTerm: campaignTerm.trim() || undefined,
      campaignContent: campaignContent.trim() || undefined,
      specialRequirements: specialRequirements.trim() || undefined,
      status: 'Pending',
      requestedBy: requesterName.trim() || currentUserName,
      requestedEmail: emailAddress.trim() || currentUserEmail,
      requestedAt: new Date().toISOString(),
      launchDate: launchDate || undefined,
      urgency: urgency,
    };

    // Save to Firestore collections
    setDoc(doc(db, 'linkRequests', uniqueId), cleanForFirestore(newRequest))
      .then(() => {
        // Create notification entry for standard tracking
        const newNotif: UserNotification = {
          id: `notif-${Math.floor(10000 + Math.random() * 90000)}`,
          requestId: uniqueId,
          campaignName: newRequest.campaignName,
          recipientEmail: emailAddress.trim() || currentUserEmail,
          type: 'info',
          message: `Requirement collected! ${uniqueId} for "${newRequest.campaignName}" is queued with priority ${urgency} for launch on ${launchDate || 'TBD'}.`,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        return setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      })
      .then(() => {
        triggerToast(`Collected requirement ${uniqueId}! Team notified.`, 'success');
      })
      .catch((err) => handleFirestoreError(err, OperationType.CREATE, `linkRequests/${uniqueId}`));

    // Reset Form
    setCampaignName('');
    setTargetUrl('https://');
    setMedium('cpc');
    setCampaignTerm('');
    setCampaignContent('');
    setSpecialRequirements('');
    setLaunchDate('');
    setUrgency('Standard');
    setEmailAddress(currentUserEmail);
    setRequesterName(currentUserName);
  };

  // Reply & Fulfill Deep Link (Admin Feature)
  const handleFulfillRequest = (
    requestId: string,
    status: 'Pending' | 'Completed' | 'Rejected',
    createdLongLink: string,
    createdShortLink: string,
    replyMessage: string
  ) => {
    const matchedReq = requests.find(r => r.id === requestId);
    if (!matchedReq) return;

    // Update Request status and attributes in Firestore
    const updatePayload: any = {
      status,
      createdLink: createdLongLink,
      createdLongLink,
      createdShortLink,
      replyMessage,
      resolvedAt: new Date().toISOString()
    };

    updateDoc(doc(db, 'linkRequests', requestId), cleanForFirestore(updatePayload))
      .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `linkRequests/${requestId}`));

    // Generate dynamic recipient notification
    let notifType: 'info' | 'completed' | 'rejected' | 'reply' = 'reply';
    let notifMsg = `Update on your request for "${matchedReq.campaignName}": Status: ${status}.`;

    if (status === 'Completed') {
      notifType = 'completed';
      notifMsg = `Your links for "${matchedReq.campaignName}" are ready:\nLong Link: ${createdLongLink}\nShort Link: ${createdShortLink}`;
    } else if (status === 'Rejected') {
      notifType = 'rejected';
      notifMsg = `Your request "${matchedReq.campaignName}" was rejected. Comment: ${replyMessage || 'No reason specified'}`;
    } else if (status === 'Pending') {
      notifType = 'reply';
      notifMsg = `Your request "${matchedReq.campaignName}" has been updated and remains in Pending. Note: ${replyMessage}`;
    }

    const newNotif: UserNotification = {
      id: `notif-${Math.floor(10000 + Math.random() * 90000)}`,
      requestId: requestId,
      campaignName: matchedReq.campaignName,
      recipientEmail: matchedReq.requestedEmail,
      type: notifType,
      message: notifMsg,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setDoc(doc(db, 'notifications', newNotif.id), newNotif)
      .catch((err) => handleFirestoreError(err, OperationType.CREATE, `notifications/${newNotif.id}`));

    triggerToast(`Request ${requestId} updated to ${status}! Notification sent to ${matchedReq.requestedEmail}.`, 'success');
  };

  // Decline/Reject Request (Admin Action)
  const handleRejectRequest = (requestId: string) => {
    const matchedReq = requests.find(r => r.id === requestId);
    if (!matchedReq) return;

    updateDoc(doc(db, 'linkRequests', requestId), {
      status: 'Rejected',
      resolvedAt: new Date().toISOString(),
      replyMessage: "Request returned. Requirements require additional parameters. Please specify exact tracking pixels."
    })
    .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `linkRequests/${requestId}`));

    const newNotif: UserNotification = {
      id: `notif-${Math.floor(10000 + Math.random() * 90000)}`,
      requestId: requestId,
      campaignName: matchedReq.campaignName,
      recipientEmail: matchedReq.requestedEmail,
      type: 'rejected',
      message: `Requirement returning: Request ${requestId} returned by creation team. Contact ops.`,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setDoc(doc(db, 'notifications', newNotif.id), newNotif)
      .catch((err) => handleFirestoreError(err, OperationType.CREATE, `notifications/${newNotif.id}`));

    triggerToast(`Declined request ${requestId}.`, 'info');
  };

  // Notification Handling
  const handleMarkRead = (id: string) => {
    updateDoc(doc(db, 'notifications', id), { isRead: true })
      .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`));
  };

  const handleClearAllNotifications = () => {
    notifications.forEach((notif) => {
      deleteDoc(doc(db, 'notifications', notif.id))
        .catch((err) => handleFirestoreError(err, OperationType.DELETE, `notifications/${notif.id}`));
    });
    triggerToast('Cleared notification history logs.', 'info');
  };

  const handleSelectRequestFromNotification = (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (req) {
      setSelectedRequest(req);
      setIsDetailsOpen(true);
    } else {
      triggerToast('Request might have been deleted from history.', 'error');
    }
  };

  // JSON Export (Save requirements for future investigations and reviews)
  const handleExportJSON = () => {
    const exportData = {
      app: "Link Request and Tracker Hub",
      exportedAt: new Date().toISOString(),
      summary: {
        totalCollected: requests.length,
        completed: requests.filter(r => r.status === 'Completed').length,
        pending: requests.filter(r => r.status === 'Pending').length
      },
      requests
    };

    const str = JSON.stringify(exportData, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deep_link_requirements_audit_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('JSON Audit database exported successfully!', 'success');
  };

  // CSV Export (Generate report based on currently filtered and sorted requests)
  const handleExportCSV = () => {
    if (sortedRequests.length === 0) {
      triggerToast('No filtered campaign results to export!', 'error');
      return;
    }

    // Comprehensive column headers
    const headers = [
      'ID',
      'Campaign Name',
      'Target URL',
      'Source Channel',
      'Business Unit',
      'Launch Urgency',
      'Expected Launch Date',
      'Status',
      'Requested By',
      'Requester Email',
      'Contact Address',
      'Requested At',
      'Resolved At',
      'Created Link',
      'Special Redirection Requirements'
    ];

    // Build the formatted data rows
    const rows = sortedRequests.map(req => [
      req.id,
      req.campaignName,
      req.targetUrl,
      req.source,
      req.businessUnit,
      req.urgency || 'Standard',
      req.launchDate || 'TBD',
      req.status,
      req.requestedBy,
      req.requestedEmail,
      req.requesterPhone || 'N/A',
      req.requestedAt,
      req.resolvedAt || 'N/A',
      req.createdLink || 'N/A',
      req.specialRequirements || ''
    ]);

    // Format all cells to escape double-quotes and wrap with quotes 
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(value => {
          const stringified = String(value ?? '').replace(/"/g, '""');
          return `"${stringified}"`;
        }).join(',')
      )
    ].join('\n');

    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deep_link_requirements_report_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      triggerToast(`CSV Report generated for ${sortedRequests.length} filtered items!`, 'success');
    } catch (err) {
      console.error('CSV Export Error:', err);
      triggerToast('Failed to export CSV report. Please try again.', 'error');
    }
  };

  // JSON Import back to restore for review/investigation
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.requests)) {
          // Merge or overwrite ? Let's merge without duplicate IDs
          setRequests(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newItems = parsed.requests.filter((r: LinkRequest) => r.id && !existingIds.has(r.id));
            return [...newItems, ...prev];
          });
          triggerToast(`Successfully loaded ${parsed.requests.length} logs for investigation!`, 'success');
        } else {
          triggerToast('Invalid audit file format. Expected a .requests list schema.', 'error');
        }
      } catch (err) {
        triggerToast('Failed to parse uploaded JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    // clear input
    e.target.value = '';
  };

  // Reset to static mock defaults
  const handleResetData = async () => {
    if (window.confirm("Are you sure you want to reset requirements database to default? This will clear and re-initialize Firestore.")) {
      try {
        for (const req of requests) {
          await deleteDoc(doc(db, 'linkRequests', req.id));
        }
        for (const notif of notifications) {
          await deleteDoc(doc(db, 'notifications', notif.id));
        }
        
        for (const req of INITIAL_MOCK_REQUESTS) {
          await setDoc(doc(db, 'linkRequests', req.id), req);
        }
        triggerToast('Tracker database reset and seeded successfully on Firestore!', 'success');
      } catch (err) {
        console.error("Error resetting data: ", err);
        triggerToast('Reset partially completed or failed. Check permissions.', 'error');
      }
    }
  };

  // Auth Operations
  const handleLogout = () => {
    localStorage.removeItem('portal_user_logged');
    localStorage.removeItem('portal_user_name');
    localStorage.removeItem('portal_user_email');
    localStorage.removeItem('portal_user_role');
    localStorage.removeItem('portal_user_bu');
    setIsLoggedIn(false);
    triggerToast('Logged out of workspace portal safely.', 'info');
  };

  const handleLogin = (name: string, email: string, role: 'requester' | 'admin', bu: BusinessUnit) => {
    localStorage.setItem('portal_user_logged', 'true');
    localStorage.setItem('portal_user_name', name);
    localStorage.setItem('portal_user_email', email);
    localStorage.setItem('portal_user_role', role);
    localStorage.setItem('portal_user_bu', bu);
    
    setCurrentUserName(name);
    setCurrentUserEmail(email);
    setCurrentUserRole(role);
    setCurrentUserBU(bu);
    setIsLoggedIn(true);
    triggerToast(`Welcome back, ${name}! Logged in as ${role === 'admin' ? 'Administrator' : `${bu} Requester`}.`, 'success');
  };

  // Delete Request
  const handleDeleteRequest = (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete link requirement ${requestId} from system audit log?`)) {
      deleteDoc(doc(db, 'linkRequests', requestId))
        .then(() => {
          triggerToast(`Removed ${requestId} from tracker.`, 'info');
        })
        .catch((err) => handleFirestoreError(err, OperationType.DELETE, `linkRequests/${requestId}`));
    }
  };

  // Filtering Logic
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.targetUrl.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource = filterSource === 'All' || req.source === filterSource;
    const matchesBU = filterBusinessUnit === 'All' || req.businessUnit === filterBusinessUnit;
    const matchesStatus = filterStatus === 'All' || req.status === filterStatus;

    return matchesSearch && matchesSource && matchesBU && matchesStatus;
  });

  // Sorting Logic
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
    }
    return a.campaignName.localeCompare(b.campaignName);
  });

  // Dynamically slice or show all cards for the primary board Tracker
  const visibleTrackerRequests = showAllCards ? sortedRequests : sortedRequests.slice(0, 4);

  // Built dynamic UTM format preview on standard client side target URL
  const getUTMPreview = () => {
    if (!campaignName) return 'Enter campaign name for live tracker preview';
    
    const utmParams = [];
    utmParams.push(`utm_source=${sourceChannel.toLowerCase()}`);
    utmParams.push(`utm_medium=${encodeURIComponent(medium.toLowerCase() || 'cpc')}`);
    utmParams.push(`utm_campaign=${encodeURIComponent(campaignName.replace(/\s+/g, '_').toLowerCase())}`);
    if (campaignTerm) utmParams.push(`utm_term=${encodeURIComponent(campaignTerm.toLowerCase())}`);
    if (campaignContent) utmParams.push(`utm_content=${encodeURIComponent(campaignContent.toLowerCase())}`);

    const baseHost = targetUrl && targetUrl !== 'https://' ? targetUrl : 'https://mycompany.com/destination';
    const glue = baseHost.includes('?') ? '&' : '?';
    return `${baseHost}${glue}${utmParams.join('&')}`;
  };



  return (
    <div className={`relative min-h-screen antialiased selection:bg-indigo-100 selection:text-indigo-900 pb-20 transition-all duration-350 ${
      isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-800'
    }`}>
      
      {/* Visual background grid pattern to enhance premium aesthetic */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none z-0" />
      
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative z-10">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white rounded-lg p-2 shadow-xs shadow-indigo-200 dark:shadow-none">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white leading-tight">LinkFlow</h1>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Deep Link Requirements Router</p>
            </div>
          </div>



          {/* Controls & Mode Switching & Notification Center */}
          <div className="flex items-center gap-4">
            
            {/* Identity Switcher Dropdown (To show Requestor and Link Team roles clearly) */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200/50 dark:border-slate-800">
              <button
                onClick={() => {
                  if (currentUserRole !== 'requester') {
                    handleLogin('Sarah Jenkins', 'sarah.j@mycompany.com', 'requester', 'Marketing');
                  }
                }}
                className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                  currentUserRole === 'requester' 
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-indigo-500" />
                  Requester View
                </span>
              </button>
              <button
                onClick={() => {
                  if (currentUserRole !== 'admin') {
                    setIsAdminLoginOpen(true);
                  }
                }}
                className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                  currentUserRole === 'admin' 
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
                id="role-admin-toggle"
              >
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                  Link Ops Admin
                </span>
              </button>
            </div>

            {/* Notification Center */}
            <NotificationCenter 
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onClearAll={handleClearAllNotifications}
              onSelectRequest={handleSelectRequestFromNotification}
            />

            {/* Dark Mode Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all duration-200 cursor-pointer flex items-center justify-center border border-slate-200/40 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700 dark:border-slate-700"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Dark Mode"
              id="theme-toggle-btn"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Small sticky banner to indicate role settings on mobile */}
        <div className="sm:hidden bg-slate-100 dark:bg-slate-900 border-t border-slate-200/40 dark:border-slate-800 py-2 px-4 flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400">Current Role: <span className="font-bold text-slate-700 dark:text-slate-350">{currentUserRole === 'admin' ? 'Link Ops admin' : 'Sarah Jenkins (Mktg)'}</span></span>
          <button 
            onClick={() => {
              if (currentUserRole === 'admin') {
                handleLogin('Sarah Jenkins', 'sarah.j@mycompany.com', 'requester', 'Marketing');
              } else {
                setIsAdminLoginOpen(true);
              }
            }}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline py-0.5"
          >
            Toggle to {currentUserRole === 'admin' ? 'Requester' : 'Admin'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10 space-y-8">
        
        {/* Toast Notification HUD Box */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-18 right-4 md:right-8 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-xl max-w-sm ${
                toastType === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                toastType === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {toastType === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />}
              {toastType === 'error' && <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />}
              {toastType === 'info' && <Info className="h-5 w-5 text-blue-500 shrink-0" />}
              <div className="text-xs font-semibold leading-normal">{toastMessage}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top welcome explanation card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs">
          <div className="space-y-2 md:max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-[10px] font-bold text-indigo-600 font-mono tracking-wider dark:bg-indigo-950/40 dark:text-indigo-300">
                WORKSPACE PORTAL
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-[10px] font-bold text-emerald-600 font-mono tracking-wider dark:bg-emerald-950/40 dark:text-emerald-300">
                ACTIVE tenant
              </span>
            </div>
            <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white">
              Department Deep Link Requirements Portal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ensure proper campaign parameterization in Meta, Google Search, SMS broadcasts, and TikTok affiliate assets. Submit requirements on the left; the creation team issues finalized tracking links with unified universal routes below. Dispatches dynamic notification digests.
            </p>

          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-100/50 dark:border-indigo-900/35 rounded-2xl flex items-center gap-3">
              <div className="relative">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block">Workspace Node</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Live & Synced</span>
              </div>
            </div>
          </div>
        </div>

        {/* Aggregate Stats Visualizer Row */}
        {isRequestsLoading ? (
          <div className="space-y-6">
            {/* Pulsing Status Counters Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4 h-24">
                  <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pulsing Source Distribution Skeletons */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 shadow-xs space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3.5 space-y-3 h-20">
                    <div className="flex justify-between">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-200 dark:bg-slate-705 h-1.5 rounded-full" />
                      <div className="h-2.5 bg-slate-200 dark:bg-slate-705 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <StatsGrid requests={requests} />
        )}

        {/* Dynamic Nav Tabs Row (Shortcut Indicator & Switcher) - combined on one unified page */}
        {currentUserRole === 'admin' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/85 rounded-2xl p-3 shadow-xs font-sans">
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  setActivePage('tracker');
                  const el = document.getElementById('intake-tracker-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer flex-1 sm:flex-initial justify-center duration-150 ${
                  activePage === 'tracker'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <PlusCircle className="h-4 w-4" /> 1. Intake & Active Tracker
              </button>
              <button
                onClick={() => {
                  setActivePage('archive');
                  const el = document.getElementById('archive-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer flex-1 sm:flex-initial justify-center duration-150 ${
                  activePage === 'archive'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
                id="segment-archive-tab-btn"
              >
                <Database className="h-4 w-4" /> 2. Requirements Audit Archive
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-slate-500 dark:text-slate-400 font-sans text-xs">
                Scroll down to explore both modules instantly on this unified dashboard page
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
            </div>
          </div>
        )}

        {/* SECTION 1: Intake & Active Tracker */}
        <div id="intake-tracker-section" className="scroll-mt-24 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT SIDE: Requirements Intake Intake Engine Form - Stacked Vertically */}
            {currentUserRole === 'requester' && (
              <section className="lg:col-span-12 space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm p-6 space-y-5">
                <div className="space-y-1 inline-block pb-2 border-b border-slate-100 dark:border-slate-800/80 w-full">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <PlusCircle className="h-3 w-3" /> Step 1: Requirements Intake
                  </span>
                  <h3 className="text-base font-bold font-display text-slate-800 dark:text-white">Collect Requirements</h3>
                </div>

                {/* simulated logged-in entity indicator */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg p-2.5 border border-indigo-100/30 dark:border-indigo-900/15 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] uppercase">
                      {currentUserName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{currentUserName}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{currentUserBU} BU</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-sm font-semibold">
                    Active Requester
                  </span>
                </div>

                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  
                  {/* Link Request Users */}
                  <div className="space-y-1.5 text-left animate-fade-in">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Link Request Users (Requester Name) *</label>
                    <div className="relative flex items-center w-full">
                      <input 
                        type="text"
                        required
                        value={requesterName}
                        onChange={(e) => setRequesterName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins, John Doe"
                        className="w-full bg-slate-50/50 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-lg pl-3 pr-8 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800 transition-colors placeholder:text-slate-400 font-medium"
                      />
                      {requesterName && (
                        <button
                          type="button"
                          onClick={() => setRequesterName('')}
                          className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 focus:outline-hidden cursor-pointer"
                          title="Clear requester name"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Enter the name(s) of the teammate(s) requesting this tracking link.</p>
                  </div>

                  {/* Campaign Name */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Campaign Name *</label>
                    <div className="relative flex items-center w-full">
                      <input 
                        type="text"
                        required
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        onFocus={() => setIsCampaignNameFocused(true)}
                        onBlur={() => setTimeout(() => setIsCampaignNameFocused(false), 250)}
                        placeholder="e.g. Summer Newsletter Onboarding Promo"
                        className="w-full bg-slate-50/50 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-lg pl-3 pr-8 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800 transition-colors placeholder:text-slate-400 font-medium"
                      />
                      {campaignName && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCampaignName('');
                          }}
                          className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 focus:outline-hidden cursor-pointer"
                          title="Clear campaign name"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {isCampaignNameFocused && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="p-3 bg-indigo-50/95 dark:bg-slate-900 border border-indigo-150 dark:border-slate-800 rounded-xl space-y-2 mt-1.5 shadow-md z-30 relative"
                        >
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="text-[11px] font-bold text-indigo-950 dark:text-indigo-350 uppercase tracking-wider font-mono flex items-center gap-1">
                                {sourceChannel} UTM Standard Guide
                              </h4>
                              {sourceChannel === 'Meta' && (
                                <p className="text-[10px] text-indigo-900/80 dark:text-slate-300 leading-relaxed">
                                  Standard Meta naming: <strong>[placement]_[audience]_[topic]</strong>. Avoid spaces and uppercase letters to prevent parameter truncation in mobile feeds.
                                </p>
                              )}
                              {sourceChannel === 'Google' && (
                                <p className="text-[10px] text-indigo-900/80 dark:text-slate-300 leading-relaxed">
                                  Google Search/PMax standard: <strong>google_cpc_[brand-keyword]_[geo]</strong>. Best with lowercase alphanumeric strings separated by hyphens.
                                </p>
                              )}
                              {sourceChannel === 'SMS' && (
                                <p className="text-[10px] text-indigo-900/80 dark:text-slate-300 leading-relaxed">
                                  SMS limits: keep campaign tags short and flat to conserve character counts in SMS body, e.g. <strong>sms_promo_[slug]</strong>.
                                </p>
                              )}
                              {sourceChannel === 'Email' && (
                                <p className="text-[10px] text-indigo-900/80 dark:text-slate-300 leading-relaxed">
                                  Corporate Email standard: <strong>[bu]_[newsletter-date]_[topic]</strong>. Aids internal segment metrics within newsletters.
                                </p>
                              )}
                              {sourceChannel === 'TikTok' && (
                                <p className="text-[10px] text-indigo-900/80 dark:text-slate-300 leading-relaxed">
                                  TikTok Ads standard: <strong>tt_organic_video_[creator-name]</strong>. Optimal for campaign parameterization in TikTok in-app browser webview channels.
                                </p>
                              )}
                              {sourceChannel === 'Other' && (
                                <p className="text-[10px] text-indigo-900/80 dark:text-slate-300 leading-relaxed">
                                  Custom Campaign convention: Standardize with all lowercase and no special characters, e.g., <strong>offline_qr_nyc_event</strong>.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Dynamic live suggestion translator */}
                          {campaignName.trim() && (
                            <div className="pt-2 border-t border-indigo-150/40 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-mono text-indigo-705 dark:text-indigo-400 font-bold uppercase tracking-wider block">
                                  Suggested UTM Campaign Value:
                                </span>
                                <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-indigo-200 bg-indigo-100/80 dark:bg-indigo-950/50 px-2.5 py-1 rounded-sm border border-indigo-200 dark:border-indigo-900 break-all inline-block select-all shadow-xs">
                                  {getSuggestedValue(campaignName, sourceChannel)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const finalSlug = getSuggestedValue(campaignName, sourceChannel);
                                  setCampaignName(finalSlug);
                                  triggerToast("Sanitized UTM name applied successfully!", "success");
                                }}
                                className="px-2 py-1 bg-indigo-600 dark:bg-indigo-750 hover:bg-indigo-700 dark:hover:bg-indigo-650 text-white rounded font-bold text-[10px] font-mono transition cursor-pointer self-start sm:self-center uppercase shrink-0"
                              >
                                  Apply Safe Slug
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Target URL Destination */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Landing Page Name / Target URL *</label>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Use specific landing page link</span>
                    </div>
                    <div className="relative flex items-center w-full">
                      <input 
                        type="text"
                        required
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        placeholder="https://mycompany.com/landing-page-name"
                        className={`w-full bg-slate-50/50 dark:bg-slate-900 border rounded-lg pl-3 pr-8 py-2 text-xs font-mono focus:outline-hidden focus:ring-1 text-slate-800 dark:text-slate-100 transition-colors ${
                          isUrlMalformed 
                            ? 'border-amber-500 focus:ring-amber-500 bg-amber-50/10 text-amber-900 dark:text-amber-200 focus:bg-white dark:focus:bg-slate-850' 
                            : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-850'
                        }`}
                      />
                      {targetUrl && (
                        <button
                          type="button"
                          onClick={() => setTargetUrl('')}
                          className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 focus:outline-hidden cursor-pointer"
                          title="Clear target URL"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {isUrlMalformed && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1 animate-pulse">
                        ⚠️ Must start with http:// or https:// protocol before submitting
                      </p>
                    )}
                  </div>

                  {/* Source & Business Unit Selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Campaign Source *</label>
                      <select 
                        value={sourceChannel} 
                        onChange={(e) => setSourceChannel(e.target.value as CampaignSource)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-850 cursor-pointer font-semibold"
                      >
                        <option value="Meta" className="dark:bg-slate-900">Meta</option>
                        <option value="Google" className="dark:bg-slate-900">Google</option>
                        <option value="SMS" className="dark:bg-slate-900">SMS</option>
                        <option value="Email" className="dark:bg-slate-900">Email</option>
                        <option value="TikTok" className="dark:bg-slate-900">TikTok</option>
                        <option value="Other" className="dark:bg-slate-900">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Business Unit *</label>
                      <select 
                        value={businessUnit} 
                        onChange={(e) => setBusinessUnit(e.target.value as BusinessUnit)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-850 cursor-pointer font-semibold"
                      >
                        <option value="Marketing" className="dark:bg-slate-900">Marketing</option>
                        <option value="Sales" className="dark:bg-slate-900">Sales</option>
                        <option value="Product" className="dark:bg-slate-900">Product</option>
                        <option value="Retail" className="dark:bg-slate-900">Retail</option>
                        <option value="Finance" className="dark:bg-slate-900">Finance</option>
                        <option value="Customer Support" className="dark:bg-slate-900">Customer Support</option>
                        <option value="HR" className="dark:bg-slate-900">HR</option>
                      </select>
                    </div>
                  </div>

                  {/* UTM Medium Parameter */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Marketing Medium *</label>
                      <div className="group/medium relative">
                        <span className="cursor-help text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-805 dark:hover:text-indigo-300 font-semibold flex items-center gap-0.5">
                          What is this? <HelpCircle className="h-3 w-3 inline" />
                        </span>
                        <div className="absolute right-0 bottom-6 hidden group-hover/medium:block bg-slate-900 dark:bg-slate-850 text-white rounded-lg p-3 text-[11px] font-normal leading-relaxed shadow-xl w-64 z-20 border border-slate-700 dark:border-slate-750">
                          <p className="font-bold text-indigo-300 mb-1">What is a Marketing Medium?</p>
                          The medium refers to the <strong className="text-white">delivery channel</strong> or vehicle used to reach your audience (representing the <code className="text-indigo-200 font-mono">utm_medium</code>).
                          <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-300 font-mono text-[10px]">
                            <li><code className="text-white">cpc</code> (Paid Search ads)</li>
                            <li><code className="text-white">email</code> (Newsletters/bulletins)</li>
                            <li><code className="text-white">sms</code> (Mobile direct updates)</li>
                            <li><code className="text-white">banner</code> (Display ad artwork)</li>
                            <li><code className="text-white">qr-code</code> (Shoebox/packaging scan)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex items-center w-full">
                      <input 
                        type="text"
                        required
                        value={medium}
                        onChange={(e) => setMedium(e.target.value)}
                        placeholder="e.g. cpc, email, sms, banner, qr-code"
                        className="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-3 pr-8 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-850 text-slate-800 dark:text-slate-100 transition-colors font-medium"
                      />
                      {medium && (
                        <button
                          type="button"
                          onClick={() => setMedium('')}
                          className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 focus:outline-hidden cursor-pointer"
                          title="Clear marketing medium"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Specifies how the link is delivered contextually (e.g., email, sms, cpc, qr-code)</p>
                  </div>

                  {/* Advanced UTM options toggler */}
                  <details className="group space-y-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                    <summary className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer outline-none list-none flex justify-between items-center py-1">
                      <span>Optional UTM Attributes (Term, Content)</span>
                      <span className="font-mono text-[9px] text-indigo-500 tracking-wider">Expand Parameters &gt;</span>
                    </summary>
                    <div className="space-y-3 pt-2 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Campaign Term</label>
                        <div className="relative flex items-center w-full">
                          <input 
                            type="text"
                            value={campaignTerm}
                            onChange={(e) => setCampaignTerm(e.target.value)}
                            placeholder="Keywords mapping (e.g. cloud_enterprise)"
                            className="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg pl-3 pr-8 py-2 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-indigo-505"
                          />
                          {campaignTerm && (
                            <button
                              type="button"
                              onClick={() => setCampaignTerm('')}
                              className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 focus:outline-hidden cursor-pointer"
                              title="Clear campaign term"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-660 dark:text-slate-400">Campaign Content</label>
                        <div className="relative flex items-center w-full">
                          <input 
                            type="text"
                            value={campaignContent}
                            onChange={(e) => setCampaignContent(e.target.value)}
                            placeholder="Creative variant identification (e.g. beach_banner_v2)"
                            className="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg pl-3 pr-8 py-2 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-indigo-505"
                          />
                          {campaignContent && (
                            <button
                              type="button"
                              onClick={() => setCampaignContent('')}
                              className="absolute right-2.5 text-slate-400 hover:text-slate-605 dark:text-slate-500 dark:hover:text-slate-350 focus:outline-hidden cursor-pointer"
                              title="Clear campaign content"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </details>

                  {/* Operations & Timeline Details */}
                  <div className="border-t border-slate-105 dark:border-slate-850 pt-3 space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Timeline & Collaboration Details</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Expected Launch Date */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Expected Launch Date *</label>
                        <div className="relative flex items-center w-full">
                          <input 
                            type="date"
                            required
                            value={launchDate}
                            onChange={(e) => setLaunchDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-505 focus:bg-white dark:focus:bg-slate-850 text-slate-800 dark:text-slate-100 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Launch Urgency */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Launch Urgency *</label>
                        <select 
                          value={urgency}
                          onChange={(e) => setUrgency(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2.5 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-505 focus:bg-white dark:focus:bg-slate-850 font-semibold cursor-pointer"
                        >
                          <option value="Standard" className="dark:bg-slate-900">Standard Priority</option>
                          <option value="Urgent" className="dark:bg-slate-900">Urgent Priority</option>
                          <option value="Critical" className="dark:bg-slate-900">Critical Release</option>
                        </select>
                      </div>
                    </div>

                    {/* Email address to type */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address *</label>
                      <div className="relative flex items-center w-full">
                        <input 
                          type="email"
                          required
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          placeholder="e.g. yourname@mycompany.com"
                          className="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-3 pr-8 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-505 focus:bg-white dark:focus:bg-slate-850 text-slate-800 dark:text-slate-100 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
                        />
                        {emailAddress && (
                          <button
                            type="button"
                            onClick={() => setEmailAddress('')}
                            className="absolute right-2.5 text-slate-400 hover:text-slate-605 dark:text-slate-500 dark:hover:text-slate-350 focus:outline-hidden cursor-pointer"
                            title="Clear email address"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Special Technical Instructions */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Special Redirection / Tracking Requirements</label>
                    <div className="relative flex items-center w-full">
                      <textarea 
                        rows={3}
                        value={specialRequirements}
                        onChange={(e) => setSpecialRequirements(e.target.value)}
                        placeholder="Enter details like: Requires dynamic country redirection, QR Code print generation, custom fallback to app stores if app isn't installed..."
                        className="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg pl-3 pr-8 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-505 focus:bg-white dark:focus:bg-slate-850 text-slate-800 dark:text-slate-100 transition-colors"
                      />
                      {specialRequirements && (
                        <button
                          type="button"
                          onClick={() => setSpecialRequirements('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-605 dark:text-slate-500 dark:hover:text-slate-350 focus:outline-hidden cursor-pointer"
                          title="Clear requirements"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    id="submit-requirement-btn"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer duration-200"
                  >
                    <Send className="h-4 w-4" /> Submit Requirement Specification
                  </button>
                </form>
              </div>
            </section>
            )}

            {/* RIGHT SIDE: Dynamic live link tracker structured by source - Stacked Vertically */}
            <section className="lg:col-span-12 space-y-6">

              {/* Source channel visual categorization row */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold font-display text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping" />
                      Deep Link Traffic Tracker Board
                    </h3>
                    <p className="text-xs text-slate-400">
                      Filter cards by source
                      {currentUserRole === 'admin' && (
                        <>
                          {' '}or{' '}
                          <button 
                            onClick={() => {
                              setActivePage('archive');
                              const el = document.getElementById('archive-section');
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold underline cursor-pointer"
                          >
                            view the full archive database &rarr;
                          </button>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(['All', 'Meta', 'Google', 'SMS', 'Email', 'TikTok', 'Other'] as const).map((src) => {
                      const isSelected = filterSource === src;
                      return (
                        <button
                          key={src}
                          onClick={() => setFilterSource(src)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                            isSelected 
                              ? 'bg-slate-900 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {src}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Multi-source cards render */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isRequestsLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-4 animate-pulse h-[150px]">
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5" />
                        </div>
                      </div>
                    ))
                  ) : visibleTrackerRequests.length === 0 ? (
                    <div className="md:col-span-2 text-center py-8 text-slate-400 text-xs">
                      No requests found matching high-level source filter: "{filterSource}".
                    </div>
                  ) : (
                    visibleTrackerRequests.map((req) => (
                      <div 
                        key={req.id} 
                        onClick={() => {
                          setSelectedRequest(req);
                          setIsDetailsOpen(true);
                        }}
                        className="bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/60 rounded-xl p-4 transition-all hover:shadow-xs group cursor-pointer space-y-3.5 relative"
                      >
                        {/* Source badge indicator */}
                        <span className={`absolute top-4 right-4 text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm uppercase ${
                          req.source === 'Meta' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30' :
                          req.source === 'Google' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30' :
                          req.source === 'SMS' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {req.source}
                        </span>

                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">{req.id}</span>
                            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-350 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.1 select-none rounded">
                              {req.businessUnit}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {req.campaignName}
                          </h4>
                        </div>

                        <div className="space-y-1.5 text-left">
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 block uppercase">Original Destination:</span>
                          <code className="text-[10px] font-mono text-slate-600 dark:text-slate-300 break-all line-clamp-1 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 p-1.5 rounded block">
                            {req.targetUrl}
                          </code>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">By: {req.requestedBy}</span>
                          <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border transition-colors ${
                            req.status === 'Completed' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40' 
                              : req.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40'
                              : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40'
                          }`}>
                            {req.status === 'Completed' ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Completed
                              </>
                            ) : req.status === 'Rejected' ? (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Review
                              </>
                            ) : (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {sortedRequests.length > 4 && (
                  <div className="flex justify-center pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                    <button
                      onClick={() => setShowAllCards(!showAllCards)}
                      className="text-xs font-bold px-4 py-2.5 bg-slate-150/40 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 hover:bg-slate-2 w-full text-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200/30 dark:border-slate-700/50 shadow-xs"
                    >
                      {showAllCards ? "Show Recent 4 Requirements" : `Show All ${sortedRequests.length} Requirements →`}
                    </button>
                  </div>
                )}
              </div>

              {/* HIGHLY INTERACTIVE SHORTCUT LINK BANNER AS GREETED BY REQUEST */}
              {currentUserRole === 'admin' && (
                <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg transition-all border border-indigo-500/15">
                  <div className="space-y-1.5 text-center md:text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300 bg-indigo-900/60 px-2.5 py-1 rounded-full border border-indigo-500/25">
                      Access Shortcut Link
                    </span>
                    <h4 className="text-base font-bold font-display text-white mt-1">Ready to search the full Campaign Archive?</h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      Our dynamic tracking router maintains a persistent database backup of all requested configurations. Access full filters below, import/export JSON backups, or audit legacy campaign pipelines.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActivePage('archive');
                      const el = document.getElementById('archive-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="bg-white hover:bg-indigo-50 text-indigo-950 font-bold text-xs py-2.5 px-4 rounded-xl transition-all duration-200 hover:scale-[1.03] cursor-pointer flex items-center gap-1.5 shrink-0 shadow-lg"
                  >
                    <Database className="h-4 w-4 text-indigo-600" /> Go to Campaign Archive Database &rarr;
                  </button>
                </div>
              )}

            </section>
          </div>
        </div>

        {/* SECTION 2: Campaign Requirements Archive Database */}
        {currentUserRole === 'admin' && (
          <div id="archive-section" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden space-y-6 p-6 mt-8 scroll-mt-24 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setActivePage('tracker');
                    const el = document.getElementById('intake-tracker-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/60 px-2.5 py-1.5 rounded-lg transition-all"
                >
                  &larr; Scroll to top & Intake Board
                </button>
              </div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-slate-100 mt-2">Campaign Requirements Archive Database</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Search and audit collected requirements for future investigations and validation logs</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleExportCSV}
                  className="text-white hover:opacity-90 font-bold text-xs py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer bg-emerald-600 border border-emerald-500 shadow-xs"
                  title="Export currently filtered list as a CSV report"
                  id="export-csv-btn"
                >
                  <Download className="h-3.5 w-3.5" /> Export Report (CSV)
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold py-1.5 px-3 cursor-pointer focus:ring-1 focus:ring-indigo-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  >
                    <option value="newest">Newest Requests</option>
                    <option value="oldest">Oldest Requests</option>
                    <option value="campaignName">Campaign (A-Z)</option>
                  </select>
                </div>

                {/* Cloud storage preference auto-save status indicators */}
                <div className="flex items-center gap-1 text-[10px] font-mono bg-slate-50 dark:bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 select-none">
                  {isCloudSyncing ? (
                    <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                      <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Auto-saving to cloud...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold transition-all animate-fade-in">
                      <Cloud className="h-3 w-3 text-emerald-500 shrink-0" /> Synced to cloud storage
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Search and Filters Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search query box */}
              <div className="sm:col-span-6 relative flex items-center w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search by ID, campaign name, requester, target..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-850/60 border border-slate-200/85 dark:border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-505 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium whitespace-nowrap overflow-hidden text-ellipsis"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 focus:outline-hidden cursor-pointer"
                    title="Clear search query"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* BU Filter */}
              <div className="sm:col-span-3 flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-2 text-xs text-slate-700 dark:text-slate-200">
                <span className="text-slate-400 dark:text-slate-500 shrink-0 select-none">BU:</span>
                <select 
                  value={filterBusinessUnit} 
                  onChange={(e) => setFilterBusinessUnit(e.target.value as any)}
                  className="w-full bg-transparent border-0 cursor-pointer text-xs focus:ring-0 outline-none py-2 font-semibold text-slate-700 dark:text-slate-200 dark:bg-slate-800"
                >
                  <option value="All" className="dark:bg-slate-900">All Business Units</option>
                  <option value="Marketing" className="dark:bg-slate-900">Marketing</option>
                  <option value="Sales" className="dark:bg-slate-900">Sales</option>
                  <option value="Product" className="dark:bg-slate-900">Product</option>
                  <option value="Retail" className="dark:bg-slate-900">Retail</option>
                  <option value="Finance" className="dark:bg-slate-900">Finance</option>
                  <option value="Customer Support" className="dark:bg-slate-900">Customer Support</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="sm:col-span-3 flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span className="text-slate-400 dark:text-slate-500 shrink-0 select-none">Status:</span>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full bg-transparent border-0 cursor-pointer text-xs focus:ring-0 outline-none py-2 font-semibold text-slate-700 dark:text-slate-200 dark:bg-slate-800"
                >
                  <option value="All" className="dark:bg-slate-900">All Statuses</option>
                  <option value="Pending" className="dark:bg-slate-900">Pending</option>
                  <option value="Completed" className="dark:bg-slate-900">Completed</option>
                  <option value="Rejected" className="dark:bg-slate-900">Needs Review</option>
                </select>
              </div>
            </div>

            {/* Data Table */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-x-auto bg-slate-50/10 dark:bg-slate-900/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <th className="py-3 px-4">Request Block</th>
                    <th className="py-3 px-4">Business Unit & Requester</th>
                    <th className="py-3 px-4">Channel (Source)</th>
                    <th className="py-3 px-4">Timeline & Urgency</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-sans">
                  {isRequestsLoading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                            <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-14" />
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-16 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : sortedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs text-medium">
                        No collected requirements found matching search/filter specifications in archive.
                      </td>
                    </tr>
                  ) : (
                    sortedRequests.map((req) => (
                      <tr 
                        key={req.id}
                        className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedRequest(req);
                          setIsDetailsOpen(true);
                        }}
                      >
                        {/* ID & Name */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {req.id}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                {new Date(req.requestedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {req.campaignName}
                            </p>
                          </div>
                        </td>

                        {/* Business Unit & Requester */}
                        <td className="py-3.5 px-4 text-xs font-sans">
                          <div className="space-y-1 text-left">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-600 dark:text-slate-400 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-350 rounded text-[10px]">
                                {req.businessUnit}
                              </span>
                              {req.requesterPhone && (
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">{req.requesterPhone}</span>
                              )}
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">{req.requestedBy}</p>
                          </div>
                        </td>

                        {/* Source & Medium */}
                        <td className="py-3.5 px-4 text-xs">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{req.source}</p>
                            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 animate-pulse">medium: {req.medium}</p>
                          </div>
                        </td>

                        {/* Timeline & Urgency */}
                        <td className="py-3.5 px-4 text-xs font-sans">
                          <div className="space-y-1 bg-slate-50/50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100/40 dark:border-slate-800/40 inline-block min-w-[120px]">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase inline-block ${
                              req.urgency === 'Critical' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' :
                              req.urgency === 'Urgent' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30' :
                              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}>
                              {req.urgency || 'Standard'}
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              Launch: <span className="font-bold text-indigo-600 dark:text-indigo-400">{req.launchDate || 'TBD'}</span>
                            </p>
                          </div>
                        </td>

                        {/* Status and Action alerts badge */}
                        <td className="py-3.5 px-4 text-xs">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            req.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              req.status === 'Completed' ? 'bg-emerald-500' :
                              req.status === 'Pending' ? 'bg-amber-500 animate-pulse' :
                              'bg-rose-500'
                            }`} />
                            {req.status === 'Completed' ? 'Completed & Notified' : req.status === 'Pending' ? 'Pending Creation' : 'Needs Review'}
                          </span>
                        </td>

                        {/* Details Inspection button */}
                        <td className="py-3.5 px-4 text-xs text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setIsDetailsOpen(true);
                              }}
                              className="p-1 px-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-semibold transition text-[10px] flex items-center gap-1 cursor-pointer"
                              title="Inspect requirements details"
                            >
                              <Eye className="h-3 w-3" /> View Req
                            </button>
                            
                            {/* delete option explicitly only for cleanup when managing database archives */}
                            <button
                              onClick={(e) => handleDeleteRequest(req.id, e)}
                              className="p-1 text-slate-300 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition cursor-pointer"
                              title="Delete Audit Entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination helper placeholder showing total items collected */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono italic">
              <span>Showing {sortedRequests.length} of {requests.length} logged deep link requirements</span>
              <span>Active local cache storage: {(JSON.stringify(requests).length / 1024).toFixed(2)} KB</span>
            </div>
          </div>
        )}
      </main>

      {/* Dynamic Link Requirements Details and Completion Modal */}
      <LinkDetailsModal 
        request={selectedRequest}
        isOpen={isDetailsOpen}
        onClose={() => {
          setSelectedRequest(null);
          setIsDetailsOpen(false);
        }}
        isAdmin={currentUserRole === 'admin'}
        onFulfill={handleFulfillRequest}
      />

      {/* Admin Operations Login Gate Popup Modal */}
      <AdminLoginModal 
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={(name, email) => {
          handleLogin(name, email, 'admin', 'Product');
          setIsAdminLoginOpen(false);
        }}
      />
    </div>
  );
}
