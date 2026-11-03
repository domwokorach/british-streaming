import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-ws-bg px-4 pt-24 sm:px-10">
      <Skeleton className="h-96 rounded-md bg-ws-elevated" />
      <Skeleton className="mt-10 h-6 w-56 rounded bg-ws-elevated" />
      <div className="mt-4 flex gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-36 w-64 rounded bg-ws-elevated" />
        ))}
      </div>
    </main>
  );
}
