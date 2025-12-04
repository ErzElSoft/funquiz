import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, MonitorPlay } from 'lucide-react';

const Landing: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 pb-32 text-white relative z-10">
            {/* Title Section */}
            <div className="text-center mb-16">
                <h1 className="text-8xl font-semibold tracking-tight text-white mb-4">
                    Quiz
                </h1>
                <p className="text-2xl font-semibold text-white">
                    Learning and fun platform
                </p>
            </div>

            {/* Cards Section */}
            <div className="grid md:grid-cols-2 gap-10 max-w-6xl w-full">
                {/* Host Card */}
                <button 
                    onClick={() => navigate('/host')}
                    className="group relative overflow-hidden bg-gradient-to-br from-purple-600/90 to-blue-600/90 backdrop-blur-xl rounded-3xl hover:from-purple-500/95 hover:to-blue-500/95 transition-all duration-300 hover:scale-[1.03] shadow-[0_20px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_80px_rgba(147,51,234,0.6)] border-2 border-white/30"
                >
                    <div className="p-12 flex flex-col items-center gap-8">
                        <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <MonitorPlay className="w-14 h-14 text-purple-600" strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                            <h2 className="text-5xl font-semibold mb-3 text-white">Host</h2>
                            <p className="text-white/95 font-semibold text-xl">
                                Create & Host a game on the big screen
                            </p>
                        </div>
                    </div>
                </button>

                {/* Player Card */}
                <button 
                    onClick={() => navigate('/join')}
                    className="group relative overflow-hidden bg-gradient-to-br from-green-600/90 to-teal-600/90 backdrop-blur-xl rounded-3xl hover:from-green-500/95 hover:to-teal-500/95 transition-all duration-300 hover:scale-[1.03] shadow-[0_20px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_80px_rgba(16,185,129,0.6)] border-2 border-white/30"
                >
                    <div className="p-12 flex flex-col items-center gap-8">
                        <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                            <Smartphone className="w-14 h-14 text-green-600" strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                            <h2 className="text-5xl font-semibold mb-3 text-white">Join</h2>
                            <p className="text-white/95 font-semibold text-xl">
                                Enter PIN to play on your device
                            </p>
                        </div>
                    </div>
                </button>
            </div>
            
            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 w-full text-white text-base font-semibold z-[100] bg-black/80 backdrop-blur-lg py-4 border-t border-white/20 shadow-[0_-4px_32px_rgba(0,0,0,0.6)]">
              <div className="container mx-auto px-8 flex flex-col items-center justify-center gap-2">
                <img src="/images/erzelsoft-logo.png" alt="ErzEl Soft" className="h-12" />
                <a href="https://www.erzelsoft.com" target="_blank" rel="noreferrer" className="hover:text-yellow-400 transition-colors font-bold text-sm">www.erzelsoft.com</a>
              </div>
            </footer>
        </div>
    );
};

export default Landing;