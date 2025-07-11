export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center pb-6 border-b">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Hero section skeleton */}
        <div className="space-y-4 text-center py-12">
          <div className="h-12 w-96 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
          <div className="h-6 w-80 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Chain list skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="space-y-3">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}