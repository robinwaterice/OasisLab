try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed globally or not found
}
const key = process.env.VITE_GEMINI_API_KEY;
const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

const requestBody = {
  contents: [
    {
      parts: [
        {
          text: "What is the latest trend in minimal desk setup?"
        }
      ]
    }
  ],
  tools: [
    {
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: "MODE_DYNAMIC",
          dynamicThreshold: 0.3
        }
      }
    }
  ],
  generationConfig: {
    temperature: 0.7,
    responseMimeType: "text/plain"
  }
};

fetch(apiEndpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(requestBody)
}).then(res => res.json()).then(data => {
  console.log(JSON.stringify(data, null, 2));
}).catch(console.error);
