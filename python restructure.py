import os
import shutil

ROOT = os.path.abspath(os.getcwd())

# Docelowa architektura
paths = {
    "backend": os.path.join(ROOT, "backend"),
    "app": os.path.join(ROOT, "backend", "app"),
    "services": os.path.join(ROOT, "backend", "app", "services"),
    "frontend": os.path.join(ROOT, "frontend", "nextjs-app"),
}

# Pliki backendowe, które mają wylądować w backend/app
backend_files = [
    "main.py",
]

# Pliki usługowe, które mają wylądować w backend/app/services
service_files = [
    "analytics.py",
    "ai_predict.py",
    "charts.py",
    "scheduler.py",
    "discord_notify.py",
    "binance_client.py",
]

def ensure_dirs():
    for key, path in paths.items():
        os.makedirs(path, exist_ok=True)
        print(f"[OK] Folder ensured: {path}")

def move_file(filename, dst_folder):
    src = os.path.join(ROOT, filename)
    dst = os.path.join(dst_folder, filename)

    if not os.path.exists(src):
        print(f"[SKIP] File not found: {filename}")
        return

    if os.path.exists(dst):
        print(f"[SKIP] Target already exists, skipping: {dst}")
        return

    shutil.move(src, dst)
    print(f"[MOVE] {filename} -> {dst_folder}")

def ensure_init(path):
    init_file = os.path.join(path, "__init__.py")
    if not os.path.exists(init_file):
        with open(init_file, "w") as f:
            f.write("")
        print(f"[OK] Added missing __init__.py in: {path}")

def main():
    print("\n=== REORGANIZING PROJECT STRUCTURE ===\n")

    ensure_dirs()

    # move main.py
    for f in backend_files:
        move_file(f, paths["app"])

    # move services
    for f in service_files:
        move_file(f, paths["services"])

    # ensure __init__.py in app/ and services/
    ensure_init(paths["app"])
    ensure_init(paths["services"])

    print("\n=== DONE. New structure ready. ===")
    print("Now run backend with:")
    print("uvicorn backend.app.main:app --reload\n")

if __name__ == "__main__":
    main()
