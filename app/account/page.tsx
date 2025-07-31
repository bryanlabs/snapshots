"use client";

export const dynamic = 'force-dynamic';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { UserAvatar } from "@/components/common/UserAvatar";
import { LinkEmailForm } from "@/components/account/LinkEmailForm";
import { CameraIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function AccountPage() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status;
  const router = useRouter();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Remove the problematic sync-session check - auth is handled by layout

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error || "Failed to upload avatar");
        showToast(data.error || "Failed to upload avatar", "error");
      } else {
        showToast("Profile picture updated successfully", "success");
        // Refresh session to get new avatar URL
        sessionData.update();
      }
    } catch {
      setUploadError("Failed to upload avatar");
      showToast("Failed to upload avatar", "error");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAvatar = async () => {
    setIsUploading(true);
    setUploadError("");

    try {
      const response = await fetch("/api/account/avatar", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setUploadError(data.error || "Failed to delete avatar");
        showToast(data.error || "Failed to delete avatar", "error");
      } else {
        showToast("Profile picture removed", "success");
        // Refresh session to get updated avatar URL
        sessionData.update();
      }
    } catch {
      setUploadError("Failed to delete avatar");
      showToast("Failed to delete avatar", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setDeleteError(data.error || "Failed to delete account");
      } else {
        // Show success message
        showToast("Account deleted successfully", "success");
        // Sign out and redirect
        setTimeout(async () => {
          await signOut({ redirect: false });
          router.push("/");
        }, 1000);
      }
    } catch {
      setDeleteError("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      
      <div className="space-y-6">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{session?.user?.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Display Name</p>
              <p className="font-medium">{session?.user?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Tier</p>
              <p className="font-medium capitalize">{session?.user?.tier || "Free"}</p>
            </div>
            {session?.user?.walletAddress && (
              <div>
                <p className="text-sm text-gray-500">Wallet Address</p>
                <p className="font-medium font-mono text-sm">{session.user.walletAddress}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Customize your profile picture</CardDescription>
          </CardHeader>
          <CardContent>
            {uploadError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-center space-x-6">
              <UserAvatar user={session?.user || {}} size="lg" />
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Upload a profile picture to personalize your account.
                  <br />
                  Maximum file size: 5MB. Supported formats: JPEG, PNG, WebP.
                </p>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    size="sm"
                  >
                    <CameraIcon className="w-4 h-4 mr-2" />
                    {isUploading ? "Uploading..." : "Upload Picture"}
                  </Button>
                  {session?.user?.avatarUrl && (
                    <Button
                      onClick={handleDeleteAvatar}
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug session - REMOVE IN PRODUCTION */}
        {false && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Session</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(session?.user, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Link Email - Show for users without email (temporarily showing for all) */}
        {!session?.user?.email && (
          <Card>
            <CardHeader>
              <CardTitle>Link Email Account</CardTitle>
              <CardDescription>Add email and password for easier login and account recovery</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Link an email to your wallet account to enable password recovery and email-based login.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    Link Email Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Link Email to Your Account</DialogTitle>
                    <DialogDescription>
                      Add an email and password to enable additional login options
                    </DialogDescription>
                  </DialogHeader>
                  <LinkEmailForm onSuccess={() => sessionData.update()} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            {deleteError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                  <DialogDescription className="space-y-2">
                    <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                    <p className="font-semibold">This will permanently delete:</p>
                    <ul className="list-disc list-inside text-sm">
                      <li>Your account and all personal data</li>
                      <li>Your download history</li>
                      <li>Any active download sessions</li>
                    </ul>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {}}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}