import axios from 'axios';

// Базовый URL для API (ваш Django сервер)
// В Server Components может быть нужен другой URL (например, если работают в Docker)
// Для Server Components в Docker используем имя сервиса, для Client Components - localhost
const getApiUrl = () => {
  // В Server Components (нет window) - используем SERVER_API_URL или имя сервиса Docker
  if (typeof window === 'undefined') {
    // Если есть переменная для серверных запросов (Docker), используем её
    if (process.env.SERVER_API_URL) {
      return process.env.SERVER_API_URL;
    }
    // Если есть NEXT_PUBLIC_API_URL, используем его (для локального запуска)
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    // По умолчанию для Server Components используем localhost (для локального запуска)
    // Если фронтенд в Docker, нужно установить SERVER_API_URL=http://api:8000/api
    return 'http://localhost:8001/api';
  }
  
  // В Client Components (браузер) - всегда используем NEXT_PUBLIC_API_URL или localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
};

const API_URL = getApiUrl();

// Отладка URL
if (process.env.NODE_ENV === 'development') {
  const isServer = typeof window === 'undefined';
  const logPrefix = isServer ? '[SERVER]' : '[CLIENT]';
  console.log(`${logPrefix} API_URL:`, API_URL);
  console.log(`${logPrefix} NEXT_PUBLIC_API_URL:`, process.env.NEXT_PUBLIC_API_URL);
  console.log(`${logPrefix} SERVER_API_URL:`, process.env.SERVER_API_URL);
}

// Отладка: выводим URL в консоль (только в development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('API URL:', API_URL);
  console.log('NEXT_PUBLIC_API_URL from env:', process.env.NEXT_PUBLIC_API_URL);
}

// Токен по умолчанию (можно переопределить через переменную окружения)
const DEFAULT_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || 'b4951c6c79c2cf4294fb389f4ef4578d92f92875';

// Функция для получения токена из localStorage или использования токена по умолчанию
const getToken = (): string | null => {
  // В Server Components (нет window) всегда используем токен по умолчанию
  if (typeof window === 'undefined') {
    if (!DEFAULT_TOKEN) {
      console.error('[SERVER] ERROR: DEFAULT_TOKEN is not set!');
      return null;
    }
    return DEFAULT_TOKEN;
  }
  
  // В Client Components сначала проверяем localStorage
  let token = localStorage.getItem('auth_token');
  
  // Если токена нет в localStorage, используем токен по умолчанию
  if (!token && DEFAULT_TOKEN) {
    token = DEFAULT_TOKEN;
    // Сохраняем токен по умолчанию в localStorage для следующих запросов
    localStorage.setItem('auth_token', DEFAULT_TOKEN);
  }
  
  // Отладка
  if (process.env.NODE_ENV === 'development') {
    console.log('[CLIENT] Getting token:', token ? token.substring(0, 15) + '...' : 'null');
  }
  
  if (!token) {
    console.error('[CLIENT] ERROR: No token available! DEFAULT_TOKEN:', DEFAULT_TOKEN ? 'exists' : 'missing');
  }
  
  return token;
};

// Функция для сохранения токена
export const setAuthToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

// Создаем экземпляр axios с базовыми настройками
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 секунд таймаут
  validateStatus: (status) => status < 500, // Не выбрасывать ошибку для 4xx
});

// Проверка что API_URL установлен
if (!API_URL) {
  console.error('ERROR: API_URL is not defined! Check your .env.local file.');
}

// Интерцептор для добавления токена к каждому запросу
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      // Важно: Django REST Framework использует формат "Token <token>", а не "Bearer <token>"
      config.headers.Authorization = `Token ${token}`;
      
      // Отладка - работает и на сервере, и в браузере
      if (process.env.NODE_ENV === 'development') {
        const isServer = typeof window === 'undefined';
        const logPrefix = isServer ? '[SERVER]' : '[CLIENT]';
        console.log(`${logPrefix} [API Request]`, config.method?.toUpperCase(), config.url);
        console.log(`${logPrefix} Authorization header: Token ${token.substring(0, 15)}...`);
      }
    } else {
      const isServer = typeof window === 'undefined';
      const logPrefix = isServer ? '[SERVER]' : '[CLIENT]';
      console.error(`${logPrefix} [API Error] No token available for request:`, config.method?.toUpperCase(), config.url);
      console.error(`${logPrefix} DEFAULT_TOKEN:`, DEFAULT_TOKEN ? 'exists' : 'missing');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Инициализация токена при загрузке (если его нет в localStorage)
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('auth_token');
  if (!storedToken && DEFAULT_TOKEN) {
    localStorage.setItem('auth_token', DEFAULT_TOKEN);
  }
}

// Обработчик ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isServer = typeof window === 'undefined';
    const logPrefix = isServer ? '[SERVER]' : '[CLIENT]';
    
    if (error.response?.status === 401) {
      // Детальная информация об ошибке 401
      console.error(`${logPrefix} [401 Unauthorized] Request:`, error.config?.method?.toUpperCase(), error.config?.url);
      console.error(`${logPrefix} Response:`, error.response?.data);
      console.error(`${logPrefix} Headers sent:`, error.config?.headers);
      
      // Не удаляем токен автоматически - возможно проблема в формате или токене
      // setAuthToken(null);
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error(`${logPrefix} API Error: Сервер недоступен. Проверьте, что Django API запущен на`, API_URL);
    } else if (error.message === 'socket hang up' || error.code === 'ECONNRESET') {
      console.error(`${logPrefix} API Error: Соединение разорвано. Возможно, сервер перезагружается или недоступен.`);
    } else if (error.response) {
      // Другие ошибки от сервера
      console.error(`${logPrefix} API Error ${error.response.status}:`, error.response.data);
    } else {
      console.error(`${logPrefix} API Error:`, error.message || error);
    }
    return Promise.reject(error);
  }
);

// Функции для аутентификации
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login/', {
      username,
      password,
    });
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    return response.data;
  },
  
  logout: async () => {
    try {
      await apiClient.post('/auth/logout/');
    } finally {
      setAuthToken(null);
    }
  },
};