import StudioFrame from "./StudioFrame";
import "./studio.css";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <StudioFrame>{children}</StudioFrame>;
}
