import os
BASE = "/Users/mingyuan/workspace/sihuo/wangxtw3/1096"
def w(path, content):
    with open(os.path.join(BASE, path), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Wrote {path}: {len(content)} chars, {content.count(chr(10))} lines")
print("Script ready")

