// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    router.push(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
                sync-stream
              </span>
            </h1>
            <p className="text-xl text-blue-200 mb-2">
              Watch videos together on Youtube, perfectly synchronized.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Create Room */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
              <h2 className="text-2xl font-bold mb-4">Start a Watch Party</h2>
              <p className="text-blue-200 mb-6">
                Create a new room and invite friends to sync your viewing
                experience
              </p>
              <button
                onClick={createRoom}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-400  hover:from-green-600 hover:to-green-400 px-6 py-3 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
              >
                Create Room
              </button>
            </div>

            {/* Join Room */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
         
              <h2 className="text-2xl font-bold mb-4">Join a Room</h2>
              <p className="text-blue-200 mb-6">
                Enter a room ID to join an existing watch party
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter Room ID (e.g. ABC123)"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:bg-white/15"
                />
                <button
                  onClick={joinRoom}
                  disabled={!roomId.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-green-600 hover:to-green-400 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"></div>
                <h3 className="font-semibold mb-2">Create or Join Room</h3>
                <p className="text-sm text-blue-200">
                  Start a new watch party or join friends using a room ID
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"></div>
                <h3 className="font-semibold mb-2">Inject Sync Script</h3>
                <p className="text-sm text-blue-200">
                  Copy script and paste it into your video site's console
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"></div>
                <h3 className="font-semibold mb-2">Watch Together</h3>
                <p className="text-sm text-blue-200">
                  Play, pause, and seek - everyone stays perfectly in sync!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
