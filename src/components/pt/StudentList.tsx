import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Athlete } from '../../types';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';
import { getGoalLabel, getExperienceLabel, formatDate } from '../../utils/helpers';

interface StudentListProps {
  students: Athlete[];
  onMessage: (athleteId: string, athleteName: string) => void;
}

function StudentItem({ student, onMessage }: {
  student: Athlete;
  onMessage: () => void;
}) {
  const C = useColors();

  return (
    <View style={[styles.item, { backgroundColor: C.card }]}>
      <Avatar
        uri={student.avatar}
        name={`${student.firstName} ${student.lastName}`}
        size="md"
      />
      <View style={styles.info}>
        <Text style={[styles.name, { color: C.textPrimary }]}>
          {student.firstName} {student.lastName}
        </Text>
        <View style={styles.badges}>
          <Badge label={getGoalLabel(student.fitnessGoal)} variant="neutral" size="sm" />
          <Badge label={getExperienceLabel(student.experienceLevel)} variant="success" size="sm" />
        </View>
        <Text style={[styles.since, { color: C.textSecondary }]}>
          Başlangıç: {formatDate(student.createdAt)}
        </Text>
      </View>
      <TouchableOpacity style={[styles.messageBtn, { backgroundColor: C.surface }]} onPress={onMessage}>
        <Text style={styles.messageBtnText}>💬</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function StudentList({ students, onMessage }: StudentListProps) {
  const C = useColors();

  if (students.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={[styles.emptyText, { color: C.textSecondary }]}>Henüz öğrenciniz yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {students.map((student) => (
        <StudentItem
          key={student.id}
          student={student}
          onMessage={() => onMessage(student.id, `${student.firstName} ${student.lastName}`)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  info: { flex: 1, gap: 4 },
  name: { ...Typography.label },
  badges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  since: { ...Typography.caption },
  messageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBtnText: { fontSize: 18 },
  empty: { alignItems: 'center', padding: Spacing.xl, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { ...Typography.bodySmall },
});
