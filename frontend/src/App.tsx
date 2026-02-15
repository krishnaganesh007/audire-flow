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
  const [editedHtml, setEditedHtml] = useState<string>("");
  const [showExportDialog, setShowExportDialog] = useState(false);
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
      // Trigger download
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
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10 shrink-0">
          <h1 className="text-base font-semibold text-gray-800 truncate">
            {uploadedFilename || "Workspace"}
          </h1>
          <button
            onClick={handleExportClick}
            disabled={findings.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
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
            onContentEdit={setEditedHtml}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50/50">
            <div className="text-center">
              <p>Select "Review" and Upload a Document to start.</p>
            </div>
          </div>
        )}
      </main>

      {/* Export Dialog Modal */}
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
