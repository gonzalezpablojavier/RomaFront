import axios, { AxiosInstance, isAxiosError } from 'axios';
import { getApiUrl } from '../config/env';

/** Cliente HTTP central — base para migrar páginas que hoy duplican API_URL. */
export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
});

export { isAxiosError };

export function getApiBaseUrl(): string {
  return getApiUrl();
}
