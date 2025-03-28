'use client';
import { AppContext } from '@/app/context/IsPlayingContext';
import { OrbitControls, useAnimations, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useContext, useEffect, useState } from 'react';
import * as THREE from 'three';

const Head = () => {
  const model = useGLTF('/head.glb');
  const animation = useAnimations(model.animations, model.scene);
  const action = animation.actions.Animation;
  const { isPlaying, setIsPlaying } = useContext(AppContext);

  useEffect(() => {
    if (isPlaying) {
      action?.play();
    } else {
      action?.fadeOut(0.5);
      setTimeout(() => {
        action?.stop();
      }, 500);
    }
  }, [isPlaying, action]);

  useEffect(() => {
    model.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          // Set base color (skin)
          child.material.color = new THREE.Color('#FDD088');

          // Check for eye material
          if (child.name.toLowerCase().includes('eye')) {
            child.material.color = new THREE.Color('#3366FF');
          }
        } else if (child.material instanceof THREE.MeshBasicMaterial) {
          // Set base color (skin)
          child.material.color = new THREE.Color('#FDD088');

          // Check for eye material
          if (child.name.toLowerCase().includes('eye')) {
            child.material.color = new THREE.Color('#3366FF');
          }
        }
      }
    });
  }, [model]);

  return <primitive object={model.scene} scale={3} rotation-z={0.2} />;
};

export const ChatBotCanvas = () => {
  return (
    <Canvas className='h-screen'>
      <OrbitControls
        enableZoom={false}
        enableDamping
        // maxPolarAngle={2}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={-Math.PI * 0.5}
        maxAzimuthAngle={Math.PI * 0.5}
      />
      <ambientLight intensity={0.7} color='#ffffff' />
      <directionalLight position={[5, 5, 5]} intensity={0.6} color='#ffffff' />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.4}
        color='#ffffff'
      />
      <Head />
    </Canvas>
  );
};
