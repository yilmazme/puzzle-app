import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Level, LEVELS, pieceCount } from '../game/puzzle';
import { LANGUAGES } from '../i18n';
import { PuzzleImage } from '../image';
import { useSettings } from '../settings';
import { playSound } from '../sound';
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
  const scrollRef = useRef<ScrollView>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { soundEnabled, setSoundEnabled, language, setLanguage, t } =
    useSettings();

  return (
    <ScrollView
      ref={scrollRef}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={styles.title}>Photo Puzzle</Text>
      <Text style={styles.subtitle}>
        {t('subtitle')}
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
          <Text style={styles.previewHint}>{t('tapToChoose')}</Text>
        )}
      </Pressable>

      <Pressable style={styles.secondary} onPress={onPick} disabled={loading}>
        <Text style={styles.buttonText}>
          {image ? t('changePhoto') : t('choosePhoto')}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.start, !image && styles.disabled]}
        onPress={onStart}
        disabled={!image || loading}
      >
        <Text style={styles.startText}>{t('start')}</Text>
      </Pressable>

      <Text style={styles.section}>{t('difficulty')}</Text>
      <View style={styles.levels}>
        {LEVELS.map((l) => {
          const selected = l.id === level.id;
          const best = scores[l.id];
          return (
            <Pressable
              key={l.id}
              onPress={() => {
                playSound('click');
                onSelectLevel(l);
              }}
              style={[styles.level, selected && styles.levelSelected]}
            >
              <Text style={styles.levelNumber}>{t('level', { n: l.id })}</Text>
              <Text style={styles.levelPieces}>
                {t('pieces', { n: pieceCount(l) })}
              </Text>
              {best && (
                <Text style={styles.levelBest}>
                  {t('bestMoves', { n: best.moves })}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      {/* {grid && (
        <Text style={styles.gridInfo}>
          {grid.cols} × {grid.rows} grid with one empty slot
        </Text>
      )} */}

      <Pressable
        style={styles.accordionHeader}
        onPress={() => {
          playSound('click');
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSettingsOpen((open) => !open);
          // Let the expanded content lay out, then bring it into view
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
        }}
      >
        <Text style={styles.sectionTitle}>{t('settings')}</Text>
        <Text style={styles.chevron}>{settingsOpen ? '▲' : '▼'}</Text>
      </Pressable>
      {settingsOpen && (
        <>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>{t('soundEffects')}</Text>
        <Switch
          value={soundEnabled}
          onValueChange={(value) => {
            setSoundEnabled(value);
            if (value) playSound('click');
          }}
          trackColor={{ false: colors.switchOff, true: colors.accent }}
          thumbColor={soundEnabled ? colors.text : colors.muted}
        />
      </View>
      <View style={styles.settingBlock}>
        <Text style={styles.settingLabel}>{t('language')}</Text>
        <View style={styles.languages}>
          {LANGUAGES.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => {
                playSound('click');
                setLanguage(l.code);
              }}
              style={[
                styles.language,
                language === l.code && styles.languageSelected,
              ]}
            >
              <Text style={styles.languageText}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
        </>
      )}
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
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  chevron: { color: colors.muted, fontSize: 14 },
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  settingLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  settingBlock: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  languages: { flexDirection: 'row', gap: 8 },
  language: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageSelected: { borderColor: colors.accent },
  languageText: { color: colors.text, fontWeight: '600', fontSize: 15 },
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
