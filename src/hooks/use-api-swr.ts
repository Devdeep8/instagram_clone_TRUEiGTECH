import useSWR, { SWRConfiguration } from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object.
    const info = await res.json();
    error.message = info.error || error.message;
    throw error;
  }
  
  return res.json();
};

export function useApiSWR<T = any>(url: string | null, config?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, config);
}

export function useAuthSWR<T = any>(url: string | null, config?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, {
    ...config,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
}