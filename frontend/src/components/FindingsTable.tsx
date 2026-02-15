import React from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import type { Finding } from '../types';
import clsx from 'clsx';

interface FindingsTableProps {
    findings: Finding[];
    onAction: (id: string, action: 'approved' | 'rejected') => void;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({ findings, onAction }) => {
    if (findings.length === 0) return null;

    return (
        <div className="w-full overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                    <tr>
                        <th className="px-6 py-4 font-medium">ID</th>
                        <th className="px-6 py-4 font-medium">Original Finding</th>
                        <th className="px-6 py-4 font-medium">Refined Suggestion</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {findings.map((finding) => (
                        <tr
                            key={finding.id}
                            className={clsx(
                                "hover:bg-gray-50/50 transition-colors",
                                finding.decision === 'rejected' && "bg-gray-50 opacity-60"
                            )}
                        >
                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                {finding.id}
                            </td>
                            <td className="px-6 py-4 w-1/3">
                                <div className="text-red-600 line-through opacity-70">
                                    {finding.original}
                                </div>
                            </td>
                            <td className="px-6 py-4 w-1/3">
                                <div className="text-green-700 font-medium bg-green-50/50 p-2 rounded">
                                    {finding.refined}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    {finding.status === 'processing' ? (
                                        <>
                                            <Loader2 className="animate-spin text-blue-500" size={16} />
                                            <span className="text-blue-600 text-xs font-medium">Stage {finding.stage}/6</span>
                                        </>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Refined
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onAction(finding.id, 'approved')}
                                        className={clsx(
                                            "p-2 rounded-full transition-colors",
                                            finding.decision === 'approved'
                                                ? "bg-green-100 text-green-700"
                                                : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                                        )}
                                        title="Approve"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        onClick={() => onAction(finding.id, 'rejected')}
                                        className={clsx(
                                            "p-2 rounded-full transition-colors",
                                            finding.decision === 'rejected'
                                                ? "bg-red-100 text-red-700"
                                                : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        )}
                                        title="Reject"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
