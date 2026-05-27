export async function verifyRecyclable(base64Image, mimeType = "image/jpeg") {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_KEY is missing in your .env file!");
  }

  // Strip standard base64 data URL prefix if present (e.g. data:image/jpeg;base64,...)
  const cleanBase64 = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  // Try models newest → oldest; try both API versions per model
  const attempts = [
    { model: "gemini-2.5-flash",            api: "v1beta" },
    { model: "gemini-2.5-flash-lite-preview-06-17", api: "v1beta" },
    { model: "gemini-2.0-flash",            api: "v1beta" },
    { model: "gemini-2.0-flash-lite",       api: "v1beta" },
    { model: "gemini-1.5-flash-latest",     api: "v1beta" },
    { model: "gemini-1.5-flash",            api: "v1"     },
    { model: "gemini-1.5-flash",            api: "v1beta" },
    { model: "gemini-1.5-pro-latest",       api: "v1beta" },
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
- ANYTHING plastic, regardless of type or condition: bottles, bags, straws, utensils, containers, wrappers, lids, caps, cups, film, packaging, toys, parts — if it looks plastic, it counts
- Recyclables: cans, cardboard, glass, paper, cartons, foil
- Food waste: napkins, takeout containers, pizza boxes, coffee cups, fast food packaging
- General litter: cigarette butts, chip bags, candy wrappers, styrofoam, gum wrappers
- Household waste: old clothes, broken items, junk mail, any discarded object

Only return false if the image clearly shows NO trash or waste at all — e.g. just a person, a clean landscape, a pet, food that hasn't been discarded.

Reply with ONLY a valid JSON object, no markdown, no extra text.
Format: { "recyclable": true/false, "item": "short descriptive name of the item" }`
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
