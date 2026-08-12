import EmbedUdnClient from './EmbedUdnClient';

export default async function EmbedUdnPage({ params }: { params: Promise<{ udn: string }> }) {
  const { udn } = await params;
  return <EmbedUdnClient udn={udn} />;
}
