import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  Button,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { transcription } from "@/lib/transcription";

const videoSource =
  "https://firebasestorage.googleapis.com/v0/b/transcrybe-fe4cb.appspot.com/o/videos%2F00b680ed-e60b-4af8-aaf7-4cc8c34d7b48.mp4?alt=media&token=98b2936e-9014-4348-9562-85d20dd39d4a";

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

export default function HomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeState, setCurrentTimeState] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useSharedValue(0);
  const [contentHeight, setContentHeight] = useState(0);

  const player = useVideoPlayer(videoSource);

  useEffect(() => {
    if (player) {
      player.loop = true;
    }
  }, [player]);

  const onPlayPausePress = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPlaying, player]);

  const seekVideo = useCallback(
    (direction: "forward" | "backward") => {
      if (player && player.currentTime !== null) {
        const delta = direction === "forward" ? SEEK_INTERVAL : -SEEK_INTERVAL;
        let newTime = player.currentTime + delta;

        // Ensure newTime is within valid bounds
        newTime = Math.max(0, Math.min(newTime, player.duration || 0));

        // Seek to the new time by setting currentTime
        player.currentTime = newTime;

        // Update the current time state
        setCurrentTimeState(newTime);
      }
    },
    [player]
  );

  useEffect(() => {
    if (!player) return;

    const playingSubscription = player.addListener(
      "playingChange",
      (newIsPlaying) => {
        runOnJS(setIsPlaying)(newIsPlaying);
      }
    );

    const intervalId = setInterval(() => {
      if (player.currentTime !== null) {
        runOnJS(setCurrentTimeState)(player.currentTime);
      }
    }, 100);

    return () => {
      playingSubscription.remove();
      clearInterval(intervalId);
    };
  }, [player]);

  useEffect(() => {
    if (isPlaying && player.duration && contentHeight > 300) {
      const maxScroll = contentHeight - 300;
      const scrollPosition = (currentTimeState / player.duration) * maxScroll;
      scrollY.value = withTiming(scrollPosition, { duration: 100 });
    }
  }, [currentTimeState, isPlaying, player.duration, contentHeight]);

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
        {player && (
          <VideoView
            style={styles.video}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
          />
        )}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            onPress={() => seekVideo("backward")}
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
            onPress={() => seekVideo("forward")}
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
});
