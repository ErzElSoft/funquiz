import React from 'react';
import { X, Server, Database, Activity, Smartphone, Globe } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const ArchitectureInfo: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-[#46178f] flex items-center gap-2">
            <Server className="w-6 h-6" /> System Architecture Blueprint
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-blue-800">
              <strong>Note:</strong> This is a client-side simulation. Below is the architecture design for a production-ready version using Socket.io and Firebase as requested.
            </p>
          </div>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
              <Activity className="w-5 h-5 text-green-600" /> Real-time Communication (Socket.io)
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Events Architecture</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li><code>join_room(roomId, username)</code>: Player -> Server. Adds socket to a room.</li>
                  <li><code>player_joined(playerData)</code>: Server -> Host. Updates lobby UI.</li>
                  <li><code>start_game()</code>: Host -> Server. Triggers game loop on server.</li>
                  <li><code>next_question(questionData)</code>: Server -> All. Syncs UI state.</li>
                  <li><code>submit_answer(answerIndex, time)</code>: Player -> Server. Validates and scores.</li>
                  <li><code>update_scoreboard(rankings)</code>: Server -> Host. Shows results.</li>
                </ul>
              </div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <p className="text-green-400">// Pseudo-Backend Logic</p>
                <p>io.on('connection', (socket) => {'{'}</p>
                <p className="pl-4">socket.on('join_room', (room, user) => {'{'}</p>
                <p className="pl-8">socket.join(room);</p>
                <p className="pl-8">io.to(room).emit('player_joined', user);</p>
                <p className="pl-4">{'}'});</p>
                <p className="pl-4">socket.on('submit_answer', (data) => {'{'}</p>
                <p className="pl-8">const score = calculateScore(data.time, data.correct);</p>
                <p className="pl-8">gameState[room].scores[user] += score;</p>
                <p className="pl-4">{'}'});</p>
                <p>{'}'});</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
               <Database className="w-5 h-5 text-orange-600" /> Data Schema (Firebase/NoSQL)
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded border">
                  <h4 className="font-semibold text-[#46178f]">Collection: quizzes</h4>
                  <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">{`{
  id: "quiz_123",
  hostId: "user_abc",
  title: "Ancient Rome",
  createdAt: Timestamp,
  questions: [
    {
      text: "Who was the first emperor?",
      options: ["Caesar", "Augustus", "Nero", "Trajan"],
      correctIndex: 1,
      timeLimit: 20
    }
  ]
}`}</pre>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded border">
                  <h4 className="font-semibold text-[#46178f]">Collection: active_games</h4>
                  <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">{`{
  id: "GAME_PIN_9921",
  quizId: "quiz_123",
  status: "LOBBY" | "ACTIVE" | "ENDED",
  currentQuestionIndex: 2,
  players: {
    "socket_id_1": {
      name: "CoolCat",
      score: 1500,
      streak: 2
    }
  }
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
              <Globe className="w-5 h-5 text-blue-600" /> State Sync Strategy
            </h3>
            <p className="text-gray-600 mb-4">
              The <strong>Server</strong> is the "Source of Truth". The Host client never calculates scores locally to prevent cheating or desync. The timer runs on the server.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong>Latency Compensation:</strong> Server accepts answers for <code>timeLimit + buffer</code> seconds.</li>
              <li><strong>Race Conditions:</strong> Use atomic transactions (Firebase) or in-memory locking (Redis) when updating scores.</li>
              <li><strong>Reconnection:</strong> Store player state in Redis/Database so if a phone sleeps, they reconnect to the same session ID.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureInfo;