import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export type SoundName = 'click' | 'pick' | 'drop' | 'win';

const sources: Record<SoundName, number> = {
  click: require('../assets/sounds/click.wav'),
  pick: require('../assets/sounds/pick.wav'),
  drop: require('../assets/sounds/drop.wav'),
  win: require('../assets/sounds/win.wav'),
};

let enabled = true;
let audioModeSet = false;
const players: Partial<Record<SoundName, AudioPlayer>> = {};

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  try {
    if (!audioModeSet) {
      audioModeSet = true;
      // Don't interrupt the user's music with short effects
      setAudioModeAsync({ interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    let player = players[name];
    if (!player) {
      player = createAudioPlayer(sources[name]);
      players[name] = player;
    }
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // sound is non-essential
  }
}
