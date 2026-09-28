import { useState } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GameTutorial as Tutorial } from '../../constants/tutorials';

// Les captures font 393×796 : on garde ce ratio pour les afficher comme de petits écrans de téléphone
const SHOT_RATIO = 393 / 796;
const THUMB_HEIGHT = 170;

/** Bouton « Comment jouer ? » de l'intro : déplie une carte avec capture(s) du jeu + règles en quelques étapes */
export function GameTutorial({ tutorial }: { tutorial: Tutorial }) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState<number | null>(null);
  const single = tutorial.images.length === 1;
  // Plusieurs épreuves : vignettes un peu plus petites pour qu'elles tiennent côte à côte
  const thumbHeight = tutorial.images.length > 2 ? 140 : THUMB_HEIGHT;

  const thumbs = (
    <View style={[styles.thumbs, single && styles.thumbsSingle]}>
      {tutorial.images.map((image, index) => (
        <Pressable
          key={index}
          onPress={() => setZoomed(index)}
          accessibilityRole="imagebutton"
          accessibilityLabel={`Agrandir la capture${image.caption ? ` : ${image.caption}` : ''}`}
          style={styles.thumbItem}
        >
          <Image
            source={image.source}
            style={[styles.thumb, { height: thumbHeight, width: thumbHeight * SHOT_RATIO }]}
            resizeMode="cover"
          />
          {image.caption && <Text style={styles.caption}>{image.caption}</Text>}
        </Pressable>
      ))}
    </View>
  );

  const steps = (
    <View style={styles.steps}>
      {tutorial.steps.map((step, index) => (
        <View key={index} style={styles.step}>
          <Text style={styles.stepIcon}>{step.icon}</Text>
          <Text style={styles.stepText}>{step.text}</Text>
        </View>
      ))}
    </View>
  );

  if (!open) {
    return (
      <Pressable style={styles.toggle} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityState={{ expanded: false }}>
        <Text style={styles.toggleText}>📖 Comment jouer ?</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityState={{ expanded: true }}>
        <Text style={styles.title}>📖 Comment jouer</Text>
        <Text style={styles.close}>Masquer ✕</Text>
      </Pressable>
      {single ? (
        <View style={styles.row}>
          {thumbs}
          {steps}
        </View>
      ) : (
        <>
          {thumbs}
          {steps}
        </>
      )}
      {/* Sur ordi (navigateur) : les commandes au clavier / à la souris */}
      {Platform.OS === 'web' && tutorial.keyboard && (
        <View style={styles.keyboard}>
          <Text style={styles.keyboardText}>
            <Text style={styles.keyboardLabel}>💻 Sur ordi : </Text>
            {tutorial.keyboard}
          </Text>
        </View>
      )}
      <Text style={styles.zoomHint}>Touche une image pour l’agrandir</Text>

      <Modal visible={zoomed !== null} transparent animationType="fade" onRequestClose={() => setZoomed(null)}>
        <Pressable style={styles.overlay} onPress={() => setZoomed(null)} accessibilityLabel="Fermer l’image">
          {zoomed !== null && (
            <Image source={tutorial.images[zoomed].source} style={styles.zoomImage} resizeMode="contain" />
          )}
          <Text style={styles.overlayClose}>Touche pour fermer</Text>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#16233a',
    borderWidth: 1,
    borderColor: '#3a5a82',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  close: {
    fontSize: 12,
    color: '#b7c8da',
  },
  card: {
    marginTop: 16,
    backgroundColor: '#16233a',
    borderWidth: 1,
    borderColor: '#3a5a82',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  thumbs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  thumbsSingle: {
    flexShrink: 0,
  },
  thumbItem: {
    alignItems: 'center',
    gap: 4,
  },
  thumb: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2c4262',
    backgroundColor: '#0c1521',
  },
  caption: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b7c8da',
  },
  steps: {
    flex: 1,
    gap: 8,
  },
  step: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  stepIcon: {
    fontSize: 15,
    width: 22,
    textAlign: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#dbe6f1',
  },
  keyboard: {
    backgroundColor: '#0c1521',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c4262',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  keyboardText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#dbe6f1',
  },
  keyboardLabel: {
    fontWeight: '700',
    color: '#c4b5fd',
  },
  zoomHint: {
    fontSize: 10,
    color: '#8ea6c0',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000000e6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  zoomImage: {
    width: '100%',
    maxWidth: 393,
    height: '85%',
    borderRadius: 14,
  },
  overlayClose: {
    color: '#b7c8da',
    fontSize: 13,
  },
});
