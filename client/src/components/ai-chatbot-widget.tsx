import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface AIChatbotWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AIChatbotWidget({ isOpen: externalIsOpen, onClose }: AIChatbotWidgetProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalIsOpen !== undefined && onClose ? onClose : () => setInternalIsOpen(!internalIsOpen);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "👋 Hi! I'm your Life House assistant. I can help you with:\n\n• Questions about our programs\n• Housing application process\n• Required documents\n• Eligibility criteria\n• Contact information\n\nHow can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        message,
        context: "public_assistant",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: data.response,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    },
    onError: (error: any) => {
      let errorMessage = "I'm sorry, I'm having trouble connecting right now. Please try again later or call us at (855) 4-LIFEUP.";
      
      // Check for specific error messages
      if (error?.message?.includes('quota exceeded')) {
        errorMessage = "I apologize, but our AI assistant is temporarily unavailable due to high demand. Please call us at (855) 4-LIFEUP for immediate assistance, or try again later.";
      } else if (error?.message?.includes('Invalid OpenAI API key')) {
        errorMessage = "Our AI assistant is currently being configured. Please call us at (855) 4-LIFEUP for assistance.";
      }
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: errorMessage,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(input);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button - only show if not controlled externally */}
      {externalIsOpen === undefined && (
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <Button
                onClick={() => setInternalIsOpen(true)}
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg bg-green-700 hover:bg-green-800"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <Card className="flex flex-col h-[600px] max-h-[calc(100vh-6rem)] shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-green-700 text-white rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  <h3 className="font-semibold">Life House Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onClose) {
                      onClose();
                    } else {
                      setInternalIsOpen(false);
                    }
                  }}
                  className="h-8 w-8 p-0 hover:bg-green-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex gap-2 max-w-[80%] ${
                          message.sender === "user" ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            message.sender === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {message.sender === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.sender === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="flex gap-2 max-w-[80%]">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-green-100 text-green-700">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="rounded-lg px-4 py-2 bg-gray-100">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={chatMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || chatMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}