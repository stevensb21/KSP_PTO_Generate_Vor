import type { EstimateDetail, EstimateSectionDetail, EstimateSectionWorkTypeDetail, EstimateItemDetail } from '@/types';

/**
 * Экспортирует ВОР в Excel файл
 * Таблица в Excel будет точно такой же, как в веб-интерфейсе (со стилями)
 * Структура: Название ВОР -> Заголовки -> Вид работ -> Тип работ -> Работы и ресурсы
 */
export async function exportEstimateToExcel(estimate: EstimateDetail) {
  // Динамически импортируем exceljs только на клиенте
  const ExcelJS = (await import('exceljs')).default;

  // Создаем новую рабочую книгу
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VOR System';
  workbook.created = new Date();

  // Создаем один лист для всей ВОР
  const worksheet = workbook.addWorksheet('ВОР');
  buildEstimateWorksheet(worksheet, estimate);

  // Генерируем файл
  const fileName = `${estimate.name.replace(/[^\w\s-]/g, '')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // Создаем blob и скачиваем
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Строит лист Excel для всей ВОР с полными стилями
 * Структура: Название ВОР -> Заголовки -> Вид работ -> Тип работ -> Работы и ресурсы
 */
function buildEstimateWorksheet(
  worksheet: any,
  estimate: EstimateDetail
) {
  // Настраиваем колонки (авторазмер будет применен позже)
  worksheet.columns = [
    { width: 8 },   // №
    { width: 50 },  // Наименование работ
    { width: 12 },  // Ед. изм.
    { width: 15 },  // Кол-во
    { width: 50 },  // Примечание
  ];

  let currentRow = 1;

  // 1. Название ВОР (зеленая строка, объединенная)
  const estimateTitleRow = worksheet.addRow([
    estimate.name,
    '',
    '',
    '',
    ''
  ]);
  worksheet.mergeCells(currentRow, 1, currentRow, 5);
  const estimateTitleCell = estimateTitleRow.getCell(1);
  estimateTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF16A34A' } // Зеленый цвет (green-600)
  };
  estimateTitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  estimateTitleCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  estimateTitleRow.height = 50;
  estimateTitleCell.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };
  currentRow++;

  // 2. Заголовки таблицы (зеленая строка)
  const headerRow = worksheet.addRow(['№', 'Наименование работ', 'Ед. изм.', 'Кол-во', 'Примечание']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF16A34A' } // Зеленый цвет (green-600)
  };
  headerRow.height = 40;
  
  headerRow.eachCell((cell: any) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  });
  currentRow++;

  // 3. Проходим по всем разделам (видам работ)
  estimate.sections.forEach((section) => {
    // 3.1. Вид работ (зеленая строка, объединенная)
    const sectionTitleRow = worksheet.addRow([
      section.work_category_name,
      '',
      '',
      '',
      ''
    ]);
    worksheet.mergeCells(currentRow, 1, currentRow, 5);
    const sectionTitleCell = sectionTitleRow.getCell(1);
    sectionTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF16A34A' } // Зеленый цвет (green-600)
    };
    sectionTitleCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    sectionTitleCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    sectionTitleRow.height = 50;
    sectionTitleCell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    currentRow++;

    // 3.2. Проходим по всем типам работ в разделе
    const workTypes = section.work_types as EstimateSectionWorkTypeDetail[];
    let workNumber = 1;

    workTypes.forEach((workType) => {
      // 3.2.1. Тип работ (синяя строка, объединенная)
      const workTypeTitleRow = worksheet.addRow([
        workType.work_type_name,
        '',
        '',
        '',
        ''
      ]);
      worksheet.mergeCells(currentRow, 1, currentRow, 5);
      const workTypeTitleCell = workTypeTitleRow.getCell(1);
      workTypeTitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDBEAFE' } // Синий цвет (blue-100)
      };
      workTypeTitleCell.font = { bold: true, size: 12, color: { argb: 'FF1E3A8A' } }; // Синий текст (blue-900)
      workTypeTitleCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      workTypeTitleRow.height = 50;
      workTypeTitleCell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
      currentRow++;

      // 3.2.2. Работы и ресурсы этого типа работ
      const items = workType.items || [];
      items.forEach((item) => {
        // Добавляем работу (белая строка, жирный текст)
        const workRow = worksheet.addRow([
          workNumber.toString(),
          item.work_name,
          item.work_unit,
          item.volume === 0 ? 'По сметному расчету' : item.volume.toFixed(2),
          ''
        ]);

        workRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' } // Белый цвет
        };
        workRow.font = { bold: true, size: 11, color: { argb: 'FF111827' } }; // Темный текст (gray-900)
        workRow.height = 50;

        workRow.eachCell((cell: any, colNumber: number) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
          };

          if (colNumber === 1) { // №
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          } else if (colNumber === 3) { // Ед. изм.
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          } else if (colNumber === 4) { // Кол-во
            cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
          } else { // Наименование и Примечание
            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
          }
        });
        currentRow++;

        // Добавляем ресурсы для этой работы (серая строка, обычный текст)
        const resources = (item as EstimateItemDetail).resources || [];
        resources.forEach((resource, index) => {
          const resourceRow = worksheet.addRow([
            `${workNumber}.${index + 1}`,
            `→ ${resource.resource_name}`,
            resource.resource_unit,
            resource.quantity === 0 ? 'По сметному расчету' : resource.quantity.toFixed(2),
            'Норма расхода уточнить по смете'
          ]);

          resourceRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' } // Серый цвет (gray-50)
          };
          resourceRow.font = { size: 11, color: { argb: 'FF374151' }, italic: true }; // Серый текст (gray-700), курсив
          resourceRow.height = 50;

          resourceRow.eachCell((cell: any, colNumber: number) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };

            if (colNumber === 1) { // №
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            } else if (colNumber === 3) { // Ед. изм.
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            } else if (colNumber === 4) { // Кол-во
              cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
            } else { // Наименование и Примечание
              cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            }
          });
          currentRow++;
        });

        workNumber++;
      });
    });
  });

}
