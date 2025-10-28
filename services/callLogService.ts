import { Platform, PermissionsAndroid } from 'react-native';
import { trpcClient } from '@/lib/trpc';

export interface CallLogEntry {
  phoneNumber: string;
  direction: 'incoming' | 'outgoing';
  startTime: number;
  duration: number;
}

async function requestCallLogPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    console.log('Call log sync is only available on Android');
    return false;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      {
        title: 'Call Log Permission',
        message: 'This app needs access to your call log to sync call history',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('Error requesting call log permission:', err);
    return false;
  }
}

export async function syncCallLogs(orgId: string): Promise<{ success: boolean; synced: number; error?: string }> {
  if (Platform.OS !== 'android') {
    return { success: false, synced: 0, error: 'Call log sync is only available on Android' };
  }

  const hasPermission = await requestCallLogPermission();
  if (!hasPermission) {
    return { success: false, synced: 0, error: 'Permission denied' };
  }

  try {
    const CallLog = require('react-native').NativeModules.CallLog;
    
    if (!CallLog) {
      console.log('CallLog module not available - this is expected in Expo Go');
      console.log('Call log syncing will work in a standalone build');
      return { success: false, synced: 0, error: 'CallLog module not available in Expo Go' };
    }

    const lastSyncTime = await getLastSyncTime();
    const calls = await CallLog.getCallLog(lastSyncTime);

    const callLogs: CallLogEntry[] = calls.map((call: any) => ({
      phoneNumber: call.phoneNumber,
      direction: call.type === 'INCOMING' ? 'incoming' : 'outgoing',
      startTime: Math.floor(call.timestamp / 1000),
      duration: call.duration,
    }));

    if (callLogs.length === 0) {
      return { success: true, synced: 0 };
    }

    const result = await trpcClient.calls.sync.mutate({
      orgId,
      calls: callLogs,
    });

    await saveLastSyncTime(Date.now());

    return { success: true, synced: result.synced };
  } catch (error) {
    console.error('Error syncing call logs:', error);
    return { 
      success: false, 
      synced: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function getLastSyncTime(): Promise<number> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const lastSync = await AsyncStorage.getItem('last_call_sync');
    return lastSync ? parseInt(lastSync, 10) : 0;
  } catch {
    return 0;
  }
}

async function saveLastSyncTime(timestamp: number): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('last_call_sync', timestamp.toString());
  } catch (error) {
    console.error('Error saving last sync time:', error);
  }
}

export const callLogService = {
  syncCallLogs,
  requestCallLogPermission,
};
