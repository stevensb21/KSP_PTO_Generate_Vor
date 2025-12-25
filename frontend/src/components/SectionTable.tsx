import type { EstimateSectionDetail, EstimateSectionWorkTypeDetail, EstimateItemDetail } from '@/types';

// Компонент для отображения раздела в виде таблицы
export default function SectionTable({ 
  section 
}: { 
  section: EstimateSectionDetail 
}) {
  // Собираем все работы и ресурсы для таблицы
  const tableRows: Array<{
    number: string;
    name: string;
    unit: string;
    quantity: number;
    isResource: boolean;
    isWorkType: boolean; // Флаг для строки с названием типа работ
  }> = [];

  let workNumber = 1;

  // Проходим по всем типам работ в разделе
  // Фильтруем только типы работ с процентом > 0
  // Используем type assertion, так как API возвращает детальные данные
  (section.work_types as EstimateSectionWorkTypeDetail[])
    .filter((workType) => workType.percentage > 0)
    .forEach((workType) => {
      // Добавляем строку с названием типа работ
      tableRows.push({
        number: '',
        name: workType.work_type_name,
        unit: '',
        quantity: 0,
        isResource: false,
        isWorkType: true, // Это строка с названием типа работ
      });

    // Проходим по всем работам в типе работ
    const items = workType.items || [];
    items.forEach((item) => {
      // Добавляем работу
      tableRows.push({
        number: workNumber.toString(),
        name: item.work_name,
        unit: item.work_unit,
        quantity: item.volume,
        isResource: false,
        isWorkType: false,
      });

      // Добавляем ресурсы для этой работы
      const resources = (item as EstimateItemDetail).resources || [];
      resources.forEach((resource, index) => {
        tableRows.push({
          number: `${workNumber}.${index + 1}`,
          name: `→ ${resource.resource_name}`,
          unit: resource.resource_unit,
          quantity: resource.quantity,
          isResource: true,
          isWorkType: false,
        });
      });

      workNumber++;
    });
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Заголовок таблицы */}
        <thead>
          <tr className="bg-green-600 text-white">
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">№</th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Наименование работ</th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Ед. изм.</th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Кол-во</th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Примечание</th>
          </tr>
        </thead>
        {/* Тело таблицы */}
        <tbody>
          {tableRows.length === 0 ? (
            <tr>
              <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                Работы будут созданы автоматически из шаблона типа работ
              </td>
            </tr>
          ) : (
            tableRows.map((row, index) => {
              // Если это строка с названием типа работ
              if (row.isWorkType) {
                return (
                  <tr 
                    key={index}
                    className="bg-blue-100"
                  >
                    <td className="border border-gray-300 px-4 py-3" colSpan={5}>
                      <span className="font-bold text-blue-900 text-lg">
                        {row.name}
                      </span>
                    </td>
                  </tr>
                );
              }

              // Обычная строка (работа или ресурс)
              return (
                <tr 
                  key={index}
                  className={row.isResource ? 'bg-gray-50' : 'bg-white'}
                >
                  <td className="text-black border border-gray-300 px-4 py-3 text-center">
                    <span className={row.isResource ? 'font-normal' : 'font-semibold'}>
                      {row.number}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {row.isResource ? (
                      <span className="text-gray-700 font-normal">{row.name}</span>
                    ) : (
                      <span className="font-bold text-gray-900">{row.name}</span>
                    )}
                  </td>
                  <td className={`border border-gray-300 px-4 py-3 text-center text-black ${row.isResource ? 'font-normal' : 'font-semibold'}`}>
                    {row.unit}
                  </td>
                  <td className={`border border-gray-300 px-4 py-3 text-right text-black ${row.isResource ? 'font-normal' : 'font-semibold'}`}>
                    {row.quantity === 0 ? "По сметному расчету" : row.quantity.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-500 font-normal">
                    {row.isResource ? (
                      <span className="text-gray-700 font-normal">Норму расхода - по сметной норме смотреть расход</span>
                    ) : (
                      <span className="font-bold text-gray-900"></span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

