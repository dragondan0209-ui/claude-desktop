import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Settings from './components/Settings';
import { Conversation, Message, QuickCommand, Settings as SettingsType } from './types';

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [commands, setCommands] = useState<QuickCommand[]>([]);
  const [_settings, setSettings] = useState<SettingsType>({ api_key_set: false });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadConversations();
    loadCommands();
    loadSettings();
  }, []);

  async function loadConversations() {
    try {
      const convs = await invoke<Conversation[]>('get_conversations');
      setConversations(convs);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  }

  async function loadCommands() {
    try {
      const cmds = await invoke<QuickCommand[]>('get_commands');
      setCommands(cmds);
    } catch (e) {
      console.error('Failed to load commands:', e);
    }
  }

  async function loadSettings() {
    try {
      const s = await invoke<SettingsType>('get_settings');
      setSettings(s);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }

  async function handleSelectConversation(conv: Conversation) {
    setCurrentConversation(conv);
    try {
      const msgs = await invoke<Message[]>('get_messages', { conversationId: conv.id });
      setMessages(msgs);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  }

  async function handleNewConversation() {
    try {
      const conv = await invoke<Conversation>('create_conversation', { title: '新对话' });
      setConversations(convs => [conv, ...convs]);
      setCurrentConversation(conv);
      setMessages([]);
    } catch (e) {
      console.error('Failed to create conversation:', e);
    }
  }

  async function handleDeleteConversation(id: string) {
    try {
      await invoke('delete_conversation', { id });
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  }

  async function handleSendMessage(content: string) {
    if (!currentConversation) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: currentConversation.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages([...messages, userMsg]);

    try {
      const assistantMsg = await invoke<Message>('send_message', {
        conversationId: currentConversation.id,
        content,
      });
      setMessages(msgs => [...msgs, assistantMsg]);
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  }

  async function handleAddCommand(name: string, prompt: string) {
    try {
      const cmd = await invoke<QuickCommand>('add_command', { name, prompt });
      setCommands([...commands, cmd]);
    } catch (e) {
      console.error('Failed to add command:', e);
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        currentConversation={currentConversation}
        commands={commands}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onSelectCommand={(_prompt) => {/* Fill input */}}
        onAddCommand={handleAddCommand}
        onOpenSettings={() => setShowSettings(true)}
      />
      <ChatArea
        messages={messages}
        onSendMessage={handleSendMessage}
        onClearConversation={() => setMessages([])}
      />
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
