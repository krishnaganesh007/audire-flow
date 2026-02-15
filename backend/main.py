import asyncio
import glob
import os
import io
import uuid
import asyncio
import glob
import os
import io
import uuid
import mammoth
import fitz # PyMuPDF
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from docx import Document
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "prompts")
TEMP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "temp"))
EXPORT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "exports"))
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)

app.mount("/exports", StaticFiles(directory=EXPORT_DIR), name="exports")

def load_prompts():
    prompts = {}
    prompt_files = glob.glob(os.path.join(PROMPTS_DIR, "*.md"))
    prompt_files.sort()
    for fpath in prompt_files:
        basename = os.path.basename(fpath)
        with open(fpath, "r") as f:
            prompts[basename] = f.read()
    return prompts

loaded_prompts = load_prompts()

class Finding(BaseModel):
    id: str
    original: str
    refined: str
    stage: int
    status: str
    decision: str # 'approved' | 'rejected' | 'pending'

class DocumentResponse(BaseModel):
    document_html: str
    findings_map: Dict[str, Finding]

class ExportRequest(BaseModel):
    original_filename: str
    export_filename: str = ""
    export_format: str = "docx"  # "docx" or "pdf"
    approved_findings: Dict[str, str]

@app.get("/")
async def root():
    return {"message": "Audire Flow Backend is running"}

async def refine_finding(finding_obj):
    # Simulate 6 stages of refinement in parallel or sequence
    # For this directive, we use asyncio.gather if we had independent stages, 
    # but typically refinement is sequential (output of stage 1 -> input of stage 2).
    # However, the prompt implies "parallel prompt chain" for *all findings* simultaneously.
    
    # We will simulate the time taken for all 6 stages
    await asyncio.sleep(2.0) # Simulate LLM latency
    
    refined_text = finding_obj["original"] + " [Refined by AI]"
    finding_obj["refined"] = refined_text
    finding_obj["stage"] = 6
    finding_obj["status"] = "done"
    return finding_obj

@app.post("/process-document")
async def process_document(file: UploadFile = File(...)):
    if not (file.filename.endswith('.docx') or file.filename.endswith('.pdf')):
        raise HTTPException(status_code=400, detail="Only .docx and .pdf files are supported.")

    content = await file.read()
    
    # Save temp file
    temp_id = str(uuid.uuid4())
    temp_path = os.path.join(TEMP_DIR, f"{temp_id}_{file.filename}")
    with open(temp_path, "wb") as f:
        f.write(content)

    # 1. Convert to HTML using mammoth
    # We use some custom style maps if needed to preserve finding highlighting, 
    # but for now standard conversion is fine.
    # We might need to inject IDs into the HTML to map findings back. 
    # Mammoth doesn't easily support injecting IDs into table cells during conversion 
    # without writing a custom handler.
    # STRATEGY: 
    # For this stage, we will use python-docx to find the findings first, 
    # and then we might rely on the frontend to match them, OR we try to identifying them 
    # in the HTML. 
    # 
    # BETTER STRATEGY per Directive: "Identify tables and target cells... Return JSON containing full document_html"
    # To make "In-Place Refinement" work, we need to be able to locate the specific cell in the HTML.
    # Mammoth converts tables to <table><tr><td>. 
    # We can try to assume order is preserved. 
    
    findings_map = {}
    finding_counter = 0
    
    if file.filename.endswith('.pdf'):
        # Convert PDF to HTML using PyMuPDF for high fidelity layout
        doc_pdf = fitz.open(temp_path)
        html_content = ""
        for page in doc_pdf:
            html_content += page.get_text("html")
        document_html = html_content
        
        # Extract findings from PDF text (Best effort finding extraction)
        # We look for lines starting with "Finding:" or similar keywords
        # Since we can't easily map to cells, we will just highlight them if found
        for page_num, page in enumerate(doc_pdf):
             text = page.get_text("text")
             lines = text.split('\n')
             for line in lines:
                 if any(key in line.lower() for key in ["finding:", "issue:", "observation:"]):
                     # cleanup
                     original_text = line.strip()
                     fid = f"pdf_page_{page_num}_line_{uuid.uuid4().hex[:6]}"
                     
                     finding_obj = {
                        "id": fid,
                        "original": original_text,
                        "refined": original_text, 
                        "stage": 0,
                        "status": "processing",
                        "decision": "pending"
                    }
                     findings_map[fid] = finding_obj
                     finding_counter += 1
        
        # Refine in parallel
        tasks = [refine_finding(f) for f in findings_map.values()]
        if tasks:
            await asyncio.gather(*tasks)

        return {
            "document_html": document_html,
            "findings_map": findings_map
        }

    with open(temp_path, "rb") as docx_file:
        result = mammoth.convert_to_html(docx_file)
        document_html = result.value
        messages = result.messages
        
        # Debug: Log first 1000 chars of HTML to see what mammoth generated
        print("=" * 80)
        print("MAMMOTH HTML OUTPUT (first 1000 chars):")
        print(document_html[:1000])
        print("=" * 80)

    # 2. Extract Findings using python-docx
    doc = Document(temp_path)
    findings_map = {}
    finding_counter = 0
    tables_found = 0
    
    # We need a way to link the python-docx extraction to the HTML structure.
    # Since both iterate document order, the Nth "Finding" cell in python-docx 
    # should correspond to the Nth "Finding" cell in HTML if we can identify columns.
    # This is tricky without injecting IDs. 
    # Hack for Prototype: We will return the raw findings, and the frontend 
    # will attempt to "hydrate" the HTML table cells based on content matching or index.
    
    tasks = []
    
    for table_idx, table in enumerate(doc.tables):
        header_row = table.rows[0].cells
        finding_col_idx = -1
        
        for i, cell in enumerate(header_row):
            text = cell.text.lower()
            if any(key in text for key in ["finding", "issue", "observation", "description"]):
                finding_col_idx = i
                break
        
        if finding_col_idx != -1:
            tables_found += 1
            # Row index starts at 1 to skip header
            for row_idx, row in enumerate(table.rows[1:], start=1):
                cell = row.cells[finding_col_idx]
                original_text = cell.text.strip()
                if original_text:
                    # Create a unique ID that provides a hint to location
                    # formatting: table_{index}_row_{index}_col_{index}
                    # Note: Mammoth HTML doesn't have these IDs by default.
                    fid = f"table_{table_idx}_row_{row_idx}_col_{finding_col_idx}" # 0-indexed table, 1-indexed row, 0-indexed col
                    
                    finding_obj = {
                        "id": fid,
                        "original": original_text,
                        "refined": original_text, 
                        "stage": 0,
                        "status": "processing",
                        "decision": "pending"
                    }
                    findings_map[fid] = finding_obj
                    tasks.append(refine_finding(finding_obj))
                    finding_counter += 1

    # 3. Process Parallel Refinement
    if tasks:
        await asyncio.gather(*tasks)
    
    return {
        "document_html": document_html,
        "findings_map": findings_map
    }

