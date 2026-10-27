from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
import os
import sys
import traceback

if sys.stdout is None:
    sys.stdout = open(os.devnull, "w", encoding="utf-8")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w", encoding="utf-8")
import cv2
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import numpy as np

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        return engine.get_hardware_telemetry()
    except Exception as e:
        return {
            "device_name": f"CPU Fallback ({os.cpu_count() or 8} Threads)",
            "backend": "CPU Fallback",
            "opencl_active": False,
            "gpu_active": False,
            "gpu_util_percent": 0,
            "vram_used_mb": 0,
            "vram_total_mb": 0,
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


from fastapi.staticfiles import StaticFiles
import sys

if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
    frontend_dist = os.path.join(base_path, 'frontend', 'dist')
else:
    base_path = os.path.dirname(os.path.abspath(__file__))
    frontend_dist = os.path.abspath(os.path.join(base_path, '..', 'frontend', 'dist'))

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
else:
    print(f"Warning: Frontend dist folder not found at {frontend_dist}")


def run_server():
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)


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
        'http://127.0.0.1:8000',
        width=1440,
        height=890
    )
    webview.start()
