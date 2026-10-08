export type Language = 'en' | 'tr' | 'es';

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'es', label: 'Español' },
];

const en = {
  subtitle: 'Pick a photo, memorize it, then swap the pieces back into place.',
  tapToChoose: 'Tap to choose a photo.',
  choosePhoto: 'Choose photo',
  changePhoto: 'Change photo',
  start: 'Start',
  difficulty: 'Difficulty',
  level: 'Level {n}',
  pieces: '{n} pieces',
  bestMoves: '★ {n} moves',
  settings: 'Settings',
  soundEffects: 'Sound effects',
  language: 'Language',
  photoErrorTitle: 'Could not load the photo',
  photoErrorMessage: 'Please try another image.',
  menu: 'Menu',
  menuBack: '‹ Menu',
  levelTitle: 'Level {n} · {p} pieces',
  moves: 'Moves: {n}',
  time: 'Time: {t}',
  memorize: 'Memorize it…',
  peek: 'Hold to peek',
  restart: 'Restart',
  solved: 'Puzzle solved! 🎉',
  result: '{moves} moves · {time}',
  newBest: 'New best!',
  best: 'Best: {n} moves',
  nextLevel: 'Next level',
  playAgain: 'Play again',
  errorTitle: 'Something went wrong',
  errorMessage: 'The app ran into an unexpected problem.',
  tryAgain: 'Try again',
};

export type TranslationKey = keyof typeof en;

const tr: Record<TranslationKey, string> = {
  subtitle:
    'Bir fotoğraf seç, aklında tut, sonra parçaları yerlerine geri değiştir.',
  tapToChoose: 'Fotoğraf seçmek için dokun.',
  choosePhoto: 'Fotoğraf seç',
  changePhoto: 'Fotoğrafı değiştir',
  start: 'Başla',
  difficulty: 'Zorluk',
  level: 'Seviye {n}',
  pieces: '{n} parça',
  bestMoves: '★ {n} hamle',
  settings: 'Ayarlar',
  soundEffects: 'Ses efektleri',
  language: 'Dil',
  photoErrorTitle: 'Fotoğraf yüklenemedi',
  photoErrorMessage: 'Lütfen başka bir görsel dene.',
  menu: 'Menü',
  menuBack: '‹ Menü',
  levelTitle: 'Seviye {n} · {p} parça',
  moves: 'Hamle: {n}',
  time: 'Süre: {t}',
  memorize: 'Aklında tut…',
  peek: 'Basılı tutarak bak',
  restart: 'Yeniden başla',
  solved: 'Bulmaca çözüldü! 🎉',
  result: '{moves} hamle · {time}',
  newBest: 'Yeni rekor!',
  best: 'En iyi: {n} hamle',
  nextLevel: 'Sonraki seviye',
  playAgain: 'Tekrar oyna',
  errorTitle: 'Bir şeyler ters gitti',
  errorMessage: 'Uygulama beklenmedik bir sorunla karşılaştı.',
  tryAgain: 'Tekrar dene',
};

const es: Record<TranslationKey, string> = {
  subtitle:
    'Elige una foto, memorízala y luego intercambia las piezas para volver a armarla.',
  tapToChoose: 'Toca para elegir una foto.',
  choosePhoto: 'Elegir foto',
  changePhoto: 'Cambiar foto',
  start: 'Empezar',
  difficulty: 'Dificultad',
  level: 'Nivel {n}',
  pieces: '{n} piezas',
  bestMoves: '★ {n} movimientos',
  settings: 'Ajustes',
  soundEffects: 'Efectos de sonido',
  language: 'Idioma',
  photoErrorTitle: 'No se pudo cargar la foto',
  photoErrorMessage: 'Prueba con otra imagen.',
  menu: 'Menú',
  menuBack: '‹ Menú',
  levelTitle: 'Nivel {n} · {p} piezas',
  moves: 'Movimientos: {n}',
  time: 'Tiempo: {t}',
  memorize: 'Memorízala…',
  peek: 'Mantén para ver',
  restart: 'Reiniciar',
  solved: '¡Puzzle resuelto! 🎉',
  result: '{moves} movimientos · {time}',
  newBest: '¡Nuevo récord!',
  best: 'Mejor: {n} movimientos',
  nextLevel: 'Siguiente nivel',
  playAgain: 'Jugar de nuevo',
  errorTitle: 'Algo salió mal',
  errorMessage: 'La aplicación tuvo un problema inesperado.',
  tryAgain: 'Reintentar',
};

const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  en,
  tr,
  es,
};

export type Params = Record<string, string | number>;

export function translate(
  lang: Language,
  key: TranslationKey,
  params?: Params,
): string {
  let text = dictionaries[lang][key];
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

export function deviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
    const code = locale.slice(0, 2).toLowerCase();
    return LANGUAGES.some((l) => l.code === code) ? (code as Language) : 'en';
  } catch {
    return 'en';
  }
}

export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some((l) => l.code === value);
