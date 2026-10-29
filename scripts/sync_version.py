#!/usr/bin/env python3
"""
Synchronizes the single source of truth version in version.json across all
packaging, installer, CI, and release files.
"""

import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION_FILE = os.path.join(ROOT, "version.json")

def main():
    if not os.path.exists(VERSION_FILE):
        print(f"Error: {VERSION_FILE} not found.")
        return 1

    with open(VERSION_FILE, "r", encoding="utf-8") as f:
        config = json.load(f)

    ver = config.get("version", "1.0.6")
    build = config.get("build", 106)
    name = config.get("product_name", "MicMose Photo Culler Pro")

    print(f"[*] Synchronizing project version to {ver} (Build {build})...")

    # 1. Update backend/installer.iss
    iss_file = os.path.join(ROOT, "backend", "installer.iss")
    if os.path.exists(iss_file):
        with open(iss_file, "r", encoding="utf-8") as f:
            content = f.read()
        content = re.sub(r'#define MyAppVersion ".*?"', f'#define MyAppVersion "{ver}"', content)
        content = re.sub(r'#define MyAppBuild ".*?"', f'#define MyAppBuild "{build}"', content)
        content = re.sub(r'VersionInfoVersion=.*', f'VersionInfoVersion={ver}.{build}', content)
        content = re.sub(r'VersionInfoProductVersion=.*', f'VersionInfoProductVersion={ver}.{build}', content)
        with open(iss_file, "w", encoding="utf-8") as f:
            f.write(content)
        print("  [OK] Updated backend/installer.iss")

    # 2. Update backend/product.wxs
    wxs_file = os.path.join(ROOT, "backend", "product.wxs")
    if os.path.exists(wxs_file):
        with open(wxs_file, "r", encoding="utf-8") as f:
            content = f.read()
        content = re.sub(r'Version=".*?"', f'Version="{ver}.0"', content)
        with open(wxs_file, "w", encoding="utf-8") as f:
            f.write(content)
        print("  [OK] Updated backend/product.wxs")

    # 3. Update backend/sign_all.ps1
    ps1_file = os.path.join(ROOT, "backend", "sign_all.ps1")
    if os.path.exists(ps1_file):
        with open(ps1_file, "r", encoding="utf-8") as f:
            content = f.read()
        content = re.sub(r'/d "MicMose Photo Culler Pro v.*?"', f'/d "{name} v{ver}"', content)
        with open(ps1_file, "w", encoding="utf-8") as f:
            f.write(content)
        print("  [OK] Updated backend/sign_all.ps1")

    # 4. Copy version.json into backend/ for PyInstaller bundling
    backend_ver = os.path.join(ROOT, "backend", "version.json")
    with open(backend_ver, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    print("  [OK] Updated backend/version.json")

    print(f"[*] Version synchronization complete: v{ver} (Build {build})")
    return 0

if __name__ == "__main__":
    exit(main())
