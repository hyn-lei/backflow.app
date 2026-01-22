'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExternalLink, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProjectTracking, Platform } from '@/lib/directus';
import { useBoardStore } from '@/stores/board-store';
import { toast } from 'sonner';

const COLUMNS: { id: ProjectTracking['status']; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'submitted', title: 'Submitted' },
  { id: 'live', title: 'Live' },
  { id: 'rejected', title: 'Rejected' },
];

interface KanbanBoardProps {
  items: ProjectTracking[];
  viewMode: 'board' | 'list';
}

export function KanbanBoard({ items, viewMode }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { updateStatus, removeFromBoard, setBacklinkUrl, updateNotes } = useBoardStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const performStatusChange = async (item: ProjectTracking, newStatus: ProjectTracking['status']) => {
    try {
      await updateStatus(item.id, newStatus);
      toast.success(`Moved to ${COLUMNS.find((c) => c.id === newStatus)?.title}`);
      if (newStatus === 'live' && !item.live_backlink_url) {
        const url = window.prompt('Great! Paste your live backlink URL:');
        if (url) {
          await setBacklinkUrl(item.id, url);
        }
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItem = items.find((item) => item.id === active.id);
    if (!activeItem) return;

    const overId = over.id as string;
    const newStatus = COLUMNS.find((col) => col.id === overId)?.id;

    if (newStatus && newStatus !== activeItem.status) {
      await performStatusChange(activeItem, newStatus);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeFromBoard(itemId);
      toast.success('Removed from board');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <BoardItemCard
            key={item.id}
            item={item}
            onRemove={handleRemove}
            onBacklinkChange={setBacklinkUrl}
            onNotesChange={updateNotes}
            onStatusChange={(id, status) => {
              const item = items.find((entry) => entry.id === id);
              if (item) {
                void performStatusChange(item, status);
              }
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {COLUMNS.map((column) => {
          const columnItems = items.filter((item) => item.status === column.id);
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              items={columnItems}
              onRemove={handleRemove}
              onBacklinkChange={setBacklinkUrl}
              onNotesChange={updateNotes}
              onStatusChange={(id, status) => {
                const item = items.find((entry) => entry.id === id);
                if (item) {
                  void performStatusChange(item, status);
                }
              }}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeItem && (
          <BoardItemCard
            item={activeItem}
            onRemove={handleRemove}
            onBacklinkChange={setBacklinkUrl}
            onNotesChange={updateNotes}
            onStatusChange={updateStatus}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

interface KanbanColumnProps {
  column: { id: ProjectTracking['status']; title: string };
  items: ProjectTracking[];
  onRemove: (id: string) => void;
  onBacklinkChange: (id: string, url: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onStatusChange: (id: string, status: ProjectTracking['status']) => void;
}

function KanbanColumn({
  column,
  items,
  onRemove,
  onBacklinkChange,
  onNotesChange,
  onStatusChange,
}: KanbanColumnProps) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'column' },
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-muted/50 rounded-lg p-4 min-h-[400px]"
    >
      <h3 className="font-semibold mb-4 flex items-center justify-between">
        {column.title}
        <Badge variant="secondary">{items.length}</Badge>
      </h3>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {items.map((item) => (
            <SortableBoardItem
              key={item.id}
              item={item}
              onRemove={onRemove}
              onBacklinkChange={onBacklinkChange}
              onNotesChange={onNotesChange}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

interface SortableBoardItemProps {
  item: ProjectTracking;
  onRemove: (id: string) => void;
  onBacklinkChange: (id: string, url: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onStatusChange: (id: string, status: ProjectTracking['status']) => void;
}

function SortableBoardItem({
  item,
  onRemove,
  onBacklinkChange,
  onNotesChange,
  onStatusChange,
}: SortableBoardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <BoardItemCard
        item={item}
        onRemove={onRemove}
        onBacklinkChange={onBacklinkChange}
        onNotesChange={onNotesChange}
        onStatusChange={onStatusChange}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

interface BoardItemCardProps {
  item: ProjectTracking;
  onRemove: (id: string) => void;
  onBacklinkChange: (id: string, url: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onStatusChange: (id: string, status: ProjectTracking['status']) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

function BoardItemCard({
  item,
  onRemove,
  onBacklinkChange,
  onNotesChange,
  onStatusChange,
  isDragging,
  dragHandleProps,
}: BoardItemCardProps) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(item.notes || '');
  const [backlinkUrl, setBacklinkUrlLocal] = useState(item.live_backlink_url || '');

  const platform =
    typeof item.platform_id === 'number' ? null : (item.platform_id as Platform);

  const handleNotesBlur = () => {
    setEditingNotes(false);
    if (notes !== item.notes) {
      onNotesChange(item.id, notes);
    }
  };

  const handleBacklinkBlur = () => {
    if (backlinkUrl !== item.live_backlink_url) {
      onBacklinkChange(item.id, backlinkUrl);
    }
  };

  return (
    <Card
      className={`${isDragging ? 'shadow-lg ring-2 ring-primary' : ''} ${
        item.status === 'rejected' ? 'opacity-60 grayscale' : ''
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {dragHandleProps && (
              <button {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <div>
              <h4 className="font-medium text-sm">
                {platform?.name || 'Unknown Platform'}
              </h4>
              {platform?.website_url && (
                <a
                  href={platform.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center"
                >
                  Visit <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>

        {/* Status Select (for list view) */}
        {!dragHandleProps && (
          <select
            value={item.status}
            onChange={(e) => onStatusChange(item.id, e.target.value as ProjectTracking['status'])}
            className="w-full mb-2 text-xs p-1 rounded border border-border bg-background"
          >
            {COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>
                {col.title}
              </option>
            ))}
          </select>
        )}

        {/* Backlink URL (only for live status) */}
        {item.status === 'live' && (
          <div className="mb-2">
            <Input
              placeholder="Backlink URL..."
              value={backlinkUrl}
              onChange={(e) => setBacklinkUrlLocal(e.target.value)}
              onBlur={handleBacklinkBlur}
              className="h-7 text-xs"
            />
          </div>
        )}

        {/* Notes */}
        {editingNotes ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add notes..."
            className="w-full text-xs p-2 rounded border border-border bg-background resize-none"
            rows={2}
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className="text-xs text-muted-foreground hover:text-foreground w-full text-left"
          >
            {notes || 'Add notes...'}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
