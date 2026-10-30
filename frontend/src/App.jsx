import React, { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import logoRegular from './assets/logo_regular.png'
import { translations } from './i18n'

const API_BASE = (function() {
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173') {
      return 'http://127.0.0.1:8000';
    }
    if (window.__API_PORT__) {
      return `http://127.0.0.1:${window.__API_PORT__}`;
    }
    return window.location.origin;
  }
  return 'http://127.0.0.1:8000';
})();

const getAppToken = () => {
  if (typeof window !== 'undefined' && window.__APP_SESSION_TOKEN__) {
    return window.__APP_SESSION_TOKEN__;
  }
  return '';
};

const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const token = getAppToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { 'X-App-Token': token } : {})
  };
  return fetch(url, { ...options, headers });
};

const getImageUrl = (endpoint, params = {}) => {
  const token = getAppToken();
  const searchParams = new URLSearchParams(params);
  if (token) searchParams.set('token', token);
  return `${API_BASE}${endpoint}?${searchParams.toString()}`;
};

function App() {
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState(() => {
    try {
      const urlLang = new URLSearchParams(window.location.search).get('lang');
      if (urlLang === 'th' || urlLang === 'en') return urlLang;
      return localStorage.getItem('micmose_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const t = translations[lang] || translations.en;

  useEffect(() => {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    document.body.setAttribute('data-lang', lang);
    try {
      localStorage.setItem('micmose_language', lang);
    } catch {
      // ignore
    }
  }, [lang]);

  const [showAboutModal, setShowAboutModal] = useState(() => {
    try {
      const m = new URLSearchParams(window.location.search).get('modal');
      return m === 'settings' || m === 'about';
    } catch {
      return false;
    }
  });
  const [aboutTab, setAboutTab] = useState(() => {
    try {
      const m = new URLSearchParams(window.location.search).get('modal');
      return m === 'about' ? 'about' : 'settings';
    } catch {
      return 'settings';
    }
  }); // 'settings' | 'about'

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' | 'loupe'
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [analysisData, setAnalysisData] = useState({});

  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  // ---------------- Subject Focus Level 1 to 10 (Default Level 5) ----------------
  const [focusLevel, setFocusLevel] = useState(5);
  const [requireSubjects, setRequireSubjects] = useState(true);
  const [rejectClosedEyes, setRejectClosedEyes] = useState(false);
  const [rejectExposure, setRejectExposure] = useState(true);
  const [rejectMisfires, setRejectMisfires] = useState(true);
  const [rejectDocuments, setRejectDocuments] = useState(true);

  const focusLevelDescriptions = t.focus_levels;

  // ---------------- Cull-to-Target (Optional), Auto Highlights & Auto-Stacking ----------------
  // OFF by default so all deserving 3★ Selects (e.g. 236/640) are preserved!
  const [cullToTargetEnabled, setCullToTargetEnabled] = useState(false);
  const [targetKeepPercent, setTargetKeepPercent] = useState(38); // 10% to 60%
  const [autoHighlightsPercent, setAutoHighlightsPercent] = useState(12);
  const [stackTimeWindowSec, setStackTimeWindowSec] = useState(4);
  const [collapseStacks, setCollapseStacks] = useState(false);
  const [showSubjectBoxes, setShowSubjectBoxes] = useState(true);

  // ---------------- Automatic Detection Filter Tab ----------------
  const [activeFilter, setActiveFilter] = useState('all');

  // ---------------- Software Sync & Export ----------------
  const [exportTier, setExportTier] = useState('3'); // 'highlights' | '3' | '2' | '1'
  const [softwareSync, setSoftwareSync] = useState('xmp'); // 'xmp' | 'both' | 'csv' | 'none'

  // ---------------- Hardware & Learning AI Telemetry ----------------
  const [hwStatus, setHwStatus] = useState({
    device_name: 'Probing GPU / CPU Fallback...',
    backend: 'DirectML + OpenCL GPU',
    opencl_active: true,
    gpu_active: true,
    gpu_util_percent: 0,
    vram_used_mb: 0,
    vram_total_mb: 8151,
    app_version: '1.0.6',
    app_build: 106,
    learning: {
      total_feedback_events: 0,
      focus_bias: 0,
      exposure_bias: 0,
      style_label: 'Baseline Studio Profile'
    }
  });

  // Modal Dialog
  const [dialogMode, setDialogMode] = useState(null); // null | 'open' | 'export'
  const [pathInput, setPathInput] = useState('');
  const [statusMessage, setStatusMessage] = useState(() => {
    try {
      const savedLang = localStorage.getItem('micmose_language') || 'en';
      return (translations[savedLang] || translations.en).status_standby;
    } catch {
      return translations.en.status_standby;
    }
  });

  useEffect(() => {
    if (statusMessage === translations.en.status_standby || statusMessage === translations.th.status_standby) {
      setStatusMessage(t.status_standby);
    }
  }, [lang, t]);

  // ---------------- Auto-Updater & 3-Button Update Dialog ----------------
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateState, setUpdateState] = useState('prompt'); // 'prompt' | 'downloading' | 'installed' | 'error'
  const [updaterProgress, setUpdaterProgress] = useState({
    status: 'idle',
    progress: 0,
    bytes_downloaded: 0,
    total_bytes: 0,
    speed_mbps: 0,
    filename: '',
    error_message: ''
  });
  const [updateError, setUpdateError] = useState('');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [manualCheckMessage, setManualCheckMessage] = useState(null);
  const [skippedVersion, setSkippedVersion] = useState(() => {
    try {
      return localStorage.getItem('micmose_skipped_version');
    } catch {
      return null;
    }
  });
  const pollTimerRef = useRef(null);

  const startPollingProgress = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await apiFetch('/api/updater/progress');
        if (res.ok) {
          const prog = await res.json();
          setUpdaterProgress(prog);
          if (prog.status === 'installing' || prog.launched) {
            setUpdateState('installed');
            clearInterval(pollTimerRef.current);
          } else if (prog.status === 'error') {
            setUpdateError(prog.error_message || 'Download failed');
            setUpdateState('error');
            clearInterval(pollTimerRef.current);
          }
        }
      } catch (err) {
        console.warn('Progress poll error:', err);
      }
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Auto-check for updates on startup (2.5s delay)
  useEffect(() => {
    const autoCheckUpdates = async () => {
      try {
        if (sessionStorage.getItem('micmose_remind_later') === 'true') {
          return;
        }
        const res = await apiFetch('/api/updater/check');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.update_available) {
            const userSkipped = localStorage.getItem('micmose_skipped_version');
            if (userSkipped && userSkipped === data.latest_version) {
              console.log(`Update v${data.latest_version} skipped by user preference.`);
              return;
            }
            setUpdateInfo(data);
            setUpdateState('prompt');
            setShowUpdateModal(true);
          }
        }
      } catch {
        // Silently ignore background check errors
      }
    };

    const timer = setTimeout(autoCheckUpdates, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Button 1: Skip updates (persists in localStorage)
  const handleSkipUpdate = () => {
    if (updateInfo?.latest_version) {
      localStorage.setItem('micmose_skipped_version', updateInfo.latest_version);
      setSkippedVersion(updateInfo.latest_version);
    }
    setShowUpdateModal(false);
    setStatusMessage(`UPDATE v${updateInfo?.latest_version || ''} SKIPPED // WILL NOT REMIND FOR THIS RELEASE`);
  };

  // Button 2: Remind me later (sessionStorage only)
  const handleRemindLater = () => {
    sessionStorage.setItem('micmose_remind_later', 'true');
    setShowUpdateModal(false);
    setStatusMessage('UPDATE NOTIFICATION SNOOZED // WILL REMIND NEXT SESSION');
  };

  // Button 3: Update (pulls latest release and installs)
  const handleStartUpdate = async () => {
    setUpdateState('downloading');
    setUpdateError('');
    try {
      const res = await apiFetch('/api/updater/download_and_install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          download_url: updateInfo?.asset?.download_url || '',
          asset_name: updateInfo?.asset?.name || ''
        })
      });
      if (!res.ok) {
        setUpdateState('error');
        setUpdateError(`Server returned HTTP ${res.status}`);
        return;
      }
      startPollingProgress();
    } catch (err) {
      setUpdateState('error');
      setUpdateError(err.message || 'Failed to start download');
    }
  };

  const handleQuitApp = async () => {
    try {
      await apiFetch('/api/updater/quit_app', { method: 'POST' });
    } catch {
      // ignore
    }
    try {
      window.close();
    } catch {
      // ignore
    }
  };

  const clearSkippedVersion = () => {
    localStorage.removeItem('micmose_skipped_version');
    setSkippedVersion(null);
    setManualCheckMessage({
      type: 'info',
      text: 'Skipped release preference cleared. You will receive notifications for new releases.'
    });
  };

  const handleManualCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setManualCheckMessage(null);
    try {
      const res = await apiFetch('/api/updater/check');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 'success') {
        if (data.update_available) {
          setUpdateInfo(data);
          setUpdateState('prompt');
          setShowUpdateModal(true);
          setManualCheckMessage({
            type: 'success',
            text: `Update found: ${data.release_name || data.latest_version} (${data.asset ? data.asset.name : 'Binary'})`
          });
        } else {
          setManualCheckMessage({
            type: 'info',
            text: `✓ You are running the latest studio version (v${data.current_version} // Build ${data.current_build}).`
          });
        }
      } else {
        setManualCheckMessage({
          type: 'error',
          text: data.message || 'Failed to check updates from GitHub.'
        });
      }
    } catch (err) {
      setManualCheckMessage({
        type: 'error',
        text: `Unable to connect to GitHub update service: ${err.message}`
      });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchHardwareStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/api/hardware_status');
      if (res.ok) {
        const data = await res.json();
        setHwStatus(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchHardwareStatus();
    const timer = setInterval(fetchHardwareStatus, 2200);
    return () => clearInterval(timer);
  }, [fetchHardwareStatus]);

  // Immediate local rating recalculation for instant UI feedback on slider change
  const recomputeLocalRatings = useCallback((rawMap, lvl, reqSubj, rejExp, rejMis, rejDoc, rejEyes) => {
    const sTable = { 1: 8.0, 2: 15.0, 3: 25.0, 4: 38.0, 5: 50.0, 6: 75.0, 7: 100.0, 8: 125.0, 9: 150.0, 10: 200.0 };
    const eTable = { 1: 115.0, 2: 105.0, 3: 95.0, 4: 82.0, 5: 70.0, 6: 62.0, 7: 55.0, 8: 48.0, 9: 42.0, 10: 35.0 };
    const sReq = sTable[lvl] || 50.0;
    const eMargin = eTable[lvl] || 70.0;

    const next = {};
    for (const [path, it] of Object.entries(rawMap)) {
      const s = it.sharpness || 0.0;
      const exp = it.exposure || 127.0;
      const subjs = it.subjects_detected || 0;
      const eye = it.eye_status || 'no_subject';

      const isHopeless = s < 5.0 || Math.abs(exp - 127.0) > 120.0 || (rejMis && it.is_misfire) || (rejDoc && it.is_document) || (rejEyes && eye === 'closed');
      const isSharp = s >= sReq;
      const isWellExp = rejExp ? Math.abs(exp - 127.0) <= eMargin : true;
      const hasSubj = reqSubj ? subjs > 0 : true;
      const eyesOk = rejEyes ? eye !== 'closed' : true;

      let ai_rating = 2;
      let cull_status = 'maybe';
      let color_label = it.duplicate_status === 'creative_variation' ? 'purple' : 'yellow';

      if (isHopeless) {
        ai_rating = 1;
        cull_status = 'reject';
        color_label = 'red';
      } else if (isSharp && isWellExp && hasSubj && eyesOk) {
        ai_rating = 3;
        cull_status = 'select';
        color_label = it.is_highlight ? 'blue' : 'green';
      }

      next[path] = {
        ...it,
        ai_rating,
        cull_status,
        color_label,
        is_blurry: !isSharp
      };
    }
    return next;
  }, []);

  // Run batch post-processing (Auto-Stacking, Duplicate Intent, Optional Cull-to-Target %, Highlights)
  const runBatchPostProcess = useCallback(async (rawMap, overrideTargetEnabled, overrideTargetPct, overrideHighlightPct, overrideTimeWin, overrideFocusLevel) => {
    const items = Object.values(rawMap);
    if (items.length === 0) return;
    try {
      const response = await apiFetch('/api/post_process_batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          time_window_sec: overrideTimeWin ?? stackTimeWindowSec,
          cull_to_target_enabled: overrideTargetEnabled ?? cullToTargetEnabled,
          target_keep_percent: overrideTargetPct ?? targetKeepPercent,
          auto_highlights_percent: overrideHighlightPct ?? autoHighlightsPercent,
          focus_level: overrideFocusLevel ?? focusLevel,
          require_subjects: requireSubjects,
          reject_exposure: rejectExposure,
          reject_misfires: rejectMisfires,
          reject_documents: rejectDocuments,
          reject_closed_eyes: rejectClosedEyes
        })
      });
      const data = await response.json();
      if (data.status === 'success' && data.analysis_map) {
        setAnalysisData(data.analysis_map);
        return data.analysis_map;
      }
      return null;
    } catch (err) {
      console.error('Batch post-process failed:', err);
    }
  }, [stackTimeWindowSec, cullToTargetEnabled, targetKeepPercent, autoHighlightsPercent, focusLevel, requireSubjects, rejectExposure, rejectMisfires, rejectDocuments, rejectClosedEyes]);

  const matchesFilter = useCallback((img) => {
    const info = analysisData[img.path];
    if (collapseStacks && info && !info.is_stack_leader) {
      return false;
    }
    if (activeFilter === 'all') return true;
    if (!info) return false;

    switch (activeFilter) {
      case 'highlights':
        return Boolean(info.is_highlight);
      case '3':
        return info.ai_rating === 3;
      case '2':
        return info.ai_rating === 2;
      case '1':
        return info.ai_rating === 1;
      case 'eyes_open':
        return info.eye_status === 'open';
      case 'closed_eyes':
        return info.eye_status === 'closed';
      case 'cant_tell_eyes':
        return info.eye_status === 'cant_tell';
      case 'blurry':
        return Boolean(info.is_blurry);
      case 'exposure_issues':
        return info.exposure_issue && info.exposure_issue !== 'none';
      case 'misfires':
        return Boolean(info.is_misfire);
      case 'documents':
        return Boolean(info.is_document);
      case 'near_duplicates':
        return info.duplicate_status === 'near_duplicate';
      case 'creative_variations':
        return info.duplicate_status === 'creative_variation';
      default:
        return true;
    }
  }, [analysisData, collapseStacks, activeFilter]);

  const filteredImages = images.filter(matchesFilter);
  const activeImage = filteredImages[selectedImageIndex] || filteredImages[0] || null;
  const activeAnalysis = activeImage ? analysisData[activeImage.path] : null;

  // Counts for every filter badge
  const counts = {
    all: images.length,
    highlights: images.filter(i => analysisData[i.path]?.is_highlight).length,
    selects: images.filter(i => analysisData[i.path]?.ai_rating === 3).length,
    maybes: images.filter(i => analysisData[i.path]?.ai_rating === 2).length,
    rejects: images.filter(i => analysisData[i.path]?.ai_rating === 1).length,
    eyes_open: images.filter(i => analysisData[i.path]?.eye_status === 'open').length,
    closed_eyes: images.filter(i => analysisData[i.path]?.eye_status === 'closed').length,
    cant_tell_eyes: images.filter(i => analysisData[i.path]?.eye_status === 'cant_tell').length,
    blurry: images.filter(i => analysisData[i.path]?.is_blurry).length,
    exposure_issues: images.filter(i => {
      const ex = analysisData[i.path]?.exposure_issue;
      return ex && ex !== 'none';
    }).length,
    misfires: images.filter(i => analysisData[i.path]?.is_misfire).length,
    documents: images.filter(i => analysisData[i.path]?.is_document).length,
    near_duplicates: images.filter(i => analysisData[i.path]?.duplicate_status === 'near_duplicate').length,
    creative_variations: images.filter(i => analysisData[i.path]?.duplicate_status === 'creative_variation').length,
    stacks: new Set(images.map(i => analysisData[i.path]?.stack_id).filter(Boolean)).size
  };

  const analyzeSingleImage = useCallback(async (path, force = false) => {
    if (!path || (!force && analysisData[path])) return;
    const params = new URLSearchParams({
      focus_level: focusLevel,
      require_subjects: requireSubjects,
      reject_exposure: rejectExposure,
      reject_misfires: rejectMisfires,
      reject_documents: rejectDocuments,
      reject_closed_eyes: rejectClosedEyes
    });
    try {
      const response = await apiFetch(`/api/analyze?path=${encodeURIComponent(path)}&${params.toString()}`);
      const data = await response.json();
      setAnalysisData(prev => ({ ...prev, [path]: data }));
      fetchHardwareStatus();
    } catch (err) {
      console.error(`Failed to analyze ${path}`, err);
    }
  }, [analysisData, focusLevel, requireSubjects, rejectExposure, rejectMisfires, rejectDocuments, rejectClosedEyes, fetchHardwareStatus]);

  // Manual Star Rating Override + Learning AI Feedback Loop
  const setManualRating = useCallback(async (path, newRating, e) => {
    if (e) e.stopPropagation();
    if (!path) return;

    const existing = analysisData[path];
    const prevAiRating = existing?.ai_rating || 2;
    const focusScore = existing?.focus_level || 5.0;
    const exposureVal = existing?.exposure || 127;

    const colorMap = { 3: 'green', 2: 'yellow', 1: 'red' };
    const statusMap = { 3: 'select', 2: 'maybe', 1: 'reject' };

    setAnalysisData(prev => ({
      ...prev,
      [path]: {
        ...(prev[path] || {
          path,
          filename: path.split('\\').pop(),
          sharpness: 0,
          focus_level: 5.0,
          eye_focus_score: 5.0,
          eye_status: 'cant_tell',
          exposure: 127,
          subjects_detected: 0,
          subject_boxes: [],
          eye_boxes: [],
          flags: [],
          camera: 'Manual Rating',
          lens: 'Manual Override'
        }),
        ai_rating: newRating,
        cull_status: statusMap[newRating],
        color_label: colorMap[newRating],
        manual_override: true
      }
    }));

    setStatusMessage(`LEARNING AI // RECORDED ${newRating}★ OVERRIDE FOR ${path.split('\\').pop()}`);

    try {
      const res = await apiFetch('/api/learn_feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_rating: prevAiRating,
          user_rating: newRating,
          focus_score: focusScore,
          exposure: exposureVal
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.learning) {
          setHwStatus(prev => ({ ...prev, learning: data.learning }));
        }
      }
    } catch {
      // ignore
    }
  }, [analysisData]);

  const toggleHighlight = useCallback((path, e) => {
    if (e) e.stopPropagation();
    if (!path) return;
    setAnalysisData(prev => {
      const cur = prev[path] || { path, ai_rating: 3, flags: [] };
      const nextHighlight = !cur.is_highlight;
      const cleanFlags = (cur.flags || []).filter(f => f !== 'Highlight');
      return {
        ...prev,
        [path]: {
          ...cur,
          is_highlight: nextHighlight,
          ai_rating: nextHighlight ? 3 : cur.ai_rating,
          cull_status: nextHighlight ? 'highlight' : (cur.ai_rating === 3 ? 'select' : 'maybe'),
          color_label: nextHighlight ? 'blue' : (cur.ai_rating === 3 ? 'green' : 'yellow'),
          flags: nextHighlight ? ['Highlight', ...cleanFlags] : cleanFlags
        }
      };
    });
  }, []);

  const setColorLabel = useCallback((path, color) => {
    if (!path) return;
    setAnalysisData(prev => ({
      ...prev,
      [path]: {
        ...(prev[path] || { path, ai_rating: 2, flags: [] }),
        color_label: color
      }
    }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showUpdateModal) {
        if (e.key === 'Escape' && updateState !== 'downloading') setShowUpdateModal(false);
        return;
      }
      if (showAboutModal) {
        if (e.key === 'Escape') setShowAboutModal(false);
        return;
      }
      if (dialogMode || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        if (e.key === 'Escape') setDialogMode(null);
        return;
      }
      if (filteredImages.length === 0) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (selectedImageIndex < filteredImages.length - 1) {
          const nextIdx = selectedImageIndex + 1;
          setSelectedImageIndex(nextIdx);
          analyzeSingleImage(filteredImages[nextIdx].path);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (selectedImageIndex > 0) {
          const prevIdx = selectedImageIndex - 1;
          setSelectedImageIndex(prevIdx);
          analyzeSingleImage(filteredImages[prevIdx].path);
        }
      } else if (e.key === '1' || e.key === '2' || e.key === '3') {
        if (activeImage) setManualRating(activeImage.path, parseInt(e.key, 10));
      } else if (e.key.toLowerCase() === 'p') {
        if (activeImage) setManualRating(activeImage.path, 3);
      } else if (e.key.toLowerCase() === 'x') {
        if (activeImage) setManualRating(activeImage.path, 1);
      } else if (e.key.toLowerCase() === 'h') {
        if (activeImage) toggleHighlight(activeImage.path);
      } else if (e.key === ' ') {
        e.preventDefault();
        setViewMode(prev => (prev === 'gallery' ? 'loupe' : 'gallery'));
      } else if (e.key === 'Escape' && viewMode === 'loupe') {
        setViewMode('gallery');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUpdateModal, updateState, showAboutModal, dialogMode, filteredImages, selectedImageIndex, activeImage, viewMode, analyzeSingleImage, setManualRating, toggleHighlight]);

  const loadDirectoryFromPath = async (dirPath) => {
    const trimmed = dirPath.trim();
    if (!trimmed) return;

    setDialogMode(null);
    setCurrentPath(trimmed);
    setLoading(true);
    setImages([]);
    setAnalysisData({});
    setProcessProgress(0);
    setProcessedCount(0);
    setActiveFilter('all');
    setSelectedImageIndex(0);
    setStatusMessage(`SCANNING // ${trimmed}`);

    try {
      const response = await apiFetch('/api/scan_directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: trimmed })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setImages(data.images);
        setStatusMessage(`ROLL LOADED // ${data.images.length} PHOTOS READY`);
        if (data.images.length > 0) {
          // Immediately inspect the first photo so Camera, Lens, Shutter, F-Stop, ISO & ACR appear right away!
          setTimeout(() => {
            analyzeSingleImage(data.images[0].path, true);
          }, 80);
        }
      } else {
        setStatusMessage('ERROR // INVALID DIRECTORY PATH');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('ERROR // BACKEND CONNECTION FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseNativeFolder = async (forExport = false) => {
    try {
      setStatusMessage('OPENING WINDOWS FOLDER PICKER...');
      const res = await apiFetch('/api/select_folder');
      const data = await res.json();
      if (data.status === 'success' && data.directory) {
        if (forExport) {
          setPathInput(data.directory);
          setDialogMode('export');
        } else {
          await loadDirectoryFromPath(data.directory);
        }
      } else {
        setStatusMessage('FOLDER SELECTION CANCELLED');
      }
    } catch {
      setPathInput(currentPath || '');
      setDialogMode(forExport ? 'export' : 'open');
    }
  };

  // Lightroom-Style Parallel Batch Culling (processes chunks of 8 images in parallel on GPU + CPU threads)
  const startAutoCull = async () => {
    if (images.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setAnalysisData({});
    setProcessProgress(0);
    setProcessedCount(0);
    setStatusMessage(`PARALLEL GPU CULLING // LEVEL 0${focusLevel} (${hwStatus.device_name})`);

    const chunkSize = 8;
    const collectedMap = {};
    let completed = 0;

    for (let i = 0; i < images.length; i += chunkSize) {
      const chunkPaths = images.slice(i, i + chunkSize).map(img => img.path);
      try {
        const response = await apiFetch('/api/analyze_batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paths: chunkPaths,
            focus_level: focusLevel,
            require_subjects: requireSubjects,
            reject_exposure: rejectExposure,
            reject_misfires: rejectMisfires,
            reject_documents: rejectDocuments,
            reject_closed_eyes: rejectClosedEyes
          })
        });
        const data = await response.json();
        if (data.status === 'success' && data.results) {
          Object.assign(collectedMap, data.results);
          setAnalysisData(prev => ({ ...prev, ...data.results }));
          if (data.hardware) {
            setHwStatus(data.hardware);
          }
        }
      } catch (err) {
        console.error('Batch chunk error:', err);
      }
      completed = Math.min(images.length, i + chunkPaths.length);
      setProcessedCount(completed);
      setProcessProgress(Math.round((completed / images.length) * 100));
    }

    setStatusMessage('POST-PROCESSING // AUTO-STACKING & ACR METADATA LOCK...');
    const finalMap = await runBatchPostProcess(collectedMap);
    const mapToUse = (finalMap && Object.keys(finalMap).length > 0) ? finalMap : collectedMap;

    setIsProcessing(false);
    fetchHardwareStatus();
    const totalSelects = Object.values(mapToUse).filter(x => x.ai_rating === 3).length;
    setStatusMessage(`CULL COMPLETE // ${totalSelects} / ${images.length} SELECTS (3★)`);
  };

  const selectCard = (index, switchToLoupe = false) => {
    setSelectedImageIndex(index);
    if (filteredImages[index]) {
      analyzeSingleImage(filteredImages[index].path);
    }
    if (switchToLoupe) {
      setViewMode('loupe');
    }
  };

  const getExportItems = () => {
    return images
      .filter(img => {
        const info = analysisData[img.path];
        if (!info) return false;
        if (exportTier === 'highlights') return Boolean(info.is_highlight);
        if (exportTier === '3') return info.ai_rating === 3;
        if (exportTier === '2') return info.ai_rating >= 2;
        return info.ai_rating >= 1;
      })
      .map(img => {
        const info = analysisData[img.path];
        return {
          path: img.path,
          rating: info.ai_rating || 3,
          color_label: info.color_label || 'green',
          cull_status: info.cull_status || 'select',
          is_highlight: Boolean(info.is_highlight),
          acr_ev_shift: info.acr?.recommended_ev_shift || 0.0,
          acr_highlights: info.acr?.recommended_highlights || 0,
          acr_shadows: info.acr?.recommended_shadows || 0
        };
      });
  };

  const openExportModal = () => {
    const items = getExportItems();
    if (items.length === 0) {
      setStatusMessage(`EXPORT ABORTED // 0 PHOTOS MATCH SELECTED TIER`);
      return;
    }
    const suffix = exportTier === 'highlights' ? 'Highlights' : `${exportTier}Star_Selects`;
    setPathInput(currentPath ? `${currentPath}\\MicMose_${suffix}` : '');
    setDialogMode('export');
  };

  const confirmExportFiles = async (e) => {
    e.preventDefault();
    const destFolder = pathInput.trim();
    if (!destFolder) return;

    const items = getExportItems();
    setDialogMode(null);
    setStatusMessage(`EXPORTING // WRITING ${items.length} PHOTOS + ACR/LIGHTROOM .XMP...`);

    try {
      const response = await apiFetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          destination: destFolder,
          software_sync: softwareSync,
          copy_photos: true
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setStatusMessage(`ACR & LIGHTROOM SYNC READY // ${data.exported} PHOTOS + ${data.xmp_sidecars} XMP WRITTEN`);
      } else {
        setStatusMessage(`EXPORT WARNING // ${data.errors?.length || 1} ERRORS`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('ERROR // EXPORT FAILED');
    }
  };

  const filledSteps = Math.round((processProgress / 100) * 18);

  const renderRatingBadge = (info) => {
    if (!info) return <span className="cue-rating-tag tier-0">{t.unscored}</span>;
    if (info.is_highlight) return <span className="cue-rating-tag tier-highlight">{t.badge_highlight}</span>;
    if (info.ai_rating === 3) return <span className="cue-rating-tag tier-3">{t.badge_select}</span>;
    if (info.ai_rating === 2) return <span className="cue-rating-tag tier-2">{t.badge_maybe}</span>;
    return <span className="cue-rating-tag tier-1">{t.badge_reject}</span>;
  };

  return (
    <div className="instrument-shell">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      {/* 1. Compact Identity Bar */}
      <header className="identity-bar">
        <div className="brand-group">
          <button
            type="button"
            className="settings-corner-btn"
            onClick={() => { setAboutTab('settings'); setShowAboutModal(true); }}
            title={t.settings_tooltip}
          >
            <span className="settings-icon">⚙</span>
            <span className="settings-label">{t.settings}</span>
          </button>
        </div>
        <div className="system-meta">
          <span className="learning-pill" title="Learning AI adapts to your manual star rating overrides">
            <span>{t.ai_learning_label} {hwStatus.learning?.style_label || t.baseline}</span>
          </span>
          <span className="gpu-pill" title="Automatic GPU OpenCL + DirectML with CPU Fallback">
            <span>{hwStatus.device_name}</span>
            {hwStatus.vram_total_mb > 0 && (
              <span>| GPU {hwStatus.gpu_util_percent}% | {hwStatus.vram_used_mb}MB VRAM</span>
            )}
          </span>
          <span className="status-badge" title={statusMessage}>
            <span className={`status-pip ${isProcessing ? 'active' : ''}`} />
            <span>{statusMessage}</span>
          </span>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => setLang(prev => (prev === 'en' ? 'th' : 'en'))}
            title={lang === 'en' ? 'สลับเป็นภาษาไทย [TH]' : 'Switch to English [EN]'}
            style={{ fontWeight: 700 }}
          >
            {lang === 'en' ? '🇹🇭 ไทย' : '🇺🇸 EN'}
          </button>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? t.theme_chalk : t.theme_dark}
          </button>
        </div>
      </header>

      {/* 2. Left Index Rail: Source, Level 1-10 Subject Focus, Cull-to-Target & Filters */}
      <aside className="index-rail" aria-label="AI Culling criteria and detection filters">
        <div>
          {/* 01. Source Directory */}
          <div className="rail-section">
            <div className="section-head">
              <span>{t.sec_source_roll}</span>
              <span>{t.files_count(images.length)}</span>
            </div>
            <div className="section-body" style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="nr-btn mineral"
                onClick={() => handleBrowseNativeFolder(false)}
                disabled={isProcessing}
              >
                <span>{t.btn_browse}</span>
                <span>[WIN]</span>
              </button>
              <button
                type="button"
                className="nr-btn"
                onClick={() => { setPathInput(currentPath || ''); setDialogMode('open'); }}
                disabled={isProcessing}
              >
                <span>{t.btn_path}</span>
                <span>[...]</span>
              </button>
            </div>
          </div>

          {/* 02. Subject Focus Level 1-10 & Reject Criteria */}
          <div className="rail-section">
            <div className="section-head">
              <span>{t.sec_subject_focus}</span>
              <span>{t.ai_preset}</span>
            </div>
            <div className="section-body">
              <div className="strictness-header">
                <span>{t.subject_focus_level}</span>
                <span className="strictness-lvl-badge">{t.level_of_10(focusLevel)}</span>
              </div>
              <input
                type="range"
                className="strictness-range"
                min="1"
                max="10"
                step="1"
                value={focusLevel}
                disabled={isProcessing}
                onChange={(e) => {
                  const lv = parseInt(e.target.value, 10);
                  setFocusLevel(lv);
                  if (Object.keys(analysisData).length > 0) {
                    setAnalysisData(prev => recomputeLocalRatings(prev, lv, requireSubjects, rejectExposure, rejectMisfires, rejectDocuments, rejectClosedEyes));
                    runBatchPostProcess(analysisData, cullToTargetEnabled, targetKeepPercent, autoHighlightsPercent, stackTimeWindowSec, lv);
                  }
                }}
              />
              <div className="strictness-desc" style={{ marginBottom: '8px', padding: '5px 7px', fontSize: '9.5px' }}>
                {focusLevelDescriptions[focusLevel]}
              </div>

              {/* Optional Cull-to-Target % Cap (OFF by default so all good shots stay 3★) */}
              <div className="strictness-header" style={{ marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={cullToTargetEnabled}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      setCullToTargetEnabled(nextVal);
                      if (Object.keys(analysisData).length > 0) {
                        runBatchPostProcess(analysisData, nextVal, targetKeepPercent, autoHighlightsPercent, stackTimeWindowSec);
                      }
                    }}
                  />
                  <span>{t.cap_target_pct}</span>
                </label>
                <span className="strictness-lvl-badge" style={{ background: cullToTargetEnabled ? 'var(--mineral-blue)' : 'var(--rule-soft)' }}>
                  {cullToTargetEnabled ? t.keep_pct(targetKeepPercent) : t.uncapped}
                </span>
              </div>
              {cullToTargetEnabled && (
                <input
                  type="range"
                  className="strictness-range"
                  min="10"
                  max="60"
                  step="5"
                  value={targetKeepPercent}
                  disabled={isProcessing}
                  onChange={(e) => {
                    const pct = parseInt(e.target.value, 10);
                    setTargetKeepPercent(pct);
                    if (Object.keys(analysisData).length > 0) {
                      runBatchPostProcess(analysisData, cullToTargetEnabled, pct, autoHighlightsPercent, stackTimeWindowSec);
                    }
                  }}
                />
              )}

              <div className="criteria-check-list">
                <label className="subject-toggle-row">
                  <span>{t.require_subjects}</span>
                  <input
                    type="checkbox"
                    checked={requireSubjects}
                    disabled={isProcessing}
                    onChange={(e) => setRequireSubjects(e.target.checked)}
                  />
                </label>
                <label className="subject-toggle-row">
                  <span>{t.strict_closed_eye}</span>
                  <input
                    type="checkbox"
                    checked={rejectClosedEyes}
                    disabled={isProcessing}
                    onChange={(e) => setRejectClosedEyes(e.target.checked)}
                  />
                </label>
                <label className="subject-toggle-row">
                  <span>{t.reject_exposure}</span>
                  <input
                    type="checkbox"
                    checked={rejectExposure}
                    disabled={isProcessing}
                    onChange={(e) => setRejectExposure(e.target.checked)}
                  />
                </label>
                <label className="subject-toggle-row">
                  <span>{t.reject_misfires}</span>
                  <input
                    type="checkbox"
                    checked={rejectMisfires}
                    disabled={isProcessing}
                    onChange={(e) => {
                      setRejectMisfires(e.target.checked);
                      setRejectDocuments(e.target.checked);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 03. Core Culling Tiers */}
          <div className="rail-section">
            <div className="section-head">
              <span>{t.sec_culling_tiers}</span>
              <span>{counts.stacks > 0 ? t.stacks_count(counts.stacks) : t.index_label}</span>
            </div>
            <ul className="tier-list" role="list">
              <li className="tier-item">
                <button
                  type="button"
                  className="tier-btn"
                  aria-current={activeFilter === 'all' ? 'true' : 'false'}
                  onClick={() => { setActiveFilter('all'); setSelectedImageIndex(0); }}
                >
                  <span className="tier-code">ALL</span>
                  <span className="tier-label">{t.tier_all}</span>
                  <span className="tier-count">{counts.all}</span>
                </button>
              </li>
              <li className="tier-item">
                <button
                  type="button"
                  className="tier-btn"
                  aria-current={activeFilter === '3' ? 'true' : 'false'}
                  onClick={() => { setActiveFilter('3'); setSelectedImageIndex(0); }}
                >
                  <span className="tier-code">GRN</span>
                  <span className="tier-label">{t.tier_selects}</span>
                  <span className="tier-count">{counts.selects}</span>
                </button>
              </li>
              <li className="tier-item">
                <button
                  type="button"
                  className="tier-btn"
                  aria-current={activeFilter === 'highlights' ? 'true' : 'false'}
                  onClick={() => { setActiveFilter('highlights'); setSelectedImageIndex(0); }}
                >
                  <span className="tier-code">BLU</span>
                  <span className="tier-label">{t.tier_highlights}</span>
                  <span className="tier-count">{counts.highlights}</span>
                </button>
              </li>
              <li className="tier-item">
                <button
                  type="button"
                  className="tier-btn"
                  aria-current={activeFilter === '2' ? 'true' : 'false'}
                  onClick={() => { setActiveFilter('2'); setSelectedImageIndex(0); }}
                >
                  <span className="tier-code">YLW</span>
                  <span className="tier-label">{t.tier_maybes}</span>
                  <span className="tier-count">{counts.maybes}</span>
                </button>
              </li>
              <li className="tier-item">
                <button
                  type="button"
                  className="tier-btn"
                  aria-current={activeFilter === '1' ? 'true' : 'false'}
                  onClick={() => { setActiveFilter('1'); setSelectedImageIndex(0); }}
                >
                  <span className="tier-code">RED</span>
                  <span className="tier-label">{t.tier_rejects}</span>
                  <span className="tier-count">{counts.rejects}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* 04. Automatic Detection Filters */}
          <div className="rail-section">
            <div className="section-head">
              <span>{t.sec_auto_filters}</span>
              <span>{t.flags_label}</span>
            </div>
            <ul className="tier-list" role="list">
              <li className="tier-item">
                <button
                  type="button"
                  className="tier-btn"
                  aria-current={activeFilter === 'eyes_open' ? 'true' : 'false'}
                  onClick={() => { setActiveFilter('eyes_open'); setSelectedImageIndex(0); }}
                >
                  <span className="tier-code">EYE+</span>
                  <span className="tier-label">{t.filter_eyes_open}</span>
                  <span className="tier-count">{counts.eyes_open}</span>
                </button>
              </li>
              <li className="tier-item">
                <button
                  type="button"
                  className="tier-btn"
                  aria-current={activeFilter === 'closed_eyes' ? 'true' : 'false'}
                  onClick={() => { setActiveFilter('closed_eyes'); setSelectedImageIndex(0); }}
                >
                  <span className="tier-code">EYE-</span>
                  <span className="tier-label">{t.filter_closed_eyes}</span>
                  <span className="tier-count">{counts.closed_eyes}</span>
                </button>
              </li>
              <li className="tier-item">
                <button
                  type="button"
                  className="tier-btn"
                  aria-current={activeFilter === 'blurry' ? 'true' : 'false'}
                  onClick={() => { setActiveFilter('blurry'); setSelectedImageIndex(0); }}
                >
                  <span className="tier-code">BLUR</span>
                  <span className="tier-label">{t.filter_blurry}</span>
                  <span className="tier-count">{counts.blurry}</span>
                </button>
              </li>
              <li className="tier-item">
                <button
                  type="button"
                  className="tier-btn"
                  aria-current={activeFilter === 'near_duplicates' ? 'true' : 'false'}
                  onClick={() => { setActiveFilter('near_duplicates'); setSelectedImageIndex(0); }}
                >
                  <span className="tier-code">DUP</span>
                  <span className="tier-label">{t.filter_near_duplicates}</span>
                  <span className="tier-count">{counts.near_duplicates}</span>
                </button>
              </li>
              <li className="tier-item">
                <button
                  type="button"
                  className="tier-btn"
                  aria-current={activeFilter === 'creative_variations' ? 'true' : 'false'}
                  onClick={() => { setActiveFilter('creative_variations'); setSelectedImageIndex(0); }}
                >
                  <span className="tier-code">VAR</span>
                  <span className="tier-label">{t.filter_creative_variations}</span>
                  <span className="tier-count">{counts.creative_variations}</span>
                </button>
              </li>
              <li className="tier-item">
                <button
                  type="button"
                  className="tier-btn"
                  aria-current={activeFilter === 'exposure_issues' ? 'true' : 'false'}
                  onClick={() => { setActiveFilter('exposure_issues'); setSelectedImageIndex(0); }}
                >
                  <span className="tier-code">EXP</span>
                  <span className="tier-label">{t.filter_exposure_issues}</span>
                  <span className="tier-count">{counts.exposure_issues}</span>
                </button>
              </li>
              <li className="tier-item">
                <button
                  type="button"
                  className="tier-btn"
                  aria-current={activeFilter === 'misfires' ? 'true' : 'false'}
                  onClick={() => { setActiveFilter('misfires'); setSelectedImageIndex(0); }}
                >
                  <span className="tier-code">MIS</span>
                  <span className="tier-label">{t.filter_misfires}</span>
                  <span className="tier-count">{counts.misfires + counts.documents}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Execute Automated AI Culling Button */}
        <div className="section-body" style={{ borderTop: '1px solid var(--rule-hard)' }}>
          <button
            type="button"
            className="nr-btn signal"
            onClick={startAutoCull}
            disabled={isProcessing || images.length === 0}
          >
            <span>{isProcessing ? t.btn_running_parallel(processProgress) : t.btn_run_parallel}</span>
            <span>[GPU]</span>
          </button>
        </div>
      </aside>

      {/* 3. Dominant Center Score & Contact Sheet Stage */}
      <main className="center-stage">
        <div className="stage-topbar">
          <span>{t.roll_label} {currentPath || t.no_folder_loaded}</span>
          <div className="topbar-controls-right">
            <button
              type="button"
              className="stack-toggle-pill"
              aria-pressed={collapseStacks ? 'true' : 'false'}
              onClick={() => { setCollapseStacks(prev => !prev); setSelectedImageIndex(0); }}
              title={t.collapse_stacks_tooltip}
            >
              {collapseStacks ? t.stacks_collapsed : t.stacks_expanded}
            </button>
            <div className="view-mode-switch" role="group" aria-label="View mode">
              <button
                type="button"
                className="mode-tab"
                aria-pressed={viewMode === 'gallery' ? 'true' : 'false'}
                onClick={() => setViewMode('gallery')}
              >
                {t.mode_grid(filteredImages.length)}
              </button>
              <button
                type="button"
                className="mode-tab"
                aria-pressed={viewMode === 'loupe' ? 'true' : 'false'}
                disabled={filteredImages.length === 0}
                onClick={() => {
                  if (activeImage) analyzeSingleImage(activeImage.path);
                  setViewMode('loupe');
                }}
              >
                {t.mode_loupe}
              </button>
            </div>
          </div>
        </div>

        {/* Stage Title Band with Quick Exposure Bar */}
        <section className="stage-title-band">
          <div className="stage-zone-line">
            <span>
              {activeImage
                ? `FRAME ${String(selectedImageIndex + 1).padStart(3, '0')}/${String(filteredImages.length).padStart(3, '0')} // ${activeAnalysis?.camera || t.scanning_exif} // ${activeAnalysis?.lens || ''}`
                : t.frame_standby}
            </span>
            <span>
              {activeAnalysis
                ? `${activeAnalysis.shutter_speed}  |  ${activeAnalysis.f_stop}  |  ${activeAnalysis.iso}  |  ${activeAnalysis.focal_length}  |  ${activeAnalysis.capture_time}`
                : t.select_photo_hint}
            </span>
          </div>
          <h1 className="stage-main-heading">
            {activeImage ? activeImage.filename : 'MicMose Photo Culler Pro'}
          </h1>
        </section>

        {/* 4-Column Telemetry Bar (Subject Focus Level 1-10, Exposure Parameters, ACR Dynamic Range, Stack/Eyes) */}
        <section className="telemetry-trio" aria-label="Selected frame AI telemetry">
          <div className="telemetry-cell">
            <div className="telemetry-head">
              <span>{t.telemetry_focus_title}</span>
              <span>{t.tele_focus_req(focusLevel)}</span>
            </div>
            <div className="telemetry-val">
              {activeAnalysis ? t.tele_focus_val(activeAnalysis.focus_level) : 'Level --'}
            </div>
            <div className="telemetry-sub">
              {activeAnalysis ? t.tele_raw_laplacian(activeAnalysis.sharpness) : t.tele_gpu_conv}
            </div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-head">
              <span>{t.telemetry_exif_title}</span>
              <span>{t.exif_tag}</span>
            </div>
            <div className="telemetry-val">
              {activeAnalysis
                ? `${activeAnalysis.shutter_speed} · ${activeAnalysis.f_stop} · ${activeAnalysis.iso}`
                : '-- · -- · --'}
            </div>
            <div className="telemetry-sub">
              {activeAnalysis ? t.tele_taken(activeAnalysis.capture_time) : t.tele_capture_timestamp}
            </div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-head">
              <span>{t.telemetry_acr_title}</span>
              <span>ACR 16.0</span>
            </div>
            <div className="telemetry-val">
              {activeAnalysis?.acr
                ? `${activeAnalysis.acr.dynamic_range_stops || '--'} Stops (${activeAnalysis.acr.exposure_2012 || '0 EV'})`
                : 'ACR --'}
            </div>
            <div className="telemetry-sub">
              {activeAnalysis?.acr
                ? `HI: ${activeAnalysis.acr.highlights_2012} | SHD: ${activeAnalysis.acr.shadows_2012}`
                : t.tele_acr_module}
            </div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-head">
              <span>{t.telemetry_eyes_title}</span>
              <span>INTENT</span>
            </div>
            <div className="telemetry-val">
              {activeAnalysis
                ? `${activeAnalysis.eye_status === 'open' ? t.tele_eyes_open : activeAnalysis.eye_status === 'closed' ? t.tele_closed_eyes : activeAnalysis.subjects_detected > 0 ? t.tele_subj_locked : t.tele_scene} · S#${activeAnalysis.stack_id}`
                : 'Stack --'}
            </div>
            <div className="telemetry-sub">
              {activeAnalysis ? t.tele_artist(activeAnalysis.artist) : t.tele_author_tag}
            </div>
          </div>
        </section>

        {/* Main Viewport: Contact Sheet Grid or Loupe Specimen */}
        {viewMode === 'gallery' ? (
          filteredImages.length > 0 ? (
            <div className="contact-sheet-grid">
              {filteredImages.map((img, idx) => {
                const info = analysisData[img.path];
                const isSelected = idx === selectedImageIndex;
                const curRating = info?.ai_rating || 0;
                const colorDot = info?.color_label || 'yellow';
                return (
                  <article
                    key={img.id}
                    className="cue-card"
                    data-selected={isSelected ? 'true' : 'false'}
                    onClick={() => selectCard(idx, false)}
                    onDoubleClick={() => selectCard(idx, true)}
                  >
                    <div className="cue-card-head">
                      <span>
                        <span className={`color-dot ${colorDot}`} title={`Color Label: ${colorDot}`} />
                        #{String(idx + 1).padStart(3, '0')} {info ? `· L${info.focus_level}` : ''}
                      </span>
                      {renderRatingBadge(info)}
                    </div>
                    <div className="cue-thumb-wrap">
                      <img
                        src={getImageUrl('/api/thumbnail', { path: img.path })}
                        alt={img.filename}
                        loading="lazy"
                      />
                      {info && info.stack_size > 1 && (
                        <span className="stack-badge-overlay">
                          {t.stack_badge(info.stack_id, info.is_stack_leader, info.stack_size)}
                        </span>
                      )}
                      {info?.flags?.length > 0 && (
                        <div className="flag-pills-overlay">
                          {info.flags.slice(0, 2).map((fl, fi) => (
                            <span key={fi} className="mini-flag-pill">{fl}</span>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        className="card-loupe-overlay-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectCard(idx, true);
                        }}
                      >
                        {t.card_loupe}
                      </button>
                    </div>
                    <div className="cue-card-foot">
                      <span className="cue-filename" title={img.filename}>{img.filename}</span>
                      <div className="manual-star-group" title="Click to override rating (Trains Learning AI)">
                        <button
                          type="button"
                          className={`mini-star-btn ${info?.is_highlight ? 'active-3' : ''}`}
                          onClick={(e) => toggleHighlight(img.path, e)}
                          title="Toggle Highlight"
                        >
                          H
                        </button>
                        {[1, 2, 3].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`mini-star-btn ${curRating === star ? `active-${star}` : ''}`}
                            onClick={(e) => setManualRating(img.path, star, e)}
                          >
                            {star}★
                          </button>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-cue-sheet">
              <h3>{loading ? t.empty_scanning : t.empty_no_photos}</h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {images.length === 0 ? t.empty_hint_browse : t.empty_hint_run}
              </p>
            </div>
          )
        ) : (
          <div className="loupe-specimen-stage">
            {activeImage && (
              <>
                <div className="loupe-canvas">
                  <button
                    type="button"
                    className="loupe-step-btn prev"
                    onClick={() => selectCard(Math.max(0, selectedImageIndex - 1), true)}
                    disabled={selectedImageIndex <= 0}
                  >
                    {t.loupe_prev}
                  </button>

                  <div className="loupe-img-wrapper">
                    <img
                      src={getImageUrl('/api/image', { path: activeImage.path })}
                      alt={activeImage.filename}
                    />
                    {showSubjectBoxes && activeAnalysis?.subject_boxes?.map((b, i) => (
                      <div
                        key={`subj-${i}`}
                        className="yolo-subject-box"
                        style={{
                          left: `${b.x}%`,
                          top: `${b.y}%`,
                          width: `${b.w}%`,
                          height: `${b.h}%`
                        }}
                      >
                        <span className="yolo-box-label">
                          SUBJECT #{i + 1} // FOCUS LVL {activeAnalysis.focus_level}
                        </span>
                      </div>
                    ))}
                    {showSubjectBoxes && activeAnalysis?.eye_boxes?.map((eb, idx) => (
                      <div
                        key={`eye-${idx}`}
                        className="yolo-eye-box"
                        style={{
                          left: `${eb.x}%`,
                          top: `${eb.y}%`,
                          width: `${eb.w}%`,
                          height: `${eb.h}%`
                        }}
                      >
                        <span className="yolo-box-label" style={{ background: '#0284c7' }}>
                          EYES: {(activeAnalysis.eye_status || 'SCAN').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="loupe-step-btn next"
                    onClick={() => selectCard(Math.min(filteredImages.length - 1, selectedImageIndex + 1), true)}
                    disabled={selectedImageIndex >= filteredImages.length - 1}
                  >
                    {t.loupe_next}
                  </button>
                </div>

                <div className="loupe-strip-bar">
                  <span>{activeImage.filename}</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginRight: '8px' }}>
                      <input
                        type="checkbox"
                        checked={showSubjectBoxes}
                        onChange={(e) => setShowSubjectBoxes(e.target.checked)}
                      />
                      <span>{t.roi_boxes}</span>
                    </label>
                    <button
                      type="button"
                      className={`override-btn ${activeAnalysis?.is_highlight ? 'active-3' : ''}`}
                      style={{ padding: '4px 8px' }}
                      onClick={() => toggleHighlight(activeImage.path)}
                    >
                      {t.loupe_highlight}
                    </button>
                    {[3, 2, 1].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`override-btn ${activeAnalysis?.ai_rating === star ? `active-${star}` : ''}`}
                        style={{ padding: '4px 8px' }}
                        onClick={() => setManualRating(activeImage.path, star)}
                      >
                        {star === 3 ? t.loupe_select : star === 2 ? t.loupe_maybe : t.loupe_reject}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="nr-btn"
                    style={{ width: 'auto', padding: '4px 10px' }}
                    onClick={() => setViewMode('gallery')}
                  >
                    <span>{t.loupe_grid_return}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* 4. Right Rail: Full Picture Info (Camera, Lens, Shutter, F-Stop, ISO, Time, Author/Artist) + ACR Module + Export */}
      <aside className="dossier-rail" aria-label="Picture Info, Adobe Camera Raw and Export">
        <div>
          <div className="section-head">
            <span>{t.sec_picture_info}</span>
            <span>{t.metadata_label}</span>
          </div>

          {/* Camera & Lens */}
          <div className="dossier-block">
            <div className="dossier-role-row">
              <span>{t.camera_lens}</span>
              <span className="dossier-lock-tag">{t.optics_label}</span>
            </div>
            <div className="dossier-value">
              {activeAnalysis?.camera || t.click_any_photo}
            </div>
            <div className="dossier-sub" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {activeAnalysis?.lens || t.unknown_lens}
            </div>
            <div className="dossier-sub">
              {activeAnalysis?.dimensions || '--'} · {activeAnalysis?.color_space || 'sRGB'}
            </div>
          </div>

          {/* Exposure Triad: Shutter, F-Stop, ISO, Focal Length & Time Taken */}
          <div className="dossier-block">
            <div className="dossier-role-row">
              <span>{t.exposure_time}</span>
              <span className="dossier-lock-tag">{t.exif_tag}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '4px' }}>
              <div><strong>{t.lbl_shutter}</strong> {activeAnalysis?.shutter_speed || 'N/A'}</div>
              <div><strong>{t.lbl_fstop}</strong> {activeAnalysis?.f_stop || 'N/A'}</div>
              <div><strong>{t.lbl_iso}</strong> {activeAnalysis?.iso || 'N/A'}</div>
              <div><strong>{t.lbl_focal}</strong> {activeAnalysis?.focal_length || 'N/A'}</div>
            </div>
            <div className="dossier-sub" style={{ marginTop: '5px', color: 'var(--text-primary)' }}>
              <strong>{t.lbl_taken}</strong> {activeAnalysis?.capture_time || 'Unknown Time'}
            </div>
          </div>

          {/* Author & Artist Name */}
          <div className="dossier-block">
            <div className="dossier-role-row">
              <span>{t.author_artist}</span>
              <span className="dossier-lock-tag">{t.credits_label}</span>
            </div>
            <div className="dossier-sub" style={{ color: 'var(--text-primary)' }}>
              <strong>{t.lbl_artist}</strong> {activeAnalysis?.artist || 'Unknown Artist'}
            </div>
            <div className="dossier-sub" style={{ color: 'var(--text-primary)' }}>
              <strong>{t.lbl_author}</strong> {activeAnalysis?.author || 'Unknown Author'}
            </div>
            {activeAnalysis?.copyright && (
              <div className="dossier-sub">
                <strong>©:</strong> {activeAnalysis.copyright}
              </div>
            )}
          </div>

          {/* Adobe Camera Raw (ACR) Processing Module */}
          <div className="dossier-block">
            <div className="dossier-role-row">
              <span>{t.acr_box_title}</span>
              <span className="dossier-lock-tag">CRS 16.0</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
              <div><strong>EXP:</strong> {activeAnalysis?.acr?.exposure_2012 || '0.00 EV'}</div>
              <div><strong>DR:</strong> {activeAnalysis?.acr?.dynamic_range_stops || '--'} Stops</div>
              <div><strong>HIGHLIGHTS:</strong> {activeAnalysis?.acr?.highlights_2012 || '0'}</div>
              <div><strong>SHADOWS:</strong> {activeAnalysis?.acr?.shadows_2012 || '0'}</div>
              <div><strong>CLIP HI:</strong> {activeAnalysis?.acr?.highlight_clipping_pct ?? 0}%</div>
              <div><strong>CLIP SHD:</strong> {activeAnalysis?.acr?.shadow_clipping_pct ?? 0}%</div>
            </div>
            <div className="dossier-sub">
              WB: {activeAnalysis?.acr?.white_balance || 'As Shot'} ({activeAnalysis?.acr?.temperature || 'Auto'})
            </div>
          </div>

          {/* Manual Star Rating & Color Label Override */}
          <div className="dossier-block">
            <div className="dossier-role-row">
              <span>{t.rating_override_title}</span>
              <span className="dossier-lock-tag">
                {activeAnalysis?.manual_override ? t.user_learned : t.ai_verdict}
              </span>
            </div>
            <div className="rating-override-grid">
              <button
                type="button"
                className={`override-btn ${activeAnalysis?.ai_rating === 3 ? 'active-3' : ''}`}
                disabled={!activeImage}
                onClick={() => activeImage && setManualRating(activeImage.path, 3)}
              >
                {t.select_btn}
              </button>
              <button
                type="button"
                className={`override-btn ${activeAnalysis?.ai_rating === 2 ? 'active-2' : ''}`}
                disabled={!activeImage}
                onClick={() => activeImage && setManualRating(activeImage.path, 2)}
              >
                {t.maybe_btn}
              </button>
              <button
                type="button"
                className={`override-btn ${activeAnalysis?.ai_rating === 1 ? 'active-1' : ''}`}
                disabled={!activeImage}
                onClick={() => activeImage && setManualRating(activeImage.path, 1)}
              >
                {t.reject_btn}
              </button>
            </div>

            <div className="color-label-row" role="group" aria-label="Lightroom Color Labels">
              {[
                { key: 'green', label: 'GRN' },
                { key: 'blue', label: 'BLU' },
                { key: 'yellow', label: 'YLW' },
                { key: 'purple', label: 'PRP' },
                { key: 'red', label: 'RED' }
              ].map((sw) => (
                <button
                  key={sw.key}
                  type="button"
                  className={`color-swatch-btn ${sw.key}`}
                  aria-pressed={activeAnalysis?.color_label === sw.key ? 'true' : 'false'}
                  disabled={!activeImage}
                  onClick={() => activeImage && setColorLabel(activeImage.path, sw.key)}
                >
                  {sw.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 05. Software Sync & Export Module (ACR / Lightroom / Capture One) */}
        <div className="export-module">
          <div className="dossier-role-row">
            <span>{t.sec_export_sync}</span>
            <span>{t.export_ready(getExportItems().length)}</span>
          </div>

          <div className="export-tier-selector" role="group" aria-label="Choose tier to export">
            <button
              type="button"
              className="export-tier-btn"
              aria-pressed={exportTier === '3' ? 'true' : 'false'}
              onClick={() => setExportTier('3')}
            >
              3★ ({counts.selects})
            </button>
            <button
              type="button"
              className="export-tier-btn"
              aria-pressed={exportTier === 'highlights' ? 'true' : 'false'}
              onClick={() => setExportTier('highlights')}
            >
              HI ({counts.highlights})
            </button>
            <button
              type="button"
              className="export-tier-btn"
              aria-pressed={exportTier === '2' ? 'true' : 'false'}
              onClick={() => setExportTier('2')}
            >
              2★+3★
            </button>
            <button
              type="button"
              className="export-tier-btn"
              aria-pressed={exportTier === '1' ? 'true' : 'false'}
              onClick={() => setExportTier('1')}
            >
              ALL
            </button>
          </div>

          <select
            className="sync-select"
            value={softwareSync}
            onChange={(e) => setSoftwareSync(e.target.value)}
            aria-label="Software Sync Format"
          >
            <option value="xmp">{t.sync_xmp}</option>
            <option value="both">{t.sync_both}</option>
            <option value="csv">{t.sync_csv}</option>
            <option value="none">{t.sync_none}</option>
          </select>

          <button
            type="button"
            className="nr-btn mineral"
            onClick={openExportModal}
            disabled={isProcessing || images.length === 0}
          >
            <span>{t.btn_export_sync(getExportItems().length)}</span>
            <span>[ACR &rarr;]</span>
          </button>
        </div>
      </aside>

      {/* 5. Bottom Batch Transport Bar */}
      <footer className="transport-bar" aria-label="Culling batch transport">
        <div>
          <button
            type="button"
            className="nr-btn"
            style={{ padding: '6px 12px', minWidth: '148px' }}
            onClick={() => setViewMode(viewMode === 'gallery' ? 'loupe' : 'gallery')}
            disabled={filteredImages.length === 0}
          >
            <span>{viewMode === 'gallery' ? t.btn_transport_loupe : t.btn_transport_grid}</span>
            <span>&#9635;</span>
          </button>
        </div>

        <div className="transport-title-group">
          <span className="transport-label">{t.transport_gpu}</span>
          <span className="transport-sub">{hwStatus.backend}</span>
        </div>

        <div className="transport-timeline">
          <span className="time-readout">
            {String(processedCount).padStart(3, '0')} / {String(images.length).padStart(3, '0')} ({processProgress}%)
          </span>
          <div className="step-track" aria-hidden="true">
            {[...Array(18)].map((_, i) => {
              const stepIdx = i + 1;
              return (
                <span
                  key={stepIdx}
                  className="step-pip"
                  data-filled={stepIdx < filledSteps ? 'true' : 'false'}
                  data-head={stepIdx === filledSteps && filledSteps > 0 ? 'true' : 'false'}
                />
              );
            })}
          </div>
        </div>

        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>{t.counter_summary(counts.selects, counts.maybes, counts.rejects)}</span>
        </div>
      </footer>

      {/* Editorial Modal Dialog for Folder Input / Export Path */}
      {dialogMode && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form
            className="editorial-dialog"
            onSubmit={dialogMode === 'open' ? (e) => { e.preventDefault(); loadDirectoryFromPath(pathInput); } : confirmExportFiles}
          >
            <div className="dialog-head">
              <span>
                {dialogMode === 'open' ? t.dialog_open_title : t.dialog_export_title(getExportItems().length)}
              </span>
              <span>ESC</span>
            </div>
            <div className="dialog-body">
              <label className="dialog-label" htmlFor="folder-path-input">
                {dialogMode === 'open' ? t.dialog_open_label : t.dialog_export_label}
              </label>
              <div className="dialog-input-row">
                <input
                  id="folder-path-input"
                  type="text"
                  className="dialog-input"
                  value={pathInput}
                  onChange={(e) => setPathInput(e.target.value)}
                  placeholder="C:\Users\Napha\Pictures\Shoot_01"
                  autoFocus
                />
                <button
                  type="button"
                  className="nr-btn mineral"
                  style={{ width: 'auto', padding: '0 12px' }}
                  onClick={() => handleBrowseNativeFolder(dialogMode === 'export')}
                >
                  {t.btn_browse}
                </button>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="nr-btn"
                  onClick={() => setDialogMode(null)}
                >
                  <span>{t.btn_cancel}</span>
                  <span>[X]</span>
                </button>
                <button type="submit" className="nr-btn signal">
                  <span>{dialogMode === 'open' ? t.btn_load_folder : t.btn_export_write}</span>
                  <span>[OK &rarr;]</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Editorial Modal Dialog for Settings & About */}
      {showAboutModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowAboutModal(false)}>
          <div className="editorial-dialog about-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-head">
              <div className="about-tabs-row">
                <button
                  type="button"
                  className={`about-tab-btn ${aboutTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setAboutTab('settings')}
                >
                  {t.modal_tab_settings}
                </button>
                <button
                  type="button"
                  className={`about-tab-btn ${aboutTab === 'about' ? 'active' : ''}`}
                  onClick={() => setAboutTab('about')}
                >
                  {t.modal_tab_about}
                </button>
              </div>
              <button
                type="button"
                className="close-tab-btn"
                onClick={() => setShowAboutModal(false)}
                title="Close Dialog [ESC]"
              >
                ESC ✕
              </button>
            </div>

            {aboutTab === 'settings' ? (
              <div className="dialog-body settings-body">
                {/* Visual Theme Section */}
                <div className="settings-section">
                  <div className="settings-sec-head">
                    <span className="settings-section-title">{t.modal_theme_title}</span>
                    <span className="settings-section-sub">{t.modal_theme_sub}</span>
                  </div>
                  <div className="theme-options-grid">
                    <button
                      type="button"
                      className={`theme-option-card ${theme === 'dark' ? 'active-card' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      <span className="theme-option-name">{t.theme_dark_card}</span>
                      <span className="theme-option-desc">{t.theme_dark_card_desc}</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-option-card ${theme === 'light' ? 'active-card' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      <span className="theme-option-name">{t.theme_light_card}</span>
                      <span className="theme-option-desc">{t.theme_light_card_desc}</span>
                    </button>
                  </div>
                </div>

                {/* Interface Language Section (New!) */}
                <div className="settings-section">
                  <div className="settings-sec-head">
                    <span className="settings-section-title">{t.modal_lang_title}</span>
                    <span className="settings-section-sub">{t.modal_lang_sub}</span>
                  </div>
                  <div className="theme-options-grid">
                    <button
                      type="button"
                      className={`theme-option-card ${lang === 'en' ? 'active-card' : ''}`}
                      onClick={() => setLang('en')}
                    >
                      <span className="theme-option-name">{t.lang_en_card}</span>
                      <span className="theme-option-desc">{t.lang_en_card_desc}</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-option-card ${lang === 'th' ? 'active-card' : ''}`}
                      onClick={() => setLang('th')}
                    >
                      <span className="theme-option-name">{t.lang_th_card}</span>
                      <span className="theme-option-desc">{t.lang_th_card_desc}</span>
                    </button>
                  </div>
                </div>

                {/* Hardware Telemetry Section */}
                <div className="settings-section">
                  <div className="settings-sec-head">
                    <span className="settings-section-title">{t.modal_hw_title}</span>
                    <span className="settings-section-sub">{t.modal_hw_sub}</span>
                  </div>
                  <div className="settings-hw-card">
                    <div className="hw-row">
                      <span className="hw-k">{t.hw_primary}</span>
                      <span className="hw-v highlight">{hwStatus.device_name}</span>
                    </div>
                    <div className="hw-row">
                      <span className="hw-k">{t.hw_pipeline}</span>
                      <span className="hw-v">{hwStatus.backend}</span>
                    </div>
                    <div className="hw-row">
                      <span className="hw-k">{t.hw_gpu_vram}</span>
                      <span className="hw-v">{hwStatus.gpu_util_percent}% GPU | {hwStatus.vram_used_mb}MB / {hwStatus.vram_total_mb}MB</span>
                    </div>
                    <div className="hw-row">
                      <span className="hw-k">{t.hw_adaptive}</span>
                      <span className="hw-v">{hwStatus.learning?.style_label || 'Baseline Profile'}</span>
                    </div>
                  </div>
                </div>

                {/* Keyboard Shortcuts Section */}
                <div className="settings-section">
                  <div className="settings-sec-head">
                    <span className="settings-section-title">{t.modal_shortcuts_title}</span>
                    <span className="settings-section-sub">{t.modal_shortcuts_sub}</span>
                  </div>
                  <div className="shortcuts-grid">
                    <div className="shortcut-item"><kbd className="sc-key">1 - 3</kbd> <span className="sc-desc">{t.sc_1_3}</span></div>
                    <div className="shortcut-item"><kbd className="sc-key">P / X</kbd> <span className="sc-desc">{t.sc_px}</span></div>
                    <div className="shortcut-item"><kbd className="sc-key">H</kbd> <span className="sc-desc">{t.sc_h}</span></div>
                    <div className="shortcut-item"><kbd className="sc-key">Space</kbd> <span className="sc-desc">{t.sc_space}</span></div>
                    <div className="shortcut-item"><kbd className="sc-key">← / →</kbd> <span className="sc-desc">{t.sc_arrows}</span></div>
                    <div className="shortcut-item"><kbd className="sc-key">Esc</kbd> <span className="sc-desc">{t.sc_esc}</span></div>
                  </div>
                </div>

                {/* Software Updates Section */}
                <div className="settings-section">
                  <div className="settings-sec-head">
                    <span className="settings-section-title">{t.modal_updater_title}</span>
                    <span className="settings-section-sub">{t.modal_updater_sub}</span>
                  </div>
                  <div className="settings-updater-card">
                    <div className="hw-row">
                      <span className="hw-k">{t.installed_build_lbl}</span>
                      <span className="hw-v highlight">VERSION {hwStatus.app_version || '1.0.6'} // BUILD {hwStatus.app_build || '106'}</span>
                    </div>
                    <div className="hw-row">
                      <span className="hw-k">{t.release_channel_lbl}</span>
                      <span className="hw-v">{t.prod_stable}</span>
                    </div>
                    <div className="hw-row">
                      <span className="hw-k">{t.auto_check_lbl}</span>
                      <span className="hw-v status-ok">{t.auto_check_val}</span>
                    </div>
                    {skippedVersion && (
                      <div className="hw-row">
                        <span className="hw-k">{t.skipped_version_lbl}</span>
                        <span className="hw-v">
                          v{skippedVersion}{' '}
                          <button
                            type="button"
                            className="updater-inline-btn"
                            onClick={clearSkippedVersion}
                            title="Reset skipped release so you get notified again"
                          >
                            {t.btn_reset_skip}
                          </button>
                        </span>
                      </div>
                    )}
                    {manualCheckMessage && (
                      <div className={`updater-feedback-msg ${manualCheckMessage.type}`}>
                        {manualCheckMessage.text}
                      </div>
                    )}
                    <div className="updater-actions-row">
                      <button
                        type="button"
                        className="nr-btn mineral updater-check-btn"
                        disabled={isCheckingUpdate}
                        onClick={handleManualCheckUpdate}
                      >
                        <span>{isCheckingUpdate ? t.btn_checking_github : t.btn_check_updates_now}</span>
                        <span>[CHECK ⟳]</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="dialog-actions">
                  <button
                    type="button"
                    className="nr-btn mineral"
                    onClick={() => setAboutTab('about')}
                  >
                    <span>{t.btn_view_specs}</span>
                    <span>[SPECS ↗]</span>
                  </button>
                  <button
                    type="button"
                    className="nr-btn"
                    onClick={() => setShowAboutModal(false)}
                  >
                    <span>{t.btn_close_dialog}</span>
                    <span>[ESC]</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="dialog-body about-body">
                <div className="about-hero-row">
                  <img
                    src={logoRegular}
                    alt="MicMose Photo Culler Pro Logo"
                    className="about-hero-logo"
                  />
                  <div className="about-hero-text">
                    <h2 className="about-title">{t.about_title}</h2>
                    <div className="about-version">VERSION {hwStatus.app_version || '1.0.6'} // BUILD {hwStatus.app_build || '106'} // {t.about_prod_release}</div>
                    <div className="about-author">{t.about_author}</div>
                    <div className="about-links-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                      <a
                        href="https://github.com/Naphatpuurin/AI-Assist-Photo-Culler"
                        target="_blank"
                        rel="noreferrer"
                        className="about-repo-link"
                      >
                        {t.about_github}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="about-spec-grid">
                  <div className="about-spec-box">
                    <div className="spec-label">{t.spec_1_label}</div>
                    <div className="spec-desc">{t.spec_1_desc}</div>
                  </div>
                  <div className="about-spec-box">
                    <div className="spec-label">{t.spec_2_label}</div>
                    <div className="spec-desc">{t.spec_2_desc}</div>
                  </div>
                  <div className="about-spec-box">
                    <div className="spec-label">{t.spec_3_label}</div>
                    <div className="spec-desc">{t.spec_3_desc}</div>
                  </div>
                  <div className="about-spec-box">
                    <div className="spec-label">{t.spec_4_label}</div>
                    <div className="spec-desc">{t.spec_4_desc}</div>
                  </div>
                </div>

                <div className="dialog-actions">
                  <button
                    type="button"
                    className="nr-btn mineral"
                    onClick={() => setAboutTab('settings')}
                  >
                    <span>{t.btn_studio_settings}</span>
                    <span>[SETTINGS]</span>
                  </button>
                  <button
                    type="button"
                    className="nr-btn"
                    onClick={() => setShowAboutModal(false)}
                  >
                    <span>{t.btn_close_dialog}</span>
                    <span>[ESC]</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editorial Modal Dialog for Auto-Updater */}
      {showUpdateModal && updateInfo && (
        <div
          className="modal-backdrop update-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (updateState !== 'downloading') setShowUpdateModal(false);
          }}
        >
          <div className="editorial-dialog update-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-head update-head">
              <div className="update-title-wrap">
                <span className="update-badge-pill">{t.updater_notif}</span>
                <span className="update-title-text">
                  {updateState === 'downloading'
                    ? t.updater_pulling
                    : updateState === 'installed'
                    ? t.updater_launched
                    : t.updater_new_release}
                </span>
              </div>
              <div className="update-head-right">
                <span className="version-diff-pill">
                  v{updateInfo.current_version} ➔ v{updateInfo.latest_version}
                </span>
                {updateState !== 'downloading' && (
                  <button
                    type="button"
                    className="close-tab-btn"
                    onClick={() => setShowUpdateModal(false)}
                    title="Close Dialog [ESC]"
                  >
                    ESC ✕
                  </button>
                )}
              </div>
            </div>

            <div className="dialog-body update-body">
              {updateState === 'prompt' && (
                <div className="update-prompt-view">
                  <div className="update-meta-card">
                    <div className="update-meta-row">
                      <span className="meta-label">{t.release_tag_lbl}</span>
                      <span className="meta-value tag-name">{updateInfo.tag_name || `v${updateInfo.latest_version}`}</span>
                    </div>
                    <div className="update-meta-row">
                      <span className="meta-label">{t.release_name_lbl}</span>
                      <span className="meta-value">{updateInfo.release_name || 'Production Studio Release'}</span>
                    </div>
                    {updateInfo.published_at && (
                      <div className="update-meta-row">
                        <span className="meta-label">{t.published_lbl}</span>
                        <span className="meta-value">{new Date(updateInfo.published_at).toLocaleString()}</span>
                      </div>
                    )}
                    {updateInfo.asset && (
                      <div className="update-meta-row">
                        <span className="meta-label">{t.package_lbl}</span>
                        <span className="meta-value package-name">
                          {updateInfo.asset.name} ({(updateInfo.asset.size / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Release Notes */}
                  <div className="update-notes-container">
                    <div className="update-notes-head">
                      <span>{t.sec_release_notes}</span>
                      <a
                        href={updateInfo.html_url || `https://github.com/Naphatpuurin/AI-Assist-Photo-Culler/releases`}
                        target="_blank"
                        rel="noreferrer"
                        className="view-github-link"
                      >
                        {t.view_on_github}
                      </a>
                    </div>
                    <div className="update-notes-body">
                      {updateInfo.release_notes ? (
                        <pre className="notes-pre">{updateInfo.release_notes}</pre>
                      ) : (
                        <div className="no-notes">
                          Official release build with verified performance optimizations, hardware matrix acceleration, and code-signed installers.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* The 3 Buttons Requested by User */}
                  <div className="update-modal-buttons">
                    <button
                      type="button"
                      className="update-action-btn btn-skip"
                      onClick={handleSkipUpdate}
                      title="Don't ask again for this specific release"
                    >
                      <div className="btn-title">{t.btn_skip_update}</div>
                      <div className="btn-sub">{t.btn_skip_sub(updateInfo.latest_version)}</div>
                    </button>

                    <button
                      type="button"
                      className="update-action-btn btn-remind"
                      onClick={handleRemindLater}
                      title="Dismiss for now and remind next session"
                    >
                      <div className="btn-title">{t.btn_remind_later}</div>
                      <div className="btn-sub">{t.btn_remind_sub}</div>
                    </button>

                    <button
                      type="button"
                      className="update-action-btn btn-update"
                      onClick={handleStartUpdate}
                      title="Download package and launch installer"
                    >
                      <div className="btn-title">{t.btn_update_now}</div>
                      <div className="btn-sub">{t.btn_update_sub}</div>
                    </button>
                  </div>
                </div>
              )}

              {updateState === 'downloading' && (
                <div className="update-progress-view">
                  <div className="progress-banner">
                    <div className="pulse-dot"></div>
                    <span className="progress-status-txt">
                      {t.updater_pulling}
                    </span>
                  </div>

                  <div className="download-target-info">
                    <span>{t.target_package_lbl} <strong>{updaterProgress.filename || updateInfo.asset?.name || 'Installer'}</strong></span>
                  </div>

                  {/* Progress Bar */}
                  <div className="update-progress-bar-wrap">
                    <div
                      className="update-progress-bar-fill"
                      style={{ width: `${Math.max(4, updaterProgress.progress)}%` }}
                    >
                      <span className="progress-fill-text">{Math.round(updaterProgress.progress)}%</span>
                    </div>
                  </div>

                  <div className="download-stats-row">
                    <span className="stats-bytes">
                      {(updaterProgress.bytes_downloaded / (1024 * 1024)).toFixed(1)} MB / {(updaterProgress.total_bytes / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <span className="stats-speed">
                      {t.transfer_speed_lbl} {updaterProgress.speed_mbps || 0} MB/s
                    </span>
                  </div>

                  <div className="download-info-cue">
                    {t.download_info_hint}
                  </div>
                </div>
              )}

              {updateState === 'installed' && (
                <div className="update-complete-view">
                  <div className="complete-banner">
                    <span className="check-icon">✓</span>
                    <div className="complete-text">
                      <h3>{t.installer_success_title}</h3>
                      <p>
                        {t.installer_success_desc(updaterProgress.filename || updateInfo.asset?.name || 'MicMose Photo Culler Pro')}
                      </p>
                      <p className="complete-sub">
                        {t.installer_exit_hint}
                      </p>
                    </div>
                  </div>

                  <div className="complete-actions">
                    <button
                      type="button"
                      className="nr-btn vermilion"
                      onClick={handleQuitApp}
                    >
                      <span>{t.btn_exit_close_app}</span>
                      <span>[EXIT NOW ✕]</span>
                    </button>
                    <button
                      type="button"
                      className="nr-btn"
                      onClick={() => setShowUpdateModal(false)}
                    >
                      <span>{t.btn_keep_running}</span>
                      <span>[ESC]</span>
                    </button>
                  </div>
                </div>
              )}

              {updateState === 'error' && (
                <div className="update-error-view">
                  <div className="error-banner">
                    <span className="err-icon">⚠</span>
                    <div className="err-text">
                      <h3>{t.update_failed_title}</h3>
                      <p>{updateError || 'An error occurred while pulling the update package.'}</p>
                    </div>
                  </div>

                  <div className="error-actions">
                    <button
                      type="button"
                      className="nr-btn mineral"
                      onClick={handleStartUpdate}
                    >
                      <span>{t.btn_retry_download}</span>
                      <span>[RETRY ⟳]</span>
                    </button>
                    <a
                      href={updateInfo.html_url || `https://github.com/Naphatpuurin/AI-Assist-Photo-Culler/releases`}
                      target="_blank"
                      rel="noreferrer"
                      className="nr-btn"
                      style={{ textDecoration: 'none', display: 'inline-flex' }}
                    >
                      <span>{t.btn_download_browser}</span>
                      <span>[BROWSER ↗]</span>
                    </a>
                    <button
                      type="button"
                      className="nr-btn"
                      onClick={() => setShowUpdateModal(false)}
                    >
                      <span>{t.btn_close_dialog}</span>
                      <span>[ESC]</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
