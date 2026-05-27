export async function verifyRecyclable(base64Image, mimeType = "image/jpeg") {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_KEY is missing in your .env file!");
  }

  // Strip standard base64 data URL prefix if present (e.g. data:image/jpeg;base64,...)
  const cleanBase64 = base64Image.includes(",") 
    ? base64Image.split(",")[1] 
    : base64Image;

  // Support newer models first, falling back to older ones if unavailable
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: cleanBase64
                  }
                },
                {
                  text: `Does this image show a recyclable item (plastic bottle, cardboard, glass, aluminum can, paper, etc.)?
Reply with ONLY a valid JSON object, no markdown formatting, no leading or trailing text.
Format: { "recyclable": true/false, "item": "short item name or unknown" }`
                }
              ]
            }]
          })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Model ${model} request failed: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(`No response content from model ${model}`);
      }

      // Clean markdown JSON code block indicators if Gemini still outputted them
      text = text.trim();
      if (text.startsWith("```json")) {
        text = text.substring(7, text.length - 3);
      } else if (text.startsWith("```")) {
        text = text.substring(3, text.length - 3);
      }
      text = text.trim();

      return JSON.parse(text);
    } catch (err) {
      console.warn(`Resilient Fallback: ${model} failed. Trying next model...`, err);
      lastError = err;
    }
  }

  throw new Error(`All attempted Gemini models failed. Last error: ${lastError?.message || 'Unknown'}`);
}

