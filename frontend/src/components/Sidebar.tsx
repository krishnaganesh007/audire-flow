import React from 'react';
import { CheckCircle2, Upload, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { FileUpload } from './FileUpload';

interface SidebarProps {
    processedCount: number;
    totalCount: number;
    stages: string[];
    isReviewActive: boolean;
    onFileSelect: (file: File) => void;
    isUploading: boolean;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

const STAGE_ICONS: Record<string, string> = {
    "Clarity & Grammar": "Aa",
    "Tone Alignment": "Ta",
    "Criticality Validation": "Cv",
    "Regulatory Cross-check": "Rc",
    "Actionability Check": "Ac",
    "Executive Summary": "Es",
};

export const Sidebar: React.FC<SidebarProps> = ({
    processedCount,
    totalCount,
    stages,
    isReviewActive,
    onFileSelect,
    isUploading,
    collapsed,
    onToggleCollapse,
}) => {
    if (!isReviewActive) return null;

    return (
        <aside
            className={clsx(
                "bg-white border-r border-gray-200/80 flex flex-col h-screen sticky top-0 z-10 transition-all duration-300 ease-in-out",
                collapsed ? "w-[68px]" : "w-80"
            )}
        >
            {/* Header */}
            <div className={clsx(
                "flex items-center border-b border-gray-100 shrink-0 transition-all duration-300",
                collapsed ? "px-3 py-4 justify-center" : "px-5 py-4 justify-between"
            )}>
                {!collapsed && (
                    <div className="min-w-0">
                        <h2 className="text-[13px] font-semibold text-gray-800 tracking-wide">
                            Action Drawer
                        </h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">Processing & Status</p>
                    </div>
                )}
                <button
                    onClick={onToggleCollapse}
                    className={clsx(
                        "p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200",
                        collapsed && "mx-auto"
                    )}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Content */}
            <div className={clsx(
                "flex-1 overflow-y-auto transition-all duration-300",
                collapsed ? "px-2 py-4" : "px-5 py-5"
            )}>
                {/* Upload Zone */}
                {collapsed ? (
                    <div className="relative group mb-6">
                        <button
                            onClick={() => document.getElementById('file-upload')?.click()}
                            className="w-11 h-11 mx-auto flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200"
                        >
                            <Upload size={18} />
                        </button>
                        <Tooltip text="Upload Document" />
                    </div>
                ) : (
                    <div className="mb-6">
                        <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2.5">
                            Source Document
                        </h3>
                        <FileUpload onFileSelect={onFileSelect} isUploading={isUploading} />
                    </div>
                )}

                {/* Divider */}
                <div className={clsx("border-t border-gray-100 mb-5", collapsed && "mx-1")} />

                {/* Timeline */}
                {collapsed ? (
                    /* Collapsed: icon-only stage indicators */
                    <div className="flex flex-col items-center gap-3">
                        {stages.map((stage) => {
                            const isStarted = totalCount > 0;
                            const isDone = totalCount > 0 && processedCount === totalCount;
                            const isProcessing = isStarted && !isDone;

                            let stageStatus: 'pending' | 'processing' | 'done' = 'pending';
                            if (isDone) stageStatus = 'done';
                            else if (isProcessing) stageStatus = 'processing';

                            const abbrev = STAGE_ICONS[stage] || stage.substring(0, 2);

                            return (
                                <div key={stage} className="relative group">
                                    <div
                                        className={clsx(
                                            "w-11 h-11 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all duration-200 select-none",
                                            stageStatus === 'done'
                                                ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                                                : stageStatus === 'processing'
                                                    ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200 animate-pulse"
                                                    : "bg-gray-50 text-gray-400 ring-1 ring-gray-200/60"
                                        )}
                                    >
                                        {stageStatus === 'done' ? (
                                            <CheckCircle2 size={16} />
                                        ) : (
                                            abbrev
                                        )}
                                    </div>
                                    <Tooltip text={stage} />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Expanded: full timeline */
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                Refinement Pipeline
                            </h3>
                            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                {processedCount}/{totalCount}
                            </span>
                        </div>

                        <div className="relative ml-1 space-y-1">
                            {stages.map((stage, index) => {
                                const isStarted = totalCount > 0;
                                const isDone = totalCount > 0 && processedCount === totalCount;
                                const isProcessing = isStarted && !isDone;

                                let stageStatus: 'pending' | 'processing' | 'done' = 'pending';
                                if (isDone) stageStatus = 'done';
                                else if (isProcessing) stageStatus = 'processing';

                                return (
                                    <div key={stage} className="flex items-start gap-3 relative">
                                        {/* Connector line */}
                                        {index < stages.length - 1 && (
                                            <div
                                                className={clsx(
                                                    "absolute left-[13px] top-[26px] w-0.5 h-[calc(100%+4px-26px)]",
                                                    stageStatus === 'done' ? "bg-emerald-200" : "bg-gray-100"
                                                )}
                                            />
                                        )}

                                        {/* Dot */}
                                        <div className={clsx(
                                            "w-[26px] h-[26px] rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                                            stageStatus === 'done'
                                                ? "bg-emerald-50 text-emerald-500"
                                                : stageStatus === 'processing'
                                                    ? "bg-blue-50 text-blue-500"
                                                    : "bg-gray-50 text-gray-300"
                                        )}>
                                            {stageStatus === 'done' ? (
                                                <CheckCircle2 size={14} />
                                            ) : stageStatus === 'processing' ? (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                            )}
                                        </div>

                                        {/* Label */}
                                        <div className="pt-[3px] min-w-0">
                                            <p className={clsx(
                                                "text-[13px] font-medium transition-colors leading-tight",
                                                stageStatus === 'done'
                                                    ? "text-gray-800"
                                                    : stageStatus === 'processing'
                                                        ? "text-blue-600"
                                                        : "text-gray-400"
                                            )}>
                                                {stage}
                                            </p>
                                            {stageStatus === 'processing' && (
                                                <p className="text-[10px] text-blue-400 mt-0.5 flex items-center gap-1">
                                                    <Clock size={9} />
                                                    Processing...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer with count (collapsed only) */}
            {collapsed && totalCount > 0 && (
                <div className="shrink-0 py-3 px-2 border-t border-gray-100">
                    <div className="relative group">
                        <div className="w-11 h-11 mx-auto rounded-xl bg-blue-50 flex items-center justify-center text-[11px] font-bold text-blue-600">
                            {processedCount}/{totalCount}
                        </div>
                        <Tooltip text={`${processedCount} of ${totalCount} processed`} />
                    </div>
                </div>
            )}
        </aside>
    );
};

/* Tooltip component for collapsed state */
const Tooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 group-hover:translate-x-0 -translate-x-1">
        {text}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
    </div>
);
