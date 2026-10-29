from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, JSONResponse
from pydantic import BaseModel
import os
import sys
import traceback
import re
import json
import ssl
import tempfile
import subprocess
import threading
import time
import socket
import secrets
import hashlib
import urllib.request
import urllib.error

if sys.stdout is None:
    sys.stdout = open(os.devnull, "w", encoding="utf-8")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w", encoding="utf-8")
import cv2
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import numpy as np

# ----------------------------------------------------
# Dynamic Port Discovery & Session Authorization Token
# ----------------------------------------------------
def find_free_port(start_port=8000, max_attempts=50):
    for p in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', p))
                return p
            except OSError:
                continue
    return start_port

CURRENT_PORT = find_free_port(8000)
APP_SESSION_TOKEN = secrets.token_urlsafe(32)

def load_app_version():
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "version.json"),
        os.path.join(os.path.dirname(__file__), "version.json"),
        os.path.join(getattr(sys, "_MEIPASS", "."), "version.json")
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                with open(c, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("version", "1.0.6"), data.get("build", 106)
            except Exception:
                pass
    return "1.0.6", 106

APP_VERSION, APP_BUILD = load_app_version()

def sanitize_for_json(obj):
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [sanitize_for_json(x) for x in obj]
    elif isinstance(obj, (np.floating, float)):
        return float(obj)
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return sanitize_for_json(obj.tolist())
    return obj

app = FastAPI(title="MicMose Photo Culler Pro")

# Restrict CORS to exact local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"http://127.0.0.1:{CURRENT_PORT}",
        f"http://localhost:{CURRENT_PORT}",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "null"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Protect all /api/ endpoints with local transient session token
@app.middleware("http")
async def security_token_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        if request.method == "OPTIONS":
            return await call_next(request)

        token = (
            request.headers.get("X-App-Token") or
            request.query_params.get("token") or
            request.cookies.get("app_token")
        )

        origin = request.headers.get("origin", "")
        referer = request.headers.get("referer", "")
        is_dev = ":5173" in origin or ":5173" in referer

        if APP_SESSION_TOKEN and token != APP_SESSION_TOKEN and not is_dev:
            return JSONResponse(
                status_code=403,
                content={
                    "status": "error",
                    "message": "Access denied: Request missing valid local workstation authorization token."
                }
            )

    return await call_next(request)

webview_window = None


class ScanRequest(BaseModel):
    directory: str


class BatchAnalyzeRequest(BaseModel):
    paths: list[str]
    focus_level: int = 5
    require_subjects: bool = True
    reject_exposure: bool = True
    reject_misfires: bool = True
    reject_documents: bool = True
    reject_closed_eyes: bool = True


class BatchPostProcessRequest(BaseModel):
    items: list[dict]
    time_window_sec: float = 4.0
    cull_to_target_enabled: bool = False
    target_keep_percent: int = 35
    auto_highlights_percent: int = 12
    focus_level: int = 5
    require_subjects: bool = True
    reject_exposure: bool = True
    reject_misfires: bool = True
    reject_documents: bool = True
    reject_closed_eyes: bool = False


class FeedbackRequest(BaseModel):
    ai_rating: int
    user_rating: int
    focus_score: float
    exposure: float


class ExportItem(BaseModel):
    path: str
    rating: int = 3
    color_label: str = "green"
    cull_status: str = "select"
    is_highlight: bool = False
    acr_ev_shift: float = 0.0
    acr_highlights: int = 0
    acr_shadows: int = 0


class ExportRequest(BaseModel):
    files: list[str] = []
    items: list[ExportItem] = []
    destination: str
    software_sync: str = "xmp"  # 'xmp' (ACR/Lightroom/Capture One XMP) | 'csv' | 'both' | 'none'
    copy_photos: bool = True


def build_xmp_sidecar_xml(
    rating: int,
    color_label: str,
    cull_status: str,
    is_highlight: bool,
    acr_ev_shift: float = 0.0,
    acr_highlights: int = 0,
    acr_shadows: int = 0
) -> str:
    """
    Generate Adobe Camera Raw (ACR) 16.0 / Lightroom Classic / Capture One compatible XMP sidecar.
    Includes xmp:Rating, xmp:Label, and Adobe Camera Raw crs:* ProcessVersion="16.0" tags.
    """
    label_map = {
        "green": "Green",
        "blue": "Blue",
        "yellow": "Yellow",
        "red": "Red",
        "purple": "Purple",
        "none": ""
    }
    lr_label = label_map.get(color_label.lower(), "Green")
    pick_val = 1 if (rating >= 3 or is_highlight) else (-1 if rating == 1 else 0)

    return f"""<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="MicMose Photo Culler Pro (ACR 16.0 Compatible)">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
    xmp:Rating="{rating}"
    xmp:Label="{lr_label}"
    xmp:CreatorTool="MicMose Photo Culler Pro"
    xmp:MetadataDate="{datetime.now().isoformat()}"
    photoshop:Urgency="{pick_val}"
    crs:Version="16.0"
    crs:ProcessVersion="15.4"
    crs:WhiteBalance="As Shot"
    crs:Exposure2012="{acr_ev_shift:+.2f}"
    crs:Highlights2012="{acr_highlights}"
    crs:Shadows2012="{acr_shadows}"
    crs:CameraProfile="Adobe Standard">
   <dc:subject>
    <rdf:Bag>
     <rdf:li>MicMose_{cull_status.upper()}</rdf:li>
     {"<rdf:li>Highlight_SneakPeek</rdf:li>" if is_highlight else ""}
    </rdf:Bag>
   </dc:subject>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
"""


@app.get("/api/hardware_status")
def hardware_status():
    try:
        from ai_engine import get_engine
        engine = get_engine()
        telemetry = engine.get_hardware_telemetry()
        telemetry["app_version"] = APP_VERSION
        telemetry["app_build"] = APP_BUILD
        telemetry["app_port"] = CURRENT_PORT
        return telemetry
    except Exception as e:
        return {
            "device_name": f"CPU Fallback ({os.cpu_count() or 8} Threads)",
            "backend": "CPU Fallback",
            "opencl_active": False,
            "gpu_active": False,
            "gpu_util_percent": 0,
            "vram_used_mb": 0,
            "vram_total_mb": 0,
            "app_version": APP_VERSION,
            "app_build": APP_BUILD,
            "app_port": CURRENT_PORT,
            "error": str(e)
        }


@app.get("/api/select_folder")
def select_folder():
    """Open a native Windows folder selection dialog via pywebview or tkinter."""
    global webview_window
    try:
        if webview_window is not None:
            import webview
            result = webview_window.create_file_dialog(webview.FOLDER_DIALOG)
            if result and len(result) > 0:
                return {"status": "success", "directory": result[0]}
            return {"status": "cancelled", "directory": None}
    except Exception as e:
        print(f"Webview folder dialog fallback: {e}")

    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        folder_selected = filedialog.askdirectory()
        root.destroy()
        if folder_selected:
            return {"status": "success", "directory": os.path.normpath(folder_selected)}
        return {"status": "cancelled", "directory": None}
    except Exception as e:
        return {"status": "error", "message": str(e), "directory": None}


@app.post("/api/scan_directory")
def scan_directory(request: ScanRequest):
    directory = request.directory

    if not os.path.exists(directory) or not os.path.isdir(directory):
        raise HTTPException(status_code=400, detail="Invalid directory path")

    from raw_utils import SUPPORTED_EXTENSIONS, is_raw
    supported_extensions = SUPPORTED_EXTENSIONS
    image_files = []

    try:
        for filename in sorted(os.listdir(directory)):
            if filename.lower().endswith(supported_extensions):
                full_path = os.path.join(directory, filename)
                image_files.append({
                    "id": full_path,
                    "filename": filename,
                    "path": full_path,
                    "is_raw": is_raw(filename)
                })

        return {"status": "success", "count": len(image_files), "images": image_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/image")
def get_image(path: str):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image not found")
    from raw_utils import is_raw, get_display_jpeg_bytes
    if is_raw(path) or path.lower().endswith(('.tif', '.tiff')):
        data = get_display_jpeg_bytes(path, max_size=None, quality=92)
        if data:
            return Response(content=data, media_type="image/jpeg")
        raise HTTPException(status_code=415, detail="Could not decode image")
    return FileResponse(path)


@app.get("/api/thumbnail")
def get_thumbnail(path: str):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image not found")
    try:
        from raw_utils import get_display_jpeg_bytes
        data = get_display_jpeg_bytes(path, max_size=400, quality=75)
        if data:
            return Response(content=data, media_type="image/jpeg")
    except Exception as e:
        print(f"Thumbnail generation failed: {e}")
    raise HTTPException(status_code=415, detail="Could not decode thumbnail")


@app.get("/api/thumbnail_legacy")
def get_thumbnail_legacy(path: str):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        from PIL import Image
        import io

        with Image.open(path) as img:
            img.thumbnail((400, 400))
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='JPEG', quality=75)
            img_byte_arr.seek(0)
            return Response(content=img_byte_arr.getvalue(), media_type="image/jpeg")

    except Exception as e:
        print(f"Thumbnail generation failed: {e}")
        return FileResponse(path)


@app.get("/api/analyze")
def analyze_image(
    path: str,
    focus_level: int = 5,
    focus_threshold: int = 50,
    require_subjects: bool = True,
    reject_exposure: bool = True,
    reject_misfires: bool = True,
    reject_documents: bool = True,
    reject_closed_eyes: bool = True
):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        from ai_engine import get_engine
        engine = get_engine()
        effective_lvl = focus_level if 1 <= focus_level <= 10 else max(1, min(10, round(focus_threshold / 10)))
        results = engine.analyze_image(
            path,
            focus_level=effective_lvl,
            require_subjects=require_subjects,
            reject_exposure=reject_exposure,
            reject_misfires=reject_misfires,
            reject_documents=reject_documents,
            reject_closed_eyes=reject_closed_eyes
        )
        return sanitize_for_json(results)
    except Exception as e:
        err_msg = traceback.format_exc()
        try:
            with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "crash.log"), "a", encoding="utf-8") as f:
                f.write(f"=== /api/analyze error ===\n{err_msg}\n")
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze_batch")
def analyze_batch(request: BatchAnalyzeRequest):
    """
    Lightroom-style Parallel Processing Division:
    CPU worker pool handles parallel disk I/O & EXIF/ACR parsing across multiple frames simultaneously,
    while feeding the GPU OpenCL UMat matrix pipeline and DirectML neural engine without stalling.
    """
    try:
        from ai_engine import get_engine
        engine = get_engine()
        max_workers = min(8, max(2, (os.cpu_count() or 4) // 2))

        def _worker(img_path):
            if not os.path.exists(img_path):
                return None
            return engine.analyze_image(
                img_path,
                focus_level=request.focus_level,
                require_subjects=request.require_subjects,
                reject_exposure=request.reject_exposure,
                reject_misfires=request.reject_misfires,
                reject_documents=request.reject_documents,
                reject_closed_eyes=request.reject_closed_eyes
            )

        batch_results = {}
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            future_map = {pool.submit(_worker, p): p for p in request.paths}
            for fut in as_completed(future_map):
                res = fut.result()
                if res and "path" in res:
                    batch_results[res["path"]] = res

        return sanitize_for_json({
            "status": "success",
            "results": batch_results,
            "hardware": engine.get_hardware_telemetry()
        })
    except Exception as e:
        err_msg = traceback.format_exc()
        try:
            with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "crash.log"), "a", encoding="utf-8") as f:
                f.write(f"=== /api/analyze_batch error ===\n{err_msg}\n")
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/post_process_batch")
def post_process_batch(request: BatchPostProcessRequest):
    try:
        from ai_engine import get_engine
        engine = get_engine()
        updated_map = engine.post_process_batch(
            analyzed_list=request.items,
            time_window_sec=request.time_window_sec,
            cull_to_target_enabled=request.cull_to_target_enabled,
            target_keep_percent=request.target_keep_percent,
            auto_highlights_percent=request.auto_highlights_percent,
            focus_level=request.focus_level,
            require_subjects=request.require_subjects,
            reject_exposure=request.reject_exposure,
            reject_misfires=request.reject_misfires,
            reject_documents=request.reject_documents,
            reject_closed_eyes=request.reject_closed_eyes
        )
        return sanitize_for_json({"status": "success", "analysis_map": updated_map})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/learn_feedback")
