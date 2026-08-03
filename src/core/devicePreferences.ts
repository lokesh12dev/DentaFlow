import { secureStorage } from './secureStorage';

export interface DevicePreferences {
  biometric: boolean;
  hideInSwitcher: boolean;
  offlineCache: boolean;
  operationalNotifications: boolean;
  quietHours: boolean;
}
const defaults: DevicePreferences = { biometric: true, hideInSwitcher: true, offlineCache: true, operationalNotifications: true, quietHours: true };
export async function loadDevicePreferences(): Promise<DevicePreferences> {
  const raw = await secureStorage.get('device-preferences');
  if (!raw) return defaults;
  try { return { ...defaults, ...JSON.parse(raw) }; } catch { return defaults; }
}
export async function saveDevicePreferences(value: DevicePreferences): Promise<void> { await secureStorage.set('device-preferences', JSON.stringify(value)); }
