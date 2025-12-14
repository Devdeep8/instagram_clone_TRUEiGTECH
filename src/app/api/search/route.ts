import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await db.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: query.trim(),
              mode: "insensitive"
            }
          },
          {
            name: {
              contains: query.trim(),
              mode: "insensitive"
            }
          }
        ]
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        _count: {
          select: {
            followers: true,
          }
        }
      },
      take: 10,
      orderBy: {
        followers: {
          _count: "desc"
        }
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}