// app/root.tsx
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,

} from "@remix-run/react";

// Importações CSS em ordem de prioridade
import tailwindStylesheetUrl from "./styles/tailwind.css?url";
import designTokensStylesheetUrl from "./styles/design-tokens.css?url";
import { LinksFunction } from "@remix-run/node";

// Função que define os links CSS que serão carregados
export const links: LinksFunction = () => {
  return [
    // 1. Tailwind CSS (base)
    { rel: "stylesheet", href: tailwindStylesheetUrl },

    // 2. Design Tokens do FinanceFlow (sobrescreve/complementa o Tailwind)
    { rel: "stylesheet", href: designTokensStylesheetUrl },

    // 3. Fontes (opcional - Google Fonts)
    {
      rel: "preconnect",
      href: "https://fonts.googleapis.com",
    },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
    },
  ];
};

export default function App() {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="description" content="FinanceFlow - Sistema de Gestão Contábil" />
        <Meta />
        <Links />
      </head>
      <body className="h-full font-sans antialiased">
        {/* Container principal da aplicação */}
        <div id="root" className="h-full">
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Tratamento de erros global (opcional mas recomendado)
export function ErrorBoundary({ error }: { error: Error }) {
  console.error({ errorBoundaryError: error });

  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <title>Erro - FinanceFlow</title>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          {/* Background decorativo mesmo na tela de erro */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative flex min-h-screen items-center justify-center p-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Oops! Algo deu errado
              </h1>

              <p className="text-gray-600 mb-6">
                Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
              </p>

              <div className="space-y-3">
                <a
                  href="/app"
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
                >
                  Voltar ao início
                </a>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full h-12 bg-white/60 backdrop-blur-sm border border-gray-200 hover:bg-white hover:border-indigo-300 text-gray-700 font-semibold rounded-xl shadow-sm hover:shadow-md transform hover:scale-[1.01] transition-all duration-200"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        </div>

        <Scripts />
      </body>
    </html>
  );
}