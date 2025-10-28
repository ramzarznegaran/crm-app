import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        const token = await AsyncStorage.getItem('auth_token');
        return {
          authorization: token ? `Bearer ${token}` : '',
          'content-type': 'application/json',
        };
      },
      fetch: async (url, options) => {
        console.log('tRPC Request:', url, options?.method);
        try {
          const response = await fetch(url, options);
          console.log('tRPC Response status:', response.status);
          
          const contentType = response.headers.get('content-type');
          console.log('Content-Type:', contentType);
          
          if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error(`Expected JSON but got: ${contentType}`);
          }
          
          return response;
        } catch (error) {
          console.error('tRPC fetch error:', error);
          throw error;
        }
      },
    }),
  ],
});
