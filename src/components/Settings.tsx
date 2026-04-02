import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Props {
  onClose: () => void;
}

const RECOMMENDED_MODELS = [
  'claude-opus-4-20250514',
  'claude-sonnet-4-20250514',
  'claude-haiku-4-20250514',
];

export default function Settings({ onClose }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    invoke<{ api_key_set: boolean; model: string }>('get_settings').then((settings) => {
      setModel(settings.model);
    }).catch(console.error);
  }, []);

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
      <div className="bg-gray-800 rounded-lg p-6 w-[480px]">
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
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="输入任意模型名称，如 claude-sonnet-4-20250514"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {RECOMMENDED_MODELS.map((m) => (
              <button
                key={m}
                onClick={() => setModel(m)}
                className={`text-xs px-2 py-1 rounded ${
                  model === m
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
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
