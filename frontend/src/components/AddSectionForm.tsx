'use client';

import { useState, useEffect } from 'react';
import { createEstimateSection, getWorkCategories } from '@/lib/api/estimates';
import type { WorkCategory } from '@/types';

interface AddSectionFormProps {
  estimateId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddSectionForm({ estimateId, onSuccess, onCancel }: AddSectionFormProps) {
  const [workCategories, setWorkCategories] = useState<WorkCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [totalArea, setTotalArea] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Загружаем список видов работ
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getWorkCategories();
        setWorkCategories(data.results || []);
      } catch (err) {
        setError('Ошибка загрузки видов работ');
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCategory) {
      setError('Выберите вид работ');
      return;
    }

    const area = parseFloat(totalArea);
    if (isNaN(area) || area <= 0) {
      setError('Введите корректную площадь (больше 0)');
      return;
    }

    setIsLoading(true);
    try {
      await createEstimateSection({
        estimate: estimateId,
        work_category: selectedCategory,
        total_area: area,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при создании раздела');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Добавить вид работ</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Вид работ *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(Number(e.target.value))}
              className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Выберите вид работ</option>
              {workCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Площадь (м²) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={totalArea}
              onChange={(e) => setTotalArea(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="150.00"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

