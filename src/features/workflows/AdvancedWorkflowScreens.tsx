import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { BookingRequest, ClinicRole, Payment, StaffMember } from '@/domain/types';
import { ROLE_LABELS } from '@/domain/constants';
import { money, relativeTime } from '@/core/format';
import { callPhone } from '@/core/linking';
import {
  useBookingRequests, useInventory, usePatientRecord, useRefundPayment, useSetBookingRequestStatus,
  useSignConsent, useStaff, useUpdateStaff, useRecordInventoryMovement
} from '@/hooks/useClinicQueries';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/ui/ThemeProvider';
import { AppText, Badge, Button, Chip, EmptyState, ErrorState, Field, LoadingState, PageHeader, Screen, SectionHeader, SignaturePad, Surface, type SignatureValue } from '@/ui/components';
import { BadgeIndianRupee, CalendarDays, CheckCircle2, ClipboardList, ContactRound, Package, Phone, Receipt, ShieldCheck, Signature, UserRound, UsersRound, XCircle } from '@/ui/icons';
import { spacing } from '@/ui/tokens';

const roles=Object.keys(ROLE_LABELS) as ClinicRole[];
const availability:StaffMember['availability'][]=['available','busy','break','off'];

export function StaffAccessScreen(){
  const {id=''}=useLocalSearchParams<{id:string}>();const staff=useStaff();const member=staff.data?.find(row=>row.id===id);
  if(staff.isLoading)return <Screen><PageHeader title="Staff access" onBack={()=>router.back()}/><LoadingState/></Screen>;
  if(staff.isError||!member)return <Screen><PageHeader title="Staff access" onBack={()=>router.back()}/><ErrorState message="Staff member could not be loaded." onRetry={()=>staff.refetch()}/></Screen>;
  return <StaffAccessForm key={member.id} member={member}/>;
}

function StaffAccessForm({member}:{member:StaffMember}){
  const mutation=useUpdateStaff();const toast=useUIStore(s=>s.showToast);
  const[name,setName]=useState(member.name);const[phone,setPhone]=useState(member.phone??'');const[role,setRole]=useState<ClinicRole>(member.role);const[state,setState]=useState<StaffMember['availability']>(member.availability);const[active,setActive]=useState(member.active);
  const save=async()=>{if(name.trim().length<2)return toast('Enter the staff member’s name.','warning');try{await mutation.mutateAsync({id:member.id,name:name.trim(),phone:phone.trim()||undefined,role,availability:state,active});toast('Staff access updated.','success');router.back()}catch(error){toast(error instanceof Error?error.message:'Unable to update staff access.','danger')}};
  return <Screen><PageHeader title="Staff access" subtitle={`${member.email??'Invited user'} · least-privilege controls`} onBack={()=>router.back()}/><View style={{paddingHorizontal:spacing[4],gap:spacing[4]}}>
    <Surface style={{gap:spacing[3]}}><SectionHeader title="Identity" icon={UserRound}/><Field label="Display name" value={name} onChangeText={setName}/><Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/></Surface>
    <Surface style={{gap:spacing[3]}}><SectionHeader title="Role" subtitle="Database RLS enforces the selected boundary" icon={ShieldCheck}/><View style={{flexDirection:'row',flexWrap:'wrap',gap:spacing[2]}}>{roles.map(value=><Chip key={value} label={ROLE_LABELS[value]} selected={role===value} onPress={()=>setRole(value)}/>)}</View></Surface>
    <Surface style={{gap:spacing[3]}}><SectionHeader title="Operational presence" icon={UsersRound}/><View style={{flexDirection:'row',flexWrap:'wrap',gap:spacing[2]}}>{availability.map(value=><Chip key={value} label={value} selected={state===value} onPress={()=>setState(value)}/>)}</View><Chip label={active?'Account active':'Account disabled'} selected={active} onPress={()=>setActive(!active)}/></Surface>
    <Surface tone="warning"><AppText variant="bodyStrong">Disabling access signs the member out on their next token refresh.</AppText><AppText tone="secondary">Historical records keep the original author and actor identity.</AppText></Surface><Button label="Save staff access" icon={ShieldCheck} onPress={save} loading={mutation.isPending} full/>
  </View></Screen>;
}

