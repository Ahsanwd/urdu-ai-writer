import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // MOCK AI CORRECTION LOGIC
    // In a real scenario, you'd send `text` to OpenAI/Whisper/Anthropic etc.
    // For demonstration, we will fake a few suggestions based on common words.
    
    const suggestions = [];
    const words = text.split(/\s+/);
    
    // Fake grammar/spelling issues detection (just for the demo)
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // Simple mock: if we see 'ہے' we maybe suggest 'ہیں' randomly for demo if it's placed weirdly?
      // Actually let's just make arbitrary corrections if words match some triggers just to show UI
      if (word === 'جارھا') {
        suggestions.push({
          id: Math.random().toString(),
          original: 'جارھا',
          suggestion: 'جا رہا',
          startIndex: text.indexOf('جارھا'),
          endIndex: text.indexOf('جارھا') + 5,
        });
      }
      if (word === 'اسکول') {
        suggestions.push({
          id: Math.random().toString(),
          original: 'اسکول',
          suggestion: 'سکول',
          startIndex: text.indexOf('اسکول'),
          endIndex: text.indexOf('اسکول') + 5,
        });
      }
      if (word === 'کیاحال') {
        suggestions.push({
          id: Math.random().toString(),
          original: 'کیاحال',
          suggestion: 'کیا حال',
          startIndex: text.indexOf('کیاحال'),
          endIndex: text.indexOf('کیاحال') + 6,
        });
      }
    }

    // Add a generic mock suggestion if none triggered, just to show how it works
    if (suggestions.length === 0 && text.length > 5) {
      // Pick a random word that is longer than 2 chars
      const candidates = words.filter((w: string) => w.length > 2);
      if (candidates.length > 0) {
        const target = candidates[0];
        const idx = text.indexOf(target);
        suggestions.push({
          id: Math.random().toString(),
          original: target,
          suggestion: target + ' (Corrected)',
          startIndex: idx,
          endIndex: idx + target.length,
        });
      }
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
