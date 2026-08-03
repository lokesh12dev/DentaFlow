import React, { useEffect, useMemo, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useTheme } from '../ThemeProvider';
import { radii, sizes, spacing } from '../tokens';
import { AppText } from './Typography';
import { Button } from './Button';
import { Trash2 } from '../icons';

export interface SignatureValue {
  strokes: Array<Array<{ x: number; y: number }>>;
  width: number;
  height: number;
  attestation: string;
}

export function SignaturePad({ value, onChange, attestation }: { value?: SignatureValue; onChange: (value: SignatureValue) => void; attestation: string }) {
  const theme = useTheme();
  const [size, setSize] = useState({ width: value?.width || 320, height: value?.height || 180 });
  const [strokes, setStrokes] = useState<SignatureValue['strokes']>(value?.strokes ?? []);
  useEffect(() => { onChange({ strokes, width: size.width, height: size.height, attestation }); }, [strokes, size, attestation, onChange]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => { const { locationX:x, locationY:y }=event.nativeEvent; setStrokes((current)=>[...current,[{x,y}]]); },
    onPanResponderMove: (event) => { const { locationX:x, locationY:y }=event.nativeEvent; setStrokes((current)=>{ if(!current.length)return [[{x,y}]]; const next=current.map((stroke,index)=>index===current.length-1?[...stroke,{x,y}]:stroke); return next; }); }
  }), []);
  return <View style={{ gap: spacing[2] }}>
    <View accessibilityRole="image" accessibilityLabel="Signature drawing area" onLayout={(event)=>setSize({width:event.nativeEvent.layout.width,height:event.nativeEvent.layout.height})} {...responder.panHandlers} style={{ height: 190, minHeight: 160, borderRadius: radii.lg, borderWidth: 1, borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.surfaceSecondary, overflow:'hidden' }}>
      <Svg width="100%" height="100%">{strokes.map((stroke,index)=><Polyline key={index} points={stroke.map((point)=>`${point.x},${point.y}`).join(' ')} fill="none" stroke={theme.colors.text} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />)}</Svg>
      {!strokes.length?<View pointerEvents="none" style={{position:'absolute',inset:0,alignItems:'center',justifyContent:'center',padding:spacing[4]}}><AppText tone="muted" style={{textAlign:'center'}}>Sign inside this box using a finger or stylus</AppText></View>:null}
      <View pointerEvents="none" style={{position:'absolute',left:spacing[4],right:spacing[4],bottom:36,height:1,backgroundColor:theme.colors.borderStrong}} />
    </View>
    <View style={{flexDirection:'row',alignItems:'center',gap:spacing[3]}}><AppText variant="caption" tone="secondary" style={{flex:1}}>{strokes.length ? `${strokes.length} signature stroke${strokes.length===1?'':'s'} captured` : 'Signature required before completion'}</AppText><Button label="Clear" icon={Trash2} tone="ghost" size="small" onPress={()=>setStrokes([])} /></View>
  </View>;
}
