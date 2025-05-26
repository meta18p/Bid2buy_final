"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, Video, CheckCircle, XCircle, AlertCircle, Loader2, X } from "lucide-react"
import { createProduct } from "@/app/actions/product-actions"
import { useToast } from "@/hooks/use-toast"

interface VerificationResponse {
  status: "accepted" | "rejected" | "error"
  message: string
  auctionAdded?: boolean
  error?: string
}

export default function SellForm() {
  const [video, setVideo] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [title, setTitle] = useState("")
  const [startingBid, setStartingBid] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - be more specific about supported formats
    const supportedTypes = ["video/mp4", "video/mov", "video/avi", "video/quicktime", "video/x-msvideo"]
    if (!supportedTypes.includes(file.type.toLowerCase()) && !file.type.startsWith("video/")) {
      setError("Please upload a supported video file (MP4, MOV, AVI)")
      toast({
        variant: "destructive",
        title: "Unsupported file type",
        description: "Please upload a video file in MP4, MOV, or AVI format",
      })
      return
    }

    // Validate file size (30MB limit for better compatibility)
    if (file.size > 30 * 1024 * 1024) {
      setError("Video file size must be less than 30MB")
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a video smaller than 30MB for better processing",
      })
      return
    }

    setVideo(file)
    setError("")
    setVerificationResult(null)
    setProgress(0)
    setCurrentStep("")

    toast({
      title: "Video uploaded successfully",
      description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
    })
  }

  const removeVideo = () => {
    setVideo(null)
    setVerificationResult(null)
    setProgress(0)
    setCurrentStep("")
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleVerify = async () => {
    if (!video) {
      setError("Please upload a video")
      toast({
        variant: "destructive",
        title: "No video selected",
        description: "Please upload a video to verify",
      })
      return
    }

    if (!description.trim()) {
      setError("Please provide a description")
      toast({
        variant: "destructive",
        title: "Description required",
        description: "Please provide a detailed description to verify",
      })
      return
    }

    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters long")
      toast({
        variant: "destructive",
        title: "Description too short",
        description: "Please provide a more detailed description (at least 10 characters)",
      })
      return
    }

    setIsVerifying(true)
    setError("")
    setVerificationResult(null)
    setProgress(5)
    setCurrentStep("Preparing video for upload...")

    try {
      // Create FormData with proper encoding
      const formData = new FormData()

      // Ensure the video file is properly formatted
      const videoFile = new File([video], video.name, {
        type: video.type || "video/mp4",
        lastModified: video.lastModified,
      })

      formData.append("video", videoFile)
      formData.append("description", description.trim())

      setProgress(15)
      setCurrentStep("Uploading to AI server...")

      console.log("Sending verification request...")
      console.log("Video details:", {
        name: videoFile.name,
        type: videoFile.type,
        size: videoFile.size,
      })

      const response = await fetch("/api/verify-product", {
        method: "POST",
        body: formData,
      })

      setProgress(60)
      setCurrentStep("Processing AI response...")

      let result: VerificationResponse

      if (!response.ok) {
        let errorMessage = "Verification failed"

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }

        throw new Error(errorMessage)
      }

      try {
        result = await response.json()
      } catch {
        throw new Error("Invalid response from server")
      }

      setProgress(80)
      setCurrentStep("Processing verification result...")

      setVerificationResult(result)
      setProgress(100)
      setCurrentStep("Verification complete!")

      // Handle different verification results
      if (result.status === "accepted") {
        toast({
          title: "🎉 Verification successful!",
          description: result.message,
        })

        setCurrentStep("Creating product listing...")

        // Create product in local database with AI status
        try {
          const productData = new FormData()
          productData.append("title", title || "Verified Product")
          productData.append("description", description)
          productData.append("startingPrice", startingBid || "10")
          productData.append("duration", "7")
          productData.append("category", "other")
          productData.append("condition", "good")
          productData.append("aiVerified", "true")
          productData.append("aiStatus", "accepted")
          productData.append("aiMessage", result.message)
          productData.append("videos", video)

          const productResult = await createProduct(productData)

          if (productResult.success) {
            setCurrentStep("Product listed successfully!")
            toast({
              title: "🚀 Success!",
              description: "Your product has been listed successfully!",
            })

            // Show success message about external auction
            if (result.auctionAdded) {
              toast({
                title: "📢 Bonus!",
                description: "Product also added to external auction platform!",
              })
            }

            // Redirect to auction page after successful creation
            setTimeout(() => {
              router.push(`/auction/${productResult.productId}`)
            }, 2000)
          } else {
            throw new Error(productResult.error || "Failed to save product")
          }
        } catch (dbError: any) {
          console.error("Database error:", dbError)
          setError("Product verified but failed to save to database")
          toast({
            variant: "destructive",
            title: "Database error",
            description: "Product verified but failed to save. Please try again.",
          })
        }
      } else if (result.status === "rejected") {
        toast({
          variant: "destructive",
          title: "❌ Product rejected",
          description: result.message,
        })
      } else {
        toast({
          variant: "destructive",
          title: "⚠️ Verification error",
          description: result.message,
        })
      }
    } catch (err: any) {
      console.error("Verification error:", err)
      const errorMessage = err.message || "An error occurred during verification"
      setError(errorMessage)
      setProgress(0)
      setCurrentStep("")

      toast({
        variant: "destructive",
        title: "Verification failed",
        description: errorMessage,
      })

      setVerificationResult({
        status: "error",
        message: errorMessage,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const getStatusIcon = () => {
    if (!verificationResult) return null

    switch (verificationResult.status) {
      case "accepted":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    if (!verificationResult) return ""

    switch (verificationResult.status) {
      case "accepted":
        return "border-green-200 bg-green-50 text-green-800"
      case "rejected":
        return "border-red-200 bg-red-50 text-red-800"
      case "error":
        return "border-yellow-200 bg-yellow-50 text-yellow-800"
      default:
        return ""
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-6 w-6" />
            Sell Your Product
          </CardTitle>
          <CardDescription>Upload a video and description for AI verification before listing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Product Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Product Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter product title"
                disabled={isVerifying}
              />
            </div>

            <div>
              <Label htmlFor="startingBid">Starting Bid ($)</Label>
              <Input
                id="startingBid"
                type="number"
                min="1"
                step="0.01"
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                placeholder="10.00"
                disabled={isVerifying}
              />
            </div>
          </div>

          {/* Video Upload */}
          <div className="space-y-4">
            <Label>Product Video</Label>
            {!video ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Upload your product video</p>
                  <p className="text-sm text-gray-500">Supports MP4, MOV, AVI files up to 30MB</p>
                  <p className="text-xs text-gray-400">For best results, use MP4 format</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/mov,video/avi,video/quicktime,video/x-msvideo"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                  disabled={isVerifying}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isVerifying}
                >
                  Choose Video File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={URL.createObjectURL(video)}
                    controls
                    className="w-full max-h-64 rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeVideo}
                    disabled={isVerifying}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <span className="font-medium">{video.name}</span>
                  <span>{(video.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Product Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product in detail (minimum 10 characters)..."
              rows={4}
              className="mt-1"
              disabled={isVerifying}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/10 characters minimum</p>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Progress Display */}
          {isVerifying && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <Alert className={getStatusColor()}>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <AlertDescription className="font-medium">{verificationResult.message}</AlertDescription>
              </div>
              {verificationResult.status === "accepted" && verificationResult.auctionAdded && (
                <p className="text-sm mt-2 font-medium">✓ Product added to auction successfully! Redirecting...</p>
              )}
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleVerify}
              disabled={!video || !description.trim() || description.trim().length < 10 || isVerifying}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {currentStep || "Processing..."}
                </>
              ) : (
                "Verify & List Product"
              )}
            </Button>

            <Button variant="outline" onClick={() => router.back()} disabled={isVerifying}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
