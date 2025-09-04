export const metadata = {
  title: 'Orion Dashboard',
  description: 'Talking agent module for the Empire',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
