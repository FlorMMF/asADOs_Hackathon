import type { Rol } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    rol: Rol;
    dependenciaId: string | null;
  }

  interface Session {
    user: {
      id: string;
      rol: Rol;
      dependenciaId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: Rol;
    dependenciaId: string | null;
  }
}
