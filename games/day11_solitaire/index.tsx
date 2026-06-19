import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import {
    calculateSolitaireScore,
    canPlaceOnColumn,
    canPlaceOnFoundation,
    Card,
    createDeck,
    dealNewGame,
    drawFromStock,
    flipTopCardIfNeeded,
    GameState,
    getMovableCards,
    isGameWon,
    shuffleDeck,
} from './logic';

const SUIT_SYMBOLS: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const RANK_LABELS: Record<number, string> = { 1: 'A', 11: 'V', 12: 'D', 13: 'R' };

function rankLabel(rank: number): string {
  return RANK_LABELS[rank] ?? String(rank);
}

type Selection = { type: 'column'; columnIndex: number; cardIndex: number } | { type: 'waste' } | null;

export function SolitaireGame({ onGameEnd, hintsAvailable, onUseHint }: GameComponentProps) {
  const [state, setState] = useState<GameState>(() => dealNewGame(shuffleDeck(createDeck())));
  const [selection, setSelection] = useState<Selection>(null);
  const startTimeRef = useRef(Date.now());
  const hintsUsedRef = useRef(0);

  const countCardsInFoundations = (s: GameState) => s.foundations.reduce((sum, f) => sum + f.length, 0);

  const checkWinCondition = (newState: GameState) => {
    if (isGameWon(newState)) {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const score = calculateSolitaireScore(52, timeSpent, hintsUsedRef.current);
      setTimeout(() => onGameEnd({ success: true, score }), 400);
    }
  };

  const handleStockTap = () => {
    setState(drawFromStock(state));
    setSelection(null);
  };

  const handleWasteTap = () => {
    if (state.waste.length === 0) return;
    setSelection({ type: 'waste' });
  };

  const handleColumnCardTap = (columnIndex: number, cardIndex: number) => {
    const column = state.columns[columnIndex];

    // Si une sélection existe déjà, on tente un mouvement vers cette colonne
    if (selection) {
      attemptMoveToColumn(columnIndex);
      return;
    }

    // Sinon on tente de sélectionner cette carte (et celles en dessous si séquence valide)
    const movable = getMovableCards(column, cardIndex);
    if (movable) {
      setSelection({ type: 'column', columnIndex, cardIndex });
    }
  };

  const handleEmptyColumnTap = (columnIndex: number) => {
    if (selection) {
      attemptMoveToColumn(columnIndex);
    }
  };

  const handleFoundationTap = (foundationIndex: number) => {
    if (!selection) return;

    let cardToMove: Card | null = null;
    let removeFromSource: () => GameState;

    if (selection.type === 'waste') {
      cardToMove = state.waste[state.waste.length - 1];
      removeFromSource = () => ({ ...state, waste: state.waste.slice(0, -1) });
    } else {
      const column = state.columns[selection.columnIndex];
      if (selection.cardIndex !== column.length - 1) {
        setSelection(null);
        return; // seule une carte unique peut aller en fondation, pas une séquence
      }
      cardToMove = column[selection.cardIndex];
      removeFromSource = () => {
        const newColumns = [...state.columns];
        newColumns[selection.columnIndex] = flipTopCardIfNeeded(column.slice(0, -1));
        return { ...state, columns: newColumns };
      };
    }

    if (cardToMove && canPlaceOnFoundation(cardToMove, state.foundations[foundationIndex])) {
      const baseState = removeFromSource();
      const newFoundations = [...baseState.foundations];
      newFoundations[foundationIndex] = [...newFoundations[foundationIndex], cardToMove];
      const newState = { ...baseState, foundations: newFoundations };
      setState(newState);
      setSelection(null);
      checkWinCondition(newState);
    } else {
      setSelection(null);
    }
  };

  const attemptMoveToColumn = (targetColumnIndex: number) => {
    if (!selection) return;

    let cardsToMove: Card[] = [];
    let removeFromSource: () => GameState;

    if (selection.type === 'waste') {
      cardsToMove = [state.waste[state.waste.length - 1]];
      removeFromSource = () => ({ ...state, waste: state.waste.slice(0, -1) });
    } else {
      const sourceColumn = state.columns[selection.columnIndex];
      const movable = getMovableCards(sourceColumn, selection.cardIndex);
      if (!movable) {
        setSelection(null);
        return;
      }
      cardsToMove = movable;
      removeFromSource = () => {
        const newColumns = [...state.columns];
        newColumns[selection.columnIndex] = flipTopCardIfNeeded(
          sourceColumn.slice(0, selection.cardIndex)
        );
        return { ...state, columns: newColumns };
      };
    }

    const targetColumn = state.columns[targetColumnIndex];
    const firstCard = cardsToMove[0];

    if (canPlaceOnColumn(firstCard, targetColumn)) {
      const baseState = removeFromSource();
      const newColumns = [...baseState.columns];
      newColumns[targetColumnIndex] = [...newColumns[targetColumnIndex], ...cardsToMove];
      setState({ ...baseState, columns: newColumns });
    }

    setSelection(null);
  };

  const handleHint = () => {
    if (hintsAvailable === 0) return;
    onUseHint();
    hintsUsedRef.current += 1;
    // Hint simplifié : pour l'instant, décompte uniquement. Une vraie suggestion de coup
    // (surligner une carte jouable) pourrait être ajoutée en Phase 6 si souhaité.
  };

  const isCardSelected = (columnIndex: number, cardIndex: number) =>
    selection?.type === 'column' && selection.columnIndex === columnIndex && selection.cardIndex === cardIndex;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={handleStockTap} style={styles.stockPile}>
          {state.stock.length > 0 ? (
            <View style={styles.cardBack} />
          ) : (
            <View style={styles.emptyPile}><Text style={styles.emptyPileText}>↺</Text></View>
          )}
        </Pressable>

        <Pressable onPress={handleWasteTap} style={styles.wastePile}>
          {state.waste.length > 0 && (
            <View style={[styles.card, selection?.type === 'waste' && styles.cardSelected]}>
              <Text style={[styles.cardText, isRedSuit(state.waste[state.waste.length - 1].suit) && styles.cardTextRed]}>
                {rankLabel(state.waste[state.waste.length - 1].rank)}{SUIT_SYMBOLS[state.waste[state.waste.length - 1].suit]}
              </Text>
            </View>
          )}
        </Pressable>

        <View style={styles.spacer} />

        {state.foundations.map((foundation, index) => (
          <Pressable key={index} onPress={() => handleFoundationTap(index)} style={styles.foundationPile}>
            {foundation.length > 0 ? (
              <View style={styles.card}>
                <Text style={[styles.cardText, isRedSuit(foundation[foundation.length - 1].suit) && styles.cardTextRed]}>
                  {rankLabel(foundation[foundation.length - 1].rank)}{SUIT_SYMBOLS[foundation[foundation.length - 1].suit]}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyPile} />
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.columnsRow}>
        {state.columns.map((column, columnIndex) => (
          <Pressable
            key={columnIndex}
            onPress={() => column.length === 0 && handleEmptyColumnTap(columnIndex)}
            style={styles.column}
          >
            {column.length === 0 && <View style={styles.emptyPile} />}
            {column.map((card, cardIndex) => {
              const isLast = cardIndex === column.length - 1;
              const PEEK = 22;
              return (
                <Pressable
                  key={card.id}
                  onPress={() => handleColumnCardTap(columnIndex, cardIndex)}
                  style={[
                    styles.stackedCard,
                    { top: cardIndex * PEEK, height: isLast ? CARD_HEIGHT : PEEK, overflow: 'hidden' },
                    isCardSelected(columnIndex, cardIndex) && styles.cardSelected,
                  ]}
                >
                  {card.faceUp ? (
                    <View style={[styles.card, { height: CARD_HEIGHT }]}>
                      <Text style={[styles.cardPeek, isRedSuit(card.suit) && styles.cardTextRed]}>
                        {rankLabel(card.rank)}{SUIT_SYMBOLS[card.suit]}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.cardBack, { height: CARD_HEIGHT }]} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.hintButton, hintsAvailable === 0 && styles.hintButtonDisabled]}
        onPress={handleHint}
        disabled={hintsAvailable === 0}
      >
        <Text style={styles.hintButtonText}>💡 Indice</Text>
      </Pressable>
    </ScrollView>
  );
}

function isRedSuit(suit: string) {
  return suit === 'hearts' || suit === 'diamonds';
}

const CARD_WIDTH = 42;
const CARD_HEIGHT = 58;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  stockPile: {},
  wastePile: {},
  spacer: {
    width: 20,
  },
  foundationPile: {},
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#f5f5f0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a3050',
  },
  cardSelected: {
    borderColor: '#7c3aed',
    borderWidth: 3,
  },
  cardBack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#7c3aed',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a78bfa',
  },
  emptyPile: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1a3050',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPileText: {
    color: '#3a5a7a',
    fontSize: 16,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c1521',
  },
  cardPeek: {
    position: 'absolute',
    top: 3,
    left: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#0c1521',
  },
  cardTextRed: {
    color: '#dc2626',
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  column: {
    width: CARD_WIDTH,
    minHeight: 200,
    position: 'relative',
  },
  stackedCard: {
    position: 'absolute',
    width: CARD_WIDTH,
  },
  hintButton: {
    marginTop: 28,
    backgroundColor: '#1a1500',
    borderColor: '#3d3000',
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