# MicMose Photo Culler Pro v1.0.7 (Build 107) — Cross-Platform Release (Windows, macOS & Linux)

High-throughput, AI-assisted photo culling & telemetric inspection studio built for wedding, portrait, and commercial photographers.

### 📦 Available Release Packages

#### 🐧 Linux (All Distributions)
- **`MicMose-Photo-Culler-Pro-x86_64.AppImage`** — Universal double-clickable Linux AppImage (Ubuntu, Debian, Fedora, Arch, Mint, Pop!_OS, openSUSE). Runs standalone without installation.
- **`MicMose-Photo-Culler-Pro_1.0.7_amd64.deb`** — Native Debian / Ubuntu / Mint package with system desktop shortcut & application menu icon (`sudo dpkg -i MicMose-Photo-Culler-Pro_1.0.7_amd64.deb`).
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

### ⚡ What's New in v1.0.7 (Build 107)

- **🇹🇭 Bilingual Localization & Noto Sans Thai Support**:
  - Full Thai language support (`ภาษาไทย`) across all views, menus, focus level descriptions (ระดับ 1–10), and culling categories (*คัดเลือก*, *ไฮไลต์*, *พิจารณา*, *คัดทิ้ง*).
  - Elegant **Noto Sans Thai** typography loaded with native OS fallbacks (`Leelawadee UI`, `Thonburi`, `Tahoma`), ensuring zero tonal mark clipping.
  - Dedicated language selector under Studio Settings (`02 // ภาษาการแสดงผล (LANGUAGE)`) and instant header toggle `[ 🇹🇭 ไทย / 🇺🇸 EN ]`.
  - Automatic language preference persistence across application sessions (`localStorage`).
- **🛡️ Hardened Workstation Security**:
  - Ephemeral session authorization token generated on application boot and enforced across all local backend endpoints.
  - Strict localhost CORS policies blocking external browser origins from interacting with the app.
- **🔒 Cryptographic Auto-Update Verification**:
  - Auto-updater streams and verifies SHA-256 cryptographic hashes against `SHA256SUMS.txt` before running any downloaded installer package.
- **🔌 Dynamic Port Discovery**:
  - Automatic socket scanner finds free port if default port 8000 is occupied by another service.
- **🐧 Linux Packaging & CI**:
  - Integrated AppImage, Debian `.deb`, and Portable Tarball builds with CUDA acceleration support.

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
