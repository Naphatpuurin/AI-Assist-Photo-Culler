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
        ('app.icns', '.'),
        ('app.png', '.')
    ] + ort_datas + rawpy_datas,
    hiddenimports=['onnxruntime', 'rawpy', 'exifread', 'raw_utils', 'pywebview'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['torch', 'torchvision', 'torchaudio', 'ultralytics', 'matplotlib', 'polars', 'scipy', 'pynvml'],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='MicMosePhotoCullerPro',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='app.icns',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='MicMosePhotoCullerPro',
)

app = BUNDLE(
    coll,
    name='MicMose Photo Culler Pro.app',
    icon='app.icns',
    bundle_identifier='com.micmose.photoculler',
    info_plist={
        'CFBundleName': 'MicMose Photo Culler Pro',
        'CFBundleDisplayName': 'MicMose Photo Culler Pro',
        'CFBundleIdentifier': 'com.micmose.photoculler',
        'CFBundleShortVersionString': '1.0.1',
        'CFBundleVersion': '101',
        'NSHighResolutionCapable': 'True',
        'NSRequiresAquaSystemAppearance': 'False',
        'LSApplicationCategoryType': 'public.app-category.photography',
        'NSHumanReadableCopyright': 'Copyright © 2026 Naphatphurin Prachantasena. All rights reserved.',
    },
)
