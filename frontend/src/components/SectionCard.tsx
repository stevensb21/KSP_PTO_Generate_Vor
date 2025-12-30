'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { updateEstimateSectionWorkType, createEstimateSectionWorkType, deleteEstimateSectionWorkType, getWorkTypes } from '@/lib/api/estimates';
import type { EstimateSectionDetail, EstimateSectionWorkTypeDetail, WorkType } from '@/types';

interface SectionCardProps {
  section: EstimateSectionDetail;
  estimateId: number;
  onAddWorkType: (sectionId: number, workCategoryId: number) => void;
}

export default function SectionCard({ section, estimateId, onAddWorkType }: SectionCardProps) {
  const router = useRouter();
  const [editingPercentages, setEditingPercentages] = useState<Record<string, string>>({});
  const [allWorkTypes, setAllWorkTypes] = useState<EstimateSectionWorkTypeDetail[]>([]);

  // Загружаем все типы работ из справочника для данного вида работ
  useEffect(() => {
    const loadWorkTypes = async () => {
      // Проверяем, нужно ли загружать
      if (!section.work_category) {
        setAllWorkTypes((section.work_types || []) as EstimateSectionWorkTypeDetail[]);
        return;
      }

      try {
        const response = await getWorkTypes(section.work_category);
        const workTypesFromCatalog = (response.results || []) as WorkType[];

        // Создаем Map существующих типов работ в разделе
        const existingWorkTypesMap = new Map(
          (section.work_types || []).map((wt) => [wt.work_type, wt as EstimateSectionWorkTypeDetail])
        );

        // Объединяем: существующие + отсутствующие типы работ
        const combinedWorkTypes: EstimateSectionWorkTypeDetail[] = workTypesFromCatalog.map((workType: WorkType) => {
          const existing = existingWorkTypesMap.get(workType.id);
          if (existing) {
            return existing;
          }
          // Создаем временный тип работ для типа, которого нет в разделе
          return {
            id: 0,
            section: section.id,
            section_info: '',
            work_type: workType.id,
            work_type_name: workType.name,
            percentage: 0,
            items_count: 0,
            items: [],
          } as EstimateSectionWorkTypeDetail;
        });

        setAllWorkTypes(combinedWorkTypes);
      } catch (err) {
        console.error('Ошибка при загрузке типов работ:', err);
        setAllWorkTypes((section.work_types || []) as EstimateSectionWorkTypeDetail[]);
      }
    };

    loadWorkTypes();
    // Зависимости: только work_category и id раздела, чтобы не перезагружать при каждом изменении
  }, [section.work_category, section.id]);

  // Синхронизируем проценты из пропса section с локальным состоянием
  useEffect(() => {
    if (section.work_types && section.work_types.length > 0) {
      setAllWorkTypes((prev) => {
        // Создаем Map для быстрого поиска
        const sectionWorkTypesMap = new Map(
          section.work_types.map((wt) => [wt.work_type, wt])
        );
        
        // Обновляем проценты в существующих типах работ
        return prev.map((wt) => {
          const updated = sectionWorkTypesMap.get(wt.work_type);
          if (updated && updated.percentage !== wt.percentage) {
            return { ...wt, percentage: updated.percentage, id: updated.id };
          }
          return wt;
        });
      });
    }
  }, [section.work_types]);


  const handlePercentageSave = async (workTypeKey: string, workType: EstimateSectionWorkTypeDetail, value: string) => {
    const percentage = parseFloat(value);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      // Если значение некорректное, возвращаем исходное
      setEditingPercentages((prev) => {
        const newPercentages = { ...prev };
        delete newPercentages[workTypeKey];
        return newPercentages;
      });
      return;
    }

    // Если значение не изменилось, не сохраняем
    if (percentage === workType.percentage && workType.id > 0) {
      setEditingPercentages((prev) => {
        const newPercentages = { ...prev };
        delete newPercentages[workTypeKey];
        return newPercentages;
      });
      return;
    }

    // Если раздел еще не создан, сначала создаем его
    if (section.id === 0) {
      alert('Сначала укажите площадь вида работ');
      setEditingPercentages((prev) => {
        const newPercentages = { ...prev };
        delete newPercentages[workTypeKey];
        return newPercentages;
      });
      return;
    }

    try {
      let updatedWorkType;
      
      // Если тип работ еще не создан (id = 0), создаем его
      if (workType.id === 0) {
        updatedWorkType = await createEstimateSectionWorkType({
          section: section.id,
          work_type: workType.work_type,
          percentage: percentage,
        });
      } else {
        // Иначе обновляем существующий
        updatedWorkType = await updateEstimateSectionWorkType(workType.id, { percentage });
      }
      
      // Обновляем локальное состояние сразу, чтобы пользователь видел изменения
      setAllWorkTypes((prev) => {
        return prev.map((wt) => {
          if (wt.work_type === workType.work_type) {
            // Используем данные из ответа API, если доступны
            return { 
              ...wt, 
              percentage: updatedWorkType?.percentage ?? percentage,
              id: updatedWorkType?.id ?? wt.id
            };
          }
          return wt;
        });
      });
      
      // Очищаем состояние редактирования
      setEditingPercentages((prev) => {
        const newPercentages = { ...prev };
        delete newPercentages[workTypeKey];
        return newPercentages;
      });
      
      // Обновляем данные с сервера
      router.refresh();
    } catch (err) {
      alert('Ошибка при сохранении процента');
      setEditingPercentages((prev) => {
        const newPercentages = { ...prev };
        delete newPercentages[workTypeKey];
        return newPercentages;
      });
    }
  };

  const handleDeleteWorkType = async (workType: EstimateSectionWorkTypeDetail) => {
    // Если тип работ еще не создан (id = 0), просто удаляем из локального состояния
    if (workType.id === 0) {
      setAllWorkTypes(prev => prev.filter(wt => wt.work_type !== workType.work_type));
      return;
    }

    if (!confirm('Удалить этот тип работ?')) return;
    
    try {
      await deleteEstimateSectionWorkType(workType.id);
      // Сразу обновляем локальное состояние
      setAllWorkTypes(prev => prev.filter(wt => wt.id !== workType.id));
      // Обновляем данные с сервера
      router.refresh();
    } catch (err) {
      alert('Ошибка при удалении типа работ');
    }
  };

  const handleDeleteSection = async () => {
    // Если раздел еще не создан (id = 0), ничего не делаем
    if (section.id === 0) {
      return;
    }

    if (!confirm(`Удалить все типы работ в разделе "${section.work_category_name}"? Раздел останется, но все проценты будут удалены.`)) return;
    
    try {
      // Удаляем все типы работ в разделе, но сам раздел оставляем
      const workTypesToDelete = allWorkTypes.filter(wt => wt.id > 0);
      const deletePromises = workTypesToDelete.map(wt => deleteEstimateSectionWorkType(wt.id));
      await Promise.all(deletePromises);
      router.refresh();
    } catch (err) {
      alert('Ошибка при удалении типов работ');
    }
  };

  const totalPercentage = useMemo(() => {
    return allWorkTypes.reduce((sum, wt) => sum + wt.percentage, 0);
  }, [allWorkTypes]);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm min-w-0">
        {/* Заголовок карточки */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            {section.work_category_name}
          </h3>
          <button
            onClick={handleDeleteSection}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium flex-shrink-0"
            title="Удалить все типы работ (проценты) в этом разделе"
          >
            ✕ Удалить проценты
          </button>
        </div>

        {/* Отображение площади (только для чтения) */}
        {section.total_area > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Полезная площадь здания
            </label>
            <div className="text-lg font-semibold text-gray-800">
              {section.total_area} м²
            </div>
          </div>
        )}

        {/* Список типов работ */}
        {allWorkTypes.length === 0 ? (
          <div className="text-gray-500 text-sm mb-4">
            Загрузка типов работ...
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {allWorkTypes.map((workType, index) => {
                // Уникальный ключ: комбинация section и work_type
                const sectionKey = section.id > 0 ? section.id : `cat-${section.work_category}`;
                const workTypeKey = workType.id > 0 
                  ? `s${sectionKey}-wt${workType.id}` 
                  : `s${sectionKey}-wt${workType.work_type}-i${index}`;
                
                const isEditing = editingPercentages[workTypeKey] !== undefined;
                // Если процент 0 и не в процессе редактирования - показываем пустое поле
                const displayValue = isEditing 
                  ? editingPercentages[workTypeKey] 
                  : (workType.percentage > 0 ? workType.percentage.toString() : '');

                return (
                  <div key={workTypeKey} className="flex items-start gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-800 block break-words">{workType.work_type_name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={displayValue}
                        onChange={(e) => {
                          setEditingPercentages({ ...editingPercentages, [workTypeKey]: e.target.value });
                        }}
                        onBlur={(e) => {
                          handlePercentageSave(workTypeKey, workType, e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <span className="text-gray-500 text-sm">%</span>
                      {workType.percentage > 0 && workType.id > 0 && (
                        <button
                          onClick={() => handleDeleteWorkType(workType)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm flex-shrink-0"
                          title="Удалить тип работ"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Индикатор суммы процентов */}
            {allWorkTypes.length > 0 && (
              <div className={`text-sm mb-4 ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                Сумма: {totalPercentage.toFixed(2)}% {totalPercentage === 100 ? '✓' : '(должно быть 100%)'}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

