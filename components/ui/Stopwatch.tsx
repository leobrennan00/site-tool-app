import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Brand, Font } from '@/constants/theme';

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function nowAsHHmm(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface StopwatchProps {
  startValue: string;
  finishValue: string;
  onStart: (hhmm: string) => void;
  onStop: (hhmm: string) => void;
}

/**
 * A live start/stop timer for percolation readings, sitting alongside the
 * existing Start Time / Finish Time fields (which stay manually editable —
 * this is a faster path, not a replacement). Tapping Start stamps the
 * current time into the start field and begins ticking; tapping Stop
 * stamps the finish field. "Running" is derived from the field values
 * themselves (start set, finish not) so it stays correct after reloading a
 * saved report, not just within one session.
 */
export function Stopwatch({ startValue, finishValue, onStart, onStop }: StopwatchProps) {
  const running = !!startValue.trim() && !finishValue.trim();
  const startedAtRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) {
      startedAtRef.current = null;
      setElapsed(0);
      return;
    }
    if (startedAtRef.current === null) startedAtRef.current = Date.now();
    const tick = () => setElapsed(Math.floor((Date.now() - (startedAtRef.current as number)) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = pad(Math.floor(elapsed / 60));
  const ss = pad(elapsed % 60);

  return (
    <View style={styles.row}>
      {running ? (
        <>
          <Text style={styles.elapsed}>⏱ {mm}:{ss}</Text>
          <Pressable style={styles.stopBtn} onPress={() => onStop(nowAsHHmm())}>
            <Text style={styles.stopBtnText}>Stop</Text>
          </Pressable>
        </>
      ) : (
        <Pressable style={styles.startBtn} onPress={() => onStart(nowAsHHmm())}>
          <Text style={styles.startBtnText}>▶ Start timer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  startBtn: {
    borderWidth: 1.5, borderColor: Brand.primary, borderRadius: 10, paddingVertical: 8,
    paddingHorizontal: 12, backgroundColor: Brand.primaryTint,
  },
  startBtnText: { color: Brand.primary, fontFamily: Font.semibold, fontSize: 13 },
  stopBtn: {
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: Brand.danger,
  },
  stopBtnText: { color: '#fff', fontFamily: Font.semibold, fontSize: 13 },
  elapsed: { fontFamily: Font.bold, fontSize: 15, color: Brand.text, fontVariant: ['tabular-nums'] },
});