@app.post("/export-document")
async def export_document(request: ExportRequest):
    # Find the original file in Temp
    temp_files = glob.glob(os.path.join(TEMP_DIR, f"*_{request.original_filename}"))
    if not temp_files:
        temp_files = glob.glob(os.path.join(TEMP_DIR, f"*_{request.original_filename}"))
        if not temp_files:
             raise HTTPException(status_code=404, detail="Original document not found in cache. Please re-upload.")

    latest_temp = max(temp_files, key=os.path.getmtime)
    doc = Document(latest_temp)

    # Re-apply findings
    for table_idx, table in enumerate(doc.tables):
        header_row = table.rows[0].cells
        finding_col_idx = -1
        for i, cell in enumerate(header_row):
            text = cell.text.lower()
            if any(key in text for key in ["finding", "issue", "observation", "description"]):
                finding_col_idx = i
                break
        
        if finding_col_idx != -1:
            for row_idx, row in enumerate(table.rows[1:], start=1):
                original_text = row.cells[finding_col_idx].text.strip()
                if not original_text:
                     continue

                # Reconstruct the ID we used
                fid = f"table_{table_idx}_row_{row_idx}_col_{finding_col_idx}"
                
                if fid in request.approved_findings:
                    row.cells[finding_col_idx].text = request.approved_findings[fid]

    export_base = request.export_filename if request.export_filename else f"refined_{request.original_filename.replace('.docx','').replace('.pdf','')}"
    
    # Always save docx first
    docx_filename = f"{export_base}.docx"
    docx_path = os.path.join(EXPORT_DIR, docx_filename)
    doc.save(docx_path)

    if request.export_format == "pdf":
        # Convert docx to pdf using LibreOffice (available on most systems)
        import subprocess
        # Check if soffice exists at expected homebrew path or fall back to 'soffice'
        soffice_path = "/opt/homebrew/bin/soffice"
        if not os.path.exists(soffice_path):
            soffice_path = "soffice"
            
        try:
            print(f"Converting {docx_path} to PDF using {soffice_path}...")
            result = subprocess.run([
                soffice_path, "--headless", "--convert-to", "pdf",
                "--outdir", EXPORT_DIR, docx_path
            ], check=True, timeout=30, capture_output=True, text=True)
            print(f"Soffice output: {result.stdout}")
            export_filename = f"{export_base}.pdf"
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            # Fallback: just return docx if PDF conversion fails
            print(f"PDF conversion failed: {str(e)}")
            if isinstance(e, subprocess.CalledProcessError):
                print(f"Soffice error: {e.stderr}")
            export_filename = docx_filename
    else:
        export_filename = docx_filename

    export_path = os.path.join(EXPORT_DIR, export_filename)

    return {
        "download_url": f"http://localhost:8000/exports/{export_filename}",
        "filename": export_filename
    }

@app.get("/prompts")
async def get_prompts():
    return loaded_prompts
