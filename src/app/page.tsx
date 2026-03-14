import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="max-w-md w-full text-center space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Product Warranty Registration
        </h1>
        <p className="text-slate-700 text-base sm:text-lg">
          Register your product to activate your warranty and get support.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-slate-800 px-6 py-3.5 text-white font-medium hover:bg-slate-700 transition min-h-[44px] w-full sm:w-auto"
          >
            Register product
          </Link>
        </div>
      </div>
    </div>
  );
}
