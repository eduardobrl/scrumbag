import { createNavigation } from "next-intl/navigation";

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales: ["pt-BR", "en"],
  defaultLocale: "pt-BR"
});
