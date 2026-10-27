# Building MicMose Photo Culler Pro on macOS

This guide explains how to compile **MicMose Photo Culler Pro** into a native macOS Application (`.app`) and Apple Disk Image (`.dmg`) for Apple Silicon (M1/M2/M3/M4) and Intel Macs.

---

## ⚡ Method 1: Automated Cloud Build (Recommended — No Mac Required!)

The repository includes a GitHub Actions workflow [`.github/workflows/build-macos.yml`](../.github/workflows/build-macos.yml) that builds on Apple Silicon Mac runners in GitHub's cloud for free:

1. Open your repository on GitHub: `https://github.com/Naphatpuurin/AI-Assist-Photo-Culler`
2. Click on the **Actions** tab.
3. Select **"Build macOS Release (.dmg)"** from the left sidebar.
4. Click **Run workflow** ➔ **Run workflow**.
5. Once completed (~4 minutes), download the generated `MicMose-Photo-Culler-Pro-macOS.dmg` from the **Artifacts** section, or have it automatically attached to any tagged release.

---

## 🖥️ Method 2: Building Locally on a Mac

If you have a Mac, you can build natively in Terminal in 4 steps:

### Prerequisites
- macOS 12+ (Monterey, Ventura, Sonoma, Sequoia)
- Python 3.10, 3.11, or 3.12
- Node.js 18+ & npm

### Step-by-Step Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Naphatpuurin/AI-Assist-Photo-Culler.git
   cd AI-Assist-Photo-Culler
   ```

2. **Build the Production Frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. **Install Python Dependencies**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   pip install pyinstaller pywebview pyobjc
   ```

4. **Compile the macOS Application Bundle**:
   ```bash
   pyinstaller ImageCullerAI_mac.spec --clean --noconfirm
   ```
   The compiled application bundle will be located at:
   `backend/dist/MicMose Photo Culler Pro.app`

5. **Package into a `.dmg` Disk Image (Optional)**:
   ```bash
   hdiutil create \
     -volname "MicMose Photo Culler Pro" \
     -srcfolder "dist/MicMose Photo Culler Pro.app" \
     -ov -format UDZO \
     "../release/MicMose-Photo-Culler-Pro-macOS.dmg"
   ```

---

## 🛡️ macOS Gatekeeper Notice

Similar to Windows SmartScreen, macOS Gatekeeper protects against apps downloaded outside the Mac App Store. If macOS says *"MicMose Photo Culler Pro cannot be opened because the developer cannot be verified"*:

1. Right-click (or Control-click) the app icon in `/Applications` and select **Open**.
2. Click **Open** in the confirmation dialog.
3. Or run this one-line command in Terminal:
   ```bash
   xattr -cr "/Applications/MicMose Photo Culler Pro.app"
   ```
