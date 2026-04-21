"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  id: string;
  title: string;
  leads: any[];
}

export function KanbanColumn({ id, title, leads }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex w-80 shrink-0 flex-col rounded-lg bg-gray-100/50 p-4 dark:bg-gray-800/40">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-xs">
          {title}
        </h3>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          {leads.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex min-h-[200px] flex-col gap-3">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
