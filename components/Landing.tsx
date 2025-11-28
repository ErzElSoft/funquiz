import React from 'react';
import { Smartphone, MonitorPlay } from 'lucide-react';

interface Props {
    onSelectMode: (mode: 'HOST' | 'PLAYER') => void;
}

const Landing: React.FC<Props> = ({ onSelectMode }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#46178f] to-[#250050] flex flex-col items-center justify-center p-8 text-white">
            <div className="text-center mb-16">
                <h1 className="text-6xl font-black mb-4 tracking-tighter">GenHoot!</h1>
                <p className="text-2xl font-medium opacity-80">AI-Powered Quiz Platform</p>
                <div className="mt-4 bg-white/10 p-4 rounded-lg text-sm max-w-md mx-auto border border-white/20">
                    <p><strong>Demo Instructions:</strong> Open this page in two separate tabs.</p>
                    <p>Select <strong>HOST</strong> in one tab and <strong>PLAYER</strong> in the other.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
                <button 
                    onClick={() => onSelectMode('HOST')}
                    className="bg-white text-[#46178f] p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 hover:scale-105 transition-transform group"
                >
                    <div className="p-6 bg-gray-100 rounded-full group-hover:bg-[#46178f] group-hover:text-white transition-colors">
                        <MonitorPlay className="w-16 h-16" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-3xl font-black mb-2">Host a Quiz</h2>
                        <p className="text-gray-500 font-medium">Create a game on the big screen</p>
                    </div>
                </button>

                <button 
                    onClick={() => onSelectMode('PLAYER')}
                    className="bg-[#333] text-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 hover:scale-105 transition-transform group border-2 border-transparent hover:border-white"
                >
                    <div className="p-6 bg-gray-800 rounded-full group-hover:bg-white group-hover:text-black transition-colors">
                        <Smartphone className="w-16 h-16" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-3xl font-black mb-2">Join a Game</h2>
                        <p className="text-gray-400 font-medium">Enter PIN to play on your device</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Landing;
