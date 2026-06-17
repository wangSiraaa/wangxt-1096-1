# -*- coding: utf-8 -*-
import os
BASE = "/Users/mingyuan/workspace/sihuo/wangxtw3/1096"
def w(relative_path, content):
    full_path = os.path.join(BASE, relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  wrote {relative_path}")
print("Generating files...")

