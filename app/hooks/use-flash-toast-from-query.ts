import { useEffect } from "react";
import { useLocation } from "@remix-run/react";
import { useToast } from "@/components/ui/use-toast";

export function useFlashToastFromQuery() {
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const url = new URL(window.location.href);

    const success = url.searchParams.get("success");
    const error = url.searchParams.get("error");

    if (success) {
      toast({
        title: "Sucesso",
        description: decodeURIComponent(success),
        duration: 3000,
      });
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    if (error) {
      toast({
        title: "Erro",
        description: decodeURIComponent(error),
        variant: "destructive",
        duration: 4000,
      });
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [location.key]);
}
