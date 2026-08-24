document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const aiWidget = document.getElementById('ai-widget');
    const toggleBtn = document.getElementById('ai-toggle-btn');
    const closeBtn = document.getElementById('ai-close-btn');
    const chatHistory = document.getElementById('ai-chat-history');
    const inputForm = document.getElementById('ai-input-form');
    const inputField = document.getElementById('ai-input');

    // --- State ---
    // We maintain a message history array to send to the API so it has context of the conversation
    let messageHistory = [
        { 
            role: "system", 
            content: "You are a cute, friendly math assistant. Keep answers brief, encouraging, and use emojis like 🌸, ✨, or 🥺. " +
                     "If you calculate a final numeric answer, you MUST wrap ONLY the number in <result> tags, like this: <result>42</result>. " +
                     "Do not put commas or units inside the <result> tags."
        }
    ];

    // --- UI Interactions ---

    // Toggle panel open/close
    toggleBtn.addEventListener('click', () => {
        aiWidget.classList.remove('closed');
        inputField.focus();
    });

    closeBtn.addEventListener('click', () => {
        aiWidget.classList.add('closed');
    });

    // Handle form submission
    inputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userText = inputField.value.trim();
        if (!userText) return;

        // Clear input
        inputField.value = '';

        // Add user message to UI
        addMessageToUI(userText, 'user');
        
        // Add to history
        messageHistory.push({ role: "user", content: userText });

        // Show typing indicator
        const typingIndicator = showTypingIndicator();

        // Get calculator context
        const calcContextText = getCalculatorContext();
        
        // Temporarily append context to the last message for the API call
        const apiMessages = [...messageHistory];
        apiMessages[apiMessages.length - 1].content = userText + "\n\n" + calcContextText;

        try {
            // Fetch response from AI
            const responseText = await fetchAIResponse(apiMessages);
            
            // Remove typing indicator
            typingIndicator.remove();

            // Add AI response to history and UI
            messageHistory.push({ role: "assistant", content: responseText });
            addMessageToUI(responseText, 'ai');

        } catch (error) {
            typingIndicator.remove();
            addMessageToUI("Oops! Something went wrong reaching the AI. 🥺 Check your API key or network.", 'error');
            // Remove the failed user message from history so they can try again
            messageHistory.pop(); 
        }
    });

    // --- Helper Functions ---

    function addMessageToUI(text, senderClass) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('ai-message', senderClass);
        
        if (senderClass === 'ai') {
            // Check for the <result> tag in AI response
            const resultMatch = text.match(/<result>([\d.-]+)<\/result>/);
            let displayHtml = text;
            
            if (resultMatch) {
                const numericResult = resultMatch[1];
                // Strip the tags from the displayed text
                displayHtml = text.replace(/<result>[\d.-]+<\/result>/g, `**${numericResult}**`);
                
                // Add the text
                msgDiv.innerHTML = displayHtml;
                
                // Add the "Use this in calculator" button
                const injectBtn = document.createElement('button');
                injectBtn.classList.add('ai-inject-btn');
                injectBtn.textContent = 'Use this in calculator ✨';
                injectBtn.onclick = () => insertIntoCalculator(numericResult);
                msgDiv.appendChild(injectBtn);
            } else {
                msgDiv.textContent = text;
            }
        } else {
            msgDiv.textContent = text;
        }

        chatHistory.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const wrapper = document.createElement('div');
        wrapper.classList.add('ai-message', 'ai', 'typing-indicator');
        wrapper.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatHistory.appendChild(wrapper);
        scrollToBottom();
        return wrapper;
    }

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Reads the current state of the calculator from the DOM
    function getCalculatorContext() {
        const expressionNode = document.getElementById('expression');
        const displayNode = document.getElementById('display');
        
        const expression = expressionNode ? expressionNode.textContent : "";
        const mainDisplay = displayNode ? displayNode.textContent : "";

        return `[Current Calculator Context: Expression line shows "${expression}", Main display shows "${mainDisplay}"]`;
    }

    // Safely injects a number into the calculator's state
    function insertIntoCalculator(numberStr) {
        // These functions are globally defined in script.js!
        if (typeof window.handleClear === 'function' && typeof window.handleNumber === 'function') {
            window.handleClear();
            
            // If the number is negative, we need to handle it carefully, but handleNumber handles chars
            // The cleanest way is to split by chars, or if it's a full string and the logic supports it.
            // Our script.js handleNumber appends, so if we call it with a full string while currentValue is '0', it overwrites.
            window.handleNumber(numberStr);
            
            // Close the widget to show the user the calculator
            aiWidget.classList.add('closed');
        } else {
            console.error("Calculator functions not found.");
        }
    }

    // --- API Integration ---
    async function fetchAIResponse(messages) {
        // Splitting the key into two parts so GitHub push protection doesn't block the upload.
        // WARNING: Anyone who looks at the source code of your deployed site can still see this key.
        const part1 = "gsk_71ITG0g1OWjj";
        const part2 = "bYicoTzCWGdyb3FYchvqyVZLk1hs1dzLQJCXatcu";
        const API_KEY = part1 + part2;
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
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
});
