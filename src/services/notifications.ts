import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/core/supabase';
import { printPalette } from '../../design-system/print';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function registerForPushNotifications(clinicId: string): Promise<string | null> {
  if (!Device.isDevice) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('clinic-alerts', {
      name: 'Clinic alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 80, 180],
      // Same navy as the printed-document masthead. Android channel settings are
      // immutable after first creation — do not change this on an already-shipped build.
      lightColor: printPalette.brand
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  if (supabase) {
    const user = (await supabase.auth.getUser()).data.user;
    if (user) {
      await supabase.from('device_tokens').upsert({ clinic_id: clinicId, user_id: user.id, token, platform: Platform.OS, active: true }, { onConflict: 'token' });
    }
  }
  return token;
}
