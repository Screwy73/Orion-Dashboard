import OrionAvatar from "@/components/OrionAvatar";

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <OrionAvatar
        name="Orion"
        avatarSrc="/avatars/lyra.jpg"
        wakeWord="orion"
        apiEndpoint="/api/orion" // remove this line to run local-only
      />
    </main>
  );
}
