export async function verifyRecyclable(base64Image, mimeType = "image/jpeg") {
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

Be VERY GENEROUS — if there is any doubt, return true. Count anything disposable or discarded:
- Wrappers of ANY kind: candy wrappers, chip bags, snack wrappers, granola bar wrappers, gum wrappers, foil wrappers — ALL count
- ANYTHING plastic: bottles, bags, straws, utensils, containers, lids, caps, cups, film, packaging, toys, parts — if it looks plastic, it counts
- Paper & cardboard: boxes, cups, napkins, receipts, junk mail, pizza boxes, takeout containers
- Metal: cans, foil, bottle caps
- Glass: bottles, jars
- General litter: cigarette butts, styrofoam, rubber bands, twist ties, broken items, old clothes
- Even partially visible trash counts

Only return false if the image clearly shows NO trash or waste at all — e.g. purely a person, a clean empty landscape, a pet with no litter, fresh uneaten food.

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
