"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { useInteractionStore } from "@/stores";

interface SuggestedUser {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  _count: {
    followers: number;
  };
}

export default function SuggestedUsers() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleFollow, isFollowing, setFollowingUser } = useInteractionStore();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch("/api/users/suggestions");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleFollow = async (userId: string) => {
    // Optimistic update handled by store or local state here
    // For suggestions, we usually want to remove them or show "Following"

    const isCurrentlyFollowing = isFollowing.has(userId);
    if (isCurrentlyFollowing) return; // Already following

    setFollowingUser(userId, true);
    toggleFollow(userId); // Optimistic toggle in store

    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to follow");
      }
    } catch (error) {
      console.error("Error following user:", error);
      // Revert optimistic update
      setFollowingUser(userId, false);
      toggleFollow(userId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Suggested for you
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((user) => {
          const isFollowed = isFollowing.has(user.id);

          return (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href={`/profile/${user.username}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar || ""} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link href={`/profile/${user.username}`}>
                    <p className="font-semibold hover:underline text-sm">
                      {user.username}
                    </p>
                  </Link>
                  <p className="text-xs text-gray-500">{user.name}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant={isFollowed ? "secondary" : "default"}
                onClick={() => handleFollow(user.id)}
                disabled={isFollowed}
                className="h-8"
              >
                {isFollowed ? (
                  <>
                    <Check className="mr-2 h-3 w-3" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-3 w-3" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
