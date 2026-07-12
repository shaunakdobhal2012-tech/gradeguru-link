import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { estimateMinutes } from "./assignment-estimate";

export type AssignmentStatus = "pending" | "in_progress" | "submitted" | "graded";

export type AssignmentRow = {
  id: string;
  student_id: string;
  title: string;
  description: string;
  subject: string;
  due_date: string;
  estimated_time: number;
  status: AssignmentStatus;
  grade: string | null;
  feedback: string | null;
  attachments: string[];
  created_at: string;
  updated_at: string;
};

export type AssignmentDerivedStatus = AssignmentStatus | "overdue";

export function derivedStatus(a: AssignmentRow): AssignmentDerivedStatus {
  if (a.status === "submitted" || a.status === "graded") return a.status;
  return new Date(a.due_date).getTime() < Date.now() ? "overdue" : a.status;
}

export function useAssignments() {
  return useQuery({
    queryKey: ["assignments"],
    queryFn: async (): Promise<AssignmentRow[]> => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AssignmentRow[];
    },
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      subject: string;
      due_date: string;
      files: File[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");

      // Upload files
      const paths: string[] = [];
      for (const file of input.files) {
        const key = `${uid}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("assignment-attachments")
          .upload(key, file, { upsert: false });
        if (upErr) throw upErr;
        paths.push(key);
      }

      const est = estimateMinutes({ title: input.title, description: input.description });
      const { data, error } = await supabase
        .from("assignments")
        .insert({
          student_id: uid,
          title: input.title,
          description: input.description,
          subject: input.subject,
          due_date: input.due_date,
          estimated_time: est.minutes,
          attachments: paths,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as AssignmentRow;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      patch: Partial<Pick<AssignmentRow, "status" | "grade" | "feedback" | "title" | "description" | "subject" | "due_date">>;
    }) => {
      const { error } = await supabase
        .from("assignments")
        .update(input.patch)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useUploadSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignment_id, file }: { assignment_id: string; file: File }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const key = `${uid}/${assignment_id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("submissions")
        .upload(key, file, { upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase
        .from("submissions")
        .insert({ assignment_id, student_id: uid, file_url: key });
      if (insErr) throw insErr;
      const { error: updErr } = await supabase
        .from("assignments")
        .update({ status: "submitted" })
        .eq("id", assignment_id);
      if (updErr) throw updErr;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export async function getSignedUrl(bucket: string, path: string, expires = 300) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expires);
  if (error) throw error;
  return data.signedUrl;
}
