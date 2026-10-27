# MicMose Photo Culler Pro v1.0.1 (Build 101) — Production Studio Release

High-throughput, AI-assisted photo culling & telemetric inspection studio built for wedding, portrait, and commercial photographers.

### 📦 Available Release Packages

- **`MicMose Photo Culler Pro.exe`** — Portable standalone application. Run directly anywhere without installation.
- **`MicMose-Photo-Culler-Pro-Setup.exe`** — Themed Windows Setup Wizard installer with Start Menu and Desktop shortcuts.
- **`MicMose-Photo-Culler-Pro.msi`** — Native Windows Installer database for enterprise distribution and silent deployment (`msiexec /i MicMose-Photo-Culler-Pro.msi /qn`).
- **`MicMoseStudio.cer`** — Official Studio Authenticode public certificate for publisher verification.
- **`SHA256SUMS.txt`** — SHA-256 cryptographic checksums for release verification.

---

### 🛡️ Windows SmartScreen / "Windows Protected Your PC" Notice

Because **MicMose Photo Culler Pro** is an open-source project without a multi-thousand-dollar commercial EV certificate, Microsoft Defender SmartScreen displays a warning on newly downloaded releases until download volume establishes cloud reputation:

1. **How to Run**:
   - On the SmartScreen dialog, click **"More info"**
   - Click **"Run anyway"**
2. **Alternative (PowerShell)**:
   - If running from a downloaded `.zip` or directory, unblock the file:
     ```powershell
     Unblock-File -Path ".\MicMose Photo Culler Pro.exe"
     ```
3. **Digital Signature Verification**:
   - Right-click the `.exe` or `.msi` ➔ **Properties** ➔ **Digital Signatures** to verify the Authenticode signature by `MicMose Photo Culler Pro` (Naphatphurin Prachantasena) timestamped by DigiCert.

---

### ⚡ What's New in v1.0.1 (Build 101)

- **🎛️ Far-Left Settings Button**: Moved the dedicated **`[ ⚙ SETTINGS ]`** button to the far left edge of the identity bar for instant access to workstation theme options, hardware telemetry, and keyboard shortcuts.
- **📷 Aperture Studio Emblem as Default**: Locked the official camera aperture studio emblem as the permanent default logo across the application executable icon, header bar, and about modal.
- **🧹 Removed Meme Switcher**: Completely removed the troll logo and its toggle switcher.
- **🔏 Authenticode Code Signing**: Digitally signed all release binaries with SHA-256 and RFC 3161 DigiCert timestamping.
- **🎨 High-Contrast Settings & About UI**: Redesigned dialog featuring dark graphite theming, high-contrast typography, live GPU telemetry, and quick theme switcher.

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
