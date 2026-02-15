import { useState } from 'react';
import { GlobalNav } from './components/GlobalNav';
import { Sidebar } from './components/Sidebar';
import { DocumentCanvas } from './components/DocumentCanvas';
import { ExportDialog } from './components/ExportDialog';
import { uploadDocument, exportDocument } from './services/api';
import type { Finding } from './types';
import './App.css';

const STAGES = [
  "Clarity & Grammar",
  "Tone Alignment",
  "Criticality Validation",
  "Regulatory Cross-check",
  "Actionability Check",
  "Executive Summary"
];

function App() {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string>("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isReviewActive = true;

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setHtmlContent("");
    setFindings([]);
    setUploadedFilename(file.name);
    try {
      const response = await uploadDocument(file);
      setHtmlContent(response.document_html);

      const findingsArray = Object.values(response.findings_map).map(f => ({
        ...f,
        decision: 'pending' as const
      }));
      setFindings(findingsArray);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to process document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setFindings(prev => prev.map(f =>
      f.id === id ? { ...f, decision: f.decision === action ? 'pending' : action } : f
    ));
  };

  const handleEdit = (id: string, newText: string) => {
    setFindings(prev => prev.map(f =>
      f.id === id ? { ...f, refined: newText } : f
    ));
  };

  const handleExportClick = () => {
    if (!uploadedFilename) {
      alert("No document uploaded yet.");
      return;
    }
    setShowExportDialog(true);
  };

  const handleExport = async (filename: string, format: 'docx' | 'pdf') => {
    setShowExportDialog(false);

    const approvedFindings = findings
      .filter(f => f.decision === 'approved')
      .reduce((acc, f) => ({ ...acc, [f.id]: f.refined }), {});

    try {
      const res = await exportDocument({
        original_filename: uploadedFilename,
        export_filename: filename,
        export_format: format,
        approved_findings: approvedFindings
      });
      const link = document.createElement('a');
      link.href = res.download_url;
      link.download = res.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export document.");
    }
  };

  const processedCount = findings.filter(f => f.status === 'done').length;
  const approvedCount = findings.filter(f => f.decision === 'approved').length;
  const rejectedCount = findings.filter(f => f.decision === 'rejected').length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <GlobalNav />

      <Sidebar
        processedCount={processedCount}
        totalCount={findings.length}
        stages={STAGES}
        isReviewActive={isReviewActive}
        onFileSelect={handleFileSelect}
        isUploading={isUploading}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200/80 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-[15px] font-semibold text-gray-800 truncate">
              {uploadedFilename || "Workspace"}
            </h1>
            {findings.length > 0 && (
              <div className="flex items-center gap-2 ml-2">
                {approvedCount > 0 && (
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-200/60">
                    {approvedCount} approved
                  </span>
                )}
                {rejectedCount > 0 && (
                  <span className="text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full ring-1 ring-red-200/60">
                    {rejectedCount} rejected
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleExportClick}
            disabled={findings.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all duration-200"
          >
            Finalize & Export
          </button>
        </header>

        {htmlContent ? (
          <DocumentCanvas
            htmlContent={htmlContent}
            findings={findings}
            onAction={handleAction}
            onEdit={handleEdit}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50/50">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <p className="text-[15px] font-medium text-gray-500 mb-1">No document loaded</p>
              <p className="text-[13px] text-gray-400">Upload a .docx or .pdf file from the sidebar to begin reviewing findings.</p>
            </div>
          </div>
        )}
      </main>

      {showExportDialog && (
        <ExportDialog
          defaultFilename={uploadedFilename}
          onExport={handleExport}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
}

export default App;
