# PRD: AI-Powered Risk Control Refinement Tool (Stage 4)

## 1. Product Purpose

To automate and standardize the refinement of audit findings (NFAs) through a multi-stage AI pipeline, reducing the "back-and-forth" between Controllers and Managers.

## 2. User Persona

* **The Controller:** Uploads a draft report, reviews AI suggestions, and approves/rejects refinements.
* **The Manager:** (Passive) Receives a higher-quality first draft, reducing review cycles.

---

## 3. Functional Requirements

### 3.1 Document Ingestion & Parsing (Python Backend)

* **Supported Formats:** `.docx` (Primary), `.pdf` (Secondary).
* **Table Extraction:** The backend must identify tables and locate columns titled "Findings," "Issues," or "Observations."
* **Context Extraction:** The tool must extract global document metadata (e.g., Department, Audit Date) to provide context to the LLM.

### 3.2 The Refinement Engine (Python + Markdown Prompts)

* **Chain of Thought:** The system must sequentially execute **6 Markdown prompts** stored in `/prompts/*.md`.
* **Parallel Processing:** The backend must process each finding in the table simultaneously using `asyncio` to prevent UI hang.
* **Prompt Steps:** 1.  Clarity & Grammar
2.  Tone Alignment (Professional/Neutral)
3.  Criticality Validation (Low/Med/High/Very High)
4.  Regulatory/Policy Cross-check
5.  NFA Actionability (Is the recommendation clear?)
6.  Executive Summary Formatting

### 3.3 The Frontend Workspace (React)

* **Document Viewer:** Renders the `.docx` structure as a clean, editable HTML table.
* **The Comparison UI:** * **Original:** Red text, strikethrough.
* **Refined:** Green text, bold.
* **Interactions:** Hover-triggered "Approve" (✓) or "Reject" (✕) buttons.


* **Status Sidebar:** * Upper: Upload Zone.
* Lower: Progress tracker showing which of the 6 prompt stages each finding is currently in.



---

## 4. Technical Architecture

### **Backend (Python/FastAPI)**

* **Library:** `python-docx` for reading/writing XML nodes.
* **Library:** `LangChain` or simple `OpenAI/Gemini SDK` to manage the 6-prompt sequence.
* **Endpoint:** `POST /process-document` -> Returns a JSON mapping of cell IDs to refined text.
* **Endpoint:** `POST /export-document` -> Reconstructs the `.docx` with approved changes.

### **Frontend (React)**

* **Library:** `Tailwind CSS` for minimalist "Antigravity" styling.
* **State:** A `findings` array containing `{ id, original, refined, status: 'processing' | 'done' }`.

---

## 5. UI/UX Design Specifications

| Component | Design Rule |
| --- | --- |
| **Color Palette** | Neutral grays (`#F8FAFC`), Success green (`#15803D`), Error red (`#B91C1C`). |
| **Typography** | Monospace for draft findings, Sans-serif (Inter) for UI elements. |
| **Sidebar** | Expandable/Collapsible. Uses a "Glassmorphism" effect or flat minimalist borders. |
| **The "Diff"** | When a finding is expanded, use a vertical split within the table cell. |

---

## 6. Implementation Roadmap for Anti-gravity

### **Step 1: The Mock Environment**

Since your real prompts are on the office laptop, instruct Anti-gravity to:

1. Create a folder `/backend/prompts/` with 6 `.md` placeholders.
2. Write a Python script `main.py` using `FastAPI` that mimics the prompt chain delay.

### **Step 2: The React-Python Bridge**

1. React sends the `.docx` file as `FormData`.
2. Python parses the table and returns a JSON:
```json
{
  "finding_id_1": { "original": "...", "refined": "...", "stage": 6 },
  "finding_id_2": { "original": "...", "refined": "...", "stage": 3 }
}

```



### **Step 3: The Reconstruction**

1. Upon "Approve," the React state updates.
2. Upon "Finalize," the frontend sends the approved JSON back to Python.
3. Python uses `python-docx` to overwrite specific table cells and returns the download link.