export function ConsentSignScreen(){
  const {id='',patientId=''}=useLocalSearchParams<{id:string;patientId:string}>();const record=usePatientRecord(patientId);const mutation=useSignConsent();const toast=useUIStore(s=>s.showToast);const consent=record.data?.consents.find(row=>row.id===id);
  const[signedByName,setSignedByName]=useState('');const[guardianName,setGuardianName]=useState('');const[witnessName,setWitnessName]=useState('');const[attested,setAttested]=useState(false);const[signature,setSignature]=useState<SignatureValue>({strokes:[],width:320,height:180,attestation:''});
  const attestation=`I confirm that the treatment, material risks, alternatives and opportunity to ask questions were explained for ${consent?.templateName??'this procedure'}.`;
  const onSignature=useCallback((value:SignatureValue)=>setSignature(value),[]);
  if(record.isLoading)return <Screen><PageHeader title="Sign consent" onBack={()=>router.back()}/><LoadingState/></Screen>;
  if(record.isError||!consent)return <Screen><PageHeader title="Sign consent" onBack={()=>router.back()}/><ErrorState message="Consent record was not found." onRetry={()=>record.refetch()}/></Screen>;
  const submit=async()=>{if(!signedByName.trim()||!attested||!signature.strokes.length)return toast('Signer name, attestation and signature are required.','warning');try{await mutation.mutateAsync({consentId:consent.id,signedByName:signedByName.trim(),guardianName:guardianName.trim()||undefined,witnessName:witnessName.trim()||undefined,attestation,signatureData:{...signature,attestation}});toast('Consent signed and appointment readiness updated.','success');router.back()}catch(error){toast(error instanceof Error?error.message:'Unable to sign consent.','danger')}};
  return <Screen><PageHeader title="Procedure consent" subtitle={`${record.data?.patient.displayName} · ${consent.templateName}`} onBack={()=>router.back()}/><View style={{paddingHorizontal:spacing[4],gap:spacing[4]}}>
    <Surface tone="clinical" style={{gap:spacing[2]}}><AppText variant="title3">{consent.templateName}</AppText><AppText tone="secondary">Version {consent.version} · {consent.language} · status {consent.status}</AppText><AppText>{attestation}</AppText></Surface>
    <Surface style={{gap:spacing[3]}}><SectionHeader title="Signer" icon={ContactRound}/><Field label="Patient or authorised signer" value={signedByName} onChangeText={setSignedByName}/><Field label="Guardian name" value={guardianName} onChangeText={setGuardianName} helper="Required when the signer is a guardian"/><Field label="Witness name" value={witnessName} onChangeText={setWitnessName}/></Surface>
    <Surface style={{gap:spacing[3]}}><SectionHeader title="Signature" subtitle="Captured with timestamp, request metadata and immutable version" icon={Signature}/><SignaturePad value={signature} onChange={onSignature} attestation={attestation}/><Chip label={attested?'I agree to the attestation':'Review and accept attestation'} selected={attested} onPress={()=>setAttested(!attested)}/></Surface>
    <Button label="Complete signed consent" icon={CheckCircle2} onPress={submit} loading={mutation.isPending} full/>
  </View></Screen>;
}

export function RefundPaymentScreen(){
  const {patientId='',paymentId=''}=useLocalSearchParams<{patientId:string;paymentId:string}>();const record=usePatientRecord(patientId);const patientRecord=record.data;const payment=patientRecord?.payments.find(row=>row.id===paymentId);
  if(record.isLoading)return <Screen><PageHeader title="Refund payment" onBack={()=>router.back()}/><LoadingState/></Screen>;
  if(record.isError||!patientRecord||!payment)return <Screen><PageHeader title="Refund payment" onBack={()=>router.back()}/><ErrorState message="Payment was not found." onRetry={()=>record.refetch()}/></Screen>;
  return <RefundPaymentForm key={payment.id} payment={payment} patientName={patientRecord.patient.displayName}/>;
}

