import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY
});

class AIService {
  async draftNote(residentId: string, noteType: string, bulletPoints: string[]): Promise<any> {
    try {
      const prompt = `You are a case management assistant for transitional housing. Draft a professional, non-clinical case note.

Note Type: ${noteType}
Bullet Points: ${bulletPoints.join(', ')}

Requirements:
- Keep it professional and objective
- Avoid clinical language or diagnoses
- Focus on housing stability, services, and progress
- Include action items if relevant
- Provide a brief rationale for your approach

Respond with JSON in this format:
{
  "noteText": "Professional case note text here...",
  "rationale": "Brief explanation of approach and key points addressed"
}`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional case management assistant. Always maintain confidentiality and focus on non-clinical housing services."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        noteText: result.noteText || "Unable to generate note",
        rationale: result.rationale || "Standard case management documentation",
        aiGenerated: true,
        requiresApproval: true,
      };
    } catch (error) {
      console.error('AI note drafting error:', error);
      throw new Error('Failed to generate note draft');
    }
  }

  async recommendResources(residentId: string, zip: string, categories: string[]): Promise<any> {
    try {
      const prompt = `You are helping find resources for a transitional housing resident.

Location: ${zip}
Categories Needed: ${categories.join(', ')}

Provide 5 relevant resource recommendations. Focus on real-world resources that would be available in transitional housing programs.

Respond with JSON in this format:
{
  "recommendations": [
    {
      "name": "Resource Name",
      "category": "housing|food|employment|etc",
      "description": "Brief description",
      "eligibilityReason": "Why this resident would qualify",
      "estimatedBenefit": "What they could gain"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a resource navigation specialist for transitional housing programs. Recommend appropriate community resources."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        recommendations: result.recommendations || [],
        aiGenerated: true,
      };
    } catch (error) {
      console.error('AI resource recommendation error:', error);
      throw new Error('Failed to generate resource recommendations');
    }
  }

  async chatResponse(message: string, context: string): Promise<any> {
    try {
      const systemPrompt = context === 'case_management' 
        ? "You are a helpful AI assistant for a transitional housing case management system. You can help with case management questions, resource recommendations, form completion, and administrative tasks. Keep responses helpful, professional, and relevant to transitional housing services."
        : "You are a helpful AI assistant.";

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return {
        response: response.choices[0].message.content || "I'm sorry, I couldn't generate a response.",
        aiGenerated: true,
      };
    } catch (error) {
      console.error('AI chat error:', error);
      throw new Error('Failed to generate chat response');
    }
  }

  async formHelper(formContext: string, knownFields: any): Promise<any> {
    try {
      const prompt = `You are helping complete a form for transitional housing case management.

Form Context: ${formContext}
Known Information: ${JSON.stringify(knownFields)}

Provide suggestions for completing the form and identify any missing required information.

Respond with JSON in this format:
{
  "suggestions": {
    "fieldName": "suggested value based on known info"
  },
  "missingRequired": ["list of missing required fields"],
  "recommendations": ["general recommendations for completing this form"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a form completion assistant for case management. Only suggest values based on provided information - never fabricate data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        suggestions: result.suggestions || {},
        missingRequired: result.missingRequired || [],
        recommendations: result.recommendations || [],
        aiGenerated: true,
      };
    } catch (error) {
      console.error('AI form helper error:', error);
      throw new Error('Failed to get form suggestions');
    }
  }
}

export const aiService = new AIService();
