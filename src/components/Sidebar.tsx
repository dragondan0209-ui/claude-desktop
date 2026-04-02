import { useState } from 'react';
import { Conversation, QuickCommand } from '../types';

interface Props {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  commands: QuickCommand[];
  onSelectConversation: (conv: Conversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onSelectCommand: (prompt: string) => void;
  onAddCommand: (name: string, prompt: string) => void;
}

export default function Sidebar({
  conversations,
  currentConversation,
  commands,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onSelectCommand,
  onAddCommand,
}: Props) {
  const [showAddCommand, setShowAddCommand] = useState(false);
  const [newCmdName, setNewCmdName] = useState('');
  const [newCmdPrompt, setNewCmdPrompt] = useState('');

  function handleAddCommand() {
    if (newCmdName && newCmdPrompt) {
      onAddCommand(newCmdName, newCmdPrompt);
      setNewCmdName('');
      setNewCmdPrompt('');
      setShowAddCommand(false);
    }
  }

  return (
    <div className="w-60 bg-gray-900 h-full flex flex-col border-r border-gray-700">
      <div className="p-4">
        <button
          onClick={onNewConversation}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          新对话
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <h3 className="text-gray-400 text-sm font-medium mb-2">历史记录</h3>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer mb-1 transition-colors ${
                currentConversation?.id === conv.id
                  ? 'bg-gray-700'
                  : 'hover:bg-gray-800'
              }`}
            >
              <span
                className="flex-1 truncate"
                onClick={() => onSelectConversation(conv)}
              >
                {conv.title}
              </span>
              <button
                onClick={() => onDeleteConversation(conv.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">快捷命令</h3>
            <button
              onClick={() => setShowAddCommand(!showAddCommand)}
              className="text-gray-400 hover:text-white"
            >
              +
            </button>
          </div>
          {showAddCommand && (
            <div className="mb-2 p-2 bg-gray-800 rounded-lg">
              <input
                type="text"
                placeholder="命令名称"
                value={newCmdName}
                onChange={(e) => setNewCmdName(e.target.value)}
                className="w-full bg-gray-700 text-white px-2 py-1 rounded mb-1 text-sm"
              />
              <input
                type="text"
                placeholder="提示词"
                value={newCmdPrompt}
                onChange={(e) => setNewCmdPrompt(e.target.value)}
                className="w-full bg-gray-700 text-white px-2 py-1 rounded mb-1 text-sm"
              />
              <button
                onClick={handleAddCommand}
                className="w-full bg-blue-600 text-white py-1 rounded text-sm"
              >
                添加
              </button>
            </div>
          )}
          {commands.map((cmd) => (
            <div
              key={cmd.id}
              onClick={() => onSelectCommand(cmd.prompt)}
              className="px-3 py-2 rounded-lg cursor-pointer mb-1 hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm">{cmd.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <button className="w-full text-gray-400 hover:text-white py-2 px-4 rounded-lg text-sm flex items-center gap-2">
          <span>⚙️</span>
          <span>设置</span>
        </button>
      </div>
    </div>
  );
}
