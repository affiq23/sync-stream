
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, SyncMessage, RoomState } from "../../../../lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export default function RoomPage() {
  const params = useParams();
  const roomId = Array.isArray(params.roomId)
    ? params.roomId[0]
    : params.roomId;
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [roomState, setRoomState] = useState<RoomState>({
    isPlaying: false,
    currentTime: 0,
    lastAction: "none",
    participants: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    console.log("Room ID from params:", roomId);
    if (!roomId) {
      return;
    }
    console.log("Setting up Supabase channel for room:", roomId);
    const roomChannel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId },
      },
    });
    roomChannel
      .on("broadcast", { event: "sync" }, (payload) => {
        const message = payload.payload as SyncMessage;
        setRoomState((prev) => ({
          ...prev,
          isPlaying: message.action === "play",
          currentTime: message.time,
          lastAction: message.action,
        }));
      })
      .on("presence", { event: "sync" }, () => {
        const presenceState = roomChannel.presenceState();
        const participantCount = Object.keys(presenceState).length;
        setRoomState((prev) => ({ ...prev, participants: participantCount }));
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          roomChannel.track({ userId, joinedAt: new Date().toISOString() });
        }
      });
    setChannel(roomChannel);
    return () => {
      roomChannel.unsubscribe();
    };
  }, [roomId, userId]);

  const sendSyncMessage = (
    action: "play" | "pause" | "seek",
    time: number = roomState.currentTime
  ) => {
    if (!channel) return;
    const message: SyncMessage = {
      action,
      time,
      userId,
      timestamp: Date.now(),
    };
    channel.send({
      type: "broadcast",
      event: "sync",
      payload: message,
    });
  };

  const handleSeek = (offset: number) => {
    const newTime = Math.max(0, roomState.currentTime + offset);
    sendSyncMessage("seek", newTime);
  };

  const generateInjectionScript = () => {
    return `
(function() {
  if (window.syncPartyScript) {
    console.log('Sync Party script already loaded');
    return;
  }
  window.syncPartyScript = true;
  
  const ROOM_ID = '${roomId}';
  const SUPABASE_URL = '${process.env.NEXT_PUBLIC_SUPABASE_URL}';
  const SUPABASE_KEY = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}';
  
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = () => {
    const { createClient } = supabase;
    const client = createClient(SUPABASE_URL, SUPABASE_KEY);
    initSyncParty(client);
  };
  document.head.appendChild(script);

  // This new function tries to find the video, asking the user for help if needed.
  async function findVideoElement() {
    // Attempt 1: Quick Scan
    let video = document.querySelector('video');
    if (video) {
      console.log('Sync Party: Found video with simple selector.');
      return video;
    }

    // Attempt 2: Picker Mode Fallback
    console.log('Sync Party: Could not find video automatically. Entering picker mode.');
    return new Promise((resolve) => {
      const pickerOverlay = document.createElement('div');
      pickerOverlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); color: white; z-index: 9999999; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 24px; font-family: Arial; text-align: center; cursor: pointer;';
      pickerOverlay.innerHTML = '<div>synced</div><div style="font-size: 18px; margin-top: 20px;">Could not find a video automatically.</div><div style="font-size: 18px; margin-top: 10px;">Please click on the video you want to sync.</div>';
      document.body.appendChild(pickerOverlay);

      function clickHandler(event) {
        event.preventDefault();
        event.stopPropagation();

        pickerOverlay.remove();
        document.removeEventListener('click', clickHandler, true);

        let clickedElement = event.target;
        if (clickedElement.tagName !== 'VIDEO') {
          const videoInElement = clickedElement.querySelector('video');
          if (videoInElement) {
            clickedElement = videoInElement;
          }
        }

        if (clickedElement.tagName === 'VIDEO') {
          console.log('Sync Party: Video selected by user.');
          resolve(clickedElement);
        } else {
          alert('Sync Party: That wasn\\'t a video element. Please refresh and try again.');
          resolve(null);
        }
      }
      document.addEventListener('click', clickHandler, true);
    });
  }

  async function initSyncParty(client) {
    const video = await findVideoElement();
    
    if (!video) {
      console.error('Sync Party: No video element found or selected. Aborting.');
      return;
    }
    
    console.log('🎬 Sync Party: Connected to video element', video);
    
    const channel = client.channel('room:' + ROOM_ID);
    let isReceivingUpdate = false;
    
    channel
      .on('broadcast', { event: 'sync' }, (payload) => {
        const message = payload.payload;
        isReceivingUpdate = true;
        try {
          if (message.action === 'play') {
            video.currentTime = message.time;
            video.play().catch(e => console.log('Play failed:', e));
          } else if (message.action === 'pause') {
            video.currentTime = message.time;
            video.pause();
          } else if (message.action === 'seek') {
            video.currentTime = message.time;
          }
        } catch (error) {
          console.error('Error applying sync command:', error);
        }
        setTimeout(() => { isReceivingUpdate = false; }, 100);
      })
      .subscribe();
    
    function sendVideoState(action, time) {
      if (isReceivingUpdate) return;
      channel.send({
        type: 'broadcast',
        event: 'sync',
        payload: { action, time, timestamp: Date.now() }
      });
    }
    
    video.addEventListener('play', () => sendVideoState('play', video.currentTime));
    video.addEventListener('pause', () => sendVideoState('pause', video.currentTime));
    video.addEventListener('seeked', () => sendVideoState('seek', video.currentTime));
    
    let lastUpdateTime = 0;
    video.addEventListener('timeupdate', () => {
      const now = Date.now();
      if (now - lastUpdateTime > 1000) { // Timestamp updated to 1 second
        if (!video.paused) {
          sendVideoState('seek', video.currentTime);
          lastUpdateTime = now;
        }
      }
    });
    
    const panel = document.createElement('div');
    panel.innerHTML = \`<div style="position: fixed; top: 20px; right: 20px; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 8px; font-family: Arial; z-index: 999999; font-size: 14px;"><div style="margin-bottom: 10px;">🎬 Sync Party Active</div><div style="margin-bottom: 5px;">Room: \${ROOM_ID}</div><div style="font-size: 12px; opacity: 0.7;">Video synced with room</div></div>\`;
    document.body.appendChild(panel);
    
    console.log('ready and listening for sync commands');
  }
})();
`;
  };

  const copyScript = () => {
    navigator.clipboard.writeText(generateInjectionScript());
    alert(
      "Script copied to clipboard! Paste it in the browser console on your video page."
    );
  };

  const generateBookmarklet = () => {
    const script = generateInjectionScript();
    return `javascript:${encodeURIComponent(script)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className=" bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent text-4xl font-bold mb-4">Watch Party Room</h1>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 inline-block">
              <div className="text-2xl font-mono font-bold text-blue-300">
                Room ID: {roomId}
              </div>
              <div className="text-sm opacity-75 mt-1">
                Share this ID to sync playback
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Connection Status */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Connection Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Connection:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {isConnected ? "✅ Connected" : "❌ Disconnected"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Participants:</span>
                  <span className="px-3 py-1 bg-blue-500 rounded-full text-sm">
                    {roomState.participants} online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Action:</span>
                  <span className="px-3 py-1 bg-gray-600 rounded-full text-sm">
                    {roomState.lastAction}
                  </span>
                </div>
              </div>
            </div>

            {/* Manual Controls */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Manual Controls</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSeek(-5)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    -5s
                  </button>
                  <button
                    onClick={() => handleSeek(5)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    +5s
                  </button>
                  <button
                    onClick={() => sendSyncMessage("play")}
                    className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    ▶️ Play
                  </button>
                  <button
                    onClick={() => sendSyncMessage("pause")}
                    className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    ⏸️ Pause
                  </button>
                </div>
                <div className="text-sm opacity-75 text-center">
                  Current Time: {roomState.currentTime.toFixed(1)}s
                </div>
              </div>
            </div>
          </div>

          {/* Injection Instructions */}
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Setup Instructions</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Method 1: Copy Script
                </h3>
                <p className="text-sm opacity-75 mb-3">
                  Copy the script below and paste it into your browser's console
                  on the video page (F12 → Console)
                </p>
                <button
                  onClick={copyScript}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Copy Script to Clipboard
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Method 2: Bookmarklet
                </h3>
                <p className="text-sm opacity-75 mb-3">
                  Drag this link to your bookmarks bar, then click it when
                  you're on a video page
                </p>
                <a
                  href={generateBookmarklet()}
                  className="inline-block bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      "Drag this link to your bookmarks bar to create a bookmarklet!"
                    );
                  }}
                >
                  Sync Party Bookmarklet
                </a>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/20 rounded-lg">
              <div className="text-sm">
                <strong>How it works:</strong>
                <ol className="mt-2 space-y-1 list-decimal list-inside">
                  <li>
                    Open YouTube
                  </li>
                  <li>
                    Use one of the methods above to inject the sync script
                  </li>
                  <li>
                    The script will find the video element and sync with this
                    room
                  </li>
                  <li>All participants will see the same playback state!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
