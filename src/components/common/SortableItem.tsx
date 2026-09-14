"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    className?: string; // Allow passing className for grid positioning
}

export function SortableItem({ id, children, className }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
        cursor: 'grab',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={className}
        >
            {/* 
        Ideally, only a "handle" should have the listeners, but for simplicity 
        we make the whole card draggable. 
        To use a specific handle, remove {...listeners} from this div 
        and pass it to a child handle element.
      */}
            {children}
        </div>
    );
}
