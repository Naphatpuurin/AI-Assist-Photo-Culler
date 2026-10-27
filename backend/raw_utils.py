"""
RAW file support for MicMose Photo Culler Pro.
- Decodes Canon CR2/CR3, Nikon NEF, Sony ARW, Fuji RAF, Panasonic RW2, Olympus ORF, Pentax PEF, Adobe DNG, etc.
- Uses the camera's embedded full-size JPEG preview when available (very fast, same as Lightroom's
  "Embedded & Sidecar" previews), and falls back to a half-size LibRaw demosaic otherwise.
- Reads EXIF from RAW containers with exifread (PIL cannot parse most RAW files).
"""
import io
import os
import cv2
import numpy as np

RAW_EXTENSIONS = (
    '.cr2', '.cr3', '.crw', '.nef', '.nrw', '.arw', '.srf', '.sr2', '.raf', '.rw2',
    '.orf', '.pef', '.dng', '.srw', '.x3f', '.3fr', '.iiq', '.erf', '.kdc', '.mrw', '.mef', '.mos'
)
RASTER_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.heic')
SUPPORTED_EXTENSIONS = RASTER_EXTENSIONS + RAW_EXTENSIONS


def is_raw(path: str) -> bool:
    return path.lower().endswith(RAW_EXTENSIONS)


def _raw_preview_jpeg_bytes(path: str):
    """Return the embedded JPEG preview bytes from a RAW file, or None."""
    try:
        import rawpy
        with rawpy.imread(path) as raw:
            try:
                thumb = raw.extract_thumb()
                if thumb.format == rawpy.ThumbFormat.JPEG:
                    return bytes(thumb.data)
                if thumb.format == rawpy.ThumbFormat.BITMAP:
                    rgb = np.asarray(thumb.data)
                    ok, buf = cv2.imencode('.jpg', cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])
                    return buf.tobytes() if ok else None
            except Exception:
                pass
            # No usable embedded preview: half-size demosaic
            rgb = raw.postprocess(half_size=True, use_camera_wb=True, no_auto_bright=False, output_bps=8)
            ok, buf = cv2.imencode('.jpg', cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])
            return buf.tobytes() if ok else None
    except Exception as e:
        print(f"[RAW] Could not decode {path}: {e}")
        return None


def load_image_bgr(path: str, reduced: bool = True):
    """Load any supported image (RAW or raster) as a BGR numpy array."""
    if is_raw(path):
        data = _raw_preview_jpeg_bytes(path)
        if not data:
            return None
        arr = np.frombuffer(data, dtype=np.uint8)
        flag = cv2.IMREAD_REDUCED_COLOR_2 if reduced else cv2.IMREAD_COLOR
        img = cv2.imdecode(arr, flag)
        if img is None:
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img

    img = cv2.imread(path, cv2.IMREAD_REDUCED_COLOR_2) if reduced else None
    if img is None:
        img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        # Unicode paths / formats cv2 can't open directly
        try:
            arr = np.fromfile(path, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        except Exception:
            img = None
    return img


def get_display_jpeg_bytes(path: str, max_size=None, quality=85):
    """JPEG bytes suitable for the browser (used for thumbnails and the RAW loupe view)."""
    if is_raw(path):
        data = _raw_preview_jpeg_bytes(path)
        if data is None:
            return None
        if max_size is None:
            return data
        img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_REDUCED_COLOR_4)
    else:
        img = load_image_bgr(path, reduced=max_size is not None)
    if img is None:
        return None
    if max_size:
        h, w = img.shape[:2]
        s = max_size / float(max(h, w))
        if s < 1.0:
            img = cv2.resize(img, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
    ok, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return buf.tobytes() if ok else None


def read_raw_exif(path: str) -> dict:
    """Read key EXIF tags from a RAW file with exifread. Returns a dict of plain strings."""
    out = {}
    try:
        import exifread
        with open(path, 'rb') as f:
            tags = exifread.process_file(f, details=False)
        mapping = {
            'make': 'Image Make',
            'model': 'Image Model',
            'lens': 'EXIF LensModel',
            'exposure_time': 'EXIF ExposureTime',
            'f_number': 'EXIF FNumber',
            'iso': 'EXIF ISOSpeedRatings',
            'focal_length': 'EXIF FocalLength',
            'datetime_original': 'EXIF DateTimeOriginal',
            'datetime': 'Image DateTime',
            'artist': 'Image Artist',
            'copyright': 'Image Copyright',
            'width': 'EXIF ExifImageWidth',
            'height': 'EXIF ExifImageLength',
        }
        for key, tag in mapping.items():
            if tag in tags:
                out[key] = tags[tag]
        if 'iso' not in out and 'EXIF PhotographicSensitivity' in tags:
            out['iso'] = tags['EXIF PhotographicSensitivity']
        if 'lens' not in out:
            for alt in ('MakerNote LensModel', 'MakerNote LensType', 'EXIF LensSpecification'):
                if alt in tags:
                    out['lens'] = tags[alt]
                    break
    except Exception as e:
        print(f"[RAW] EXIF read failed for {path}: {e}")
    return out


def ratio_to_float(val):
    """Convert an exifread value (Ratio / list / str) to float."""
    try:
        v = val.values[0] if hasattr(val, 'values') and isinstance(val.values, list) else val
        if hasattr(v, 'num') and hasattr(v, 'den'):
            return float(v.num) / float(v.den) if v.den else None
        s = str(v)
        if '/' in s:
            n, d = s.split('/')
            return float(n) / float(d) if float(d) else None
        return float(s)
    except Exception:
        return None
