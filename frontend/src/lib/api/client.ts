import axios from 'axios';

// Базовый URL для API (ваш Django сервер)
// В Server Components может быть нужен другой URL (например, если работают в Docker)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window === 'undefined' 
    ? 'http://localhost:8001/api'  // Server Component
    : 'http://localhost:8001/api'   // Client Component
  );

// Создаем экземпляр axios с базовыми настройками
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 секунд таймаут
  validateStatus: (status) => status < 500, // Не выбрасывать ошибку для 4xx
});

// Обработчик ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('API Error: Сервер недоступен. Проверьте, что Django API запущен на', API_URL);
    } else if (error.message === 'socket hang up' || error.code === 'ECONNRESET') {
      console.error('API Error: Соединение разорвано. Возможно, сервер перезагружается или недоступен.');
    } else {
      console.error('API Error:', error.message || error);
    }
    return Promise.reject(error);
  }
);