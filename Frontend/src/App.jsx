import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import Navbar from './components/Navbar';
import MetricsBar from './components/MetricsBar';
import FilterBar from './components/FilterBar';
import KanbanBoard from './components/KanbanBoard';
import TableView from './components/TableView';
import NewApplicationModal from './components/NewApplicationModal';
import ResumeModal from './components/ResumeModal';
import ApplicationDetailDrawer from './components/ApplicationDetailDrawer';
import Toast from './components/Toast';
import AuthView from './components/AuthView';

import './App.css';

// Ensure browser sends HttpOnly JWT cookies on all requests
axios.defaults.withCredentials = true;

const defaultApi = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  ? 'https://job-tracker-ai-2.onrender.com/api'
  : 'http://localhost:5000/api';

const rawApiBase = import.meta.env.VITE_API_BASE || defaultApi;
const API_BASE = rawApiBase.endsWith('/api')
  ? rawApiBase.replace(/\/+$/, '')
  : `${rawApiBase.replace(/\/+$/, '')}/api`;

export default function App() {
  // Authentication & Session (Strictly In-Memory - ZERO localStorage / sessionStorage exposure)
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSignup, setIsSignup] = useState(false);
  const [authError, setAuthError] = useState('');

  // Applications & Loading State
  const [applications, setApplications] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  // View Mode: 'board' | 'table'
  const [viewMode, setViewMode] = useState('board');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Resume State
  const [resumeText, setResumeText] = useState('');
  const [resumeSaved, setResumeSaved] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Modal & Drawer States
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [detailDrawerApp, setDetailDrawerApp] = useState(null);

  // Toast System
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const handleDismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Securely verify session with backend on initial load using HttpOnly cookie
  useEffect(() => {
    // Purge any stale legacy storage so developer tools storage is 100% clean
    try {
      localStorage.removeItem('tracker_user');
      sessionStorage.clear();
    } catch {
      // Ignore in strict privacy sandboxes
    }

    let active = true;
    axios
      .get(`${API_BASE}/auth/me`)
      .then((res) => {
        if (active) {
          setCurrentUser(res.data);
          setResumeText(res.data.resume_text || '');
        }
      })
      .catch(() => {
        if (active) {
          setCurrentUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setCheckingAuth(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch applications for logged-in user
  const fetchApps = useCallback(() => {
    if (!currentUser) return;
    axios
      .get(`${API_BASE}/applications`)
      .then((res) => setApplications(res.data))
      .catch((err) => console.error('Error fetching applications:', err));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    axios
      .get(`${API_BASE}/applications`)
      .then((res) => {
        if (active) setApplications(res.data);
      })
      .catch((err) => console.error('Error fetching applications:', err));

    return () => {
      active = false;
    };
  }, [currentUser]);

  // Auth Handler: Login or Register
  const handleAuth = async (credentials) => {
    setAuthError('');
    const endpoint = isSignup ? '/signup' : '/login';
    try {
      const res = await axios.post(`${API_BASE}${endpoint}`, credentials);
      if (res.data.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      const userData = {
        user_id: res.data.user_id,
        email: res.data.email,
        resume_text: res.data.resume_text || '',
      };
      // Keep strictly in React memory — NO tokens or sensitive data in DevTools Storage
      setCurrentUser(userData);
      setResumeText(userData.resume_text);
      addToast(isSignup ? 'Account created successfully' : 'Signed in to Job-Tracker-AI', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Authentication failed. Please verify credentials.';
      setAuthError(errorMsg);
      addToast(errorMsg, 'error');
      throw err;
    }
  };

  // Secure Logout: Invalidate HttpOnly cookie on backend and reset in-memory state
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/logout`);
    } catch (err) {
      console.warn('Logout API failed:', err);
    }
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setApplications([]);
    setResumeText('');
    setDetailDrawerApp(null);
    addToast('Signed out of account', 'info');
  };

  // Status Change (Supports Drag & Drop and Dropdowns)
  const handleStatusChange = async (appId, newStatus) => {
    const targetApp = applications.find((a) => a.id === appId);
    try {
      await axios.patch(`${API_BASE}/applications/${appId}/status`, { status: newStatus });
      fetchApps();
      if (detailDrawerApp && detailDrawerApp.id === appId) {
        setDetailDrawerApp((prev) => ({ ...prev, status: newStatus }));
      }
      addToast(`Moved ${targetApp ? targetApp.company_name : 'position'} to ${newStatus}`, 'info');
    } catch {
      addToast('Failed to update stage', 'error');
    }
  };

  // Create Application
  const handleCreateApplication = async (formData) => {
    try {
      await axios.post(`${API_BASE}/applications`, formData);
      fetchApps();
      addToast(`Added ${formData.company_name} to pipeline`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create application.', 'error');
    }
  };

  // Update Notes / Application
  const handleUpdateNotes = async (appId, notesText) => {
    try {
      await axios.put(`${API_BASE}/applications/${appId}`, { notes: notesText });
      fetchApps();
      if (detailDrawerApp && detailDrawerApp.id === appId) {
        setDetailDrawerApp((prev) => ({ ...prev, notes: notesText }));
      }
      addToast('Interview notes saved', 'success');
    } catch {
      addToast('Failed to save notes', 'error');
    }
  };

  // Delete Application
  const handleDeleteApplication = async (appId) => {
    const targetApp = applications.find((a) => a.id === appId);
    const company = targetApp ? targetApp.company_name : 'application';
    try {
      await axios.delete(`${API_BASE}/applications/${appId}`);
      if (detailDrawerApp && detailDrawerApp.id === appId) {
        setDetailDrawerApp(null);
      }
      fetchApps();
      addToast(`Deleted ${company}`, 'info');
    } catch {
      addToast('Failed to delete application', 'error');
    }
  };

  // Run ATS Analysis
  const handleAnalyze = async (appId) => {
    setLoadingId(appId);
    try {
      const res = await axios.post(`${API_BASE}/applications/${appId}/analyze`);
      await fetchApps();
      if (detailDrawerApp && detailDrawerApp.id === appId) {
        setDetailDrawerApp((prev) => ({ ...prev, analysis: res.data.analysis }));
      }
      addToast(`Resume fit evaluated: ${res.data.analysis?.match_score || 0}%`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to complete resume match evaluation.', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  // Save Resume Text
  const handleSaveResumeText = async (newText) => {
    try {
      await axios.put(`${API_BASE}/users/${currentUser.user_id}/resume`, { resume_text: newText });
      const updatedUser = { ...currentUser, resume_text: newText };
      setCurrentUser(updatedUser);
      setResumeText(newText);
      setResumeSaved(true);
      setTimeout(() => setResumeSaved(false), 3000);
      addToast('Resume profile updated', 'success');
    } catch {
      addToast('Failed to save resume profile', 'error');
    }
  };

  // Upload Resume PDF
  const handleUploadResumeFile = async (file) => {
    const fileData = new FormData();
    fileData.append('resume_file', file);
    setUploadingResume(true);
    try {
      const res = await axios.post(
        `${API_BASE}/users/${currentUser.user_id}/upload-resume`,
        fileData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const updatedText = res.data.resume_text;
      setResumeText(updatedText);
      const updatedUser = { ...currentUser, resume_text: updatedText };
      setCurrentUser(updatedUser);
      setResumeSaved(true);
      setTimeout(() => setResumeSaved(false), 3000);
      addToast('PDF resume parsed and saved', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Error parsing PDF resume file.', 'error');
    } finally {
      setUploadingResume(false);
    }
  };

  // Export CSV Action
  const handleExportCSV = () => {
    if (applications.length === 0) {
      addToast('No applications to export', 'info');
      return;
    }

    const headers = ['Company', 'Job Title', 'Stage', 'Location', 'Compensation', 'Applied Date', 'Match Score', 'Job URL', 'Notes'];
    const rows = applications.map((a) => {
      const score = a.analysis?.match_score != null ? `${a.analysis.match_score}%` : 'N/A';
      return [
        `"${(a.company_name || '').replace(/"/g, '""')}"`,
        `"${(a.job_title || '').replace(/"/g, '""')}"`,
        `"${(a.status || '').replace(/"/g, '""')}"`,
        `"${(a.location || '').replace(/"/g, '""')}"`,
        `"${(a.salary_range || '').replace(/"/g, '""')}"`,
        `"${(a.applied_date || '').replace(/"/g, '""')}"`,
        `"${score}"`,
        `"${(a.job_url || '').replace(/"/g, '""')}"`,
        `"${(a.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `job_applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded job applications CSV', 'success');
  };

  // Filter applications by search query
  const filteredApplications = applications.filter((app) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (app.company_name && app.company_name.toLowerCase().includes(q)) ||
      (app.job_title && app.job_title.toLowerCase().includes(q)) ||
      (app.location && app.location.toLowerCase().includes(q))
    );
  });

  // Splash Screen while verifying session cookie
  if (checkingAuth) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '100vh', background: 'var(--bg-app)' }}
      >
        <div className="d-flex flex-column align-items-center gap-2">
          <div
            className="spinner-border spinner-border-sm text-secondary"
            role="status"
            style={{ width: '22px', height: '22px' }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Verifying secure session...
          </span>
        </div>
      </div>
    );
  }

  // Unauthenticated View
  if (!currentUser) {
    return (
      <AuthView
        onAuth={handleAuth}
        authError={authError}
        isSignup={isSignup}
        onToggleSignup={() => {
          setIsSignup(!isSignup);
          setAuthError('');
        }}
      />
    );
  }

  // Authenticated Main View
  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: 'var(--bg-app)' }}>
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenResume={() => setIsResumeModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="container-fluid px-2 px-sm-3 px-md-4 py-3 flex-grow-1">
        {/* Ashby-style Metrics Summary */}
        <MetricsBar applications={applications} />

        {/* Filter Bar with Board / Table toggle & Export CSV */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          applications={applications}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenNewModal={() => setIsNewModalOpen(true)}
          onExportCSV={handleExportCSV}
        />

        {/* View rendering: Board (Kanban with Drag & Drop) or Table (Sortable List) */}
        {viewMode === 'board' ? (
          <KanbanBoard
            applications={filteredApplications}
            selectedStatus={selectedStatus}
            onStatusChange={handleStatusChange}
            onAnalyze={handleAnalyze}
            onDelete={handleDeleteApplication}
            onViewDetails={(app) => setDetailDrawerApp(app)}
            loadingId={loadingId}
          />
        ) : (
          <TableView
            applications={
              selectedStatus === 'All'
                ? filteredApplications
                : filteredApplications.filter((a) => a.status === selectedStatus)
            }
            onStatusChange={handleStatusChange}
            onAnalyze={handleAnalyze}
            onDelete={handleDeleteApplication}
            onViewDetails={(app) => setDetailDrawerApp(app)}
            loadingId={loadingId}
          />
        )}
      </main>

      {/* Slide-Over Drawer for Application Details & Rounds Checklist */}
      <ApplicationDetailDrawer
        key={detailDrawerApp ? detailDrawerApp.id : 'none'}
        app={detailDrawerApp}
        isOpen={Boolean(detailDrawerApp)}
        onClose={() => setDetailDrawerApp(null)}
        onUpdateNotes={handleUpdateNotes}
        onStatusChange={handleStatusChange}
      />

      {/* New Application Creation Modal */}
      <NewApplicationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateApplication}
      />

      {/* Resume Management Modal */}
      <ResumeModal
        key={resumeText}
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        initialResumeText={resumeText}
        onSaveText={handleSaveResumeText}
        onUploadFile={handleUploadResumeFile}
        uploading={uploadingResume}
        savedSuccess={resumeSaved}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}