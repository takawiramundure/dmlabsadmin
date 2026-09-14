"use client";

import MediaLibrary from "./MediaLibrary";
import { Modal } from "../ui/modal";

interface MediaPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

export default function MediaPickerModal({ isOpen, onClose, onSelect }: MediaPickerModalProps) {
    const handleSelect = (url: string) => {
        onSelect(url);
        onClose();
    };

    return (
        <MediaLibrary isOpen={isOpen} onSelect={handleSelect} onClose={onClose} />
    );
}
