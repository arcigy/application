"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();
  const userName = params.user as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await authClient.getSession();
      if (error || !data) {
        router.push("/");
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (loading) {
    return <div className="p-10 text-center">Načítavam...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 rounded-xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-4">
          Vitaj vo svojom custom dashboarde, {userName}!
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Táto stránka existuje na adrese <code>/{userName}/dashboard</code> a môžeš ju prispôsobiť špeciálne pre seba.
        </p>

        <button 
          onClick={async () => {
            await authClient.signOut();
            router.push("/");
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Odhlásiť sa
        </button>
      </div>
    </div>
  );
}