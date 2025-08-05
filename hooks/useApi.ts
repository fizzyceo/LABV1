import { useState, useEffect } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export function useApi<T>(url: string, options?: RequestInit): ApiState<T> & {
  refetch: () => void;
} {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await fetch(url, options);
      const result: ApiResponse<T> = await response.json();
      
      if (result.success) {
        setState({ data: result.data, loading: false, error: null });
      } else {
        setState({ data: null, loading: false, error: result.error || 'An error occurred' });
      }
    } catch (error) {
      setState({ data: null, loading: false, error: 'Network error' });
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return {
    ...state,
    refetch: fetchData,
  };
}

export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      data: null as T,
      error: 'Network error occurred',
    };
  }
}