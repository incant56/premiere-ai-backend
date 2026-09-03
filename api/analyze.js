export default async function handler(req, res) {
  // تفعيل CORS لتعمل الإضافة بحرية داخل بريمير
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64 } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!imageBase64) return res.status(400).json({ error: 'Image data missing' });
    if (!apiKey) return res.status(500).json({ error: 'API key is not configured on Vercel' });

    const systemPrompt = `أنت خبير مونتاج سينمائي في Adobe Premiere Pro.
حلل الصورة المرفقة واشرح كيفية تطبيق التأثير البصري باستخدام أدوات بريمير الافتراضية فقط بدون إضافات مدفوعة.
نسق إجابتك بالشكل التالي:
1. اسم التأثير المقترح
2. الأدوات المطلوبة ومسارها في قائمة Effects
3. خطوات التطبيق برقم (1، 2، 3) مع شرح الـ Keyframes والضبط.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64.split(',')[1] || imageBase64
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "لم أتمكن من تحليل الصورة.";

    return res.status(200).json({ result: resultText });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
