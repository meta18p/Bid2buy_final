import { getProducts } from "../../actions/product-actions"
import ProductCard from "@/components/product-card"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import AuctionFilters from "@/components/auction-filters"

export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: {
    category?: string
    q?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
  }
}) {
  const category = searchParams.category || "all"
  const search = searchParams.q || ""
  const minPrice = searchParams.minPrice ? Number.parseFloat(searchParams.minPrice) : undefined
  const maxPrice = searchParams.maxPrice ? Number.parseFloat(searchParams.maxPrice) : undefined

  const products = await getProducts(category !== "all" ? category : undefined, search, minPrice, maxPrice)

  // Sort products based on sort parameter
  const sortedProducts = [...products].sort((a, b) => {
    switch (searchParams.sort) {
      case "price-low":
        return a.currentPrice - b.currentPrice
      case "price-high":
        return b.currentPrice - a.currentPrice
      case "ending-soon":
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime()
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <AuctionFilters />
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">All Auctions</h1>
            <p className="text-muted-foreground">
              {sortedProducts.length} auction{sortedProducts.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {search && (
            <div className="mb-6">
              <p className="text-muted-foreground">
                Search results for: <span className="font-medium text-foreground">{search}</span>
              </p>
            </div>
          )}

          <Suspense fallback={<ProductGridSkeleton />}>
            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No auctions found</h3>
                <p className="text-muted-foreground">
                  {search
                    ? `No results found for "${search}". Try a different search term.`
                    : category !== "all"
                      ? `No auctions found in the "${category}" category.`
                      : "There are no active auctions at the moment."}
                </p>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex justify-between">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-6 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
