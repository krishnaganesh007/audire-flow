import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RefinementCell } from './RefinementCell';
import type { Finding } from '../types';

// Enable detailed logging for table matching debugging
const DEBUG_TABLE_MATCHING = true;

/**
 * Normalize text to match backend's normalization logic
 * Backend: re.sub('<[^<]+?>', '', cell_html) then " ".join(text.split())
 */
function normalizeText(text: string): string {
    // Remove HTML tags (same as backend's re.sub('<[^<]+?>', '', ...))
    let clean = text.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = clean;
    clean = textarea.value;

    // Normalize whitespace (same as backend's " ".join(text.split()))
    clean = clean.trim().split(/\s+/).join(' ');

    // Additional normalization for robustness
    clean = clean.replace(/\u00A0/g, ' '); // Replace non-breaking spaces with regular spaces
    clean = clean.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width characters

    return clean;
}

/**
 * Calculate similarity ratio between two strings (0 to 1)
 * Uses a simple character-based comparison
 */
function calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    // Simple Levenshtein distance
    const editDistance = levenshteinDistance(str1, str2);
    return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

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

            if (DEBUG_TABLE_MATCHING) {
                console.group('🔍 Table Matching Debug');
                console.log(`📊 Total findings available: ${findings.length}`);
                findings.forEach((f, idx) => {
                    console.log(`Finding ${idx + 1} [${f.id}]:`, {
                        original: f.original,
                        preview: f.original.substring(0, 100) + (f.original.length > 100 ? '...' : ''),
                        length: f.original.length
                    });
                });
            }

            const newPortals: React.ReactPortal[] = [];
            const tables = containerRef.current.querySelectorAll('table');
            const matchedFindingIds = new Set<string>();
            let cellCount = 0;
            let matchCount = 0;

            if (DEBUG_TABLE_MATCHING) {
                console.log(`\n📋 Found ${tables.length} table(s) in document`);
            }

            tables.forEach((table, tableIdx) => {
                if (DEBUG_TABLE_MATCHING) {
                    console.log(`\n--- Table ${tableIdx + 1} ---`);
                }

                const rows = table.querySelectorAll('tr');
                rows.forEach((row, rowIdx) => {
                    const cells = row.querySelectorAll('td, th');
                    cells.forEach((cell, cellIdx) => {
                        const htmlCell = cell as HTMLElement;

                        // Use innerHTML instead of innerText to match backend's HTML processing
                        const cellHtml = htmlCell.innerHTML;
                        if (!cellHtml || !cellHtml.trim()) return;

                        cellCount++;

                        // Apply the same normalization as backend
                        const normalizedCell = normalizeText(cellHtml);

                        // Skip empty cells after normalization
                        if (!normalizedCell || normalizedCell.length < 10) return;

                        if (DEBUG_TABLE_MATCHING) {
                            console.log(`\n  Cell [Table ${tableIdx + 1}, Row ${rowIdx + 1}, Col ${cellIdx + 1}]:`);
                            console.log(`    Raw HTML: "${cellHtml.substring(0, 100)}${cellHtml.length > 100 ? '...' : ''}"`);
                            console.log(`    Normalized: "${normalizedCell.substring(0, 80)}${normalizedCell.length > 80 ? '...' : ''}"`);
                            console.log(`    Length: ${normalizedCell.length}`);
                        }

                        let matchLevel = '';
                        const finding = findings.find(f => {
                            // Apply same normalization to finding's original text
                            const normalizedOriginal = normalizeText(f.original);

                            // Level 1: Exact match after normalization
                            if (normalizedCell === normalizedOriginal) {
                                matchLevel = 'exact';
                                return true;
                            }

                            // Level 2: Cell contains finding (substring match)
                            if (normalizedCell.includes(normalizedOriginal)) {
                                matchLevel = 'substring';
                                return true;
                            }

                            // Level 3: Finding contains cell (reverse substring)
                            if (normalizedOriginal.includes(normalizedCell)) {
                                matchLevel = 'reverse-substring';
                                return true;
                            }

                            // Level 4: Fuzzy match with high similarity threshold
                            const similarity = calculateSimilarity(normalizedCell, normalizedOriginal);
                            if (similarity > 0.90) {
                                matchLevel = `fuzzy (${(similarity * 100).toFixed(1)}%)`;
                                return true;
                            }

                            if (DEBUG_TABLE_MATCHING) {
                                console.log(`    Testing against Finding [${f.id}]:`);
                                console.log(`      Finding original: "${f.original.substring(0, 80)}${f.original.length > 80 ? '...' : ''}"`);
                                console.log(`      Finding normalized: "${normalizedOriginal.substring(0, 80)}${normalizedOriginal.length > 80 ? '...' : ''}"`);
                                console.log(`      Similarity: ${(similarity * 100).toFixed(1)}%`);
                            }

                            return false;
                        });

                        if (finding) {
                            matchCount++;
                            matchedFindingIds.add(finding.id);

                            if (DEBUG_TABLE_MATCHING) {
                                console.log(`    ✅ MATCHED to Finding [${finding.id}] via ${matchLevel} match`);
                            }

                            htmlCell.innerHTML = '';
                            const portalContainer = document.createElement('div');
                            htmlCell.appendChild(portalContainer);

                            newPortals.push(
                                createPortal(
                                    <RefinementCell finding={finding} onAction={onAction} onEdit={onEdit} />,
                                    portalContainer
                                )
                            );
                        } else if (DEBUG_TABLE_MATCHING) {
                            console.log(`    ❌ NO MATCH found`);
                        }
                    });
                });
            });

            if (DEBUG_TABLE_MATCHING) {
                console.log('\n📈 Summary:');
                console.log(`  Total cells processed: ${cellCount}`);
                console.log(`  Total matches found: ${matchCount}`);
                console.log(`  Matched findings: ${matchedFindingIds.size}/${findings.length}`);

                const unmatchedFindings = findings.filter(f => !matchedFindingIds.has(f.id));
                if (unmatchedFindings.length > 0) {
                    console.warn(`\n⚠️ ${unmatchedFindings.length} finding(s) NOT matched:`);
                    unmatchedFindings.forEach(f => {
                        console.log(`  - [${f.id}]: "${f.original.substring(0, 80)}..."`);
                    });
                }

                console.groupEnd();
            }

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
