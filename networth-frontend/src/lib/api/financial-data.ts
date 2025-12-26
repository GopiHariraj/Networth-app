import { apiClient } from './client';

// Bank Accounts API
export const bankAccountsApi = {
    getAll: () => apiClient.get('/bank-accounts'),
    create: (data: any) => apiClient.post('/bank-accounts', data),
    update: (id: string, data: any) => apiClient.put(`/bank-accounts/${id}`, data),
    delete: (id: string) => apiClient.delete(`/bank-accounts/${id}`),
};

// Gold Assets API
export const goldAssetsApi = {
    getAll: () => apiClient.get('/gold-assets'),
    create: (data: any) => apiClient.post('/gold-assets', data),
    update: (id: string, data: any) => apiClient.put(`/gold-assets/${id}`, data),
    delete: (id: string) => apiClient.delete(`/gold-assets/${id}`),
};

// Stock Assets API
export const stockAssetsApi = {
    getAll: () => apiClient.get('/stock-assets'),
    create: (data: any) => apiClient.post('/stock-assets', data),
    update: (id: string, data: any) => apiClient.put(`/stock-assets/${id}`, data),
    delete: (id: string) => apiClient.delete(`/stock-assets/${id}`),
};

// Properties API
export const propertiesApi = {
    getAll: () => apiClient.get('/properties'),
    create: (data: any) => apiClient.post('/properties', data),
    update: (id: string, data: any) => apiClient.put(`/properties/${id}`, data),
    delete: (id: string) => apiClient.delete(`/properties/${id}`),
};

// Bond Assets API
export const bondAssetsApi = {
    getAll: () => apiClient.get('/bond-assets'),
    create: (data: any) => apiClient.post('/bond-assets', data),
    update: (id: string, data: any) => apiClient.put(`/bond-assets/${id}`, data),
    delete: (id: string) => apiClient.delete(`/bond-assets/${id}`),
};

// Mutual Fund Assets API
export const mutualFundAssetsApi = {
    getAll: () => apiClient.get('/mutual-fund-assets'),
    create: (data: any) => apiClient.post('/mutual-fund-assets', data),
    update: (id: string, data: any) => apiClient.put(`/mutual-fund-assets/${id}`, data),
    delete: (id: string) => apiClient.delete(`/mutual-fund-assets/${id}`),
};

// Credit Cards API
export const creditCardsApi = {
    getAll: () => apiClient.get('/credit-cards'),
    create: (data: any) => apiClient.post('/credit-cards', data),
    update: (id: string, data: any) => apiClient.put(`/credit-cards/${id}`, data),
    delete: (id: string) => apiClient.delete(`/credit-cards/${id}`),
};

// Expenses API
export const expensesApi = {
    getAll: () => apiClient.get('/expenses'),
    create: (data: any) => apiClient.post('/expenses', data),
    update: (id: string, data: any) => apiClient.put(`/expenses/${id}`, data),
    delete: (id: string) => apiClient.delete(`/expenses/${id}`),
    parseAi: (text: string) => apiClient.post('/expenses/ai-parse-text', { text }),
};

// Goals API
export const goalsApi = {
    getAll: () => apiClient.get('/goals'),
    create: (data: any) => apiClient.post('/goals', data),
    update: (id: string, data: any) => apiClient.put(`/goals/${id}`, data),
    delete: (id: string) => apiClient.delete(`/goals/${id}`),
};

// Loans API
export const loansApi = {
    getAll: () => apiClient.get('/loans'),
    create: (data: any) => apiClient.post('/loans', data),
    update: (id: string, data: any) => apiClient.put(`/loans/${id}`, data),
    delete: (id: string) => apiClient.delete(`/loans/${id}`),
};

// Export all APIs
export const financialDataApi = {
    bankAccounts: bankAccountsApi,
    goldAssets: goldAssetsApi,
    stockAssets: stockAssetsApi,
    properties: propertiesApi,
    loans: loansApi,
    bondAssets: bondAssetsApi,
    mutualFunds: mutualFundAssetsApi,
    creditCards: creditCardsApi,
    expenses: expensesApi,
    goals: goalsApi,
};
