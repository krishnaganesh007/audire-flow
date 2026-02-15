import React from 'react';
import { Check, X } from 'lucide-react';
import clsx from 'clsx';
import type { Finding } from '../types';

interface RefinementCellProps {
    finding: Finding;
    onAction: (id: string, action: 'approved' | 'rejected') => void;
    onEdit: (id: string, newText: string) => void;
}

export const RefinementCell: React.FC<RefinementCellProps> = ({ finding, onAction, onEdit }) => {
    return (
        <div className="relative group">
            {/* Original Text - Always visible, but styled based on decision */}
            <div className={clsx(
                "transition-all duration-300",
                finding.decision === 'approved' ? "hidden" : "block", // Hide original if approved (replaced)
                finding.decision === 'rejected' ? "text-gray-900" : "text-red-700 line-through decoration-red-300 decoration-2 opacity-70"
            )}>
                {finding.original}
            </div>

            {/* Suggestion - Visible if not rejected */}
            {finding.decision !== 'rejected' && (
                <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onEdit(finding.id, e.currentTarget.innerText)}
                    className={clsx(
                        "mt-2 pt-2 border-t border-green-100 outline-none",
                        "text-green-700 font-medium bg-green-50/30 p-1 rounded -mx-1",
                        finding.decision === 'approved' ? "text-sm" : "text-sm"
                    )}
                >
                    {finding.refined}
                </div>
            )}

            {/* Floating Action Bar - Visible on Hover */}
            <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                <div className="flex items-center gap-1 bg-white shadow-lg border border-gray-100 rounded-full p-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction(finding.id, 'approved'); }}
                        className={clsx(
                            "p-1.5 rounded-full transition-colors",
                            finding.decision === 'approved' ? "bg-green-100 text-green-700" : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                        )}
                        title="Approve"
                    >
                        <Check size={14} />
                    </button>
                    <div className="w-px h-4 bg-gray-200"></div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction(finding.id, 'rejected'); }}
                        className={clsx(
                            "p-1.5 rounded-full transition-colors",
                            finding.decision === 'rejected' ? "bg-red-100 text-red-700" : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                        )}
                        title="Reject"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
