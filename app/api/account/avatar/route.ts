import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    console.log('Avatar upload session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userWallet: session?.user?.walletAddress,
      fullUser: JSON.stringify(session?.user)
    });
    
    if (!session?.user?.id) {
      console.error('No user ID in session');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const extension = file.name.split('.').pop();
    const filename = `${session.user.id}-${randomUUID()}.${extension}`;
    const publicPath = `/avatars/${filename}`;
    const absolutePath = join(process.cwd(), 'public', 'avatars', filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Ensure avatars directory exists
    const avatarsDir = join(process.cwd(), 'public', 'avatars');
    try {
      await import('fs/promises').then(fs => fs.mkdir(avatarsDir, { recursive: true }));
    } catch (error) {
      console.error('Failed to create avatars directory:', error);
    }
    
    await writeFile(absolutePath, buffer);

    // Get current user to check for old avatar
    console.log('Looking for user with ID:', session.user.id);
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, avatarUrl: true, email: true, walletAddress: true }
    });
    console.log('Found user:', currentUser);

    // Delete old avatar if it exists and is not the default
    if (currentUser?.avatarUrl && currentUser.avatarUrl.startsWith('/avatars/')) {
      const oldFilename = currentUser.avatarUrl.split('/').pop();
      if (oldFilename) {
        const oldPath = join(process.cwd(), 'public', 'avatars', oldFilename);
        try {
          await unlink(oldPath);
        } catch (error) {
          // Ignore errors when deleting old avatar
          console.error('Failed to delete old avatar:', error);
        }
      }
    }

    // Check if user actually exists before updating
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!userExists) {
      console.error('User not found in database:', session.user.id);
      // Clean up uploaded file
      try {
        await unlink(absolutePath);
      } catch (error) {
        console.error('Failed to clean up uploaded file:', error);
      }
      return NextResponse.json(
        { error: "Your session is out of sync. Please sign out and sign in again to refresh your account." },
        { status: 404 }
      );
    }

    // Update user's avatar URL in database
    console.log('Updating user avatar:', {
      userId: session.user.id,
      publicPath
    });
    
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: publicPath },
      select: { avatarUrl: true }
    });

    return NextResponse.json({
      success: true,
      avatarUrl: updatedUser.avatarUrl
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true }
    });

    // Delete avatar file if it exists
    if (currentUser?.avatarUrl && currentUser.avatarUrl.startsWith('/avatars/')) {
      const filename = currentUser.avatarUrl.split('/').pop();
      if (filename) {
        const filePath = join(process.cwd(), 'public', 'avatars', filename);
        try {
          await unlink(filePath);
        } catch (error) {
          console.error('Failed to delete avatar file:', error);
        }
      }
    }

    // Clear avatar URL in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: null }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { error: "Failed to delete avatar" },
      { status: 500 }
    );
  }
}