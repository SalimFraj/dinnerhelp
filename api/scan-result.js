export default async function handler(req, res) {
    // 1. Set CORS Headers immediately
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // 2. Handle Preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // 3. Defensive checks
        const { token } = req.query || {};
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const apiKey = process.env.VITE_TABSCANNER_API_KEY || process.env.TABSCANNER_API_KEY;
        if (!apiKey) {
            console.error('Configuration Error: Missing API Key');
            return res.status(500).json({ error: 'Server configuration error: Missing TabScanner API Key' });
        }

        console.log(`Proxying Result Request for token: ${token}`);

        // 4. Fetch from TabScanner
        // Note: Result endpoint does NOT use version number in path
        const apiResponse = await fetch(`https://api.tabscanner.com/api/result/${token}`, {
            method: 'GET',
            headers: {
                'apikey': apiKey
            }
        });

        // 5. Check response content type
        const contentType = apiResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await apiResponse.text();
            console.error('TabScanner returned non-JSON:', text);
            return res.status(502).json({
                error: 'Invalid response from TabScanner',
                details: text.substring(0, 100)
            });
        }

        const data = await apiResponse.json();
        return res.status(apiResponse.status).json(data);

    } catch (error) {
        // 6. Global error handler to prevent HTML 500s
        console.error('CRITICAL PROXY ERROR:', error);
        return res.status(500).json({
            error: 'Internal Server Proxy Error',
            details: error.message
        });
    }
}
