import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Mock context data to feed into the AI so it knows what to cite
const PROJECT_CONTEXT = `
You are working on the "ADAS L2+ System" project. Here are the existing project artifacts you can reference:

[Requirements]
- REQ-001: Adaptive Cruise Control (Status: Approved) - Maintain set speed and distance.
- REQ-002: Emergency Braking (Status: Approved) - Auto-brake on collision detection.
- REQ-003: Lane Keep Assist (Status: Draft) - Keep vehicle within lane markers.
- REQ-004: Blind Spot Detection (Status: Approved) - Alert driver of side obstacles.

[Architecture]
- ARCH-101: Module: Radar Sensor Interface (Status: Approved)
- ARCH-102: Module: Brake Actuator Logic (Status: Draft)
- ARCH-103: Module: Camera Processing Unit (Status: Approved)
- ARCH-104: Module: HMI Warning System (Status: Approved)

[Detailed Design / Code]
- DD-201: radar_driver.c (Status: Verified)
- DD-202: brake_controller.cpp (Status: Verified)
- DD-203: camera_obj_detect.py (Status: Verified)
- DD-204: hmi_display_manager.ts (Status: Verified)

[Test Cases]
- TC-301: Verify: Radar Signal Quality (Status: Verified) - Tests signal to noise ratio.
- TC-302: Verify: Emergency Stop Trigger (Status: Failed) - Latency test for braking.
- TC-303: Verify: Lane Departure Warning (Status: Verified)
- TC-304: Verify: Blind Spot LED Activation (Status: Verified)
`;

export const generateAIResponse = async (
  prompt: string, 
  history: { role: string; content: string }[] = []
): Promise<string> => {
  if (!apiKey) {
    return "Error: API Key is missing. Please set the API_KEY environment variable.";
  }

  try {
    const systemInstruction = `You are AutoTrace AI, an expert assistant for automotive software engineering. 
    Your expertise includes:
    - ASPICE (Automotive SPICE) process compliance.
    - ISO 26262 Functional Safety standards.
    - Bidirectional traceability (Requirements <-> Design <-> Code <-> Test).
    
    CONTEXT:
    ${PROJECT_CONTEXT}
    
    INSTRUCTIONS:
    1. Always cite specific artifact IDs (e.g., REQ-001, TC-302) when relevant to the user's question.
    2. If the user asks about the status of the project, use the provided artifact statuses.
    3. Provide professional, concise, and actionable advice. 
    4. Use markdown for formatting lists or code.
    `;

    const model = 'gemini-2.5-flash';
    
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
      },
      history: history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }))
    });

    const result = await chat.sendMessage({ message: prompt });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error while processing your request. Please try again later.";
  }
};