# MicMose Photo Culler Pro — Future Updates Roadmap

This document outlines the roadmap and technical feature specifications for **MicMose Photo Culler Pro**.

---

## ✅ Recently Shipped in v1.1.0

### 1. 🥇 Burst Photo Grouping & Hero Frame Selection
* **Status**: Complete & Verified
* **Capabilities**:
  - Automatically clusters high-speed sequences within dynamic time windows ($\Delta t \le 1.5$–$2.0$s) and visual distance.
  - Automatically crowns the **Hero Frame** based on composite ocular sharpness, open eyes, low sensor noise, and exposure.
  - Gallery thumbnail badges (`👑 HERO` gold badge, `[⚡ 1/5]` burst sequence badges).
  - Docked Burst Filmstrip Bar with micro-scrubbing.
  - One-click batch actions: `Keep Hero & Reject Rest [K]`, `Promote Top 2`, `Compare Burst [C]`.
  - Gallery "Collapse Bursts" filter toggle to cut culling clutter by 75–80%.

### 2. 🥈 Dual-Ocular Blink & Closed-Eye Detection
* **Status**: Complete & Verified
* **Capabilities**:
  - Extracts calibrated Left & Right Eye bounding boxes per detected subject.
  - Multi-metric ocular discrimination: Sobel directional gradient dominance ($G_x$ vertical edge energy vs $G_y$ eyelid crease lines), pupil-to-sclera valley dip intensity profile, and local variance.
  - Continuous Openness Percentage ($0–100\%$) and automatic Blink Detection flag (`blink_detected`).
  - Multi-subject group ratio telemetry (e.g. `"Eyes Open: 3/4 (75%)"`).
  - Right rail Dossier telemetry card with visual progress meter.
  - Rejection policy: Demotes blinking shots from 3★ and auto-filters under `BLINK / CLOSED EYES`.

### 3. 🥉 2-Up & 4-Up Side-by-Side Compare Mode with Synchronized Pan & Zoom
* **Status**: Complete & Verified
* **Capabilities**:
  - Dual-split (2-Up) and Quad-split (4-Up) side-by-side inspection stages toggled via hotkey `C` or mode tabs.
  - **Synchronized Pan & Zoom**: Dragging or mouse wheel scrolling in any slot moves all panes synchronously.
  - Preset zoom buttons: `FIT`, `100% (1:1)`, `200% (2:1)`.
  - **"👁️ Lock to Eyes" One-Click Button**: Instantly zooms to 200% Loupe and centers each pane directly on the subject's eyes.
  - In-pane floating rating controls (`1★`, `2★`, `3★ Pick`, `Reject`, `👑 Crown Winner`).
  - Active slot focus highlighting and direct keyboard rating (`1`–`3`, `P`, `X`, `W`).

---

## 🚀 Upcoming Roadmap Pipeline
* **Target Release**: v1.2.0
* **Photographer Need**:
  When reopening a previously analyzed directory containing 1,500–5,000 photos, the application should reload instantly without re-processing matrices or re-reading disk EXIF.
* **Technical Specification**:
  - **Catalog Cache Database**: Store analysis payloads, perceptual hashes, telemetry, and user overrides in a local SQLite file (`.micmose_cache.db`) or per-folder sidecar cache.
  - **Timestamp & File Size Invalidation**: Check file modification times (`mtime`) and byte sizes. Only modified or newly added files undergo re-analysis.
  - **Sub-Second Boot**: Instant directory load in $< 300\text{ ms}$ for catalogs up to 10,000 images.

---

### 5. 🏷️ Lightroom Classic Color Label & Flag Synchronization
* **Target Release**: v1.2.0
* **Photographer Need**:
  Full bidirectional alignment with Lightroom Classic metadata workflows: Pick (`P`), Unflag (`U`), Reject (`X`), and Color Labels (Red, Yellow, Green, Blue, Purple).
* **Technical Specification**:
  - **Standard ACR 16.0 XMP tags**: `xmp:Rating`, `crs:ProcessVersion`, and `photoshop:Urgency`.
  - **Customizable Label Sets**: Allow user mapping between MicMose labels and custom Lightroom Color Label Sets.

---

## 📌 Under Active Implementation: Noise Detection & ISO Grain Filtering (v1.0.8)
* **Status**: In Progress
* **Scope**:
  1. Fast Immerkær / Patch Variance noise floor estimation in `ai_engine.py`.
  2. Automatic focus score subtraction to eliminate noise-induced false sharpness on high-ISO captures.
  3. Signal-to-Noise Ratio (SNR) and Noise Level gauges in Inspector rail.
  4. User filter toggle and culling rule for heavy sensor noise.