function RefundPaymentForm({payment,patientName}:{payment:Payment;patientName:string}){
  const mutation=useRefundPayment();const toast=useUIStore(s=>s.showToast);const refundable=Math.max(0,payment.amount-(payment.refundAmount??0));const[amount,setAmount]=useState(String(refundable));const[reason,setReason]=useState('');const[idempotencyKey,setIdempotencyKey]=useState<string>(`refund:${payment.id}:<pending>`);
  const submit=async()=>{const value=Number(amount);const normalizedReason=reason.trim();if(!value||value>refundable||normalizedReason.length<3)return toast('Enter a valid amount and refund reason.','warning');const key=`refund:${payment.id}:${Date.now()}`;setIdempotencyKey(key);try{await mutation.mutateAsync({paymentId:payment.id,amount:value,reason:normalizedReason,idempotencyKey:key});toast(`Refund recorded (${key}). Balances recalculated.`,'success');router.back()}catch(error){toast(error instanceof Error?error.message:'Unable to refund payment.','danger')}};
  return <Screen><PageHeader title="Refund payment" subtitle={`${payment.receiptNumber} · ${patientName}`} onBack={()=>router.back()}/><View style={{paddingHorizontal:spacing[4],gap:spacing[4]}}><Surface tone="warning" style={{gap:spacing[3]}}><SectionHeader title="Refundable balance" icon={Receipt}/><AppText variant="display" tabular>{money(refundable)}</AppText><AppText tone="secondary">Original {money(payment.amount)} · already refunded {money(payment.refundAmount??0)}</AppText></Surface><Surface style={{gap:spacing[3]}}><Field label="Refund amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad"/><Field label="Reason" value={reason} onChangeText={setReason} multiline placeholder="Duplicate charge, treatment change, provider reversal…"/></Surface><Surface tone="secondary" style={{gap:spacing[2]}}><SectionHeader title="Idempotency key" icon={ShieldCheck} subtitle="Unique key preventing duplicate refunds if the request is retried"/><AppText variant="caption" tone="muted" style={{ fontFamily: 'monospace' }}>{idempotencyKey}</AppText></Surface><Surface tone="danger"><AppText variant="bodyStrong">Refunds are immutable financial events.</AppText><AppText tone="secondary">The original receipt remains preserved and a refund event is added to the audit trail.</AppText></Surface><Button label={`Refund ${money(Number(amount)||0)}`} icon={BadgeIndianRupee} tone="danger" onPress={submit} loading={mutation.isPending} full/></View></Screen>;
}

export function InventoryMovementScreen(){
  const {itemId=''}=useLocalSearchParams<{itemId:string}>();const inventory=useInventory();const mutation=useRecordInventoryMovement();const toast=useUIStore(s=>s.showToast);const item=inventory.data?.find(row=>row.id===itemId);const[type,setType]=useState<'purchase'|'consumption'|'adjustment'|'waste'|'return'>('consumption');const[quantity,setQuantity]=useState('1');const[unitCost,setUnitCost]=useState('');const[reason,setReason]=useState('');
  if(inventory.isLoading)return <Screen><PageHeader title="Stock movement" onBack={()=>router.back()}/><LoadingState/></Screen>;
  if(inventory.isError||!item)return <Screen><PageHeader title="Stock movement" onBack={()=>router.back()}/><ErrorState message="Inventory item was not found." onRetry={()=>inventory.refetch()}/></Screen>;
  const submit=async()=>{const qty=Number(quantity);if(!qty||qty<=0)return toast('Enter a positive quantity.','warning');try{await mutation.mutateAsync({inventoryItemId:item.id,type,quantity:qty,unitCost:unitCost?Number(unitCost):undefined,reason:reason.trim()||undefined});toast('Inventory ledger updated.','success');router.back()}catch(error){toast(error instanceof Error?error.message:'Unable to record stock movement.','danger')}};
  return <Screen><PageHeader title="Stock movement" subtitle={`${item.name} · ${item.currentQuantity} ${item.unit} available`} onBack={()=>router.back()}/><View style={{paddingHorizontal:spacing[4],gap:spacing[4]}}><Surface style={{gap:spacing[3]}}><SectionHeader title="Movement type" icon={Package}/><View style={{flexDirection:'row',flexWrap:'wrap',gap:spacing[2]}}>{(['purchase','consumption','adjustment','waste','return'] as const).map(value=><Chip key={value} label={value} selected={type===value} onPress={()=>setType(value)}/>)}</View><Field label={`Quantity (${item.unit})`} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad"/>{type==='purchase'?<Field label="Unit cost" value={unitCost} onChangeText={setUnitCost} keyboardType="decimal-pad"/>:null}<Field label="Reason or procedure context" value={reason} onChangeText={setReason} multiline/></Surface><Surface tone="clinical"><AppText variant="bodyStrong">Procedure-linked consumption is supported by the backend.</AppText><AppText tone="secondary">The ledger preserves who changed stock, when, why and the associated patient or appointment when supplied.</AppText></Surface><Button label="Record movement" icon={Package} onPress={submit} loading={mutation.isPending} full/></View></Screen>;
}

