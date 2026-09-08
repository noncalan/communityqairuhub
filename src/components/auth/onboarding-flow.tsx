"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { completeOnboardingAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { isLiveMode } from "@/lib/app-mode";
import { normalizeUsername } from "@/lib/data/profile-validation";
import type { ProfileReferences } from "@/lib/data/profiles";
import { cn } from "@/lib/utils";

const goals = [
  "Find friends",
  "Join communities",
  "Find a project",
  "Build a startup",
  "Learn",
  "Find opportunities",
];

export function OnboardingFlow({
  references,
}: {
  references: ProfileReferences;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [programId, setProgramId] = useState("");
  const [academicYear, setAcademicYear] = useState(1);
  const [interestIds, setInterestIds] = useState<string[]>([]);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  function toggle(value: string, values: string[], update: (items: string[]) => void) {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  function next() {
    if (step === 1 && (fullName.trim().length < 2 || username.length < 3)) {
      toast.error("Add your full name and a valid username.");
      return;
    }
    if (step === 2 && !programId) {
      toast.error("Choose your program.");
      return;
    }
    if (step === 3 && !interestIds.length) {
      toast.error("Choose at least one interest.");
      return;
    }
    if (step === 4 && !skillIds.length) {
      toast.error("Choose at least one skill.");
      return;
    }
    if (step < 5) {
      setStep((current) => current + 1);
      return;
    }
    if (!isLiveMode) {
      router.push("/home");
      return;
    }
    startTransition(async () => {
      const result = await completeOnboardingAction({
        username,
        fullName,
        bio,
        programId,
        academicYear,
        interestIds,
        skillIds,
        availableForProjects: true,
        openToCollaboration: true,
        profileVisibility: "campus",
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Your QAIRU profile is ready.");
      router.replace("/home");
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-10 flex items-center gap-4">
        <Progress value={step * 20} />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {step}/5
        </span>
      </div>
      <div className="min-h-[370px]">
        {step === 1 && (
          <Step
            title="Let’s start with you"
            desc="This is how other students will recognize you."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input
                  className="h-11"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </Field>
              <Field label="Username">
                <Input
                  className="h-11"
                  value={username}
                  onChange={(event) =>
                    setUsername(normalizeUsername(event.target.value))
                  }
                  placeholder="yourname"
                  autoComplete="username"
                />
                <span className="text-xs text-muted-foreground">
                  Lowercase letters, numbers and underscores.
                </span>
              </Field>
              <Field label="Short bio" wide>
                <Textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value.slice(0, 500))}
                  placeholder="What are you learning or building?"
                  rows={4}
                />
              </Field>
            </div>
          </Step>
        )}
        {step === 2 && (
          <Step
            title="Your academic context"
            desc="Helps us surface relevant people and communities."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Program">
                <select
                  value={programId}
                  onChange={(event) => setProgramId(event.target.value)}
                  className="h-11 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Choose a program</option>
                  {references.programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Academic year">
                <select
                  value={academicYear}
                  onChange={(event) => setAcademicYear(Number(event.target.value))}
                  className="h-11 rounded-md border bg-background px-3 text-sm"
                >
                  {Array.from({ length: 8 }, (_, index) => index + 1).map((year) => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Step>
        )}
        {step === 3 && (
          <ChoiceStep
            title="What are you curious about?"
            desc="Choose as many as you like."
            options={references.interests}
            selected={interestIds}
            toggle={(id) => toggle(id, interestIds, setInterestIds)}
          />
        )}
        {step === 4 && (
          <ChoiceStep
            title="What can you contribute?"
            desc="Skills help project teams find you."
            options={references.skills}
            selected={skillIds}
            toggle={(id) => toggle(id, skillIds, setSkillIds)}
          />
        )}
        {step === 5 && (
          <ChoiceStep
            title="What brings you here?"
            desc="This helps you think about what to explore first."
            options={goals.map((name) => ({ id: name, name }))}
            selected={selectedGoals}
            toggle={(id) => toggle(id, selectedGoals, setSelectedGoals)}
          />
        )}
      </div>
      <div className="mt-10 flex items-center justify-between border-t pt-5">
        <Button
          variant="ghost"
          onClick={() => step > 1 && setStep((current) => current - 1)}
          disabled={step === 1 || pending}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button onClick={next} disabled={pending}>
          {pending ? "Saving…" : step === 5 ? "Enter QAIRU Hub" : "Continue"}
          {step === 5 ? <Check className="size-4" /> : <ArrowRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

function Step({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <p className="eyebrow">Build your profile</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">{title}</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">{desc}</p>
      {children}
    </>
  );
}

function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("grid gap-2 text-sm font-medium", wide && "sm:col-span-2")}>
      {label}
      {children}
    </label>
  );
}

function ChoiceStep({
  title,
  desc,
  options,
  selected,
  toggle,
}: {
  title: string;
  desc: string;
  options: Array<{ id: string; name: string }>;
  selected: string[];
  toggle: (id: string) => void;
}) {
  return (
    <Step title={title} desc={desc}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            onClick={() => toggle(option.id)}
            className={cn(
              "rounded-md border px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected.includes(option.id)
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:bg-accent",
            )}
          >
            {selected.includes(option.id) && <Check className="me-2 inline size-3.5" />}
            {option.name}
          </button>
        ))}
      </div>
    </Step>
  );
}
