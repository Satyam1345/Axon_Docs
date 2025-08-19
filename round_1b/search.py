import argparse
import json
import os
import sys
import pathlib
import re
import fitz
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi

# Robust pathing
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.stdout.reconfigure(encoding='utf-8')

# Attempt to use local venv site-packages if present
venv_site_packages = os.path.join(SCRIPT_DIR, 'venv', 'Lib', 'site-packages')
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)

def page_text(pg):
    return pg.get_text('text', sort=True).strip()

def extract_pages(pdf_path: pathlib.Path):
    doc = fitz.open(str(pdf_path))
    for pg in doc:
        text = page_text(pg)
        if text:
            first_line = text.splitlines()[0] if text else ''
            yield {
                "doc": pdf_path.stem + '.pdf',
                "page": pg.number + 1,
                "text": text,
                "title": first_line[:200]
            }

def build_index(texts):
    return BM25Okapi([t.split() for t in texts])

def main():
    parser = argparse.ArgumentParser(description='Search related content across PDFs using local models.')
    parser.add_argument('--pdf_dir', type=str, required=False, help='Directory containing PDFs',
                        default=os.path.normpath(os.path.join(SCRIPT_DIR, '..', 'frontend', 'public', 'pdfs')))
    parser.add_argument('--query', type=str, required=True)
    parser.add_argument('--top_k', type=int, default=10)
    args = parser.parse_args()

    pdf_dir = pathlib.Path(args.pdf_dir)
    if not pdf_dir.exists():
        print(json.dumps({"error": f"PDF directory not found: {pdf_dir}"}))
        sys.exit(0)

    # Load models from local folder to avoid downloads
    try:
        EMB = SentenceTransformer(os.path.join(SCRIPT_DIR, 'models', 'all-MiniLM-L6-v2'))
        CE = CrossEncoder(os.path.join(SCRIPT_DIR, 'models', 'ms-marco-MiniLM-L-6-v2'))
    except Exception as e:
        print(json.dumps({"error": f"Failed to load models: {e}"}))
        sys.exit(0)

    pdf_files = list(pdf_dir.glob('*.pdf'))
    if not pdf_files:
        print(json.dumps({"results": []}))
        sys.exit(0)

    # Extract pages
    pages = []
    for f in pdf_files:
        try:
            for p in extract_pages(f):
                pages.append(p)
        except Exception:
            # skip unreadable PDFs
            continue

    if not pages:
        print(json.dumps({"results": []}))
        sys.exit(0)

    texts = [p['text'] for p in pages]
    # Coarse retrieval via BM25 + bi-encoder cosine similarity
    bm25 = build_index(texts)
    q = args.query.strip()
    q_emb = EMB.encode([q])[0]
    p_emb = EMB.encode(texts, convert_to_numpy=True)
    cos_sim = (p_emb @ q_emb)
    bm25_scores = np.array(bm25.get_scores(q.split()))

    # Normalize and combine for initial ranking
    def norm(x):
        x = np.array(x, dtype=float)
        if x.size == 0:
            return x
        mn, mx = np.min(x), np.max(x)
        return (x - mn) / (mx - mn + 1e-9)

    base = 0.6 * norm(cos_sim) + 0.4 * norm(bm25_scores)
    idx = np.argsort(-base)[: min(len(pages), args.top_k * 5)]
    cand_pairs = [[q, texts[i][:4096]] for i in idx]

    # Cross-encoder reranking
    try:
        ce_scores = CE.predict(cand_pairs, show_progress_bar=False)
    except Exception:
        ce_scores = [0.0] * len(cand_pairs)

    reranked = sorted(
        [(int(i), float(s)) for i, s in zip(idx, ce_scores)],
        key=lambda t: t[1],
        reverse=True
    )[: args.top_k]

    results = []
    for i, score in reranked:
        p = pages[i]
        # Truncate text for payload size
        txt = p['text']
        if len(txt) > 1600:
            txt = txt[:1600].rstrip() + '...'
        results.append({
            "document": p['doc'],
            "page_number": p['page'],
            "section_title": p.get('title') or f"Page {p['page']}",
            "snippet": txt,
            "score": score
        })

    print(json.dumps({"results": results}))

if __name__ == '__main__':
    main()
