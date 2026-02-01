const API_KEY = import.meta.env.VITE_TABSCANNER_API_KEY || '';

export interface TabScannerItem {
    description: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    category?: string;
}

export interface TabScannerResult {
    lines: {
        description: string;
        qty: number;
        unitPrice: number;
        lineTotal: number;
    }[];
    total: number;
    date: string;
    establishment: string;
}

export const processReceipt = async (file: File): Promise<string> => {
    if (!API_KEY) {
        throw new Error('Tabscanner API Key is missing. Please add VITE_TABSCANNER_API_KEY to your .env file.');
    }

    const formData = new FormData();
    formData.append('receiptImage', file);

    try {
        // Use our Vercel Serverless Function for the upload
        const response = await fetch('/api/scan-process', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Server Error: ${response.status}`);
        }

        if (data.success) {
            return data.token;
        } else {
            throw new Error(data.message || 'Failed to process receipt');
        }
    } catch (error) {
        console.error('TabScanner Process Error:', error);
        throw error;
    }
};

export const getReceiptResult = async (token: string): Promise<TabScannerResult | null> => {
    if (!API_KEY) {
        throw new Error('API Key missing');
    }

    try {
        // Use our Vercel Serverless Function for the result
        const response = await fetch(`/api/scan-result?token=${token}`, {
            method: 'GET',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.details || data.error || `Server Error: ${response.status}`);
        }

        if (data.status === 'done') {
            return {
                lines: data.result.lineItems.map((item: any) => ({
                    description: item.descClean || item.desc,
                    qty: item.qty || 1,
                    unitPrice: item.unitPrice || 0,
                    lineTotal: item.lineTotal || 0,
                })),
                total: data.result.total,
                date: data.result.date,
                establishment: data.result.establishment,
            };
        } else if (data.status === 'pending') {
            return null; // Still processing
        } else {
            throw new Error('Failed to get results');
        }
    } catch (error) {
        console.error('TabScanner Result Error:', error);
        throw error;
    }
};
