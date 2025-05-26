"use client"

import { useEffect, useState } from "react"
import { AIStatusIndicator } from "./ai-status-indicator"

interface RealTimeStatusUpdaterProps {
  productId: string
  initialStatus?: "accepted" | "rejected" | "pending" | "error" | "processing"
  initialMessage?: string
  initialTimestamp?: Date
}

export function RealTimeStatusUpdater({
  productId,
  initialStatus = "pending",
  initialMessage,
  initialTimestamp,
}: RealTimeStatusUpdaterProps) {
  const [status, setStatus] = useState(initialStatus)
  const [message, setMessage] = useState(initialMessage)
  const [timestamp, setTimestamp] = useState(initialTimestamp)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    let pollInterval: NodeJS.Timeout

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/product-status/${productId}`)
        if (response.ok) {
          const data = await response.json()
          setStatus(data.status)
          setMessage(data.message)
          setTimestamp(data.timestamp ? new Date(data.timestamp) : undefined)

          // Stop polling if we have a final status
          if (data.status === "accepted" || data.status === "rejected" || data.status === "error") {
            setIsPolling(false)
          }
        }
      } catch (error) {
        console.error("Error polling status:", error)
      }
    }

    // Start polling if status is pending or processing
    if (status === "pending" || status === "processing") {
      setIsPolling(true)
      pollInterval = setInterval(pollStatus, 3000) // Poll every 3 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [productId, status])

  return (
    <div className="space-y-2">
      <AIStatusIndicator status={status} message={message} timestamp={timestamp} />
      {isPolling && <p className="text-xs text-muted-foreground animate-pulse">🔄 Checking verification status...</p>}
    </div>
  )
}
