import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RefinementCell } from './RefinementCell';
import type { Finding } from '../types';

interface DocumentCanvasProps {
    htmlContent: string;
    findings: Finding[];
    onAction: (id: string, action: 'approved' | 'rejected') => void;
    onEdit: (id: string, newText: string) => void;
    onContentEdit?: (editedHtml: string) => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
    htmlContent,
    findings,
    onAction,
    onEdit,
    onContentEdit
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [portals, setPortals] = useState<React.ReactPortal[]>([]);
    const [hasEdits, setHasEdits] = useState(false);

    // Effect 1: Set the HTML content manually (NOT via dangerouslySetInnerHTML)
    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = htmlContent;
    }, [htmlContent]);

    // Effect 2: After HTML is set, find matching cells and inject portals
    useEffect(() => {
        if (!containerRef.current || !htmlContent || findings.length === 0) {
            setPortals([]);
            return;
        }

        const timer = setTimeout(() => {
            if (!containerRef.current) return;

            const newPortals: React.ReactPortal[] = [];
            const tables = containerRef.current.querySelectorAll('table');

            tables.forEach((table) => {
                const rows = table.querySelectorAll('tr');
                rows.forEach((row) => {
                    const cells = row.querySelectorAll('td, th');
                    cells.forEach((cell) => {
                        const htmlCell = cell as HTMLElement;
                        const cellText = htmlCell.innerText?.trim();
                        if (!cellText) return;

                        const normalizedCell = cellText.replace(/\s+/g, ' ').trim();

                        const finding = findings.find(f => {
                            const normalizedOriginal = f.original.replace(/\s+/g, ' ').trim();
                            return normalizedCell === normalizedOriginal || normalizedCell.includes(normalizedOriginal);
                        });

                        if (finding) {
                            htmlCell.innerHTML = '';
                            const portalContainer = document.createElement('div');
                            htmlCell.appendChild(portalContainer);

                            newPortals.push(
                                createPortal(
                                    <RefinementCell finding={finding} onAction={onAction} onEdit={onEdit} />,
                                    portalContainer
                                )
                            );
                        }
                    });
                });
            });

            setPortals(newPortals);
        }, 50);

        return () => clearTimeout(timer);
    }, [htmlContent, findings, onAction]);

    // Track user edits
    const handleInput = useCallback(() => {
        setHasEdits(true);
        if (onContentEdit && containerRef.current) {
            onContentEdit(containerRef.current.innerHTML);
        }
    }, [onContentEdit]);

    return (
        <div className="flex-1 doc-canvas-bg overflow-y-auto p-8 flex justify-center">
            <div>
                {/* A4 Page — contentEditable for user editing */}
                <div
                    className="doc-page"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    spellCheck={true}
                >
                    <div ref={containerRef} />
                    {portals}
                </div>
            </div>

            {/* Edit indicator toast */}
            <div className={`edit-indicator ${hasEdits ? 'visible' : ''}`}>
                ✏️ Edits tracked — will be included in export
            </div>
        </div>
    );
};
