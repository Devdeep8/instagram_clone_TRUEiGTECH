"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for input method selection
  const [inputMethod, setInputMethod] = useState<'url' | 'upload'>('upload');
  
  // State for URL input
  const [imageUrl, setImageUrl] = useState("");
  
  // State for file upload
  const [file, setFile] = useState<File | null>(null);
  
  // Shared state
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // State for image preview
  const [imagePreview, setImagePreview] = useState("");

  const generateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const prompts = [
        "a beautiful landscape with mountains", "a cute animal playing", "a modern city skyline at sunset",
        "a peaceful beach scene", "a colorful flower garden", "a cozy coffee shop interior",
        "a delicious looking meal", "a person hiking in nature"
      ];
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      
      const response = await fetch('/api/generate-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: randomPrompt }) });
      
      if (!response.ok) throw new Error('Failed to generate image');
      
      const data = await response.json();
      setImageUrl(data.imageUrl);
      setImagePreview(data.imageUrl); // Set preview for generated image
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile)); // Create a preview for the selected file
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (inputMethod === 'url' && !imageUrl.trim()) {
      setError("Please provide an image URL.");
      setIsLoading(false);
      return;
    }
    
    if (inputMethod === 'upload' && !file) {
      setError("Please select an image to upload.");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('caption', caption.trim());

      if (inputMethod === 'url') {
        formData.append('imageUrl', imageUrl.trim());
      } else {
        formData.append('image', file!);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData, // Send as FormData
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Post created successfully!");
        router.push("/");
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
            <h1 className="text-xl font-bold">Create Post</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Share Your Moment</CardTitle>
            <CardDescription>Add an image and share what's on your mind</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              {/* Image Preview */}
              {imagePreview && (
                <div className="space-y-2">
                  <Label>Image Preview</Label>
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img src={imagePreview} alt="Post preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* Input Method Selection */}
              <div className="space-y-2">
                <Label>Image Source</Label>
                <div className="flex space-x-4">
                  <Button type="button" variant={inputMethod === 'url' ? 'default' : 'outline'} onClick={() => setInputMethod('url')}>
                    URL / Generate
                  </Button>
                  <Button type="button" variant={inputMethod === 'upload' ? 'default' : 'outline'} onClick={() => setInputMethod('upload')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>

              {/* Conditional Rendering for Input Fields */}
              {inputMethod === 'url' ? (
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <div className="flex space-x-2">
                    <Input id="imageUrl" type="url" placeholder="Enter image URL or generate one" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required className="flex-1" />
                    <Button type="button" variant="outline" onClick={generateImage} disabled={isGeneratingImage}>
                      {isGeneratingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">Enter a valid image URL or use the generate button to create a random image</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="image-upload">Upload Image</Label>
                  <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} required />
                  <p className="text-sm text-gray-500">Select an image from your device to upload.</p>
                </div>
              )}

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea id="caption" placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} maxLength={2200} />
                <p className="text-sm text-gray-500 text-right">{caption.length}/2200</p>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Share Post
              </Button>
            </CardContent>
          </form>
        </Card>
      </main>
    </div>
  );
}