with open('src/pages/PaintPreview.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for i in range(578, 600):
    if i < len(lines):
        stripped = lines[i].strip()[:60]
        indent = len(lines[i]) - len(lines[i].lstrip())
        print(f"{i+1}: indent={indent} | {stripped}")
