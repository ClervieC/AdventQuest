import { useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { playSfx } from '../../services/sfx';
import {
  applyMove,
  calculateSolitaireScore,
  Card,
  createDeck,
  createSeededRandom,
  dealNewGame,
  drawFromStock,
  findHintMove,
  GameState,
  getSourceCards,
  HintMove,
  isGameWon,
  MoveSource,
  MoveTarget,
  shuffleDeck,
} from './logic';
import { SOLVABLE_SEEDS } from './solvableSeeds';

/** Donne tirée parmi celles dont une solution a été vérifiée (voir solver.ts) : la partie est toujours gagnable */
function dealSolvableGame(): GameState {
  const seed = SOLVABLE_SEEDS[Math.floor(Math.random() * SOLVABLE_SEEDS.length)];
  return dealNewGame(shuffleDeck(createDeck(), createSeededRandom(seed)));
}

const SUIT_SYMBOLS: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const RANK_LABELS: Record<number, string> = { 1: 'A', 11: 'V', 12: 'D', 13: 'R' };
const GAP = 6;
const ROW_GAP = 18;
const MAX_CARD_WIDTH = 52;
const HINT_DURATION_MS = 2500;

function rankLabel(rank: number): string {
  return RANK_LABELS[rank] ?? String(rank);
}

function isRedSuit(suit: string) {
  return suit === 'hearts' || suit === 'diamonds';
}

// ---------- Géométrie du plateau (tout est calculé : sert à l'affichage ET à savoir ce qu'il y a sous le doigt) ----------

interface Layout {
  cardW: number;
  cardH: number;
  boardW: number;
  boardH: number;
  columnsTop: number;
}

function computeLayout(width: number, height: number): Layout {
  const cardW = Math.min(MAX_CARD_WIDTH, Math.floor((width - GAP * 6) / 7));
  const cardH = Math.round(cardW * 1.4);
  return { cardW, cardH, boardW: cardW * 7 + GAP * 6, boardH: height, columnsTop: cardH + ROW_GAP };
}

const slotX = (layout: Layout, index: number) => index * (layout.cardW + GAP);
// Pioche en 0, défausse en 1, (vide en 2), fondations en 3..6 : alignées sur les colonnes
const STOCK_SLOT = 0;
const WASTE_SLOT = 1;
const foundationSlot = (index: number) => 3 + index;

/** Écart vertical entre les cartes d'une colonne : se resserre pour que les longues colonnes tiennent */
function peekFor(layout: Layout, columnLength: number): number {
  const comfortable = Math.round(layout.cardH * 0.34);
  if (columnLength <= 1) return comfortable;
  const available = layout.boardH - layout.columnsTop - layout.cardH;
  return Math.max(10, Math.min(comfortable, Math.floor(available / (columnLength - 1))));
}

type Hit =
  | { kind: 'stock' }
  | { kind: 'waste' }
  | { kind: 'foundation'; index: number }
  | { kind: 'column'; columnIndex: number; cardIndex: number | null }; // null = zone vide de la colonne

function hitTest(state: GameState, layout: Layout, x: number, y: number): Hit | null {
  const slot = Math.floor(x / (layout.cardW + GAP));
  if (slot < 0 || slot > 6) return null;
  const inCardX = x - slotX(layout, slot) <= layout.cardW;

  if (y < layout.cardH + ROW_GAP / 2) {
    if (y < 0 || !inCardX) return null;
    if (slot === STOCK_SLOT) return { kind: 'stock' };
    if (slot === WASTE_SLOT) return { kind: 'waste' };
    if (slot >= 3) return { kind: 'foundation', index: slot - 3 };
    return null;
  }

  const column = state.columns[slot];
  const peek = peekFor(layout, column.length);
  for (let i = column.length - 1; i >= 0; i--) {
    const top = layout.columnsTop + i * peek;
    const bottom = top + (i === column.length - 1 ? layout.cardH : peek);
    if (y >= top && y <= bottom) return { kind: 'column', columnIndex: slot, cardIndex: i };
  }
  return { kind: 'column', columnIndex: slot, cardIndex: null };
}

function hitToSource(hit: Hit | null): MoveSource | null {
  if (!hit) return null;
  if (hit.kind === 'waste') return { type: 'waste' };
  if (hit.kind === 'column' && hit.cardIndex !== null) return { type: 'column', columnIndex: hit.columnIndex, cardIndex: hit.cardIndex };
  return null;
}

// Zone de dépôt : on est tolérant (toute la hauteur de la colonne, et un peu autour des fondations)
function hitToTarget(hit: Hit | null): MoveTarget | null {
  if (!hit) return null;
  if (hit.kind === 'foundation') return { type: 'foundation', index: hit.index };
  if (hit.kind === 'column') return { type: 'column', index: hit.columnIndex };
  return null;
}

const sameSource = (a: MoveSource | null, b: MoveSource | null) =>
  !!a && !!b && a.type === b.type && (a.type === 'waste' || (b.type === 'column' && a.columnIndex === b.columnIndex && a.cardIndex === b.cardIndex));

// ---------- Composant ----------

export function SolitaireGame({ onGameEnd, hintsAvailable, onUseHint }: GameComponentProps) {
  const [state, setState] = useState<GameState>(dealSolvableGame);
  // Annulation d'un seul coup : on ne garde que la position d'avant le dernier coup
  const [previous, setPrevious] = useState<GameState | null>(null);
  const [selection, setSelection] = useState<MoveSource | null>(null);
  const [dragging, setDragging] = useState<{ source: MoveSource; cards: Card[] } | null>(null);
  const [hint, setHint] = useState<HintMove | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const startTimeRef = useRef(Date.now());
  const hintsUsedRef = useRef(0);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Le geste lit l'état via des refs (callbacks exécutés hors du rendu React)
  const stateRef = useRef(state);
  stateRef.current = state;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const dragRef = useRef<{ source: MoveSource; cards: Card[]; grabX: number; grabY: number } | null>(null);

  // Position de la carte en cours de glisser (animée sans re-rendu React)
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const ghostStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.value }, { translateY: dragY.value }] }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout(computeLayout(width, height));
  };

  const commit = (next: GameState) => {
    setPrevious(stateRef.current);
    setState(next);
    setSelection(null);
    setHint(null);
    if (isGameWon(next)) {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const score = calculateSolitaireScore(52, timeSpent, hintsUsedRef.current);
      setTimeout(() => onGameEnd({ success: true, score }), 400);
    }
  };

  const handleUndo = () => {
    if (!previous) return;
    playSfx('tap');
    setState(previous);
    setPrevious(null); // un seul retour en arrière : il faut rejouer un coup pour pouvoir annuler à nouveau
    setSelection(null);
    setHint(null);
  };

  const tryMove = (source: MoveSource, target: MoveTarget) => {
    const next = applyMove(stateRef.current, source, target);
    if (next) {
      playSfx('card');
      commit(next);
    }
    return !!next;
  };

  // ----- Toucher (sélectionner puis toucher la destination) -----
  const handleTap = (x: number, y: number) => {
    const current = layoutRef.current;
    if (!current) return;
    const hit = hitTest(stateRef.current, current, x, y);
    if (!hit) {
      setSelection(null);
      return;
    }
    if (hit.kind === 'stock') {
      playSfx('draw');
      commit(drawFromStock(stateRef.current));
      return;
    }
    if (selection) {
      const target = hitToTarget(hit);
      if (target && tryMove(selection, target)) return;
      // Coup impossible : on sélectionne à la place la carte touchée si elle est déplaçable
      const newSource = hitToSource(hit);
      setSelection(newSource && !sameSource(newSource, selection) && getSourceCards(stateRef.current, newSource) ? newSource : null);
      return;
    }
    const source = hitToSource(hit);
    if (source && getSourceCards(stateRef.current, source)) setSelection(source);
  };

  // ----- Glisser-déposer -----
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(6)
    .onBegin((event) => {
      const current = layoutRef.current;
      dragRef.current = null;
      if (!current) return;
      const source = hitToSource(hitTest(stateRef.current, current, event.x, event.y));
      const cards = source ? getSourceCards(stateRef.current, source) : null;
      if (!source || !cards) return;
      // Coin haut-gauche de la carte saisie, pour qu'elle reste "collée" au doigt au même endroit
      const cardX = source.type === 'waste' ? slotX(current, WASTE_SLOT) : slotX(current, source.columnIndex);
      const cardY =
        source.type === 'waste'
          ? 0
          : current.columnsTop + source.cardIndex * peekFor(current, stateRef.current.columns[source.columnIndex].length);
      dragRef.current = { source, cards, grabX: event.x - cardX, grabY: event.y - cardY };
      dragX.value = cardX;
      dragY.value = cardY;
    })
    .onStart(() => {
      const drag = dragRef.current;
      if (!drag) return;
      setSelection(null);
      setHint(null);
      setDragging({ source: drag.source, cards: drag.cards });
    })
    .onUpdate((event) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragX.value = event.x - drag.grabX;
      dragY.value = event.y - drag.grabY;
    })
    .onEnd((event) => {
      const drag = dragRef.current;
      const current = layoutRef.current;
      if (!drag || !current) return;
      // On vise avec le centre de la carte tenue plutôt qu'avec le doigt : plus naturel
      const centerX = event.x - drag.grabX + current.cardW / 2;
      const centerY = event.y - drag.grabY + current.cardH / 2;
      const target = hitToTarget(hitTest(stateRef.current, current, centerX, centerY));
      if (!target || !tryMove(drag.source, target)) playSfx('bump'); // coup refusé : la carte revient
    })
    .onFinalize(() => {
      dragRef.current = null;
      setDragging(null);
    });

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd((event, success) => {
      if (success) handleTap(event.x, event.y);
    });

  const boardGesture = Gesture.Race(panGesture, tapGesture);

  // ----- Indice : surligne un coup jouable -----
  const handleHint = () => {
    if (hintsAvailable === 0) return;
    const move = findHintMove(stateRef.current);
    if (!move) return;
    onUseHint();
    hintsUsedRef.current += 1;
    setSelection(null);
    setHint(move);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHint(null), HINT_DURATION_MS);
  };

  // ----- Rendu -----
  const isDragged = (source: MoveSource) => {
    if (!dragging) return false;
    const d = dragging.source;
    if (d.type === 'waste') return source.type === 'waste';
    return source.type === 'column' && source.columnIndex === d.columnIndex && source.cardIndex >= d.cardIndex;
  };
  const hintSource = hint && 'source' in hint ? hint.source : null;
  const hintTarget = hint && 'target' in hint ? hint.target : null;
  const isHintSource = (source: MoveSource) =>
    !!hintSource &&
    (hintSource.type === 'waste'
      ? source.type === 'waste'
      : source.type === 'column' && source.columnIndex === hintSource.columnIndex && source.cardIndex >= hintSource.cardIndex);

  const renderFace = (card: Card, l: Layout, extraStyle?: StyleProp<ViewStyle>) => (
    <View style={[styles.card, { width: l.cardW, height: l.cardH }, extraStyle]}>
      <Text style={[styles.cardCorner, { fontSize: Math.max(10, Math.round(l.cardW * 0.28)) }, isRedSuit(card.suit) && styles.cardTextRed]}>
        {rankLabel(card.rank)}
        {SUIT_SYMBOLS[card.suit]}
      </Text>
      <Text style={[styles.cardCenter, { fontSize: Math.round(l.cardW * 0.45) }, isRedSuit(card.suit) && styles.cardTextRed]}>
        {SUIT_SYMBOLS[card.suit]}
      </Text>
    </View>
  );

  const renderBoard = (l: Layout) => {
    const topWaste = state.waste[state.waste.length - 1];
    const pile = (slot: number, top: number) => ({ position: 'absolute' as const, left: slotX(l, slot), top, width: l.cardW, height: l.cardH });
    const empty = { width: l.cardW, height: l.cardH };

    return (
      <View style={{ width: l.boardW, height: l.boardH }}>
        {/* Pioche */}
        <View style={pile(STOCK_SLOT, 0)}>
          {state.stock.length > 0 ? (
            <View style={[styles.cardBack, empty, hint && 'draw' in hint && styles.hinted]} />
          ) : (
            <View style={[styles.emptyPile, empty, hint && 'draw' in hint && styles.hinted]}>
              <Text style={styles.emptyPileText}>↺</Text>
            </View>
          )}
        </View>

        {/* Défausse */}
        <View style={pile(WASTE_SLOT, 0)}>
          {topWaste && !isDragged({ type: 'waste' }) &&
            renderFace(topWaste, l, [
              selection?.type === 'waste' && styles.cardSelected,
              isHintSource({ type: 'waste' }) && styles.hinted,
            ])}
        </View>

        {/* Fondations */}
        {state.foundations.map((foundation, index) => {
          const top = foundation[foundation.length - 1];
          const isTarget = hintTarget?.type === 'foundation' && hintTarget.index === index;
          return (
            <View key={`f${index}`} style={pile(foundationSlot(index), 0)}>
              {top ? (
                renderFace(top, l, isTarget && styles.hintTarget)
              ) : (
                <View style={[styles.emptyPile, empty, isTarget && styles.hintTarget]}>
                  <Text style={styles.emptyPileText}>A</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Colonnes */}
        {state.columns.map((column, columnIndex) => {
          const peek = peekFor(l, column.length);
          const isTarget = hintTarget?.type === 'column' && hintTarget.index === columnIndex;
          return (
            <View key={`c${columnIndex}`}>
              {column.length === 0 && <View style={[styles.emptyPile, pile(columnIndex, l.columnsTop), isTarget && styles.hintTarget]} />}
              {column.map((card, cardIndex) => {
                const source: MoveSource = { type: 'column', columnIndex, cardIndex };
                if (isDragged(source)) return null;
                const isLast = cardIndex === column.length - 1;
                const selected =
                  selection?.type === 'column' && selection.columnIndex === columnIndex && cardIndex >= selection.cardIndex;
                return (
                  <View key={card.id} style={pile(columnIndex, l.columnsTop + cardIndex * peek)}>
                    {card.faceUp ? (
                      renderFace(card, l, [
                        selected && styles.cardSelected,
                        isHintSource(source) && styles.hinted,
                        isTarget && isLast && styles.hintTarget,
                      ])
                    ) : (
                      <View style={[styles.cardBack, empty]} />
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Cartes tenues pendant le glisser */}
        {dragging && (
          <Animated.View pointerEvents="none" style={[styles.ghost, ghostStyle]}>
            {dragging.cards.map((card, i) => (
              <View key={card.id} style={{ position: 'absolute', top: i * Math.round(l.cardH * 0.34) }}>
                {renderFace(card, l, styles.ghostCard)}
              </View>
            ))}
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={boardGesture}>
        <View style={styles.boardArea} onLayout={handleLayout} collapsable={false}>
          {layout && renderBoard(layout)}
        </View>
      </GestureDetector>

      <Text style={styles.help}>Glisse une carte, ou touche-la puis touche sa destination.</Text>
      <View style={styles.buttonsRow}>
        <Pressable
          style={[styles.undoButton, !previous && styles.hintButtonDisabled]}
          onPress={handleUndo}
          disabled={!previous}
          accessibilityLabel="Annuler le dernier coup"
        >
          <Text style={styles.undoButtonText}>↶ Annuler</Text>
        </Pressable>
        <Pressable
          style={[styles.hintButton, hintsAvailable === 0 && styles.hintButtonDisabled]}
          onPress={handleHint}
          disabled={hintsAvailable === 0}
        >
          <Text style={styles.hintButtonText}>💡 Indice : montre un coup</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'center',
  },
  boardArea: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#f5f5f0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a5a82',
    overflow: 'hidden',
  },
  cardCorner: {
    position: 'absolute',
    top: 2,
    left: 4,
    fontWeight: '800',
    color: '#0c1521',
  },
  cardCenter: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    color: '#0c1521',
    opacity: 0.85,
  },
  cardTextRed: {
    color: '#dc2626',
  },
  cardSelected: {
    borderColor: '#7c3aed',
    borderWidth: 3,
  },
  hinted: {
    borderColor: '#f59e0b',
    borderWidth: 3,
  },
  hintTarget: {
    borderColor: '#34d399',
    borderWidth: 3,
    borderStyle: 'solid',
  },
  cardBack: {
    backgroundColor: '#7c3aed',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a78bfa',
  },
  emptyPile: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a5a82',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPileText: {
    color: '#8ea6c0',
    fontSize: 14,
  },
  ghost: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 100,
  },
  ghostCard: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  help: {
    fontSize: 11,
    color: '#8ea6c0',
    marginTop: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  undoButton: {
    backgroundColor: '#243a5a',
    borderColor: '#3a5a82',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  undoButtonText: {
    color: '#b7c8da',
    fontSize: 12,
    fontWeight: '600',
  },
  hintButton: {
    backgroundColor: '#2a2208',
    borderColor: '#6b5410',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  hintButtonDisabled: {
    opacity: 0.3,
  },
  hintButtonText: {
    color: '#f59e0b',
    fontSize: 12,
  },
});
