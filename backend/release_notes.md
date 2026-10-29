# MicMose Photo Culler Pro v1.0.6 (Build 106) — Cross-Platform Release (Windows, macOS & Linux)

High-throughput, AI-assisted photo culling & telemetric inspection studio built for wedding, portrait, and commercial photographers.

### 📦 Available Release Packages

#### 🐧 Linux (All Distributions)
- **`MicMose-Photo-Culler-Pro-x86_64.AppImage`** — Universal double-clickable Linux AppImage (Ubuntu, Debian, Fedora, Arch, Mint, Pop!_OS, openSUSE). Runs standalone without installation.
- **`MicMose-Photo-Culler-Pro_1.0.6_amd64.deb`** — Native Debian / Ubuntu / Mint package with system desktop shortcut & application menu icon (`sudo dpkg -i MicMose-Photo-Culler-Pro_1.0.6_amd64.deb`).
- **`MicMose-Photo-Culler-Pro-Linux-x86_64.tar.gz`** — Portable Linux tarball archive with standalone launcher script (`./run.sh`).

#### 🍏 macOS (Apple Silicon & Intel)
- **`MicMose-Photo-Culler-Pro-macOS.dmg`** — Native Apple Silicon (M1/M2/M3/M4) & Intel macOS disk image installer.

#### 🪟 Windows (x64)
- **`MicMose Photo Culler Pro.exe`** — Portable standalone Windows application. Run directly anywhere without installation.
- **`MicMose-Photo-Culler-Pro-Setup.exe`** — Themed Windows Setup Wizard installer with Start Menu and Desktop shortcuts.
- **`MicMose-Photo-Culler-Pro.msi`** — Native Windows Installer database for enterprise distribution and silent deployment (`msiexec /i MicMose-Photo-Culler-Pro.msi /qn`).
- **`MicMoseStudio.cer`** — Official Studio Authenticode public certificate for publisher verification.

#### 🔒 Verification
- **`SHA256SUMS.txt`** — SHA-256 cryptographic checksums for all release packages.

---

### ⚡ What's New in v1.0.6 (Build 106)

- **🐧 Comprehensive Linux Support**:
  - Full native support for Ubuntu, Debian, Fedora, Arch Linux, Linux Mint, and all standard distributions.
  - Formatted into universal **AppImage**, **Debian (`.deb`)**, and **Portable Tarball (`.tar.gz`)**.
  - Integrated NVIDIA **CUDA GPU** acceleration (`CUDAExecutionProvider`) on Linux workstations with transparent CPU thread-pool fallback.
  - Native Linux folder picker and `xdg-open` update deployment handler.
- **🎨 White Chalk Theme Polish**:
  - Refined daylight theme label to **White Chalk** (`☀ WHITE CHALK`) across both the top bar quick toggle and Settings options grid.
  - Paired cleanly with **Dark Graphite** (`☾ DARK GRAPHITE`).
- **📐 Minimalist Identity Header Layout**:
  - Removed repetitive application title, logo, and tagline next to the native window title bar.
  - Dedicated, centered **`⚙ SETTINGS`** button provides clean, distraction-free access to studio parameters.
- **🔄 Streamlined In-App Software Updates**:
  - Direct 1-click GitHub check and auto-pulling matching your exact operating system (Windows, macOS, or Linux).
  - 3-button cue-sheet modal: **1. Skip updates**, **2. Remind me later**, and **3. Update**.
- **🔏 Authenticode Code Signing**: Digitally signed all Windows binaries with SHA-256 and RFC 3161 DigiCert timestamping.

---

### ⚡ Core Capabilities

- **🎯 Calibrated Pure-Threshold Culling (Level 1–10 Scale)**: Evaluates each image on its individual technical merits. Balanced Level 5 baseline reliably selects ~38–40% keepers on typical event rolls (~236 keeps out of 640 shots).
- **👁️ Neural Subject & Eye Focus Isolation**: High-frequency Laplacian variance computed exclusively within detected subject & eye bounding boxes (bokeh-safe).
- **📷 22+ Camera RAW Formats**: Native decoding for Canon (`.CR2`, `.CR3`), Nikon (`.NEF`, `.NRW`), Sony (`.ARW`), Fuji (`.RAF`), Panasonic (`.RW2`), Olympus (`.ORF`), Pentax (`.PEF`), Adobe (`.DNG`), plus high-res JPEGs and TIFFs.
- **⚡ Embedded Preview Acceleration**: Extracts manufacturer embedded full-resolution previews (10–50 ms/frame), matching Adobe Lightroom's *"Embedded & Sidecar"* workflow.
- **📊 Full Shooting Telemetry & ACR 16.0**: Displays Camera Model, Lens, Shutter Speed, Aperture, ISO, Focal Length, Date/Time, and Artist attribution. Exports industry-standard `.xmp` sidecars with `crs:Rating` and `crs:ProcessVersion="16.0"` for seamless Lightroom Classic sync.
- **🚀 Hybrid Parallel Hardware Acceleration**:
  - OpenCV OpenCL UMat matrix pipeline across GPU devices.
  - DirectML on Windows / CUDA on Linux for neural subject detection.
  - Transparent multi-core CPU thread-pool fallback.
- **🔒 100% Offline & Private**: Zero external telemetry. All photo analysis runs 100% locally on your machine.
