import { notFound } from 'next/navigation';
import { getAgent } from '@/lib/agents/registry';
import { AgentChatUI } from './AgentChatUI';

export const dynamic = 'force-dynamic';

export default async function AgentChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) return notFound();

  return <AgentChatUI agent={{
    id: agent.id, slug: agent.slug, name_ar: agent.name_ar,
    emoji: agent.emoji, description: agent.description, status: agent.status,
    capabilities: agent.capabilities,
  }} />;
}
