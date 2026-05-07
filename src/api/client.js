import Constants from 'expo-constants';

// Dynamically get the host IP (works for both physical devices and emulators)
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || '';
const localhost = debuggerHost ? debuggerHost.split(':')[0] : '10.0.2.2'; // Default to Android emulator host

// 1. UPDATE THIS URL to your actual Vercel deployment URL
const PRODUCTION_URL = 'https://cash-day-ebon.vercel.app/api'; 

// 2. Set this to 'true' if you want to use the Vercel backend while testing in Expo Go
const USE_PRODUCTION_IN_EXPO_GO = true; 

export const BASE_URL = (__DEV__ && !USE_PRODUCTION_IN_EXPO_GO) 
  ? `http://${localhost}:5000/api` 
  : PRODUCTION_URL;

const API_KEY = 'flous_chhar_secret_2026'; // Match with backend

export const apiClient = {
  getExpenses: async () => {
    const res = await fetch(`${BASE_URL}/expenses`, {
      headers: { 'x-api-key': API_KEY }
    });
    return await res.json();
  },
  addExpense: async (expenseData) => {
    const res = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(expenseData),
    });
    return await res.json();
  },
  deleteExpense: async (id) => {
    const res = await fetch(`${BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'x-api-key': API_KEY }
    });
    return await res.json();
  },
  updateExpense: async (id, expenseData) => {
    const res = await fetch(`${BASE_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(expenseData),
    });
    return await res.json();
  },
  getCategories: async () => {
    const res = await fetch(`${BASE_URL}/categories`, {
      headers: { 'x-api-key': API_KEY }
    });
    return await res.json();
  },
  addCategory: async (categoryData) => {
    const res = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(categoryData),
    });
    return await res.json();
  },
  getSalary: async () => {
    const res = await fetch(`${BASE_URL}/settings/monthly_salary`, {
      headers: { 'x-api-key': API_KEY }
    });
    const data = await res.json();
    return data && data.value ? parseFloat(data.value) : 0;
  },
  updateSalary: async (amount) => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({ key: 'monthly_salary', value: amount.toString() }),
    });
    return await res.json();
  },
  getSetting: async (key) => {
    const res = await fetch(`${BASE_URL}/settings/${key}`, {
      headers: { 'x-api-key': API_KEY }
    });
    return await res.json();
  },
  updateSetting: async (key, value) => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({ key, value: value.toString() }),
    });
    return await res.json();
  },
  processVoice: async (audioBase64) => {
    const res = await fetch(`${BASE_URL}/ai/process-voice`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({ audioBase64 }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Server responded with ${res.status}`);
    }
    return await res.json();
  },
  processReceipt: async (imageBase64) => {
    const res = await fetch(`${BASE_URL}/ai/process-receipt`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({ imageBase64 }),
    });
    return await res.json();
  },
  getMonthlyStats: async () => {
    const res = await fetch(`${BASE_URL}/stats/monthly`, {
      headers: { 'x-api-key': API_KEY }
    });
    return await res.json();
  },
  getCategoryStats: async () => {
    const res = await fetch(`${BASE_URL}/stats/category`, {
      headers: { 'x-api-key': API_KEY }
    });
    return await res.json();
  },
  getBudgetAlert: async (data) => {
    const res = await fetch(`${BASE_URL}/ai/budget-alert`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  },
  getAiInsights: async (month) => {
    const res = await fetch(`${BASE_URL}/ai/insights${month ? `?month=${month}` : ''}`, {
      headers: { 'x-api-key': API_KEY }
    });
    return await res.json();
  },
  getStatsReport: async (month) => {
    const res = await fetch(`${BASE_URL}/stats/report${month ? `?month=${month}` : ''}`, {
      headers: { 'x-api-key': API_KEY }
    });
    return await res.json();
  },
  getIncomes: async () => {
    const res = await fetch(`${BASE_URL}/incomes`, {
      headers: { 'x-api-key': API_KEY }
    });
    return await res.json();
  },
  addIncome: async (incomeData) => {
    const res = await fetch(`${BASE_URL}/incomes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(incomeData),
    });
    return await res.json();
  },
  deleteIncome: async (id) => {
    const res = await fetch(`${BASE_URL}/incomes/${id}`, {
      method: 'DELETE',
      headers: { 'x-api-key': API_KEY }
    });
    return await res.json();
  },
  updateIncome: async (id, incomeData) => {
    const res = await fetch(`${BASE_URL}/incomes/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(incomeData),
    });
    return await res.json();
  },
  resetData: async () => {
    const res = await fetch(`${BASE_URL}/debug/reset`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY }
    });
    return await res.json();
  }
};
