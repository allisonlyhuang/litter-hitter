export async function verifyRecyclable(base64Image, mimeType = "image/jpeg") {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_KEY is missing in your .env file!");
  }

  // Strip standard base64 data URL prefix if present (e.g. data:image/jpeg;base64,...)
  const cleanBase64 = base64Image.includes(",") 
    ? base64Image.split(",")[1] 
    : base64Image;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
    throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No response content from Gemini API.");
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
}
