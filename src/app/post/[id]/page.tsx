"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Send, 
  MoreHorizontal, 
  Loader2,
  Share2,
  Bookmark,
  MoreVertical,
  Smile,
  Paperclip
} from "lucide-react";
import { useUIStore, useInteractionStore } from "@/stores";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
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
  likes: {
    id: string;
    user: {
      id: string;
      username: string;
      name: string;
      avatar?: string;
    };
  }[];
  comments: Comment[];
  _count: {
    likes: number;
    comments: number;
  };
}

export default function PostDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  // Zustand stores
  const { addNotification } = useUIStore();
  const { 
    likedPosts, 
    isLiking, 
    bookmarkedPosts,
    isCommenting,
    toggleLike, 
    setLiking,
    toggleBookmark,
    setCommenting,
  } = useInteractionStore();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) {
        if (response.status === 404) {
          addNotification({
            type: 'error',
            message: 'Post not found',
          });
          router.push("/");
          return;
        }
        throw new Error("Failed to fetch post");
      }
      const postData = await response.json();
      setPost(postData);
      
      // Initialize liked state
      if (postData.likes.some((like: any) => like.user.id === session?.user?.id)) {
        toggleLike(postId);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      addNotification({
        type: 'error',
        message: 'Failed to load post',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleLike = async () => {
    if (!session || !post || isLiking.has(postId)) return;

    setLiking(postId, true);
    const isCurrentlyLiked = likedPosts.has(postId);

    try {
      if (isCurrentlyLiked) {
        const response = await fetch(`/api/likes?postId=${postId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toggleLike(postId);
          setPost(prev => prev ? {
            ...prev,
            likes: prev.likes.filter(like => like.user.id !== session.user.id),
            _count: {
              ...prev._count,
              likes: prev._count.likes - 1
            }
          } : null);
          addNotification({
            type: 'info',
            message: 'Post unliked',
          });
        }
      } else {
        const response = await fetch("/api/likes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postId }),
        });

        if (response.ok) {
          const newLike = await response.json();
          toggleLike(postId);
          setPost(prev => prev ? {
            ...prev,
            likes: [...prev.likes, newLike],
            _count: {
              ...prev._count,
              likes: prev._count.likes + 1
            }
          } : null);
          addNotification({
            type: 'success',
            message: 'Post liked!',
          });
        }
      }
    } catch (error) {
      console.error("Error liking post:", error);
      addNotification({
        type: 'error',
        message: 'Failed to like post',
      });
    } finally {
      setLiking(postId, false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !post || !comment.trim() || isCommenting.has(postId)) return;

    setCommenting(postId, true);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, content: comment.trim() }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setPost(prev => prev ? {
          ...prev,
          comments: [newComment, ...prev.comments],
          _count: {
            ...prev._count,
            comments: prev._count.comments + 1
          }
        } : null);
        setComment("");
        addNotification({
          type: 'success',
          message: 'Comment added successfully!',
        });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      addNotification({
        type: 'error',
        message: 'Failed to add comment',
      });
    } finally {
      setCommenting(postId, false);
    }
  };

  const handleBookmark = () => {
    toggleBookmark(postId);
    const isBookmarked = bookmarkedPosts.has(postId);
    addNotification({
      type: isBookmarked ? 'info' : 'success',
      message: isBookmarked ? 'Post removed from bookmarks' : 'Post bookmarked!',
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: `Post by ${post?.author.username}`,
          text: post?.caption,
          url: window.location.href,
        });
        addNotification({
          type: 'success',
          message: 'Post shared successfully!',
        });
      } catch (error) {
        console.error('Error sharing:', error);
      } finally {
        setIsSharing(false);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      addNotification({
        type: 'info',
        message: 'Link copied to clipboard!',
      });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setComment(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const isLiked = likedPosts.has(postId);
  const isBookmarked = bookmarkedPosts.has(postId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-gray-500">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Post not found</p>
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
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              disabled={isSharing}
            >
              {isSharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Post Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Image */}
            <div className="lg:w-1/2">
              <div className="relative aspect-square lg:aspect-auto lg:h-full">
                <img 
                  src={post.imageUrl} 
                  alt={post.caption || "Post image"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Post Info */}
            <div className="lg:w-1/2 flex flex-col">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  <Link href={`/profile/${post.author.username}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatar || ""} />
                      <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link href={`/profile/${post.author.username}`}>
                      <p className="font-semibold hover:underline">{post.author.username}</p>
                    </Link>
                    <p className="text-sm text-gray-500">{post.author.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments */}
              <div className="flex-1 overflow-y-auto p-4 max-h-96">
                {/* Caption */}
                {post.caption && (
                  <div className="mb-4">
                    <div className="flex items-start space-x-3">
                      <Link href={`/profile/${post.author.username}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.author.avatar || ""} />
                          <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold">{post.author.username}</span>{" "}
                          <span>{post.caption}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {post.comments.map((comment) => (
                    <Comment key={comment.id} comment={comment} />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleLike}
                      disabled={isLiking.has(postId)}
                      className={`transition-colors duration-200 ${
                        isLiked 
                          ? "text-red-500 hover:text-red-600" 
                          : "text-gray-600 hover:text-red-500"
                      }`}
                    >
                      <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-500">
                      <MessageCircle className="h-6 w-6" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleShare}
                      disabled={isSharing}
                      className="text-gray-600 hover:text-blue-500"
                    >
                      {isSharing ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Send className="h-6 w-6" />
                      )}
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleBookmark}
                    className={`transition-colors duration-200 ${
                      isBookmarked 
                        ? "text-blue-500 hover:text-blue-600" 
                        : "text-gray-600 hover:text-blue-500"
                    }`}
                  >
                    <Bookmark className={`h-6 w-6 ${isBookmarked ? 'fill-current' : ''}`} />
                  </Button>
                </div>
                
                {/* Likes */}
                <p className="font-semibold mb-2">
                  {post._count.likes} {post._count.likes === 1 ? 'like' : 'likes'}
                </p>
                
                {/* Comment Input */}
                <form onSubmit={handleComment} className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="pr-20 border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!comment.trim() || isCommenting.has(postId)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    {isCommenting.has(postId) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Post"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Comment({ comment }: { comment: Comment }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <div className="flex items-start space-x-3 group">
      <Link href={`/profile/${comment.user.username}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user.avatar || ""} />
          <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm">
            <span className="font-semibold">{comment.user.username}</span>{" "}
            <span>{comment.content}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 mt-1">
          <p className="text-xs text-gray-500">
            {new Date(comment.createdAt).toLocaleDateString()}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`h-6 p-0 text-xs ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
          >
            Like
          </Button>
          <Button variant="ghost" size="sm" className="h-6 p-0 text-xs text-gray-500">
            Reply
          </Button>
        </div>
      </div>
    </div>
  );
}