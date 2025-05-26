"use server"

interface AIVerificationResult {
  isApproved: boolean
  status: "accepted" | "rejected" | "error"
  message: string
  error?: string
}

interface AuctionAddResult {
  success: boolean
  message: string
  error?: string
}

export async function verifyProductWithAI(video: File, description: string): Promise<AIVerificationResult> {
  try {
    // Validate inputs
    if (!video || !description.trim()) {
      return {
        isApproved: false,
        status: "error",
        message: "Video and description are required",
        error: "Missing required fields",
      }
    }

    // Validate video file
    if (!video.type.startsWith("video/")) {
      return {
        isApproved: false,
        status: "error",
        message: "Please upload a valid video file",
        error: "Invalid file type",
      }
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (video.size > maxSize) {
      return {
        isApproved: false,
        status: "error",
        message: "Video file is too large. Please upload a file smaller than 50MB",
        error: "File too large",
      }
    }

    console.log("Starting AI verification...", {
      videoName: video.name,
      videoSize: video.size,
      videoType: video.type,
      descriptionLength: description.length,
    })

    // Create FormData for multipart/form-data
    const formData = new FormData()
    formData.append("video", video, video.name)
    formData.append("description", description.trim())

    // Make request to AI server
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - let the browser set it with boundary
      })

      clearTimeout(timeoutId)

      console.log("AI server response status:", response.status)

      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}`

        if (response.status === 404) {
          errorMessage = "AI verification service not found. Please ensure the server is running on localhost:8000"
        } else if (response.status === 500) {
          errorMessage = "AI server encountered an error. Please try again"
        } else if (response.status === 413) {
          errorMessage = "Video file is too large for the server"
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage = "Invalid request. Please check your video and description"
        }

        return {
          isApproved: false,
          status: "error",
          message: errorMessage,
          error: `HTTP ${response.status}`,
        }
      }

      // Get response text
      const responseText = await response.text()
      console.log("AI server response:", responseText)

      const normalizedResponse = responseText.toLowerCase().trim()

      if (normalizedResponse === "accepted") {
        return {
          isApproved: true,
          status: "accepted",
          message: "Product verified successfully! Your product matches the description.",
        }
      } else if (normalizedResponse === "rejected") {
        return {
          isApproved: false,
          status: "rejected",
          message: "Product does not match the description. Please try again.",
        }
      } else {
        // Handle unexpected responses
        console.warn("Unexpected AI response:", responseText)
        return {
          isApproved: false,
          status: "error",
          message: "Received unexpected response from AI server. Please try again.",
          error: `Unexpected response: ${responseText}`,
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          return {
            isApproved: false,
            status: "error",
            message: "Verification timed out. Please try again with a smaller video file.",
            error: "Request timeout",
          }
        }

        if (fetchError.message.includes("fetch")) {
          return {
            isApproved: false,
            status: "error",
            message: "Cannot connect to AI server. Please ensure the server is running on localhost:8000",
            error: "Connection failed",
          }
        }
      }

      throw fetchError
    }
  } catch (error) {
    console.error("AI verification error:", error)

    return {
      isApproved: false,
      status: "error",
      message: "An unexpected error occurred during verification. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function addToAuction(video: File, description: string): Promise<AuctionAddResult> {
  try {
    console.log("Adding product to auction...", {
      videoName: video.name,
      videoSize: video.size,
      descriptionLength: description.length,
    })

    // Create FormData for multipart/form-data
    const formData = new FormData()
    formData.append("video", video, video.name)
    formData.append("description", description.trim())

    // Make request to auction server
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch("http://localhost:8000/auction/add", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("Auction server response status:", response.status)

      if (!response.ok) {
        let errorMessage = `Failed to add to auction (${response.status})`

        if (response.status === 404) {
          errorMessage = "Auction service not found. Please ensure the server is running on localhost:8000"
        } else if (response.status === 500) {
          errorMessage = "Auction server encountered an error. Please try again"
        } else if (response.status === 413) {
          errorMessage = "Video file is too large for the auction server"
        }

        return {
          success: false,
          message: errorMessage,
          error: `HTTP ${response.status}`,
        }
      }

      // Try to get response text for additional info
      let responseText = ""
      try {
        responseText = await response.text()
        console.log("Auction server response:", responseText)
      } catch (textError) {
        console.warn("Could not read auction server response text:", textError)
      }

      return {
        success: true,
        message: "Product successfully added to auction!",
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          return {
            success: false,
            message: "Adding to auction timed out. Please try again.",
            error: "Request timeout",
          }
        }

        if (fetchError.message.includes("fetch")) {
          return {
            success: false,
            message: "Cannot connect to auction server. Please ensure the server is running on localhost:8000",
            error: "Connection failed",
          }
        }
      }

      throw fetchError
    }
  } catch (error) {
    console.error("Add to auction error:", error)

    return {
      success: false,
      message: "An unexpected error occurred while adding to auction. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
