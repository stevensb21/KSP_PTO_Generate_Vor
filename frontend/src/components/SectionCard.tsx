'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateEstimateSection, createEstimateSection, updateEstimateSectionWorkType, createEstimateSectionWorkType, deleteEstimateSectionWorkType, deleteEstimateSection, getWorkTypes } from '@/lib/api/estimates';
import type { EstimateSectionDetail, EstimateSectionWorkTypeDetail, WorkType } from '@/types';

interface SectionCardProps {
  section: EstimateSectionDetail;
  estimateId: number;
  onAddWorkType: (sectionId: number, workCategoryId: number) => void;
}

export default function SectionCard({ section, estimateId, onAddWorkType }: SectionCardProps) {
  const router = useRouter();
  const [totalArea, setTotalArea] = useState<string>(section.total_area.toString());
  const [isSavingArea, setIsSavingArea] = useState(false);
  const [editingPercentages, setEditingPercentages] = useState<Record<number, string>>({});
  const [allWorkTypes, setAllWorkTypes] = useState<EstimateSectionWorkTypeDetail[]>([]);

  // Загружаем все типы работ из справочника для данного вида работ
  useEffect(() => {
    const loadWorkTypes = async () => {
      try {
        const response = await getWorkTypes(section.work_category);
        const workTypesFromCatalog = (response.results || []) as WorkType[];

        // Создаем Map существующих типов работ в разделе
        const existingWorkTypesMap = new Map(
          (section.work_types || []).map((wt: EstimateSectionWorkTypeDetail) => [wt.work_type, wt])
        );

        // Объединяем: существующие + отсутствующие типы работ
        const combinedWorkTypes: EstimateSectionWorkTypeDetail[] = workTypesFromCatalog.map((workType: WorkType) => {
          const existing = existingWorkTypesMap.get(workType.id);
          if (existing) {
            return existing;
          }
          // Создаем временный тип работ для типа, которого нет в разделе
          return {
            id: 0, // Временный ID
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
        // Если не удалось загрузить, используем только существующие типы работ
        setAllWorkTypes((section.work_types || []) as EstimateSectionWorkTypeDetail[]);
      }
    };

    // Загружаем только если раздел существует (id > 0) или если есть work_category
    if (section.work_category) {
      loadWorkTypes();
    } else {
      setAllWorkTypes((section.work_types || []) as EstimateSectionWorkTypeDetail[]);
    }
  }, [section]);

  const handleAreaSave = async () => {
    const area = parseFloat(totalArea);
    if (isNaN(area) || area < 0) {
      // Если значение некорректное, возвращаем исходное
      setTotalArea(section.total_area.toString());
      return;
    }

    // Если значение не изменилось, не сохраняем
    if (area === section.total_area && section.id > 0) {
      return;
    }

    setIsSavingArea(true);
    try {
      // Если раздел еще не создан (id = 0), создаем его
      if (section.id === 0) {
        await createEstimateSection({
          estimate: estimateId,
          work_category: section.work_category,
          total_area: area,
        });
      } else {
        // Иначе обновляем существующий
        await updateEstimateSection(section.id, { total_area: area });
      }
      router.refresh();
    } catch (err) {
      alert('Ошибка при сохранении площади');
      setTotalArea(section.total_area.toString());
    } finally {
      setIsSavingArea(false);
    }
  };

  const handlePercentageSave = async (workTypeKey: number, workType: EstimateSectionWorkTypeDetail, value: string) => {
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
      // Если тип работ еще не создан (id = 0), создаем его
      if (workType.id === 0) {
        await createEstimateSectionWorkType({
          section: section.id,
          work_type: workType.work_type,
          percentage: percentage,
        });
      } else {
        // Иначе обновляем существующий
        await updateEstimateSectionWorkType(workType.id, { percentage });
      }
      router.refresh();
      setEditingPercentages((prev) => {
        const newPercentages = { ...prev };
        delete newPercentages[workTypeKey];
        return newPercentages;
      });
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
    // Если тип работ еще не создан (id = 0), просто сбрасываем процент
    if (workType.id === 0) {
      setEditingPercentages({ ...editingPercentages, [workType.work_type]: '0' });
      // Сохраняем процент 0
      try {
        await createEstimateSectionWorkType({
          section: section.id,
          work_type: workType.work_type,
          percentage: 0,
        });
        router.refresh();
      } catch (err) {
        // Игнорируем ошибку, если раздел еще не создан
      }
      return;
    }

    if (!confirm('Удалить этот тип работ?')) return;
    
    try {
      await deleteEstimateSectionWorkType(workType.id);
      router.refresh();
    } catch (err) {
      alert('Ошибка при удалении типа работ');
    }
  };

  const handleDeleteSection = async () => {
    // Если раздел еще не создан (id = 0), просто сбрасываем площадь
    if (section.id === 0) {
      setTotalArea('0');
      setIsEditingArea(false);
      router.refresh();
      return;
    }

    if (!confirm(`Удалить вид работ "${section.work_category_name}"? Это также удалит все типы работ, работы и ресурсы в этом разделе.`)) return;
    
    try {
      await deleteEstimateSection(section.id);
      router.refresh();
    } catch (err) {
      alert('Ошибка при удалении вида работ');
    }
  };

  const totalPercentage = allWorkTypes.reduce((sum, wt) => sum + wt.percentage, 0);

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
            title="Удалить вид работ"
          >
            ✕ Удалить
          </button>
        </div>

        {/* Поле общей площади */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Общая площадь {section.work_category_name.toLowerCase()}
          </label>
          <div className="flex gap-2 flex-wrap">
            <input
              type="number"
              step="0.01"
              min="0"
              value={totalArea}
              onChange={(e) => setTotalArea(e.target.value)}
              onBlur={handleAreaSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              disabled={isSavingArea}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex-shrink-0"
              disabled
            >
              M2
            </button>
            {isSavingArea && (
              <span className="px-3 py-2 text-gray-500 text-sm flex items-center">
                Сохранение...
              </span>
            )}
          </div>
        </div>

        {/* Список типов работ */}
        {allWorkTypes.length === 0 ? (
          <div className="text-gray-500 text-sm mb-4">
            Загрузка типов работ...
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {allWorkTypes.map((workType) => {
                // Используем work_type как ключ, так как id может быть 0
                const workTypeKey = workType.id > 0 ? workType.id : workType.work_type;
                const isEditing = editingPercentages[workTypeKey] !== undefined;
                const displayValue = isEditing 
                  ? editingPercentages[workTypeKey] 
                  : workType.percentage.toString();

                return (
                  <div key={workTypeKey} className="flex items-start gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-800 block break-words">{workType.work_type_name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                      <input
                        type="number"
                        step="0.01"
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

