export const config = {
    api: {
        bodyParser: false, // Disabling body parsing to consume as stream
    },
};

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.VITE_TABSCANNER_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    try {
        // Proxy the request to TabScanner
        // We forward the headers (like Content-Type: multipart/form-data...) 
        // but we add the apiKey header.

        // We need to construct the headers object
        const headers = { ...req.headers };
        delete headers.host; // Don't send local host header
        headers['apikey'] = apiKey;

        // Pipe the request stream directly to the fetch call
        const tabScannerResponse = await fetch('https://api.tabscanner.com/api/2/process', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'content-type': req.headers['content-type'] // crucial for multipart bounds
            },
            body: req // Pass the stream directly
        });

        const data = await tabScannerResponse.json();

        // Set CORS headers for response
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        return res.status(tabScannerResponse.status).json(data);

    } catch (error) {
        console.error('Scan Process Error:', error);
        return res.status(500).json({ error: 'Failed to upload to TabScanner' });
    }
}
