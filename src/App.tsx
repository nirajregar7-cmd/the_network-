import React from 'react';
import MainApp from './MainApp';
import VideoPage from './VideoPage';

export default function App() {
  const path = window.location.pathname;
  if (path === '/video') return <VideoPage />;
  return <MainApp />;
}
