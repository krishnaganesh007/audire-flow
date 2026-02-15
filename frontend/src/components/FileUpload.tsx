import React, { useCallback } from 'react';
import { Upload, FileUp } from 'lucide-react';
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
                "border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer",
                isUploading
                    ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                    : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/40"
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
                <div className="flex flex-col items-center gap-3">
                    <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200",
                        isUploading ? "bg-gray-100 text-gray-400" : "bg-blue-50 text-blue-500"
                    )}>
                        {isUploading ? (
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        ) : (
                            <FileUp size={20} />
                        )}
                    </div>
                    <div>
                        <p className="text-[13px] font-medium text-gray-700">
                            {isUploading ? 'Processing...' : 'Drop file or click to browse'}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                            .docx, .pdf
                        </p>
                    </div>
                </div>
            </label>
        </div>
    );
};
