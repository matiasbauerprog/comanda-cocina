# Comanda Gaspacho

Sistema de pedidos para Gaspacho: el dueño carga y despacha pedidos, la cocina ve la
comanda en tiempo real y hay estadísticas de ventas y clientes. Es una PWA hecha con
React + Vite + Tailwind, con Supabase como base de datos, autenticación y realtime.

## Puesta en marcha

1. Instalar dependencias:

   ```sh
   npm install
   ```

2. Copiar `.env.example` a `.env.local` y completar las variables.

3. En Supabase:
   1. **Authentication > Users > Add user**: crear un usuario para el dueño y otro para
      la cocina (marcar "Auto Confirm User"). La contraseña tiene que tener al menos 6
      caracteres.
   2. **SQL Editor**: abrir `supabase/setup.sql`, reemplazar los dos emails del paso 4 y
      correrlo. Activa RLS, borra las políticas viejas y asigna el rol de cada usuario.

4. Levantar la app:

   ```sh
   npm run dev
   ```

## Roles

| Rol | Ve | Puede |
|---|---|---|
| Dueño (`owner`) | Gestor, Comanda, Estadísticas | Todo |
| Cocina (`kitchen`) | Comanda | Solo leer pedidos |

El rol está en `app_metadata.role` del usuario de Supabase y lo valida la base de datos
(RLS). Cada usuario puede cambiar su contraseña con el botón de la llave en el header.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Tests de la lógica de pedidos, fechas y KPIs (`node --test`) |

## Estructura

```
src/
  lib/         supabase, auth, fechas y parseo de pedidos (lógica pura, con tests)
  store/       StoreProvider (datos + realtime), useStore, cálculo de KPIs
  hooks/       useIsMobile, useOrderUrgency
  components/  formulario, comanda, KPIs, calendario, modales
  views/       Login, Gestor, Cocina, Estadísticas
supabase/      setup.sql (RLS y roles)
tests/         tests de la lógica
```
