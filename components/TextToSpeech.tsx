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

export const TextToSpeech = () => {
  const [userText, setUserText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setIsPlaying } = useContext(AppContext);
  const [spokenText, setSpokenText] = useState('');
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [micActive, setMicActive] = useState(false);

  // Speech Synthesis
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  // SpeechRecognition ref
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Global silent utterance on first interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (synth) {
        const emptyUtt = new SpeechSynthesisUtterance('');
        emptyUtt.volume = 0;
        synth.speak(emptyUtt);
        console.log('Global fallback unlock triggered.');
      }
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, {
      once: true,
    });
  }, [synth]);

  // Submit the user text to your AI
  const submitUserText = useCallback(async () => {
    if (!userText.trim()) return;
    setIsLoading(true);
    try {
      const message = await sendTextToGeminiAi(userText);
      speak(message);
    } catch (error) {
      console.error('Error sending text:', error);
    } finally {
      setIsLoading(false);
      setUserText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userText]);

  // Initialize voices & speech recognition
  useEffect(() => {
    if (!synth) return;

    const getVoices = () => {
      const voices = synth.getVoices();
      console.log('Voices on device:', voices);
      const englishVoice = voices.find((v) => v.lang.startsWith('en'));
      setSelectedVoice(englishVoice || null);
    };
    getVoices();
    synth.onvoiceschanged = getVoices;

    if (typeof window !== 'undefined') {
      const SpeechRecognitionCtor = (window.SpeechRecognition ||
        window.webkitSpeechRecognition) as
        | { new (): SpeechRecognition }
        | undefined;

      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
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

        recognition.onerror = (e) => {
          console.error('SpeechRecognition error:', e.error);
        };

        // After user stops speaking (mic release), we auto-submit
        recognition.onend = () => {
          console.log('Recognition ended, submitting user text soon...');
          // Wait 200 ms for final transcript
          setTimeout(() => {
            handleSubmit();
          }, 200);
        };
      }
    }
  }, [synth, submitUserText]);

  // Speak the AI's response
  const speak = (text: string) => {
    if (!synth) return;
    setSpokenText(text);

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    if (selectedVoice) utter.voice = selectedVoice;
    utter.onstart = () => console.log('Speech started');
    utter.onend = () => {
      console.log('Speech ended');
      setIsPlaying(false);
      setSpokenText('');
    };
    utter.onerror = (e) => console.error('Speech error:', e.error);

    setIsPlaying(true);
    synth.speak(utter);
  };

  // Form submission triggers the "submitUserText" logic
  const handleSubmit = async () => {
    await submitUserText();
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleSubmit();
  };

  // Microphone press/release
  const handleMicPress = () => {
    if (!recognitionRef.current) return;
    setMicActive(true);
    setUserText(''); // Clear old text
    // Also do a dummy utterance for iOS unlock
    if (synth) {
      const dummy = new SpeechSynthesisUtterance('');
      dummy.volume = 0;
      synth.speak(dummy);
    }
    console.log('Mic pressed: starting recognition...');
    recognitionRef.current.start();
  };

  const handleMicRelease = () => {
    if (!recognitionRef.current) return;
    setMicActive(false);
    recognitionRef.current.stop();
    console.log('Mic released: stopping recognition.');
  };

  return (
    <div className='fixed bottom-0 left-0 w-full bg-gray-800/80 backdrop-blur-md p-4 z-50 border-t border-gray-700'>
      <form
        onSubmit={handleFormSubmit}
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
          onContextMenu={(e) => e.preventDefault()} // Disables menu
          className={`
            bg-black bg-opacity-20 rounded-full p-2 w-12 h-12 flex items-center justify-center
            transition-transform duration-150 cursor-pointer select-none touch-none
            ${
              micActive
                ? 'scale-110 bg-opacity-40'
                : 'hover:bg-opacity-30 active:bg-opacity-40'
            }
          `}
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

      {/* Spoken Text Overlay */}
      {spokenText && (
        <div className='absolute top-[-60px] left-0 w-full bg-gray-900/70 backdrop-blur-md p-4 text-white text-center rounded-t-md'>
          {spokenText}
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;
