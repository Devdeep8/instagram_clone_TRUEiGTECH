import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth.config";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type") || "following";
    const skip = (page - 1) * limit;

    // Get users that the current user follows
    const following = await db.follow.findMany({
      where: {
        followerId: session.user.id,
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map((f) => f.followingId);

    let whereClause = {};

    if (type === "following") {
      // If not following anyone, return empty feed (client will switch to suggestions or recommended)
      if (followingIds.length === 0) {
        return NextResponse.json({
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }

      whereClause = {
        authorId: {
          in: followingIds,
        },
      };
    } else if (type === "recommended") {
      // Posts from users I don't follow and not me
      whereClause = {
        AND: [
          { authorId: { notIn: followingIds } },
          { authorId: { not: session.user.id } },
        ],
      };
    }

    // Get posts
    const posts = await db.post.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        likes: {
          where: {
            userId: session.user.id,
          },
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const total = await db.post.count({
      where: whereClause,
    });

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get feed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
