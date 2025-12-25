
import EstimatesList from '@/components/EstimatesList';
import Link from 'next/link';

export default function EstimatesPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Все ВОР
          </h1>
          <Link
            href="/estimates/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Создать ВОР
          </Link>
        </div>
        <EstimatesList />
      </div>
    </div>
  );
}