import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <h1 className="text-3xl font-semibold text-slate-900">The/Nudge Support Desk</h1>
      <p className="mt-2 max-w-md text-center text-slate-500">
        Raise IT, HR, Finance, or Admin tickets — and see if someone has already solved your
        issue before you submit.
      </p>
      <Link
        href="/new"
        className="mt-6 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
      >
        Raise a Ticket
      </Link>
    </main>
  );
}
