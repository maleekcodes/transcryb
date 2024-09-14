import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { transcription } from "@/lib/transcription";
import Waveform from "@/components/WaveForm";
import AudioWaveform from "@/components/AudioWaveform";

interface WordType {
  end: number;
  word: string;
  start: number;
  probability?: number;
}
interface WordProps {
  word: WordType;
  isHighlighted: boolean;
}

const Word: React.FC<WordProps> = React.memo(({ word, isHighlighted }) => (
  <Text style={[styles.word, isHighlighted && styles.highlightedWord]}>
    {word.word}
  </Text>
));

const SEEK_INTERVAL = 10;
const audioSource =
  "https://firebasestorage.googleapis.com/v0/b/transcrybe-fe4cb.appspot.com/o/videos%2F00b680ed-e60b-4af8-aaf7-4cc8c34d7b48.mp4?alt=media&token=98b2936e-9014-4348-9562-85d20dd39d4a";

export default function TabTwoScreen() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeState, setCurrentTimeState] = useState(0);
  const [duration, setDuration] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useSharedValue(0);
  const [contentHeight, setContentHeight] = useState(0);

  // Determine the start time of the first transcription item
  const transcriptionStartTime = transcription[0]?.start || 0;

  useEffect(() => {
    async function loadAudio() {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioSource },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(sound);
    }

    loadAudio();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentTimeState(status.positionMillis / 1000);
      setIsPlaying(status.isPlaying);
      if (status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }
    }
  };

  const onPlayPausePress = useCallback(async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    }
  }, [isPlaying, sound]);

  const seekAudio = useCallback(
    async (direction: "forward" | "backward") => {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          const delta =
            direction === "forward"
              ? SEEK_INTERVAL * 1000
              : -SEEK_INTERVAL * 1000;
          let newPosition = status.positionMillis + delta;
          newPosition = Math.max(
            0,
            Math.min(newPosition, status.durationMillis || 0)
          );
          await sound.setPositionAsync(newPosition);
        }
      }
    },
    [sound]
  );

  useEffect(() => {
    if (duration && contentHeight > 300) {
      const maxScroll = contentHeight - 300;
      const scrollPosition = (currentTimeState / duration) * maxScroll;
      scrollY.value = withTiming(scrollPosition, { duration: 100 });
    }
  }, [currentTimeState, duration, contentHeight]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -scrollY.value }],
    };
  });

  const renderTranscription = useCallback(() => {
    return transcription.map((item, index) => (
      <View key={index} style={styles.transcriptionItem}>
        <Text style={styles.speaker}>{item.speaker}</Text>
        <View style={styles.wordsContainer}>
          {item.words.map((word, wordIndex) => (
            <Word
              key={wordIndex}
              word={word}
              isHighlighted={
                currentTimeState >= word.start && currentTimeState <= word.end
              }
            />
          ))}
        </View>
      </View>
    ));
  }, [currentTimeState]);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.audioPlayerContainer}>
          <Waveform
            width={200}
            height={100}
            color="#ff6b6b"
            isPlaying={isPlaying && currentTimeState >= transcriptionStartTime}
          />
        </View>
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            onPress={() => seekAudio("backward")}
            style={styles.controlButton}
          >
            <Ionicons name="play-back" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPlayPausePress}
            style={styles.controlButton}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={24}
              color="black"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => seekAudio("forward")}
            style={styles.controlButton}
          >
            <Ionicons name="play-forward" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.transcriptionContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            scrollEnabled={false}
          >
            <Animated.View
              style={[styles.animatedContent, animatedStyle]}
              onLayout={(event) =>
                setContentHeight(event.nativeEvent.layout.height)
              }
            >
              {renderTranscription()}
            </Animated.View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  audioPlayerContainer: {
    width: width - 20,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#FEE1BA",
    borderRadius: 20,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  video: {
    width: width - 20,
    aspectRatio: 16 / 9,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  controlButton: {
    marginHorizontal: 20,
  },
  transcriptionContainer: {
    width: "100%",
    height: 300,
  },
  scrollView: {
    flex: 1,
  },
  animatedContent: {
    width: "100%",
  },
  transcriptionItem: {
    marginBottom: 10,
  },
  speaker: {
    color: "#4aaee7",
    fontWeight: "bold",
    marginBottom: 5,
  },
  wordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  word: {
    marginRight: 5,
  },
  highlightedWord: {
    backgroundColor: "yellow",
    fontWeight: "bold",
  },
  audioPlayerPlaceholder: {
    width: width - 20,
    height: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
});
