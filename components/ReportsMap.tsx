import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Brand, Font, Shadow } from '@/constants/theme';
import { StatusPill } from '@/components/ui/kit';
import { IcoChevronRight } from '@/components/ui/icons';
import { IRELAND_PATHS, IRELAND_VIEWBOX, projectIreland } from '@/lib/irelandOutline';
import { useReportLocations } from '@/lib/reportLocations';
import type { Report } from '@/lib/reports';

export interface MapItem { report: Report; title: string; location: string }

const PIN_W = 26;
const PIN_H = 34;
const CARD_W = 230;

/** Every report pinned where its site is, on an outline of Ireland. Pins are
 *  green when the report is complete and amber while it's a draft.
 *  With a mouse, hovering a pin names it and clicking opens the report; on a
 *  touchscreen the first tap names it and tapping the card opens it. */
export function ReportsMap({
  items, onOpen, highlightId, style,
}: {
  items: MapItem[];
  onOpen: (r: Report) => void;
  /** A report to lift and name, e.g. the row under the mouse in the table. */
  highlightId?: string | null;
  style?: StyleProp<ViewStyle>;
}) {
  const [width, setWidth] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const coords = useReportLocations(items.map((i) => i.report));

  const scale = width / IRELAND_VIEWBOX.width;
  const height = IRELAND_VIEWBOX.height * scale;

  const pins = useMemo(() => items
    .map((item) => {
      const c = coords.get(item.report.id);
      if (!c) return null;
      const p = projectIreland(c.lon, c.lat);
      return { item, approx: c.approx, x: p.x * scale, y: p.y * scale };
    })
    .filter((p): p is NonNullable<typeof p> => !!p)
    // Southern pins drawn last, so each pin's head sits over the one above it.
    .sort((a, b) => a.y - b.y),
  [items, coords, scale]);

  const activeId = hoverId ?? highlightId ?? selectedId;
  const active = pins.find((p) => p.item.report.id === activeId) ?? null;
  const unplaced = items.length - pins.length;

  return (
    <View style={style}>
      <Pressable
        onPress={() => setSelectedId(null)}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[styles.map, { height: height || undefined, aspectRatio: height ? undefined : IRELAND_VIEWBOX.width / IRELAND_VIEWBOX.height }]}
        accessible={false}
      >
        {width > 0 && (
          <Svg width={width} height={height} viewBox={`0 0 ${IRELAND_VIEWBOX.width} ${IRELAND_VIEWBOX.height}`}>
            {IRELAND_PATHS.map((d, i) => (
              <Path key={i} d={d} fill={LAND} stroke={COAST} strokeWidth={2.2} strokeLinejoin="round" />
            ))}
          </Svg>
        )}

        {pins.map(({ item, x, y }) => {
          const id = item.report.id;
          const lifted = id === activeId;
          const color = item.report.status === 'completed' ? Brand.primary : Brand.amber;
          return (
            <Pressable
              key={id}
              onPress={() => {
                // A mouse has already shown the card on hover, so a click opens.
                if (Platform.OS === 'web' && hoverId === id) onOpen(item.report);
                else setSelectedId(id);
              }}
              onHoverIn={() => setHoverId(id)}
              onHoverOut={() => setHoverId((h) => (h === id ? null : h))}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}${item.location ? `, ${item.location}` : ''}`}
              hitSlop={6}
              style={[
                styles.pin,
                { left: x - PIN_W / 2, top: y - PIN_H, zIndex: lifted ? 5 : 1 },
                lifted && styles.pinLifted,
              ]}
            >
              <Svg width={PIN_W} height={PIN_H} viewBox="0 0 26 34">
                <Path d="M13 33s11-10.6 11-19.5C24 7.1 19.1 2 13 2S2 7.1 2 13.5C2 22.4 13 33 13 33z"
                  fill={color} stroke="#fff" strokeWidth={2} />
                <Circle cx={13} cy={13.5} r={4.2} fill="#fff" />
              </Svg>
            </Pressable>
          );
        })}

        {active && width > 0 && (
          <Pressable
            onPress={() => onOpen(active.item.report)}
            onHoverIn={() => setHoverId(active.item.report.id)}
            onHoverOut={() => setHoverId(null)}
            style={({ hovered }: any) => [
              styles.card,
              placeCard(active.x, active.y, width, height),
              hovered && { borderColor: Brand.primaryMid },
            ]}
          >
            <Text numberOfLines={1} style={styles.cardTitle}>{active.item.title}</Text>
            {active.item.location ? <Text numberOfLines={2} style={styles.cardSub}>{active.item.location}</Text> : null}
            <View style={styles.cardRow}>
              <StatusPill status={active.item.report.status === 'completed' ? 'completed' : 'draft'} />
              {active.approx && <Text style={styles.approx}>Approx. location</Text>}
            </View>
            <View style={styles.cardOpen}>
              <Text style={styles.cardOpenText}>Open report</Text>
              <IcoChevronRight size={16} color={Brand.primary} />
            </View>
          </Pressable>
        )}
      </Pressable>

      <View style={styles.legend}>
        <LegendDot color={Brand.primary} label="Complete" />
        <LegendDot color={Brand.amber} label="Draft" />
        <View style={{ flex: 1 }} />
        {unplaced > 0 && (
          <Text style={styles.unplaced}>
            {unplaced} without a location
          </Text>
        )}
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

/** Puts the card beside the pin, above it unless there's no room, and inside the map. */
function placeCard(x: number, y: number, w: number, h: number): ViewStyle {
  const cardW = Math.min(CARD_W, w - 16);
  const left = Math.max(8, Math.min(w - cardW - 8, x - cardW / 2));
  const above = y - PIN_H - 8 > 130;
  return above
    ? { left, width: cardW, bottom: h - (y - PIN_H - 8) }
    : { left, width: cardW, top: Math.min(h - 130, y + 8) };
}

const LAND = '#E4EFE7';
const COAST = '#B7D0BF';

const styles = StyleSheet.create({
  map: { width: '100%', position: 'relative', overflow: 'hidden' },
  pin: { position: 'absolute', width: PIN_W, height: PIN_H, cursor: 'pointer' } as any,
  pinLifted: { transform: [{ scale: 1.22 }, { translateY: -3 }] },
  card: {
    position: 'absolute', zIndex: 10, backgroundColor: Brand.surface, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Brand.borderLight, ...Shadow.floating, cursor: 'pointer',
  } as any,
  cardTitle: { fontSize: 14.5, fontFamily: Font.semibold, color: Brand.text },
  cardSub: { fontSize: 12.5, fontFamily: Font.regular, color: Brand.textSub, marginTop: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  approx: { fontSize: 11.5, fontFamily: Font.medium, color: Brand.textMuted },
  cardOpen: {
    flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 10, paddingTop: 9,
    borderTopWidth: 1, borderTopColor: Brand.borderLight,
  },
  cardOpenText: { fontSize: 13, fontFamily: Font.semibold, color: Brand.primary },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 12, fontFamily: Font.medium, color: Brand.textSub },
  unplaced: { fontSize: 12, fontFamily: Font.regular, color: Brand.textMuted },
});
