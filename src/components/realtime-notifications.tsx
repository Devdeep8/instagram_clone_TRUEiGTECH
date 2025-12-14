"use client";

import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  X,
  Wifi,
  WifiOff
} from "lucide-react";
import { useRealtimeStore, useUIStore, initializeWebSocket } from "@/stores";

interface RealtimeUpdate {
  type: 'like' | 'unlike' | 'comment' | 'follow' | 'unfollow' | 'post';
  data: any;
  timestamp: number;
}

export default function RealtimeNotifications() {
  const { 
    isConnected, 
    updates, 
    clearUpdates,
    setConnected 
  } = useRealtimeStore();
  
  const { addNotification } = useUIStore();

  useEffect(() => {
    // Initialize WebSocket connection
    initializeWebSocket(useRealtimeStore);
  }, []);

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500 fill-current" />;
      case 'unlike':
        return <Heart className="h-4 w-4 text-gray-400" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'unfollow':
        return <UserPlus className="h-4 w-4 text-gray-400" />;
      case 'post':
        return <Bell className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getUpdateMessage = (update: RealtimeUpdate) => {
    switch (update.type) {
      case 'like':
        return `Someone liked your post`;
      case 'unlike':
        return `Someone unliked your post`;
      case 'comment':
        return `Someone commented on your post`;
      case 'follow':
        return `Someone started following you`;
      case 'unfollow':
        return `Someone unfollowed you`;
      case 'post':
        return `New post from someone you follow`;
      default:
        return 'New activity';
    }
  };

  const handleConnectionToggle = () => {
    setConnected(!isConnected);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleConnectionToggle}
          className="h-8 w-8 p-0"
        >
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
        </Button>
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Real-time Updates */}
      {updates.length > 0 && (
        <Card className="bg-white shadow-lg max-w-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="font-semibold">Live Updates</span>
                {updates.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {updates.length}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearUpdates}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {updates.slice(0, 10).map((update, index) => (
                <div
                  key={`${update.timestamp}-${index}`}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getUpdateIcon(update.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {getUpdateMessage(update)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}