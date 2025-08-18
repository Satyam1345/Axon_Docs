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
SUBSECTION_HEAD = re.compile(r'^(\s*[0-9]+\.\s+.*|^[A-Z]\.\s+.*|^\*\*\s*.*\s*\*\*\s*)')

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
    query = f'{meta["persona"]["role"]} {meta["job_to_be_done"]["task"]}'

    pdf_files = list(pdf_dir.glob('*.pdf'))
    
    # --- THE FIX: Add the document list to the metadata ---
    # This ensures the 'documents' array is always present in the output.
    meta["documents"] = [f.name for f in pdf_files]

    if not pdf_files:
        print(f"Warning: No PDF files found in {pdf_dir}.")
        output_data = {"metadata": meta, "extracted_sections": [], "subsection_analysis": []}
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2)
        return

    print(f"Step 1: Extracting text from {len(pdf_files)} PDFs...")
    all_pages = [page for pdf_file in pdf_files for page in extract_pages(pdf_file)]
    print(f"Step 2: Analyzing {len(all_pages)} pages...")
    if not all_pages:
        print("Warning: No pages extracted from PDFs. Skipping analysis.")
        output_data = {"metadata": meta, "extracted_sections": [], "subsection_analysis": []}
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2)
        return
    bm25 = build_index([p["text"] for p in all_pages])
    X = features(all_pages, query, bm25)
    base_scores = MODEL_PACK['clf'].predict_proba(X)[:, 1]
    candidate_indices = np.where(base_scores >= MODEL_PACK['thr'] / 5)[0]
    candidate_pages = [all_pages[i] for i in candidate_indices]

    # Fallback: if no candidates after thresholding, pick top-k by base_scores
    if len(candidate_pages) == 0:
        print("No candidates found after thresholding — falling back to top-k by base score.")
        top_k_fallback = 10
        top_indices = np.argsort(base_scores)[-top_k_fallback:][::-1]
    candidate_pages = [all_pages[i] for i in top_indices]
    candidate_indices = top_indices

    print(f"Step 3: Re-ranking {len(candidate_pages)} candidates...")
    reranked_pages = []
    if len(candidate_pages) > 0:
        try:
            ce_scores = CE.predict([[query, p["text"][:4096]] for p in candidate_pages], show_progress_bar=False)
        except Exception as e:
            print(f"Cross-encoder failed, falling back to base_scores for ranking: {e}")
            # Use base_scores mapped to candidate_indices as fallback ranking scores
            try:
                ce_scores = [float(base_scores[int(i)]) for i in candidate_indices]
            except Exception:
                ce_scores = [0.0] * len(candidate_pages)

        top_k = 10
        reranked_pages = sorted(zip(candidate_pages, ce_scores), key=lambda x: x[1], reverse=True)[:top_k]

    final_sections = []
    for rank, (page_data, score) in enumerate(reranked_pages, 1):
        final_sections.append({
            "document": page_data["doc"] + '.pdf',
            "page_number": page_data["page"],
            "section_title": page_data["text"].splitlines()[0][:120],
            "importance_rank": rank
        })
    
    # --- Subsection extraction & scoring (match adobe_hackathon_round1B format) ---
    subsection_analysis_list = []
    for page_data, _score in reranked_pages:
        text = page_data.get('text', '')
        lines = text.splitlines()
        if not lines:
            continue

        # identify subsection boundaries
        subsections = []
        current_start = 0
        for i, line in enumerate(lines):
            if SUBSECTION_HEAD.match(line) and i > 0:
                sub_text = '\n'.join(lines[current_start:i]).strip()
                if sub_text:
                    subsections.append({"text": sub_text, "start_line": current_start + 1})
                current_start = i

        last_sub = '\n'.join(lines[current_start:]).strip()
        if last_sub:
            subsections.append({"text": last_sub, "start_line": current_start + 1})

        if not subsections:
            continue

        # Score subsections with CrossEncoder (fallback to zeros on failure)
        sub_texts = [s['text'][:4096] for s in subsections]
        try:
            ce_scores_sub = CE.predict([[query, st] for st in sub_texts], show_progress_bar=False)
        except Exception:
            ce_scores_sub = [0.0] * len(sub_texts)

        for i, s in enumerate(subsections):
            subsection_analysis_list.append({
                "Document": page_data["doc"] + '.pdf',
                "Page Number": page_data["page"],
                "subsection_start_line": int(s.get('start_line', 1)),
                "relevance_score_ce": float(ce_scores_sub[i]),
                "Refined Text": s['text']
            })

    # sort subsections by score desc
    subsection_analysis_list = sorted(subsection_analysis_list, key=lambda x: x['relevance_score_ce'], reverse=True)

    # Produce output in the same shape as adobe_hackathon_round1B's run.py
    # Per request: ignore any predefined persona/job inputs for now — these will be
    # inferred by the LLM downstream. Keep metadata.input_documents and timestamp.
    final_output = {
        "metadata": {
            "input_documents": meta.get("documents", []),
            "persona": {},
            "job_to_be_done": {},
            "timestamp": time.strftime('%Y-%m-%d %H:%M:%S')
        },
        "extracted_sections": final_sections,
        "subsection_analysis": subsection_analysis_list
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=2)

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
