/**
 * Unlocks SpeechSynthesis audio on iOS by playing a silent utterance
 * after a user gesture (click/tap). Subsequent TTS calls will work.
 */
export function unlockAudio() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0; // make it silent
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = 'en-US'; // pick any language
    window.speechSynthesis.speak(utterance);
  }
}
