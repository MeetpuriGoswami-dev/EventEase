// Login page has its own layout — no sidebar/header wrapper
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
