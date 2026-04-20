/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage 이미지만 허용 (** 와일드카드 제거)
      {
        protocol: 'https',
        hostname: 'bbhrlnetwdijfetxpgfx.supabase.co',
      },
      // OpenAI DALL-E 이미지 (사용 시)
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      },
    ],
  },
};

module.exports = nextConfig;
