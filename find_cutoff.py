with open('src/pages/PaintPreview.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line that closes pp-quick-colors </div>
# It should be at 24-space indent and contain '</div>'
# After that line, everything is old broken tail that needs to go

cutoff = None
for i in range(560, min(600, len(lines))):
    stripped = lines[i].strip()
    indent = len(lines[i]) - len(lines[i].lstrip())
    if stripped == '</div>' and indent == 24:
        # Check that previous few lines contain 'pp-quick' related content
        context = ''.join(lines[max(0,i-5):i])
        if 'pp-quick' in context or 'selectAndApply' in context:
            cutoff = i + 1
            print(f'Found cutoff at line {i+1} (0-indexed {i}): {repr(lines[i][:50])}')
            break

if cutoff is None:
    # Fallback: print lines 570-595 to see
    for j in range(570, min(600, len(lines))):
        stripped = lines[j].strip()[:50]
        indent = len(lines[j]) - len(lines[j].lstrip())
        print(f'{j+1}: indent={indent} {stripped}')
