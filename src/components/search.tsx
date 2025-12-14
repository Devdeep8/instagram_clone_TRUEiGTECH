"use client";

import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useApiSWR } from "@/hooks/use-api-swr";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "next/link";
import { 
  Loader2, 
  Search, 
  X, 
  TrendingUp, 
  Users, 
  Hash,
  Clock,
  UserPlus
} from "lucide-react";
import { useUIStore, useInteractionStore } from "@/stores";

interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  _count: {
    followers: number;
  };
}

interface TrendingTopic {
  id: string;
  name: string;
  posts: number;
  growth: number;
}

export default function SearchComponent() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "trending">("users");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);
  
  // Zustand stores
  const { 
    searchResults, 
    setSearchResults, 
    setIsSearchOpen,
    isSearchOpen 
  } = useUIStore();
  
  const { 
    followingUsers, 
    isFollowing, 
    toggleFollow,
    setFollowingUser 
  } = useInteractionStore();
  
  const { data: searchResponse, isLoading } = useApiSWR<{ users: User[] }>(
    debouncedQuery.length >= 2 ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null
  );

  // Mock trending data
  const trendingTopics: TrendingTopic[] = [
    { id: "1", name: "webdevelopment", posts: 12500, growth: 15 },
    { id: "2", name: "reactjs", posts: 8900, growth: 8 },
    { id: "3", name: "nextjs", posts: 6700, growth: 22 },
    { id: "4", name: "tailwindcss", posts: 5400, growth: 12 },
    { id: "5", name: "typescript", posts: 9800, growth: 18 },
  ];

  useEffect(() => {
    if (searchResponse?.users) {
      setSearchResults(searchResponse.users);
    }
  }, [searchResponse, setSearchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
  };

  const handleInputFocus = () => {
    setIsOpen(query.length > 0);
  };

  const handleFollow = async (userId: string, username: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setFollowingUser(userId, true);
    
    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followingId: userId }),
      });

      if (response.ok) {
        toggleFollow(userId);
        // Update search results
        setSearchResults(searchResults.map(user => 
          user.id === userId 
            ? { ...user, _count: { ...user._count, followers: user._count.followers + 1 } }
            : user
        ));
      }
    } catch (error) {
      console.error("Error following user:", error);
      setFollowingUser(userId, false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const recentSearches = [
    "web development",
    "react hooks",
    "nextjs tutorial",
    "css tips",
  ];

  const suggestedUsers = [
    { id: "1", username: "john_dev", name: "John Developer", avatar: "", _count: { followers: 1234 } },
    { id: "2", username: "jane_coder", name: "Jane Coder", avatar: "", _count: { followers: 892 } },
    { id: "3", username: "mike_tech", name: "Mike Tech", avatar: "", _count: { followers: 567 } },
  ];

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          placeholder="Search users, tags, posts..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("users")}
              className="flex-1 rounded-none"
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
            <Button
              variant={activeTab === "trending" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("trending")}
              className="flex-1 rounded-none"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {activeTab === "users" && (
              <div className="p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : debouncedQuery.length >= 2 ? (
                  searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <UserResult
                        key={user.id}
                        user={user}
                        isFollowing={followingUsers.has(user.id)}
                        onFollow={handleFollow}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No users found for "{debouncedQuery}"</p>
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {/* Recent Searches */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Recent Searches
                      </h3>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => setQuery(search)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                          >
                            <Hash className="h-3 w-3 inline mr-2 text-gray-400" />
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Suggested Users */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Suggested Users
                      </h3>
                      <div className="space-y-1">
                        {suggestedUsers.map((user) => (
                          <UserResult
                            key={user.id}
                            user={user}
                            isFollowing={followingUsers.has(user.id)}
                            onFollow={handleFollow}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "trending" && (
              <div className="p-2">
                <div className="space-y-2">
                  {trendingTopics.map((topic) => (
                    <Link
                      key={topic.id}
                      href={`/explore/tag/${topic.name}`}
                      className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Hash className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold">#{topic.name}</p>
                            <p className="text-sm text-gray-500">
                              {topic.posts.toLocaleString()} posts
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-green-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {topic.growth}%
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UserResult({ 
  user, 
  isFollowing, 
  onFollow 
}: { 
  user: User; 
  isFollowing: boolean;
  onFollow: (userId: string, username: string, e: React.MouseEvent) => void;
}) {
  return (
    <Link href={`/profile/${user.username}`}>
      <Card className="border-0 rounded-none hover:bg-gray-50 cursor-pointer transition-colors">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{user.username}</p>
              <p className="text-xs text-gray-500">{user.name}</p>
              <p className="text-xs text-gray-400">
                {user._count.followers.toLocaleString()} followers
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={isFollowing ? "outline" : "default"}
            onClick={(e) => onFollow(user.id, user.username, e)}
            disabled={isFollowing}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}