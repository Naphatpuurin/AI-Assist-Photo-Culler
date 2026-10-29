# CLAUDE.md — Architecture, Security Audit & Engineering Roadmap

This document serves as the architectural overview, critical system audit, operational guide, and improvement roadmap for **MicMose Photo Culler Pro**.

---

## 1. Project Overview & Architecture

**MicMose Photo Culler Pro** is an offline, AI-assisted photo culling and telemetric inspection desktop application designed for wedding, portrait, and commercial photographers.

### Tech Stack
- **Frontend**: React 19.2, Vite 8.1, Vanilla CSS (Dark Obsidian `#11120F` & White Chalk `#F4F3EE` themes).
- **Backend API**: FastAPI 0.110+, Uvicorn, Python 3.11+.
- **Desktop Shell**: `pywebview` (Edge WebView2 on Windows, WebKit on macOS, WebKitGTK / Qt on Linux).
- **Computer Vision & Matrix Core**: OpenCV (`cv2.UMat` OpenCL GPU acceleration), NumPy.
- **Machine Learning**: ONNX Runtime (DirectML on Windows, CUDA on Linux, CPU multithreaded fallback), YOLOv8n ONNX subject detector (`yolov8n.onnx`).
- **RAW & Metadata**: `rawpy` (LibRaw bindings), `exifread`, Adobe Camera Raw (ACR 16.0) `.xmp` sidecar generator.

---

## 2. System Review & Critical Evaluation

### 🚨 High-Priority Security & Robustness Concerns

1. **Unrestricted Local API Origin (`allow_origins=["*"]`)**:
   - **Issue**: `backend/main.py` binds FastAPI with wildcard CORS (`allow_origins=["*"]`) on static port `localhost:8000`.
   - **Risk**: Any website open in the user's web browser could invoke local API endpoints (e.g. `/api/scan_directory`, `/api/select_folder`, or `/api/updater/*`) and inspect file systems or trigger downloads.
   - **Fix**: Require a transient session token generated at application boot and passed via HTTP headers, and bind to an ephemeral or verified port.

2. **Unverified Auto-Updater Downloads**:
   - **Issue**: The auto-updater pulls release binaries directly from GitHub Releases and launches them without verifying cryptographic checksums.
   - **Risk**: Compromised network, spoofed API response, or corrupted downloads could execute untrusted or broken executables.
   - **Fix**: Pull `SHA256SUMS.txt` from the release payload, compute the local SHA-256 hash of the downloaded binary before launching, and abort if hashes do not match.

3. **Hardcoded Port Collision**:
   - **Issue**: The server attempts to bind strictly to port `8000`. If another process is using port 8000, startup fails.
   - **Fix**: Implement automatic fallback port scanning (`8000` ➔ `8001` ➔ `8002`...) or dynamic port discovery passed to `webview.create_window`.

### 📦 Platform & Distribution Reality Check

1. **Linux Runtime Verification**:
   - GitHub Actions CI compiles and packages the Linux AppImage and `.deb` packages cleanly, but Linux distributions with differing GLIBC versions or systems lacking `libwebkit2gtk-4.0` / `libwebkit2gtk-4.1` may fail to render `pywebview` unless system dependencies are present.
   - Linux releases should be monitored and tested across clean VM instances (Ubuntu, Fedora, Arch) before being marked as Tier-1 production ready.

2. **Code Signing Caveats**:
   - **Windows**: Signed with a local studio Authenticode certificate (`CN=MicMose Photo Culler Pro`). Because it is self-signed, Windows SmartScreen will display an *"Unrecognized app"* prompt until cloud download reputation is built. An Azure Trusted Signing or EV certificate is required to bypass SmartScreen entirely.
   - **macOS**: Signed binaries require Apple Developer ID and `notarytool` notarization to avoid Gatekeeper quarantine flags on fresh installations.

3. **Dependency & Bundle Bloat**:
   - `backend/requirements.txt` still includes `torch>=2.2.0` and `ultralytics>=8.1.0`. While PyInstaller excludes them during build, local development environments download ~2GB of redundant wheels.
   - The production app runs purely on ONNX Runtime (`onnxruntime`), so `torch` and `ultralytics` can be safely removed or moved to optional training requirements.

4. **Frontend Architecture**:
   - `frontend/src/App.jsx` currently houses ~2,300 lines of code in a single component. Sub-components (Gallery grid, Loupe view, Telemetry inspector, Settings modal, Updater modal) should be modularized to reduce regression risk.

