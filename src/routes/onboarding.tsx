import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEFAULT_SUBJECTS } from "@/lib/subjects";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Set up your profile — Scholaria" }],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, profile, refreshProfile, isReady } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setSchool(profile.school || "");
      setGrade(profile.grade || "");
      setSelected(profile.subjects || []);
    }
  }, [profile]);

  useEffect(() => {
    if (isReady && profile?.school && (profile.subjects?.length ?? 0) > 0) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isReady, profile, navigate]);

  const allSubjects = Array.from(new Set([...DEFAULT_SUBJECTS, ...selected])).sort();

  function toggle(s: string) {
    setSelected((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
  }

  function addCustom() {
    const s = customSubject.trim();
    if (!s) return;
    if (!selected.includes(s)) setSelected([...selected, s]);
    setCustomSubject("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !school.trim() || !grade.trim() || selected.length === 0) {
      toast.error("Please fill in every field and pick at least one subject.");
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name: name.trim(),
        school: school.trim(),
        grade: grade.trim(),
        subjects: selected,
      }).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile saved");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle>Welcome to Scholaria</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">Tell us a bit about you so we can tailor your dashboard.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ob-name">Full name</Label>
                <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-school">School</Label>
                <Input id="ob-school" value={school} onChange={(e) => setSchool(e.target.value)} required placeholder="Northgate High" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-grade">Grade / class</Label>
              <Input id="ob-grade" value={grade} onChange={(e) => setGrade(e.target.value)} required placeholder="Grade 11" />
            </div>
            <div className="space-y-2">
              <Label>Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {allSubjects.map((s) => {
                  const active = selected.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => toggle(s)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground/30"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-1">
                <Input value={customSubject} onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Add custom subject" className="h-9" />
                <Button type="button" variant="outline" onClick={addCustom}>Add</Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save and continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
