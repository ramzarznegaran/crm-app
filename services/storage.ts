import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Organization } from '@/types';

const KEYS = {
  USER: '@crm_user',
  ORGANIZATION: '@crm_organization',
  TOKEN: '@crm_token',
} as const;

export const storage = {
  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const data = await AsyncStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async saveOrganization(org: Organization): Promise<void> {
    await AsyncStorage.setItem(KEYS.ORGANIZATION, JSON.stringify(org));
  },

  async getOrganization(): Promise<Organization | null> {
    const data = await AsyncStorage.getItem(KEYS.ORGANIZATION);
    return data ? JSON.parse(data) : null;
  },

  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.TOKEN);
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.USER, KEYS.ORGANIZATION, KEYS.TOKEN]);
  },
};
