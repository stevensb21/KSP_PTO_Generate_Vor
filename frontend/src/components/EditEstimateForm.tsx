'use client';

import { useState, useEffect } from 'react';
import { updateEstimate } from '@/lib/api/estimates';
import type { EstimateDetail, EstimateStatus } from '@/types';

interface EditEstimateFormProps {
  estimate: EstimateDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditEstimateForm({ estimate, onSuccess, onCancel }: EditEstimateFormProps) {
  const [name, setName] = useState(estimate.name);
  const [objectName, setObjectName] = useState(estimate.object_name);
  const [status, setStatus] = useState<EstimateStatus>(estimate.status);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Название ВОР обязательно');
      return;
    }
    if (!objectName.trim()) {
      setError('Название объекта обязательно');
      return;
    }

    setIsLoading(true);
    try {
      await updateEstimate(estimate.id, {
        name: name.trim(),
        object_name: objectName.trim(),
        status,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при обновлении ВОР');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Редактировать ВОР</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Название ВОР */}
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                Название ВОР *
              </label>
              <input
                type="text"
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Например: ВОР для офисного здания"
                required
                disabled={isLoading}
              />
            </div>

            {/* Название объекта */}
            <div>
              <label htmlFor="edit-objectName" className="block text-sm font-medium text-gray-700 mb-1">
                Название объекта *
              </label>
              <input
                type="text"
                id="edit-objectName"
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Например: Офис на ул. Ленина, 10"
                required
                disabled={isLoading}
              />
            </div>

            {/* Статус */}
            <div>
              <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as EstimateStatus)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                disabled={isLoading}
              >
                <option value="draft">Черновик</option>
                <option value="active">Активна</option>
                <option value="completed">Завершена</option>
                <option value="archived">Архив</option>
              </select>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                disabled={isLoading}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

