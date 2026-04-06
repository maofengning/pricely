import { useMemo } from 'react';
import type { Pattern, PatternMarkerData } from '@/types';
import { PATTERN_TYPE_COLORS, PATTERN_TYPE_LABELS } from '@/types';

/**
 * Convert patterns to chart marker data for lightweight-charts
 */
export function usePatternMarkers(
  patterns: Pattern[]
): PatternMarkerData[] {
  return useMemo(() => {
    if (!patterns.length) return [];

    const markers: PatternMarkerData[] = [];

    patterns.forEach((pattern) => {
      const color = PATTERN_TYPE_COLORS[pattern.patternType] || '#2962ff';
      const label = PATTERN_TYPE_LABELS[pattern.patternType] || pattern.patternType;

      // Determine marker position based on pattern type
      const isTopPattern = pattern.patternType === 'head_shoulders_top' ||
        pattern.patternType === 'evening_star';
      const position = isTopPattern ? 'aboveBar' : 'belowBar';

      // Determine shape based on pattern type
      const shape: 'arrowUp' | 'arrowDown' | 'circle' =
        pattern.patternType.includes('top') ? 'arrowDown' :
          pattern.patternType.includes('bottom') ? 'arrowUp' : 'circle';

      // Add start marker
      const startTime = Math.floor(new Date(pattern.startTime).getTime() / 1000);
      markers.push({
        id: `${pattern.id}-start`,
        time: startTime,
        position,
        color,
        shape: shape === 'circle' ? 'circle' : shape,
        text: `${label} (起点)`,
      });

      // Add end marker if endTime is different
      const endTime = Math.floor(new Date(pattern.endTime).getTime() / 1000);
      if (endTime !== startTime) {
        markers.push({
          id: `${pattern.id}-end`,
          time: endTime,
          position,
          color,
          shape: shape === 'circle' ? 'circle' : shape,
          text: `${label} (终点)`,
        });
      }
    });

    // Sort markers by time
    return markers.sort((a, b) => a.time - b.time);
  }, [patterns]);
}