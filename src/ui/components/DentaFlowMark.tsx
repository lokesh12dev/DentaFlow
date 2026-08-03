import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../ThemeProvider';

export function DentaFlowMark({ size = 32 }: { size?: number }) {
  const theme = useTheme();

  return <Svg accessibilityRole="image" accessibilityLabel="DentaFlow" width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Path d="M14 2.5 C 20 2.5, 25 5, 26.5 10 C 27.5 14, 26.5 20, 24.5 24 C 23 27, 22 29.5, 20.5 29.5 C 19 29.5, 18.5 26, 17 24 C 15.5 26, 14.8 29.5, 13 29.5 C 11 29.5, 9.5 26, 7.5 23 C 5 19, 4 14, 5 10 C 6.5 5, 11 2.5, 14 2.5 Z" fill={theme.colors.clinical} />
    <Path d="M12 8 L16 8 L15 12 L13 12 Z" fill={theme.colors.canvas} opacity={0.9} />
  </Svg>;
}
