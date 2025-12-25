import EstimatesList from '@/components/EstimatesList';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          ВОР - Ведомость Объёмов Работ
        </h1>
        <EstimatesList />
      </div>
    </div>
  );
}