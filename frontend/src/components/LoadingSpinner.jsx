export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-royal/30 border-t-royal rounded-full animate-spin" />
    </div>
  );
}
