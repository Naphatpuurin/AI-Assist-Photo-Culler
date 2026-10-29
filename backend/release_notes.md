# MicMose Photo Culler Pro v1.0.6 (Build 106) — Minimalist Workspace & White Chalk Theme

High-throughput, AI-assisted photo culling & telemetric inspection studio built for wedding, portrait, and commercial photographers.

### 📦 Available Release Packages

- **`MicMose-Photo-Culler-Pro-macOS.dmg`** — Native Apple Silicon (M1/M2/M3/M4) & Intel macOS disk image installer.
- **`MicMose Photo Culler Pro.exe`** — Portable standalone Windows application. Run directly anywhere without installation.
- **`MicMose-Photo-Culler-Pro-Setup.exe`** — Themed Windows Setup Wizard installer with Start Menu and Desktop shortcuts.
- **`MicMose-Photo-Culler-Pro.msi`** — Native Windows Installer database for enterprise distribution and silent deployment (`msiexec /i MicMose-Photo-Culler-Pro.msi /qn`).
- **`MicMoseStudio.cer`** — Official Studio Authenticode public certificate for publisher verification.
- **`SHA256SUMS.txt`** — SHA-256 cryptographic checksums for release verification.

---

### ⚡ What's New in v1.0.6 (Build 106)

- **🎨 White Chalk Theme Polish**:
  - Refined theme label to **White Chalk** (`☀ WHITE CHALK`) across both the top bar quick toggle and Settings options grid.
  - Paired cleanly with **Dark Graphite** (`☾ DARK GRAPHITE`).
- **📐 Minimalist Identity Header Layout**:
  - Removed repetitive application title, logo, and tagline next to the native window title bar.
  - Dedicated, centered **`⚙ SETTINGS`** button provides clean, distraction-free access to studio parameters.
- **🔄 Streamlined In-App Software Updates**:
  - Removed development demo preview button; Software Updates section now cleanly provides direct 1-click GitHub check and auto-pulling.
  - 3-button cue-sheet modal: **1. Skip updates**, **2. Remind me later**, and **3. Update**.
- **🔏 Authenticode Code Signing**: Digitally signed all Windows binaries with SHA-256 and RFC 3161 DigiCert timestamping.
- **🍏 Native macOS Apple Silicon & Intel DMG**: Automated macOS packaging pipeline via GitHub Actions runners.

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
