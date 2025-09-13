import { useState, useEffect } from "react";
import { Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/pages/Dashboard";

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

  // Fetch existing messages on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
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

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${project.id}`
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
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
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          project_id: project.id,
          user_id: user.id,
          message: inputValue,
          sender: 'user',
          metadata: {}
        });

      if (error) {
        console.error('Error saving message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setInputValue("");

      // Simulate AI response after a delay
      setTimeout(async () => {
        const { error: aiError } = await supabase
          .from('chat_messages')
          .insert({
            project_id: project.id,
            user_id: user.id,
            message: "I understand your request. I'm processing the information about your project and will help you accordingly.",
            sender: 'ai',
            metadata: {}
          });

        if (aiError) {
          console.error('Error saving AI message:', aiError);
          toast({
            title: "Error",
            description: "Failed to get AI response",
            variant: "destructive",
          });
        }

        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error in handleSendMessage:', error);
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
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? "justify-end" : "justify-start"}`}
          >
            <Card className={`max-w-[80%] p-3 ${
              message.sender === 'user' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            }`}>
              <div className="flex items-start gap-2">
                {message.sender === 'ai' && (
                  <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-sm">{message.message}</div>
              </div>
              <div className={`text-xs mt-1 ${
                message.sender === 'user' 
                  ? "text-primary-foreground/70" 
                  : "text-muted-foreground"
              }`}>
                {new Date(message.created_at).toLocaleTimeString()}
              </div>
            </Card>
          </div>
        ))}
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
        </div>
      </ScrollArea>

      <div className="border-t p-4">
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