'use client';

import { AppContext } from '@/app/context/IsPlayingContext';
import { sendTextToGeminiAi } from '@/utils/sendTextToGeminiAi';
import React, {
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const TextToSpeech = () => {
  const [userText, setUserText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setIsPlaying } = useContext(AppContext);
  const [spokenText, setSpokenText] = useState('');
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [micActive, setMicActive] = useState(false);

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Global audio unlock fallback on first interaction (if not unlocked by MuteToggle)
  useEffect(() => {
    const handleUserInteraction = () => {
      if (synth) {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        synth.speak(utterance);
        console.log('Global audio unlocked.');
      }
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, {
      once: true,
    });
  }, [synth]);

  // Use useCallback for submission to keep reference stable
  const submitUserText = useCallback(async () => {
    if (!userText.trim()) return;
    setIsLoading(true);
    try {
      const message = await sendTextToGeminiAi(userText);
      speak(message);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setUserText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userText]);

  // Initialize voices and SpeechRecognition
  useEffect(() => {
    if (!synth) return;
    const getVoices = () => {
      const voices = synth.getVoices();
      console.log('Available voices:', voices);
      const englishVoice = voices.find((voice) => voice.lang.startsWith('en'));
      setSelectedVoice(englishVoice || null);
    };

    getVoices();
    synth.onvoiceschanged = getVoices;

    if (typeof window !== 'undefined') {
      const SpeechRecognitionConstructor = (window.SpeechRecognition ||
        window.webkitSpeechRecognition) as
        | { new (): SpeechRecognition }
        | undefined;
      if (SpeechRecognitionConstructor) {
        const recognition = new SpeechRecognitionConstructor();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          setUserText(finalTranscript + interimTranscript);
        };

        recognition.onerror = (event) => {
          console.error('SpeechRecognition error', event.error);
        };

        // When speech recognition ends (e.g., mic button released), simulate form submission.
        recognition.onend = () => {
          handleSubmit();
        };
      } else {
        console.warn('SpeechRecognition API is not supported in this browser.');
      }
    }
  }, [synth, submitUserText]);

  // Function for speech synthesis of the Gemini response.
  const speak = (text: string) => {
    if (!synth) return;
    setSpokenText(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.onstart = () => console.log('Speech started');
    utterance.onend = () => {
      console.log('Speech ended');
      setIsPlaying(false);
      setSpokenText('');
    };
    utterance.onerror = (event) =>
      console.error('Speech synthesis error', event.error);
    setIsPlaying(true);
    synth.speak(utterance);
  };

  // Submission handler
  const handleSubmit = async () => {
    await submitUserText();
  };

  const handleUserTextSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleSubmit();
  };

  // When mic is pressed: start recognition and trigger dummy utterance.
  const handleMicPress = () => {
    if (!recognitionRef.current) return;
    setMicActive(true);
    setUserText('');
    // Trigger a silent dummy utterance for iOS unlock.
    const dummy = new SpeechSynthesisUtterance('');
    dummy.volume = 0;
    synth?.speak(dummy);
    console.log('Mic pressed: starting recognition.');
    recognitionRef.current.start();
  };

  // When mic is released: stop recognition (which triggers onend).
  const handleMicRelease = () => {
    if (!recognitionRef.current) return;
    setMicActive(false);
    recognitionRef.current.stop();
    console.log('Mic released: stopping recognition.');
  };

  return (
    <div className='fixed bottom-0 left-0 w-full bg-gray-800/80 backdrop-blur-md p-4 z-50 border-t border-gray-700'>
      <form
        onSubmit={handleUserTextSubmit}
        className='max-w-3xl mx-auto flex space-x-3 items-center'
      >
        <input
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          className='flex-grow bg-gray-700 border border-gray-600 outline-none rounded-md placeholder:text-gray-300 p-3 text-gray-300 cursor-text'
          type='text'
          placeholder='Ask me anything...'
        />
        {/* Microphone Button */}
        <button
          type='button'
          onMouseDown={handleMicPress}
          onMouseUp={handleMicRelease}
          onTouchStart={handleMicPress}
          onTouchEnd={handleMicRelease}
          className={`bg-black bg-opacity-20 rounded-full p-2 w-12 h-12 flex items-center justify-center transition-transform duration-150 cursor-pointer ${
            micActive
              ? 'scale-110 bg-opacity-40'
              : 'hover:bg-opacity-30 active:bg-opacity-40'
          }`}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-6 w-6 text-white'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 1a3 3 0 00-3 3v7a3 3 0 006 0V4a3 3 0 00-3-3z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M19 11v1a7 7 0 11-14 0v-1'
            />
            <path strokeLinecap='round' strokeLinejoin='round' d='M12 19v3' />
          </svg>
        </button>
        {/* Ask Button */}
        <button
          type='submit'
          disabled={isLoading}
          className='bg-[#6c5ce7] text-white p-3 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-[#4c3ead] transition-colors duration-200 cursor-pointer'
        >
          {isLoading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
      {spokenText && (
        <div className='absolute top-[-60px] left-0 w-full bg-gray-900/70 backdrop-blur-md p-4 text-white text-center rounded-t-md'>
          {spokenText}
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;