---

## 3. Engineering Roadmap

### Phase 1: Security & Stability Hardening
- [ ] **CSRF & Local Origin Protection**:
  - Generate an authorization secret token on backend start.
  - Inject the secret into frontend environment or window bridge.
  - Validate token on all stateful/file-system backend endpoints.
- [ ] **Cryptographic Update Verification**:
  - Download and parse `SHA256SUMS.txt` during update checks.
  - Validate downloaded asset hash before executing `subprocess.Popen` / `xdg-open`.
- [ ] **Dynamic Port Selection**:
  - Find an available local port dynamically and supply it to the WebView.
- [ ] **Single Source of Truth Versioning**:
  - Define `VERSION = "1.0.6"` in a single configuration file (`version.json` or `pyproject.toml`) and propagate automatically during build.

### Phase 2: Performance & Build Streamlining
- [ ] **Trim Requirements**: Remove unused PyTorch/Ultralytics from core `backend/requirements.txt`.
- [ ] **Frontend Component Decomposition**:
  - Split `App.jsx` into `src/components/GalleryView.jsx`, `src/components/LoupeView.jsx`, `src/components/InspectorRail.jsx`, `src/components/SettingsModal.jsx`, and `src/components/UpdaterModal.jsx`.
- [ ] **Directory-based Distribution Evaluation (`--onedir`)**:
  - Investigate directory builds to improve initial cold launch times compared to one-file extraction overhead.
- [ ] **Automated Regression Test Suite**:
  - Add pytest suite testing RAW decoding, EXIF parsing, and Laplacian variance consistency against fixed reference images.

### Phase 3: High-Value Photographer Capabilities
- [ ] **Burst Photo Grouping**:
  - Cluster photos taken within seconds of each other into collapsible burst sequences.
  - Automatically highlight the sharpest frame within each burst.
- [ ] **Closed-Eye & Blink Detection**:
  - Detect facial landmarks within eye bounding boxes to flag closed eyes or mid-blink shots.
- [ ] **Multi-Image Side-by-Side Comparison**:
  - Compare 2 to 4 candidates simultaneously with synchronized pan and 100% loupe zoom.
- [ ] **Catalog Analysis Cache**:
  - Persist analysis results in a local SQLite database or `.cullcache` file so re-opening folders loads instantly without re-processing.
- [ ] **Lightroom Color Label Mapping**:
  - Add red/yellow/green/blue/purple color label triggers (<kbd>6</kbd>–<kbd>9</kbd>) matching Lightroom Classic shortcuts.

---

## 4. Build & Release Instructions

### Build Environment
- **Node.js**: 20+
- **Python**: 3.11+
- **Windows Packaging**: Inno Setup 6 (`ISCC.exe`), WiX Toolset v7 (`wix.exe`), Windows SDK `signtool.exe`.

### Commands
```bash
# Frontend
cd frontend
npm install
npm run build

# Windows Standalone & Installers
cd ../backend
.\venv\Scripts\python.exe -m PyInstaller ImageCullerAI.spec --clean --noconfirm
Copy-Item "dist\MicMosePhotoCullerPro.exe" -Destination "..\release\MicMose Photo Culler Pro.exe" -Force
& "C:\Users\Napha\AppData\Local\Programs\Inno Setup 6\ISCC.exe" installer.iss
& "C:\Program Files\WiX Toolset v7.0\bin\wix.exe" build product.wxs -o ..\release\MicMose-Photo-Culler-Pro.msi
& ".\sign_all.ps1"

# Cross-Platform CI (macOS & Linux)
# Automated on git push with release tag (e.g. v1.0.6):
# - .github/workflows/build-macos.yml -> Packages macOS .dmg
# - .github/workflows/build-linux.yml -> Packages Linux .AppImage, .deb, and .tar.gz
```

---

## 5. Coding Conventions

- **Visual Tone**: Professional editorial workstation aesthetics. Dark Obsidian `#11120F` default, White Chalk `#F4F3EE` daylight theme.
- **Pure-Threshold Philosophy**: Images are judged strictly on individual technical merits (focus, exposure range, eye sharpness) on a calibrated 1–10 scale without forced percentile quotas.
- **Non-Destructive Workflows**: Original RAW and JPEG assets are strictly read-only; all ratings and edits are written exclusively to standard Adobe Camera Raw 16.0 `.xmp` sidecar files.
- **Privacy First**: Zero external telemetry, zero tracking, 100% offline local processing.
