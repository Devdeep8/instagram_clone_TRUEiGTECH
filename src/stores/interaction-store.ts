import { create } from "zustand";
import { devtools } from "zustand/middleware";

// User interaction store
interface InteractionState {
  // Likes
  likedPosts: Set<string>;
  isLiking: Set<string>;
  toggleLike: (postId: string) => void;
  setLiking: (postId: string, isLiking: boolean) => void;
  setLiked: (postId: string, liked: boolean) => void;

  // Comments
  isCommenting: Set<string>;
  setCommenting: (postId: string, isCommenting: boolean) => void;

  // Follows
  followingUsers: Set<string>;
  isFollowing: Set<string>;
  toggleFollow: (userId: string) => void;
  setFollowingUser: (userId: string, isFollowing: boolean) => void; // This sets the loading state
  setFollowed: (userId: string, followed: boolean) => void;

  // Posts
  creatingPost: boolean;
  setCreatingPost: (creating: boolean) => void;

  // Bookmarks
  bookmarkedPosts: Set<string>;
  toggleBookmark: (postId: string) => void;
}

export const useInteractionStore = create<InteractionState>()(
  devtools(
    (set, get) => ({
      likedPosts: new Set(),
      isLiking: new Set(),

      toggleLike: (postId) =>
        set((state) => {
          const newLikedPosts = new Set(state.likedPosts);
          if (newLikedPosts.has(postId)) {
            newLikedPosts.delete(postId);
          } else {
            newLikedPosts.add(postId);
          }
          return { likedPosts: newLikedPosts };
        }),

      setLiking: (postId, isLiking) =>
        set((state) => {
          const newIsLiking = new Set(state.isLiking);
          if (isLiking) {
            newIsLiking.add(postId);
          } else {
            newIsLiking.delete(postId);
          }
          return { isLiking: newIsLiking };
        }),

      setLiked: (postId, liked) =>
        set((state) => {
          const newLikedPosts = new Set(state.likedPosts);
          if (liked) {
            newLikedPosts.add(postId);
          } else {
            newLikedPosts.delete(postId);
          }
          return { likedPosts: newLikedPosts };
        }),

      isCommenting: new Set(),
      setCommenting: (postId, isCommenting) =>
        set((state) => {
          const newIsCommenting = new Set(state.isCommenting);
          if (isCommenting) {
            newIsCommenting.add(postId);
          } else {
            newIsCommenting.delete(postId);
          }
          return { isCommenting: newIsCommenting };
        }),

      followingUsers: new Set(),
      isFollowing: new Set(),

      toggleFollow: (userId) =>
        set((state) => {
          const newFollowingUsers = new Set(state.followingUsers);
          if (newFollowingUsers.has(userId)) {
            newFollowingUsers.delete(userId);
          } else {
            newFollowingUsers.add(userId);
          }
          return { followingUsers: newFollowingUsers };
        }),

      setFollowingUser: (userId, isFollowing) =>
        set((state) => {
          const newIsFollowing = new Set(state.isFollowing);
          if (isFollowing) {
            newIsFollowing.add(userId);
          } else {
            newIsFollowing.delete(userId);
          }
          return { isFollowing: newIsFollowing };
        }),

      setFollowed: (userId, followed) =>
        set((state) => {
          const newFollowingUsers = new Set(state.followingUsers);
          if (followed) {
            newFollowingUsers.add(userId);
          } else {
            newFollowingUsers.delete(userId);
          }
          return { followingUsers: newFollowingUsers };
        }),

      creatingPost: false,
      setCreatingPost: (creatingPost) => set({ creatingPost }),

      bookmarkedPosts: new Set(),
      toggleBookmark: (postId) =>
        set((state) => {
          const newBookmarkedPosts = new Set(state.bookmarkedPosts);
          if (newBookmarkedPosts.has(postId)) {
            newBookmarkedPosts.delete(postId);
          } else {
            newBookmarkedPosts.add(postId);
          }
          return { bookmarkedPosts: newBookmarkedPosts };
        }),
    }),
    {
      name: "interaction-store",
    }
  )
);
