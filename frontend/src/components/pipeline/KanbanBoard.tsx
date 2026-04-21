"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { type Lead } from "@/lib/api";
import axios from "axios";

const STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];

export function KanbanBoard() {
  const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    try {
      const res = await axios.get("/api/v1/leads/pipeline");
      setPipeline(res.data);
    } catch (err) {
      console.error("Failed to fetch pipeline", err);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the status of the over item or column
    let newStatus = overId;
    if (!STATUSES.includes(overId)) {
        // If over a card, find its column
        for (const status of STATUSES) {
            if (pipeline[status]?.find(l => l.id === overId)) {
                newStatus = status;
                break;
            }
        }
    }

    // Update backend
    try {
        await axios.patch(`/api/v1/leads/${activeId}`, { status: newStatus });
        fetchPipeline(); // Refresh to ensure sync
    } catch (err) {
        console.error("Failed to update status", err);
    }

    setActiveId(null);
  }

  return (
    <div className="flex h-full w-full gap-4 overflow-x-auto p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            id={status}
            title={status.replace("_", " ")}
            leads={pipeline[status] || []}
          />
        ))}
        <DragOverlay>
          {activeId ? (
            <KanbanCard lead={Object.values(pipeline).flat().find(l => l.id === activeId)} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
