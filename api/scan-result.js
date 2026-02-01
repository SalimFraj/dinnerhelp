export default async function handler(request, response) {
    const { token } = request.query;

    // Allow CORS
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    if (!token) {
        return response.status(400).json({ error: 'Token is required' });
    }

    const apiKey = process.env.VITE_TABSCANNER_API_KEY;

    try {
        const apiResponse = await fetch(`https://api.tabscanner.com/api/2/result/${token}`, {
            method: 'GET',
            headers: {
                'apikey': apiKey
            }
        });

        const data = await apiResponse.json();
        return response.status(apiResponse.status).json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return response.status(500).json({ error: 'Failed to fetch from TabScanner' });
    }
}
