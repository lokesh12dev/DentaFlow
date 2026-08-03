import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppIcon, AppText, Badge, PageHeader, Screen, SectionHeader, Surface } from '@/ui/components';
import { Cloud, Database, Mail, MessageCircle, Phone, ShieldCheck, Sparkles } from '@/ui/icons';
import { spacing } from '@/ui/tokens';
import { useSessionStore } from '@/store/sessionStore';

const groups=[
 {title:'App environment',icon:Database,items:['EXPO_PUBLIC_SUPABASE_URL','EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY','EXPO_PUBLIC_ENABLE_DEMO_MODE=false']},
 {title:'OpenRouter Edge Function',icon:Sparkles,items:['OPENROUTER_API_KEY','OPENROUTER_MODEL (optional)','OPENROUTER_SITE_URL (optional)']},
 {title:'WhatsApp Business',icon:MessageCircle,items:['WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_ACCESS_TOKEN','META_APP_SECRET','WHATSAPP_VERIFY_TOKEN']},
 {title:'Email',icon:Mail,items:['RESEND_API_KEY','EMAIL_FROM']},
 {title:'Telephony',icon:Phone,items:['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_FROM_NUMBER','TWILIO_WEBHOOK_PUBLIC_URL']},
 {title:'Push notifications',icon:Cloud,items:['EXPO_ACCESS_TOKEN']}
];
export default function CredentialChecklist(){const configurationError=useSessionStore(s=>s.configurationError);return <Screen><PageHeader title="Credential checklist" subtitle="The only deployment values you need to supply" onBack={()=>router.back()}/><View style={{paddingHorizontal:spacing[4],gap:spacing[4]}}>{configurationError?<Surface tone="danger"><AppText variant="bodyStrong">Production startup is blocked</AppText><AppText tone="secondary">{configurationError}</AppText></Surface>:null}<Surface tone="clinical" style={{gap:spacing[2]}}><View style={{flexDirection:'row',gap:spacing[3]}}><AppIcon icon={ShieldCheck} tone="clinical"/><View style={{flex:1}}><AppText variant="bodyStrong">Keep private keys on the server</AppText><AppText tone="secondary">Only the Supabase URL and publishable key belong in the mobile app. All service secrets belong in Supabase Edge Function secrets.</AppText></View></View></Surface>{groups.map(group=><Surface key={group.title} style={{gap:spacing[3]}}><SectionHeader title={group.title} icon={group.icon}/>{group.items.map(item=><View key={item} style={{flexDirection:'row',alignItems:'center',gap:spacing[2]}}><Badge label="ENV" tone="neutral"/><AppText variant="bodyStrong" style={{flex:1}}>{item}</AppText></View>)}</Surface>)}</View></Screen>}
