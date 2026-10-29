"use client";

import { useState } from "react";
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
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ApplicationStatus } from "@prisma/client";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Define the shape of our application data
export type PipelineApplication = {
  id: string;
  status: ApplicationStatus;
  jobSeeker: {
    user: {
      name: string | null;
      image: string | null;
    };
  };
  job: {
    title: string;
  };
  appliedAt: Date;
};

// Map column statuses to visual configurations
const COLUMNS: Record<ApplicationStatus, { name: string; color: string; bgColor: string; visible: boolean }> = {
  APPLIED: { name: "Applied", color: "border-blue-500", bgColor: "bg-blue-50 dark:bg-blue-900/20", visible: true },
  SCREENING: { name: "Screening", color: "border-amber-500", bgColor: "bg-amber-50 dark:bg-amber-900/20", visible: true },
  INTERVIEW: { name: "Interview", color: "border-violet-500", bgColor: "bg-violet-50 dark:bg-violet-900/20", visible: true },
  OFFER: { name: "Offer", color: "border-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-900/20", visible: true },
  REJECTED: { name: "Rejected", color: "border-red-500", bgColor: "bg-red-50 dark:bg-red-900/20", visible: false },
  WITHDRAWN: { name: "Withdrawn", color: "border-gray-500", bgColor: "bg-gray-50 dark:bg-gray-900/20", visible: false },
};

// Draggable Sortable Item Component
function SortableApplicationCard({ app }: { app: PipelineApplication }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id, data: { type: "Application", app } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const name = app.jobSeeker.user.name || "Unknown";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Card className="py-3 cursor-grab hover:shadow-md transition-shadow">
        <CardContent className="pt-0 pb-0 flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={app.jobSeeker.user.image || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 py-1">
            <p className="text-sm font-medium truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{app.job.title}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PipelineKanban({ initialApplications }: { initialApplications: PipelineApplication[] }) {
  const [savedApplications, setSavedApplications] = useState<PipelineApplication[]>(initialApplications);
  const [applications, setApplications] = useState<PipelineApplication[]>(initialApplications);
  const [activeApplication, setActiveApplication] = useState<PipelineApplication | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Group applications by status
  const columns = Object.entries(COLUMNS)
    .filter(([, config]) => config.visible)
    .map(([status, config]) => {
      return {
        id: status as ApplicationStatus,
        ...config,
        items: applications.filter((app) => app.status === status),
      };
    });

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const app = applications.find((a) => a.id === active.id);
    if (app) setActiveApplication(app);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Application";
    const isOverTask = over.data.current?.type === "Application";
    const isOverColumn = over.data.current?.type === "Column";

    // Dropping a Task over another Task
    if (isActiveTask && isOverTask) {
      setApplications((apps) => {
        const activeIndex = apps.findIndex((t) => t.id === activeId);
        const overIndex = apps.findIndex((t) => t.id === overId);
        
        if (apps[activeIndex].status !== apps[overIndex].status) {
          // Changed column
          const newApps = [...apps];
          newApps[activeIndex].status = apps[overIndex].status;
          return arrayMove(newApps, activeIndex, overIndex);
        }
        // Same column
        return arrayMove(apps, activeIndex, overIndex);
      });
    }

    // Dropping a Task over an empty Column
    if (isActiveTask && isOverColumn) {
      setApplications((apps) => {
        const activeIndex = apps.findIndex((t) => t.id === activeId);
        const newApps = [...apps];
        newApps[activeIndex].status = overId as ApplicationStatus;
        return arrayMove(newApps, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveApplication(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const currentApp = applications.find(a => a.id === activeId);
    if (!currentApp) return;
    
    let newStatus = currentApp.status;

    const isOverTask = over.data.current?.type === "Application";
    const isOverColumn = over.data.current?.type === "Column";

    if (isOverTask) {
      const overApp = applications.find(a => a.id === over.id);
      if (overApp) newStatus = overApp.status;
    } else if (isOverColumn) {
      newStatus = over.id as ApplicationStatus;
    }

    // Persist changes if status changed
    const originalStatus = savedApplications.find(a => a.id === activeId)?.status;
    
    if (newStatus !== originalStatus) {
      try {
        const res = await fetch(`/api/applications/${activeId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        
        if (!res.ok) throw new Error("Failed to update");
        toast.success(`Status updated to ${COLUMNS[newStatus].name}`);
        
        // Update local saved reference state
        setSavedApplications(prev => {
          const next = [...prev];
          const originalIndex = next.findIndex(a => a.id === activeId);
          if (originalIndex !== -1) {
            next[originalIndex] = { ...next[originalIndex], status: newStatus };
          }
          return next;
        });

      } catch {
        toast.error("Failed to update status");
        // Revert optimistically
        setApplications([...savedApplications]);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col) => (
          <DroppableColumn key={col.id} column={col} />
        ))}
      </div>

      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
        {activeApplication ? (
          <Card className="py-3 shadow-xl border-primary">
            <CardContent className="pt-0 pb-0 flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={activeApplication.jobSeeker.user.image || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {(activeApplication.jobSeeker.user.name || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 py-1">
                <p className="text-sm font-medium truncate">{activeApplication.jobSeeker.user.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate">{activeApplication.job.title}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Column Component
type ColumnConfig = {
  id: ApplicationStatus;
  name: string;
  color: string;
  bgColor: string;
  visible: boolean;
  items: PipelineApplication[];
};

function DroppableColumn({ column }: { column: ColumnConfig }) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: "Column", column },
  });

  return (
    <div className="space-y-3 flex flex-col h-full min-h-[300px]">
      <div className={`flex items-center gap-2 p-3 rounded-lg ${column.bgColor} border-l-4 ${column.color}`}>
        <h3 className="font-semibold text-sm flex-1">{column.name}</h3>
        <Badge variant="secondary" className="text-[10px]">
          {column.items.length}
        </Badge>
      </div>

      <div ref={setNodeRef} className="flex-1 space-y-3 p-1">
        <SortableContext items={column.items.map((i: PipelineApplication) => i.id)} strategy={verticalListSortingStrategy}>
          {column.items.length > 0 ? (
            column.items.map((app: PipelineApplication) => (
              <SortableApplicationCard key={app.id} app={app} />
            ))
          ) : (
            <Card className="py-8 border-dashed bg-transparent border-muted-foreground/20">
              <CardContent className="pt-0 pb-0 text-center flex flex-col items-center">
                <Users className="w-6 h-6 text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground/70">
                  Drop candidates here
                </p>
              </CardContent>
            </Card>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
