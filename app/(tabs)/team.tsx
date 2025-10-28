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
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Users, Mail, UserPlus, Crown, User as UserIcon, Trash2, X, LogOut, Lock } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { mockApi } from '@/services/mockApi';
import { User } from '@/types';
import Colors from '@/constants/colors';

export default function TeamScreen() {
  const { user, organization, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['team', organization?.id],
    queryFn: () => mockApi.getTeamMembers(organization!.id),
    enabled: !!organization,
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => mockApi.removeTeamMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });

  const handleRemove = (member: User) => {
    if (user?.role !== 'owner') return;
    if (member.id === user.id) {
      Alert.alert('Error', 'You cannot remove yourself');
      return;
    }

    Alert.alert(
      'Remove Team Member',
      `Are you sure you want to remove ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMutation.mutate(member.id),
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const renderMember = ({ item }: { item: User }) => {
    const isOwner = item.role === 'owner';
    const isCurrentUser = item.id === user?.id;
    const canRemove = user?.role === 'owner' && !isCurrentUser;

    return (
      <View style={styles.memberCard}>
        <View style={[styles.memberAvatar, isOwner && styles.ownerAvatar]}>
          {isOwner ? (
            <Crown size={24} color={Colors.warning} />
          ) : (
            <UserIcon size={24} color={Colors.primary} />
          )}
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{item.name}</Text>
            {isCurrentUser && <Text style={styles.youBadge}>You</Text>}
          </View>
          <Text style={styles.memberEmail}>{item.email}</Text>
          <Text style={styles.memberRole}>
            {isOwner ? 'Owner' : 'User'}
          </Text>
        </View>
        {canRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemove(item)}
          >
            <Trash2 size={18} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Team',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.surface,
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={22} color={Colors.surface} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.orgCard}>
          <View style={styles.orgIcon}>
            <Users size={32} color={Colors.primary} />
          </View>
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>{organization?.name}</Text>
            <Text style={styles.orgMeta}>
              {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={teamMembers}
            renderItem={renderMember}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>Team Members</Text>
            }
          />
        )}

        {user?.role === 'owner' && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setIsAddModalVisible(true)}
          >
            <UserPlus size={28} color={Colors.surface} />
          </TouchableOpacity>
        )}

        <AddMemberModal
          visible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
        />
      </View>
    </>
  );
}

function AddMemberModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'user'>('user');
  const [error, setError] = useState('');

  const addMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: 'owner' | 'user' }) =>
      mockApi.addTeamMember(organization!.id, data.name, data.email, data.role, data.password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
      setError('');
      onClose();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleAdd = () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    addMutation.mutate({ name, email, password, role });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Team Member</Text>
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
            <Mail size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor={Colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Text style={styles.roleLabel}>Role</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'user' && styles.roleButtonActive]}
              onPress={() => setRole('user')}
            >
              <UserIcon
                size={20}
                color={role === 'user' ? Colors.surface : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  role === 'user' && styles.roleButtonTextActive,
                ]}
              >
                User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, role === 'owner' && styles.roleButtonActive]}
              onPress={() => setRole('owner')}
            >
              <Crown
                size={20}
                color={role === 'owner' ? Colors.surface : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  role === 'owner' && styles.roleButtonTextActive,
                ]}
              >
                Owner
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.modalButton, addMutation.isPending && styles.buttonDisabled]}
            onPress={handleAdd}
            disabled={addMutation.isPending}
          >
            {addMutation.isPending ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.modalButtonText}>Add Member</Text>
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
  orgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orgIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  orgMeta: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  memberCard: {
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
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ownerAvatar: {
    backgroundColor: '#FEF3C7',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  youBadge: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  memberEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 12,
    color: Colors.textLight,
  },
  removeButton: {
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
  logoutButton: {
    marginRight: 8,
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
  roleLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  roleButtonTextActive: {
    color: Colors.surface,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
