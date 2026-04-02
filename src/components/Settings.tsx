import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Props {
  onClose: () => void;
}

const MODELS = [
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4 (最强，最贵)' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (平衡)' },
  { id: 'claude-haiku-4-20250514', name: 'Claude Haiku 4 (最快，最便宜)' },
];

export default function Settings({ onClose }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    try {
      await invoke('save_settings', { apiKey, model });
      setSaved(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <h2 className="text-xl font-medium mb-4">设置</h2>
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-api..."
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">模型</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        {saved && <p className="text-green-500 text-sm mb-4">已保存！</p>}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
          >
            保存
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
