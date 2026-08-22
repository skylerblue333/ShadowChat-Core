import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";

interface DirectMessagesProps {
  userId: string;
}

const DirectMessages: React.FC<DirectMessagesProps> = ({ userId }) => {
  const participantId = Number(userId);
  const validParticipant = Number.isInteger(participantId) && participantId > 0;
  const [newMessage, setNewMessage] = React.useState("");
  const utils = trpc.useUtils();
  const conversation = trpc.messages.conversation.useQuery(
    { participantId, limit: 50 },
    { enabled: validParticipant },
  );
  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: async () => {
      setNewMessage("");
      await utils.messages.conversation.invalidate({ participantId, limit: 50 });
    },
  });

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = newMessage.trim();
    if (!validParticipant || content.length === 0 || sendMessage.isPending) return;
    sendMessage.mutate({ recipientId: participantId, content });
  };

  const messages = conversation.data ?? [];

  return (
    <Card className="mx-auto flex h-[500px] w-full max-w-md flex-col dark:bg-gray-900 dark:text-gray-100">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Direct Messages</CardTitle>
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarFallback>U{participantId || "?"}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">User {userId || "?"}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {!validParticipant ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            Select a valid conversation participant.
          </div>
        ) : conversation.isPending ? (
          <div className="flex h-full items-center justify-center">Loading messages...</div>
        ) : conversation.isError ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-red-500">
            Unable to load this conversation. Please try again.
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">
            No messages yet. Start the conversation below.
          </div>
        ) : (
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === participantId ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${message.senderId === participantId ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100" : "bg-blue-600 text-white"}`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="mt-1 block text-right text-xs opacity-75">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <form className="flex items-center space-x-2 border-t p-4 dark:border-gray-700" onSubmit={handleSendMessage}>
        <Input
          aria-label="Message"
          className="flex-1 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          disabled={!validParticipant || sendMessage.isPending}
          maxLength={2000}
          onChange={(event) => setNewMessage(event.target.value)}
          placeholder="Type your message..."
          value={newMessage}
        />
        <Button disabled={!validParticipant || newMessage.trim().length === 0 || sendMessage.isPending} type="submit">
          {sendMessage.isPending ? "Sending..." : "Send"}
        </Button>
      </form>
      {sendMessage.isError && <p className="px-4 pb-3 text-sm text-red-500">Message could not be sent. Try again.</p>}
    </Card>
  );
};

export default DirectMessages;
