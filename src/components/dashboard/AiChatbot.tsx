"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, Trash2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "How do I write a professional resume summary?",
  "What are common interview questions for a Software Engineer?",
  "How can I format GPA/grades for ATS compatibility?",
  "Tips to make my CV stand out in the Bangladesh tech market."
];

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage safely after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem("employability360_chatbot_messages");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    } else {
      // Add default welcome message
      setMessages([
        {
          role: "assistant",
          content: "Hello! I am your **Employability 360° Career Assistant**. How can I help you build your resume, prepare for interviews, or navigate your career path today?"
        }
      ]);
    }
  }, []);

  // Scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    localStorage.setItem("employability360_chatbot_messages", JSON.stringify(newMessages));
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate response");
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = { role: "assistant", content: data.content };
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      localStorage.setItem("employability360_chatbot_messages", JSON.stringify(updatedMessages));
    } catch (err) {
      console.error("Chatbot response error:", err);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again in a few moments."
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const defaultMsg: ChatMessage[] = [
      {
        role: "assistant",
        content: "Hello! I am your **Employability 360° Career Assistant**. How can I help you build your resume, prepare for interviews, or navigate your career path today?"
      }
    ];
    setMessages(defaultMsg);
    localStorage.setItem("employability360_chatbot_messages", JSON.stringify(defaultMsg));
  };

  const parseBold = (text: string): string => {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  };

  const parseMessageContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const cleanLine = line.trim();
      if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ")) {
        const bulletText = cleanLine.substring(2);
        return (
          <li
            key={idx}
            className="ml-4 list-disc my-1 text-sm md:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parseBold(bulletText) }}
          />
        );
      }
      if (cleanLine === "") {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p
          key={idx}
          className="my-1 text-sm md:text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: parseBold(cleanLine) }}
        />
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          isOpen
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 rotate-90"
            : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:shadow-indigo-500/20 hover:from-blue-700 hover:to-indigo-700"
        )}
        aria-label="Toggle chatbot"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6 animate-pulse" />}
      </button>

      {/* Chat Window Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 flex flex-col w-[380px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-8rem)] rounded-2xl border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-300 ease-in-out transform origin-bottom-right",
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-8 scale-90 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Career Coach AI</h3>
              <p className="text-[10px] text-blue-100 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 animate-spin" /> Online & Caching Active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="text-white hover:bg-white/20 h-8 w-8"
              title="Reset conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-2 max-w-[85%]",
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full shrink-0",
                    isUser ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"
                  )}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "px-3 py-2 rounded-2xl shadow-sm text-sm border",
                    isUser
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent rounded-tr-none"
                      : "bg-card text-foreground border-border/50 rounded-tl-none"
                  )}
                >
                  {parseMessageContent(msg.content)}
                </div>
              </div>
            );
          })}

          {/* Loader */}
          {isLoading && (
            <div className="flex items-start gap-2 max-w-[85%]">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="px-3 py-2 rounded-2xl rounded-tl-none bg-card border border-border/50 shadow-sm flex items-center gap-1.5 h-9">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
              </div>
            </div>
          )}

          {/* Starter Prompts */}
          {messages.length <= 1 && !isLoading && (
            <div className="pt-4 space-y-2">
              <p className="text-xs text-muted-foreground font-medium px-1">Suggested Topics:</p>
              <div className="grid grid-cols-1 gap-2">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-left text-xs p-2.5 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-indigo-500/50 transition-all text-muted-foreground hover:text-foreground shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="p-3 border-t bg-card/90 flex gap-2 items-center"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-500"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 h-9 w-9 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
