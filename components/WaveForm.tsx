import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface WaveformProps {
  width?: number;
  height?: number;
  color?: string;
  isPlaying: boolean;
}

const Waveform: React.FC<WaveformProps> = ({
  width = 50,
  height = 38,
  color = "#FBDAFF",
  isPlaying,
}) => {
  const animatedValues = Array(9)
    .fill(0)
    .map(() => useSharedValue(0));

  useEffect(() => {
    if (isPlaying) {
      animatedValues.forEach((value, index) => {
        value.value = withRepeat(
          withTiming(1, {
            duration: 500 + index * 50, // Reduced from 1000 + index * 100
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          true
        );
      });
    } else {
      animatedValues.forEach((value) => {
        value.value = withTiming(0, { duration: 200 }); // Reduced from 300
      });
    }
  }, [isPlaying]);

  const getAnimatedProps = (index: number) => {
    return useAnimatedProps(() => {
      const scale = animatedValues[index].value;
      const y = 19 - scale * 19;
      const height = 38 * scale;
      return {
        d: `M${index * 6 + 0.91},${y}L${index * 6 + 0.78},${y}A1,1,0,0,0,${
          index * 6
        },${y + 1}v${height - 2}a1,1,0,1,0,2,0s0,0,0,0V${y + 1}a1,1,0,0,0-1-1H${
          index * 6 + 0.91
        }Z`,
      };
    });
  };

  return (
    <View style={styles.container}>
      <Svg height={height} width={width} viewBox="0 0 50 38">
        {Array(9)
          .fill(0)
          .map((_, index) => (
            <AnimatedPath
              key={index}
              fill={color}
              animatedProps={getAnimatedProps(index)}
            />
          ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Waveform;
