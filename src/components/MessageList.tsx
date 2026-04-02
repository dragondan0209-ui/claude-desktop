import { Message } from '../types';

interface Props {
  messages: Message[];
}

export default function MessageList({ messages }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          开始新对话吧
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xl px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
