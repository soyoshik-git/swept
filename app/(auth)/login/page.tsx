import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">🧹 Swept</h1>
          <p className="mt-2 text-sm text-gray-500">
            ルームシェアの掃除を公平に管理
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
