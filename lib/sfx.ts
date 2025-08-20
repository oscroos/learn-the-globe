// sfx.ts (sound effects)
// Simple, reusable SFX helpers (preloaded once)
const correct = typeof Audio !== 'undefined' ? new Audio('/sounds/correct-answer.mp3') : null
const incorrect = typeof Audio !== 'undefined' ? new Audio('/sounds/incorrect-answer.mp3') : null
const skip = typeof Audio !== 'undefined' ? new Audio('/sounds/incorrect-answer.mp3') : null // Reusing incorrect sound for skip
const complete = typeof Audio !== 'undefined' ? new Audio('/sounds/game-complete.mp3') : null

;[correct, incorrect, skip, complete].forEach(a => {
  if (!a) return
  a.preload = 'auto'
  a.volume = 0.7
})

function tryPlay(a: HTMLAudioElement | null) {
  if (!a) return
  try { a.currentTime = 0; a.play().catch(() => {}) } catch {}
}

export const playCorrect = () => tryPlay(correct)
export const playIncorrect = () => tryPlay(incorrect)
export const playSkip = () => tryPlay(skip)
export const playComplete = () => tryPlay(complete)
