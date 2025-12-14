"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserPlus, Check, X } from "lucide-react";
import { useInteractionStore } from "@/stores";
import { useSession } from "next-auth/react";

interface FollowListDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  initialTab?: "followers" | "following";
}

interface UserItem {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  isFollowing: boolean;
  isMe: boolean;
}

export default function FollowListDialog({
  isOpen,
  onOpenChange,
  username,
  initialTab = "followers",
}: FollowListDialogProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { isFollowing, toggleFollow, setFollowingUser } = useInteractionStore();

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, activeTab, username]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "followers" ? "followers" : "following";
      const response = await fetch(`/api/users/${username}/${endpoint}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);

        // Hydrate store with follow status
        data.users.forEach((user: UserItem) => {
          setFollowingUser(user.id, user.isFollowing);
        });
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    const isFollowed = isFollowing.has(userId);

    // Optimistic
    toggleFollow(userId);
    setFollowingUser(userId, !isFollowed);

    try {
      const method = isFollowed ? "DELETE" : "POST";
      const body = isFollowed
        ? undefined
        : JSON.stringify({ followingId: userId });
      const url = isFollowed
        ? `/api/follow?followingId=${userId}`
        : "/api/follow";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok) throw new Error("Failed to toggle follow");
    } catch (error) {
      // Revert
      toggleFollow(userId);
      setFollowingUser(userId, isFollowed);
      console.error("Error:", error);
    }
  };

  // Note: "Remove" follower logic would require a new API endpoint.
  // For now, we focus on Following/Unfollowing others.

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[500px] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center">{username}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full h-full flex flex-col"
        >
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-12">
            <TabsTrigger
              value="followers"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none h-full"
            >
              Followers
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none h-full"
            >
              Following
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {activeTab} yet
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => {
                  const isFollowed = isFollowing.has(user.id);
                  const showFollowButton = !user.isMe; // Don't show button for self

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/profile/${user.username}`}
                          onClick={() => onOpenChange(false)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || ""} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div>
                          <Link
                            href={`/profile/${user.username}`}
                            onClick={() => onOpenChange(false)}
                          >
                            <p className="font-semibold text-sm hover:underline">
                              {user.username}
                            </p>
                          </Link>
                          <p className="text-xs text-gray-500">{user.name}</p>
                        </div>
                      </div>

                      {showFollowButton && (
                        <Button
                          variant={isFollowed ? "secondary" : "default"}
                          size="sm"
                          className={isFollowed ? "w-24" : "w-20"}
                          onClick={() => handleFollow(user.id)}
                        >
                          {isFollowed ? "Following" : "Follow"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
