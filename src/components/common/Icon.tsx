import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, {
  Path, Circle, Rect, Line, Polyline, Polygon,
  G, Defs, LinearGradient as SvgGradient, Stop,
} from 'react-native-svg';
import { Colors } from '../../constants/colors';

export type IconName =
  | 'dumbbell'
  | 'video'
  | 'chart'
  | 'home'
  | 'search'
  | 'coach'
  | 'message'
  | 'profile'
  | 'dashboard'
  | 'star'
  | 'package'
  | 'check'
  | 'close'
  | 'arrow_left'
  | 'arrow_right'
  | 'edit'
  | 'gallery'
  | 'notification'
  | 'settings'
  | 'logout'
  | 'target'
  | 'fire'
  | 'flash'
  | 'leaf'
  | 'trophy'
  | 'clock'
  | 'calendar'
  | 'lock'
  | 'mail'
  | 'user'
  | 'users'
  | 'camera'
  | 'send'
  | 'plus'
  | 'trash'
  | 'crown'
  | 'shield'
  | 'bolt'
  | 'help'
  | 'dark_mode'
  | 'location';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export default function Icon({ name, size = 24, color = Colors.textPrimary, style }: IconProps) {
  const props = { width: size, height: size, viewBox: '0 0 24 24' };
  const s = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const sf = { fill: color, stroke: 'none' };

  const icons: Record<IconName, JSX.Element> = {
    dumbbell: (
      <Svg {...props}>
        <Rect x="2" y="10" width="4" height="4" rx="1" {...s} />
        <Rect x="18" y="10" width="4" height="4" rx="1" {...s} />
        <Rect x="6" y="8" width="3" height="8" rx="1" {...s} />
        <Rect x="15" y="8" width="3" height="8" rx="1" {...s} />
        <Line x1="9" y1="12" x2="15" y2="12" {...s} />
      </Svg>
    ),
    video: (
      <Svg {...props}>
        <Rect x="2" y="5" width="14" height="14" rx="2" {...s} />
        <Polyline points="16 9 22 6 22 18 16 15" {...s} />
      </Svg>
    ),
    chart: (
      <Svg {...props}>
        <Line x1="4" y1="20" x2="20" y2="20" {...s} />
        <Line x1="4" y1="20" x2="4" y2="4" {...s} />
        <Polyline points="4 16 8 12 12 14 16 9 20 11" {...s} />
      </Svg>
    ),
    home: (
      <Svg {...props}>
        <Path d="M3 12L12 3L21 12V20C21 20.6 20.6 21 20 21H15V16H9V21H4C3.4 21 3 20.6 3 20V12Z" {...s} />
      </Svg>
    ),
    search: (
      <Svg {...props}>
        <Circle cx="11" cy="11" r="7" {...s} />
        <Line x1="16.5" y1="16.5" x2="22" y2="22" {...s} />
      </Svg>
    ),
    coach: (
      <Svg {...props}>
        <Circle cx="12" cy="8" r="4" {...s} />
        <Path d="M4 20C4 16.7 7.6 14 12 14" {...s} />
        <Path d="M16 17L18.5 20L22 16" {...s} strokeWidth={2.2} />
      </Svg>
    ),
    message: (
      <Svg {...props}>
        <Path d="M21 15C21 15.6 20.6 16 20 16H6L3 19V5C3 4.4 3.4 4 4 4H20C20.6 4 21 4.4 21 5V15Z" {...s} />
      </Svg>
    ),
    profile: (
      <Svg {...props}>
        <Circle cx="12" cy="8" r="4" {...s} />
        <Path d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20" {...s} />
      </Svg>
    ),
    dashboard: (
      <Svg {...props}>
        <Rect x="3" y="3" width="7" height="7" rx="1" {...s} />
        <Rect x="14" y="3" width="7" height="7" rx="1" {...s} />
        <Rect x="3" y="14" width="7" height="7" rx="1" {...s} />
        <Rect x="14" y="14" width="7" height="7" rx="1" {...s} />
      </Svg>
    ),
    star: (
      <Svg {...props}>
        <Polygon points="12 2 15.1 8.9 22.5 9.3 17 14 18.8 21.2 12 17.3 5.2 21.2 7 14 1.5 9.3 8.9 8.9 12 2" fill={color} stroke={color} strokeWidth={1} />
      </Svg>
    ),
    package: (
      <Svg {...props}>
        <Path d="M12 2L22 7V17L12 22L2 17V7L12 2Z" {...s} />
        <Line x1="12" y1="22" x2="12" y2="12" {...s} />
        <Polyline points="22 7 12 12 2 7" {...s} />
        <Polyline points="7 4.5 17 9.5" {...s} />
      </Svg>
    ),
    check: (
      <Svg {...props}>
        <Polyline points="20 6 9 17 4 12" {...s} />
      </Svg>
    ),
    close: (
      <Svg {...props}>
        <Line x1="18" y1="6" x2="6" y2="18" {...s} />
        <Line x1="6" y1="6" x2="18" y2="18" {...s} />
      </Svg>
    ),
    arrow_left: (
      <Svg {...props}>
        <Polyline points="15 18 9 12 15 6" {...s} />
      </Svg>
    ),
    arrow_right: (
      <Svg {...props}>
        <Polyline points="9 6 15 12 9 18" {...s} />
      </Svg>
    ),
    edit: (
      <Svg {...props}>
        <Path d="M17 3C17.6 2.4 18.9 2.4 19.5 3L21 4.5C21.6 5.1 21.6 6.4 21 7L7 21H3V17L17 3Z" {...s} />
        <Line x1="14" y1="6" x2="18" y2="10" {...s} />
      </Svg>
    ),
    gallery: (
      <Svg {...props}>
        <Rect x="3" y="3" width="18" height="18" rx="2" {...s} />
        <Circle cx="8.5" cy="8.5" r="1.5" {...s} />
        <Polyline points="21 15 16 10 5 21" {...s} />
      </Svg>
    ),
    notification: (
      <Svg {...props}>
        <Path d="M18 8C18 4.7 15.3 2 12 2C8.7 2 6 4.7 6 8V14L4 16V17H20V16L18 14V8Z" {...s} />
        <Path d="M9.9 20C10.2 20.6 11 21 12 21C13 21 13.8 20.6 14.1 20" {...s} />
      </Svg>
    ),
    settings: (
      <Svg {...props}>
        <Circle cx="12" cy="12" r="3" {...s} />
        <Path d="M19.4 15C19.7 14.4 20 13.7 20 13V11C20 10.3 19.7 9.6 19.4 9L20.5 6.9C20.7 6.5 20.6 6 20.2 5.8L18 4.5C17.6 4.3 17.1 4.4 16.9 4.8L15.8 6.9C15.3 6.7 14.7 6.5 14 6.4V4C14 3.4 13.6 3 13 3H11C10.4 3 10 3.4 10 4V6.4C9.3 6.5 8.7 6.7 8.2 6.9L7.1 4.8C6.9 4.4 6.4 4.3 6 4.5L3.8 5.8C3.4 6 3.3 6.5 3.5 6.9L4.6 9C4.3 9.6 4 10.3 4 11V13C4 13.7 4.3 14.4 4.6 15L3.5 17.1C3.3 17.5 3.4 18 3.8 18.2L6 19.5C6.4 19.7 6.9 19.6 7.1 19.2L8.2 17.1C8.7 17.3 9.3 17.5 10 17.6V20C10 20.6 10.4 21 11 21H13C13.6 21 14 20.6 14 20V17.6C14.7 17.5 15.3 17.3 15.8 17.1L16.9 19.2C17.1 19.6 17.6 19.7 18 19.5L20.2 18.2C20.6 18 20.7 17.5 20.5 17.1L19.4 15Z" {...s} />
      </Svg>
    ),
    logout: (
      <Svg {...props}>
        <Path d="M9 21H5C4.4 21 4 20.6 4 20V4C4 3.4 4.4 3 5 3H9" {...s} />
        <Polyline points="16 17 21 12 16 7" {...s} />
        <Line x1="21" y1="12" x2="9" y2="12" {...s} />
      </Svg>
    ),
    target: (
      <Svg {...props}>
        <Circle cx="12" cy="12" r="10" {...s} />
        <Circle cx="12" cy="12" r="6" {...s} />
        <Circle cx="12" cy="12" r="2" fill={color} stroke="none" />
      </Svg>
    ),
    fire: (
      <Svg {...props}>
        <Path d="M12 2C12 2 8 6 8 10C8 12.2 9.4 14 12 14C14.6 14 16 12.2 16 10" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d="M12 22C7.6 22 4 18.4 4 14C4 10 7 7 9 5C9 7 10 9 12 10C14 9 15 7 15 5C17 7 20 10 20 14C20 18.4 16.4 22 12 22Z" {...s} />
      </Svg>
    ),
    flash: (
      <Svg {...props}>
        <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" {...s} fill={color} />
      </Svg>
    ),
    leaf: (
      <Svg {...props}>
        <Path d="M17 8C17 8 18 3 12 3C6 3 4 9 4 12C4 16.4 7.6 20 12 20C16.4 20 20 16.4 20 12C20 10 19 8 17 8Z" {...s} />
        <Line x1="12" y1="20" x2="12" y2="13" {...s} />
        <Line x1="12" y1="13" x2="8" y2="9" {...s} />
        <Line x1="12" y1="13" x2="16" y2="10" {...s} />
      </Svg>
    ),
    trophy: (
      <Svg {...props}>
        <Path d="M8 21H16M12 17V21M17 3H7L7 10C7 13.3 9.2 16 12 16C14.8 16 17 13.3 17 10V3Z" {...s} />
        <Path d="M7 5H4C4 5 3 9 6 10" {...s} />
        <Path d="M17 5H20C20 5 21 9 18 10" {...s} />
      </Svg>
    ),
    clock: (
      <Svg {...props}>
        <Circle cx="12" cy="12" r="9" {...s} />
        <Polyline points="12 7 12 12 16 14" {...s} />
      </Svg>
    ),
    calendar: (
      <Svg {...props}>
        <Rect x="3" y="4" width="18" height="17" rx="2" {...s} />
        <Line x1="3" y1="10" x2="21" y2="10" {...s} />
        <Line x1="8" y1="2" x2="8" y2="6" {...s} />
        <Line x1="16" y1="2" x2="16" y2="6" {...s} />
      </Svg>
    ),
    lock: (
      <Svg {...props}>
        <Rect x="5" y="11" width="14" height="10" rx="2" {...s} />
        <Path d="M8 11V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V11" {...s} />
        <Circle cx="12" cy="16" r="1" fill={color} stroke="none" />
      </Svg>
    ),
    mail: (
      <Svg {...props}>
        <Rect x="2" y="4" width="20" height="16" rx="2" {...s} />
        <Polyline points="2 4 12 13 22 4" {...s} />
      </Svg>
    ),
    user: (
      <Svg {...props}>
        <Circle cx="12" cy="8" r="4" {...s} />
        <Path d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20" {...s} />
      </Svg>
    ),
    users: (
      <Svg {...props}>
        <Circle cx="9" cy="8" r="3" {...s} />
        <Path d="M2 20C2 17.2 5.1 15 9 15" {...s} />
        <Circle cx="16" cy="9" r="3" {...s} />
        <Path d="M22 20C22 17.2 18.9 15 16 15C14.3 15 12.7 15.6 11.6 16.5" {...s} />
      </Svg>
    ),
    camera: (
      <Svg {...props}>
        <Path d="M23 19C23 19.6 22.6 20 22 20H2C1.4 20 1 19.6 1 19V8C1 7.4 1.4 7 2 7H6L8 4H16L18 7H22C22.6 7 23 7.4 23 8V19Z" {...s} />
        <Circle cx="12" cy="13" r="3" {...s} />
      </Svg>
    ),
    send: (
      <Svg {...props}>
        <Line x1="22" y1="2" x2="11" y2="13" {...s} />
        <Polygon points="22 2 15 22 11 13 2 9 22 2" {...s} />
      </Svg>
    ),
    plus: (
      <Svg {...props}>
        <Line x1="12" y1="5" x2="12" y2="19" {...s} />
        <Line x1="5" y1="12" x2="19" y2="12" {...s} />
      </Svg>
    ),
    trash: (
      <Svg {...props}>
        <Polyline points="3 6 5 6 21 6" {...s} />
        <Path d="M19 6L18 20C18 20.6 17.6 21 17 21H7C6.4 21 6 20.6 6 20L5 6" {...s} />
        <Path d="M9 6V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V6" {...s} />
      </Svg>
    ),
    crown: (
      <Svg {...props}>
        <Path d="M2 17L5 7L10 13L12 6L14 13L19 7L22 17H2Z" {...s} fill={color} />
        <Line x1="2" y1="20" x2="22" y2="20" {...s} />
      </Svg>
    ),
    shield: (
      <Svg {...props}>
        <Path d="M12 2L4 5V11C4 16.5 7.4 21.2 12 22C16.6 21.2 20 16.5 20 11V5L12 2Z" {...s} />
        <Polyline points="9 12 11 14 15 10" {...s} />
      </Svg>
    ),
    bolt: (
      <Svg {...props}>
        <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" {...s} fill={color} />
      </Svg>
    ),
    help: (
      <Svg {...props}>
        <Circle cx="12" cy="12" r="10" {...s} />
        <Path d="M9 9C9 7.3 10.3 6 12 6C13.7 6 15 7.3 15 9C15 11 12 11 12 13" {...s} />
        <Circle cx="12" cy="17" r="0.5" fill={color} stroke={color} strokeWidth={1.5} />
      </Svg>
    ),
    dark_mode: (
      <Svg {...props}>
        <Path d="M21 12.8C20.4 17.3 16.5 20.8 12 20.8C7.1 20.8 3.2 16.9 3.2 12C3.2 7.5 6.7 3.6 11.2 3C8.3 5 6.5 8.3 6.5 12C6.5 16.7 10.3 20.5 15 20.5C17.7 20.5 20 19.3 21.5 17.4C21.4 17.9 21.2 18.4 21 18.8C21 18.8 21 18.8 21 12.8Z" {...s} />
      </Svg>
    ),
    location: (
      <Svg {...props}>
        <Path d="M21 10C21 16 12 22 12 22C12 22 3 16 3 10C3 7.3 4.1 4.8 6 3.1C7.9 1.4 10.4 0.5 13 1C17.4 1.7 21 5.5 21 10Z" {...s} />
        <Circle cx="12" cy="10" r="3" {...s} />
      </Svg>
    ),
  };

  return (
    <View style={[{ width: size, height: size }, style]}>
      {icons[name]}
    </View>
  );
}
