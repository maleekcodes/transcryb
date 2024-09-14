import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MAX_BAR_HEIGHT = 10;
const NUM_BARS = Math.floor(SCREEN_WIDTH / (BAR_WIDTH + BAR_GAP));

interface AudioWaveformProps {
  progress: number; // 0 to 1
  isPlaying: boolean;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  progress,
  isPlaying,
}) => {
  const generateBars = () => {
    return Array.from({ length: NUM_BARS }).map((_, index) => {
      const height = Math.random() * MAX_BAR_HEIGHT + 10;
      const opacity = index / NUM_BARS <= progress ? 1 : 0.5;

      return (
        <Rect
          key={index}
          x={index * (BAR_WIDTH + BAR_GAP)}
          y={MAX_BAR_HEIGHT - height}
          width={BAR_WIDTH}
          height={height}
          fill={isPlaying ? "#ff6b6b" : "#4aaee7"}
          opacity={opacity}
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      <Svg height={MAX_BAR_HEIGHT} width={SCREEN_WIDTH}>
        {generateBars()}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: MAX_BAR_HEIGHT,
    width: SCREEN_WIDTH,
    backgroundColor: "transparent",
  },
});

export default AudioWaveform;
