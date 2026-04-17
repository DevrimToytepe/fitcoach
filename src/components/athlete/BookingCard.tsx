import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PT, CoachingPackage } from '../../types';
import Button from '../common/Button';
import Icon from '../common/Icon';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../constants/typography';
import { getCapacityColor, formatPrice } from '../../utils/helpers';

interface BookingCardProps {
  pt: PT;
  selectedPackage: CoachingPackage | null;
  hasActivePT: boolean;
  isCurrentPT: boolean;
  onBook: () => void;
  onMessage?: () => void;
}

export default function BookingCard({
  pt,
  selectedPackage,
  hasActivePT,
  isCurrentPT,
  onBook,
  onMessage,
}: BookingCardProps) {
  const C = useColors();
  const isFull = pt.students.length >= pt.maxStudents;
  const capacityColor = getCapacityColor(pt.students.length, pt.maxStudents);

  let buttonTitle = selectedPackage ? `${selectedPackage.name} Paketini Al` : 'Paket Seç';
  let buttonDisabled = !selectedPackage;

  if (isFull) {
    buttonTitle = 'Kontenjan Dolu';
    buttonDisabled = true;
  } else if (isCurrentPT) {
    buttonTitle = 'Mevcut Koçunuz';
    buttonDisabled = true;
  } else if (hasActivePT) {
    buttonTitle = 'Önce mevcut koçluğunu bitir';
    buttonDisabled = true;
  }

  return (
    <View style={[styles.card, { backgroundColor: C.card }]}>
      {selectedPackage ? (
        <View style={[styles.selectedPackagePreview, { backgroundColor: C.surface, borderColor: C.accent }]}>
          <View style={styles.packagePriceRow}>
            <View>
              <Text style={[styles.packageName, { color: C.accent }]}>{selectedPackage.name} Paketi</Text>
              <Text style={[styles.packageDuration, { color: C.textSecondary }]}>
                {selectedPackage.durationWeeks} hafta · Haftada {selectedPackage.sessionsPerWeek} seans
              </Text>
            </View>
            <Text style={[styles.price, { color: C.accent }]}>{formatPrice(selectedPackage.price)}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.noPackageRow, { backgroundColor: C.surface }]}>
          <Icon name="package" size={18} color={C.textSecondary} />
          <Text style={[styles.noPackageText, { color: C.textSecondary }]}>Yukarıdan bir paket seçin</Text>
        </View>
      )}

      <View style={styles.capacityBox}>
        <View style={[styles.dot, { backgroundColor: capacityColor }]} />
        <Text style={[styles.capacityText, { color: capacityColor }]}>
          {pt.students.length}/{pt.maxStudents} öğrenci
        </Text>
      </View>

      <Button
        title={buttonTitle}
        onPress={onBook}
        disabled={buttonDisabled}
        variant={buttonDisabled ? 'secondary' : 'primary'}
        style={{ opacity: buttonDisabled ? 0.6 : 1 }}
      />

      {isCurrentPT && onMessage && (
        <Button
          title="Mesaj Gönder"
          onPress={onMessage}
          variant="outline"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
    ...Shadow.medium,
    gap: Spacing.sm,
  },
  selectedPackagePreview: {
    borderRadius: 10,
    padding: Spacing.sm,
    borderWidth: 1.5,
  },
  packagePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageName: { ...Typography.label },
  packageDuration: { ...Typography.caption, marginTop: 2 },
  price: { ...Typography.h2, fontSize: 22 },
  noPackageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.sm,
    borderRadius: 10,
  },
  noPackageText: { ...Typography.bodySmall },
  capacityBox: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  capacityText: { ...Typography.bodySmall, fontWeight: '600' },
});
