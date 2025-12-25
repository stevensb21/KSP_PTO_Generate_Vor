// src/components/EstimatesList.tsx
import { getEstimates } from '@/lib/api/estimates';
import Link from 'next/link';  // Добавьте этот импорт

export default async function EstimatesList() {
  const data = await getEstimates();
  const estimates = data.results;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Все ВОР ({data.count})
      </h2>
      
      {estimates.length === 0 ? (
        <p className="text-gray-600">ВОР пока нет. Создайте первую!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {estimates.map((estimate) => (
            <Link
              key={estimate.id}
              href={`/estimates/${estimate.id}`}  // Ссылка на детальный просмотр
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition block"
            >
              <h3 className="text-xl font-semibold mb-2">{estimate.name}</h3>
              <p className="text-gray-600 mb-4">{estimate.object_name}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {estimate.sections_count} видов работ
                </span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    estimate.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : estimate.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {estimate.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}