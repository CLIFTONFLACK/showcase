
export enum AgentType {
  GENERAL = 'General Clinical AI',
  GASTRO = 'Gastro AI',
  OMEGA3 = 'Omega-3 AI',
  FSMP = 'FSMP AI',
  NUTRITIONAL = 'Nutritional AI'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AgentConfig {
  id: AgentType;
  name: string;
  icon: string;
  description: string;
  color: string;
  systemPrompt: string;
}
