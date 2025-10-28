import * as Crypto from 'expo-crypto';
import { User, Organization, Contact, Call } from '@/types';

const ADMIN_ORG_ID = 'admin-org-001';
const ADMIN_USER_ID = 'admin-user-001';

const adminOrganization: Organization = {
  id: ADMIN_ORG_ID,
  name: 'Admin Organization',
  createdAt: new Date('2024-01-01').toISOString(),
};

const adminUser: User = {
  id: ADMIN_USER_ID,
  orgId: ADMIN_ORG_ID,
  name: 'Admin User',
  email: 'admin@crm.com',
  role: 'owner',
  createdAt: new Date('2024-01-01').toISOString(),
};

let mockUsers: User[] = [adminUser];
let mockOrganizations: Organization[] = [adminOrganization];
let mockContacts: Contact[] = [];
let mockCalls: Call[] = [];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  async login(email: string, password: string): Promise<{ user: User; organization: Organization; token: string }> {
    await delay(500);
    
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.email === 'admin@crm.com' && password !== 'admin123') {
      throw new Error('Invalid email or password');
    }

    const organization = mockOrganizations.find(o => o.id === user.orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const token = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${email}-${Date.now()}`
    );

    return { user, organization, token };
  },



  async getContacts(orgId: string): Promise<Contact[]> {
    await delay(300);
    return mockContacts.filter(c => c.orgId === orgId);
  },

  async addContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    await delay(300);

    const existing = mockContacts.find(
      c => c.orgId === contact.orgId && c.phoneNumber === contact.phoneNumber
    );

    if (existing) {
      throw new Error('Phone number already exists');
    }

    const newContact: Contact = {
      ...contact,
      id: await Crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockContacts.push(newContact);
    return newContact;
  },

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    await delay(300);

    const index = mockContacts.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Contact not found');
    }

    if (updates.phoneNumber) {
      const existing = mockContacts.find(
        c => c.id !== id && c.orgId === mockContacts[index].orgId && c.phoneNumber === updates.phoneNumber
      );
      if (existing) {
        throw new Error('Phone number already exists');
      }
    }

    mockContacts[index] = {
      ...mockContacts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return mockContacts[index];
  },

  async deleteContact(id: string): Promise<void> {
    await delay(300);
    mockContacts = mockContacts.filter(c => c.id !== id);
  },

  async getCalls(orgId: string): Promise<Call[]> {
    await delay(300);
    return mockCalls.filter(c => c.orgId === orgId).sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  },

  async addCall(call: Omit<Call, 'id'>): Promise<Call> {
    await delay(300);

    const newCall: Call = {
      ...call,
      id: await Crypto.randomUUID(),
    };

    mockCalls.push(newCall);
    return newCall;
  },

  async getTeamMembers(orgId: string): Promise<User[]> {
    await delay(300);
    return mockUsers.filter(u => u.orgId === orgId);
  },

  async addTeamMember(
    orgId: string,
    name: string,
    email: string,
    role: 'owner' | 'user',
    password: string
  ): Promise<User> {
    await delay(300);

    if (mockUsers.find(u => u.email === email)) {
      throw new Error('Email already exists');
    }

    const newUser: User = {
      id: await Crypto.randomUUID(),
      orgId,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);
    return newUser;
  },

  async removeTeamMember(userId: string): Promise<void> {
    await delay(300);
    mockUsers = mockUsers.filter(u => u.id !== userId);
  },

  getAdminCredentials() {
    return {
      email: 'admin@crm.com',
      password: 'admin123',
    };
  },

  seedInitialData(orgId: string, userId: string) {
    const sampleContacts: Contact[] = [
      {
        id: '1',
        orgId,
        name: 'John Smith',
        phoneNumber: '+1234567890',
        createdByUserId: userId,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        orgId,
        name: 'Sarah Johnson',
        phoneNumber: '+1234567891',
        createdByUserId: userId,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        orgId,
        name: 'Michael Brown',
        phoneNumber: '+1234567892',
        createdByUserId: userId,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const sampleCalls: Call[] = [
      {
        id: '1',
        orgId,
        contactId: '1',
        contactName: 'John Smith',
        userId,
        phoneNumber: '+1234567890',
        direction: 'incoming',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        duration: 180,
      },
      {
        id: '2',
        orgId,
        contactId: '2',
        contactName: 'Sarah Johnson',
        userId,
        phoneNumber: '+1234567891',
        direction: 'outgoing',
        startTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        duration: 420,
      },
      {
        id: '3',
        orgId,
        userId,
        phoneNumber: '+1234567899',
        direction: 'incoming',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
      },
    ];

    mockContacts.push(...sampleContacts);
    mockCalls.push(...sampleCalls);
  },
};
