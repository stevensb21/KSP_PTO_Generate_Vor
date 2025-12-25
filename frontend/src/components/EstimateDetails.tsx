// src/components/EstimateDetails.tsx
import { getEstimateById } from '@/lib/api/estimates';
import EstimateDetailsClient from './EstimateDetailsClient';

// Компонент для отображения детальной информации о ВОР (Server Component)
export default async function EstimateDetails({ 
  id 
}: { 
  id: number 
}) {
  const estimate = await getEstimateById(id);

  if (!estimate) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              Ошибка загрузки ВОР
            </h1>
            <p className="text-gray-700 mb-4">
              Не удалось загрузить ВОР с ID <span className="font-semibold">{id}</span>.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Возможные причины:</strong>
              </p>
              <ul className="list-disc list-inside text-yellow-800 text-sm mt-2 space-y-1">
                <li>ВОР не существует в базе данных</li>
                <li>Неправильный ID в URL</li>
                <li>API сервер недоступен (проверьте: docker compose ps)</li>
                <li>Проблема с подключением к серверу</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm">
                <strong>Как проверить:</strong>
              </p>
              <ul className="list-disc list-inside text-blue-800 text-sm mt-2 space-y-1">
                <li>Откройте: <code className="bg-blue-100 px-1 rounded">http://localhost:8001/api/estimates/{id}/</code></li>
                <li>Проверьте список ВОР: <code className="bg-blue-100 px-1 rounded">http://localhost:3001/estimates</code></li>
                <li>Проверьте логи: <code className="bg-blue-100 px-1 rounded">docker compose logs api</code></li>
              </ul>
            </div>
            <a
              href="/estimates"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ← Вернуться к списку ВОР
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Передаем данные в Client Component для интерактивности
  return <EstimateDetailsClient estimate={estimate} />;
}
