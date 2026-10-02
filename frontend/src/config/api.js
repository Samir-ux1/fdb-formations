const defaultApiUrl = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : 'https://fdb-formations.vercel.app/api';

export const API_URL = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/+$/, '');
