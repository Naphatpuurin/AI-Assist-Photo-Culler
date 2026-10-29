# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_dynamic_libs, collect_data_files

ort_binaries = collect_dynamic_libs('onnxruntime')
ort_datas = collect_data_files('onnxruntime')
rawpy_binaries = collect_dynamic_libs('rawpy')
rawpy_datas = collect_data_files('rawpy')

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=ort_binaries + rawpy_binaries,
    datas=[
        ('../frontend/dist', 'frontend/dist'),
        ('yolov8n.onnx', '.'),
        ('yolov8n.pt', '.'),
        ('app.png', '.'),
        ('app.ico', '.')
    ] + ort_datas + rawpy_datas,
    hiddenimports=['onnxruntime', 'rawpy', 'exifread', 'raw_utils', 'pywebview', 'gi'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['torch', 'torchvision', 'torchaudio', 'ultralytics', 'matplotlib', 'polars', 'scipy'],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='MicMosePhotoCullerPro',
    debug=False,
    bootloader_ignore_signals=False,
    strip=True,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='app.png',
)
