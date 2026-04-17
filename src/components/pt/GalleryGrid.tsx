import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { GalleryItem } from '../../types';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';
import { formatDate } from '../../utils/helpers';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

interface GalleryGridProps {
  items: GalleryItem[];
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

function GalleryItemCard({ item, onDelete, showDelete }: {
  item: GalleryItem;
  onDelete?: () => void;
  showDelete?: boolean;
}) {
  const C = useColors();

  return (
    <View style={[styles.item, { backgroundColor: C.card, borderColor: C.border }]}>
      {showDelete && onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      )}
      <View style={styles.imageRow}>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.beforeImage }}
            style={[styles.image, { backgroundColor: C.surface }]}
            resizeMode="cover"
            onError={() => console.log('Before image load error:', item.beforeImage?.slice(0, 80))}
          />
          <Text style={styles.imageLabel}>Önce</Text>
        </View>
        <Text style={[styles.arrow, { color: C.textSecondary }]}>→</Text>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.afterImage }}
            style={[styles.image, { backgroundColor: C.surface }]}
            resizeMode="cover"
            onError={() => console.log('After image load error:', item.afterImage?.slice(0, 80))}
          />
          <Text style={styles.imageLabel}>Sonra</Text>
        </View>
      </View>
      <Text style={[styles.studentName, { color: C.textPrimary }]} numberOfLines={1}>
        {item.studentName}
      </Text>
      <Text style={[styles.description, { color: C.textSecondary }]} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={[styles.date, { color: C.textSecondary }]}>{formatDate(item.createdAt)}</Text>
    </View>
  );
}

export default function GalleryGrid({ items, onDelete, showDelete = false }: GalleryGridProps) {
  const C = useColors();

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🖼️</Text>
        <Text style={[styles.emptyText, { color: C.textSecondary }]}>Henüz galeri öğesi yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <GalleryItemCard
          key={item.id}
          item={item}
          onDelete={onDelete ? () => onDelete(item.id) : undefined}
          showDelete={showDelete}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  item: {
    width: ITEM_WIDTH,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
    padding: Spacing.sm,
    gap: 4,
  },
  deleteBtn: {
    position: 'absolute',
    top: 8, right: 8,
    zIndex: 10,
    width: 26, height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  imageRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  imageWrapper: { flex: 1, position: 'relative' },
  image: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  imageLabel: {
    position: 'absolute', bottom: 2, left: 2,
    fontSize: 9, fontWeight: '700', color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 3, paddingVertical: 1, borderRadius: 3,
  },
  arrow: { fontSize: 14 },
  studentName: { ...Typography.label, marginTop: 4 },
  description: { ...Typography.caption },
  date: { ...Typography.caption, fontSize: 10 },
  empty: { alignItems: 'center', padding: Spacing.xl, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { ...Typography.bodySmall },
});
