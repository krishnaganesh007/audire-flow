import axios from 'axios';
import type { ProcessResponse } from '../types';

export interface ExportRequest {
    original_filename: string;
    export_filename: string;
    export_format: 'docx' | 'pdf';
    approved_findings: { [key: string]: string };
}

const API_URL = 'http://localhost:8000';

export const uploadDocument = async (file: File): Promise<ProcessResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<ProcessResponse>(`${API_URL}/process-document`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const exportDocument = async (request: ExportRequest): Promise<{ download_url: string; filename: string }> => {
    const response = await axios.post(`${API_URL}/export-document`, request);
    return response.data;
};
