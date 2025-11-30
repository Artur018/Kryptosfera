import os
import re

ROOT = os.path.abspath(os.getcwd())
TARGET_DIRS = [
    os.path.join(ROOT, "backend", "app"),
    os.path.join(ROOT, "backend", "app", "services"),
]

PATTERNS = [
    # from services.module import X
    (r"from\s+services\.(\w+)\s+import\s+([^\n]+)",
     r"from app.services.\1 import \2"),

    # import services.module
    (r"import\s+services\.(\w+)",
     r"import app.services.\1"),

    # from services import module   -> edge case
    (r"from\s+services\s+import\s+(\w+)",
     r"from app.services import \1"),
]

def process_file(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    for pattern, repl in PATTERNS:
        content = re.sub(pattern, repl, content)

    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[FIXED] {path}")
    else:
        print(f"[OK]    {path}")

def main():
    print("\n=== FIXING IMPORTS IN backend/app/* ===\n")

    for folder in TARGET_DIRS:
        if not os.path.exists(folder):
            print(f"[SKIP] Folder does not exist: {folder}")
            continue

        for root, _, files in os.walk(folder):
            for file in files:
                if file.endswith(".py"):
                    process_file(os.path.join(root, file))

    print("\n=== DONE. Imports updated. ===\n")

if __name__ == "__main__":
    main()
