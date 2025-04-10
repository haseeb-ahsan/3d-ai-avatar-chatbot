import { ChatBotCanvas } from '@/components/ChatBotCanvas';
import TextToSpeech from '@/components/TextToSpeech';
import MuteToggle from '@/components/MuteToggle';
import { IsPlayingProvider } from './context/IsPlayingContext';
import MainHeading from '@/components/MainHeading';

export default function Home() {
  return (
    <main className='h-screen relative'>
      <IsPlayingProvider>
        {/* Main Heading */}
        <MainHeading />
        {/* textToSpeech */}
        <MuteToggle />
        <TextToSpeech />
        {/* chatbotcanvas */}

        <ChatBotCanvas />
      </IsPlayingProvider>
    </main>
  );
}
