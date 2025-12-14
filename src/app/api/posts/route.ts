import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { uploadImageData } from "@/lib/imagekit";
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth.config";

// Zod schema for validating JSON payloads
const createPostSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required."), // Allow data URLs and regular URLs
  caption: z.string().max(2200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    console.log("Session:", session);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type");
    let imageUrl: string | undefined;
    let caption: string | undefined;

    // --- 1. Parse the request body based on its content type ---
    if (contentType?.includes("application/json")) {
      // Handle JSON payload (for URL input)
      try {
        const body = await request.json();
        const parsedBody = createPostSchema.parse(body);
        imageUrl = parsedBody.imageUrl;
        caption = parsedBody.caption;
      } catch (e) {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
      }
    } else if (contentType?.includes("multipart/form-data")) {
      // Handle FormData payload (for file upload)
      try {
        const formData = await request.formData();
        const file = formData.get("image") as File | null;
        caption = formData.get("caption") as string | undefined;
        
        if (file && file.size > 0) {
          // Convert the uploaded file to a data URL for the CDN upload function
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          imageUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
        } else {
            // If it's FormData but no file, check for an imageUrl field (fallback)
            imageUrl = formData.get("imageUrl") as string | undefined;
        }
      } catch (e) {
        return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Unsupported content type. Use 'application/json' or 'multipart/form-data'." }, { status: 415 });
    }

    // --- 2. Validate that an image was provided ---
    if (!imageUrl || imageUrl.trim() === '') {
      return NextResponse.json({ error: "An image URL or file is required." }, { status: 400 });
    }

    // --- 3. Upload to CDN if the image is a data URL ---
    let finalImageUrl: string;
    if (imageUrl.startsWith('data:')) {
      try {
        console.log("Uploading image to CDN...");
        finalImageUrl = await uploadImageData(imageUrl, 'posts');
      } catch (uploadErr) {
        console.error('Image upload to CDN failed:', uploadErr);
        return NextResponse.json({ error: 'Failed to upload image to CDN.' }, { status: 500 });
      }
    } else {
      // It's a regular URL, use it directly
      finalImageUrl = imageUrl;
    }
    
    // --- 4. Create the post in the database ---
    const post = await db.post.create({
      data: {
        imageUrl: finalImageUrl,
        caption: caption || "", // Ensure caption is not null
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      }
    });

    return NextResponse.json(post, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// --- GET function remains the same ---
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const posts = await db.post.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      }
    });

    const total = await db.post.count();

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}