# Contributing to MicMose Photo Culler Pro

Thank you for your interest in contributing to **MicMose Photo Culler Pro**! This project provides professional, high-throughput AI culling and telemetric inspection for commercial, event, and portrait photographers.

## Development Setup

### Prerequisites
- **Python 3.10 – 3.12** (or 3.14 with pre-compiled wheels)
- **Node.js 18+ & npm**
- **Git**
- Optional: NVIDIA GPU with CUDA/OpenCL support for hardware acceleration

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
The FastAPI backend will start on `http://127.0.0.1:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will start on `http://localhost:5173`.

### 3. Building for Production
To build the integrated standalone desktop package:
```bash
# 1. Build frontend bundle
cd frontend
npm run build

# 2. Package standalone Windows binary
cd ../backend
pyinstaller ImageCullerAI.spec
```
The executable is generated in `backend/dist/ImageCullerAI.exe`.

## Code Style & Guidelines
- Follow PEP 8 guidelines for Python code.
- Keep calculations GPU-first with automatic, safe CPU fallback.
- Maintain pure threshold determinism: avoid artificial percentile caps unless explicitly enabled via Cull-to-Target.
- Verify JSON responses with standard Python types (avoid passing `numpy.float32` or NumPy arrays directly to FastAPI serializers).

## Pull Request Process
1. Fork the repository and create your feature branch (`git checkout -b feature/amazing-feature`).
2. Commit your changes (`git commit -m "Add amazing feature"`).
3. Push to your branch (`git push origin feature/amazing-feature`).
4. Open a Pull Request with a clear description of your changes and test results.
