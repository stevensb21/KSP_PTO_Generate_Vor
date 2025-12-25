'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createEstimate } from '@/lib/api/estimates';
import type { EstimateStatus } from '@/types';

export default function CreateEstimateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [objectName, setObjectName] = useState('');
  const [status, setStatus] = useState<EstimateStatus>('draft');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Введите название ВОР');
      return;
    }

    if (!objectName.trim()) {
      setError('Введите название объекта');
      return;
    }

    setIsLoading(true);
    try {
      const newEstimate = await createEstimate({
        name: name.trim(),
        object_name: objectName.trim(),
        status,
      });
      
      // Перенаправляем на страницу созданной ВОР
      router.push(`/estimates/${newEstimate.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при создании ВОР');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Создать новую ВОР
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Название ВОР */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название ВОР *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Например: ВОР для офисного здания"
            required
            disabled={isLoading}
          />
        </div>

        {/* Название объекта */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название объекта *
          </label>
          <input
            type="text"
            value={objectName}
            onChange={(e) => setObjectName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Например: Офис на ул. Ленина, 10"
            required
            disabled={isLoading}
          />
        </div>

        {/* Статус */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EstimateStatus)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="draft">Черновик</option>
            <option value="active">Активна</option>
            <option value="completed">Завершена</option>
            <option value="archived">Архив</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            По умолчанию создается как "Черновик"
          </p>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3 pt-4">
          <Link
            href="/estimates"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
          >
            Отмена
          </Link>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Создание...' : 'Создать ВОР'}
          </button>
        </div>
      </form>
    </div>
  );
}

