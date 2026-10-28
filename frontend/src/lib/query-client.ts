import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // Data remains fresh for 2 minutes
      gcTime: 1000 * 60 * 10, // Inactive queries cached for 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
