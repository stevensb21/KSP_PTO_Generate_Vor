import { apiClient } from './client';
import type { 
  Estimate, 
  EstimateDetail,
  EstimatesResponse 
} from '@/types';

// Функция для получения списка всех ВОР
export async function getEstimates(): Promise<EstimatesResponse> {
  const response = await apiClient.get<EstimatesResponse>('/estimates/');
  return response.data;
}

// Функция для получения одной ВОР по ID (с полной иерархией)
export async function getEstimateById(id: number): Promise<EstimateDetail | null> {
  try {
    const response = await apiClient.get<EstimateDetail>(`/estimates/${id}/`);
    
    // Проверяем статус ответа
    if (response.status === 404) {
      console.log(`ВОР с ID ${id} не найдена (404)`);
      return null;
    }
    
    return response.data;
  } catch (error: any) {
    // Логируем детали ошибки для отладки
    if (error.response) {
      // Сервер ответил с кодом ошибки
      console.error(`API Error ${error.response.status}:`, error.response.data);
      if (error.response.status === 404) {
        console.log(`ВОР с ID ${id} не найдена в базе данных`);
      }
      return null;
    } else if (error.request) {
      // Запрос был отправлен, но ответа не получено
      console.error('API Error: Нет ответа от сервера. Проверьте, что Django API запущен на http://localhost:8001');
      console.error('Детали ошибки:', error.code, error.message);
      return null;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message?.includes('socket hang up')) {
      // Проблемы с подключением
      console.error('API Error: Не удалось подключиться к серверу. Проверьте:');
      console.error('1. Запущен ли Django сервер: docker compose ps');
      console.error('2. Доступен ли API: curl http://localhost:8001/api/estimates/');
      return null;
    } else {
      // Ошибка при настройке запроса
      console.error('API Error:', error.message || error);
      return null;
    }
  }
}

// Функция для создания новой ВОР
export async function createEstimate(data: {
  name: string;
  object_name: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
}): Promise<Estimate> {
  const response = await apiClient.post<Estimate>('/estimates/', data);
  return response.data;
}

// Функция для обновления ВОР
export async function updateEstimate(
  id: number,
  data: Partial<Estimate>
): Promise<Estimate> {
  const response = await apiClient.put<Estimate>(`/estimates/${id}/`, data);
  return response.data;
}

// Функция для удаления ВОР
export async function deleteEstimate(id: number): Promise<void> {
  await apiClient.delete(`/estimates/${id}/`);
}

// ========== Функции для работы с разделами ВОР ==========

// Функция для создания раздела ВОР (вида работ)
export async function createEstimateSection(data: {
  estimate: number;
  work_category: number;
  total_area: number;
}) {
  const response = await apiClient.post('/estimate-sections/', data);
  return response.data;
}

// Функция для обновления раздела ВОР
export async function updateEstimateSection(
  id: number,
  data: { total_area?: number }
) {
  const response = await apiClient.patch(`/estimate-sections/${id}/`, data);
  return response.data;
}

// Функция для удаления раздела ВОР
export async function deleteEstimateSection(id: number): Promise<void> {
  await apiClient.delete(`/estimate-sections/${id}/`);
}

// ========== Функции для работы с типами работ в разделах ==========

// Функция для создания типа работ в разделе
export async function createEstimateSectionWorkType(data: {
  section: number;
  work_type: number;
  percentage: number;
}) {
  const response = await apiClient.post('/estimate-section-work-types/', data);
  return response.data;
}

// Функция для обновления типа работ в разделе
export async function updateEstimateSectionWorkType(
  id: number,
  data: { percentage?: number }
) {
  const response = await apiClient.patch(`/estimate-section-work-types/${id}/`, data);
  return response.data;
}

// Функция для удаления типа работ из раздела
export async function deleteEstimateSectionWorkType(id: number): Promise<void> {
  await apiClient.delete(`/estimate-section-work-types/${id}/`);
}

// ========== Функции для получения справочников ==========

// Функция для получения списка видов работ
export async function getWorkCategories() {
  const response = await apiClient.get('/work-categories/');
  return response.data;
}

// Функция для получения списка типов работ
export async function getWorkTypes(categoryId?: number) {
  const url = categoryId 
    ? `/work-types/?category=${categoryId}`
    : '/work-types/';
  const response = await apiClient.get(url);
  return response.data;
}