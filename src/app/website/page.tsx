import VideoBackground from "@/components/website/VideoBackground";
import BuilderHero from "@/components/website/BuilderHero";

const HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4";

export default function WebsiteBuilderPage() {
  return (
    <section
      className="relative w-full overflow-hidden flex items-center justify-center bg-white"
      style={{
        minHeight: "calc(100vh - 56px)",
        padding: "16px 120px",
      }}
    >
      <VideoBackground src={HERO_VIDEO_URL} />

      {/* Soft white wash so dark video lets text breathe (kept very subtle). */}
      <div className="absolute inset-0 bg-white/10 pointer-events-none" />

      <BuilderHero />
    </section>
  );
}
