"""
Batch extract field diagrams from all training PDFs.
Output: public/trainingen/{agegroup}/t{N}_p{page}.png  (O8)
        public/trainingen/{agegroup}/t{N}{a|b}_p{page}.png  (O9-O12)
"""
import fitz
import os
import re

PDF_DIR = r'D:\APPS\Voetbal\player-hub\trainingen'
OUT_BASE = r'D:\APPS\Voetbal\player-hub\public\trainingen'

O8_PAT = re.compile(r'^Training (\d+) \(O8\)\.pdf$', re.IGNORECASE)
OTHER_PAT = re.compile(r'^Training (\d+)([AB]) \(O(\d+)\)\.pdf$', re.IGNORECASE)


def extract_diagrams(filepath: str, out_dir: str, prefix: str):
    doc = fitz.open(filepath)
    os.makedirs(out_dir, exist_ok=True)
    saved = 0
    for pi in range(len(doc)):
        page = doc[pi]
        infos = [
            i for i in page.get_image_info(xrefs=True)
            if (i['bbox'][2] - i['bbox'][0]) > 50
        ]
        if not infos:
            continue
        b = infos[0]['bbox']
        pad = 4
        clip = fitz.Rect(b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad)
        mat = fitz.Matrix(3, 3)
        pix = page.get_pixmap(matrix=mat, clip=clip)
        out_path = os.path.join(out_dir, f'{prefix}_p{pi + 1}.png')
        pix.save(out_path)
        saved += 1
    doc.close()
    return saved


total = 0
errors = []

for filename in sorted(os.listdir(PDF_DIR)):
    if not filename.endswith('.pdf'):
        continue

    m8 = O8_PAT.match(filename)
    mo = OTHER_PAT.match(filename)

    if m8:
        num = m8.group(1)
        out_dir = os.path.join(OUT_BASE, 'o8')
        prefix = f't{num}'
    elif mo:
        num = mo.group(1)
        session = mo.group(2).lower()
        age_num = mo.group(3)
        out_dir = os.path.join(OUT_BASE, f'o{age_num}')
        prefix = f't{num}{session}'
    else:
        continue

    filepath = os.path.join(PDF_DIR, filename)
    try:
        n = extract_diagrams(filepath, out_dir, prefix)
        total += n
        print(f'OK  {filename:45s} => {prefix}_p1..p{n}')
    except Exception as e:
        errors.append(filename)
        print(f'ERR {filename}: {e}', flush=True)

print(f'\nDone: {total} diagrams extracted, {len(errors)} errors')
if errors:
    for e in errors:
        print(f'  FAILED: {e}')
