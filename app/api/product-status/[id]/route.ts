import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Get product with AI status
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        aiStatus: true,
        aiMessage: true,
        aiVerifiedAt: true,
        aiVerified: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Determine status based on product data
    let status: "accepted" | "rejected" | "pending" | "error" | "processing" = "pending"
    let message = "Verification pending"

    if (product.aiVerified && product.aiStatus === "accepted") {
      status = "accepted"
      message = product.aiMessage || "Product verified successfully!"
    } else if (product.aiStatus === "rejected") {
      status = "rejected"
      message = product.aiMessage || "Product does not match the description."
    } else if (product.aiStatus === "error") {
      status = "error"
      message = product.aiMessage || "An error occurred during verification."
    } else if (product.aiStatus === "processing") {
      status = "processing"
      message = product.aiMessage || "AI is analyzing your product..."
    }

    return NextResponse.json({
      status,
      message,
      timestamp: product.aiVerifiedAt,
      productId: product.id,
    })
  } catch (error) {
    console.error("Error fetching product status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
