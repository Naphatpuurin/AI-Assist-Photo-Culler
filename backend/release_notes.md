# MicMose Photo Culler Pro v1.1.0 (Build 110) — Feature Release (Windows, macOS & Linux)

High-throughput, AI-assisted photo culling & telemetric inspection studio built for wedding, portrait, and commercial photographers.

### 📦 Available Release Packages

#### 🐧 Linux (All Distributions)
- **`MicMose-Photo-Culler-Pro-x86_64.AppImage`** — Universal double-clickable Linux AppImage (Ubuntu, Debian, Fedora, Arch, Mint, Pop!_OS, openSUSE). Runs standalone without installation.
- **`MicMose-Photo-Culler-Pro_1.1.0_amd64.deb`** — Native Debian / Ubuntu / Mint package with system desktop shortcut & application menu icon (`sudo dpkg -i MicMose-Photo-Culler-Pro_1.1.0_amd64.deb`).
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

### 🚀 What's New in v1.1.0 (Build 110)

- **⚡ 1. Burst Photo Grouping & Hero Frame Selection**:
  - Automatically clusters high-speed sequences within dynamic time windows ($\Delta t \le 1.5$–$2.0$s) and visual perceptual distance (`dHash` $\le 12$).
  - Evaluates each cluster and crowns the **Hero Frame** based on composite ocular sharpness, open eyes, low sensor noise, and exposure balance.
  - Hero frames receive the gold **`👑 HERO`** badge; other frames in the burst receive sequence badges (e.g. `[⚡ 2/5]`).
  - Docked **Burst Filmstrip Bar** with micro-scrubbing directly under the viewport.
  - **One-Click Batch Actions**:
    - **`👑 Keep Hero & Reject Rest [K]`**: Sets the winning shot to 3★ Pick and marks other burst frames as 1★ Reject.
    - **`⭐ Promote Top 2`**: Retains the top 2 best frames and marks the rest as rejects.
    - **`⚡ Compare Burst [C]`**: Sends all shots in the burst straight into Side-by-Side Compare view.
  - **`⚡ Collapse Bursts`** toggle in the top bar to display only Hero frames in the gallery, cutting roll clutter by 75–80%.

- **👁️ 2. Dual-Ocular Blink & Closed-Eye Detection**:
  - Automatically extracts calibrated Left and Right eye bounding boxes for detected portrait subjects.
  - **Directional Gradient Analysis**: Distinguishes open eyes ($G_x / G_y \ge 0.50$ vertical pupil contrast) from closed eyelids ($G_x / G_y < 0.35$ horizontal crease dominance).
  - **Pupil Intensity Profile**: Evaluates pupil-to-sclera intensity valley dip to detect closed or squinting eyes.
  - **Continuous Openness Score**: Reports $0\%–100\%$ ocular openness with multi-subject group ratios (e.g. `"Eyes Open: 3/4 (75%)"`).
  - **Ocular & Blink Telemetry Card**: Added to the Right Rail Dossier with a color-coded status meter (`Prism Green` for open, `Vermilion Red` for blinks).
  - Automatically demotes blinked/closed-eye shots from 3★ Selects when `Reject Blinking & Closed Eyes` is enabled and categorizes them under the **`BLINK / EYE-`** filter.

- **⚖️ 3. Side-by-Side Compare Mode (2-Up & 4-Up with Synchronized Pan/Zoom)**:
  - Dual-split (2-Up) and Quad-split (4-Up) side-by-side inspection stages toggled via hotkey `C` or mode tabs.
  - **Synchronized Pan & Zoom**: Dragging or scrolling in any pane moves and scales all active compare slots in lockstep (`🔒 Sync Pan & Zoom`).
  - Preset zoom levels: **`FIT`**, **`100% (1:1)`**, and **`200% (2:1)`**.
  - **`👁️ Lock to Eyes (200%)` One-Click Alignment**: Instantly zooms to 200% Loupe and centers each pane directly over the subject's eyes.
  - In-pane floating rating controls (`1★`, `2★`, `3★ Pick`, `Reject`, `👑 Crown Winner [W]`).
  - Active slot focus highlighting and direct keyboard rating (`1`–`3`, `P`, `X`, `W`).

- **📊 4. Sensor Noise & Grain Detection**:
  - Immerkær Fast Noise Variance and flat-patch standard deviation estimation for true sensor noise telemetry.
  - Noise floor subtraction from Laplacian sharpness calculations so high-ISO sensor grain never masquerades as sharp focus.
  - Telemetry card in Dossier with Noise Index (0–100), estimated SNR (dB), $\sigma$, and visual color meter.

- **🛠️ 5. Cross-Platform Build & CI Resilience**:
  - Fixed macOS 14 (Sonoma) Apple Silicon build by replacing monolithic `pyobjc` with scoped `pywebview[cocoa]`.
  - Updated AppImage packaging to the active official `AppImage/appimagetool` release.
  - Automated release asset creation and dynamic version metadata bundling (`version.json`).

---

### ⚡ Core Capabilities

- **🎯 Calibrated Pure-Threshold Culling (Level 1–10 Scale)**: Evaluates each image on its individual technical merits. Balanced Level 5 baseline reliably selects ~38–40% keepers on typical event rolls (~236 keeps out of 640 shots).
- **👁️ Neural Subject & Eye Focus Isolation**: High-frequency Laplacian variance computed exclusively within detected subject & eye bounding boxes (bokeh-safe).
- **📷 22+ Camera RAW Formats**: Native decoding for Canon (`.CR2`, `.CR3`), Nikon (`.NEF`, `.NRW`), Sony (`.ARW`), Fuji (`.RAF`), Panasonic (`.RW2`), Olympus (`.ORF`), Pentax (`.PEF`), Adobe (`.DNG`), plus high-res JPEGs and TIFFs.
- **⚡ Embedded Preview Acceleration**: Extracts manufacturer embedded full-resolution previews (10–50 ms/frame), matching Adobe Lightroom's *"Embedded & Sidecar"* workflow.
- **💾 Non-Destructive Sidecar Sync**: Generates Adobe Camera Raw 16.0 XML (`.xmp`) sidecars with rating stars, color labels, dynamic range exposure offsets, and highlight tags. RAW files remain 100% untouched.
- **🇹🇭 English & Thai UI Localization**: Seamless language switching with native Noto Sans Thai typography.
