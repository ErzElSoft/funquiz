import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, MonitorPlay } from 'lucide-react';

const Landing: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white relative z-10">
            {/* Title Section */}
            <div className="text-center mb-16">
                <h1 className="text-8xl font-black tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] mb-4" style={{textShadow: '0 0 40px rgba(255,255,255,0.5)'}}>
                    Quiz
                </h1>
                <p className="text-2xl font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
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
                            <h2 className="text-5xl font-black mb-3 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">Host</h2>
                            <p className="text-white/95 font-semibold text-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
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
                            <h2 className="text-5xl font-black mb-3 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">Join</h2>
                            <p className="text-white/95 font-semibold text-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                                Enter PIN to play on your device
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Footer */}
            <footer className="absolute bottom-6 text-white text-sm font-semibold z-20 bg-black/70 backdrop-blur-lg px-8 py-4 rounded-full border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
              Powered by <span className="font-bold">ErzEl Soft</span> - <a href="https://www.erzelsoft.com" target="_blank" rel="noreferrer" className="hover:text-yellow-400 transition-colors font-bold">www.erzelsoft.com</a>
            </footer>
        </div>
    );
};

export default Landing;