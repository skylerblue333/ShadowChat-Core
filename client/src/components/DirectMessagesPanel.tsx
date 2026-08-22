import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

export default function DirectMessagesPanel({ currentUserId }: { currentUserId: number }) {
  const [participantIdText, setParticipantIdText] = useState("");
  const [draft, setDraft] = useState("");
  const participantId = useMemo(() => {
    const value = Number(participantIdText);
    return Number.isInteger(value) && value > 0 ? value : null;
  }, [participantIdText]);

  const conversationQuery = trpc.messages.conversation.useQuery(
    { participantId: participantId ?? 1, limit: 100 },
    { enabled: participantId !== null && participantId !== currentUserId },
  );
  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: async () => {
      setDraft("");
      await conversationQuery.refetch();
    },
  });

  const send = async () => {
    if (participantId === null || participantId === currentUserId || !draft.trim()) return;
    await sendMutation.mutateAsync({ recipientId: participantId, content: draft });
  };

  const invalidParticipant = participantIdText.length > 0 && (participantId === null || participantId === currentUserId);

  return (
    <Card className="space-y-5 border-slate-700 bg-slate-800 p-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Direct messages</h2>
        <p className="mt-1 text-sm text-slate-400">Messages are available only between authenticated users and are persisted by the server.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="message-participant" className="text-sm font-medium text-slate-200">Recipient user ID</label>
        <Input
          id="message-participant"
          inputMode="numeric"
          value={participantIdText}
          onChange={(event) => setParticipantIdText(event.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Enter a real user ID"
          className="border-slate-600 bg-slate-900 text-white"
        />
        {invalidParticipant && <p className="text-sm text-amber-300">Enter a different positive user ID.</p>}
      </div>

      {participantId !== null && participantId !== currentUserId && (
        <>
          <div className="min-h-40 space-y-2 rounded-md border border-slate-700 bg-slate-950/60 p-4">
            {conversationQuery.isLoading && <p className="text-sm text-slate-400">Loading persisted messages…</p>}
            {conversationQuery.error && <p className="text-sm text-amber-300">{conversationQuery.error.message}</p>}
            {!conversationQuery.isLoading && !conversationQuery.error && conversationQuery.data?.length === 0 && (
              <p className="text-sm text-slate-500">No messages in this conversation yet.</p>
            )}
            {conversationQuery.data?.map((message) => (
              <div key={message.id} className={`rounded-md p-3 text-sm ${message.senderId === currentUserId ? "ml-8 bg-cyan-950/60 text-cyan-100" : "mr-8 bg-slate-800 text-slate-200"}`}>
                <p>{message.content}</p>
                <time className="mt-1 block text-xs text-slate-500" dateTime={message.createdAt.toISOString()}>{message.createdAt.toLocaleString()}</time>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label htmlFor="message-draft" className="text-sm font-medium text-slate-200">Message</label>
            <Textarea
              id="message-draft"
              value={draft}
              maxLength={2000}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a message…"
              className="border-slate-600 bg-slate-900 text-white"
              rows={3}
            />
            <Button onClick={send} disabled={!draft.trim() || sendMutation.isPending} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
              <Send className="mr-2 h-4 w-4" />
              {sendMutation.isPending ? "Sending…" : "Send message"}
            </Button>
            {sendMutation.error && <p className="text-sm text-amber-300">{sendMutation.error.message}</p>}
          </div>
        </>
      )}
    </Card>
  );
}
