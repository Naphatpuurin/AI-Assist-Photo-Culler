import React, { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import logoRegular from './assets/logo_regular.png'
import splashCover from './assets/splash_cover.jpg'

function App() {
  const [theme, setTheme] = useState('dark');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [aboutTab, setAboutTab] = useState('settings'); // 'settings' | 'about'

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

  const focusLevelDescriptions = {
    1: "LVL 01 // ULTRA LOOSE — Accepts almost everything. Minor motion blur and low light allowed.",
    2: "LVL 02 // VERY FORGIVING — Soft focus and wide-aperture shallow depth-of-field accepted.",
    3: "LVL 03 // RELAXED — Forgives f/1.4 softness and minor candlelit handshake.",
    4: "LVL 04 // GENTLE — Mild softness allowed, ideal for fast action & active subjects.",
    5: "LVL 05 // BALANCED (DEFAULT) — Proven event baseline (~236/640 Selects). Crisp subjects, balanced exposure.",
    6: "LVL 06 // CRISP — Clear subject edges and controlled highlights/shadows.",
    7: "LVL 07 // STRICT — Demands distinct subject plane contrast with minimal motion blur.",
    8: "LVL 08 // VERY STRICT — Tack-sharp subject planes only.",
    9: "LVL 09 // CRITICAL — Razor-sharp focus with no optical softness.",
    10: "LVL 10 // CLINICAL — Only 100% optical perfection and balanced histogram pass."
  };

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
  const [statusMessage, setStatusMessage] = useState('STANDBY // LOAD FOLDER FOR PARALLEL GPU CULLING');

  // ---------------- Studio Splash / Loading Menu (750x500 Dynamic Scaling) ----------------
  const [showSplash, setShowSplash] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);
  const [splashStatusText, setSplashStatusText] = useState('Initializing Studio Workstation...');
  const [splashFading, setSplashFading] = useState(false);
  const [isSplashManualPreview, setIsSplashManualPreview] = useState(false);

  useEffect(() => {
    let current = 0;
    const steps = [
      { pct: 15, text: 'Initializing Neural Engine & DirectML...' },
      { pct: 35, text: 'Probing OpenCL GPU Matrix Acceleration...' },
      { pct: 55, text: 'Loading Face & Eye Focus Detectors...' },
      { pct: 75, text: 'Calibrating 1–10 Laplacian Sharpness Scale...' },
      { pct: 90, text: 'Connecting Adobe ACR 16.0 XMP Engine...' },
      { pct: 100, text: 'Studio Workstation Ready.' }
    ];

    const interval = setInterval(() => {
      current += 4;
      if (current > 100) current = 100;
      setSplashProgress(current);

      for (let i = steps.length - 1; i >= 0; i--) {
        if (current >= steps[i].pct) {
          setSplashStatusText(steps[i].text);
          break;
        }
      }

      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setSplashFading(true);
          setTimeout(() => {
            setShowSplash(false);
            setSplashFading(false);
          }, 450);
        }, 350);
      }
    }, 45);

    return () => clearInterval(interval);
  }, []);

  const dismissSplash = () => {
    setSplashFading(true);
    setTimeout(() => {
      setShowSplash(false);
      setSplashFading(false);
      setIsSplashManualPreview(false);
    }, 250);
  };

  const openSplashPreview = () => {
    setSplashProgress(100);
    setSplashStatusText('Studio Workstation Ready.');
    setIsSplashManualPreview(true);
    setShowSplash(true);
  };

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
        const res = await fetch('http://localhost:8000/api/updater/progress');
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
        const res = await fetch('http://localhost:8000/api/updater/check');
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
      const res = await fetch('http://localhost:8000/api/updater/download_and_install', {
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
      await fetch('http://localhost:8000/api/updater/quit_app', { method: 'POST' });
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

  const handleManualCheckUpdate = async (forcePreview = false) => {
    setIsCheckingUpdate(true);
    setManualCheckMessage(null);
    try {
      const url = `http://localhost:8000/api/updater/check${forcePreview ? '?force=true' : ''}`;
      const res = await fetch(url);
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
      const res = await fetch('http://localhost:8000/api/hardware_status');
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
      const response = await fetch('http://localhost:8000/api/post_process_batch', {
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
      const url = `http://localhost:8000/api/analyze?path=${encodeURIComponent(path)}&${params.toString()}`;
      const response = await fetch(url);
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
      const res = await fetch('http://localhost:8000/api/learn_feedback', {
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
      if (showSplash) {
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
          dismissSplash();
          return;
        }
      }
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
  }, [showSplash, dismissSplash, showUpdateModal, updateState, showAboutModal, dialogMode, filteredImages, selectedImageIndex, activeImage, viewMode, analyzeSingleImage, setManualRating, toggleHighlight]);

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
      const response = await fetch('http://localhost:8000/api/scan_directory', {
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
      const res = await fetch('http://localhost:8000/api/select_folder');
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
        const response = await fetch('http://localhost:8000/api/analyze_batch', {
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
      const response = await fetch('http://localhost:8000/api/export', {
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
    if (!info) return <span className="cue-rating-tag tier-0">UNSCORED</span>;
    if (info.is_highlight) return <span className="cue-rating-tag tier-highlight">★ HIGHLIGHT</span>;
    if (info.ai_rating === 3) return <span className="cue-rating-tag tier-3">★★★ SELECT</span>;
    if (info.ai_rating === 2) return <span className="cue-rating-tag tier-2">★★ MAYBE</span>;
    return <span className="cue-rating-tag tier-1">★ REJECT</span>;
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
            title="Studio Settings & Telemetry [S]"
          >
            <span className="settings-icon">⚙</span>
            <span className="settings-label">SETTINGS</span>
          </button>
          <div
            className="brand-block"
            onClick={() => { setAboutTab('about'); setShowAboutModal(true); }}
            title="About MicMose Photo Culler Pro & System Specs"
            role="button"
            tabIndex={0}
          >
            <img
              src={logoRegular}
              alt="MicMose Photo Culler Pro Logo"
              className="brand-logo-img"
            />
            <div className="brand-text-block">
              <div className="brand-title-row">
                <span className="brand-mark">MicMose Photo Culler Pro</span>
                <span className="brand-config-badge">ABOUT ⓘ</span>
              </div>
              <span className="brand-tagline">Parallel GPU Culling &amp; Adobe Camera Raw (ACR) Studio.</span>
            </div>
          </div>
        </div>
        <div className="system-meta">
          <span className="learning-pill" title="Learning AI adapts to your manual star rating overrides">
            <span>AI: {hwStatus.learning?.style_label || 'Baseline'}</span>
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
            onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? '☀ CHALK' : '☾ DARK'}
          </button>
        </div>
      </header>

      {/* 2. Left Index Rail: Source, Level 1-10 Subject Focus, Cull-to-Target & Filters */}
      <aside className="index-rail" aria-label="AI Culling criteria and detection filters">
        <div>
          {/* 01. Source Directory */}
          <div className="rail-section">
            <div className="section-head">
              <span>01 // SOURCE ROLL</span>
              <span>{images.length} FILES</span>
            </div>
            <div className="section-body" style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="nr-btn mineral"
                onClick={() => handleBrowseNativeFolder(false)}
                disabled={isProcessing}
              >
                <span>Browse...</span>
                <span>[WIN]</span>
              </button>
              <button
                type="button"
                className="nr-btn"
                onClick={() => { setPathInput(currentPath || ''); setDialogMode('open'); }}
                disabled={isProcessing}
              >
                <span>Path</span>
                <span>[...]</span>
              </button>
            </div>
          </div>

          {/* 02. Subject Focus Level 1-10 & Reject Criteria */}
          <div className="rail-section">
            <div className="section-head">
              <span>02 // SUBJECT FOCUS (LVL 1-10)</span>
              <span>AI PRESET</span>
            </div>
            <div className="section-body">
              <div className="strictness-header">
                <span>SUBJECT FOCUS LEVEL</span>
                <span className="strictness-lvl-badge">LEVEL {focusLevel} / 10</span>
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
                  <span>CAP BY TARGET %</span>
                </label>
                <span className="strictness-lvl-badge" style={{ background: cullToTargetEnabled ? 'var(--mineral-blue)' : 'var(--rule-soft)' }}>
                  {cullToTargetEnabled ? `KEEP ${targetKeepPercent}%` : 'UNCAPPED'}
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
                  <span>Require Subject in Frame</span>
                  <input
                    type="checkbox"
                    checked={requireSubjects}
                    disabled={isProcessing}
                    onChange={(e) => setRequireSubjects(e.target.checked)}
                  />
                </label>
                <label className="subject-toggle-row">
                  <span>Strict Closed-Eye Reject</span>
                  <input
                    type="checkbox"
                    checked={rejectClosedEyes}
                    disabled={isProcessing}
                    onChange={(e) => setRejectClosedEyes(e.target.checked)}
                  />
                </label>
                <label className="subject-toggle-row">
                  <span>Reject Exposure Issues</span>
                  <input
                    type="checkbox"
                    checked={rejectExposure}
                    disabled={isProcessing}
                    onChange={(e) => setRejectExposure(e.target.checked)}
                  />
                </label>
                <label className="subject-toggle-row">
                  <span>Reject Misfires &amp; Documents</span>
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
              <span>03 // CULLING TIERS</span>
              <span>{counts.stacks > 0 ? `${counts.stacks} STACKS` : 'INDEX'}</span>
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
                  <span className="tier-label">Complete Roll</span>
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
                  <span className="tier-label">★★★ Selects (Best)</span>
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
                  <span className="tier-label">★ Highlights (Top Subset)</span>
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
                  <span className="tier-label">★★ Maybes (Review)</span>
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
                  <span className="tier-label">★ Rejects (Out)</span>
                  <span className="tier-count">{counts.rejects}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* 04. Automatic Detection Filters */}
          <div className="rail-section">
            <div className="section-head">
              <span>04 // AUTO DETECTION FILTERS</span>
              <span>FLAGS</span>
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
                  <span className="tier-label">Eyes Open &amp; Sharp</span>
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
                  <span className="tier-label">Closed Eyes</span>
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
                  <span className="tier-label">Blurry / Soft Focus</span>
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
                  <span className="tier-label">Near-Duplicates</span>
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
                  <span className="tier-label">Creative Variations</span>
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
                  <span className="tier-label">Exposure Issues</span>
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
                  <span className="tier-label">Misfires / Docs</span>
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
            <span>{isProcessing ? `Parallel GPU Culling (${processProgress}%)` : '▶ Run Parallel AI Culling'}</span>
            <span>[GPU]</span>
          </button>
        </div>
      </aside>

      {/* 3. Dominant Center Score & Contact Sheet Stage */}
      <main className="center-stage">
        <div className="stage-topbar">
          <span>ROLL // {currentPath || 'NO FOLDER LOADED'}</span>
          <div className="topbar-controls-right">
            <button
              type="button"
              className="stack-toggle-pill"
              aria-pressed={collapseStacks ? 'true' : 'false'}
              onClick={() => { setCollapseStacks(prev => !prev); setSelectedImageIndex(0); }}
              title="Collapse burst stacks to show only the top Stack Leader per group"
            >
              {collapseStacks ? '▣ STACKS COLLAPSED' : '▤ AUTO-STACKS EXPANDED'}
            </button>
            <div className="view-mode-switch" role="group" aria-label="View mode">
              <button
                type="button"
                className="mode-tab"
                aria-pressed={viewMode === 'gallery' ? 'true' : 'false'}
                onClick={() => setViewMode('gallery')}
              >
                GRID ({filteredImages.length})
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
                LOUPE
              </button>
            </div>
          </div>
        </div>

        {/* Stage Title Band with Quick Exposure Bar */}
        <section className="stage-title-band">
          <div className="stage-zone-line">
            <span>
              {activeImage
                ? `FRAME ${String(selectedImageIndex + 1).padStart(3, '0')}/${String(filteredImages.length).padStart(3, '0')} // ${activeAnalysis?.camera || 'SCANNING EXIF'} // ${activeAnalysis?.lens || ''}`
                : 'FRAME 000 // STANDBY'}
            </span>
            <span>
              {activeAnalysis
                ? `${activeAnalysis.shutter_speed}  |  ${activeAnalysis.f_stop}  |  ${activeAnalysis.iso}  |  ${activeAnalysis.focal_length}  |  ${activeAnalysis.capture_time}`
                : 'SELECT PHOTO OR RUN AI CULLING'}
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
              <span>SUBJECT FOCUS (1-10)</span>
              <span>REQ LVL {focusLevel}</span>
            </div>
            <div className="telemetry-val">
              {activeAnalysis ? `Level ${activeAnalysis.focus_level} / 10` : 'Level --'}
            </div>
            <div className="telemetry-sub">
              {activeAnalysis ? `RAW LAPLACIAN: ${activeAnalysis.sharpness}` : 'GPU UMAT CONVOLUTION'}
            </div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-head">
              <span>SHUTTER / F-STOP / ISO</span>
              <span>EXIF</span>
            </div>
            <div className="telemetry-val">
              {activeAnalysis
                ? `${activeAnalysis.shutter_speed} · ${activeAnalysis.f_stop} · ${activeAnalysis.iso}`
                : '-- · -- · --'}
            </div>
            <div className="telemetry-sub">
              {activeAnalysis ? `TAKEN: ${activeAnalysis.capture_time}` : 'CAPTURE TIMESTAMP'}
            </div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-head">
              <span>ACR DYNAMIC RANGE</span>
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
                : 'ADOBE CAMERA RAW MODULE'}
            </div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-head">
              <span>EYES &amp; BURST STACK</span>
              <span>INTENT</span>
            </div>
            <div className="telemetry-val">
              {activeAnalysis
                ? `${activeAnalysis.eye_status === 'open' ? 'EYES OPEN' : activeAnalysis.eye_status === 'closed' ? 'CLOSED EYES' : activeAnalysis.subjects_detected > 0 ? 'SUBJECT LOCKED' : 'SCENE'} · S#${activeAnalysis.stack_id}`
                : 'Stack --'}
            </div>
            <div className="telemetry-sub">
              {activeAnalysis ? `ARTIST: ${activeAnalysis.artist}` : 'AUTHOR / ARTIST TAG'}
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
                        src={`http://localhost:8000/api/thumbnail?path=${encodeURIComponent(img.path)}`}
                        alt={img.filename}
                        loading="lazy"
                      />
                      {info && info.stack_size > 1 && (
                        <span className="stack-badge-overlay">
                          STACK #{info.stack_id} ({info.is_stack_leader ? `TOP OF ${info.stack_size}` : `${info.stack_size}`})
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
                        LOUPE &#8599;
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
              <h3>{loading ? 'Scanning Photo Roll...' : 'No Photos in This Filter View'}</h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {images.length === 0
                  ? 'Click [Browse... WIN] in the top-left rail to open a folder of photos.'
                  : 'Click [▶ Run Parallel AI Culling] on the bottom-left or select another filter tab.'}
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
                    &larr; PREV
                  </button>

                  <div className="loupe-img-wrapper">
                    <img
                      src={`http://localhost:8000/api/image?path=${encodeURIComponent(activeImage.path)}`}
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
                    NEXT &rarr;
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
                      <span>ROI Boxes</span>
                    </label>
                    <button
                      type="button"
                      className={`override-btn ${activeAnalysis?.is_highlight ? 'active-3' : ''}`}
                      style={{ padding: '4px 8px' }}
                      onClick={() => toggleHighlight(activeImage.path)}
                    >
                      ★ Highlight [H]
                    </button>
                    {[3, 2, 1].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`override-btn ${activeAnalysis?.ai_rating === star ? `active-${star}` : ''}`}
                        style={{ padding: '4px 8px' }}
                        onClick={() => setManualRating(activeImage.path, star)}
                      >
                        {star === 3 ? '★★★ Select [P]' : star === 2 ? '★★ Maybe [2]' : '★ Reject [X]'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="nr-btn"
                    style={{ width: 'auto', padding: '4px 10px' }}
                    onClick={() => setViewMode('gallery')}
                  >
                    <span>&larr; Grid</span>
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
            <span>PICTURE INFO &amp; EXIF</span>
            <span>METADATA</span>
          </div>

          {/* Camera & Lens */}
          <div className="dossier-block">
            <div className="dossier-role-row">
              <span>Camera &amp; Lens</span>
              <span className="dossier-lock-tag">OPTICS</span>
            </div>
            <div className="dossier-value">
              {activeAnalysis?.camera || 'Click Any Photo'}
            </div>
            <div className="dossier-sub" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {activeAnalysis?.lens || 'Unknown Lens'}
            </div>
            <div className="dossier-sub">
              {activeAnalysis?.dimensions || '--'} · {activeAnalysis?.color_space || 'sRGB'}
            </div>
          </div>

          {/* Exposure Triad: Shutter, F-Stop, ISO, Focal Length & Time Taken */}
          <div className="dossier-block">
            <div className="dossier-role-row">
              <span>Exposure &amp; Capture Time</span>
              <span className="dossier-lock-tag">EXIF</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '4px' }}>
              <div><strong>SHUTTER:</strong> {activeAnalysis?.shutter_speed || 'N/A'}</div>
              <div><strong>F-STOP:</strong> {activeAnalysis?.f_stop || 'N/A'}</div>
              <div><strong>ISO:</strong> {activeAnalysis?.iso || 'N/A'}</div>
              <div><strong>FOCAL:</strong> {activeAnalysis?.focal_length || 'N/A'}</div>
            </div>
            <div className="dossier-sub" style={{ marginTop: '5px', color: 'var(--text-primary)' }}>
              <strong>TAKEN:</strong> {activeAnalysis?.capture_time || 'Unknown Time'}
            </div>
          </div>

          {/* Author & Artist Name */}
          <div className="dossier-block">
            <div className="dossier-role-row">
              <span>Author &amp; Artist</span>
              <span className="dossier-lock-tag">CREDITS</span>
            </div>
            <div className="dossier-sub" style={{ color: 'var(--text-primary)' }}>
              <strong>ARTIST:</strong> {activeAnalysis?.artist || 'Unknown Artist'}
            </div>
            <div className="dossier-sub" style={{ color: 'var(--text-primary)' }}>
              <strong>AUTHOR:</strong> {activeAnalysis?.author || 'Unknown Author'}
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
              <span>Adobe Camera Raw (ACR)</span>
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
              <span>Rating &amp; Color Label</span>
              <span className="dossier-lock-tag">
                {activeAnalysis?.manual_override ? 'USER LEARNED' : 'AI VERDICT'}
              </span>
            </div>
            <div className="rating-override-grid">
              <button
                type="button"
                className={`override-btn ${activeAnalysis?.ai_rating === 3 ? 'active-3' : ''}`}
                disabled={!activeImage}
                onClick={() => activeImage && setManualRating(activeImage.path, 3)}
              >
                ★★★ Select
              </button>
              <button
                type="button"
                className={`override-btn ${activeAnalysis?.ai_rating === 2 ? 'active-2' : ''}`}
                disabled={!activeImage}
                onClick={() => activeImage && setManualRating(activeImage.path, 2)}
              >
                ★★ Maybe
              </button>
              <button
                type="button"
                className={`override-btn ${activeAnalysis?.ai_rating === 1 ? 'active-1' : ''}`}
                disabled={!activeImage}
                onClick={() => activeImage && setManualRating(activeImage.path, 1)}
              >
                ★ Reject
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
            <span>05 // ACR &amp; LIGHTROOM SYNC</span>
            <span>{getExportItems().length} READY</span>
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
            <option value="xmp">Sync: ACR 16.0 / Lightroom / Capture One (.XMP)</option>
            <option value="both">Sync: ACR .XMP Sidecars + CSV Manifest</option>
            <option value="csv">Sync: CSV Metadata Manifest Only</option>
            <option value="none">Copy Photos Only (No Sidecars)</option>
          </select>

          <button
            type="button"
            className="nr-btn mineral"
            onClick={openExportModal}
            disabled={isProcessing || images.length === 0}
          >
            <span>Export &amp; Sync ({getExportItems().length})</span>
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
            <span>{viewMode === 'gallery' ? 'INSPECT IN LOUPE' : 'RETURN TO GRID'}</span>
            <span>&#9635;</span>
          </button>
        </div>

        <div className="transport-title-group">
          <span className="transport-label">Parallel GPU Division</span>
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
          <span>SELECTS: {counts.selects} | MAYBES: {counts.maybes} | REJECTS: {counts.rejects}</span>
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
                {dialogMode === 'open'
                  ? 'SOURCE ROLL // OPEN DIRECTORY'
                  : `ACR & LIGHTROOM EXPORT // ${getExportItems().length} PHOTOS + .XMP SIDECARS`}
              </span>
              <span>ESC</span>
            </div>
            <div className="dialog-body">
              <label className="dialog-label" htmlFor="folder-path-input">
                {dialogMode === 'open'
                  ? 'Select or paste folder path containing JPEG / PNG / TIFF photos:'
                  : 'Destination folder (Photos + Adobe Camera Raw / Lightroom .XMP sidecars):'}
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
                  Browse...
                </button>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="nr-btn"
                  onClick={() => setDialogMode(null)}
                >
                  <span>Cancel</span>
                  <span>[X]</span>
                </button>
                <button type="submit" className="nr-btn signal">
                  <span>{dialogMode === 'open' ? 'Load Folder' : 'Export & Write ACR XMP'}</span>
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
                  01 // STUDIO SETTINGS
                </button>
                <button
                  type="button"
                  className={`about-tab-btn ${aboutTab === 'about' ? 'active' : ''}`}
                  onClick={() => setAboutTab('about')}
                >
                  02 // ABOUT THIS APP
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
                    <span className="settings-section-title">01 // WORKSTATION THEME</span>
                    <span className="settings-section-sub">Switch between Dark Graphite Cue-Sheet and High-Key Chalk styles:</span>
                  </div>
                  <div className="theme-options-grid">
                    <button
                      type="button"
                      className={`theme-option-card ${theme === 'dark' ? 'active-card' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      <span className="theme-option-name">☾ DARK GRAPHITE</span>
                      <span className="theme-option-desc">Recommended for studio darkrooms &amp; colour grading accuracy.</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-option-card ${theme === 'light' ? 'active-card' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      <span className="theme-option-name">☀ CHALK EDITORIAL (#F4F3EE)</span>
                      <span className="theme-option-desc">Warm chalk paper background calibrated for location laptop inspections.</span>
                    </button>
                  </div>
                </div>

                {/* Hardware Telemetry Section */}
                <div className="settings-section">
                  <div className="settings-sec-head">
                    <span className="settings-section-title">02 // HARDWARE TELEMETRY &amp; ACCELERATION</span>
                    <span className="settings-section-sub">Active OpenCL and ONNX Runtime DirectML engine status:</span>
                  </div>
                  <div className="settings-hw-card">
                    <div className="hw-row">
                      <span className="hw-k">PRIMARY DEVICE</span>
                      <span className="hw-v highlight">{hwStatus.device_name}</span>
                    </div>
                    <div className="hw-row">
                      <span className="hw-k">BACKEND PIPELINE</span>
                      <span className="hw-v">{hwStatus.backend}</span>
                    </div>
                    <div className="hw-row">
                      <span className="hw-k">GPU LOAD / VRAM</span>
                      <span className="hw-v">{hwStatus.gpu_util_percent}% GPU | {hwStatus.vram_used_mb}MB / {hwStatus.vram_total_mb}MB</span>
                    </div>
                    <div className="hw-row">
                      <span className="hw-k">ADAPTIVE AI PROFILE</span>
                      <span className="hw-v">{hwStatus.learning?.style_label || 'Baseline Profile'}</span>
                    </div>
                  </div>
                </div>

                {/* Keyboard Shortcuts Section */}
                <div className="settings-section">
                  <div className="settings-sec-head">
                    <span className="settings-section-title">03 // ESSENTIAL KEYBOARD SHORTCUTS</span>
                    <span className="settings-section-sub">Speed culling hotkeys for rapid one-handed review:</span>
                  </div>
                  <div className="shortcuts-grid">
                    <div className="shortcut-item"><kbd className="sc-key">1 - 3</kbd> <span className="sc-desc">Rate Stars (1=Reject, 2=Review, 3=Keep)</span></div>
                    <div className="shortcut-item"><kbd className="sc-key">P / X</kbd> <span className="sc-desc">Quick Pick (3★) / Quick Reject (1★)</span></div>
                    <div className="shortcut-item"><kbd className="sc-key">H</kbd> <span className="sc-desc">Toggle Hero Highlight Flag</span></div>
                    <div className="shortcut-item"><kbd className="sc-key">Space</kbd> <span className="sc-desc">Toggle 100% Loupe Inspection View</span></div>
                    <div className="shortcut-item"><kbd className="sc-key">← / →</kbd> <span className="sc-desc">Navigate Previous / Next Image</span></div>
                    <div className="shortcut-item"><kbd className="sc-key">Esc</kbd> <span className="sc-desc">Exit Loupe / Close Dialogs</span></div>
                  </div>
                </div>

                {/* Software Updates Section */}
                <div className="settings-section">
                  <div className="settings-sec-head">
                    <span className="settings-section-title">04 // SOFTWARE UPDATES &amp; RELEASE CHANNEL</span>
                    <span className="settings-section-sub">Automated release checks via GitHub Releases:</span>
                  </div>
                  <div className="settings-updater-card">
                    <div className="hw-row">
                      <span className="hw-k">INSTALLED BUILD</span>
                      <span className="hw-v highlight">VERSION 1.0.4 // BUILD 104</span>
                    </div>
                    <div className="hw-row">
                      <span className="hw-k">RELEASE CHANNEL</span>
                      <span className="hw-v">Production Stable (GitHub Releases)</span>
                    </div>
                    <div className="hw-row">
                      <span className="hw-k">AUTO-CHECK ON START</span>
                      <span className="hw-v status-ok">● Enabled (with Skip / Remind controls)</span>
                    </div>
                    {skippedVersion && (
                      <div className="hw-row">
                        <span className="hw-k">SKIPPED VERSION</span>
                        <span className="hw-v">
                          v{skippedVersion}{' '}
                          <button
                            type="button"
                            className="updater-inline-btn"
                            onClick={clearSkippedVersion}
                            title="Reset skipped release so you get notified again"
                          >
                            [ RESET / UN-SKIP ]
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
                        onClick={() => handleManualCheckUpdate(false)}
                      >
                        <span>{isCheckingUpdate ? 'CHECKING GITHUB...' : 'CHECK FOR UPDATES NOW'}</span>
                        <span>[CHECK ⟳]</span>
                      </button>
                      <button
                        type="button"
                        className="nr-btn updater-preview-btn"
                        disabled={isCheckingUpdate}
                        onClick={() => handleManualCheckUpdate(true)}
                        title="Simulate / Preview the Update Dialog and 3 buttons"
                      >
                        <span>PREVIEW UPDATE MODAL</span>
                        <span>[DEMO]</span>
                      </button>
                      <button
                        type="button"
                        className="nr-btn"
                        onClick={openSplashPreview}
                        title="View the 750x500 Studio Splash Loading Screen"
                      >
                        <span>SPLASH SCREEN</span>
                        <span>[SPLASH 🎴]</span>
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
                    <span>VIEW ABOUT &amp; SPECS</span>
                    <span>[SPECS ↗]</span>
                  </button>
                  <button
                    type="button"
                    className="nr-btn"
                    onClick={() => setShowAboutModal(false)}
                  >
                    <span>CLOSE</span>
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
                    <h2 className="about-title">MICMOSE PHOTO CULLER PRO</h2>
                    <div className="about-version">VERSION 1.0.4 // BUILD 104 // PRODUCTION STUDIO RELEASE</div>
                    <div className="about-author">CREATED BY: NAPHATPHURIN PRACHANTASENA</div>
                    <div className="about-links-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                      <a
                        href="https://github.com/Naphatpuurin/AI-Assist-Photo-Culler"
                        target="_blank"
                        rel="noreferrer"
                        className="about-repo-link"
                      >
                        GITHUB: github.com/Naphatpuurin/AI-Assist-Photo-Culler ↗
                      </a>
                      <button
                        type="button"
                        className="updater-inline-btn"
                        style={{ marginLeft: 0, padding: '4px 9px', fontSize: '10.5px' }}
                        onClick={openSplashPreview}
                        title="Display the 750x500 Studio Splash Screen"
                      >
                        🎴 VIEW SPLASH SCREEN
                      </button>
                    </div>
                  </div>
                </div>

                <div className="about-spec-grid">
                  <div className="about-spec-box">
                    <div className="spec-label">01 // NEURAL SHARPNESS &amp; EYE FOCUS</div>
                    <div className="spec-desc">
                      High-frequency Laplacian variance isolated strictly within detected person &amp; eye bounding boxes. Shallow depth-of-field background bokeh ($f/1.2$–$f/2.8$) never degrades score.
                    </div>
                  </div>
                  <div className="about-spec-box">
                    <div className="spec-label">02 // PURE THRESHOLD CULLING (1–10 SCALE)</div>
                    <div className="spec-desc">
                      Deterministic evaluation calibrated on real event shoots. Level 5 balanced baseline delivers a proven ~38–40% keeper rate without artificial percentile penalties.
                    </div>
                  </div>
                  <div className="about-spec-box">
                    <div className="spec-label">03 // HARDWARE MATRIX ACCELERATION</div>
                    <div className="spec-desc">
                      OpenCV OpenCL UMat GPU pipeline (NVIDIA GeForce RTX 5060 / 40 / 30 series) + ONNX Runtime DirectML with transparent multi-core CPU fallback.
                    </div>
                  </div>
                  <div className="about-spec-box">
                    <div className="spec-label">04 // 22+ RAW FORMATS &amp; ACR 16.0</div>
                    <div className="spec-desc">
                      Canon CR2/CR3, Nikon NEF, Sony ARW, Fuji RAF, Adobe DNG with embedded JPEG previews (10–50ms) and instant `.xmp` sidecar export for Lightroom Classic.
                    </div>
                  </div>
                </div>

                <div className="dialog-actions">
                  <button
                    type="button"
                    className="nr-btn mineral"
                    onClick={() => setAboutTab('settings')}
                  >
                    <span>STUDIO SETTINGS</span>
                    <span>[SETTINGS]</span>
                  </button>
                  <button
                    type="button"
                    className="nr-btn"
                    onClick={() => setShowAboutModal(false)}
                  >
                    <span>CLOSE</span>
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
                <span className="update-badge-pill">UPDATE NOTIFICATION</span>
                <span className="update-title-text">
                  {updateState === 'downloading'
                    ? 'PULLING RELEASE PACKAGE...'
                    : updateState === 'installed'
                    ? 'INSTALLER LAUNCHED'
                    : 'NEW PRODUCTION RELEASE AVAILABLE'}
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
                      <span className="meta-label">RELEASE TAG:</span>
                      <span className="meta-value tag-name">{updateInfo.tag_name || `v${updateInfo.latest_version}`}</span>
                    </div>
                    <div className="update-meta-row">
                      <span className="meta-label">RELEASE NAME:</span>
                      <span className="meta-value">{updateInfo.release_name || 'Production Studio Release'}</span>
                    </div>
                    {updateInfo.published_at && (
                      <div className="update-meta-row">
                        <span className="meta-label">PUBLISHED:</span>
                        <span className="meta-value">{new Date(updateInfo.published_at).toLocaleString()}</span>
                      </div>
                    )}
                    {updateInfo.asset && (
                      <div className="update-meta-row">
                        <span className="meta-label">PACKAGE:</span>
                        <span className="meta-value package-name">
                          {updateInfo.asset.name} ({(updateInfo.asset.size / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Release Notes */}
                  <div className="update-notes-container">
                    <div className="update-notes-head">
                      <span>01 // RELEASE NOTES &amp; CHANGELOG</span>
                      <a
                        href={updateInfo.html_url || `https://github.com/Naphatpuurin/AI-Assist-Photo-Culler/releases`}
                        target="_blank"
                        rel="noreferrer"
                        className="view-github-link"
                      >
                        VIEW ON GITHUB ↗
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
                      <div className="btn-title">1. SKIP UPDATES</div>
                      <div className="btn-sub">Never remind me for v{updateInfo.latest_version}</div>
                    </button>

                    <button
                      type="button"
                      className="update-action-btn btn-remind"
                      onClick={handleRemindLater}
                      title="Dismiss for now and remind next session"
                    >
                      <div className="btn-title">2. REMIND ME LATER</div>
                      <div className="btn-sub">Snooze prompt for this session</div>
                    </button>

                    <button
                      type="button"
                      className="update-action-btn btn-update"
                      onClick={handleStartUpdate}
                      title="Download package and launch installer"
                    >
                      <div className="btn-title">3. UPDATE</div>
                      <div className="btn-sub">Pull from GitHub &amp; install now ➔</div>
                    </button>
                  </div>
                </div>
              )}

              {updateState === 'downloading' && (
                <div className="update-progress-view">
                  <div className="progress-banner">
                    <div className="pulse-dot"></div>
                    <span className="progress-status-txt">
                      PULLING LATEST RELEASE FROM GITHUB REPOSITORIES...
                    </span>
                  </div>

                  <div className="download-target-info">
                    <span>TARGET PACKAGE: <strong>{updaterProgress.filename || updateInfo.asset?.name || 'Installer'}</strong></span>
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
                      TRANSFER SPEED: {updaterProgress.speed_mbps || 0} MB/s
                    </span>
                  </div>

                  <div className="download-info-cue">
                    The installer will automatically unpack into a temporary directory and launch as soon as the download finishes.
                  </div>
                </div>
              )}

              {updateState === 'installed' && (
                <div className="update-complete-view">
                  <div className="complete-banner">
                    <span className="check-icon">✓</span>
                    <div className="complete-text">
                      <h3>INSTALLER LAUNCHED SUCCESSFULLY</h3>
                      <p>
                        The setup wizard for <strong>{updaterProgress.filename || updateInfo.asset?.name || 'MicMose Photo Culler Pro'}</strong> is running.
                      </p>
                      <p className="complete-sub">
                        Please exit this running instance to allow the installer to replace binary files without file locks.
                      </p>
                    </div>
                  </div>

                  <div className="complete-actions">
                    <button
                      type="button"
                      className="nr-btn vermilion"
                      onClick={handleQuitApp}
                    >
                      <span>EXIT &amp; CLOSE APP TO COMPLETE UPDATE</span>
                      <span>[EXIT NOW ✕]</span>
                    </button>
                    <button
                      type="button"
                      className="nr-btn"
                      onClick={() => setShowUpdateModal(false)}
                    >
                      <span>KEEP RUNNING &amp; CLOSE DIALOG</span>
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
                      <h3>UPDATE DOWNLOAD FAILED</h3>
                      <p>{updateError || 'An error occurred while pulling the update package.'}</p>
                    </div>
                  </div>

                  <div className="error-actions">
                    <button
                      type="button"
                      className="nr-btn mineral"
                      onClick={handleStartUpdate}
                    >
                      <span>RETRY DOWNLOAD</span>
                      <span>[RETRY ⟳]</span>
                    </button>
                    <a
                      href={updateInfo.html_url || `https://github.com/Naphatpuurin/AI-Assist-Photo-Culler/releases`}
                      target="_blank"
                      rel="noreferrer"
                      className="nr-btn"
                      style={{ textDecoration: 'none', display: 'inline-flex' }}
                    >
                      <span>DOWNLOAD FROM GITHUB IN BROWSER</span>
                      <span>[BROWSER ↗]</span>
                    </a>
                    <button
                      type="button"
                      className="nr-btn"
                      onClick={() => setShowUpdateModal(false)}
                    >
                      <span>CLOSE</span>
                      <span>[ESC]</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Studio Splash / Loading Screen (750x500 Dynamic Scaling) */}
      {showSplash && (
        <div
          className={`splash-backdrop ${splashFading ? 'fading-out' : ''}`}
          role="dialog"
          aria-modal="true"
          onClick={dismissSplash}
        >
          <div className="splash-card" onClick={(e) => e.stopPropagation()}>
            {isSplashManualPreview && (
              <button
                type="button"
                className="splash-close-btn"
                onClick={dismissSplash}
                title="Close Splash Screen [ESC]"
              >
                ESC ✕
              </button>
            )}

            {/* Left Column: Branding, Live Telemetry & Contributor Credits */}
            <div className="splash-left">
              <div className="splash-header-row">
                <div className="splash-app-badge">
                  <span className="splash-badge-text">MPC</span>
                </div>
                <div className="splash-title-wrap">
                  <div className="splash-title">MicMose Photo Culler Pro</div>
                  <div className="splash-subtitle">Studio Culling Workstation</div>
                </div>
              </div>

              <div className="splash-meta-block">
                <div className="splash-copy">
                  &copy; 2026 Naphatphurin Prachantasena. All rights reserved.
                </div>
                <div className="splash-artwork-attribution">
                  Featured Cover: <strong>&ldquo;Ethereal Woodland&rdquo;</strong> &bull; MicMose Studio Archive
                </div>

                {/* Live Loading Status & Telemetry Bar */}
                <div className="splash-status-area">
                  <div className="splash-status-row">
                    <div className="splash-status-dot"></div>
                    <span className="splash-status-text">{splashStatusText}</span>
                  </div>
                  <div className="splash-progress-track">
                    <div
                      className="splash-progress-bar"
                      style={{ width: `${Math.max(6, splashProgress)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Contributor Credits Block */}
                <div className="splash-credits-block">
                  <div className="splash-credits-line">
                    <span>Architecture &amp; AI:</span> Naphatphurin Prachantasena
                  </div>
                  <div className="splash-credits-line">
                    <span>Neural Detection:</span> YOLOv8 ONNX Runtime DirectML
                  </div>
                  <div className="splash-credits-line">
                    <span>Focus Isolation:</span> High-Frequency Laplacian Variance (Bokeh-Safe)
                  </div>
                  <div className="splash-credits-line">
                    <span>RAW &amp; Telemetry:</span> Adobe Camera Raw 16.0 XMP Architecture
                  </div>
                  <div className="splash-credits-line">
                    <span>Dedicated to:</span> Professional Event &amp; Portrait Photographers
                  </div>
                </div>
              </div>

              {/* Bottom Brand Bar */}
              <div className="splash-bottom-row">
                <div className="splash-studio-brand">
                  <img src={logoRegular} alt="Studio Emblem" className="splash-brand-logo" />
                  <span className="splash-brand-name">MicMose Creative Studio</span>
                </div>
                <div className="splash-dismiss-hint">
                  {splashProgress >= 100 ? '[CLICK TO CONTINUE]' : 'v1.0.4 // BUILD 104'}
                </div>
              </div>
            </div>

            {/* Right Column: Featured Photograph */}
            <div className="splash-right" onClick={dismissSplash}>
              <div className="splash-photo-wrap">
                <img
                  src={splashCover}
                  alt="Featured Cover Artwork"
                  className="splash-photo-img"
                />
                <div className="splash-photo-overlay"></div>
                <div className="splash-telemetry-pill">
                  &bull; Naphatphurin Prachantasena &bull; 85mm f/1.4 &bull; ISO 100
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
