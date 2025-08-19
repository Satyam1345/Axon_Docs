# round_1b/run.py
import argparse
import json
import time
import re
import os
import pathlib
import sys
import numpy as np
import joblib
import fitz
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import HashingVectorizer
from datetime import datetime

# --- ROBUST PATHING & SETUP ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.stdout.reconfigure(encoding='utf-8')

# --- VENV ACTIVATION ---
# This ensures the script uses packages from the local venv
script_dir = os.path.dirname(os.path.abspath(__file__))
venv_site_packages = os.path.join(script_dir, 'venv', 'Lib', 'site-packages')
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)
# --- END VENV ACTIVATION ---

# --- Model Loading ---
print("Loading AI models from:", SCRIPT_DIR)
try:
    EMB = SentenceTransformer(os.path.join(SCRIPT_DIR, 'models', 'all-MiniLM-L6-v2'))
    CE = CrossEncoder(os.path.join(SCRIPT_DIR, 'models', 'ms-marco-MiniLM-L-6-v2'))
    HV = HashingVectorizer(stop_words='english', n_features=2**20)
    MODEL_PACK = joblib.load(os.path.join(SCRIPT_DIR, 'lgbm_relevance.joblib'))
    print("Models loaded successfully.")
except Exception as e:
    print(f"FATAL ERROR: Could not load models. Error: {e}")
    sys.exit(1)

# --- Helper Functions ---
def page_text(pg):
    return pg.get_text('text', sort=True).strip()

def extract_pages(pdf_path):
    doc = fitz.open(pdf_path)
    for pg in doc:
        text = page_text(pg)
        if text:
            yield {"doc": pdf_path.stem, "page": pg.number + 1, "text": text, "is_head": bool(re.match(r'^([0-9]+(\\.[0-9]+)*|[IVXLCDM]+)\\s+', text.splitlines()[0] if text else ''))}

def build_index(texts):
    return BM25Okapi([t.split() for t in texts])

def features(pages, query, bm25):
    texts = [p["text"] for p in pages]
    q_emb = EMB.encode([query])[0]
    p_emb = EMB.encode(texts, convert_to_numpy=True)
    cos_sim = (p_emb @ q_emb)
    bm25_scores = np.array(bm25.get_scores(query.split()))
    tf_scores = HV.transform(texts).dot(HV.transform([query]).T).toarray().ravel()
    struct_scores = np.array([p["is_head"] for p in pages], dtype=float)
    return np.vstack([cos_sim, bm25_scores, tf_scores, struct_scores]).T

