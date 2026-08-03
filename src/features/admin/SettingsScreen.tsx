import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useClinic, useUpdateClinic } from '@/hooks/useClinicQueries';
import { useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import { loadDevicePreferences, saveDevicePreferences, type DevicePreferences } from '@/core/devicePreferences';
import { readableError } from '@/core/errors';
import { AppText, Badge, Button, Field, LoadingState, PageHeader, Screen, SectionHeader, SegmentedControl, Surface } from '@/ui/components';
import { Bell, Building2, Clock3, LockKeyhole, LogOut, Moon, ShieldCheck, Smartphone, WifiOff } from '@/ui/icons';
import { spacing } from '@/ui/tokens';
import { useTheme } from '@/ui/ThemeProvider';
import type { Clinic } from '@/domain/types';

export function SettingsScreen() {
  const clinic=useClinic();
  if(clinic.isLoading)return <Screen><LoadingState label="Loading clinic settings…"/></Screen>;
  if(!clinic.data)return <Screen><LoadingState label="Loading clinic settings…"/></Screen>;
  const clinicKey=JSON.stringify(clinic.data);
  return <SettingsForm key={clinicKey} clinic={clinic.data}/>;
}

function SettingsForm({clinic}:{clinic:Clinic}) {
  const update=useUpdateClinic(); const signOut=useSessionStore(s=>s.signOut); const demo=useSessionStore(s=>s.demoMode); const toast=useUIStore(s=>s.showToast);
  const [name,setName]=useState(clinic.name); const [legalName,setLegalName]=useState(clinic.legalName??''); const [phone,setPhone]=useState(clinic.phone); const [email,setEmail]=useState(clinic.email); const [line1,setLine1]=useState(clinic.address?.line1??''); const [city,setCity]=useState(clinic.address?.city??''); const [state,setState]=useState(clinic.address?.state??''); const [postalCode,setPostalCode]=useState(clinic.address?.postalCode??''); const [opening,setOpening]=useState(clinic.openingTime); const [closing,setClosing]=useState(clinic.closingTime);
  const [prefs,setPrefs]=useState<DevicePreferences>({biometric:true,hideInSwitcher:true,offlineCache:true,operationalNotifications:true,quietHours:true});
  useEffect(()=>{void loadDevicePreferences().then(setPrefs)},[]);
  const toggle=async(key:keyof DevicePreferences)=>{const next={...prefs,[key]:!prefs[key]};setPrefs(next);await saveDevicePreferences(next);toast('Device preference saved.','success')};
  const save=async()=>{if(!name.trim()||!phone.trim()||!email.trim())return toast('Clinic name, phone and email are required.','warning');try{await update.mutateAsync({name:name.trim(),legalName:legalName.trim()||undefined,phone:phone.trim(),email:email.trim(),timezone:clinic.timezone,currency:clinic.currency,locale:clinic.locale,openingTime:opening,closingTime:closing,address:{line1:line1.trim(),city:city.trim(),state:state.trim(),postalCode:postalCode.trim(),country:clinic.address?.country??'India'}});toast('Clinic profile updated.','success')}catch(e){toast(readableError(e),'danger')}};
  return <Screen><PageHeader title="Settings" subtitle="Clinic identity, privacy, devices and session controls" onBack={()=>router.back()}/><View style={{paddingHorizontal:spacing[4],gap:spacing[4]}}>
    <Surface style={{gap:spacing[3]}}><SectionHeader title="Clinic profile" subtitle="Changes are tenant-scoped and audited" icon={Building2}/><Field label="Clinic name" value={name} onChangeText={setName}/><Field label="Legal name" value={legalName} onChangeText={setLegalName}/><Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/><Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/><Field label="Address" value={line1} onChangeText={setLine1}/><Field label="City" value={city} onChangeText={setCity}/><Field label="State" value={state} onChangeText={setState}/><Field label="Postal code" value={postalCode} onChangeText={setPostalCode}/><View style={{flexDirection:'row',gap:spacing[3]}}><View style={{flex:1}}><Field label="Opens" value={opening} onChangeText={setOpening}/></View><View style={{flex:1}}><Field label="Closes" value={closing} onChangeText={setClosing}/></View></View><View style={{flexDirection:'row',flexWrap:'wrap',gap:spacing[2]}}><Badge label={clinic.timezone??'Asia/Kolkata'} tone="neutral"/><Badge label={clinic.currency??'INR'} tone="neutral"/><Badge label={demo?'Demo mode':'Production mode'} tone={demo?'warning':'success'}/></View><Button label="Save clinic profile" tone="secondary" onPress={save} loading={update.isPending} full/></Surface>
    <AppearanceSettings/>
    <Surface style={{gap:spacing[2]}}><SectionHeader title="Security and privacy" subtitle="Encrypted per-device controls" icon={ShieldCheck}/><Toggle icon={LockKeyhole} label="Biometric re-entry" detail="Require device authentication after idle lock" value={prefs.biometric} onPress={()=>toggle('biometric')}/><Toggle icon={Smartphone} label="Hide sensitive data in app switcher" detail="Obscure patient information when the app loses focus" value={prefs.hideInSwitcher} onPress={()=>toggle('hideInSwitcher')}/><Toggle icon={WifiOff} label="Encrypted offline workspace" detail="Cache assigned clinic data in SQLCipher for interrupted connectivity" value={prefs.offlineCache} onPress={()=>toggle('offlineCache')}/></Surface>
    <Surface style={{gap:spacing[2]}}><SectionHeader title="Notifications" icon={Bell}/><Toggle icon={Bell} label="Operational alerts" detail="Appointment delays, urgent tasks, failed messages and lab dependencies" value={prefs.operationalNotifications} onPress={()=>toggle('operationalNotifications')}/><Toggle icon={Clock3} label="Respect quiet hours" detail="Queue non-critical patient messages outside clinic hours" value={prefs.quietHours} onPress={()=>toggle('quietHours')}/></Surface>
    <Surface tone="warning" style={{gap:spacing[2]}}><AppText variant="bodyStrong">Protected health information</AppText><AppText tone="secondary">Credential-free demo data is synthetic. Production deployment requires migrations, private storage, RLS, backups, provider agreements and jurisdiction-specific legal review.</AppText></Surface>
    <Button label="Sign out" icon={LogOut} tone="danger" onPress={async()=>{await signOut();router.replace('/(auth)/sign-in')}} full/>
  </View></Screen>;
}
const appearanceOptions = [{value:'light',label:'Light'},{value:'dark',label:'Dark'},{value:'system',label:'System'}] as const;
function AppearanceSettings(){const theme=useTheme();return <Surface style={{gap:spacing[3]}}><SectionHeader title="Appearance" subtitle="Light is the clinical default" icon={Moon}/><SegmentedControl options={appearanceOptions} value={theme.mode} onChange={theme.setMode}/></Surface>}
function Toggle({icon:Icon,label,detail,value,onPress}:{icon:typeof Bell;label:string;detail:string;value:boolean;onPress:()=>void}){const theme=useTheme();return <Pressable accessibilityRole="switch" accessibilityState={{checked:value}} accessibilityLabel={label} onPress={onPress} style={{minHeight:64,flexDirection:'row',alignItems:'center',gap:spacing[3]}}><View style={{width:40,height:40,borderRadius:13,backgroundColor:theme.colors.surfaceTertiary,alignItems:'center',justifyContent:'center'}}><Icon size={18} color={theme.colors.textSecondary}/></View><View style={{flex:1}}><AppText variant="bodyStrong">{label}</AppText><AppText variant="caption" tone="secondary">{detail}</AppText></View><View style={{width:48,height:28,borderRadius:14,backgroundColor:value?theme.colors.clinical:theme.colors.surfaceTertiary,padding:3,alignItems:value?'flex-end':'flex-start'}}><View style={{width:22,height:22,borderRadius:11,backgroundColor:theme.colors.surface}}/></View></Pressable>}
