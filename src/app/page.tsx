import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Product Warranty Registration
        </h1>
        <p className="text-slate-700">
          Register your product to activate your warranty and get support.
        </p>
        <div className="flex justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-6 py-3 text-white font-medium hover:bg-slate-700 transition"
          >
            Register product
          </Link>
        </div>
      </div>
    </div>
  );
}
