import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { FileUpload } from './FileUpload';

interface SidebarProps {
    processedCount: number;
    totalCount: number;
    stages: string[];
    isReviewActive: boolean;
    onFileSelect: (file: File) => void;
    isUploading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
    processedCount,
    totalCount,
    stages,
    isReviewActive,
    onFileSelect,
    isUploading
}) => {
    if (!isReviewActive) return null;

    return (
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 transition-all duration-300 shadow-xl z-10">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
                    Action Drawer
                </h2>
                <p className="text-xs text-gray-500">Document Processing & Status</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Upload Zone (Top of Drawer) */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Source Document
                    </h3>
                    <div className="w-full">
                        <FileUpload onFileSelect={onFileSelect} isUploading={isUploading} />
                    </div>
                </div>

                {/* Timeline Status */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Refinement Timeline
                        </h3>
                        <span className="text-xs font-medium text-blue-600">
                            {processedCount}/{totalCount} items
                        </span>
                    </div>

                    <div className="relative pl-2 border-l-2 border-gray-100 space-y-6 ml-1">
                        {stages.map((stage, index) => {
                            // Logic to simulate stage progress based on total items processed
                            // If we have items:
                            // - 0 processed: All pending
                            // - some processed: Show active
                            // - all processed: Show done
                            // This is a simplification for the UI directive
                            const isStarted = totalCount > 0;
                            const isDone = totalCount > 0 && processedCount === totalCount;
                            const isProcessing = isStarted && !isDone;

                            // For the sake of the demo visual:
                            // if processing, stage 1-3 done, 4 active?
                            // Let's just make it simple: All processing or All done.

                            let stageStatus: 'pending' | 'processing' | 'done' = 'pending';
                            if (isDone) stageStatus = 'done';
                            else if (isProcessing) stageStatus = 'processing';

                            return (
                                <div key={stage} className="relative pl-6">
                                    <div className={clsx(
                                        "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white transition-colors",
                                        stageStatus === 'done' ? "border-green-500 text-green-500" :
                                            stageStatus === 'processing' ? "border-blue-500 animate-pulse" : "border-gray-200"
                                    )}>
                                        {stageStatus === 'done' && <CheckCircle2 size={10} />}
                                        {stageStatus === 'processing' && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                                    </div>
                                    <p className={clsx(
                                        "text-sm font-medium transition-colors",
                                        stageStatus === 'done' ? "text-gray-900" : stageStatus === 'processing' ? "text-blue-600" : "text-gray-400"
                                    )}>
                                        {stage}
                                    </p>
                                    {stageStatus === 'processing' && <p className="text-[10px] text-blue-500 mt-0.5">Processing...</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </aside>
    );
};
