"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  ChevronRight,
  RotateCcw,
  Trophy,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  X,
  Plus,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const JOB_TITLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Product Manager", "Project Manager", "Data Scientist", "Data Analyst",
  "UI/UX Designer", "Marketing Manager", "Sales Executive", "Business Analyst",
  "HR Manager", "Graphic Designer", "Content Writer", "Customer Support", "Other"
];

const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", "Java", "C++",
  "HTML", "CSS", "Tailwind CSS", "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker",
  "Git", "Communication", "Leadership", "Problem Solving", "Teamwork"
];

interface Question {
  question: string;
  category: string;
  difficulty: string;
  tips: string;
}

interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  sampleAnswer: string;
}

type Stage = "setup" | "practice" | "results";

export default function InterviewCoachPage() {
  const [stage, setStage] = useState<Stage>("setup");
  const [jobTitle, setJobTitle] = useState("");
  const [isCustomJobTitle, setIsCustomJobTitle] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [depth, setDepth] = useState("conceptual");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluations, setEvaluations] = useState<(Evaluation | null)[]>([]);

  // Voice Interaction States
  const [isListening, setIsListening] = useState(false);
  const [voiceAutoplay, setVoiceAutoplay] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Load Jobseeker profile/CV skills on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            const profile = result.data;
            if (profile.headline) {
              if (JOB_TITLES.includes(profile.headline)) {
                setJobTitle(profile.headline);
              } else {
                setIsCustomJobTitle(true);
                setJobTitle(profile.headline);
              }
            }
            if (profile.parsedSkills && Array.isArray(profile.parsedSkills) && profile.parsedSkills.length > 0) {
              setSelectedSkills(profile.parsedSkills);
              toast.success("Imported skills and job title from your CV!");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load profile details:", err);
      }
    }
    loadProfile();
  }, []);

  // Web Speech API: Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            setAnswer((prev) => prev + (prev ? " " : "") + finalTranscript);
          }
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Autoplay voice synthesis on question change
  useEffect(() => {
    if (stage === "practice" && questions[currentIndex] && voiceAutoplay) {
      speakQuestion(questions[currentIndex].question);
    }
    // Cancel speaking if we change question
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
  }, [currentIndex, stage]);

  function speakQuestion(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.success("Voice capture stopped.");
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("Listening... Speak into your mic.");
      } catch (err) {
        console.error(err);
      }
    }
  }

  /** Generate interview questions */
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!jobTitle.trim()) {
      toast.error("Please enter or select a job title.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          skills: selectedSkills,
          difficulty,
          count: 5,
          depth,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setQuestions(data.data);
      setEvaluations(new Array(data.data.length).fill(null));
      setCurrentIndex(0);
      setAnswer("");
      setStage("practice");
      toast.success("Questions generated! Let's practice.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate questions.");
    } finally {
      setIsGenerating(false);
    }
  }

  /** Submit answer for evaluation */
  async function handleEvaluate() {
    if (!answer.trim()) {
      toast.error("Please type or speak your answer first.");
      return;
    }

    setIsEvaluating(true);
    try {
      const res = await fetch("/api/ai/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questions[currentIndex].question,
          answer: answer.trim(),
          jobTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newEvals = [...evaluations];
      newEvals[currentIndex] = data.data;
      setEvaluations(newEvals);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to evaluate answer.");
    } finally {
      setIsEvaluating(false);
    }
  }

  /** Move to next question */
  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswer("");
    } else {
      setStage("results");
    }
  }

  /** Calculate average score */
  const completedEvals = evaluations.filter(Boolean) as Evaluation[];
  const avgScore =
    completedEvals.length > 0
      ? Math.round(completedEvals.reduce((sum, e) => sum + e.score, 0) / completedEvals.length)
      : 0;

  function scoreColor(score: number) {
    if (score >= 80) return "text-emerald-600 animate-pulse";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  }

  // ═══════════ SETUP STAGE ═══════════
  if (stage === "setup") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Mic className="w-5 h-5 text-white animate-pulse" />
            </div>
            AI Interview <span className="text-gradient">Coach</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Practice with AI-generated interview questions tailored to your target role and get instant feedback.
          </p>
        </div>

        <Card className="py-6 shadow-md border-t-4 border-amber-500">
          <CardHeader className="pt-0">
            <CardTitle>Set Up Your Practice Session</CardTitle>
            <CardDescription>
              Tell us about the role you&apos;re preparing for and we&apos;ll generate relevant questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="jobTitleSelect">Target Job Title *</Label>
                <Select
                  value={isCustomJobTitle ? "Other" : (JOB_TITLES.includes(jobTitle) ? jobTitle : (jobTitle ? "Other" : ""))}
                  onValueChange={(val) => {
                    if (val === "Other") {
                      setIsCustomJobTitle(true);
                      setJobTitle("");
                    } else {
                      setIsCustomJobTitle(false);
                      setJobTitle(val || "");
                    }
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a job title" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TITLES.map((title) => (
                      <SelectItem key={title} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(isCustomJobTitle || (jobTitle && !JOB_TITLES.includes(jobTitle))) && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="customJobTitle">Custom Job Title *</Label>
                  <Input
                    id="customJobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Lead iOS Engineer"
                    className="h-11"
                    required
                  />
                </div>
              )}

              <div className="space-y-3">
                <Label>Key Skills</Label>
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-muted/30">
                    {selectedSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1 py-1 px-2.5">
                        {skill}
                        <button
                          type="button"
                          onClick={() => setSelectedSkills(selectedSkills.filter((s) => s !== skill))}
                          className="hover:text-destructive transition-colors rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Add a custom skill..."
                    className="h-11"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
                          setSelectedSkills([...selectedSkills, customSkill.trim()]);
                          setCustomSkill("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-4"
                    onClick={() => {
                      if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
                        setSelectedSkills([...selectedSkills, customSkill.trim()]);
                        setCustomSkill("");
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Popular Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_SKILLS.map((skill) => {
                      const isSelected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSkills(selectedSkills.filter((s) => s !== skill));
                            } else {
                              setSelectedSkills([...selectedSkills, skill]);
                            }
                          }}
                          className={`text-xs px-2.5 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={(val) => setDifficulty(val || "medium")}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy — Entry Level</SelectItem>
                      <SelectItem value="medium">Medium — Mid Level</SelectItem>
                      <SelectItem value="hard">Hard — Senior Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Question Depth Focus</Label>
                  <Select value={depth} onValueChange={(val) => setDepth(val || "conceptual")}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conceptual">Conceptual & Fundamentals</SelectItem>
                      <SelectItem value="coding">Coding & Syntax</SelectItem>
                      <SelectItem value="system-design">Architecture & System Design</SelectItem>
                      <SelectItem value="behavioral">Scenario & Behavior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 gradient-brand text-white border-0 hover:opacity-95 transition-opacity mt-4 shadow-md"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Questions
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════ PRACTICE STAGE ═══════════
  if (stage === "practice") {
    const currentQ = questions[currentIndex];
    const currentEval = evaluations[currentIndex];

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Practice Session
            </h1>
            <p className="text-sm text-muted-foreground">{jobTitle} • Focus: <span className="capitalize font-semibold">{depth}</span></p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1 font-semibold">
            {currentIndex + 1} / {questions.length}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="gradient-brand h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question card */}
        <Card className="py-6 shadow-md border-l-4 border-primary">
          <CardContent className="pt-0">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {currentQ.category}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {currentQ.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => speakQuestion(currentQ.question)}
                      className="h-8 w-8 p-0"
                    >
                      {isSpeaking ? (
                        <VolumeX className="w-4 h-4 text-destructive animate-bounce" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-primary" />
                      )}
                    </Button>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[10px] text-muted-foreground font-medium">Autoplay Voice</Label>
                      <Switch
                        checked={voiceAutoplay}
                        onCheckedChange={setVoiceAutoplay}
                      />
                    </div>
                  </div>
                </div>
                <h2 className="text-lg font-semibold leading-relaxed text-gray-900 dark:text-gray-100">
                  {currentQ.question}
                </h2>
                <p className="text-xs text-muted-foreground mt-2 bg-muted/40 p-2.5 rounded-lg border border-dashed">
                  💡 Tip: {currentQ.tips}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answer area */}
        {!currentEval ? (
          <Card className="py-6 shadow-sm">
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-sm">Your Answer</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isListening ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleListening}
                    className={`text-xs gap-1.5 transition-all shadow-sm ${isListening ? "animate-pulse" : ""}`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        Stop Voice Capture
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-primary" />
                        Answer with Voice
                      </>
                    )}
                  </Button>
                  {isListening && (
                    <span className="text-[11px] text-red-500 font-semibold animate-pulse">Recording...</span>
                  )}
                </div>
              </div>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type or speak your answer here... Be specific, use the STAR method for behavioral questions."
                rows={6}
                className="resize-none h-44"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleEvaluate}
                  className="gradient-brand text-white border-0 hover:opacity-90 transition-opacity"
                  disabled={isEvaluating || !answer.trim()}
                >
                  {isEvaluating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Answer
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Evaluation result */
          <div className="space-y-4">
            <Card className="py-6 shadow-md border-t-4 border-emerald-500">
              <CardContent className="pt-0">
                <div className="text-center mb-4">
                  <div className={`text-5xl font-bold ${scoreColor(currentEval.score)}`}>
                    {currentEval.score}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">out of 100</p>
                </div>
                <p className="text-sm text-center text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-dashed">
                  {currentEval.feedback}
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Strengths */}
              <Card className="py-5 shadow-sm">
                <CardContent className="pt-0">
                  <h3 className="font-semibold text-sm text-emerald-600 flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {currentEval.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Improvements */}
              <Card className="py-5 shadow-sm">
                <CardContent className="pt-0">
                  <h3 className="font-semibold text-sm text-amber-600 flex items-center gap-1.5 mb-3">
                    <XCircle className="w-4 h-4" />
                    Areas to Improve
                  </h3>
                  <ul className="space-y-2">
                    {currentEval.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-amber-500 font-bold mt-0.5">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Sample answer */}
            <Card className="bg-primary/5 border-primary/20 py-5 shadow-sm">
              <CardContent className="pt-0">
                <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Sample Answer
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {currentEval.sampleAnswer}
                </p>
              </CardContent>
            </Card>

            {/* Next button */}
            <div className="flex justify-end">
              <Button onClick={nextQuestion} className="gradient-brand text-white border-0 shadow-md">
                {currentIndex < questions.length - 1 ? (
                  <>
                    Next Question
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    View Results
                    <Trophy className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════ RESULTS STAGE ═══════════
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="py-8 shadow-lg border-t-4 border-amber-500">
        <CardContent className="text-center pt-0">
          <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4 shadow-md">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Practice Complete!</h1>
          <p className="text-muted-foreground mb-4">
            Here&apos;s how you performed in your {jobTitle} interview practice.
          </p>

          <div className={`text-6xl font-bold ${scoreColor(avgScore)} mb-1`}>
            {avgScore}
          </div>
          <p className="text-sm text-muted-foreground font-semibold">Average Score</p>

          <Separator className="my-6" />

          {/* Per-question scores */}
          <div className="space-y-3 text-left">
            {questions.map((q, i) => {
              const ev = evaluations[i];
              return (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 border shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">Q{i + 1}: {q.question}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {q.category}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {q.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <span className={`text-lg font-extrabold ml-4 ${ev ? scoreColor(ev.score) : "text-muted-foreground"}`}>
                    {ev ? ev.score : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setStage("setup");
                setQuestions([]);
                setEvaluations([]);
                setAnswer("");
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Session
            </Button>
            <Button
              className="gradient-brand text-white border-0 shadow-md"
              onClick={() => {
                setCurrentIndex(0);
                setAnswer("");
                setStage("practice");
              }}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Review Answers
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
