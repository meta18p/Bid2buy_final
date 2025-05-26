"use client"

import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Clock, Zap } from "lucide-react"

interface AIStatusIndicatorProps {
  status: "accepted" | "rejected" | "pending" | "error" | "processing"
  message?: string
  timestamp?: Date
  showDetails?: boolean
}

export function AIStatusIndicator({ status, message, timestamp, showDetails = true }: AIStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "accepted":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          badge: "AI Verified",
          badgeVariant: "default" as const,
          badgeClass: "bg-green-600 hover:bg-green-700",
          alertVariant: "default" as const,
          alertClass: "border-green-200 bg-green-50 text-green-800",
          title: "✅ AI Verification Successful",
          description: message || "Product verified successfully! Your product matches the description.",
        }
      case "rejected":
        return {
          icon: <XCircle className="h-4 w-4" />,
          badge: "AI Rejected",
          badgeVariant: "destructive" as const,
          badgeClass: "bg-red-600 hover:bg-red-700",
          alertVariant: "destructive" as const,
          alertClass: "border-red-200 bg-red-50 text-red-800",
          title: "❌ AI Verification Failed",
          description: message || "Product does not match the description. Please review and try again.",
        }
      case "pending":
        return {
          icon: <Clock className="h-4 w-4" />,
          badge: "Pending Verification",
          badgeVariant: "secondary" as const,
          badgeClass: "bg-yellow-600 hover:bg-yellow-700",
          alertVariant: "default" as const,
          alertClass: "border-yellow-200 bg-yellow-50 text-yellow-800",
          title: "⏳ Verification Pending",
          description: message || "Product is awaiting AI verification. This may take a few moments.",
        }
      case "processing":
        return {
          icon: <Zap className="h-4 w-4 animate-pulse" />,
          badge: "Processing",
          badgeVariant: "secondary" as const,
          badgeClass: "bg-blue-600 hover:bg-blue-700",
          alertVariant: "default" as const,
          alertClass: "border-blue-200 bg-blue-50 text-blue-800",
          title: "🔄 AI Processing",
          description: message || "AI is currently analyzing your product. Please wait...",
        }
      case "error":
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          badge: "Verification Error",
          badgeVariant: "destructive" as const,
          badgeClass: "bg-orange-600 hover:bg-orange-700",
          alertVariant: "destructive" as const,
          alertClass: "border-orange-200 bg-orange-50 text-orange-800",
          title: "⚠️ Verification Error",
          description: message || "An error occurred during AI verification. Please try again.",
        }
      default:
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          badge: "Unknown Status",
          badgeVariant: "secondary" as const,
          badgeClass: "",
          alertVariant: "default" as const,
          alertClass: "",
          title: "Unknown Status",
          description: message || "Status unknown",
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="space-y-3">
      {/* Status Badge */}
      <Badge variant={config.badgeVariant} className={`${config.badgeClass} text-white`}>
        {config.icon}
        <span className="ml-1">{config.badge}</span>
      </Badge>

      {/* Detailed Status Alert */}
      {showDetails && (
        <Alert variant={config.alertVariant} className={config.alertClass}>
          <div className="flex items-start gap-2">
            {config.icon}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{config.title}</h4>
              <AlertDescription className="mt-1">{config.description}</AlertDescription>
              {timestamp && <p className="text-xs opacity-75 mt-2">Verified: {timestamp.toLocaleString()}</p>}
            </div>
          </div>
        </Alert>
      )}
    </div>
  )
}
