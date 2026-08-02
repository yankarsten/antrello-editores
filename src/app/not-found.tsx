import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-mist px-4 text-center">
      <h1 className="text-4xl font-medium">
        <span className="pill">Página não encontrada</span>
      </h1>
      <p className="max-w-md text-base text-ink/70">
        O conteúdo que você procura não existe ou você não tem acesso a ele.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Voltar ao início
      </Link>
    </main>
  );
}
