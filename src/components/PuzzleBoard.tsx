import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { swapSlots } from '../game/puzzle';

type Props = {
  uri: string;
  width: number;
  height: number;
  cols: number;
  rows: number;
  order: number[];
  // 'full' shows the untouched photo, 'pieces' shows the cut tiles
  mode: 'full' | 'pieces';
  solved: boolean;
  interactive: boolean;
  onMove: (next: number[]) => void;
};

type DragState = {
  from: number;
  to: number | null; // neighbouring slot the piece is being dragged onto
  dx: number; // unit direction of the drag
  dy: number;
};

const GAP = 1.5;
const DIRECTION_THRESHOLD = 4;

export function PuzzleBoard(props: Props) {
  const { uri, width, height, cols, rows, order, mode, solved } = props;
  const pw = width / cols;
  const ph = height / rows;

  const drag = useRef(new Animated.Value(0)).current;
  const [dragState, setDragState] = useState<DragState | null>(null);

  // PanResponder is created once, so it reads the latest props through a ref.
  const latest = useRef({ ...props, pw, ph });
  latest.current = { ...props, pw, ph };
  const stateRef = useRef<DragState | null>(null);
  const busy = useRef(false);

  const updateState = (next: DragState | null) => {
    const prev = stateRef.current;
    if (prev?.from === next?.from && prev?.to === next?.to) return;
    stateRef.current = next;
    setDragState(next);
  };

  const reset = () => {
    stateRef.current = null;
    busy.current = false;
    drag.setValue(0);
    setDragState(null);
  };

  const springBack = () => {
    busy.current = true;
    Animated.spring(drag, {
      toValue: 0,
      useNativeDriver: false,
      bounciness: 6,
    }).start(reset);
  };

  // Returns the dragged distance along the current direction, clamped to one slot.
  const project = (s: DragState, gx: number, gy: number) => {
    const { pw: w, ph: h } = latest.current;
    const size = s.dx !== 0 ? w : h;
    return { size, dist: Math.max(0, Math.min(size, s.dx * gx + s.dy * gy)) };
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          latest.current.interactive && !busy.current,
        onMoveShouldSetPanResponder: () =>
          latest.current.interactive && !busy.current,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          const { cols: cs, rows: rs, pw: w, ph: h } = latest.current;
          const col = Math.min(cs - 1, Math.max(0, Math.floor(evt.nativeEvent.locationX / w)));
          const row = Math.min(rs - 1, Math.max(0, Math.floor(evt.nativeEvent.locationY / h)));
          drag.setValue(0);
          stateRef.current = null;
          updateState({ from: row * cs + col, to: null, dx: 0, dy: 0 });
        },
        onPanResponderMove: (_, g) => {
          const s = stateRef.current;
          if (!s) return;
          const { cols: cs, rows: rs } = latest.current;
          if (Math.max(Math.abs(g.dx), Math.abs(g.dy)) < DIRECTION_THRESHOLD) return;

          // Lock to the dominant axis; the piece can only go to an adjacent slot
          const horizontal = Math.abs(g.dx) >= Math.abs(g.dy);
          const dx = horizontal ? Math.sign(g.dx) : 0;
          const dy = horizontal ? 0 : Math.sign(g.dy);
          const col = (s.from % cs) + dx;
          const row = Math.floor(s.from / cs) + dy;
          const inBounds = col >= 0 && col < cs && row >= 0 && row < rs;
          const next: DragState = {
            from: s.from,
            to: inBounds ? row * cs + col : null,
            dx,
            dy,
          };
          updateState(next);
          drag.setValue(inBounds ? project(next, g.dx, g.dy).dist : 0);
        },
        onPanResponderRelease: (_, g) => {
          const s = stateRef.current;
          if (!s || s.to === null) {
            reset();
            return;
          }
          const { size, dist } = project(s, g.dx, g.dy);
          const velocity = s.dx * g.vx + s.dy * g.vy;
          if (dist > size * 0.4 || velocity > 0.6) {
            busy.current = true;
            Haptics.selectionAsync().catch(() => {});
            Animated.timing(drag, {
              toValue: size,
              duration: 90,
              useNativeDriver: false,
            }).start(() => {
              latest.current.onMove(
                swapSlots(latest.current.order, s.from, s.to as number),
              );
              reset();
            });
          } else {
            springBack();
          }
        },
        onPanResponderTerminate: () => {
          if (stateRef.current?.to !== null && stateRef.current) springBack();
          else reset();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const gap = solved ? 0 : GAP;

  return (
    <View
      style={[styles.board, { width, height }]}
      {...(mode === 'pieces' ? responder.panHandlers : {})}
    >
      {mode === 'full' ? (
        <Image
          source={{ uri }}
          style={{ width, height }}
          resizeMode="cover"
        />
      ) : (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {order.map((piece, slot) => {
            const col = piece % cols;
            const row = Math.floor(piece / cols);
            const isDragged = dragState?.from === slot;
            const isTarget = dragState?.to === slot;
            const sign = isDragged ? 1 : isTarget ? -1 : 0;
            const transform = [
              {
                translateX: sign
                  ? Animated.multiply(drag, sign * (dragState?.dx ?? 0))
                  : 0,
              },
              {
                translateY: sign
                  ? Animated.multiply(drag, sign * (dragState?.dy ?? 0))
                  : 0,
              },
              { scale: isDragged ? 1.04 : 1 },
            ];
            return (
              <Animated.View
                key={piece}
                style={{
                  position: 'absolute',
                  left: (slot % cols) * pw,
                  top: Math.floor(slot / cols) * ph,
                  width: pw,
                  height: ph,
                  zIndex: isDragged ? 3 : isTarget ? 2 : 1,
                  transform,
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: gap / 2,
                    top: gap / 2,
                    width: pw - gap,
                    height: ph - gap,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={{ uri }}
                    resizeMode="cover"
                    style={{
                      position: 'absolute',
                      width,
                      height,
                      left: -(col * pw + gap / 2),
                      top: -(row * ph + gap / 2),
                    }}
                  />
                </View>
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: '#1b1b2f',
    borderRadius: 10,
    overflow: 'hidden',
  },
});
