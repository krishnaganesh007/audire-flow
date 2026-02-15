export interface Finding {
    id: string;
    original: string;
    refined: string;
    stage: number;
    status: 'processing' | 'done';
    decision: 'approved' | 'rejected' | 'pending';
}

export interface ProcessResponse {
    document_html: string;
    findings_map: { [key: string]: Finding };
}
