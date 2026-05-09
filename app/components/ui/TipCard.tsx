import { Lightbulb } from "lucide-react";

type TipCardProps = {
  title?: string;
  line1?: string;
  line2?: string;
  className?: string;
};

export default function TipCard({
  title = "Tip",
  line1 = "You can always edit these details later.",
  line2 = "Don't worry if things change.",
  className = "",
}: TipCardProps) {
  return (
    <section
      className={`w-[411px] rounded-[16px] border border-[#181824] bg-gradient-to-b from-[#11111A] to-[#0D0D14] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)] ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7C3AED33] text-[#A78BFA]">
          <Lightbulb className="h-5 w-5" />
        </div>

        <div className="space-y-1">
          <p className="text-[14px] leading-5 font-medium text-[#F5F5F7]">{title}</p>
          <p className="text-[14px] leading-5 text-[#A1A1AA]">{line1}</p>
          <p className="text-[14px] leading-5 text-[#A1A1AA]">{line2}</p>
        </div>
      </div>
    </section>
  );
}