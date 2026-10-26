import type { Paleta } from './pixel';

// Sprites provisionales de la Fase 1 (16×16). En la Fase 2 se reemplazan por el arte definitivo.

export const BIT: [string[], Paleta] = [
  [
    '................',
    '....aaaaaaaa....',
    '...abbbbbbbba...',
    '...abkkkkkkba...',
    '...abkckkckba...',
    '...abkkkkkkba...',
    '...abbbbbbbba...',
    '..aabbbbbbbbaa..',
    '..abbbrrrrbbba..',
    '..abbbrrrrbbba..',
    '..aabbbbbbbbaa..',
    '...abbbbbbbba...',
    '...abbbbbbbba...',
    '...aaaaaaaaaa...',
    '....dd....dd....',
    '................',
  ],
  { a: '#5F6672', b: '#C9CED6', k: '#2A2F3A', c: '#4FD1C5', r: '#E8572A', d: '#3A3F48' },
];

export const HEROE: [string[], Paleta] = [
  [
    '................',
    '.....hhhhhh.....',
    '....hhhhhhhh....',
    '....hssssssh....',
    '....swessews....',
    '....ssssssss....',
    '.....ssmmss.....',
    '....tttttttt....',
    '...stttttttts...',
    '...stttttttts...',
    '...s.tttttt.s...',
    '.....pppppp.....',
    '.....pp..pp.....',
    '.....pp..pp.....',
    '.....zz..zz.....',
    '................',
  ],
  {
    h: '#4A2E1A', s: '#E0AC7E', w: '#FFFFFF', e: '#2A1A10', m: '#9B4A3A',
    t: '#2BB5A3', p: '#3A4FB0', z: '#2A2A2A',
  },
];

export const SOMBRI: [string[], Paleta] = [
  [
    '................',
    '................',
    '................',
    '......oooo......',
    '....oovvvvoo....',
    '...ovvvvvvvvo...',
    '..ovvvvvvvvvvo..',
    '..ovvggvvggvvo..',
    '..ovvggvvggvvo..',
    '..ovvvvvvvvvvo..',
    '.ovvvvvvvvvvvvo.',
    '.ovvlvvvvvvlvvo.',
    '.ovvvvvvvvvvvvo.',
    '..oooooooooooo..',
    '................',
    '................',
  ],
  { o: '#1A0F2A', v: '#4B2C78', g: '#FF4FD8', l: '#6E48A8' },
];

export const CHISPA: [string[], Paleta] = [
  [
    '................',
    '................',
    '................',
    '.......y........',
    '.......y........',
    '......yoy.......',
    '......yoy.......',
    '..yyyyoWoyyyy...',
    '......yoy.......',
    '......yoy.......',
    '.......y........',
    '.......y........',
    '................',
    '................',
    '................',
    '................',
  ],
  { y: '#F2C94C', o: '#FFE89A', W: '#FFFFFF' },
];

export const FRAGMENTO: [string[], Paleta] = [
  [
    '................',
    '................',
    '.......c........',
    '......ccc.......',
    '.....cclcc......',
    '....cclllcc.....',
    '...ccllwllcc....',
    '..cclllwlllcc...',
    '...ccllwllcc....',
    '....ccllldc.....',
    '.....cclcc......',
    '......cdc.......',
    '.......c........',
    '................',
    '................',
    '................',
  ],
  { c: '#2A9D8F', l: '#4FD1C5', w: '#E6FFFB', d: '#1F7A70' },
];

export const META: [string[], Paleta] = [
  [
    '................',
    '.....pffffff....',
    '.....pfffffff...',
    '.....pffwwfff...',
    '.....pfffffff...',
    '.....pffffff....',
    '.....p..........',
    '.....p..........',
    '.....p..........',
    '.....p..........',
    '.....p..........',
    '.....p..........',
    '.....p..........',
    '....sss.........',
    '...sssss........',
    '................',
  ],
  { p: '#5A3A22', f: '#F2C94C', w: '#FFF3C4', s: '#6B6F78' },
];
