import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { ComponentSize, BorderRadius } from '../../constants/typography';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  borderColor?: string;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: ComponentSize.avatarSmall,
  md: ComponentSize.avatarMedium,
  lg: ComponentSize.avatarLarge,
  xl: ComponentSize.avatarXLarge,
};

export default function Avatar({ uri, name, size = 'md', style, borderColor }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const diameter = sizeMap[size];
  const fontSize = diameter * 0.38;

  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
    : '?';

  const containerStyle = [
    styles.container,
    {
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
      borderColor: borderColor ?? 'transparent',
      borderWidth: borderColor ? 2 : 0,
    },
    style,
  ];

  if (uri && !hasError) {
    return (
      <View style={containerStyle}>
        {/* Placeholder — fotoğraf yüklenene kadar baş harfler görünür */}
        {!loaded && (
          <View style={[styles.fallback, { width: diameter, height: diameter, borderRadius: diameter / 2 }]}>
            <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
          </View>
        )}
        <Image
          source={{ uri, cache: 'force-cache' } as any}
          style={[styles.image, { width: diameter, height: diameter, borderRadius: diameter / 2 }]}
          resizeMode="cover"
          fadeDuration={0}
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.fallback, containerStyle]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  image: {
    position: 'absolute',
    top: 0, left: 0,
  },
  fallback: {
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: Colors.white,
    fontWeight: '700',
  },
});
