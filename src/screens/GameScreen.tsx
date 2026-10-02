import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { PuzzleBoard } from '../components/PuzzleBoard';
import {
  gridFor,
  isSolved,
  Level,
  LEVELS,
  pieceCount,
  shuffledOrder,
  solvedOrder,
} from '../game/puzzle';
import { PuzzleImage } from '../image';
import { useSettings } from '../settings';
import { playSound } from '../sound';
import { BestScore, saveScore } from '../storage';
import { colors } from '../theme';

type Phase = 'preview' | 'cut' | 'playing' | 'celebrate' | 'won';

const PREVIEW_SECONDS = 3;

type Props = {
  image: PuzzleImage;
  level: Level;
  onExit: () => void;
  onSelectLevel: (level: Level) => void;
};

const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function GameScreen({ image, level, onExit, onSelectLevel }: Props) {
  useKeepAwake();
  const { t } = useSettings();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();

  const aspect = image.width / image.height;
  const { cols, rows } = gridFor(level, aspect);

  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>('preview');
  const [countdown, setCountdown] = useState(PREVIEW_SECONDS);
  const [order, setOrder] = useState<number[]>(() => solvedOrder(cols, rows));
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [peeking, setPeeking] = useState(false);
  const celebrateScale = useRef(new Animated.Value(1)).current;
  const [record, setRecord] = useState<BestScore | null>(null);
  const [isRecord, setIsRecord] = useState(false);

  // Preview -> cut -> shuffled, restarted whenever the level or attempt changes
  useEffect(() => {
    setPhase('preview');
    setCountdown(PREVIEW_SECONDS);
    setOrder(solvedOrder(cols, rows));
    setMoves(0);
    setSeconds(0);
    setRecord(null);
    setIsRecord(false);

    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    const cutTimer = setTimeout(() => {
      clearInterval(tick);
      setPhase('cut');
    }, PREVIEW_SECONDS * 1000);
    const playTimer = setTimeout(() => {
      setOrder(shuffledOrder(cols, rows));
      setPhase('playing');
    }, PREVIEW_SECONDS * 1000 + 800);
    return () => {
      clearInterval(tick);
      clearTimeout(cutTimer);
      clearTimeout(playTimer);
    };
  }, [level.id, attempt, cols, rows]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Zoom the finished picture in and out for ~1s before showing the result card
  useEffect(() => {
    if (phase !== 'celebrate') return;
    const anim = Animated.sequence([
      Animated.timing(celebrateScale, {
        toValue: 1.06,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(celebrateScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);
    anim.start(({ finished }) => {
      if (finished) setPhase('won');
    });
    return () => anim.stop();
  }, [phase, celebrateScale]);

  const handleMove = useCallback(
    (next: number[]) => {
      setOrder(next);
      const newMoves = moves + 1;
      setMoves(newMoves);
      if (isSolved(next)) {
        setPhase('celebrate');
        playSound('win');
        setPeeking(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => {},
        );
        saveScore(level.id, newMoves, seconds).then((r) => {
          setRecord(r.scores[level.id]);
          setIsRecord(r.isRecord);
        });
      }
    },
    [moves, seconds, level.id],
  );

  const boardSize = useMemo(() => {
    const maxW = win.width - 32;
    const maxH = win.height - insets.top - insets.bottom - 270;
    const scale = Math.min(maxW / aspect, maxH);
    return { width: Math.floor(scale * aspect), height: Math.floor(scale) };
  }, [win.width, win.height, insets.top, insets.bottom, aspect]);

  const nextLevel = LEVELS.find((l) => l.id === level.id + 1);
  const showFull = phase === 'preview' || peeking;

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            playSound('click');
            onExit();
          }}
          accessibilityLabel={t('menu')}
          hitSlop={12}
        >
          <Text style={styles.link}>{t('menuBack')}</Text>
        </Pressable>
        <Text style={styles.title}>
          {t('levelTitle', { n: level.id, p: pieceCount(level) })}
        </Text>
        <View style={{ width: 56 }} />
      </View>

      <View style={styles.stats}>
        <Text style={styles.stat}>{t('moves', { n: moves })}</Text>
        <Text style={styles.stat}>
          {t('time', { t: formatTime(seconds) })}
        </Text>
      </View>

      <View style={styles.boardWrap}>
        <Animated.View style={{ transform: [{ scale: celebrateScale }] }}>
        <PuzzleBoard
          uri={image.uri}
          width={boardSize.width}
          height={boardSize.height}
          cols={cols}
          rows={rows}
          order={order}
          mode={showFull ? 'full' : 'pieces'}
          solved={phase === 'celebrate' || phase === 'won'}
          interactive={phase === 'playing'}
          onMove={handleMove}
        />
        </Animated.View>
        {phase === 'preview' && (
          <View style={styles.badge} pointerEvents="none">
            <Text style={styles.badgeText}>
              {t('memorize')} {countdown > 0 ? countdown : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          style={[styles.button, phase !== 'playing' && styles.disabled]}
          disabled={phase !== 'playing'}
          onPressIn={() => {
            playSound('click');
            setPeeking(true);
          }}
          onPressOut={() => setPeeking(false)}
        >
          <Text style={styles.buttonText}>{t('peek')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.button, phase === 'celebrate' && styles.disabled]}
          disabled={phase === 'celebrate'}
          onPress={() => {
            playSound('click');
            setAttempt((a) => a + 1);
          }}
        >
          <Text style={styles.buttonText}>{t('restart')}</Text>
        </Pressable>
      </View>

      {phase === 'won' && (
        <View style={styles.winOverlay}>
          <View style={styles.winCard}>
            <Text style={styles.winTitle}>{t('solved')}</Text>
            <Text style={styles.winText}>
              {t('result', { moves, time: formatTime(seconds) })}
            </Text>
            {isRecord && <Text style={styles.record}>{t('newBest')}</Text>}
            {!isRecord && record && (
              <Text style={styles.winText}>
                {t('best', { n: record.moves })}
              </Text>
            )}
            {nextLevel && (
              <Pressable
                accessibilityRole="button"
                style={[styles.button, styles.primary]}
                onPress={() => {
                  playSound('click');
                  onSelectLevel(nextLevel);
                }}
              >
                <Text style={styles.buttonText}>{t('nextLevel')}</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              style={styles.button}
              onPress={() => {
                playSound('click');
                setAttempt((a) => a + 1);
              }}
            >
              <Text style={styles.buttonText}>{t('playAgain')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={styles.button}
              onPress={() => {
                playSound('click');
                onExit();
              }}
            >
              <Text style={styles.buttonText}>{t('menu')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: { color: colors.accent, fontSize: 16, width: 56 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  stat: { color: colors.muted, fontSize: 16 },
  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  actions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  button: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.accent },
  disabled: { opacity: 0.4 },
  buttonText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  winOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  winCard: {
    width: '88%',
    backgroundColor: colors.bg,
    borderRadius: 18,
    padding: 20,
    gap: 10,
    alignItems: 'stretch',
  },
  winTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  winText: { color: colors.muted, fontSize: 16, textAlign: 'center' },
  record: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
