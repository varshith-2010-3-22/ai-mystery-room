import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 90_000, headers: { 'Content-Type': 'application/json' } });
export const errorMessage = error => error.response?.data?.error?.message || 'The room could not be reached. Check your connection and try again.';
