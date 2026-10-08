import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from './theme';

const PIECES = 28;
const PALETTE = [colors.gold, colors.diet, colors.gym, colors.tasks, colors.weekly, colors.success];

export function ConfettiBurst({ play }: { play: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, index) => ({
        left: `${(index * 37) % 100}%` as const,
        color: PALETTE[index % PALETTE.length],
        delay: (index % 7) * 40,
        drift: ((index % 5) - 2) * 18,
        size: 6 + (index % 5),
      })),
    []
  );
  const anims = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!play) {
      anims.forEach((value) => value.setValue(0));
      return;
    }
    const loops = anims.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 1400,
        delay: pieces[index].delay,
        useNativeDriver: true,
      })
    );
    const run = Animated.stagger(20, loops);
    run.start();
    return () => run.stop();
  }, [anims, pieces, play]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, index) => (
        <Animated.View
          key={`${piece.color}-${index}`}
          style={[
            styles.piece,
            {
              left: piece.left,
              width: piece.size,
              height: piece.size * 1.6,
              backgroundColor: piece.color,
              opacity: anims[index].interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
              transform: [
                {
                  translateY: anims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 420],
                  }),
                },
                {
                  translateX: anims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, piece.drift],
                  }),
                },
                {
                  rotate: anims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${120 + index * 20}deg`],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 40,
    borderRadius: 2,
  },
});
