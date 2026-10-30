# MicMose Photo Culler Pro — Future Updates Roadmap

This document outlines the priority roadmap and feature specifications scheduled for future major and minor releases of **MicMose Photo Culler Pro**.

---

## 🚀 High-Priority Feature Pipeline

### 1. 🥇 Burst Photo Grouping & Hero Frame Selection
* **Target Release**: v1.1.0
* **Photographer Need**:
  Wedding, sports, and commercial event photographers frequently fire rapid sequences (3–10 frames per second) during critical moments (walking down the aisle, confetti toss, speeches, reactions). Reviewing 6–10 near-identical frames individually accounts for ~70% of culling fatigue.
* **Technical Specification**:
  - **Temporal & Focal Clustering**: Automatically cluster shots captured within $\Delta t \le 1.5$ seconds with matching camera model, focal length, and similar perceptual hash distance ($\text{dHash} \le 12$).
  - **Hero Frame Crown**: Automatically crown the highest-scoring frame within each burst (highest ocular sharpness, best exposure balance, open eyes).
  - **UI Collapsible Filmstrip**: Collapse bursts into a single primary card in the gallery with a badge (e.g. `[ 1 / 6 ]`). Clicking expands the sequence inline for micro-inspection.
  - **Batch Verdict**: One-click *"Keep Hero & Reject Rest"* or *"Promote Best 2"*.

---

### 2. 🥈 Facial Landmark Blink & Closed-Eye Detection (EAR)
* **Target Release**: v1.1.0
* **Photographer Need**:
  A photograph can have tack-sharp focus and perfect lighting, but if key subjects (e.g. bride, groom, speaker) are caught mid-blink or with closed eyes, the photo is unusable.
* **Technical Specification**:
  - **Facial Landmark Mesh**: Integrate a lightweight 68-point or 6-point ocular landmark detector within YOLO-detected face bounding boxes.
  - **Eye Aspect Ratio (EAR)**: Compute $EAR = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \|p_1 - p_4\|}$. Frames falling below the dynamic calibrated threshold are tagged as `BLINK / CLOSED`.
  - **Group Shot Tolerance**: In large group photos ($> 4$ subjects), report the percentage of subjects with open eyes (`"Eyes Open: 8/8 (100%)"`).
  - **Rule Policy**: Optional culling toggle *"Auto-reject if primary subject eyes closed"*.

---

### 3. 🥉 2-Up / 4-Up Side-by-Side Compare Mode with Locked Zoom
* **Target Release**: v1.2.0
* **Photographer Need**:
  When choosing between two or four closely-rated candidate shots, flipping back and forth sequentially causes cognitive fatigue. Photographers need simultaneous comparison with synchronized pan & zoom.
* **Technical Specification**:
  - **Split View Layout**: Dual-split (2-up) and Quad-split (4-up) stage layouts toggled via hotkey `C`.
  - **Synchronized Coordinate Navigation**: Dragging, panning, or zooming (100%, 200%, Fit) in one viewport synchronizes camera centers across all active panes in lockstep.
  - **Subject Lock**: One-click *"Lock to Eyes/Face"* centering all panes directly on the subject's face at 100% pixel loupe.
  - **Direct Keyboard Rating**: Pressing `1`–`5`, `P` (Pick), or `X` (Reject) acts on the currently focused compare pane.

---

### 4. ⚡ Instant Catalog Caching (`.cullcache` / SQLite)
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
