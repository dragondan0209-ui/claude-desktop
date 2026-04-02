import { useState } from 'react';
import { Message } from '../types';
import MessageList from './MessageList';
import InputBox from './InputBox';

interface Props {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onClearConversation: () => void;
}

export default function ChatArea({ messages, onSendMessage, onClearConversation }: Props) {
  const [input, setInput] = useState('');

  function handleSend() {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-medium">Claude Desktop</h2>
        <button
          onClick={onClearConversation}
          className="text-gray-400 hover:text-white text-sm"
        >
          清除对话
        </button>
      </div>

      <MessageList messages={messages} />

      <InputBox
        value={input}
        onChange={setInput}
        onSend={handleSend}
      />
    </div>
  );
}
