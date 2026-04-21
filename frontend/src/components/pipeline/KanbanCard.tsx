"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";

interface KanbanCardProps {
  lead: any;
  isOverlay?: boolean;
}

export function KanbanCard({ lead, isOverlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead?.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!lead) return null;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isOverlay ? 'shadow-lg border-primary' : ''}`}>
        <CardHeader className="p-3 pb-0">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">
                {lead.contact_name?.[0] || 'L'}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-sm font-medium truncate">
              {lead.contact_name || lead.company_name || "New Prospect"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground truncate italic">
                {lead.notes || "No notes yet..."}
            </p>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Score: {lead.score?.toFixed(1) || '0.0'}
              </Badge>
              {lead.value_estimate && (
                <span className="text-[10px] font-semibold text-green-600">
                    ${lead.value_estimate.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
