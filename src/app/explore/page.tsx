"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  TrendingUp, 
  Grid, 
  Filter,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Play,
  Calendar
} from "lucide-react";
import { useUIStore, useInteractionStore } from "@/stores";

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
  type?: 'photo' | 'video';
}

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: 'today',
    media: 'all',
    category: 'all'
  });

  // Zustand stores
  const { addNotification } = useUIStore();
  const { 
    likedPosts, 
    bookmarkedPosts,
    toggleLike,
    toggleBookmark
  } = useInteractionStore();

  // Mock data for demo
  const trendingPosts: Post[] = Array.from({ length: 20 }, (_, i) => ({
    id: `trending-${i}`,
    imageUrl: `https://picsum.photos/400/400?random=${i}`,
    caption: `Trending post #${i + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    author: {
      id: `user-${i}`,
      username: `user${i + 1}`,
      name: `User ${i + 1}`,
      avatar: `https://picsum.photos/100/100?random=${i + 100}`,
    },
    _count: {
      likes: Math.floor(Math.random() * 1000) + 50,
      comments: Math.floor(Math.random() * 100) + 5,
    },
    type: Math.random() > 0.7 ? 'video' : 'photo'
  }));

  const categories = [
    { id: 'all', name: 'All', icon: Grid },
    { id: 'travel', name: 'Travel', icon: TrendingUp },
    { id: 'food', name: 'Food', icon: Heart },
    { id: 'nature', name: 'Nature', icon: TrendingUp },
    { id: 'people', name: 'People', icon: Heart },
    { id: 'animals', name: 'Animals', icon: Heart },
  ];

  useEffect(() => {
    loadPosts();
  }, [activeTab, searchQuery, filters]);

  const loadPosts = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      let filteredPosts = [...trendingPosts];
      
      if (searchQuery) {
        filteredPosts = filteredPosts.filter(post => 
          post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.author.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (filters.media !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.type === filters.media);
      }
      
      setPosts(filteredPosts);
      setLoading(false);
    }, 500);
  };

  const handleLike = (postId: string) => {
    toggleLike(postId);
    addNotification({
      type: likedPosts.has(postId) ? 'info' : 'success',
      message: likedPosts.has(postId) ? 'Post unliked' : 'Post liked!',
    });
  };

  const handleBookmark = (postId: string) => {
    toggleBookmark(postId);
    addNotification({
      type: bookmarkedPosts.has(postId) ? 'info' : 'success',
      message: bookmarkedPosts.has(postId) ? 'Post removed from bookmarks' : 'Post bookmarked!',
    });
  };

  const handleShare = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    addNotification({
      type: 'info',
      message: 'Link copied to clipboard!',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Explore</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-6">
            {/* Date Filters */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Time period:</span>
              <div className="flex gap-2">
                {['today', 'week', 'month', 'year'].map((period) => (
                  <Button
                    key={period}
                    variant={filters.date === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, date: period }))}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <Card key={`skeleton-${i}`} className="aspect-square">
                    <div className="w-full h-full bg-gray-200 animate-pulse" />
                  </Card>
                ))
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                    isLiked={likedPosts.has(post.id)}
                    isBookmarked={bookmarkedPosts.has(post.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card key={category.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Icon className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {Math.floor(Math.random() * 1000) + 100} posts
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.slice(0, 9).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                  isLiked={likedPosts.has(post.id)}
                  isBookmarked={bookmarkedPosts.has(post.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Your saved posts will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function PostCard({ 
  post, 
  onLike, 
  onBookmark, 
  onShare,
  isLiked,
  isBookmarked 
}: {
  post: Post;
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onShare: (postId: string) => void;
  isLiked: boolean;
  isBookmarked: boolean;
}) {
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <Card 
      className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      <div className="relative aspect-square">
        <img 
          src={post.imageUrl} 
          alt={post.caption || "Post"}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Video indicator */}
        {post.type === 'video' && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-black bg-opacity-60 text-white">
              <Play className="h-3 w-3 mr-1" />
              Video
            </Badge>
          </div>
        )}

        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center ${
          showOverlay ? 'bg-opacity-60' : ''
        }`}>
          <div className="flex items-center gap-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                onLike(post.id);
              }}
              className="flex items-center gap-2 hover:scale-110 transition-transform"
            >
              <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{post._count.likes}</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                // Navigate to post
                window.location.href = `/post/${post.id}`;
              }}
              className="flex items-center gap-2 hover:scale-110 transition-transform"
            >
              <MessageCircle className="h-6 w-6" />
              <span className="text-sm">{post._count.comments}</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onBookmark(post.id);
              }}
              className="hover:scale-110 transition-transform"
            >
              <Bookmark className={`h-6 w-6 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onShare(post.id);
              }}
              className="hover:scale-110 transition-transform"
            >
              <Share2 className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Author Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.author.avatar || ""} />
              <AvatarFallback className="text-xs">{post.author.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-white text-sm font-medium">
              {post.author.username}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}