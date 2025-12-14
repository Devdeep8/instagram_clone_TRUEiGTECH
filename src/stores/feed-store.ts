import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Post interface
export interface Post {
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
  likes?: {
    userId: string;
  }[];
  comments?: {
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      username: string;
      name: string;
      avatar?: string;
    };
  }[];
}

// Feed Store
interface FeedState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  setPosts: (posts: Post[]) => void;
  addPosts: (posts: Post[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>()(
  devtools(
    (set, get) => ({
      posts: [],
      isLoading: false,
      error: null,
      page: 1,
      hasMore: true,

      setPosts: (posts) => set({ posts }),

      addPosts: (newPosts) =>
        set((state) => ({
          posts: [...state.posts, ...newPosts],
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setPage: (page) => set({ page }),

      setHasMore: (hasMore) => set({ hasMore }),

      updatePost: (postId, updates) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId ? { ...post, ...updates } : post
          ),
        })),

      reset: () =>
        set({
          posts: [],
          isLoading: false,
          error: null,
          page: 1,
          hasMore: true,
        }),
    }),
    {
      name: "feed-store",
    }
  )
);
