"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { agentsApi } from "@/lib/api";
import { CopilotActionModal } from "@/components/copilot/CopilotActionModal";
import { Loader2, AlertCircle } from "lucide-react";

export default function CopilotTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.taskId as string;

  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    agentsApi.getStatus(taskId)
      .then(setTask)
      .catch(() => setError("Task not found or you don't have permission to view it."))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (error || !task) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center">
      <AlertCircle className="w-10 h-10 text-red-500" />
      <p className="text-base font-bold text-foreground">Task Not Found</p>
      <p className="text-sm text-muted-foreground">{error}</p>
      <button onClick={() => router.push("/dashboard/swarm")}
        className="text-sm text-primary underline">← Back to Run Agents</button>
    </div>
  );

  if (task.pipeline_mode !== "copilot") return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center">
      <p className="text-base font-bold text-foreground">This is an Autopilot task</p>
      <p className="text-sm text-muted-foreground">Copilot review is only available for tasks started in Copilot mode.</p>
      <button onClick={() => router.push("/dashboard/swarm")}
        className="text-sm text-primary underline">← Back to Run Agents</button>
    </div>
  );

  return (
    <CopilotActionModal
      task={task}
      onClose={() => router.push("/dashboard/swarm")}
      onComplete={() => router.push("/dashboard/swarm")}
    />
  );
}
