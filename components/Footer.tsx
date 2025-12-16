import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full text-white text-xs font-semibold z-[100] bg-black/90 backdrop-blur-lg py-2 border-t border-white/20 shadow-[0_-4px_32px_rgba(0,0,0,0.6)]">
      <div className="container mx-auto px-4 flex items-center justify-center">
        <a href="https://www.erzelsoft.com" target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform">
          <img src="/quiz/images/erzelsoft-logo.png" alt="ErzEl Soft" className="h-8" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
