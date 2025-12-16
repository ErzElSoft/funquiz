import React, { useState } from 'react';
import { Player } from '../types';
import { Users, Play, Music, ArrowLeft, X, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  pin: string;
  players: Player[];
  onStart: () => void;
  onAddFakePlayer: () => void;
  onBack?: () => void;
  onExit?: () => void;
}

const Lobby: React.FC<Props> = ({ pin, players, onStart, onBack, onExit }) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleExit = () => {
    if (onExit) {
      onExit();
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full p-4 sm:p-8 relative z-10 overflow-y-auto pb-32">
      
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 border border-white/20 text-white"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}
        
        <div className="flex-1"></div>
        
        {onExit && (
          showExitConfirm ? (
            <div className="flex items-center gap-3 bg-red-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-red-500/30">
              <span className="text-white font-semibold text-sm">Exit quiz?</span>
              <button
                onClick={handleExit}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-full text-white font-bold transition-all text-sm"
              >
                Yes
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white font-bold transition-all text-sm"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowExitConfirm(true)}
              className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-red-600/80 hover:bg-red-600 rounded-full transition-all duration-200 border border-red-500/30 text-white"
              title="Exit Quiz"
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          )
        )}
      </div>

      {/* Header Info */}
      <div className="flex flex-col lg:flex-row justify-center items-center gap-6 mb-8 sm:mb-12">
        {/* QR Code */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl text-center shadow-2xl animate-in slide-in-from-left">
          <p className="text-sm font-semibold opacity-80 mb-3 uppercase tracking-widest flex items-center justify-center gap-2">
            <QrCode className="w-4 h-4" />
            Scan to Join
          </p>
          <div className="bg-white p-4 rounded-2xl relative">
            <QRCodeSVG
              value={`https://erzelsoft.com/quiz/join?pin=${pin}`}
              size={200}
              level="H"
              includeMargin={false}
              fgColor="#46178f"
            />
            {/* Logo overlay in center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black p-2 rounded-lg shadow-lg">
              <img src="/quiz/images/erzelsoft-logo.png" alt="ErzEl" className="w-10 h-10 object-contain" />
            </div>
          </div>
          <p className="text-xs opacity-60 mt-2">erzelsoft.com/quiz/join</p>
        </div>

        {/* PIN Display */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-8 rounded-3xl text-center shadow-2xl animate-in slide-in-from-top w-full sm:w-auto">
          <p className="text-sm sm:text-xl font-semibold opacity-80 mb-2 uppercase tracking-widest">Game PIN</p>
          <div className="bg-white text-[#46178f] px-4 sm:px-8 py-2 rounded-xl inline-block transform hover:rotate-0 transition-transform duration-300">
             <p className="text-4xl sm:text-7xl font-black tracking-widest drop-shadow-sm">{pin}</p>
          </div>
        </div>
        
        {/* Player Count */}
        <div className="bg-black/20 backdrop-blur-md px-6 sm:px-8 py-3 sm:py-4 rounded-2xl flex items-center gap-3 sm:gap-4 border border-white/10 animate-in slide-in-from-right">
          <Users className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" />
          <span className="text-3xl sm:text-4xl font-black">{players.length}</span>
        </div>
      </div>

      {/* Players Grid */}
      <div className="w-full relative mb-6">
        <div className="flex flex-wrap gap-4 content-start p-4">
          {players.map((player, idx) => {
             // Generate random aesthetic for player card
             const rotations = ['rotate-1', '-rotate-2', 'rotate-3', '-rotate-1'];
             const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
             const randomRotate = rotations[idx % rotations.length];
             const randomColor = colors[idx % colors.length];

             const isCustomPhoto = player.avatar?.startsWith('data:image');
             
             return (
                <div
                key={player.id}
                className={`${randomColor} text-white font-black px-6 py-4 rounded-xl shadow-lg transform ${randomRotate} hover:scale-110 hover:z-10 hover:rotate-0 transition-all duration-300 animate-in zoom-in flex items-center gap-3 border-2 border-white/20`}
                style={{ animationDelay: `${idx * 100}ms` }}
                >
                {player.avatar && (
                  isCustomPhoto ? (
                    <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full object-cover border-2 border-white/50" />
                  ) : (
                    <span className="text-3xl">{player.avatar}</span>
                  )
                )}
                <span className="text-xl text-shadow">{player.name}</span>
                <div className="bg-black/20 px-2 py-1 rounded text-sm font-bold">
                    {player.score}
                </div>
                </div>
             );
          })}
          
          {players.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 animate-pulse">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4">
                 <Music className="w-10 h-10" />
              </div>
              <p className="text-3xl font-black">Waiting for players...</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto pt-6">
         <div className="text-xs sm:text-sm font-bold opacity-50 text-center sm:text-left">Waiting for host to start...</div>
         <button
          onClick={onStart}
          disabled={players.length === 0}
          className={`w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 rounded-full text-xl sm:text-2xl font-black shadow-2xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 ${
            players.length > 0
              ? 'bg-white text-[#46178f] hover:shadow-white/20 cursor-pointer'
              : 'bg-black/20 text-white/20 cursor-not-allowed'
          }`}
        >
          Start Game <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
        </button>
      </div>
    </div>
  );
};

export default Lobby;