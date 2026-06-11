import { Screen } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { Conversations } from "@/components/conversations";

export default function AdminMessages() {
  return (
    <Screen scroll={false}>
      <Topbar title="Messages" />
      <Conversations />
    </Screen>
  );
}
