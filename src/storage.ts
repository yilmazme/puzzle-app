import AsyncStorage from '@react-native-async-storage/async-storage';

export type BestScore = { moves: number; seconds: number };
export type Scores = Record<number, BestScore>;

const KEY = 'puzzle.bestScores.v1';

export async function loadScores(): Promise<Scores> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Scores) : {};
  } catch {
    return {};
  }
}

export async function saveScore(
  level: number,
  moves: number,
  seconds: number,
): Promise<{ scores: Scores; isRecord: boolean }> {
  const scores = await loadScores();
  const prev = scores[level];
  const isRecord = !prev || moves < prev.moves;
  if (isRecord) scores[level] = { moves, seconds };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(scores));
  } catch {
    // best-effort persistence
  }
  return { scores, isRecord };
}
