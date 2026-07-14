import { Modal } from "@/components/ui/modal";
import type { LegalSection } from "@/constants/legalContent";

type LegalDocumentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sections: LegalSection[];
};

export function LegalDocumentModal({
  open,
  onOpenChange,
  title,
  sections,
}: LegalDocumentModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      className="max-h-[85vh] max-w-2xl"
    >
      <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1 text-sm text-muted-foreground">
        {sections.map((section) => (
          <section key={section.heading}>
            <h3 className="mb-1.5 font-medium text-foreground">{section.heading}</h3>
            <p className="leading-relaxed">{section.body}</p>
          </section>
        ))}
      </div>
    </Modal>
  );
}
