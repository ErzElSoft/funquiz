import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full text-white text-base font-semibold z-[100] bg-black/80 backdrop-blur-lg py-4 border-t border-white/20 shadow-[0_-4px_32px_rgba(0,0,0,0.6)]">
      <div className="container mx-auto px-8 flex flex-col items-center justify-center gap-2">
        <img src="images/erzelsoft-logo.png" alt="ErzEl Soft" className="h-12" />
        <a href="https://www.erzelsoft.com" target="_blank" rel="noreferrer" className="hover:text-yellow-400 transition-colors font-bold text-sm">www.erzelsoft.com</a>
      </div>
    </footer>
  );
};

export default Footer;
