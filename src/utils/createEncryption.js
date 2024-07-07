// Devley
// Developed by Yuvaraja

export function generateRandomPassword(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?()*&%$#@!][{}^'
  return new Array(length).fill(0).map(() => chars[Math.round(Math.random()*chars.length)]).join('')
}