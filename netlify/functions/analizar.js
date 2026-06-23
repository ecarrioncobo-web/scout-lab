exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { systemPrompt, images, rival, teamName } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    // Build Gemini parts: text + images
    const parts = [
      { text: systemPrompt + `\n\nEstas son las capturas del partido ${teamName} vs ${rival}. Extrae todos los datos estadísticos visibles.` }
    ];

    images.forEach(b64 => {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: b64
        }
      });
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.1
          }
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: { message: data.error.message } })
      };
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } })
    };
  }
};