# --- Main Analysis Function ---
def analyze_collection(input_dir, output_path):
    start_time = time.time()
    
    pdf_dir = input_dir / 'PDFs'
    meta_path = input_dir / 'challenge1b_input.json'

    if not meta_path.exists():
        print(f"Error: challenge1b_input.json not found in {input_dir}")
        sys.exit(1)

    meta = json.load(open(meta_path))
    # Normalize persona and job fields from possible nested structure
    persona_value = None
    job_value = None
    if isinstance(meta.get("persona"), dict):
        persona_value = meta.get("persona", {}).get("role")
    else:
        persona_value = meta.get("persona")

    if isinstance(meta.get("job_to_be_done"), dict):
        job_value = meta.get("job_to_be_done", {}).get("task")
    else:
        job_value = meta.get("job_to_be_done")

    persona_value = persona_value or ""
    job_value = job_value or ""
    query = f"{persona_value} {job_value}".strip()

    pdf_files = list(pdf_dir.glob('*.pdf'))
    
    # Construct output metadata in the expected schema
    metadata_out = {
        "input_documents": [f.name for f in pdf_files],
        "persona": persona_value,
        "job_to_be_done": job_value,
        "processing_timestamp": datetime.utcnow().isoformat()
    }

    if not pdf_files:
        print(f"Warning: No PDF files found in {pdf_dir}.")
        output_data = {"metadata": metadata_out, "extracted_sections": [], "subsection_analysis": []}
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2)
        return

    print(f"Step 1: Extracting text from {len(pdf_files)} PDFs...")
    all_pages = [page for pdf_file in pdf_files for page in extract_pages(pdf_file)]
    print(f"Step 2: Analyzing {len(all_pages)} pages...")
    if not all_pages:
        print("Warning: No pages extracted from PDFs. Skipping analysis.")
        output_data = {"metadata": metadata_out, "extracted_sections": [], "subsection_analysis": []}
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2)
        return
    bm25 = build_index([p["text"] for p in all_pages])
    X = features(all_pages, query, bm25)
    base_scores = MODEL_PACK['clf'].predict_proba(X)[:, 1]
    candidate_indices = np.where(base_scores >= MODEL_PACK['thr'] / 5)[0]
    candidate_pages = [all_pages[i] for i in candidate_indices]

    print(f"Step 3: Re-ranking {len(candidate_pages)} candidates...")
    # Global ranking across all pages (common order across PDFs)
    # Primary score: CE (if available), fallback to BM25. Secondary tie-breaker: BM25 and heading flag.
    top_k = 20
    ce_scored = []  # (page_data, ce_score, bm25_score, is_head)
    try:
        if len(candidate_pages) > 0:
            ce_scores = CE.predict([[query, p["text"][:4096]] for p in candidate_pages], show_progress_bar=False)
            # Precompute BM25 scores for candidate pages as tie-breakers
            bm25_scores_all = bm25.get_scores(query.split())
            bm25_map = {id(p): s for p, s in zip(all_pages, bm25_scores_all)}
            for p, ce in zip(candidate_pages, ce_scores):
                ce_scored.append((p, float(ce), float(bm25_map.get(id(p), 0.0)), 1.0 if p.get("is_head") else 0.0))
    except Exception as e:
        print(f"CrossEncoder scoring failed ({e}); using BM25 global ranking.")
        ce_scored = []

    ranked = []
    if ce_scored:
        # Sort by CE desc, then BM25 desc, then heading desc
        ranked = sorted(ce_scored, key=lambda x: (x[1], x[2], x[3]), reverse=True)
        ranked = ranked[:min(top_k, len(ranked))]
        ranked = [(p, s_ce) for (p, s_ce, _, _) in ranked]
    else:
        # Global BM25 ranking across all pages
        bm25_scores_all = bm25.get_scores(query.split())
        # include heading as tie-breaker
        ranked_bm25 = [(p, float(s), 1.0 if p.get("is_head") else 0.0) for p, s in zip(all_pages, bm25_scores_all)]
        ranked_bm25.sort(key=lambda x: (x[1], x[2]), reverse=True)
        ranked = [(p, s) for (p, s, _) in ranked_bm25[:min(top_k, len(ranked_bm25))]]

    final_sections = []
    subsection_items = []
    for rank, (page_data, score) in enumerate(ranked, 1):
        docname = page_data["doc"] + '.pdf'
        title = page_data["text"].splitlines()[0][:120] if page_data["text"] else f"Page {page_data['page']}"
        final_sections.append({
            "document": docname,
            "section_title": title,
            "importance_rank": rank,
            "page_number": page_data["page"]
        })
        refined_text = page_data["text"].strip() if page_data["text"] else ""
        if len(refined_text) > 2000:
            refined_text = refined_text[:2000].rstrip() + "..."
        subsection_items.append({
            "document": docname,
            "refined_text": refined_text,
            "page_number": page_data["page"]
        })

    output_data = {
        "metadata": metadata_out,
        "extracted_sections": final_sections,
        "subsection_analysis": subsection_items
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)

    end_time = time.time()
    print(f"✅ Analysis complete in {end_time - start_time:.2f} seconds.")

# --- Script Entry Point ---
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Analyze a collection of PDF documents.')
    parser.add_argument('--input_dir', type=str, required=True)
    parser.add_argument('--output_path', type=str, required=True)
    args = parser.parse_args()

    input_directory = pathlib.Path(args.input_dir)
    output_file_path = pathlib.Path(args.output_path)

    analyze_collection(input_directory, output_file_path)