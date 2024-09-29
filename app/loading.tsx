import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="w-16 h-16 text-primary animate-spin" />
      <h2 className="mt-4 text-xl font-semibold text-foreground">Loading...</h2>
    </div>
  );
}
