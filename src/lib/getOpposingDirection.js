export default function getOpposingDirection(direction) {
  switch(direction.toLowerCase()) {
  case 'north':
    return 'south';
  case 'south':
    return 'north';
  case 'east':
    return 'west';
  case 'west':
    return 'east';
  case 'up':
    return 'down';
  case 'down':
    return 'up';
  case 'northwest':
    return 'southeast';
  case 'southeast':
    return 'northwest';
  case 'northeast':
    return 'southwest';
  case 'southwest':
    return 'northeast';
  default:
    return 'unknown';
  }
}
