export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface QuickCommand {
  id: string;
  name: string;
  prompt: string;
}

export interface Settings {
  api_key_set: boolean;
}
