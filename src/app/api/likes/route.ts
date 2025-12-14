import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const likeSchema = z.object({
  postId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postId } = likeSchema.parse(body);

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await db.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        }
      }
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "Post already liked" },
        { status: 400 }
      );
    }

    // Create like
    const like = await db.like.create({
      data: {
        userId: session.user.id,
        postId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          }
        }
      }
    });

    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Like post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Delete like
    const deletedLike = await db.like.deleteMany({
      where: {
        userId: session.user.id,
        postId,
      }
    });

    if (deletedLike.count === 0) {
      return NextResponse.json(
        { error: "Like not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Post unliked successfully" });
  } catch (error) {
    console.error("Unlike post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}