'use client';
import { AppContext } from '@/app/context/IsPlayingContext';
import { sendTextToGeminiAi } from '@/utils/sendTextToGeminiAi';
import React, { FormEvent, useContext, useState, useEffect } from 'react';

export const TextToSpeech = () => {
  const [userText, setUserText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setIsPlaying } = useContext(AppContext);
  const [spokenText, setSpokenText] = useState(''); // State to hold the currently spoken text
  const [originalVoice, setOriginalVoice] =
    useState<SpeechSynthesisVoice | null>(null);

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  useEffect(() => {
    if (!synth) return;

    const getVoices = () => {
      const voices = synth.getVoices();
      console.log(
        voices &&
          voices.forEach((e) => {
            e.name;
          })
      );
      const ukEnglishMale = voices.find(
        (voice) => voice.name === 'Google UK English Male'
      );
      setOriginalVoice(ukEnglishMale || null);
    };

    getVoices();
    synth.onvoiceschanged = getVoices;
  }, [synth]);

  const speak = (textToSpeak: string) => {
    if (!synth) return;

    setSpokenText(textToSpeak); // Update the spoken text state

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (originalVoice) {
      utterance.voice = originalVoice;
    } else {
      console.warn(
        "Google UK English Male voice not found, using browser's default."
      );
      // The browser will use its own default if the specific voice isn't found
    }
    synth.speak(utterance);
    setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      setSpokenText(''); // Clear the spoken text when finished
    };
  };

  const handleUserText = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const message = await sendTextToGeminiAi(userText);
      speak(message);
    } catch (error) {
      let message = '';
      if (error instanceof Error) message = error.message;
      console.error(message);
    } finally {
      setIsLoading(false);
      setUserText('');
    }
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
