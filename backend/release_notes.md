# MicMose Photo Culler Pro v1.0.2 (Build 102) — Dual Windows & macOS Production Release

High-throughput, AI-assisted photo culling & telemetric inspection studio built for wedding, portrait, and commercial photographers.

### 📦 Available Release Packages

- **`MicMose-Photo-Culler-Pro-macOS.dmg`** (127.3 MB) — Native Apple Silicon (M1/M2/M3/M4) & Intel macOS disk image installer.
- **`MicMose Photo Culler Pro.exe`** (127.4 MB) — Portable standalone Windows application. Run directly anywhere without installation.
- **`MicMose-Photo-Culler-Pro-Setup.exe`** (128.8 MB) — Themed Windows Setup Wizard installer with Start Menu and Desktop shortcuts.
- **`MicMose-Photo-Culler-Pro.msi`** (126.8 MB) — Native Windows Installer database for enterprise distribution and silent deployment (`msiexec /i MicMose-Photo-Culler-Pro.msi /qn`).
- **`MicMoseStudio.cer`** — Official Studio Authenticode public certificate for publisher verification.
- **`SHA256SUMS.txt`** — SHA-256 cryptographic checksums for release verification.

---

### ⚡ What's New in v1.0.2 (Build 102)

- **🍏 Official macOS Release (`.dmg`)**: First native macOS release with Apple Silicon M-series & Intel support, packaged as an interactive `.dmg` disk image with retina icon integration.
- **🎨 Calibrated Chalk Palette (`#F4F3EE`)**: Calibrated daylight Chalk mode across all panels to warm non-glare `#F4F3EE` paper tone.
- **📷 Harmonized Studio Aperture Emblem**: Seamlessly re-themed the studio mark into exact theme colors (Mineral Blue `#275D63`, Signal Vermilion `#E54C35`, Chalk `#F4F3EE`, Obsidian `#11120F`) with clean transparency.
- **🎛️ Far-Left Settings Button**: Dedicated **`[ ⚙ SETTINGS ]`** button placed on the far left edge of the identity bar for quick access to theme switching, live GPU telemetry, and keyboard shortcuts.
- **🔏 Authenticode Code Signing**: Digitally signed all Windows release packages with SHA-256 and RFC 3161 DigiCert timestamping.

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
- **🔒 100% Offline & Private**: Zero external network calls. All processing runs locally on your device.
