import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '../../lib/video/hooks';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = { 
  open: 7000, 
  profiles: 8500, 
  match: 8500, 
  projects: 9000, 
  close: 8000 
};

const scenePos = [
  { x: '10vw', y: '10vh', scale: 1.5, opacity: 0.4 },
  { x: '60vw', y: '20vh', scale: 1.2, opacity: 0.6 },
  { x: '30vw', y: '60vh', scale: 1.8, opacity: 0.5 },
  { x: '80vw', y: '80vh', scale: 0.9, opacity: 0.8 },
  { x: '50vw', y: '50vh', scale: 2.5, opacity: 0.3 },
];

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#09090b]">
      {/* Persistent Background Layer */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/bg-abstract.png)` }}
          animate={{
            scale: [1.1, 1.15, 1.1],
            rotate: [0, 2, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Animated Gradient Orbs */}
        <motion.div className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-40"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
          animate={{ 
            x: ['-20%', '50%', '0%'], 
            y: ['0%', '40%', '-10%'],
            scale: [1, 1.2, 0.9]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} 
        />
        <motion.div className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-30 right-0 bottom-0"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
          animate={{ 
            x: ['20%', '-30%', '10%'], 
            y: ['10%', '-40%', '20%'] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} 
        />
        
        {/* Network Nodes Texture Layer - Appears conditionally but doesn't remount */}
        <motion.div 
          className="absolute inset-0 bg-cover bg-center mix-blend-screen"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/nodes-bg.png)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: currentScene === 2 || currentScene === 3 ? 0.35 : 0 }}
          transition={{ duration: 1.5 }}
        />
      </div>

      {/* Persistent Midground Accent */}
      <motion.div
        className="absolute w-[30vw] h-[30vw] rounded-full border border-indigo-500/20"
        animate={scenePos[currentScene]}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
        animate={{
          left: ['-20%', '10%', '40%', '20%', '-10%'][currentScene],
          width: ['150%', '80%', '40%', '100%', '120%'][currentScene],
          top: ['40%', '80%', '20%', '60%', '50%'][currentScene],
          opacity: [0.2, 0.5, 0.8, 0.6, 0.3][currentScene],
        }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Foreground Content Scenes */}
      <AnimatePresence mode="sync">
        {currentScene === 0 && <Scene1 key="open" />}
        {currentScene === 1 && <Scene2 key="profiles" />}
        {currentScene === 2 && <Scene3 key="match" />}
        {currentScene === 3 && <Scene4 key="projects" />}
        {currentScene === 4 && <Scene5 key="close" />}
      </AnimatePresence>
    </div>
  );
}