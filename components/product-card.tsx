"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, User, Play } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface ProductCardProps {
  product: {
    id: string
    title: string
    description: string
    currentPrice: number
    endTime: Date
    category: string
    condition: string
    videos: string[]
    seller: {
      name: string | null
    }
    bids: Array<{
      amount: number
      bidder: {
        name: string | null
      }
    }>
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const timeLeft = new Date(product.endTime).getTime() - new Date().getTime()
  const daysLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)))
  const hoursLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))

  const handleVideoPlay = () => {
    setIsVideoPlaying(true)
  }

  const handleVideoPause = () => {
    setIsVideoPlaying(false)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
        {product.videos && product.videos.length > 0 ? (
          <div className="relative w-full h-full group">
            <video
              src={product.videos[0] || "/placeholder-video.mp4"}
              className="w-full h-full object-cover"
              muted
              loop
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onMouseEnter={(e) => {
                const video = e.target as HTMLVideoElement
                video.play()
              }}
              onMouseLeave={(e) => {
                const video = e.target as HTMLVideoElement
                video.pause()
                video.currentTime = 0
              }}
            />
            {!isVideoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all">
                <Play className="h-12 w-12 text-white opacity-80" />
              </div>
            )}
            {product.videos.length > 1 && (
              <Badge className="absolute top-2 right-2 bg-black bg-opacity-70 text-white">
                +{product.videos.length - 1} more
              </Badge>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <Play className="h-12 w-12 text-gray-400" />
            <span className="ml-2 text-gray-500">No video available</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
          <Badge variant="secondary">{product.category}</Badge>
        </div>

        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description}</p>

        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-2xl font-bold text-green-600">${product.currentPrice.toFixed(2)}</p>
            {product.bids.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {product.bids.length} bid{product.bids.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4 mr-1" />
              {daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h left`}
            </div>
            <Badge variant="outline">{product.condition}</Badge>
          </div>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <User className="h-4 w-4 mr-1" />
          <span>Sold by {product.seller.name || "Anonymous"}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={`/auction/${product.id}`}>View Auction</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
