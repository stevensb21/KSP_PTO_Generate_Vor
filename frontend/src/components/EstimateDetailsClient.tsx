'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SectionCard from './SectionCard';
import SectionTable from './SectionTable';
import EditEstimateForm from './EditEstimateForm';
import { exportEstimateToExcel } from '@/lib/excel/exportEstimate';
import { deleteEstimate, getWorkCategories } from '@/lib/api/estimates';
import type { EstimateDetail, EstimateSectionDetail, WorkCategory } from '@/types';

interface EstimateDetailsClientProps {
  estimate: EstimateDetail;
}

export default function EstimateDetailsClient({ estimate }: EstimateDetailsClientProps) {
  const router = useRouter();
  const [showEditEstimate, setShowEditEstimate] = useState(false);
  const [workCategories, setWorkCategories] = useState<WorkCategory[]>([]);
  const [allSections, setAllSections] = useState<EstimateSectionDetail[]>([]);

  // Загружаем все виды работ из справочника
  useEffect(() => {
    const loadWorkCategories = async () => {
      try {
        const response = await getWorkCategories();
        const categories = response.results || [];
        setWorkCategories(categories);

        // Создаем объединенный список разделов: существующие + отсутствующие категории
        const existingSectionMap = new Map(
          estimate.sections.map(s => [s.work_category, s])
        );

        const combinedSections: EstimateSectionDetail[] = categories.map((category: WorkCategory) => {
          const existing = existingSectionMap.get(category.id);
          if (existing) {
            return existing;
          }
          // Создаем пустой раздел для категории, которой нет в ВОР
          return {
            id: 0, // Временный ID
            estimate: estimate.id,
            estimate_name: estimate.name,
            work_category: category.id,
            work_category_name: category.name,
            total_area: 0,
            work_types: [],
            work_types_count: 0,
          } as EstimateSectionDetail;
        });

        setAllSections(combinedSections);
      } catch (err) {
        console.error('Ошибка при загрузке видов работ:', err);
        // Если не удалось загрузить, используем только существующие разделы
        setAllSections(estimate.sections);
      }
    };

    loadWorkCategories();
  }, [estimate]);

  const handleEstimateUpdated = () => {
    setShowEditEstimate(false);
    router.refresh();
  };

  const handleDeleteEstimate = async () => {
    if (!confirm(`Удалить ВОР "${estimate.name}"? Это действие нельзя отменить.`)) {
      return;
    }

    try {
      await deleteEstimate(estimate.id);
      // Перенаправляем на список ВОР после удаления
      router.push('/estimates');
    } catch (err: any) {
      alert('Ошибка при удалении ВОР: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Заголовок ВОР */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {estimate.name}
              </h1>
              <p className="text-lg text-gray-600">{estimate.object_name}</p>
              <p className="text-sm text-gray-500 mt-1">
                Статус: <span className="font-medium">{getStatusLabel(estimate.status)}</span>
              </p>
            </div>
            <div className="flex gap-3  ">
              {/* Кнопка экспорта в Excel */}
              <button
                onClick={() => exportEstimateToExcel(estimate)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                title="Экспорт в Excel"
              >
                <span>📊</span>
                Excel
              </button>
              {/* Кнопка редактирования */}
              <button
                onClick={() => setShowEditEstimate(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                title="Редактировать ВОР"
              >
                <span>✎</span>
                Редактировать
              </button>
              {/* Кнопка удаления */}
              <button
                onClick={handleDeleteEstimate}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                title="Удалить ВОР"
              >
                <span>✕</span>
                Удалить
              </button>
            </div>
          </div>
        </div>

        {/* Карточки разделов и таблицы */}
        {allSections.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <p className="text-gray-500">
              Загрузка видов работ...
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Карточки для управления разделами */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allSections.map((section) => (
                <div key={section.work_category} className="min-w-0">
                  <SectionCard
                    section={section}
                    estimateId={estimate.id}
                    onAddWorkType={() => {}}
                  />
                </div>
              ))}
            </div>

            {/* Таблицы с детальной информацией - только для разделов с площадью > 0 */}
            {allSections
              .filter(section => {
                // Показываем таблицу только если площадь > 0 и есть типы работ с процентами > 0
                if (section.total_area <= 0) return false;
                const workTypes = section.work_types || [];
                return workTypes.some(wt => wt.percentage > 0);
              })
              .map((section) => (
                <SectionTableCard key={`table-${section.work_category}`} section={section} />
              ))}
          </div>
        )}
      </div>

      {/* Модальное окно редактирования ВОР */}
      {showEditEstimate && (
        <EditEstimateForm
          estimate={estimate}
          onSuccess={handleEstimateUpdated}
          onCancel={() => setShowEditEstimate(false)}
        />
      )}
    </>
  );
}

// Функция для получения текстового представления статуса
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Черновик',
    active: 'Активна',
    completed: 'Завершена',
    archived: 'Архив',
  };
  return statusMap[status] || status;
}

// Компонент для отображения таблицы раздела
function SectionTableCard({ section }: { section: EstimateSectionDetail }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Заголовок таблицы */}
      <div className="bg-green-600 text-white px-6 py-4">
        <h3 className="text-xl font-bold">{section.work_category_name}</h3>
        <p className="text-green-100 mt-1">
          Площадь: {section.total_area} м²
        </p>
      </div>
      
      {/* Таблица с работами и ресурсами */}
      <SectionTable section={section} />
    </div>
  );
}

