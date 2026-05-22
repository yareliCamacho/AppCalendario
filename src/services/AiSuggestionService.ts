import { env } from '../config/env';

export type AiSuggestionKind = 'event_description' | 'memory_note' | 'calendar_quote';

const FALLBACK: Record<AiSuggestionKind, string[]> = {
  event_description: [
    'Una cita especial llena de risas y miradas cómplices.',
    'El día en que el tiempo se detuvo y solo existimos tú y yo.',
  ],
  memory_note: [
    'Guardar este instante es guardar un pedacito de eternidad contigo.',
  ],
  calendar_quote: [
    'Contigo cada día es mi fecha favorita.',
    'El amor no se mira, se siente.',
  ],
};

export class AiSuggestionService {
  async suggestRomanticText(context: {
    kind: AiSuggestionKind;
    title?: string;
    locale?: string;
  }): Promise<string> {
    const prompt = `Escribe una frase romántica corta en español para: ${context.kind}${context.title ? ` sobre "${context.title}"` : ''}. Máximo 2 oraciones.`;

    try {
      if (env.aiProvider === 'gemini' && process.env.GEMINI_API_KEY) {
        return await this.callGemini(prompt);
      }
      if (process.env.OPENAI_API_KEY) {
        return await this.callOpenAI(prompt);
      }
    } catch {
      // fallback below
    }

    const options = FALLBACK[context.kind];
    return options[Math.floor(Math.random() * options.length)] ?? options[0];
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
      }),
    });
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() ?? FALLBACK.event_description[0];
  }

  private async callGemini(prompt: string): Promise<string> {
    const key = process.env.GEMINI_API_KEY;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    const json = await res.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? FALLBACK.calendar_quote[0];
  }
}

export const aiSuggestionService = new AiSuggestionService();
