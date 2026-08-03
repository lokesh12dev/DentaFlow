import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 30,
      retry: (count, error) => count < 2 && !(error instanceof Error && error.message.includes('permission')),
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 1
    }
  }
});
