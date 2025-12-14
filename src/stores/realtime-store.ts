import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

interface RealtimeUpdate {
  type: 'like' | 'unlike' | 'comment' | 'follow' | 'unfollow' | 'post';
  data: any;
  timestamp: number;
}

interface RealtimeState {
  isConnected: boolean;
  updates: RealtimeUpdate[];
  lastUpdate: number;
  setConnected: (connected: boolean) => void;
  addUpdate: (update: RealtimeUpdate) => void;
  clearUpdates: () => void;
  processUpdate: (update: RealtimeUpdate) => void;
}

export const useRealtimeStore = create<RealtimeState>()(
  devtools(
    (set, get) => ({
      isConnected: false,
      updates: [],
      lastUpdate: 0,
      
      setConnected: (isConnected) => set({ isConnected }),
      
      addUpdate: (update) => set((state) => ({
        updates: [update, ...state.updates].slice(0, 50), // Keep last 50 updates
        lastUpdate: update.timestamp,
      })),
      
      clearUpdates: () => set({ updates: [] }),
      
      processUpdate: (update) => {
        const { addUpdate } = get();
        addUpdate(update);
        
        // Auto-clear updates after 5 seconds
        setTimeout(() => {
          set((state) => ({
            updates: state.updates.filter(u => u.timestamp !== update.timestamp),
          }));
        }, 5000);
      },
    }),
    {
      name: 'realtime-store',
    }
  )
);

// WebSocket connection manager
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private store: any;

  constructor(store: any) {
    this.store = store;
    this.connect();
  }

  connect() {
    try {
      // In a real app, this would be your WebSocket server
      // For demo purposes, we'll simulate connection
      this.simulateConnection();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  simulateConnection() {
    // Simulate connection for demo
    setTimeout(() => {
      this.store.getState().setConnected(true);
      this.startSimulatedUpdates();
    }, 1000);
  }

  startSimulatedUpdates() {
    // Simulate random updates for demo
    setInterval(() => {
      const updates = [
        { type: 'like', data: { postId: '1', userId: '2' } },
        { type: 'comment', data: { postId: '1', userId: '3', content: 'Great post!' } },
        { type: 'follow', data: { followerId: '4', followingId: '1' } },
      ];
      
      const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
      this.store.getState().processUpdate({
        ...randomUpdate,
        timestamp: Date.now(),
      });
    }, 10000); // Every 10 seconds for demo
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.store.getState().setConnected(false);
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

// Export singleton instance
let wsManager: WebSocketManager | null = null;

export const initializeWebSocket = (store: any) => {
  if (!wsManager) {
    wsManager = new WebSocketManager(store);
  }
  return wsManager;
};