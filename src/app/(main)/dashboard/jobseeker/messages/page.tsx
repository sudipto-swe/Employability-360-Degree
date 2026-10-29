"use client";

/**
 * Messages Page — Jobseeker View
 *
 * Displays conversation threads and message history from the database.
 * Uses polling to simulate real-time message sending and receiving.
 * Enhanced with:
 * - Active statuses (Online, Away, Offline)
 * - File attachments (Upload to Supabase Storage, inline render)
 * - Call simulation (Audio / Video, dialer status, timer, audio wave effect)
 */

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Search,
  Clock,
  Loader2,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  X,
  Phone,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CallState {
  type: "audio" | "video";
  status: "ringing" | "connected";
  duration: number;
  isMuted: boolean;
  isVideoOff: boolean;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Call Simulation State
  const [activeCall, setActiveCall] = useState<CallState | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations from DB
  const fetchConversations = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchConversations(true);
  }, []);

  // Poll for new messages every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Mark selected conversation's messages as read
  useEffect(() => {
    if (selectedConvo) {
      fetch("/api/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: selectedConvo }),
      }).then(() => {
        // Update local state to clear unread badge instantly
        setConversations(prev =>
          prev.map(c => c.id === selectedConvo ? { ...c, unread: 0 } : c)
        );
      }).catch(err => console.error(err));
    }
  }, [selectedConvo]);

  // Handle active call timer
  useEffect(() => {
    if (activeCall && activeCall.status === "connected") {
      timerRef.current = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeCall?.status]);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/attachment", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setAttachment({ url: data.url, name: data.name });
      toast.success("Attachment uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload attachment");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Send message (handles both text & attachments)
  const handleSendMessage = async () => {
    if ((!message.trim() && !attachment) || !selectedConvo) return;
    const contentToSend = message.trim();
    const attachmentToSend = attachment;

    setMessage("");
    setAttachment(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedConvo,
          content: contentToSend,
          attachmentUrl: attachmentToSend?.url || null,
          attachmentName: attachmentToSend?.name || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Instantly update local messages array for smooth UX
        setConversations(prev =>
          prev.map(c => {
            if (c.id === selectedConvo) {
              return {
                ...c,
                lastMessage: contentToSend || (attachmentToSend ? `📎 Attached: ${attachmentToSend.name}` : ""),
                time: new Date().toISOString(),
                messages: [...c.messages, {
                  id: data.message.id,
                  senderId: data.message.senderId,
                  receiverId: data.message.receiverId,
                  content: contentToSend,
                  attachmentUrl: attachmentToSend?.url || null,
                  attachmentName: attachmentToSend?.name || null,
                  createdAt: new Date().toISOString(),
                  isRead: false,
                }]
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Call simulation triggers
  const startCall = (type: "audio" | "video") => {
    const selected = conversations.find((c) => c.id === selectedConvo);
    if (!selected) return;

    setActiveCall({
      type,
      status: "ringing",
      duration: 0,
      isMuted: false,
      isVideoOff: false,
    });

    // Simulate ringtone ring and auto-accept after 3 seconds
    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: "connected" } : null);
    }, 3000);
  };

  const endCall = () => {
    if (activeCall) {
      const durationStr = formatDuration(activeCall.duration);
      toast.success(`Call ended. Duration: ${durationStr}`);
    }
    setActiveCall(null);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = conversations.find((c) => c.id === selectedConvo);

  // Format date nicely
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Helper to determine contact active status deterministically
  const getActiveStatus = (convoId: string) => {
    const charCodeSum = convoId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const mod = charCodeSum % 3;
    if (mod === 0) return { label: "Online", color: "bg-emerald-500", textClass: "text-emerald-500 font-semibold" };
    if (mod === 1) return { label: "Away", color: "bg-amber-500", textClass: "text-amber-500" };
    return { label: "Offline", color: "bg-gray-400", textClass: "text-muted-foreground" };
  };

  // Render attachment in message
  const renderAttachment = (url: string, name: string) => {
    const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(name);
    if (isImage) {
      return (
        <div className="mt-2 rounded-xl overflow-hidden border max-w-sm bg-muted/20 relative group">
          <img src={url} alt={name} className="max-h-60 w-auto object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <a href={url} download={name} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors">
              <Download className="w-5 h-5" />
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 flex items-center gap-3 p-3 rounded-xl border bg-muted/40 max-w-xs">
        <FileText className="w-8 h-8 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <span className="text-[10px] text-muted-foreground">Document</span>
        </div>
        <a href={url} download={name} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-muted rounded-full transition-colors">
          <Download className="w-4 h-4 text-muted-foreground" />
        </a>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex h-full gap-4">
          {/* Conversation list */}
          <Card className="w-80 shrink-0 flex flex-col py-0 overflow-hidden shadow-md">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No conversations found
                </div>
              ) : (
                filtered.map((convo) => {
                  const status = getActiveStatus(convo.id);
                  return (
                    <button
                      key={convo.id}
                      onClick={() => setSelectedConvo(convo.id)}
                      className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                        selectedConvo === convo.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {convo.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${status.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{convo.name}</p>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTime(convo.time)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {convo.lastMessage}
                          </p>
                        </div>
                        {convo.unread > 0 && (
                          <Badge className="gradient-brand text-white border-0 text-[10px] px-1.5 py-0 h-5 ml-1">
                            {convo.unread}
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Chat area */}
          <Card className="flex-1 flex flex-col py-0 overflow-hidden relative shadow-md">
            {selected ? (
              <>
                {/* CALL OVERLAY */}
                {activeCall && (
                  <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-300">
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="relative mb-6">
                        <Avatar className="w-24 h-24 ring-4 ring-primary/40 animate-pulse">
                          <AvatarFallback className="bg-primary/20 text-white text-3xl font-bold">
                            {selected.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {activeCall.status === "ringing" && (
                          <span className="absolute inset-0 rounded-full border-4 border-primary animate-ping" />
                        )}
                      </div>
                      <h2 className="text-xl font-bold mb-2">{selected.name}</h2>
                      <p className="text-sm text-gray-400 capitalize mb-8">
                        {activeCall.status === "ringing" ? "Calling..." : `In Call — ${formatDuration(activeCall.duration)}`}
                      </p>

                      {/* Video Stream simulation */}
                      {activeCall.type === "video" && !activeCall.isVideoOff && (
                        <div className="w-80 h-44 bg-gray-800 rounded-xl mb-8 relative overflow-hidden border border-gray-700 shadow-lg">
                          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                            <Video className="w-8 h-8 animate-pulse text-primary/40" />
                          </div>
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[10px]">
                            Live stream
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Call Controls */}
                    <div className="flex items-center gap-6 mb-8">
                      <Button
                        variant="outline"
                        size="icon"
                        className={`w-12 h-12 rounded-full border-gray-700 bg-gray-800/40 text-white hover:bg-gray-700 ${activeCall.isMuted ? "bg-red-600/80 hover:bg-red-600 border-0" : ""}`}
                        onClick={() => setActiveCall(p => p ? { ...p, isMuted: !p.isMuted } : null)}
                      >
                        {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="w-14 h-14 rounded-full shadow-lg"
                        onClick={endCall}
                      >
                        <PhoneOff className="w-6 h-6 text-white" />
                      </Button>
                      {activeCall.type === "video" && (
                        <Button
                          variant="outline"
                          size="icon"
                          className={`w-12 h-12 rounded-full border-gray-700 bg-gray-800/40 text-white hover:bg-gray-700 ${activeCall.isVideoOff ? "bg-red-600/80 hover:bg-red-600 border-0" : ""}`}
                          onClick={() => setActiveCall(p => p ? { ...p, isVideoOff: !p.isVideoOff } : null)}
                        >
                          {activeCall.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Chat header */}
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {selected.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm">{selected.name}</p>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className={`text-[10px] ${getActiveStatus(selected.id).textClass}`}>
                          {getActiveStatus(selected.id).label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{selected.sublabel}</p>
                    </div>
                  </div>

                  {/* Audio / Video buttons */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors" onClick={() => startCall("audio")}>
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors" onClick={() => startCall("video")}>
                      <Video className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                  {selected.messages.map((msg: any) => {
                    const isMine = msg.senderId !== selectedConvo;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        {!isMine && (
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                              {selected.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 max-w-md ${
                            isMine
                              ? "bg-primary text-white rounded-br-sm shadow-sm"
                              : "bg-muted rounded-bl-sm border"
                          }`}
                        >
                          {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                          {msg.attachmentUrl && renderAttachment(msg.attachmentUrl, msg.attachmentName || "file")}
                          <p
                            className={`text-[9px] mt-1 flex items-center gap-1 ${
                              isMine ? "text-primary-foreground/75 justify-end" : "text-muted-foreground"
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Attachment Preview Bar */}
                {attachment && (
                  <div className="px-4 py-2 bg-muted/40 border-t flex items-center justify-between gap-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                      <Paperclip className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate font-medium">{attachment.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachment(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                {/* Input Controls */}
                <div className="p-3 border-t">
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </Button>

                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="h-10"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (message.trim() || attachment)) {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      className="gradient-brand text-white border-0 shrink-0"
                      disabled={!message.trim() && !attachment}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose from your existing conversations to start messaging.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
