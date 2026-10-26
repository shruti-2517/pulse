import "./globals.css";

export const metadata = {
  title: "Pulse | Distributed Uptime Monitoring & Status Pages",
  description: "Real-time distributed uptime monitoring, multi-region probes, status pages, and alerting.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
