import { notFound } from "next/navigation"
import { getProductById } from "@/app/actions/product-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Play } from "lucide-react"
import BidForm from "@/components/bid-form"
import AuctionTimer from "@/components/auction-timer"
import { AIStatusIndicator } from "@/components/ai-status-indicator"
import { RealTimeStatusUpdater } from "@/components/real-time-status-updater"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface AuctionPageProps {
  params: {
    id: string
  }
}

export default async function AuctionPage({ params }: AuctionPageProps) {
  const session = await getServerSession(authOptions)
  const resolvedParams = await params
  const product = await getProductById(resolvedParams.id)

  if (!product) {
    notFound()
  }

  const isExpired = new Date(product.endTime) < new Date()
  const isOwner = session?.user?.id === product.sellerId

  // Determine AI status from product data
  const getAIStatus = () => {
    if (product.aiVerified && product.aiStatus === "accepted") {
      return {
        status: "accepted" as const,
        message: product.aiMessage || "Product verified successfully!",
        timestamp: product.aiVerifiedAt ? new Date(product.aiVerifiedAt) : undefined,
      }
    } else if (product.aiStatus === "rejected") {
      return {
        status: "rejected" as const,
        message: product.aiMessage || "Product does not match the description.",
        timestamp: product.aiVerifiedAt ? new Date(product.aiVerifiedAt) : undefined,
      }
    } else if (product.aiStatus === "error") {
      return {
        status: "error" as const,
        message: product.aiMessage || "An error occurred during verification.",
        timestamp: product.aiVerifiedAt ? new Date(product.aiVerifiedAt) : undefined,
      }
    } else if (product.aiStatus === "processing") {
      return {
        status: "processing" as const,
        message: product.aiMessage || "AI is analyzing your product...",
        timestamp: undefined,
      }
    } else {
      return {
        status: "pending" as const,
        message: "Verification pending",
        timestamp: undefined,
      }
    }
  }

  const aiStatus = getAIStatus()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Video Gallery */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <video
                    src={product.images[0] || "/placeholder-video.mp4"}
                    controls
                    className="w-full h-full object-cover"
                    poster="/video-poster.jpg"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <Play className="h-16 w-16 text-gray-400" />
                    <span className="ml-3 text-gray-500">No video available</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Videos */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {product.images.slice(1).map((video, index) => (
                <div key={index} className="aspect-video bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                  <video
                    src={video}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    muted
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold">{product.title}</h1>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{product.category}</Badge>
                <Badge variant="outline">{product.condition}</Badge>
              </div>
            </div>

            {/* AI Status Section */}
            <div className="mb-6">
              {aiStatus.status === "pending" || aiStatus.status === "processing" ? (
                <RealTimeStatusUpdater
                  productId={product.id}
                  initialStatus={aiStatus.status}
                  initialMessage={aiStatus.message}
                  initialTimestamp={aiStatus.timestamp}
                />
              ) : (
                <AIStatusIndicator status={aiStatus.status} message={aiStatus.message} timestamp={aiStatus.timestamp} />
              )}
            </div>

            <p className="text-muted-foreground mb-4">{product.description}</p>

            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <User className="h-4 w-4 mr-1" />
              <span>Sold by {product.seller.name || "Anonymous"}</span>
            </div>
          </div>

          {/* Current Price */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Price</span>
                <span className="text-3xl font-bold text-green-600">${product.currentPrice.toFixed(2)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Clock className="h-4 w-4 mr-1" />
                <AuctionTimer endTime={product.endTime} />
              </div>

              {/* Bidding Logic Based on AI Status */}
              {aiStatus.status === "accepted" && !isExpired && !isOwner && session?.user && (
                <BidForm productId={product.id} currentPrice={product.currentPrice} />
              )}

              {aiStatus.status === "rejected" && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                  <p className="font-medium text-red-800">Auction Unavailable</p>
                  <p className="text-sm text-red-600 mt-1">
                    This product did not pass AI verification and cannot be bid on.
                  </p>
                </div>
              )}

              {aiStatus.status === "error" && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
                  <p className="font-medium text-orange-800">Verification Error</p>
                  <p className="text-sm text-orange-600 mt-1">
                    There was an error verifying this product. Please contact support.
                  </p>
                </div>
              )}

              {(aiStatus.status === "pending" || aiStatus.status === "processing") && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                  <p className="font-medium text-yellow-800">Verification in Progress</p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Bidding will be available once AI verification is complete.
                  </p>
                </div>
              )}

              {isExpired && (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
                  <p className="text-lg font-semibold text-red-600">Auction Ended</p>
                  {product.bids.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Won by {product.bids[0].bidder?.name || "Anonymous"} for ${product.bids[0].amount.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {isOwner && (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
                  <p className="font-medium">This is your auction</p>
                  <p className="text-sm text-muted-foreground mt-1">You cannot bid on your own auction</p>
                </div>
              )}

              {!session?.user && aiStatus.status === "accepted" && (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
                  <p className="font-medium">Login to place a bid</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You need to be logged in to participate in this auction
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bid History - Only show for accepted products */}
          {aiStatus.status === "accepted" && product.bids.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bid History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {product.bids.map((bid, index) => (
                    <div key={bid.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="font-medium">{bid.bidder?.name || "Anonymous"}</span>
                      <div className="text-right">
                        <span className="font-bold">${bid.amount.toFixed(2)}</span>
                        {index === 0 && <Badge className="ml-2 text-xs">Highest</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
