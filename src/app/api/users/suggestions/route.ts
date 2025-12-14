import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const limit = 5;

    // specific logic to find users that the current user is NOT following
    // also exclude the current user
    const suggestions = await db.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          {
            followers: {
              none: {
                followerId: userId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: limit,
      orderBy: {
        followers: {
          _count: "desc",
        },
      },
    });

    return NextResponse.json({ users: suggestions });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
