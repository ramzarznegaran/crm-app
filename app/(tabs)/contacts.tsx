import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { Search, Plus, Phone, User as UserIcon, Edit2, Trash2, X } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Contact } from '@/types';
import { trpc, trpcClient } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function ContactsScreen() {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const { data: contactsData, isLoading } = trpc.contacts.list.useQuery(
    { orgId: organization?.id || '' },
    { enabled: !!organization }
  );

  const contacts: Contact[] = (contactsData || []).map((c: any) => ({
    id: c.id,
    orgId: c.org_id,
    name: c.name,
    phoneNumber: c.phone_number,
    createdByUserId: c.created_by_user_id,
    createdByUserName: c.created_by_user_name,
    createdAt: new Date(c.created_at * 1000).toISOString(),
    updatedAt: new Date(c.updated_at * 1000).toISOString(),
  }));

  const deleteMutation = useMutation({
    mutationFn: (contactId: string) => trpcClient.contacts.delete.mutate({ id: contactId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['contacts', 'list']] });
      setSelectedContact(null);
    },
  });

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery)
  );

  const handleDelete = (contact: Contact) => {
    if (contact.createdByUserId !== user?.id && user?.role !== 'owner') {
      return;
    }
    deleteMutation.mutate(contact.id);
  };

  const handleEdit = (contact: Contact) => {
    if (contact.createdByUserId !== user?.id && user?.role !== 'owner') {
      return;
    }
    setSelectedContact(contact);
    setIsEditModalVisible(true);
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const canModify = item.createdByUserId === user?.id || user?.role === 'owner';

    return (
      <View style={styles.contactCard}>
        <View style={styles.contactAvatar}>
          <UserIcon size={24} color={Colors.primary} />
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <View style={styles.phoneRow}>
            <Phone size={14} color={Colors.textSecondary} />
            <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
          </View>
          {item.createdByUserName && (
            <Text style={styles.contactMeta}>Added by {item.createdByUserName}</Text>
          )}
        </View>
        {canModify && (
          <View style={styles.contactActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(item)}
            >
              <Edit2 size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Trash2 size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Contacts',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.surface,
        }}
      />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={styles.centerContainer}>
            <UserIcon size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Add your first contact'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Plus size={28} color={Colors.surface} />
        </TouchableOpacity>

        <AddContactModal
          visible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
        />

        <EditContactModal
          visible={isEditModalVisible}
          contact={selectedContact}
          onClose={() => {
            setIsEditModalVisible(false);
            setSelectedContact(null);
          }}
        />
      </View>
    </>
  );
}

function AddContactModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const addMutation = useMutation({
    mutationFn: (data: { name: string; phoneNumber: string }) =>
      trpcClient.contacts.create.mutate({
        orgId: organization!.id,
        name: data.name,
        phoneNumber: data.phoneNumber,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['contacts', 'list']] });
      setName('');
      setPhoneNumber('');
      setError('');
      onClose();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleAdd = () => {
    if (!name || !phoneNumber) {
      setError('Please fill in all fields');
      return;
    }
    addMutation.mutate({ name, phoneNumber });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Contact</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <UserIcon size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={Colors.textLight}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.modalButton, addMutation.isPending && styles.buttonDisabled]}
            onPress={handleAdd}
            disabled={addMutation.isPending}
          >
            {addMutation.isPending ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.modalButtonText}>Add Contact</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function EditContactModal({
  visible,
  contact,
  onClose,
}: {
  visible: boolean;
  contact: Contact | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (contact) {
      setName(contact.name);
      setPhoneNumber(contact.phoneNumber);
    }
  }, [contact]);

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; phoneNumber: string }) =>
      trpcClient.contacts.update.mutate({
        id: contact!.id,
        name: data.name,
        phoneNumber: data.phoneNumber,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['contacts', 'list']] });
      setError('');
      onClose();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleUpdate = () => {
    if (!name || !phoneNumber) {
      setError('Please fill in all fields');
      return;
    }
    updateMutation.mutate({ name, phoneNumber });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Contact</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <UserIcon size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={Colors.textLight}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.modalButton, updateMutation.isPending && styles.buttonDisabled]}
            onPress={handleUpdate}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.modalButtonText}>Update Contact</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.text,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  contactMeta: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: Colors.text,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