export function BookingRequestsList({compact=false}:{compact?:boolean}){
  const theme=useTheme();const query=useBookingRequests();const mutation=useSetBookingRequestStatus();const toast=useUIStore(s=>s.showToast);const[status,setStatus]=useState<BookingRequest['status']|'all'>('new');const rows=useMemo(()=>(query.data??[]).filter(row=>status==='all'||row.status===status),[query.data,status]);
  const act=async(id:string,next:BookingRequest['status'])=>{try{await mutation.mutateAsync({id,status:next});toast(`Booking request marked ${next}.`,'success')}catch(error){toast(error instanceof Error?error.message:'Unable to update request.','danger')}};
  return <View style={{gap:spacing[4]}}><Surface style={{gap:spacing[3]}}><SectionHeader title="Online booking requests" subtitle="Public requests remain pending until staff verifies identity and availability" icon={CalendarDays}/><View style={{flexDirection:'row',flexWrap:'wrap',gap:spacing[2]}}>{(['new','contacted','converted','declined','all'] as const).map(value=><Chip key={value} label={value} selected={status===value} onPress={()=>setStatus(value)}/>)}</View></Surface>{query.isLoading?<LoadingState/>:query.isError?<ErrorState onRetry={()=>query.refetch()}/>:!rows.length?<EmptyState title="No booking requests" message="New website and WhatsApp requests will appear here." icon={CalendarDays}/>:rows.map(row=><Surface key={row.id} style={{gap:spacing[3]}}><View style={{flexDirection:'row',gap:spacing[3],alignItems:'center'}}><View style={{width:44,height:44,borderRadius:14,backgroundColor:theme.colors.primarySoft,alignItems:'center',justifyContent:'center'}}><ContactRound size={20} color={theme.colors.primary}/></View><View style={{flex:1}}><AppText variant="bodyStrong">{row.requestedName}</AppText><AppText variant="caption" tone="secondary">{row.phone}{row.preferredDate?` · ${row.preferredDate}`:''}{row.preferredWindow?` · ${row.preferredWindow}`:''}</AppText></View><Badge label={row.status} tone={row.status==='new'?'warning':row.status==='converted'?'success':'neutral'}/></View>{row.reason?<AppText tone="secondary">{row.reason}</AppText>:null}<AppText variant="caption" tone="muted">{row.source} · {relativeTime(row.createdAt)}</AppText><View style={{flexDirection:'row',flexWrap:'wrap',gap:spacing[2]}}><Button label="Call" icon={Phone} size="small" tone="secondary" onPress={()=>{void callPhone(row.phone);void act(row.id,'contacted')}}/><Button label="Create patient" icon={ContactRound} size="small" onPress={()=>router.push({pathname:'/patient/new',params:{firstName:row.requestedName.split(' ')[0]??'',lastName:row.requestedName.split(' ').slice(1).join(' '),phone:row.phone,email:row.email??'',bookingRequestId:row.id}})}/>{row.status!=='declined'?<Button label="Decline" icon={XCircle} size="small" tone="ghost" onPress={()=>act(row.id,'declined')}/>:null}</View></Surface>)}</View>;
}

export function BookingRequestsScreen(){return <Screen><PageHeader title="Booking requests" subtitle="Verify, convert and schedule public requests" onBack={()=>router.back()}/><View style={{paddingHorizontal:spacing[4],paddingBottom:spacing[6]}}><BookingRequestsList/></View></Screen>}
