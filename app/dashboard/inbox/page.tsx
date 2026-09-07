import { getNotifications } from "@/lib/actions/notifications";
import { InboxList } from "@/components/inbox-list";

export default async function InboxPage() {
  const notifications = await getNotifications();

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Inbox</h1>
        <p className="text-[#a3a3a3] mt-1">Your notifications and updates</p>
      </div>
      <InboxList notifications={JSON.parse(JSON.stringify(notifications))} />
    </div>
  );
}
