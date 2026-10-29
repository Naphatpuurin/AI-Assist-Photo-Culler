# MicMose Photo Culler Pro v1.0.3 (Build 103) — Automatic In-App Updates & Production Release

High-throughput, AI-assisted photo culling & telemetric inspection studio built for wedding, portrait, and commercial photographers.

### 📦 Available Release Packages

- **`MicMose-Photo-Culler-Pro-macOS.dmg`** — Native Apple Silicon (M1/M2/M3/M4) & Intel macOS disk image installer.
- **`MicMose Photo Culler Pro.exe`** — Portable standalone Windows application. Run directly anywhere without installation.
- **`MicMose-Photo-Culler-Pro-Setup.exe`** — Themed Windows Setup Wizard installer with Start Menu and Desktop shortcuts.
- **`MicMose-Photo-Culler-Pro.msi`** — Native Windows Installer database for enterprise distribution and silent deployment (`msiexec /i MicMose-Photo-Culler-Pro.msi /qn`).
- **`MicMoseStudio.cer`** — Official Studio Authenticode public certificate for publisher verification.
- **`SHA256SUMS.txt`** — SHA-256 cryptographic checksums for release verification.

---

### ⚡ What's New in v1.0.3 (Build 103)

- **🔄 Built-In Auto-Updater with 3-Option Modal**: Automatic background update checking on launch, featuring:
  - **1. Skip updates**: Persists skipped version to `localStorage` so you won't be prompted again for that specific release.
  - **2. Remind me later**: Snoozes notification for the active session and checks again on next launch.
  - **3. Update**: Downloads the platform installer directly from GitHub Releases with live download progress, transfer speed (MB/s), and automatic setup launcher.
- **🎛️ Dedicated Updates Section in Settings**: Added **`04 // SOFTWARE UPDATES & RELEASE CHANNEL`** in Studio Settings for on-demand update checks and skipped release reset.
- **🍏 Automated macOS DMG Build Pipeline**: Native Apple Silicon & Intel build verified via GitHub Actions.
- **🔏 Authenticode Code Signing**: Digitally signed all Windows release packages with SHA-256 and RFC 3161 DigiCert timestamping.
- **🎨 Warm Chalk Mode (`#F4F3EE`)**: Calibrated daylight Chalk mode across all panels to warm non-glare paper tone.

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
