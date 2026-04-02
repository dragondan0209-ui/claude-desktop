interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export default function InputBox({ value, onChange, onSend }: Props) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="px-6 py-4 border-t border-gray-700">
      <div className="flex gap-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
        />
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          发送
        </button>
      </div>
    </div>
  );
}
