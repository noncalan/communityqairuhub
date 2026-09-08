"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  BrainCircuit,
  Check,
  Code2,
  Compass,
  Database,
  Eye,
  FlaskConical,
  MessageCircle,
  Microchip,
  Package,
  PenTool,
  Presentation,
  Radar,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { completeOnboardingAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { isLiveMode } from "@/lib/app-mode";
import {
  academicDirections,
  contributionOptions,
  rolesForDirection,
  type AcademicDirection,
  type ContributionPreference,
  type DesiredRole,
  type OnboardingIconName,
} from "@/lib/data/onboarding-options";
import { normalizeUsername } from "@/lib/data/profile-validation";
import type { ReferenceItem } from "@/lib/data/profiles";
import { cn } from "@/lib/utils";

const MAX_INTERESTS = 5;
const MAX_CONTRIBUTIONS = 5;

const iconByName: Record<OnboardingIconName, LucideIcon> = {
  brain: BrainCircuit,
  robot: Bot,
  database: Database,
  chart: BarChart3,
  settings: Settings2,
  message: MessageCircle,
  eye: Eye,
  flask: FlaskConical,
  package: Package,
  shield: ShieldCheck,
  microchip: Microchip,
  sliders: SlidersHorizontal,
  radar: Radar,
  wrench: Wrench,
  boxes: Boxes,
  compass: Compass,
  code: Code2,
  search: Search,
  pen: PenTool,
  users: Users,
  presentation: Presentation,
};

export function OnboardingFlow({ interests }: { interests: ReferenceItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [academicDirection, setAcademicDirection] =
    useState<AcademicDirection | null>(null);
  const [desiredRole, setDesiredRole] = useState<DesiredRole | null>(null);
  const [interestIds, setInterestIds] = useState<string[]>([]);
  const [contributionPreferences, setContributionPreferences] = useState<
    ContributionPreference[]
  >([]);

  function selectDirection(direction: AcademicDirection) {
    setAcademicDirection(direction);
    if (
      desiredRole &&
      !rolesForDirection(direction).some((role) => role.id === desiredRole)
    ) {
      setDesiredRole(null);
    }
  }

  function next() {
    if (step === 1 && (fullName.trim().length < 2 || username.length < 3)) {
      toast.error("Add your full name and a valid username.");
      return;
    }
    if (step === 2 && !academicDirection) {
      toast.error("Choose an academic direction.");
      return;
    }
    if (step === 3 && !desiredRole) {
      toast.error("Choose a role or select “I’m still exploring”.");
      return;
    }
    if (step === 4 && !interestIds.length) {
      toast.error("Choose at least one project interest.");
      return;
    }
    if (step === 5 && !contributionPreferences.length) {
      toast.error("Choose at least one way you prefer to contribute.");
      return;
    }
    if (step < 5) {
      setStep((current) => current + 1);
      return;
    }
    if (!academicDirection || !desiredRole) return;
    if (!isLiveMode) {
      router.push("/home");
      return;
    }
    startTransition(async () => {
      const result = await completeOnboardingAction({
        username,
        fullName,
        bio,
        academicDirection,
        desiredRole,
        interestIds,
        contributionPreferences,
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
    <div className="w-full max-w-4xl">
      <div className="mb-8 flex items-center gap-4 sm:mb-10">
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
                  Lowercase letters, numbers, and underscores.
                </span>
              </Field>
              <Field label="Short bio (optional)" wide>
                <Textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value.slice(0, 500))}
                  placeholder="What are you learning or hoping to build?"
                  rows={4}
                />
              </Field>
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step
            title="Choose your academic direction"
            desc="QAIRU’s first-year program has two directions. Choose the one you’re following."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {academicDirections.map((direction) => {
                const Icon = iconByName[direction.icon];
                const selected = academicDirection === direction.id;
                return (
                  <SelectableCard
                    key={direction.id}
                    selected={selected}
                    onClick={() => selectDirection(direction.id)}
                    title={direction.name}
                    description={direction.description}
                    icon={Icon}
                    roomy
                  />
                );
              })}
            </div>
          </Step>
        )}

        {step === 3 && academicDirection && (
          <Step
            title="What do you want to work as?"
            desc={`Choose one role to explore in ${academicDirections.find((item) => item.id === academicDirection)?.name}. You can change it later.`}
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {rolesForDirection(academicDirection).map((role) => (
                <SelectableCard
                  key={role.id}
                  selected={desiredRole === role.id}
                  onClick={() => setDesiredRole(role.id)}
                  title={role.name}
                  description={role.description}
                  icon={iconByName[role.icon]}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step
            title="What do you want to build?"
            desc="Choose 1–5 project interests. We’ll use these for project discovery and team matching."
            meta={`${interestIds.length}/${MAX_INTERESTS} selected`}
          >
            <ChoiceGrid
              options={interests}
              selected={interestIds}
              onToggle={(id) =>
                toggleLimited(
                  id,
                  interestIds,
                  setInterestIds,
                  MAX_INTERESTS,
                  "project interests",
                )
              }
            />
          </Step>
        )}

        {step === 5 && (
          <Step
            title="How do you prefer to contribute?"
            desc="Choose the kinds of work you’d enjoy taking on in a team."
            meta={`${contributionPreferences.length}/${MAX_CONTRIBUTIONS} selected`}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {contributionOptions.map((option) => {
                const selected = contributionPreferences.includes(option.id);
                const Icon = iconByName[option.icon];
                return (
                  <button
                    type="button"
                    key={option.id}
                    aria-pressed={selected}
                    onClick={() =>
                      toggleLimited(
                        option.id,
                        contributionPreferences,
                        setContributionPreferences,
                        MAX_CONTRIBUTIONS,
                        "contribution preferences",
                      )
                    }
                    className={cn(
                      "flex min-h-20 items-center gap-3 rounded-lg border bg-card p-4 text-start transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-primary bg-primary/5 shadow-[0_0_0_1px_var(--primary)]"
                        : "hover:border-primary/40 hover:bg-accent/50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground",
                        selected && "bg-primary text-primary-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="text-sm font-semibold">{option.name}</span>
                  </button>
                );
              })}
            </div>
          </Step>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between border-t pt-5 sm:mt-10">
        <Button
          className="h-10 px-4"
          variant="ghost"
          onClick={() => step > 1 && setStep((current) => current - 1)}
          disabled={step === 1 || pending}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button className="h-10 px-4" onClick={next} disabled={pending}>
          {pending ? "Saving…" : step === 5 ? "Enter QAIRU Hub" : "Continue"}
          {step === 5 ? (
            <Check className="size-4" />
          ) : (
            <ArrowRight className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function toggleLimited<T extends string>(
  value: T,
  values: T[],
  update: (items: T[]) => void,
  maximum: number,
  label: string,
) {
  if (values.includes(value)) {
    update(values.filter((item) => item !== value));
    return;
  }
  if (values.length >= maximum) {
    toast.error(`Choose up to ${maximum} ${label}.`);
    return;
  }
  update([...values, value]);
}

function Step({
  title,
  desc,
  meta,
  children,
}: {
  title: string;
  desc: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <p className="eyebrow">Build your profile</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.045em]">
          {title}
        </h1>
        {meta && <span className="font-mono text-xs text-muted-foreground">{meta}</span>}
      </div>
      <p className="mb-7 mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {desc}
      </p>
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

function SelectableCard({
  selected,
  onClick,
  title,
  description,
  icon: Icon,
  roomy,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon: LucideIcon;
  roomy?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "group relative flex min-h-32 flex-col items-start rounded-lg border bg-card p-4 text-start transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        roomy && "min-h-44 p-5",
        selected
          ? "border-primary bg-primary/5 shadow-[0_0_0_1px_var(--primary)]"
          : "hover:border-primary/40 hover:bg-accent/40",
      )}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-md bg-muted text-muted-foreground transition-colors",
          selected && "bg-primary text-primary-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className={cn("mt-5 text-sm font-semibold", roomy && "text-base")}>{title}</span>
      <span className="mt-1 text-xs leading-5 text-muted-foreground">{description}</span>
      {selected && (
        <span className="absolute end-3 top-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </span>
      )}
    </button>
  );
}

function ChoiceGrid({
  options,
  selected,
  onToggle,
}: {
  options: ReferenceItem[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option.id);
        return (
          <button
            type="button"
            key={option.id}
            aria-pressed={active}
            onClick={() => onToggle(option.id)}
            className={cn(
              "rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:border-primary/40 hover:bg-accent",
            )}
          >
            {active && <Check className="me-2 inline size-3.5" />}
            {option.name}
          </button>
        );
      })}
    </div>
  );
}
