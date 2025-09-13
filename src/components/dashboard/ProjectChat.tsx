import { useState, useEffect, useRef } from "react";
import { Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/pages/Dashboard";

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

interface ProjectChatProps {
  project: Project;
}

interface ChatMessage {
  id: string;
  message: string;
  sender: string;
  user_id: string;
  project_id: string;
  created_at: string;
  metadata?: any;
}

export const ProjectChat = ({ project }: ProjectChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch existing messages on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      console.log("fetching");
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive",
        });
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();
  }, [project.id, toast]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Set up real-time subscription
  useEffect(() => {
    console.log(project);
    const channel = supabase
      .channel(
        "chat_messages_changes" + Math.random().toString(36).substring(2, 30),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          console.log("New message received:", payload);
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // Check if message already exists to prevent duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        },
      )
      .subscribe();

    return () => {
      console.log("removing");
      supabase.removeChannel(channel);
    };
  }, [project.id]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to send messages",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Save user message to database
      const { error } = await supabase.from("chat_messages").insert({
        project_id: project.id,
        user_id: user.id,
        message: inputValue,
        sender: "user",
        metadata: {},
      });

      if (error) {
        console.error("Error saving message:", error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setInputValue("");

      // Just end loading state - no simulated AI response
      setIsLoading(false);
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 min-h-0" style={{ height: 'calc(100% - 73px)' }}>
        <div className="p-4 space-y-4">
          {messages.map((message) => {
            // Special styling for tool messages
            if (message.sender === "tool") {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="text-xs text-muted-foreground/60 text-center">
                    {message.message}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-[80%] p-3 ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.sender === "ai" && (
                      <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="text-sm">{message.message}</div>
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      message.sender === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </Card>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-muted p-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <div className="text-sm">AI is typing...</div>
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your project..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
