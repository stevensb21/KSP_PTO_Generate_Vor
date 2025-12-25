import EstimateDetails from '@/components/EstimateDetails';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Этот компонент получает параметр id из URL
export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  // В Next.js 15 params может быть Promise, поэтому нужно await
  const resolvedParams = await Promise.resolve(params);
  
  // Получаем id из параметров
  const idString = resolvedParams.id;
  
  // Проверяем, что id существует и является числом
  if (!idString) {
    notFound(); // Показывает страницу 404
  }
  
  // Преобразуем id из строки в число
  const estimateId = Number(idString);
  
  // Проверяем, что преобразование прошло успешно
  if (isNaN(estimateId) || estimateId <= 0) {
    notFound(); // Если не число или <= 0, показываем 404
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Кнопка "Назад" */}
        <Link
          href="/estimates"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          ← Назад к списку ВОР
        </Link>

        {/* Компонент детального просмотра */}
        <EstimateDetails id={estimateId} />
      </div>
    </div>
  );
}