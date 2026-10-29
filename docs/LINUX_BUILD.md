# Building & Running MicMose Photo Culler Pro on Linux

This guide explains how to run and package **MicMose Photo Culler Pro** on Linux distributions (Ubuntu, Debian, Fedora, Arch Linux, Linux Mint, Pop!_OS, openSUSE, etc.) via **AppImage**, **Debian (`.deb`)**, and **Portable Tarball**.

---

## ⚡ Method 1: Automated Cloud Build (No Linux Machine Required!)

The repository includes a GitHub Actions workflow [`.github/workflows/build-linux.yml`](../.github/workflows/build-linux.yml) that builds on Ubuntu runners in GitHub's cloud for free:

1. Open your repository on GitHub: `https://github.com/Naphatpuurin/AI-Assist-Photo-Culler`
2. Click on the **Actions** tab.
3. Select **"Build Linux Release (.AppImage & .deb)"** from the left sidebar.
4. Click **Run workflow** ➔ **Run workflow**.
5. Once completed (~3 minutes), download the generated packages from the **Artifacts** section:
   - `MicMose-Photo-Culler-Pro-x86_64.AppImage` (Universal double-clickable package)
   - `MicMose-Photo-Culler-Pro_1.0.6_amd64.deb` (Debian / Ubuntu / Mint installer)
   - `MicMose-Photo-Culler-Pro-Linux-x86_64.tar.gz` (Portable archive with run script)

---

## 🚀 Running the AppImage on Linux

The AppImage is self-contained and runs on virtually all 64-bit Linux distributions:

```bash
# 1. Download the AppImage
# 2. Make it executable
chmod +x MicMose-Photo-Culler-Pro-x86_64.AppImage

# 3. Run directly
./MicMose-Photo-Culler-Pro-x86_64.AppImage
```

---

## 📦 Installing the Debian (`.deb`) Package

On Ubuntu, Debian, Linux Mint, or Pop!_OS:

```bash
# Install via dpkg
sudo dpkg -i MicMose-Photo-Culler-Pro_*_amd64.deb

# Fix missing dependencies if prompted
sudo apt-get install -f
```

Launches directly from your application launcher or by running `micmose-photo-culler-pro` in terminal.

---

## 🖥️ Method 2: Building Locally on Linux

If you are developing or compiling locally on a Linux workstation:

### Prerequisites

#### Ubuntu / Debian / Mint
```bash
sudo apt-get update
sudo apt-get install -y \
  python3 python3-pip python3-venv \
  nodejs npm \
  libwebkit2gtk-4.0-dev libgtk-3-dev \
  libgirepository1.0-dev libcairo2-dev \
  libgl1-mesa-glx file
```

#### Fedora
```bash
sudo dnf install -y \
  python3 python3-pip \
  nodejs npm \
  webkit2gtk4.0-devel gtk3-devel \
  gobject-introspection-devel cairo-devel \
  mesa-libGL
```

#### Arch Linux
```bash
sudo pacman -Syu --needed \
  python python-pip \
  nodejs npm \
  webkit2gtk gtk3 \
  gobject-introspection cairo \
  mesa
```

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
   pip install pyinstaller pywebview[gtk] pycairo PyGObject
   ```

4. **Compile the Standalone Linux Binary**:
   ```bash
   pyinstaller ImageCullerAI_linux.spec --clean --noconfirm
   ```
   The compiled executable will be located at:
   `backend/dist/MicMosePhotoCullerPro`

5. **Test Run**:
   ```bash
   ./dist/MicMosePhotoCullerPro
   ```

---

## 🚀 GPU Acceleration on Linux

- **NVIDIA GeForce RTX / Quadro**:
  If NVIDIA proprietary drivers and CUDA are installed, **MicMose Photo Culler Pro** automatically leverages `CUDAExecutionProvider` alongside OpenCV OpenCL matrix acceleration.
- **AMD Radeon & Intel Arc**:
  Utilizes the OpenCV OpenCL UMat matrix pipeline on Mesa / ROCm OpenCL runtimes.
- **CPU Fallback**:
  Transparently accelerates culling via all available CPU cores when no discrete GPU is available.
