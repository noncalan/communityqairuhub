"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { updateProfileAction } from "@/app/actions/profile";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/lib/auth/current-user-provider";
import { normalizeUsername } from "@/lib/data/profile-validation";
import type { ProfileReferences } from "@/lib/data/profiles";

export function LiveSettingsPage({ references }: { references: ProfileReferences }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { profile: currentProfile, setProfile: setCurrentProfile } = useCurrentUser();
  const [pending, startTransition] = useTransition();
  const [profile, setProfile] = useState(currentProfile);

  function toggleId(id: string, values: Array<{ id: string; name: string }>, source: Array<{ id: string; name: string }>) {
    return values.some((item) => item.id === id)
      ? values.filter((item) => item.id !== id)
      : [...values, source.find((item) => item.id === id)!];
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateProfileAction({
        username: profile.username,
        fullName: profile.fullName,
        bio: profile.bio,
        programId: profile.programId ?? "",
        academicYear: profile.academicYear,
        interestIds: profile.interests.map((item) => item.id),
        skillIds: profile.skills.map((item) => item.id),
        availableForProjects: profile.availableForProjects,
        openToCollaboration: profile.openToCollaboration,
        profileVisibility: profile.profileVisibility,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProfile(result.profile);
      setCurrentProfile(result.profile);
      toast.success("Profile updated across QAIRU Hub.");
      router.refresh();
    });
  }

  return (
    <div className="page-container max-w-5xl">
      <PageHeading eyebrow="Personal preferences" title="Settings" description="Manage your live profile, privacy and account." />
      <Tabs defaultValue="profile" orientation="vertical" className="grid gap-8 md:grid-cols-[180px_1fr]">
        <TabsList className="h-fit flex-col items-stretch bg-transparent p-0">
          <TabsTrigger value="profile" className="justify-start">Profile</TabsTrigger>
          <TabsTrigger value="appearance" className="justify-start">Appearance</TabsTrigger>
          <TabsTrigger value="security" className="justify-start">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <form onSubmit={save}>
            <Section title="Profile details" desc="Changes appear in the sidebar, Home greeting, People and your public profile.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><Input value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} /></Field>
                <Field label="Username"><Input value={profile.username} onChange={(event) => setProfile({ ...profile, username: normalizeUsername(event.target.value) })} /></Field>
                <Field label="Program">
                  <select value={profile.programId ?? ""} onChange={(event) => setProfile({ ...profile, programId: event.target.value })} className="h-10 rounded-md border bg-background px-3">
                    {references.programs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
                <Field label="Academic year">
                  <select value={profile.academicYear} onChange={(event) => setProfile({ ...profile, academicYear: Number(event.target.value) })} className="h-10 rounded-md border bg-background px-3">
                    {Array.from({ length: 8 }, (_, index) => index + 1).map((year) => <option key={year} value={year}>Year {year}</option>)}
                  </select>
                </Field>
                <Field label="Bio" wide><Textarea rows={4} value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value.slice(0, 500) })} /></Field>
                <Field label="Skills" wide><ChoiceGrid options={references.skills} selected={profile.skills.map((item) => item.id)} toggle={(id) => setProfile({ ...profile, skills: toggleId(id, profile.skills, references.skills) })} /></Field>
                <Field label="Interests" wide><ChoiceGrid options={references.interests} selected={profile.interests.map((item) => item.id)} toggle={(id) => setProfile({ ...profile, interests: toggleId(id, profile.interests, references.interests) })} /></Field>
              </div>
              <Choice label="Open to projects" desc="Show this status in People." checked={profile.availableForProjects} onCheckedChange={(value) => setProfile({ ...profile, availableForProjects: value })} />
              <Choice label="Open to collaboration" desc="Let students know they can reach out." checked={profile.openToCollaboration} onCheckedChange={(value) => setProfile({ ...profile, openToCollaboration: value })} />
              <Field label="Profile visibility">
                <select value={profile.profileVisibility} onChange={(event) => setProfile({ ...profile, profileVisibility: event.target.value as "campus" | "private" })} className="h-10 rounded-md border bg-background px-3">
                  <option value="campus">All signed-in QAIRU students</option>
                  <option value="private">Only me</option>
                </select>
              </Field>
              <div className="flex justify-end border-t pt-4"><Button disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button></div>
            </Section>
          </form>
        </TabsContent>
        <TabsContent value="appearance">
          <Section title="Appearance" desc="Choose how QAIRU Hub looks on this device.">
            <div className="grid gap-2 sm:grid-cols-3">{["light", "dark", "system"].map((item) => <Button key={item} type="button" variant={theme === item ? "default" : "outline"} onClick={() => setTheme(item)} className="capitalize">{item}</Button>)}</div>
          </Section>
        </TabsContent>
        <TabsContent value="security">
          <Section title="Security" desc="Password and session controls are handled by Supabase Auth.">
            <p className="text-sm text-muted-foreground">Sign out from the account menu. If you forget your password, use the reset link on the sign-in screen.</p>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return <section className="surface rounded-lg"><div className="border-b p-5"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{desc}</p></div><div className="space-y-5 p-5">{children}</div></section>;
}
function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`grid gap-2 text-sm font-medium ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
}
function Choice({ label, desc, checked, onCheckedChange }: { label: string; desc: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-5"><div><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{desc}</p></div><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>;
}
function ChoiceGrid({ options, selected, toggle }: { options: Array<{ id: string; name: string }>; selected: string[]; toggle: (id: string) => void }) {
  return <div className="flex flex-wrap gap-2">{options.map((item) => <Button key={item.id} type="button" size="sm" variant={selected.includes(item.id) ? "default" : "outline"} onClick={() => toggle(item.id)}>{item.name}</Button>)}</div>;
}
