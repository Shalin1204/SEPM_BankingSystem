export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getToken(): string | null {
  return localStorage.getItem('fraudshield_token');
}

export function setToken(token: string): void {
  localStorage.setItem('fraudshield_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('fraudshield_token');
  localStorage.removeItem('fraudshield_user');
}

export function getStoredUser(): any | null {
  const str = localStorage.getItem('fraudshield_user');
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function setStoredUser(user: any): void {
  localStorage.setItem('fraudshield_user', JSON.stringify(user));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      'Unable to connect to FraudShield backend server. Please ensure the server is running on port 3000.',
      0
    );
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data && typeof data === 'object' && data.error ? data.error : response.statusText || 'Request failed';
    if (response.status === 401) {
      removeToken();
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      const res = await request<{ success: boolean; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.token) {
        setToken(res.token);
        setStoredUser(res.user);
      }
      return res;
    },
    logout: async () => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        removeToken();
      }
    },
    me: () => request<any>('/auth/me'),
    getUsers: () => request<any[]>('/auth/users'),
  },

  // Stats / Dashboard
  stats: {
    getStats: () => request<any>('/stats'),
  },

  // Transactions
  transactions: {
    list: (params: Record<string, string | number> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, String(v));
        }
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request<{ total: number; data: any[] }>(`/transactions${qs}`);
    },
    get: (id: string) => request<any>(`/transactions/${id}`),
    create: (data: { account_id: number; transaction_type: string; amount: number; merchant_name?: string; description?: string; location?: string }) =>
      request<{ success: boolean; transaction: any }>('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    flag: (id: string) => request<{ success: boolean; message: string; investigationId?: string }>(`/transactions/${id}/flag`, {
      method: 'POST',
    }),
  },

  // Fraud
  fraud: {
    getOverview: () => request<any>('/fraud/overview'),
    getLogs: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, v);
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request<{ summary: any; logs: any[] }>(`/fraud/logs${qs}`);
    },
    updateLogStatus: (txId: string | number, fraudId: string | number, status: string, investigator?: string) =>
      request<{ success: boolean; message: string }>(`/fraud/logs/${txId}/${fraudId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, investigator }),
      }),
  },

  // Investigations
  investigations: {
    list: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, v);
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request<{ counts: any; data: any[] }>(`/investigations${qs}`);
    },
    get: (id: string) => request<any>(`/investigations/${id}`),
    create: (data: { transactionId: string; priority?: string; assignedInvestigator?: string; note?: string; evidence?: string }) =>
      request<{ success: boolean; investigationId: string; id: number }>('/investigations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { status?: string; priority?: string; assignedInvestigator?: string }) =>
      request<{ success: boolean; investigation: any }>(`/investigations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    addNote: (id: string, note: string, author?: string) =>
      request<{ success: boolean; noteId: number; note: string }>(`/investigations/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note, author }),
      }),
    executeAction: (id: string, action: 'confirm_fraud' | 'mark_false_positive' | 'close', author?: string) =>
      request<{ success: boolean; message: string }>(`/investigations/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, author }),
      }),
  },

  // Customers
  customers: {
    list: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, v);
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request<any[]>(`/customers${qs}`);
    },
    get: (id: string) => request<any>(`/customers/${id}`),
    create: (data: { name: string; email: string; phone?: string; street?: string; city?: string; state?: string }) =>
      request<{ success: boolean; customerId: string; id: number }>('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; message: string }>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Accounts
  accounts: {
    list: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, v);
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request<{ summary: any; accounts: any[] }>(`/accounts${qs}`);
    },
    get: (id: string) => request<any>(`/accounts/${id}`),
    create: (data: { customer_id: string | number; account_number: string; balance?: number; account_type?: string }) =>
      request<{ success: boolean; accountId: string; id: number }>('/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    freeze: (id: string) =>
      request<{ success: boolean; status: string; message: string }>(`/accounts/${id}/freeze`, {
        method: 'POST',
      }),
  },

  // Blocked Merchants
  merchants: {
    list: () => request<any[]>('/merchants'),
    create: (data: { merchant_name: string; reason?: string }) =>
      request<{ success: boolean; id: number; merchantName: string }>('/merchants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number | string) =>
      request<{ success: boolean; message: string }>(`/merchants/${id}`, {
        method: 'DELETE',
      }),
  },

  // Reports
  reports: {
    get: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, v);
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request<{ summary: any; charts: any }>(`/reports${qs}`);
    },
  },
};
