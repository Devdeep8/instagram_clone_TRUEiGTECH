"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Grid,
  Heart,
  MessageCircle,
  Loader2,
  Settings,
  Bookmark,
  Calendar,
  MapPin,
  Link as LinkIcon,
} from "lucide-react";
import { useAuthStore, useUIStore, useInteractionStore } from "@/stores";
import FollowListDialog from "@/components/follow-list-dialog";

interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing: boolean;
}

interface Post {
  id: string;
  imageUrl: string;
  caption?: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  // Zustand stores
  const { user: currentUser } = useAuthStore();
  const { addNotification } = useUIStore();
  const {
    followingUsers,
    isFollowing,
    toggleFollow,
    setFollowingUser,
  } = useInteractionStore();

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [showFollowDialog, setShowFollowDialog] = useState(false);
  const [followDialogTab, setFollowDialogTab] = useState<
    "followers" | "following"
  >("followers");

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) {
        if (response.status === 404) {
          addNotification({
            type: "error",
            message: "User not found",
          });
          router.push("/");
          return;
        }
        throw new Error("Failed to fetch user profile");
      }
      const userData = await response.json();
      setUser(userData);

      // Update following state in store
      if (userData.isFollowing) {
        setFollowingUser(userData.id, true);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      addNotification({
        type: "error",
        message: "Failed to load profile",
      });
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`/api/users/${username}/posts`);
      if (!response.ok) throw new Error("Failed to fetch user posts");
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      addNotification({
        type: "error",
        message: "Failed to load posts",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      setLoading(true);
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [username]);

  const handleFollow = async () => {
    if (!session || !user) return;

    setFollowingUser(user.id, true);

    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followingId: user.id }),
      });

      if (response.ok) {
        toggleFollow(user.id);
        setUser((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: true,
                _count: {
                  ...prev._count,
                  followers: prev._count.followers + 1,
                },
              }
            : null
        );
        addNotification({
          type: "success",
          message: `You are now following ${user.username}`,
        });
      } else {
        throw new Error("Failed to follow");
      }
    } catch (error) {
      console.error("Error following user:", error);
      setFollowingUser(user.id, false);
      addNotification({
        type: "error",
        message: "Failed to follow user",
      });
    }
  };

  const handleUnfollow = async () => {
    if (!session || !user) return;

    setFollowingUser(user.id, false);

    try {
      const response = await fetch(`/api/follow?followingId=${user.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toggleFollow(user.id);
        setUser((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: false,
                _count: {
                  ...prev._count,
                  followers: prev._count.followers - 1,
                },
              }
            : null
        );
        addNotification({
          type: "info",
          message: `You unfollowed ${user.username}`,
        });
      } else {
        throw new Error("Failed to unfollow");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      setFollowingUser(user.id, true);
      addNotification({
        type: "error",
        message: "Failed to unfollow user",
      });
    }
  };

  const isOwnProfile = session?.user?.username === username;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                ← Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">{user.username}</h1>
          </div>
          {isOwnProfile && (
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Profile Info */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 md:h-24 md:w-24">
                <AvatarImage src={user.avatar || ""} />
                <AvatarFallback className="text-2xl">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold">{user.username}</h2>
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <>
                      <Link href="/create">
                        <Button>Create Post</Button>
                      </Link>
                      <Button variant="outline">Edit Profile</Button>
                    </>
                  ) : (
                    <>
                      {user.isFollowing || followingUsers.has(user.id) ? (
                        <Button
                          variant="outline"
                          onClick={handleUnfollow}
                          disabled={isFollowing.has(user.id)}
                        >
                          {isFollowing.has(user.id) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Unfollow
                        </Button>
                      ) : (
                        <Button
                          onClick={handleFollow}
                          disabled={isFollowing.has(user.id)}
                        >
                          {isFollowing.has(user.id) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Follow
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-6 mb-4">
                <div className="text-center">
                  <p className="font-semibold">{user._count.posts}</p>
                  <p className="text-gray-500 text-sm">posts</p>
                </div>
                <div
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    setFollowDialogTab("followers");
                    setShowFollowDialog(true);
                  }}
                >
                  <p className="font-semibold">{user._count.followers}</p>
                  <p className="text-gray-500 text-sm">followers</p>
                </div>
                <div
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    setFollowDialogTab("following");
                    setShowFollowDialog(true);
                  }}
                >
                  <p className="font-semibold">{user._count.following}</p>
                  <p className="text-gray-500 text-sm">following</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">{user.name}</p>
                {user.bio && <p className="text-gray-700">{user.bio}</p>}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="bg-white rounded-lg"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="p-6">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No posts yet</p>
                {isOwnProfile && (
                  <Link href="/create">
                    <Button>Create your first post</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="p-6">
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Saved posts feature coming soon!</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <FollowListDialog
        isOpen={showFollowDialog}
        onOpenChange={setShowFollowDialog}
        username={user.username}
        initialTab={followDialogTab}
      />
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/post/${post.id}`}>
      <div className="relative aspect-square group cursor-pointer overflow-hidden">
        <img
          src={post.imageUrl}
          alt={post.caption || "Post"}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-6 text-white">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6" />
              <span className="font-semibold">{post._count.likes}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              <span className="font-semibold">{post._count.comments}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
