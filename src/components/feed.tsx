"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Loader2,
  Search,
  Menu,
  X,
  Bell,
  Settings,
  Compass,
} from "lucide-react";
import { useFeedStore, useUIStore, useInteractionStore } from "@/stores";
import SearchComponent from "@/components/search";
import NotificationToast from "@/components/notification-toast";
import SuggestedUsers from "@/components/suggested-users";
import { type Post } from "@/stores/feed-store";



export default function Feed() {
  const { data: session } = useSession();

  // Zustand stores
  const {
    posts,
    isLoading,
    error,
    page,
    hasMore,
    setPosts,
    addPosts,
    setLoading,
    setError,
    setPage,
    setHasMore,
    updatePost,
  } = useFeedStore();

  const {
    searchQuery,
    isSearchOpen,
    isMobileMenuOpen,
    notifications,
    setSearchQuery,
    setIsSearchOpen,
    setIsMobileMenuOpen,
    addNotification,
    removeNotification,
  } = useUIStore();

  const {
    likedPosts,
    isLiking,
    bookmarkedPosts,
    toggleLike,
    setLiking,
    toggleBookmark,
    isFollowing,
    toggleFollow,
    setFollowingUser,
    setLiked,
    setFollowed,
  } = useInteractionStore();

  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {}
  );
  const [feedType, setFeedType] = useState<"following" | "recommended">("following");

  const fetchFeed = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/feed?page=${pageNum}&limit=10&type=${feedType}`);
      if (!response.ok) throw new Error("Failed to fetch feed");

      const data = await response.json();

      if (append) {
        addPosts(data.posts);
      } else {
        setPosts(data.posts);
      }

      setPage(pageNum);

      // Check if we reached the end of following feed
      if (pageNum >= data.pagination.pages && feedType === "following" && data.posts.length > 0) {
        setFeedType("recommended");
        setHasMore(true); // Keep enabled for recommended switch
        // Optionally reset page here if we want immediate switch, but loadMore handles next page
        // Actually, we want the NEXT loadMore to fetch recommended page 1.
        // So we might need to reset page in store or handle it in loadMore.
        setPage(0); // Next loadMore will call page 1
      } else {
         setHasMore(pageNum < data.pagination.pages);
      }

      // Initialize liked posts state
      // Initialize liked and followed state
      data.posts.forEach((post: Post) => {
         // Hydrate liked state
         if (post.likes && post.likes.length > 0) {
            setLiked(post.id, true);
         }
         // Hydrate followed state
         setFollowed(post.author.id, true);
      });
    } catch (error) {
      console.error("Error fetching feed:", error);
      setError("Failed to load feed");
      addNotification({
        type: "error",
        message: "Failed to load feed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchFeed();
    }
  }, [session]);

  const handleLike = async (postId: string) => {
    // Optimistic UI update
    const isCurrentlyLiked = likedPosts.has(postId);
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Immediately update UI
    toggleLike(postId);
    updatePost(postId, {
      _count: {
        likes: isCurrentlyLiked ? post._count.likes - 1 : post._count.likes + 1,
        comments: post._count.comments,
      },
    });

    try {
      let response;
      if (isCurrentlyLiked) {
        response = await fetch(`/api/likes?postId=${postId}`, {
          method: "DELETE",
        });
      } else {
        response = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to like/unlike");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on failure
      toggleLike(postId);
      updatePost(postId, {
        _count: {
          likes: post._count.likes,
          comments: post._count.comments,
        },
      });
      addNotification({
        type: "error",
        message: "Failed to update like. Please try again.",
      });
    }
  };

  const handleFollow = async (userId: string) => {
    const isFollowed = isFollowing.has(userId);

    // Optimistic Update
    toggleFollow(userId); // Toggle in store
    setFollowingUser(userId, !isFollowed);

    try {
      let response;
      if (isFollowed) {
        response = await fetch(`/api/follow?followingId=${userId}`, {
          method: "DELETE",
        });
      } else {
        response = await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingId: userId }),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to follow/unfollow");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      // Revert
      toggleFollow(userId);
      setFollowingUser(userId, isFollowed);
      addNotification({
        type: "error",
        message: "Failed to update follow status.",
      });
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, content: content.trim() }),
      });

      if (response.ok) {
        updatePost(postId, {
          _count: {
            comments:
              (posts.find((p) => p.id === postId)?._count.comments || 0) + 1,
            likes: posts.find((p) => p.id === postId)?._count.likes || 0,
          },
        });

        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        addNotification({
          type: "success",
          message: "Comment added successfully!",
        });
      }
    } catch (error) {
      console.error("Error commenting:", error);
      addNotification({
        type: "error",
        message: "Failed to add comment. Please try again.",
      });
    }
  };

  const handleBookmark = (postId: string) => {
    toggleBookmark(postId);
    const isBookmarked = bookmarkedPosts.has(postId);
    addNotification({
      type: isBookmarked ? "info" : "success",
      message: isBookmarked
        ? "Post removed from bookmarks"
        : "Post bookmarked!",
    });
  };

  const loadMore = () => {
    const nextPage = page + 1;
    fetchFeed(nextPage, true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearchOpen(true);
    }
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-gray-500">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-xl font-bold">Instagram Clone</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block w-64">
              <SearchComponent />
            </div>
            <Link href="/explore">
              <Button variant="outline" size="sm">
                <Compass className="h-4 w-4 mr-2" />
                Explore
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Link href="/create">
              <Button variant="outline" size="sm">
                Create
              </Button>
            </Link>
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
            <Link href={`/profile/${session?.user?.username}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>
                  {session?.user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="md:hidden border-t p-4">
            <SearchComponent />
          </div>
        )}
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-white w-64 h-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-4">
              <Link
                href={`/profile/${session?.user?.username}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback>
                      {session?.user?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">Profile</span>
                </div>
              </Link>
              <Link href="/create" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded">
                  <Send className="h-5 w-5" />
                  <span>Create Post</span>
                </div>
              </Link>
              <div className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </div>
              <div className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => fetchFeed()}>Try Again</Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No posts yet. Follow some users to see their posts!
            </p>
            <SuggestedUsers />
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onBookmark={handleBookmark}
                commentInput={commentInputs[post.id] || ""}
                onCommentChange={(postId, value) =>
                  setCommentInputs((prev) => ({ ...prev, [postId]: value }))
                }
                isLiked={likedPosts.has(post.id)}
                isLiking={isLiking.has(post.id)}
                isBookmarked={bookmarkedPosts.has(post.id)}
                onFollow={() => handleFollow(post.author.id)}
                isFollowing={isFollowing.has(post.author.id)}
                currentUserId={session?.user?.id}
              />
            ))}
            
            {feedType === "recommended" && posts.length > 0 && (
                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-50 px-2 text-gray-500">Suggested Posts</span>
                    </div>
                </div>
            )}

            {hasMore && (
              <div className="text-center py-4">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function PostCard({
  post,
  onLike,
  onComment,
  onBookmark,
  commentInput,
  onCommentChange,
  isLiked,
  isLiking,
  isBookmarked,
  onFollow,
  isFollowing,
  currentUserId,
}: {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onBookmark: (postId: string) => void;
  commentInput: string;
  onCommentChange: (postId: string, value: string) => void;
  isLiked: boolean;
  isLiking: boolean;
  isBookmarked: boolean;
  onFollow: () => void;
  isFollowing: boolean;
  currentUserId?: string;
}) {
  const [showComments, setShowComments] = useState(false);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentInput.trim()) {
      onComment(post.id);
    }
  };

  return (
    <Card className="bg-white hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-3">
          <Link href={`/profile/${post.author.username}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatar || ""} />
              <AvatarFallback>{post.author.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/profile/${post.author.username}`}>
              <p className="font-semibold hover:underline">
                {post.author.username}
              </p>
            </Link>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">{post.author.name}</p>
             
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="hover:bg-gray-100">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 group">
          <img
            src={post.imageUrl}
            alt={post.caption || "Post image"}
            className="w-full h-full object-cover transition-transform"
          />
          <div className="absolute inset-0 group-hover:bg-opacity-10 transition-all duration-300" />
        </div>

        {/* Actions */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              {/* --- CORRECTED LIKE BUTTON --- */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike(post.id)}
                disabled={isLiking}
                className="text-gray-600 hover:text-red-500 transition-colors duration-200 p-2"
              >
                <Heart
                  className={`h-6 w-6 transition-colors duration-200 ${
                    isLiked
                      ? "fill-red-500 text-red-500" // Apply fill and text color directly to the icon
                      : ""
                  }`}
                />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="text-gray-600 hover:text-blue-500 transition-colors duration-200 p-2"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-blue-500 transition-colors duration-200 p-2"
              >
                <Send className="h-6 w-6" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBookmark(post.id)}
              className={`transition-colors duration-200 p-2 ${
                isBookmarked
                  ? "text-blue-500 hover:text-blue-600"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              <Bookmark
                className={`h-6 w-6 ${isBookmarked ? "fill-current" : ""}`}
              />
            </Button>
          </div>

          {/* Likes */}
          <p className="font-semibold mb-2">
            {post._count.likes} {post._count.likes === 1 ? "like" : "likes"}
          </p>

          {/* Caption */}
          {post.caption && (
            <div className="mb-2">
              <span className="font-semibold">{post.author.username}</span>{" "}
              <span>{post.caption}</span>
            </div>
          )}

          {/* Comments */}
          {post._count.comments > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 p-0 h-auto text-sm hover:text-gray-700"
              onClick={() => setShowComments(!showComments)}
            >
              View all {post._count.comments} comments
            </Button>
          )}

          {/* Comment Input */}
          <form
            onSubmit={handleCommentSubmit}
            className="mt-3 flex items-center space-x-2"
          >
            <Input
              placeholder="Add a comment..."
              value={commentInput}
              onChange={(e) => onCommentChange(post.id, e.target.value)}
              className="flex-1 border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!commentInput.trim()}
              className="text-blue-500 hover:text-blue-600"
            >
              Post
            </Button>
          </form>

          {/* Timestamp */}
          <p className="text-xs text-gray-500 mt-2">
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
