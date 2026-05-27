import avatar1 from './assets/avatars/1.png';
import avatar2 from './assets/avatars/2.png';
import avatar3 from './assets/avatars/3.png';
import avatar4 from './assets/avatars/4.png';
import avatar5 from './assets/avatars/5.png';
import avatar6 from './assets/avatars/6.png';
import avatar7 from './assets/avatars/7.png';
import avatar8 from './assets/avatars/8.png';

export const CHARACTERS = {
  frog:     { id: 'frog',     img: avatar1, name: 'Tung Tung Tung Sahur',        color: '#d89d57' },
  robot:    { id: 'robot',    img: avatar2, name: 'Ballerina Cappuccina',         color: '#bbffba' },
  panda:    { id: 'panda',    img: avatar3, name: 'Bobrini Cocosini',             color: '#117c48' },
  alien:    { id: 'alien',    img: avatar4, name: 'Tralalero Tralala',            color: '#695032' },
  mushroom: { id: 'mushroom', img: avatar5, name: 'Urangotini Ananasini',         color: '#d89d57' },
  brrbrr:   { id: 'brrbrr',   img: avatar6, name: 'Brr Brr Patapim',             color: '#a0c4ff' },
  cappucci: { id: 'cappucci', img: avatar7, name: 'Cappuccino Assassino',         color: '#c97b3a' },
  udin:     { id: 'udin',     img: avatar8, name: 'Udin Din Din Dun Ma Din Din Din Dun', color: '#e0aaff' },
};

export const CHARACTER_LIST = Object.values(CHARACTERS);
