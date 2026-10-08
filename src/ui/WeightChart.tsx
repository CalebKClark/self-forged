import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { ChartPoint, pickChartPoints } from '../lib/chartPoints';
import { colors } from './theme';

type WeightChartProps = {
  title?: string;
  points: ChartPoint[];
  accent?: string;
  emptyText?: string;
};

export function WeightChart({
  title,
  points,
  accent = colors.gold,
  emptyText = 'No data yet!',
}: WeightChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.max(280, screenWidth - 64);
  const height = 220;
  const padLeft = 52;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 36;
  const selected = useMemo(() => pickChartPoints(points), [points]);
  const hasData = selected.length > 0;
  const weights = selected.map((point) => point.weight);
  const minWeight = hasData ? Math.min(...weights) : 0;
  const maxWeight = hasData ? Math.max(...weights) : 1;
  const range = maxWeight - minWeight || 1;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  function xFor(index: number) {
    if (selected.length === 1) {
      return padLeft + plotWidth / 2;
    }
    return padLeft + (index / (selected.length - 1)) * plotWidth;
  }

  function yFor(weight: number) {
    if (maxWeight === minWeight) {
      return padTop + plotHeight / 2;
    }
    return padTop + (1 - (weight - minWeight) / range) * plotHeight;
  }

  const polyline = selected.map((point, index) => `${xFor(index)},${yFor(point.weight)}`).join(' ');
  const yTicks = hasData
    ? minWeight === maxWeight
      ? [minWeight]
      : [maxWeight, (minWeight + maxWeight) / 2, minWeight]
    : [];

  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.chartWrap}>
        <Svg width={width} height={height}>
          <Line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={height - padBottom}
            stroke={colors.border}
            strokeWidth={1}
          />
          <Line
            x1={padLeft}
            y1={height - padBottom}
            x2={width - padRight}
            y2={height - padBottom}
            stroke={colors.border}
            strokeWidth={1}
          />
          {yTicks.map((tick, index) => (
            <SvgText
              key={`y-${index}-${tick}`}
              x={padLeft - 8}
              y={yFor(tick) + 4}
              fontSize={11}
              fill={colors.muted}
              textAnchor="end"
            >
              {formatTick(tick)}
            </SvgText>
          ))}
          {hasData ? <Polyline points={polyline} fill="none" stroke={accent} strokeWidth={2.5} /> : null}
          {selected.map((point, index) => (
            <Circle
              key={point.id}
              cx={xFor(index)}
              cy={yFor(point.weight)}
              r={point.increased ? 6 : 5}
              fill={point.increased ? colors.success : accent}
            />
          ))}
          {selected.map((point, index) => (
            <SvgText
              key={`x-${point.id}`}
              x={xFor(index)}
              y={height - 12}
              fontSize={10}
              fill={colors.muted}
              textAnchor="middle"
            >
              {formatShortDate(point.date)}
            </SvgText>
          ))}
        </Svg>
        {hasData ? null : (
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function formatShortDate(date: string): string {
  const [, month, day] = date.split('-');
  return `${Number(month)}/${Number(day)}`;
}

function formatTick(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(1).replace(/\.0$/, '');
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 16,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    paddingHorizontal: 16,
    color: colors.text,
  },
  chartWrap: {
    position: 'relative',
  },
  emptyOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.muted,
  },
});
