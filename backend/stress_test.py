import os
import time
import shutil
import psutil
from ai_engine import get_engine
import numpy as np
import cv2

def main():
    print("--- Starting Code Stress Test (Memory Leak Check) ---")
    
    # 1. Generate 1 dummy image of 4000x6000 (24 MP)
    print("Generating base 24MP test image...")
    os.makedirs("stress_test_imgs", exist_ok=True)
    base_img = np.random.randint(0, 256, (6000, 4000, 3), dtype=np.uint8)
    base_path = "stress_test_imgs/base.jpg"
    cv2.imwrite(base_path, base_img)
    
    # 2. Duplicate it to create 100 images to run through (100 is enough to see a leak if it exists)
    print("Duplicating to 100 files...")
    test_files = []
    for i in range(100):
        target = f"stress_test_imgs/test_{i}.jpg"
        shutil.copy(base_path, target)
        test_files.append(target)
        
    engine = get_engine()
    
    process = psutil.Process(os.getpid())
    start_mem = process.memory_info().rss / 1024 / 1024
    print(f"Initial Memory Usage: {start_mem:.2f} MB")
    
    start_time = time.time()
    
    # 3. Analyze all images
    for i, file in enumerate(test_files):
        res = engine.analyze_image(file)
        if i % 10 == 0:
            current_mem = process.memory_info().rss / 1024 / 1024
            print(f"Processed {i}/100 - Memory Usage: {current_mem:.2f} MB")
            
    end_time = time.time()
    end_mem = process.memory_info().rss / 1024 / 1024
    print(f"Final Memory Usage: {end_mem:.2f} MB")
    print(f"Memory Diff: {end_mem - start_mem:.2f} MB")
    print(f"Total Time for 100 24MP Images: {end_time - start_time:.2f} seconds")
    
    # Cleanup
    print("Cleaning up files...")
    for f in test_files:
        os.remove(f)
    os.remove(base_path)
    os.rmdir("stress_test_imgs")
    
    if end_mem - start_mem < 100:
        print("RESULT: SUCCESS. No significant memory leak detected.")
    else:
        print("RESULT: FAILED. Potential memory leak detected.")

if __name__ == '__main__':
    main()
