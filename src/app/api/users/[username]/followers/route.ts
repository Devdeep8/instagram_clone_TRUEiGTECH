import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> } // Correct type for dynamic route params
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

    const followers = await db.follow.findMany({
      where: {
        followingId: user.id,
      },
      select: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const flattenedFollowers = followers.map((f) => f.follower);

    // If logged in, check if current user follows these followers
    let followersWithStatus = flattenedFollowers;
    if (session?.user?.id) {
      const myFollowingIds = await db.follow.findMany({
        where: {
          followerId: session.user.id,
          followingId: {
            in: flattenedFollowers.map((f) => f.id),
          },
        },
        select: { followingId: true },
      });
      const myFollowingSet = new Set(myFollowingIds.map((f) => f.followingId));

      followersWithStatus = flattenedFollowers.map((f) => ({
        ...f,
        isFollowing: myFollowingSet.has(f.id),
        isMe: f.id === session.user.id,
      }));
    }

    return NextResponse.json({ users: followersWithStatus });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
