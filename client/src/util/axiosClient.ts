import axios from 'axios';
import { store } from "../store.ts";

// Create a new axios instance with our base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_SUPABASE_URL,
});

apiClient.defaults.headers.Authorization = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;

// Set up the request interceptor
apiClient.interceptors.request.use(
  (config) => {

    const userToken = store.getState().auth?.token;


    const tokenToSend = userToken ? userToken : import.meta.env.VITE_SUPABASE_ANON_KEY;


    config.headers.Authorization = `Bearer ${tokenToSend}`;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;