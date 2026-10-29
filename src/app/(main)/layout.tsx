/**
 * Main Layout
 * 
 * Wraps all (main) route group pages — currently
 * just passes children through. The dashboard has
 * its own nested layout with sidebar.
 */

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
