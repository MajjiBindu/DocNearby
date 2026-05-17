
const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
        <p className="mt-4 text-lg font-medium text-white animate-pulse">Loading DocNearby...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