def learn_feedback(request: FeedbackRequest):
    try:
        from ai_engine import get_engine
        engine = get_engine()
        summary = engine.record_user_feedback(
            ai_rating=request.ai_rating,
            user_rating=request.user_rating,
            focus_score=request.focus_score,
            exposure=request.exposure
        )
        return {"status": "success", "learning": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reset_learning")
def reset_learning():
    try:
        from ai_engine import get_engine
        engine = get_engine()
        summary = engine.reset_learning_profile()
        return {"status": "success", "learning": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export")
def export_files(request: ExportRequest):
    import shutil
    import csv

    if not os.path.exists(request.destination):
        try:
            os.makedirs(request.destination)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not create destination directory: {e}")

    exported_count = 0
    xmp_count = 0
    errors = []

    export_items = request.items
    if not export_items and request.files:
        export_items = [ExportItem(path=p, rating=3, color_label="green") for p in request.files]

    csv_rows = []

    for item in export_items:
        file_path = item.path
        if os.path.exists(file_path):
            try:
                filename = os.path.basename(file_path)
                base_name, _ = os.path.splitext(filename)
                dest_path = os.path.join(request.destination, filename)

                if request.copy_photos and os.path.abspath(file_path) != os.path.abspath(dest_path):
                    shutil.copy2(file_path, dest_path)
                exported_count += 1

                if request.software_sync in ("xmp", "both"):
                    xmp_content = build_xmp_sidecar_xml(
                        rating=item.rating,
                        color_label=item.color_label,
                        cull_status=item.cull_status,
                        is_highlight=item.is_highlight,
                        acr_ev_shift=item.acr_ev_shift,
                        acr_highlights=item.acr_highlights,
                        acr_shadows=item.acr_shadows
                    )
                    xmp_dest = os.path.join(request.destination, f"{base_name}.xmp")
                    with open(xmp_dest, "w", encoding="utf-8") as xf:
                        xf.write(xmp_content)
                    orig_dir = os.path.dirname(file_path)
                    orig_xmp = os.path.join(orig_dir, f"{base_name}.xmp")
                    if not os.path.exists(orig_xmp):
                        try:
                            with open(orig_xmp, "w", encoding="utf-8") as oxf:
                                oxf.write(xmp_content)
                        except Exception:
                            pass
                    xmp_count += 1

                csv_rows.append({
                    "Filename": filename,
                    "StarRating": item.rating,
                    "ColorLabel": item.color_label.capitalize(),
                    "CullStatus": item.cull_status.upper(),
                    "Highlight": "Yes" if item.is_highlight else "No",
                    "ACR_Exposure": f"{item.acr_ev_shift:+.2f} EV",
                    "SourcePath": file_path
                })
            except Exception as e:
                errors.append(f"Failed to export {file_path}: {e}")
        else:
            errors.append(f"File not found: {file_path}")

    if request.software_sync in ("csv", "both") and csv_rows:
        try:
            csv_path = os.path.join(request.destination, "MicMose_ACR_Lightroom_Manifest.csv")
            with open(csv_path, "w", newline="", encoding="utf-8") as cf:
                writer = csv.DictWriter(
                    cf,
                    fieldnames=["Filename", "StarRating", "ColorLabel", "CullStatus", "Highlight", "ACR_Exposure", "SourcePath"]
                )
                writer.writeheader()
                writer.writerows(csv_rows)
        except Exception as e:
            errors.append(f"CSV manifest error: {e}")

    return {
        "status": "success",
        "exported": exported_count,
        "xmp_sidecars": xmp_count,
        "errors": errors
    }


# ----------------------------------------------------
# Auto-Updater System (GitHub Releases Integration)
# ----------------------------------------------------
GITHUB_REPO = "Naphatpuurin/AI-Assist-Photo-Culler"
GITHUB_LATEST_API = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"

updater_lock = threading.Lock()
updater_state = {
    "status": "idle",  # 'idle' | 'downloading' | 'ready_to_install' | 'installing' | 'error'
    "progress": 0.0,
    "bytes_downloaded": 0,
    "total_bytes": 0,
    "speed_mbps": 0.0,
    "filename": "",
    "file_path": "",
    "error_message": "",
    "launched": False,
    "last_checked": ""
}


def parse_semver(ver_str: str):
    cleaned = re.sub(r'^[^\d]*', '', str(ver_str))
    parts = [int(p) for p in re.findall(r'\d+', cleaned)]
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts[:3])


def match_platform_asset(assets: list):
    is_mac = sys.platform == "darwin"
    is_linux = sys.platform.startswith("linux")
    if is_mac:
        for a in assets:
            if a.get("name", "").lower().endswith(".dmg"):
                return a
    elif is_linux:
        # Prefer AppImage, then .deb, then .tar.gz
        for a in assets:
            if a.get("name", "").lower().endswith(".appimage"):
                return a
        for a in assets:
            if a.get("name", "").lower().endswith(".deb"):
                return a
        for a in assets:
            name = a.get("name", "").lower()
            if name.endswith((".tar.gz", ".tar.xz")):
                return a
    else:
        # Windows: Prefer Inno Setup installer executable
        for a in assets:
            name = a.get("name", "").lower()
            if "setup" in name and name.endswith(".exe"):
                return a
        # Fallback to MSI
        for a in assets:
            if a.get("name", "").lower().endswith(".msi"):
                return a
        # Fallback to standalone .exe (ignoring .cer certs)
        for a in assets:
            name = a.get("name", "").lower()
            if name.endswith(".exe") and not name.endswith(".cer"):
                return a
    # Universal fallback: any installer/archive
    for a in assets:
        name = a.get("name", "").lower()
        if name.endswith((".exe", ".dmg", ".msi", ".zip", ".appimage", ".deb", ".tar.gz")):
            return a
    return None


class DownloadInstallRequest(BaseModel):
    download_url: str = ""
    asset_name: str = ""


@app.get("/api/updater/check")
def check_for_updates(force: bool = False):
    global updater_state
    try:
        req = urllib.request.Request(
            GITHUB_LATEST_API,
            headers={
                "User-Agent": "MicMose-Photo-Culler-Pro-Updater",
                "Accept": "application/vnd.github.v3+json"
            }
        )
        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        tag = data.get("tag_name", "v0.0.0")
        latest_semver = parse_semver(tag)
        current_semver = parse_semver(APP_VERSION)

        update_available = (latest_semver > current_semver) or (force is True)
        assets = data.get("assets", [])
        matched = match_platform_asset(assets)

        updater_state["last_checked"] = datetime.now().isoformat()

        return {
            "status": "success",
            "update_available": update_available,
            "current_version": APP_VERSION,
            "current_build": APP_BUILD,
            "latest_version": tag.lstrip("v"),
            "tag_name": tag,
            "release_name": data.get("name", tag),
            "release_notes": data.get("body", ""),
            "published_at": data.get("published_at", ""),
            "html_url": data.get("html_url", f"https://github.com/{GITHUB_REPO}/releases"),
            "asset": {
                "name": matched["name"],
                "size": matched.get("size", 0),
                "download_url": matched.get("browser_download_url", "")
            } if matched else None
        }
    except urllib.error.URLError as e:
        return {
            "status": "error",
            "message": f"Network error checking for updates: {e.reason}",
            "current_version": APP_VERSION,
            "current_build": APP_BUILD,
            "update_available": False
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Update check error: {str(e)}",
            "current_version": APP_VERSION,
            "current_build": APP_BUILD,
            "update_available": False
        }


@app.get("/api/updater/progress")
def get_updater_progress():
    return updater_state


def _run_download_and_install(download_url: str, asset_name: str):
    global updater_state
    try:
        # Fetch release metadata to resolve assets and cryptographic manifest
        req = urllib.request.Request(
            GITHUB_LATEST_API,
            headers={"User-Agent": "MicMose-Photo-Culler-Pro-Updater"}
        )
        ctx = ssl.create_default_context()
        release_data = {}
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                release_data = json.loads(resp.read().decode("utf-8"))
        except Exception:
            pass

        assets = release_data.get("assets", [])
        if not download_url or not asset_name:
            matched = match_platform_asset(assets)
            if not matched:
                raise RuntimeError("No suitable installation package found in release assets.")
            download_url = matched.get("browser_download_url", "")
            asset_name = matched.get("name", "update_installer")

        # -------------------------------------------------------------------
        # Security: Fetch SHA256SUMS.txt to enforce cryptographic verification
        # -------------------------------------------------------------------
        expected_sha256 = None
        sha_asset = None
        for a in assets:
            if a.get("name", "").lower() in ["sha256sums.txt", "checksums.txt", "sha256.txt"]:
                sha_asset = a
                break

        if sha_asset and sha_asset.get("browser_download_url"):
            try:
                sha_req = urllib.request.Request(
                    sha_asset["browser_download_url"],
                    headers={"User-Agent": "MicMose-Photo-Culler-Pro-Updater"}
                )
                with urllib.request.urlopen(sha_req, context=ctx, timeout=10) as s_resp:
                    sha_content = s_resp.read().decode("utf-8", errors="ignore")
                    for line in sha_content.splitlines():
                        parts = line.strip().split()
                        if len(parts) >= 2:
                            h, fname = parts[0], parts[1].lstrip("*")
                            if fname.lower() == asset_name.lower():
                                expected_sha256 = h.lower().strip()
                                break
            except Exception as e:
                print(f"Warning: Failed to fetch/parse SHA256SUMS.txt: {e}")

        temp_dir = os.path.join(tempfile.gettempdir(), "MicMoseUpdate")
        os.makedirs(temp_dir, exist_ok=True)
        dest_file = os.path.join(temp_dir, asset_name)

        with updater_lock:
            updater_state["status"] = "downloading"
            updater_state["progress"] = 0.0
            updater_state["bytes_downloaded"] = 0
            updater_state["total_bytes"] = 0
            updater_state["speed_mbps"] = 0.0
            updater_state["filename"] = asset_name
            updater_state["file_path"] = dest_file
            updater_state["error_message"] = ""
            updater_state["launched"] = False

        req = urllib.request.Request(
            download_url,
            headers={"User-Agent": "MicMose-Photo-Culler-Pro-Updater"}
        )

        start_time = time.time()
        last_calc_time = start_time
        last_calc_bytes = 0

        hasher = hashlib.sha256()

        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp, open(dest_file, "wb") as out_f:
            total_bytes = int(resp.headers.get("Content-Length", 0))
            with updater_lock:
                updater_state["total_bytes"] = total_bytes

            downloaded = 0
            chunk_size = 128 * 1024  # 128KB chunks
            while True:
                chunk = resp.read(chunk_size)
                if not chunk:
                    break
                out_f.write(chunk)
                hasher.update(chunk)
                downloaded += len(chunk)

                now = time.time()
                elapsed = now - last_calc_time
                if elapsed >= 0.5:
                    speed = ((downloaded - last_calc_bytes) / elapsed) / (1024 * 1024)
                    last_calc_time = now
                    last_calc_bytes = downloaded
                else:
                    speed = updater_state["speed_mbps"]

                with updater_lock:
                    updater_state["bytes_downloaded"] = downloaded
                    updater_state["speed_mbps"] = round(speed, 2)
                    if total_bytes > 0:
                        updater_state["progress"] = round((downloaded / total_bytes) * 100, 1)

        # -------------------------------------------------------------------
        # Validate Cryptographic Hash
        # -------------------------------------------------------------------
        computed_sha256 = hasher.hexdigest().lower()
        if expected_sha256:
            if computed_sha256 != expected_sha256:
                try:
                    if os.path.exists(dest_file):
                        os.remove(dest_file)
                except Exception:
                    pass
                raise ValueError(
                    f"Cryptographic verification failed! Expected SHA-256 {expected_sha256}, "
                    f"but downloaded file hash was {computed_sha256}. Installer discarded for security."
                )

        # Download complete
        with updater_lock:
            updater_state["status"] = "ready_to_install"
            updater_state["progress"] = 100.0

        time.sleep(0.5)

        # Launch the installer
        if sys.platform == "darwin":
            subprocess.Popen(["open", dest_file])
        elif sys.platform.startswith("linux"):
            if dest_file.lower().endswith(".appimage"):
                import stat
                try:
                    st = os.stat(dest_file)
                    os.chmod(dest_file, st.st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)
                except Exception:
                    pass
            try:
                subprocess.Popen(["xdg-open", dest_file])
            except Exception:
                subprocess.Popen([dest_file])
        else:
            if dest_file.lower().endswith(".msi"):
                subprocess.Popen(["msiexec.exe", "/i", dest_file], shell=False)
            else:
                try:
                    os.startfile(dest_file)
                except Exception:
                    subprocess.Popen([dest_file], shell=False)

        with updater_lock:
            updater_state["status"] = "installing"
            updater_state["launched"] = True

    except Exception as e:
        with updater_lock:
            updater_state["status"] = "error"
            updater_state["error_message"] = str(e)


@app.post("/api/updater/download_and_install")
def trigger_download_and_install(req: DownloadInstallRequest):
    with updater_lock:
        if updater_state["status"] == "downloading":
            return {"status": "already_in_progress", "state": updater_state}

    t = threading.Thread(
        target=_run_download_and_install,
        args=(req.download_url, req.asset_name),
        daemon=True
    )
    t.start()
    return {"status": "started", "state": updater_state}


@app.post("/api/updater/quit_app")
def quit_app():
    def _delayed_exit():
        time.sleep(1.0)
        os._exit(0)
    threading.Thread(target=_delayed_exit, daemon=True).start()
    return {"status": "closing"}


from fastapi.staticfiles import StaticFiles
import sys

if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
    frontend_dist = os.path.join(base_path, 'frontend', 'dist')
else:
    base_path = os.path.dirname(os.path.abspath(__file__))
    frontend_dist = os.path.abspath(os.path.join(base_path, '..', 'frontend', 'dist'))

@app.get("/")
@app.get("/index.html")
async def serve_index():
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            html = f.read()
        injection = (
            f"<script>\n"
            f"  window.__APP_SESSION_TOKEN__ = '{APP_SESSION_TOKEN}';\n"
            f"  window.__API_PORT__ = {CURRENT_PORT};\n"
            f"</script>\n"
        )
        if "<head>" in html:
            html = html.replace("<head>", f"<head>\n{injection}", 1)
        else:
            html = f"{injection}{html}"
        resp = Response(content=html, media_type="text/html")
        resp.set_cookie(
            key="app_token",
            value=APP_SESSION_TOKEN,
            httponly=False,
            samesite="lax",
            path="/"
        )
        return resp
    return JSONResponse(status_code=404, content={"message": "Frontend distribution not found"})

assets_dir = os.path.join(frontend_dist, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{file_name}")
async def serve_static_root(file_name: str):
    file_path = os.path.join(frontend_dist, file_name)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")


def run_server():
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=CURRENT_PORT)


if __name__ == "__main__":
    import threading
    import webview
    import time

    t = threading.Thread(target=run_server)
    t.daemon = True
    t.start()

    time.sleep(1.5)

    webview_window = webview.create_window(
        'MicMose Photo Culler Pro',
        f'http://127.0.0.1:{CURRENT_PORT}',
        width=1440,
        height=890
    )
    webview.start()
