# MicMose Photo Culler Pro v1.0.0 — Production Studio Release

High-throughput, AI-assisted photo culling & telemetric inspection studio built for wedding, portrait, and commercial photographers.

### 📦 Available Release Packages

- **`MicMose Photo Culler Pro.exe`** (127.9 MB) — Portable standalone application. Run directly anywhere without installation.
- **`MicMose-Photo-Culler-Pro-Setup.exe`** (128.5 MB) — Themed Windows Setup Wizard installer with Start Menu and Desktop shortcuts.
- **`MicMose-Photo-Culler-Pro.msi`** (126.5 MB) — Native Windows Installer database for enterprise distribution and silent deployment (`msiexec /i MicMose-Photo-Culler-Pro.msi /qn`).
- **`SHA256SUMS.txt`** — SHA-256 cryptographic checksums for release verification.

---

### ⚡ Highlights & Key Capabilities

- **🎯 Calibrated Pure-Threshold Culling (Level 1–10 Scale)**: Evaluates each image on its individual technical merits. Balanced Level 5 baseline reliably selects ~38–40% keepers on typical event rolls (~236 keeps out of 640 shots).
- **👁️ Neural Subject & Eye Focus Isolation**: High-frequency Laplacian variance computed exclusively within detected subject & eye bounding boxes (bokeh-safe).
- **📷 22+ Camera RAW Formats**: Native decoding for Canon (`.CR2`, `.CR3`), Nikon (`.NEF`, `.NRW`), Sony (`.ARW`), Fuji (`.RAF`), Panasonic (`.RW2`), Olympus (`.ORF`), Pentax (`.PEF`), Adobe (`.DNG`), plus high-res JPEGs and TIFFs.
- **⚡ Embedded Preview Acceleration**: Extracts manufacturer embedded full-resolution previews (10–50 ms/frame), matching Adobe Lightroom's *"Embedded & Sidecar"* workflow.
- **📊 Full Shooting Telemetry & ACR 16.0**: Displays Camera Model, Lens, Shutter Speed, Aperture, ISO, Focal Length, Date/Time, and Artist attribution. Exports industry-standard `.xmp` sidecars with `crs:Rating` and `crs:ProcessVersion="16.0"` for seamless Lightroom Classic sync.
- **🚀 Hybrid Parallel Hardware Acceleration**:
  - OpenCV OpenCL UMat matrix pipeline on NVIDIA RTX GPUs.
  - ONNX Runtime DirectML for neural subject detection.
  - Transparent multi-core CPU thread-pool fallback.
- **🎛️ Dedicated Top-Left Studio Settings & About Hub**: Dedicated button on the far left for instant access to workstation preferences, hardware telemetry, and neural culling specifications.
- **🔒 100% Offline & Private**: Zero external network calls. All processing runs locally on your device.
