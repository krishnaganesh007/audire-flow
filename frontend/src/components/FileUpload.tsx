import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import clsx from 'clsx';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    isUploading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isUploading }) => {
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (isUploading) return;

            const file = e.dataTransfer.files[0];
            if (file && (file.name.endsWith('.docx') || file.name.endsWith('.pdf'))) {
                onFileSelect(file);
            } else {
                alert('Please upload a .docx or .pdf file');
            }
        },
        [onFileSelect, isUploading]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (isUploading) return;

            const file = e.target.files?.[0];
            if (file) {
                onFileSelect(file);
            }
        },
        [onFileSelect, isUploading]
    );

    return (
        <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={clsx(
                "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
                isUploading ? "bg-gray-50 border-gray-300 opacity-50 cursor-not-allowed" : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
            )}
        >
            <input
                type="file"
                accept=".docx,.pdf"
                onChange={handleChange}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
            />
            <label htmlFor="file-upload" className={clsx("cursor-pointer", isUploading && "cursor-not-allowed")}>
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                        <Upload size={32} />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-900">
                            {isUploading ? 'Processing...' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Supported formats: .docx, .pdf
                        </p>
                    </div>
                </div>
            </label>
        </div>
    );
};
