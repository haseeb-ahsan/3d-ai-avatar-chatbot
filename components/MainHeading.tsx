'use client';
import React, { useState, useEffect } from 'react';

const MainHeading = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 300); // delay
  }, []);

  return (
    <h1
      className={`fixed top-8 left-1/2 transform -translate-x-1/2 text-3xl font-bold text-gray-600 z-50 transition-transform duration-700 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      3D AI AVATAR
    </h1>
  );
};

export default MainHeading;
