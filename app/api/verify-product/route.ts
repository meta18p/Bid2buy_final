import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting product verification...")

    const formData = await request.formData()
    const video = formData.get("video") as File
    const description = formData.get("description") as string

    // Validate inputs
    if (!video || !description) {
      console.log("Missing video or description")
      return NextResponse.json({ error: "Video and description are required" }, { status: 400 })
    }

    // Validate video file
    if (!video.type.startsWith("video/")) {
      console.log("Invalid video type:", video.type)
      return NextResponse.json({ error: "Please upload a valid video file" }, { status: 400 })
    }

    if (video.size > 50 * 1024 * 1024) {
      console.log("Video too large:", video.size)
      return NextResponse.json({ error: "Video file size must be less than 50MB" }, { status: 400 })
    }

    console.log(`Processing video: ${video.name} (${video.size} bytes)`)
    console.log(`Description: ${description.substring(0, 100)}...`)

    // Create a new FormData with proper boundary handling
    const aiFormData = new FormData()

    // Convert video file to blob with proper content type
    const videoBlob = new Blob([await video.arrayBuffer()], { type: video.type })
    aiFormData.append("video", videoBlob, video.name)
    aiFormData.append("description", description)

    console.log("Sending request to AI verification server...")

    // Send to AI verification server with timeout and proper headers
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout

    let verificationResponse: Response

    try {
      // Use the correct endpoint with trailing slash to avoid redirect
      verificationResponse = await fetch("http://localhost:8000/predict/", {
        method: "POST",
        body: aiFormData,
        signal: controller.signal,
        // Don't set Content-Type header - let the browser set it with boundary
        headers: {
          Accept: "application/json, text/plain",
        },
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      console.error("AI server fetch error:", fetchError)

      if (fetchError.name === "AbortError") {
        return NextResponse.json({
          status: "error",
          message: "Request timed out. Please ensure the AI server is running and try again.",
        })
      }

      return NextResponse.json({
        status: "error",
        message: "Cannot connect to AI server. Please ensure the server is running on localhost:8000",
      })
    }

    clearTimeout(timeoutId)

    console.log(`AI server response status: ${verificationResponse.status}`)

    if (!verificationResponse.ok) {
      let errorDetails = ""
      try {
        const errorText = await verificationResponse.text()
        errorDetails = errorText ? ` - ${errorText}` : ""
      } catch {
        // Ignore error text parsing issues
      }

      console.error(`AI server error: ${verificationResponse.status} ${verificationResponse.statusText}${errorDetails}`)
      return NextResponse.json({
        status: "error",
        message: `AI server returned error ${verificationResponse.status}. Please check your video format and description.`,
      })
    }

    const verificationResult = await verificationResponse.text()
    console.log("AI verification result:", verificationResult)

    let status: string
    let aiResponse: any

    try {
      // Try to parse as JSON first
      aiResponse = JSON.parse(verificationResult)
      console.log("Parsed AI response:", aiResponse)

      // Extract status from JSON response
      status = aiResponse.status?.toLowerCase() || "error"
    } catch (jsonError) {
      // If JSON parsing fails, treat as plain text
      console.log("Failed to parse as JSON, treating as plain text")
      status = verificationResult.trim().toLowerCase()
    }

    console.log("Final status:", status)

    if (status === "accepted") {
      console.log("Product accepted, proceeding with auction listing...")

      // First, try to add to external auction server (optional)
      let auctionAdded = false
      try {
        const auctionController = new AbortController()
        const auctionTimeoutId = setTimeout(() => auctionController.abort(), 30000) // Reduced timeout

        const auctionFormData = new FormData()
        const auctionVideoBlob = new Blob([await video.arrayBuffer()], { type: video.type })
        auctionFormData.append("video", auctionVideoBlob, video.name)
        auctionFormData.append("description", description)

        console.log("Attempting to add to external auction server...")

        const auctionResponse = await fetch("http://localhost:8000/auction/add/", {
          method: "POST",
          body: auctionFormData,
          signal: auctionController.signal,
          headers: {
            Accept: "application/json, text/plain",
          },
        })

        clearTimeout(auctionTimeoutId)

        if (auctionResponse.ok) {
          console.log("Successfully added to external auction server")
          auctionAdded = true
        } else {
          console.warn(`External auction server returned ${auctionResponse.status}, continuing without it`)
        }
      } catch (auctionError: any) {
        console.warn("External auction server not available, continuing without it:", auctionError.message)
      }

      // Always return success since AI verification passed
      // The product will be saved to database by the frontend
      console.log("Product verification completed successfully")
      return NextResponse.json({
        status: "accepted",
        message: "Product verified successfully! Your product matches the description.",
        auctionAdded: auctionAdded,
        aiVerified: true,
      })
    } else if (status === "rejected") {
      console.log("Product rejected by AI")
      return NextResponse.json({
        status: "rejected",
        message: "Product does not match the description. Please try again.",
      })
    } else {
      console.log("Unexpected AI response format:", verificationResult)
      return NextResponse.json({
        status: "error",
        message: `Unexpected AI response format. Please try again.`,
      })
    }
  } catch (error: any) {
    console.error("Verification API error:", error)

    return NextResponse.json(
      {
        status: "error",
        message: "An unexpected error occurred during verification. Please try again.",
      },
      { status: 500 },
    )
  }
}
