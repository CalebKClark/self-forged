import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { streakTier } from '../lib/streakVisual';
import { colors } from './theme';

type StreakVisualProps = {
  count: number;
  label: string;
  accent: string;
  locked?: boolean;
  lockedText?: string;
  best?: number | string;
  showNone?: boolean;
  compact?: boolean;
};

export function StreakVisual({
  count,
  label,
  accent,
  locked,
  lockedText,
  best,
  showNone,
  compact,
}: StreakVisualProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const tier = streakTier(locked ? 0 : count);

  useEffect(() => {
    if (tier < 5) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, tier]);

  const size = (compact ? 56 : 72) + Math.min(tier === 30 ? 28 : tier >= 10 ? 16 : tier, compact ? 12 : 20);
  const glowOpacity = locked ? 0 : Math.min(0.55, 0.08 + tier * 0.02);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.label}>{label}</Text>
      {locked ? (
        <Text style={styles.locked}>{lockedText ?? 'Locked until setup is complete'}</Text>
      ) : (
        <>
          <Animated.View
            style={[
              styles.orb,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: accent,
                shadowColor: accent,
                shadowOpacity: glowOpacity + (tier >= 20 ? 0.25 : 0),
                shadowRadius: 8 + tier,
                transform: [{ scale: pulse }],
              },
            ]}
          >
            <View
              style={[
                styles.core,
                {
                  backgroundColor: accent,
                  opacity: 0.12 + Math.min(tier, 30) / 80,
                },
              ]}
            />
            <Text style={[styles.count, { color: accent, fontSize: tier >= 10 ? 28 : 24 }]}>
              {showNone && count <= 0 ? '—' : count}
            </Text>
          </Animated.View>
          <Text style={[styles.tier, { color: accent }]}>{tierLabel(tier)}</Text>
          {best !== undefined ? (
            <Text style={styles.best}>
              Best {typeof best === 'number' && best <= 0 && showNone ? 'None' : best}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}

function tierLabel(tier: number): string {
  if (tier >= 30) {
    return 'LOCKED IN';
  }
  if (tier >= 20) {
    return 'UNSTOPPABLE';
  }
  if (tier >= 10) {
    return 'ON FIRE';
  }
  if (tier >= 5) {
    return 'BUILDING';
  }
  if (tier >= 3) {
    return 'HEATING UP';
  }
  if (tier >= 1) {
    return 'STARTED';
  }
  return 'READY';
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  wrapCompact: {
    paddingVertical: 0,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  orb: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  core: {
    ...StyleSheet.absoluteFill,
  },
  count: {
    fontWeight: '800',
  },
  tier: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  best: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  locked: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});
