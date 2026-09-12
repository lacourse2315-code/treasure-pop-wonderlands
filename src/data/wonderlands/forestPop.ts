export type ActivityKind =
  | 'search'
  | 'puzzle'
  | 'repair'
  | 'tracks'
  | 'memory'
  | 'sequence'
  | 'creature'
  | 'environment'
  | 'secret'
  | 'finale';

export interface ForestActivity {
  readonly id: string;
  readonly title: string;
  readonly prompt: string;
  readonly kind: ActivityKind;
  readonly reward: string;
  readonly optional?: boolean;
}

export interface ForestZone {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly story: string;
  readonly palette: readonly [number, number, number, number];
  readonly activities: readonly ForestActivity[];
}

export const FOREST_POP_ZONES: readonly ForestZone[] = [
  {
    id: 'firefly-clearing',
    title: 'Clairière des Lucioles',
    subtitle: 'La lumière a oublié son chemin',
    story: 'Pip entend les lucioles fredonner à contretemps. Trois éclats de lumière peuvent rouvrir le sentier.',
    palette: [0x102f3b, 0x1f6b57, 0x5bcf8a, 0xffdc72],
    activities: [
      { id: 'firefly-search', title: 'Les trois lumières', prompt: 'Repère les trois lucioles qui brillent plus fort.', kind: 'search', reward: 'Page du Livre : Luciole chantante' },
      { id: 'firefly-sequence', title: 'Chanson de lumière', prompt: 'Rejoue le rythme lumineux dans le bon ordre.', kind: 'sequence', reward: 'Accessoire : Broche-luciole' },
      { id: 'firefly-secret', title: 'Éclat sous la fougère', prompt: 'Un reflet étrange se cache près du vieux tronc.', kind: 'secret', reward: 'Secret : Poussière d’aurore', optional: true },
    ],
  },
  {
    id: 'ticklish-woods',
    title: 'Bois Chatouilleux',
    subtitle: 'Les arbres éternuent des nuages de pollen',
    story: 'Les racines se sont emmêlées depuis la Fracture. Pip prétend ne pas être chatouilleux. Il ment très mal.',
    palette: [0x173b2d, 0x4f7f3a, 0xa5cf57, 0xf4c76a],
    activities: [
      { id: 'root-puzzle', title: 'Racines mêlées', prompt: 'Choisis les racines dans l’ordre pour libérer le passage.', kind: 'puzzle', reward: 'Décoration : Racine spirale' },
      { id: 'moss-tracks', title: 'Petites traces mousseuses', prompt: 'Suis les empreintes qui évitent les champignons endormis.', kind: 'tracks', reward: 'Livre : Bestiole mousseuse' },
    ],
  },
  {
    id: 'gurgle-river',
    title: 'Rivière Glouglou',
    subtitle: 'Le courant avale les sons',
    story: 'La rivière fait glou-glou sans reprendre son souffle. Un petit traversier attend qu’on répare son mécanisme.',
    palette: [0x123c52, 0x1c7894, 0x57c9c8, 0xf3e49b],
    activities: [
      { id: 'boat-repair', title: 'Le traversier grincheux', prompt: 'Replace les trois pièces du mécanisme.', kind: 'repair', reward: 'Souvenir : Petite hélice cuivrée' },
      { id: 'bubble-memory', title: 'Bulles bavardes', prompt: 'Retrouve les paires de bulles qui font le même son.', kind: 'memory', reward: 'Vêtement : Bottes de rivière' },
      { id: 'river-secret', title: 'Sous le nénuphar', prompt: 'Quelque chose scintille là où l’eau devient turquoise.', kind: 'secret', reward: 'Secret : Perle glouglou', optional: true },
    ],
  },
  {
    id: 'mossy-village',
    title: 'Village Moussu',
    subtitle: 'Les habitants ont perdu leur courage',
    story: 'Les Mousselins se cachent dans leurs maisons rondes. Une petite créature nommée Moki ose enfin suivre le héros.',
    palette: [0x263c32, 0x5d7d49, 0xa8b95b, 0xf0b968],
    activities: [
      { id: 'moki-rescue', title: 'Moki dans les ronces', prompt: 'Libère doucement Moki sans toucher les épines violettes.', kind: 'creature', reward: 'Compagnon : Moki' },
      { id: 'village-repair', title: 'La lanterne du village', prompt: 'Répare la grande lanterne pour rassurer les Mousselins.', kind: 'repair', reward: 'Décoration : Lanterne mousseuse' },
    ],
  },
  {
    id: 'flower-ruins',
    title: 'Ruines Fleuries',
    subtitle: 'Les pierres se souviennent',
    story: 'Sous les fleurs géantes, des symboles anciens montrent que l’Arbre-Cœur protégeait autrefois tout le royaume.',
    palette: [0x342f4d, 0x6b4d79, 0xb86f91, 0xf2c879],
    activities: [
      { id: 'rune-observation', title: 'Pierres qui murmurent', prompt: 'Trouve les symboles identiques à ceux de la carte fracturée.', kind: 'search', reward: 'Livre : Alphabet des ruines' },
      { id: 'flower-order', title: 'La porte fleurie', prompt: 'Réveille les fleurs dans l’ordre montré par Pip.', kind: 'sequence', reward: 'Accessoire : Couronne de pétales' },
      { id: 'ruin-secret', title: 'Le mur qui respire', prompt: 'Une pierre bouge à peine. Oseras-tu la toucher ?', kind: 'secret', reward: 'Trophée : Œil de pierre', optional: true },
    ],
  },
  {
    id: 'heart-tree',
    title: 'Arbre-Cœur',
    subtitle: 'Quelque chose retient la Gardienne',
    story: 'La Gardienne Sylva n’est pas méchante : des veines de Fracture l’emprisonnent. Il faut comprendre, esquiver et restaurer.',
    palette: [0x1b2435, 0x45385c, 0x8b4f78, 0xffcf72],
    activities: [
      { id: 'guardian-observe', title: 'Écouter Sylva', prompt: 'Observe ses mouvements et repère les trois veines de Fracture.', kind: 'environment', reward: 'Indice : Rythme de Sylva' },
      { id: 'guardian-release', title: 'Libérer la Gardienne', prompt: 'Active les racines saines au bon moment pour briser l’emprise.', kind: 'finale', reward: 'Premier fragment du Cœur' },
    ],
  },
] as const;

export const FOREST_POP_ACTIVITY_COUNT = FOREST_POP_ZONES.reduce(
  (total, zone) => total + zone.activities.length,
  0,
);

export const FOREST_POP_COMPANION = {
  id: 'moki',
  name: 'Moki',
  personality: 'Curieux, courageux quand quelqu’un a besoin de lui, et incapable de résister aux objets brillants.',
} as const;
