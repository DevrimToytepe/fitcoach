import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Specialization, FilterState } from '../../types';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';
import { getSpecializationLabel } from '../../utils/helpers';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

const ALL_SPECS: (Specialization | null)[] = [
  null,
  'weight_loss',
  'muscle_gain',
  'yoga',
  'pilates',
  'nutrition',
  'functional',
  'rehabilitation',
];

const chipLabel = (spec: Specialization | null) =>
  spec === null ? 'Tümü' : getSpecializationLabel(spec);

const SORT_OPTIONS: { value: FilterState['sortBy']; label: string }[] = [
  { value: 'rating', label: 'En Yüksek Puan' },
  { value: 'price_asc', label: 'En Düşük Fiyat' },
  { value: 'price_desc', label: 'En Yüksek Fiyat' },
  { value: 'availability', label: 'Müsaitlik' },
];

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const C = useColors();

  return (
    <View style={[styles.container, { backgroundColor: C.card, borderBottomColor: C.border }]}>
      {/* Spec chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {ALL_SPECS.map((spec) => {
          const selected = filters.specialization === spec;
          return (
            <TouchableOpacity
              key={spec ?? 'all'}
              style={[
                styles.chip,
                { borderColor: C.border, backgroundColor: C.surface },
                selected && { borderColor: C.accent, backgroundColor: C.accent },
              ]}
              onPress={() => onFilterChange({ specialization: spec })}
            >
              <Text style={[styles.chipText, { color: C.textSecondary }, selected && { color: '#fff' }]}>
                {chipLabel(spec)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sort options */}
      <View style={styles.row}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortChips}
        >
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.sortChip,
                { backgroundColor: C.surface },
                filters.sortBy === opt.value && { backgroundColor: C.accent },
              ]}
              onPress={() => onFilterChange({ sortBy: opt.value })}
            >
              <Text style={[
                styles.sortChipText,
                { color: C.textSecondary },
                filters.sortBy === opt.value && { color: '#fff', fontWeight: '600' },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: C.textPrimary }]}>Sadece müsait PT'ler</Text>
        <Switch
          value={filters.onlyAvailable}
          onValueChange={(val) => onFilterChange({ onlyAvailable: val })}
          trackColor={{ false: C.border, true: C.accent }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.xs,
  },
  chips: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.badge,
    borderWidth: 1.5,
  },
  chipText: { ...Typography.caption, fontWeight: '600' },
  row: { marginTop: 4 },
  sortChips: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.badge,
  },
  sortChipText: { ...Typography.caption },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: 4,
  },
  toggleLabel: { ...Typography.bodySmall, fontWeight: '500' },
});
