import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    const { username } = await params;

    const user = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const following = await db.follow.findMany({
      where: {
        followerId: user.id,
      },
      select: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const flattenedFollowing = following.map((f) => f.following);

    // If logged in, check if current user follows these users (likely yes if viewing own profile, but good for generic case)
    let followingWithStatus = flattenedFollowing;
    if (session?.user?.id) {
      const myFollowingIds = await db.follow.findMany({
        where: {
          followerId: session.user.id,
          followingId: {
            in: flattenedFollowing.map((f) => f.id),
          },
        },
        select: { followingId: true },
      });
      const myFollowingSet = new Set(myFollowingIds.map((f) => f.followingId));

      followingWithStatus = flattenedFollowing.map((f) => ({
        ...f,
        isFollowing: myFollowingSet.has(f.id),
        isMe: f.id === session.user.id,
      }));
    }

    return NextResponse.json({ users: followingWithStatus });
  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
