import { Screen } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { Conversations } from "@/components/conversations";

export default function NurseMessages() {
  return (
    <Screen scroll={false}>
      <Topbar title="Messages" />
      <Conversations showAdminButton />
    </Screen>
  );
}
