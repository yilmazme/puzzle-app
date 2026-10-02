import React, { useEffect, useState } from 'react';
import { Alert, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { Level, LEVELS } from './src/game/puzzle';
import { pickImage, PuzzleImage } from './src/image';
import { loadScores, Scores } from './src/storage';

export default function App() {
  const [image, setImage] = useState<PuzzleImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState<Level>(LEVELS[0]);
  const [scores, setScores] = useState<Scores>({});
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    loadScores().then(setScores);
  }, []);

  const handleExit = () => {
    setPlaying(false);
    loadScores().then(setScores);
  };

  // Hardware back returns to the menu instead of closing the app mid-game
  useEffect(() => {
    if (!playing) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });
    return () => sub.remove();
  }, [playing]);

  const handlePick = async () => {
    setLoading(true);
    try {
      const picked = await pickImage();
      if (picked) setImage(picked);
    } catch {
      Alert.alert('Could not load the photo', 'Please try another image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {playing && image ? (
        <GameScreen
          key={level.id}
          image={image}
          level={level}
          onExit={handleExit}
          onSelectLevel={setLevel}
        />
      ) : (
        <HomeScreen
          image={image}
          loading={loading}
          level={level}
          scores={scores}
          onPick={handlePick}
          onSelectLevel={setLevel}
          onStart={() => setPlaying(true)}
        />
      )}
    </SafeAreaProvider>
  );
}
