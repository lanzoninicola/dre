import { Form, useActionData, useNavigation } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { createUserSession, getUser, verifyPassword } from "~/domain/auth/auth.server";
import prismaClient from "~/lib/prisma/client.server";
import { badRequest } from "~/utils/http-response.server";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowRight, Calculator, Eye, EyeOff, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { GradientButton } from "~/components/layouts/gradient-button";
import { GlassInput } from "~/components/layouts/glass-input";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);
  if (user) return redirect("/home");
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return badRequest("Email e senha são obrigatórios");
  }

  const user = await prismaClient.user.findUnique({
    where: { email },
    include: { accountingFirm: true },
  });

  if (!user || !user.isActive) {
    return badRequest("Usuário não encontrado ou inativo");
  }

  if (!(await verifyPassword(password, user.password))) {
    return badRequest("Senha incorreta");
  }

  return createUserSession(user.id, "/home");
};

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);

  // Usar o estado de navegação do Remix em vez de estado local
  const isLoading = navigation.state === "submitting";

  // Resetar o formulário quando houver erro
  useEffect(() => {
    if (actionData?.message && actionData.status >= 400) {
      // Forçar reset dos campos do formulário
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        // Não resetar completamente, apenas limpar a senha por segurança
        const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement;
        if (passwordInput) {
          passwordInput.value = '';
        }
      }
    }
  }, [actionData]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 ">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative flex min-h-screen">
        {/* Left side - Brand */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  FinanceFlow
                </h1>
                <p className="text-sm text-gray-500">Sistema de Gestão Contábil</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Simplifique seu
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> fechamento mensal</span>
            </h2>

            <p className="text-lg text-gray-600 mb-8">
              Automatize processos, reduza erros e tenha mais tempo para focar no que realmente importa: seus clientes.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-indigo-600">98%</div>
                <div className="text-sm text-gray-600">Redução de erros</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-purple-600">5x</div>
                <div className="text-sm text-gray-600">Mais produtividade</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10">
              <div className="text-center mb-8">
                <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    FinanceFlow
                  </span>
                </div>

                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  Bem-vindo de volta
                </h3>
                <p className="text-gray-600">
                  Entre na sua conta para continuar
                </p>
              </div>

              <Form method="post" className="space-y-6" key={actionData?.message}>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 ml-1">
                    Email
                  </Label>
                  <GlassInput
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 ml-1">
                    Senha
                  </Label>
                  <div className="relative">
                    <GlassInput
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {actionData?.message && actionData.status >= 400 && (
                  <Alert variant="destructive" className="bg-red-50/80 backdrop-blur-sm border-red-200/50 rounded-xl">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-700 font-medium">
                      {actionData.message}
                    </AlertDescription>
                  </Alert>
                )}

                <GradientButton
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Entrando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Entrar na plataforma
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  )}
                </GradientButton>
              </Form>

              <div className="mt-8 pt-6 border-t border-gray-200/50">
                <p className="text-center text-xs text-gray-500">
                  Protegido por criptografia de ponta a ponta • SOC 2 Tipo II
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}