import React, { useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { playSfx } from '../../services/sfx';
import { getRandomDrawing } from './drawings';
import { calculateDrawingScore, findNearestPoint, isDrawingComplete, isNextValidPoint } from './logic';
import { useI18n } from '../../services/i18n';

export function DessinConnecteGame({ onGameEnd }: GameComponentProps) {
  const { tr } = useI18n();
  const [drawing] = useState(() => getRandomDrawing());
  // Zone de dessin carrée, la plus grande possible (les dessins ont une vingtaine de points)
  const canvasSize = Math.min(340, useWindowDimensions().width - 32);
  const [lastValidatedId, setLastValidatedId] = useState(0);
  const [currentTouchPosition, setCurrentTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });
  const startTimeRef = useRef(Date.now());
  const wrongAttemptsRef = useRef(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayoutSize({ width, height });
  };

  // Convertit une position en pixels écran vers le système de coordonnées 0-100 du dessin
  const toRelativeCoords = (pixelX: number, pixelY: number) => ({
    x: (pixelX / layoutSize.width) * 100,
    y: (pixelY / layoutSize.height) * 100,
  });

  const handleTouch = (pixelX: number, pixelY: number) => {
    if (layoutSize.width === 0) return;

    const relative = toRelativeCoords(pixelX, pixelY);
    setCurrentTouchPosition(relative);

    const nextExpectedPoint = drawing.points.find((p) => p.id === lastValidatedId + 1);
    if (!nextExpectedPoint) return;

    const nearestPoint = findNearestPoint(relative.x, relative.y, [nextExpectedPoint], 8);

    if (nearestPoint && isNextValidPoint(lastValidatedId, nearestPoint.id)) {
      const newLastValidated = nearestPoint.id;
      setLastValidatedId(newLastValidated);
      playSfx('draw');

      if (isDrawingComplete(newLastValidated, drawing.points.length)) {
        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const score = calculateDrawingScore(timeSpent, wrongAttemptsRef.current);
        setTimeout(() => onGameEnd({ success: true, score }), 400);
      }
    }
  };

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((event) => {
      handleTouch(event.x, event.y);
    })
    .onEnd(() => {
      setCurrentTouchPosition(null);
    });

  // Construit les segments de ligne déjà validés, pour les afficher en SVG
  const validatedSegments = drawing.points
    .filter((p) => p.id <= lastValidatedId && p.id > 1)
    .map((p) => {
      const previous = drawing.points.find((prev) => prev.id === p.id - 1)!;
      return { from: previous, to: p };
    });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{tr(drawing.name, drawing.nameEn)}</Text>
      <Text style={styles.progress}>
        {tr('Point', 'Dot')} {lastValidatedId} / {drawing.points.length}
      </Text>

      <GestureDetector gesture={panGesture}>
        <View style={[styles.canvas, { width: canvasSize, height: canvasSize }]} onLayout={handleLayout}>
          {layoutSize.width > 0 && (
            <Svg width={layoutSize.width} height={layoutSize.height}>
              {validatedSegments.map((segment, index) => (
                <Line
                  key={index}
                  x1={(segment.from.x / 100) * layoutSize.width}
                  y1={(segment.from.y / 100) * layoutSize.height}
                  x2={(segment.to.x / 100) * layoutSize.width}
                  y2={(segment.to.y / 100) * layoutSize.height}
                  stroke="#a78bfa"
                  strokeWidth={3}
                />
              ))}

              {drawing.points.map((point) => {
                const isValidated = point.id <= lastValidatedId;
                const isNext = point.id === lastValidatedId + 1;
                return (
                  <React.Fragment key={point.id}>
                    <Circle
                      cx={(point.x / 100) * layoutSize.width}
                      cy={(point.y / 100) * layoutSize.height}
                      r={isNext ? 14 : 10}
                      fill={isValidated ? '#34d399' : isNext ? '#7c3aed' : '#2c4262'}
                    />
                    <SvgText
                      x={(point.x / 100) * layoutSize.width}
                      y={(point.y / 100) * layoutSize.height + 4}
                      fontSize={11}
                      fill="#fff"
                      textAnchor="middle"
                    >
                      {point.id}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          )}
        </View>
      </GestureDetector>

      <Text style={styles.hint}>{tr("Glisse ton doigt du point 1 jusqu'au dernier point", 'Slide your finger from dot 1 to the last dot')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  progress: {
    fontSize: 12,
    color: '#b7c8da',
    marginBottom: 16,
  },
  canvas: {
    backgroundColor: '#16233a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3a5a82',
  },
  hint: {
    fontSize: 11,
    color: '#8ea6c0',
    marginTop: 16,
    textAlign: 'center',
  },
});