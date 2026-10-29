# MicMose Photo Culler Pro v1.0.4 (Build 104) — Studio Splash Loading Screen & In-App Updates

High-throughput, AI-assisted photo culling & telemetric inspection studio built for wedding, portrait, and commercial photographers.

### 📦 Available Release Packages

- **`MicMose-Photo-Culler-Pro-macOS.dmg`** — Native Apple Silicon (M1/M2/M3/M4) & Intel macOS disk image installer.
- **`MicMose Photo Culler Pro.exe`** — Portable standalone Windows application. Run directly anywhere without installation.
- **`MicMose-Photo-Culler-Pro-Setup.exe`** — Themed Windows Setup Wizard installer with Start Menu and Desktop shortcuts.
- **`MicMose-Photo-Culler-Pro.msi`** — Native Windows Installer database for enterprise distribution and silent deployment (`msiexec /i MicMose-Photo-Culler-Pro.msi /qn`).
- **`MicMoseStudio.cer`** — Official Studio Authenticode public certificate for publisher verification.
- **`SHA256SUMS.txt`** — SHA-256 cryptographic checksums for release verification.

---

### ⚡ What's New in v1.0.4 (Build 104)

- **🎴 750 × 500 Studio Splash Loading Screen**:
  - Exact 750 × 500 px native proportions with responsive dynamic scaling to any display size or DPI scaling.
  - Styled after professional photography workstations (Lightroom Classic aesthetic) with dual-column layout.
  - Live animated boot telemetry (DirectML, OpenCL GPU matrix, neural focus detectors, ACR 16.0 engine calibration).
  - High-resolution featured cover artwork (*"Ethereal Woodland"* by Naphatphurin Prachantasena).
  - Quick dismiss (<kbd>Esc</kbd> / <kbd>Space</kbd> / Click) and on-demand inspection from Studio Settings & About modal.
- **🔄 Built-In Auto-Updater System**:
  - Automatic background update checks on launch with 3-button cue-sheet modal: **1. Skip updates**, **2. Remind me later**, and **3. Update**.
  - Direct package pulling with real-time transfer progress and speed telemetry.
- **🔏 Authenticode Code Signing**: Digitally signed all Windows binaries with SHA-256 and RFC 3161 DigiCert timestamping.
- **🍏 Native macOS Apple Silicon & Intel DMG**: Automated macOS packaging pipeline via GitHub Actions runners.
- **🎨 Calibrated Chalk Mode (`#F4F3EE`) & Obsidian Dark Studio Theme**: Pure high-precision color fidelity for studio darkrooms and location laptop inspections.

---

### ⚡ Core Capabilities

- **🎯 Calibrated Pure-Threshold Culling (Level 1–10 Scale)**: Evaluates each image on its individual technical merits. Balanced Level 5 baseline reliably selects ~38–40% keepers on typical event rolls (~236 keeps out of 640 shots).
- **👁️ Neural Subject & Eye Focus Isolation**: High-frequency Laplacian variance computed exclusively within detected subject & eye bounding boxes (bokeh-safe).
- **📷 22+ Camera RAW Formats**: Native decoding for Canon (`.CR2`, `.CR3`), Nikon (`.NEF`, `.NRW`), Sony (`.ARW`), Fuji (`.RAF`), Panasonic (`.RW2`), Olympus (`.ORF`), Pentax (`.PEF`), Adobe (`.DNG`), plus high-res JPEGs and TIFFs.
- **⚡ Embedded Preview Acceleration**: Extracts manufacturer embedded full-resolution previews (10–50 ms/frame), matching Adobe Lightroom's *"Embedded & Sidecar"* workflow.
- **📊 Full Shooting Telemetry & ACR 16.0**: Displays Camera Model, Lens, Shutter Speed, Aperture, ISO, Focal Length, Date/Time, and Artist attribution. Exports industry-standard `.xmp` sidecars with `crs:Rating` and `crs:ProcessVersion="16.0"` for seamless Lightroom Classic sync.
- **🚀 Hybrid Parallel Hardware Acceleration**:
  - OpenCV OpenCL UMat matrix pipeline on NVIDIA RTX GPUs.
  - ONNX Runtime DirectML for neural subject detection.
  - Transparent multi-core CPU thread-pool fallback.
- **🔒 100% Offline & Private**: Zero external telemetry. All photo analysis runs 100% locally on your machine.
