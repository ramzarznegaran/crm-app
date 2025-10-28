import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Phone, PhoneIncoming, PhoneOutgoing, Clock } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { mockApi } from '@/services/mockApi';
import { Call } from '@/types';
import Colors from '@/constants/colors';

type FilterType = 'all' | 'incoming' | 'outgoing';

export default function CallsScreen() {
  const { organization } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ['calls', organization?.id],
    queryFn: () => mockApi.getCalls(organization!.id),
    enabled: !!organization,
  });

  const filteredCalls = calls.filter((call) => {
    if (filter === 'all') return true;
    return call.direction === filter;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderCall = ({ item }: { item: Call }) => {
    const isIncoming = item.direction === 'incoming';

    return (
      <View style={styles.callCard}>
        <View
          style={[
            styles.callIcon,
            isIncoming ? styles.incomingIcon : styles.outgoingIcon,
          ]}
        >
          {isIncoming ? (
            <PhoneIncoming size={20} color={Colors.surface} />
          ) : (
            <PhoneOutgoing size={20} color={Colors.surface} />
          )}
        </View>
        <View style={styles.callInfo}>
          <Text style={styles.callName}>
            {item.contactName || 'Unknown'}
          </Text>
          <Text style={styles.callPhone}>{item.phoneNumber}</Text>
          <View style={styles.callMeta}>
            <Clock size={12} color={Colors.textLight} />
            <Text style={styles.callMetaText}>
              {formatTime(item.startTime)} • {formatDuration(item.duration)}
            </Text>
          </View>
        </View>
        <View style={styles.callBadge}>
          <Text
            style={[
              styles.callBadgeText,
              isIncoming ? styles.incomingText : styles.outgoingText,
            ]}
          >
            {isIncoming ? 'Incoming' : 'Outgoing'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Call Logs',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.surface,
        }}
      />
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Phone
              size={18}
              color={filter === 'all' ? Colors.surface : Colors.textSecondary}
            />
            <Text
              style={[
                styles.filterButtonText,
                filter === 'all' && styles.filterButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'incoming' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('incoming')}
          >
            <PhoneIncoming
              size={18}
              color={filter === 'incoming' ? Colors.surface : Colors.textSecondary}
            />
            <Text
              style={[
                styles.filterButtonText,
                filter === 'incoming' && styles.filterButtonTextActive,
              ]}
            >
              Incoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'outgoing' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('outgoing')}
          >
            <PhoneOutgoing
              size={18}
              color={filter === 'outgoing' ? Colors.surface : Colors.textSecondary}
            />
            <Text
              style={[
                styles.filterButtonText,
                filter === 'outgoing' && styles.filterButtonTextActive,
              ]}
            >
              Outgoing
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredCalls.length === 0 ? (
          <View style={styles.centerContainer}>
            <Phone size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>No call logs yet</Text>
            <Text style={styles.emptySubtext}>
              Call logs will appear here automatically
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCalls}
            renderItem={renderCall}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.surface,
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
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  callCard: {
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
  callIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  incomingIcon: {
    backgroundColor: Colors.success,
  },
  outgoingIcon: {
    backgroundColor: Colors.primary,
  },
  callInfo: {
    flex: 1,
  },
  callName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  callPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  callMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callMetaText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  callBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  callBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  incomingText: {
    color: Colors.success,
  },
  outgoingText: {
    color: Colors.primary,
  },
});
