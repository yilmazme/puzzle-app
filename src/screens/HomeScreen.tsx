import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gridFor, Level, LEVELS, pieceCount } from '../game/puzzle';
import { PuzzleImage } from '../image';
import { Scores } from '../storage';
import { colors } from '../theme';

type Props = {
  image: PuzzleImage | null;
  loading: boolean;
  level: Level;
  scores: Scores;
  onPick: () => void;
  onSelectLevel: (level: Level) => void;
  onStart: () => void;
};

export function HomeScreen({
  image,
  loading,
  level,
  scores,
  onPick,
  onSelectLevel,
  onStart,
}: Props) {
  const insets = useSafeAreaInsets();
  const grid = image ? gridFor(level, image.width / image.height) : null;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={styles.title}>Photo Puzzle</Text>
      <Text style={styles.subtitle}>
        Pick a photo, memorize it, then swap the pieces back into place.
      </Text>

      <Pressable style={styles.preview} onPress={onPick} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.text} size="large" />
        ) : image ? (
          <Image
            source={{ uri: image.uri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.previewHint}>Tap to choose a photo</Text>
        )}
      </Pressable>

      <Pressable style={styles.secondary} onPress={onPick} disabled={loading}>
        <Text style={styles.buttonText}>
          {image ? 'Change photo' : 'Choose photo'}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.start, !image && styles.disabled]}
        onPress={onStart}
        disabled={!image || loading}
      >
        <Text style={styles.startText}>Start</Text>
      </Pressable>

      <Text style={styles.section}>Difficulty</Text>
      <View style={styles.levels}>
        {LEVELS.map((l) => {
          const selected = l.id === level.id;
          const best = scores[l.id];
          return (
            <Pressable
              key={l.id}
              onPress={() => onSelectLevel(l)}
              style={[styles.level, selected && styles.levelSelected]}
            >
              <Text style={styles.levelNumber}>Level {l.id}</Text>
              <Text style={styles.levelPieces}>{pieceCount(l)} pieces</Text>
              {best && <Text style={styles.levelBest}>★ {best.moves} moves</Text>}
            </Pressable>
          );
        })}
      </View>
      {/* {grid && (
        <Text style={styles.gridInfo}>
          {grid.cols} × {grid.rows} grid with one empty slot
        </Text>
      )} */}

</ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, alignItems: 'stretch', gap: 14 },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  preview: {
    height: 220,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.accent,
  },
  previewImage: { width: '100%', height: '100%' },
  previewHint: { color: colors.muted, fontSize: 16 },
  secondary: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  section: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 8 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  level: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelSelected: { borderColor: colors.accent },
  levelNumber: { color: colors.text, fontWeight: '700', fontSize: 16 },
  levelPieces: { color: colors.muted, fontSize: 14 },
  levelBest: { color: colors.gold, fontSize: 13, marginTop: 2 },
  gridInfo: { color: colors.muted, textAlign: 'center', fontSize: 13 },
  start: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  startText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  disabled: { opacity: 0.4 },
});
