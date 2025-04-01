import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function rewriteGoal(vague: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert goal-setting assistant. Your job is to take vague goals and make them specific, measurable, achievable, relevant, and time-bound (SMART). Keep your response to a single sentence."
        },
        {
          role: "user",
          content: `Turn this vague goal into a specific, actionable 1-sentence goal: "${vague}"`
        }
      ],
      temperature: 1,
      max_tokens: 100,
    });

    return completion.choices[0].message.content || vague;
  } catch (error) {
    console.error('Error rewriting goal with OpenAI:', error);
    return vague; // Return original goal if there's an error
  }
} 