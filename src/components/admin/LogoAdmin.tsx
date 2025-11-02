import { useTheme } from "next-themes";
import logoDark from "/logo-dark.png";
import logoLight from "/logo-light.png";

export function LogoAdmin() {
  const { theme } = useTheme();
  
  // Durante SSR ou antes do themeresolver, mostrar logo escuro como padrão
  const logoSrc = theme === "light" ? logoLight : logoDark;
  
  return (
    <img 
      src={logoSrc} 
      alt="Inteligência AI" 
      className="h-12 w-auto object-contain"
    />
  );
}
