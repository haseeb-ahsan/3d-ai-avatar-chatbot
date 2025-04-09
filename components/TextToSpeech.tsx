'use client';

import { AppContext } from '@/app/context/IsPlayingContext';
import { sendTextToGeminiAi } from '@/utils/sendTextToGeminiAi';
import React, {
  FormEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { unlockAudio } from '@/utils/unlockAudio';

export const TextToSpeech = () => {
  const [userText, setUserText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setIsPlaying } = useContext(AppContext);
  const [spokenText, setSpokenText] = useState('');
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [micActive, setMicActive] = useState(false);

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  // Ref to hold the SpeechRecognition instance
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Unlock speech synthesis on first user interaction (needed on mobile)
  useEffect(() => {
    function handleUserInteraction() {
      unlockAudio();
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    }
    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, {
      once: true,
    });
  }, []);

  // Initialize voices and SpeechRecognition
  useEffect(() => {
    if (!synth) return;

    const getVoices = () => {
      const voices = synth.getVoices();
      const englishVoice = voices.find((voice) => voice.lang.startsWith('en'));
      setSelectedVoice(englishVoice || null);
    };

    getVoices();
    synth.onvoiceschanged = getVoices;

    // Initialize SpeechRecognition if supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
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
          // Update the input live with both final and interim transcripts
          setUserText(finalTranscript + interimTranscript);
        };

        recognition.onerror = (event) => {
          console.error('SpeechRecognition error', event.error);
        };

        // When recognition ends (i.e. mic released), submit the text automatically
        recognition.onend = () => {
          submitUserText();
        };
      } else {
        console.warn('SpeechRecognition API is not supported in this browser.');
      }
    }
  }, [synth]);

  // Function to speak out the Gemini response via SpeechSynthesis
  const speak = (textToSpeak: string) => {
    if (!synth) return;

    setSpokenText(textToSpeak);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    synth.speak(utterance);
    setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      setSpokenText('');
    };
  };

  // Function to submit user text to Gemini API
  const submitUserText = async () => {
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
  };

  // Handler for the form submission (when the user types)
  const handleUserText = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitUserText();
  };

  // When the mic is pressed, start recognition and update mic state
  const handleMicPress = () => {
    if (!recognitionRef.current) return;
    setMicActive(true);
    setUserText(''); // clear any previous text
    recognitionRef.current.start();
  };

  // When the mic is released, stop recognition and update mic state
  const handleMicRelease = () => {
    if (!recognitionRef.current) return;
    setMicActive(false);
    recognitionRef.current.stop();
  };

  return (
    <div className='fixed bottom-0 left-0 w-full bg-gray-800/80 backdrop-blur-md p-4 z-50 border-t border-gray-700'>
      <form
        onSubmit={handleUserText}
        className='max-w-3xl mx-auto flex space-x-3 items-center'
      >
        <input
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          className='flex-grow bg-gray-700 border border-gray-600 outline-none rounded-md placeholder:text-gray-300 p-3 text-gray-300'
          type='text'
          placeholder='Ask me anything...'
        />

        {/* Microphone button using active press effect */}
        <button
          type='button'
          onMouseDown={handleMicPress}
          onMouseUp={handleMicRelease}
          onTouchStart={handleMicPress}
          onTouchEnd={handleMicRelease}
          className={`bg-black bg-opacity-20 rounded-full p-2 w-12 h-12 flex items-center justify-center transition-transform duration-150 
            ${
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

        <button
          disabled={isLoading}
          className='bg-[#6c5ce7] text-white p-3 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-[#4c3ead] transition-colors duration-200'
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
