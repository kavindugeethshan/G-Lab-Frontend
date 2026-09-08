import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import AiAssistantWidget from '../ai/AiAssistantWidget';

export default function Layout({ children }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin');

  if (isAuthPage || isAdminPage) {
    return <main style={{ width: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      <Footer />
      <AiAssistantWidget />
    </>
  );
}
