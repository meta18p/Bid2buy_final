"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createProduct(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      error: "You must be logged in to create a product",
    }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const startingPriceStr = formData.get("startingPrice") as string
  const startingPrice = Number.parseFloat(startingPriceStr)
  const durationStr = formData.get("duration") as string
  const duration = Number.parseInt(durationStr)
  const category = formData.get("category") as string
  const condition = formData.get("condition") as string
  const videos = formData.getAll("videos") as File[]
  const aiVerified = formData.get("aiVerified") as string
  const aiStatus = (formData.get("aiStatus") as string) || "accepted" // Default to accepted for now
  const aiMessage = formData.get("aiMessage") as string

  if (!title || !description || isNaN(startingPrice) || isNaN(duration) || !category || !condition) {
    return {
      error: "All fields are required",
    }
  }

  if (startingPrice <= 0) {
    return {
      error: "Starting price must be greater than 0",
    }
  }

  if (duration <= 0) {
    return {
      error: "Duration must be greater than 0",
    }
  }

  try {
    // Calculate end time
    const endTime = new Date()
    endTime.setDate(endTime.getDate() + duration)

    // For now, we'll store placeholder video URLs
    const videoUrls = videos.map((video, index) => `/uploads/videos/${Date.now()}-${index}-${video.name}`)

    // Create product with AI status
    const product = await prisma.product.create({
      data: {
        title,
        description,
        startingPrice,
        currentPrice: startingPrice,
        endTime,
        category,
        condition,
        sellerId: session.user.id,
        videos: videoUrls, // Changed from images to videos
        aiVerified: aiVerified === "true" || aiStatus === "accepted",
        aiStatus: aiStatus as any,
        aiMessage: aiMessage,
        aiVerifiedAt: aiVerified === "true" || aiStatus === "accepted" ? new Date() : null,
      },
    })

    revalidatePath("/")
    revalidatePath("/auctions")
    revalidatePath("/profile")
    revalidatePath(`/auction/${product.id}`)

    return {
      success: "Product created successfully",
      productId: product.id,
    }
  } catch (error) {
    console.error("Create product error:", error)
    return {
      error: "An error occurred while creating the product. Please try again.",
    }
  }
}

export async function updateProductAIStatus(
  productId: string,
  status: "accepted" | "rejected" | "pending" | "error" | "processing",
  message?: string,
) {
  try {
    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        aiStatus: status,
        aiMessage: message,
        aiVerified: status === "accepted",
        aiVerifiedAt: status === "accepted" ? new Date() : null,
      },
    })

    revalidatePath(`/auction/${productId}`)
    revalidatePath("/auctions")
    return { success: true, product }
  } catch (error) {
    console.error("Update AI status error:", error)
    return { success: false, error: "Failed to update AI status" }
  }
}

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
        bids: {
          include: {
            bidder: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            amount: "desc",
          },
        },
      },
    })

    return product
  } catch (error) {
    console.error("Get product error:", error)
    return null
  }
}

export async function getProducts(category?: string, search?: string, minPrice?: number, maxPrice?: number) {
  try {
    const where: any = {
      endTime: {
        gt: new Date(),
      },
      // Only show accepted products in listings
      aiStatus: "accepted",
    }

    if (category && category !== "all") {
      where.category = category
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ]
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.currentPrice = {}
      if (minPrice !== undefined) {
        where.currentPrice.gte = minPrice
      }
      if (maxPrice !== undefined) {
        where.currentPrice.lte = maxPrice
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        seller: {
          select: {
            name: true,
          },
        },
        bids: {
          select: {
            amount: true,
            bidder: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            amount: "desc",
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return products
  } catch (error) {
    console.error("Get products error:", error)
    return []
  }
}

export async function placeBid(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      error: "You must be logged in to place a bid",
    }
  }

  const productId = formData.get("productId") as string
  const amountStr = formData.get("amount") as string
  const amount = Number.parseFloat(amountStr)

  if (!productId || isNaN(amount)) {
    return {
      error: "Invalid bid data",
    }
  }

  try {
    // Get product
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        seller: true,
      },
    })

    if (!product) {
      return {
        error: "Product not found",
      }
    }

    if (product.endTime < new Date()) {
      return {
        error: "This auction has ended",
      }
    }

    if (product.aiStatus !== "accepted") {
      return {
        error: "This product has not been verified by AI yet",
      }
    }

    if (product.sellerId === session.user.id) {
      return {
        error: "You cannot bid on your own product",
      }
    }

    if (amount <= product.currentPrice) {
      return {
        error: "Bid amount must be higher than current price",
      }
    }

    // Check if user has enough funds (50% of bid amount)
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        balance: true,
      },
    })

    if (!user) {
      return {
        error: "User not found",
      }
    }

    const requiredFunds = amount * 0.5
    if (user.balance < requiredFunds) {
      return {
        error: `You need at least $${requiredFunds.toFixed(2)} in your wallet to place this bid`,
      }
    }

    // Deduct funds from user balance (50% of bid amount)
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        balance: {
          decrement: requiredFunds,
        },
      },
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        amount: -requiredFunds,
        type: "BID",
        status: "completed",
        userId: session.user.id,
      },
    })

    // Create bid
    await prisma.bid.create({
      data: {
        amount,
        bidderId: session.user.id,
        productId,
      },
    })

    // Update product current price
    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        currentPrice: amount,
      },
    })

    revalidatePath(`/auction/${productId}`)
    revalidatePath("/auctions")
    return {
      success: "Bid placed successfully",
    }
  } catch (error) {
    console.error("Place bid error:", error)
    return {
      error: "An error occurred while placing the bid",
    }
  }
}

export async function getUserProducts() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return []
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        sellerId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            bids: true,
          },
        },
      },
    })

    return products
  } catch (error) {
    console.error("Get user products error:", error)
    return []
  }
}

export async function getUserBids() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return []
  }

  try {
    const bids = await prisma.bid.findMany({
      where: {
        bidderId: session.user.id,
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return bids
  } catch (error) {
    console.error("Get user bids error:", error)
    return []
  }
}
