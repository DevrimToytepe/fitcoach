import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FitnessGoal } from '../../types';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../constants/typography';
import { getGoalLabel, getGoalIconName } from '../../utils/helpers';
import Icon, { IconName } from '../common/Icon';

interface GoalSelectorProps {
  value: FitnessGoal | null;
  onChange: (goal: FitnessGoal) => void;
}

const goals: FitnessGoal[] = ['lose_weight', 'gain_muscle', 'stay_fit', 'healthy_life'];

function GoalCard({
  goal,
  selected,
  onPress,
}: {
  goal: FitnessGoal;
  selected: boolean;
  onPress: () => void;
}) {
  const C = useColors();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: C.card, borderColor: C.border },
        selected && { borderColor: C.accent, backgroundColor: 'rgba(233,69,96,0.08)' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon
        name={getGoalIconName(goal) as IconName}
        size={28}
        color={selected ? C.accent : C.textSecondary}
      />
      <Text style={[styles.label, { color: C.textSecondary }, selected && { color: C.accent, fontWeight: '700' }]}>
        {getGoalLabel(goal)}
      </Text>
      {selected && (
        <View style={[styles.checkmark, { backgroundColor: C.accent }]}>
          <Icon name="check" size={11} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function GoalSelector({ value, onChange }: GoalSelectorProps) {
  return (
    <View style={styles.grid}>
      {goals.map((goal) => (
        <GoalCard
          key={goal}
          goal={goal}
          selected={value === goal}
          onPress={() => onChange(goal)}
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
  card: {
    width: '47%',
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    ...Shadow.small,
    minHeight: 90,
    justifyContent: 'center',
  },
  label: { ...Typography.label, textAlign: 'center' },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
