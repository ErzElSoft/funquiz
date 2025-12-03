import React from 'react';
import { Smartphone, MonitorPlay, Zap } from 'lucide-react';

interface Props {
    onSelectMode: (mode: 'HOST' | 'PLAYER') => void;
}

const Landing: React.FC<Props> = ({ onSelectMode }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white relative z-10">
            <div className="text-center mb-12 animate-in slide-in-from-top duration-700">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-10 h-10 text-yellow-300 fill-current animate-pulse" />
                    <h1 className="text-7xl font-black tracking-tighter drop-shadow-lg">ErzEl Quiz</h1>
                </div>
                <p className="text-2xl font-bold opacity-90 text-purple-200">AI-Powered Quiz Platform</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full mb-16">
                {/* Host Card */}
                <button 
                    onClick={() => onSelectMode('HOST')}
                    className="group relative overflow-hidden bg-white/10 backdrop-blur-md p-1 border border-white/20 rounded-3xl hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-8 flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-white text-[#46178f] rounded-2xl flex items-center justify-center shadow-lg transform group-hover:-translate-y-2 transition-transform duration-300">
                            <MonitorPlay className="w-12 h-12" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-4xl font-black mb-2">Host</h2>
                            <p className="text-purple-100 font-medium text-lg">Create & Host a game on the big screen</p>
                        </div>
                    </div>
                </button>

                {/* Player Card */}
                <button 
                    onClick={() => onSelectMode('PLAYER')}
                    className="group relative overflow-hidden bg-black/20 backdrop-blur-md p-1 border border-white/10 rounded-3xl hover:bg-black/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-8 flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:-translate-y-2 transition-transform duration-300">
                            <Smartphone className="w-12 h-12" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-4xl font-black mb-2">Join</h2>
                            <p className="text-gray-300 font-medium text-lg">Enter PIN to play on your device</p>
                        </div>
                    </div>
                </button>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm px-6 py-4 rounded-full border border-white/10 text-sm text-center text-white/60 animate-in fade-in delay-500 duration-1000">
                <span className="font-bold text-white">Pro Tip:</span> Open this page in two separate tabs to test Host vs Player interaction.
            </div>

            <footer className="absolute bottom-4 text-white/50 text-sm font-medium z-20">
              Powered by ErzEl Soft - <a href="https://www.erzelsoft.com" target="_blank" rel="noreferrer" className="hover:text-white underline decoration-white/30 transition-colors">www.erzelsoft.com</a>
            </footer>
        </div>
    );
};

export default Landing;