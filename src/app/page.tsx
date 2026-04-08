"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    setMessage("Pracujem...");
    try {
      if (isLogin) {
        const { data, error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) {
          setMessage(`Chyba: ${error.message}`);
        } else {
          setMessage(`Úspešné prihlásenie! Vitaj späť.`);
        }
      } else {
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (error) {
          setMessage(`Chyba: ${error.message}`);
        } else {
          setMessage(`Úspešná registrácia! Vitaj ${data?.user?.name || ""}.`);
        }
      }
    } catch (e: unknown) {
      setMessage(`Neočakávaná chyba.`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="bg-white dark:bg-black p-8 rounded-xl shadow-md w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Better Auth</h1>
        <p className="text-center text-sm text-zinc-500">
          {isLogin ? "Prihlásenie do účtu" : "Vytvorenie nového účtu"}
        </p>
        
        {!isLogin && (
          <input 
            type="text" 
            placeholder="Meno" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded text-black dark:text-white dark:bg-zinc-800"
          />
        )}
        <input 
          type="email" 
          placeholder="E-mail" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded text-black dark:text-white dark:bg-zinc-800"
        />
        <input 
          type="password" 
          placeholder="Heslo" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded text-black dark:text-white dark:bg-zinc-800"
        />
        
        <button 
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {isLogin ? "Prihlásiť sa" : "Zaregistrovať sa"}
        </button>

        <button 
          onClick={() => { setIsLogin(!isLogin); setMessage(""); }}
          className="text-sm text-blue-500 hover:underline mt-2"
        >
          {isLogin ? "Nemáš účet? Zaregistruj sa." : "Už máš účet? Prihlás sa."}
        </button>

        {message && <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded text-sm break-words">{message}</div>}
      </div>
    </div>
  );
}
