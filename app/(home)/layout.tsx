import Navbar from "@/components/home_navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto">
      <Navbar />
      {children}
    </div>
  );
}
