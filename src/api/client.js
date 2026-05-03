import Constants from 'expo-constants';

// Dynamically get the host IP (works for both physical devices and emulators)
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || '';
const localhost = debuggerHost ? debuggerHost.split(':')[0] : '192.168.0.185';
export const BASE_URL = `http://${localhost}:5000/api`;


export const apiClient = {
  getExpenses: async () => {
    const res = await fetch(`${BASE_URL}/expenses`);
    return await res.json();
  },
  addExpense: async (expenseData) => {
    const res = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData),
    });
    return await res.json();
  },
  deleteExpense: async (id) => {
    const res = await fetch(`${BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  },
  updateExpense: async (id, expenseData) => {
    const res = await fetch(`${BASE_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData),
    });
    return await res.json();
  },
  getCategories: async () => {
    const res = await fetch(`${BASE_URL}/categories`);
    return await res.json();
  },
  addCategory: async (categoryData) => {
    const res = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });
    return await res.json();
  },
  getSalary: async () => {
    const res = await fetch(`${BASE_URL}/settings/monthly_salary`);
    const data = await res.json();
    return data ? parseFloat(data.value) : 0;
  },
  updateSalary: async (amount) => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'monthly_salary', value: amount.toString() }),
    });
    return await res.json();
  },
  processVoice: async (audioBase64) => {
    const res = await fetch(`${BASE_URL}/ai/process-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64 }),
    });
    return await res.json();
  },
  processReceipt: async (imageBase64) => {
    const res = await fetch(`${BASE_URL}/ai/process-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });
    return await res.json();
  },
  getMonthlyStats: async () => {
    const res = await fetch(`${BASE_URL}/stats/monthly`);
    return await res.json();
  },
  getCategoryStats: async () => {
    const res = await fetch(`${BASE_URL}/stats/category`);
    return await res.json();
  },
  getBudgetAlert: async (data) => {
    const res = await fetch(`${BASE_URL}/ai/budget-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },
  getAiInsights: async (month) => {
    const res = await fetch(`${BASE_URL}/ai/insights${month ? `?month=${month}` : ''}`);
    return await res.json();
  },
  getStatsReport: async (month) => {
    const res = await fetch(`${BASE_URL}/stats/report${month ? `?month=${month}` : ''}`);
    return await res.json();
  },
  getIncomes: async () => {
    const res = await fetch(`${BASE_URL}/incomes`);
    return await res.json();
  },
  addIncome: async (incomeData) => {
    const res = await fetch(`${BASE_URL}/incomes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incomeData),
    });
    return await res.json();
  },
  deleteIncome: async (id) => {
    const res = await fetch(`${BASE_URL}/incomes/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  },
  updateIncome: async (id, incomeData) => {
    const res = await fetch(`${BASE_URL}/incomes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incomeData),
    });
    return await res.json();
  },
};
