/** Re-mounts on every navigation, replaying the CSS entrance on each new route without delaying it. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter flex flex-1 flex-col">{children}</div>;
}
