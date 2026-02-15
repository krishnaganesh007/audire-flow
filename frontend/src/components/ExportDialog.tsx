import React, { useState } from 'react';
import { X, FileText, File } from 'lucide-react';

interface ExportDialogProps {
    defaultFilename: string;
    onExport: (filename: string, format: 'docx' | 'pdf') => void;
    onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
    defaultFilename,
    onExport,
    onClose
}) => {
    // Remove extension from default name
    const baseName = defaultFilename.replace(/\.(docx|pdf)$/i, '');
    const [filename, setFilename] = useState(`refined_${baseName}`);
    const [format, setFormat] = useState<'docx' | 'pdf'>('docx');

    const handleExport = () => {
        if (!filename.trim()) return;
        onExport(filename.trim(), format);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-xl shadow-2xl w-[440px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900">Export Document</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Filename Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            File name
                        </label>
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="Enter filename..."
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleExport()}
                        />
                    </div>

                    {/* Format Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Format
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setFormat('docx')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${format === 'docx'
                                        ? 'border-blue-500 bg-blue-50/60 text-blue-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <FileText size={20} />
                                <div className="text-left">
                                    <div className="text-sm font-semibold">.docx</div>
                                    <div className="text-xs opacity-70">Word Document</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setFormat('pdf')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${format === 'pdf'
                                        ? 'border-blue-500 bg-blue-50/60 text-blue-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <File size={20} />
                                <div className="text-left">
                                    <div className="text-sm font-semibold">.pdf</div>
                                    <div className="text-xs opacity-70">PDF Document</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!filename.trim()}
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                    >
                        Export
                    </button>
                </div>
            </div>
        </div>
    );
};
