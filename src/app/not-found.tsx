import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-bold text-zinc-900">Página não encontrada</h1>
      <p className="text-sm text-zinc-500">
        O conteúdo que você procura não existe ou você não tem acesso a ele.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Voltar ao início
      </Link>
    </main>
  );
}
