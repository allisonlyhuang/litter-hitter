export async function verifyTrash(base64Image, mimeType = "image/jpeg") {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_KEY is missing in your .env file!");
  }

  // Strip standard base64 data URL prefix if present (e.g. data:image/jpeg;base64,...)
  const cleanBase64 = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  // Resilient fallback order prioritizing latest high-quota models (gemini-3.5-flash) and scaling down
  const attempts = [
    { model: "gemini-3.5-flash",            api: "v1" },
    { model: "gemini-3.1-flash-lite",       api: "v1" },
    { model: "gemini-2.5-flash",            api: "v1" },
    { model: "gemini-2.0-flash",            api: "v1" },
    { model: "gemini-2.5-flash",            api: "v1beta" },
    { model: "gemini-2.0-flash",            api: "v1beta" },
  ];


  let lastError = null;

  for (const { model, api } of attempts) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${apiKey}`,
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
                  text: `Look at this image and determine whether it shows any piece of trash, litter, or waste.

Be GENEROUS — count anything that someone would throw away or that doesn't belong on the ground:
- Recyclables: plastic bottles, cans, cardboard, glass, paper, cartons
- Food waste: wrappers, cups, napkins, straws, utensils, takeout containers, pizza boxes
- General litter: cigarette butts, plastic bags, chip bags, candy wrappers, styrofoam
- Household waste: old clothes, broken items, packaging, junk mail
- Any visible garbage or rubbish, even if partially visible

Only return false (not trash) if the image clearly shows NO waste at all — e.g. just a person, a landscape, a pet, a car with nothing discarded.

Reply with ONLY a valid JSON object, no markdown, no extra text.
Format: { "isTrash": true/false, "item": "short descriptive name of the item" }`
                }
              ]
            }]
          })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Model ${model} (${api}) request failed: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(`No response content from model ${model} (${api})`);
      }

      // Strip markdown code fences if Gemini still outputs them
      text = text.trim();
      if (text.startsWith("```json")) {
        text = text.slice(7);
        text = text.slice(0, text.lastIndexOf("```"));
      } else if (text.startsWith("```")) {
        text = text.slice(3);
        text = text.slice(0, text.lastIndexOf("```"));
      }
      text = text.trim();

      console.log(`✅ Gemini responded via ${model} (${api})`);
      return JSON.parse(text);
    } catch (err) {
      console.warn(`⚠️ ${model} (${api}) failed, trying next…`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All attempted Gemini models failed. Last error: ${lastError?.message || 'Unknown'}`);
}
