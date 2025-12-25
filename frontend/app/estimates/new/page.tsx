import CreateEstimateForm from '@/components/CreateEstimateForm';
import Link from 'next/link';

export default function NewEstimatePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Кнопка "Назад" */}
        <Link
          href="/estimates"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          ← Назад к списку ВОР
        </Link>

        {/* Форма создания ВОР */}
        <CreateEstimateForm />
      </div>
    </div>
  );
}

