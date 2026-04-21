import { joinRoom } from "@/actions/rooms";
import { redirect } from "next/navigation";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  async function handleJoin() {
    "use server";
    await joinRoom(token);
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm border border-gray-100 text-center">
        <div className="text-4xl mb-3">🏠</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">
          ルームへの招待
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          招待リンクからルームに参加します。
        </p>
        <form action={handleJoin}>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            ルームに参加する
          </button>
        </form>
      </div>
    </div>
  );
}
