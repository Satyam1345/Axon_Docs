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

# --- ROBUST PATHING & SETUP ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.stdout.reconfigure(encoding='utf-8')

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
    bm25 = build_index([p["text"] for p in all_pages])
    X = features(all_pages, query, bm25)
    base_scores = MODEL_PACK['clf'].predict_proba(X)[:, 1]
    candidate_indices = np.where(base_scores >= MODEL_PACK['thr'] / 5)[0]
    candidate_pages = [all_pages[i] for i in candidate_indices]

    print(f"Step 3: Re-ranking {len(candidate_pages)} candidates...")
    reranked_pages = []
    if len(candidate_pages) > 0:
        ce_scores = CE.predict([[query, p["text"][:4096]] for p in candidate_pages], show_progress_bar=False)
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
        
    output_data = {
        "collectionName": meta.get("collectionName", "Untitled"),
        "documents": meta["documents"],
        "keyInsights": [], # Placeholder
        "highlightedSections": final_sections,
        "relatedSections": [] # Placeholder
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
