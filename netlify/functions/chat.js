exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const messages = body.messages;

        if (!messages) {
            return { statusCode: 400, body: "Missing messages" };
        }

        // Securely grab the API key from Netlify's environment variables!
        const API_KEY = process.env.GROQ_API_KEY;

        if (!API_KEY) {
            return { 
                statusCode: 500, 
                body: JSON.stringify({ error: "API key is not configured in Netlify Environment Variables." }) 
            };
        }

        const API_URL = "https://api.groq.com/openai/v1/chat/completions";

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "qwen/qwen3.6-27b",
                max_tokens: 250,
                messages: messages
            })
        });

        if (!response.ok) {
            return { statusCode: response.status, body: await response.text() };
        }

        const data = await response.json();
        
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        return { statusCode: 500, body: error.toString() };
    }
};
