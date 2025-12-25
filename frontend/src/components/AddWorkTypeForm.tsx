'use client';

import { useState, useEffect } from 'react';
import { createEstimateSectionWorkType, getWorkTypes } from '@/lib/api/estimates';
import type { WorkType } from '@/types';

interface AddWorkTypeFormProps {
  sectionId: number;
  workCategoryId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddWorkTypeForm({ 
  sectionId, 
  workCategoryId,
  onSuccess, 
  onCancel 
}: AddWorkTypeFormProps) {
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [selectedWorkType, setSelectedWorkType] = useState<number>(0);
  const [percentage, setPercentage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Загружаем список типов работ для выбранного вида работ
  useEffect(() => {
    async function loadWorkTypes() {
      try {
        console.log('Загружаем типы работ для категории ID:', workCategoryId);
        const data = await getWorkTypes(workCategoryId);
        console.log('Получено типов работ:', data.results?.length || 0, data.results);
        setWorkTypes(data.results || []);
        
        if (!data.results || data.results.length === 0) {
          setError('Для этого вида работ пока нет типов работ. Создайте типы работ в справочнике.');
        }
      } catch (err) {
        console.error('Ошибка загрузки типов работ:', err);
        setError('Ошибка загрузки типов работ. Проверьте подключение к API.');
      }
    }
    if (workCategoryId) {
      loadWorkTypes();
    } else {
      setError('Не указан вид работ');
    }
  }, [workCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedWorkType) {
      setError('Выберите тип работ');
      return;
    }

    const percent = parseFloat(percentage);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      setError('Введите корректный процент (от 0 до 100)');
      return;
    }

    setIsLoading(true);
    try {
      await createEstimateSectionWorkType({
        section: sectionId,
        work_type: selectedWorkType,
        percentage: percent,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при создании типа работ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Добавить тип работ</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип работ *
            </label>
            <select
              value={selectedWorkType}
              onChange={(e) => setSelectedWorkType(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={workTypes.length === 0}
            >
              <option value={0}>
                {workTypes.length === 0 
                  ? 'Нет типов работ для этого вида работ' 
                  : 'Выберите тип работ'}
              </option>
              {workTypes.map((workType) => (
                <option key={workType.id} value={workType.id}>
                  {workType.name}
                </option>
              ))}
            </select>
            {workTypes.length === 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                💡 Создайте типы работ в Django Admin: Справочники → Типы работ
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Процент от площади раздела (%) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="60.00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Сумма процентов всех типов работ в разделе должна быть 100%
            </p>
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

