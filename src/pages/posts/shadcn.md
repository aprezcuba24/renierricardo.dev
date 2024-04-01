---
layout: ../../layouts/MarkdownPostLayout.astro
title: "Clon de Shadcn"
pubDate: "Mon Apr 1 2024"
image: "//live.staticflickr.com/65535/53624769792_d2f85951e9_z.jpg"
username: "aprezcuba24"
categories: ["tutorial"]
description: "La creación de componentes reutilizables es algo útil en todos los proyectos. En este artículo explico como hacer un clon de shadcn para poder publicar nuestros propios set componentes."
---

El desarrollo de aplicaciones debe ser un proceso rápido y eficiente. En un proyecto real no se debería perder mucho tiempo probando tecnologías o ajustando procesos de desarrollo. Se debe probar las nuevas tecnologías en casos de estudios, con el objetivo de dominarlas al 100%.

Aparejado con lo anterior se debe invertir el mayor tiempo posible en la implementación de componentes de software reutilizables. De forma tal que montar nuevos proyectos sea un proceso ágil y rápido.

Una de las librerías que actualmente están ayudando mucho para esto es **shadcn** https://ui.shadcn.com/. Un set de componentes de interfaz que se puede instalar de modo sencillo en nuestras aplicaciones. Una vez instalados el programador puede modificar su código directamente porque en vez de instalarse en la clásica carpeta **node_modules** se copia directamente en el directorio de código fuente de las aplicaciones.

Viendo esta librería me surgió la idea de crear un **clon** de **shadcn** y montarlo en un host propio con el objetivo de.

- Crear componentes propios que pueda instalar en mis aplicaciones.
- Tener un mecanismo para poder documentarlos.
- Modificar si así lo deseo los componentes de **shadcn** y así a la hora de instalarlos se podrían mis modificaciones y no los componentes originales.
- En el futuro quiero no solo tener componentes de interfaz, sino que por esta vía pueda hacer otras cosas más, como librerías, configuraciones, etc.

# Resultados inmediatos.

Con el objetivo de validar la idea he creado lo siguiente.

- Un fork the **shadcn** en este repositorio https://github.com/aprezcuba24/shadcn-ui
- Desplegué el sistema en vercel https://renierricardo-shadcn-ui.vercel.app. Hacer esto me sirve para dos cosas.
	- Poder visualizar la documentación
	- Sirve como repositorio para poder instalar los nuevos componentes.
- Un nuevo **cli** https://www.npmjs.com/package/rrf-shadcn-ui muy similar al propio de **shadcn** pero este en vez de buscar los componentes en el sitio oficial lo busca en mi clon.

# Proceso para crear el clon

Tuve que hacer unas cuantas operaciones para poder desacoplar el proyecto shadcn y que usara las nuevas fuentes. Todo esto me obligó a estudiar otras tecnologías que no conocía.

No quiero detenerme en explicar cada cosa, solo decir qué hay que hacer, para evitar que se alargue mucho el artículo.

## Publicar en vercel

Publicar un proyecto en vercel es un proceso realmente sencillo, solo necesitamos crearnos una cuenta en esta plataforma y registrar el proyecto.

El objetivo de publicar en vercel es tener el sitio publicado en internet y tener una url. Lo usaremos para ver la documentación y para que nuestro cli pueda descargar los componentes de software.

## Hacer el frok del proyectos

Este paso es muy sencillo solo es ir al repositorio oficial de **shadcn** y hacerle un fork https://github.com/shadcn-ui/ui

Una vez hecho el **fork** debemos clonar el proyecto en nuestro ordenador para poder comenzar con las modificaciones.

## Modificar el cli

En el fichero `packages/cli/src/utils/registry/index.ts` en la línea 14, viene la dirección a donde se debe conectar el cli para descargar los nuevos componentes, que es https://ui.shadcn.com

Nosotros debemos modificar esta dirección y poner nuestras propia url. En mi caso puse 

```
const baseUrl =
  process.env.COMPONENTS_REGISTRY_URL ??
  "https://renierricardo-shadcn-ui.vercel.app"
```

Esta dirección la tengo después que despliegue el proyecto en vercel.

## Modificar el package.json del cli

En el fichero `packages/cli/package.json` modifiqué varios parámetros, pero lo fundamental fue cambiar el nombre del paquete, le puse **rrf-shadcn-ui**, para evitar coalicionar con el cli oficial de shadcn.

## CLI readme

Modifiqué el readme del cli, `packages/cli/README.md` para cambiar el comando que se debe usar para instalar los paquetes.

Por ejemplo en vez de poner

```
npx shadcn-ui init
```

Se debe usar 

```
npx rrf-shadcn-ui init
```

Que es el cli personalizado de mi clon.

## Modificar el package.json principal del proyectos

El proyecto está implementado con **turbopack** con la filosofía de **monorepo**. Básicamente el proyecto consta de tres aplicaciones, el website, el cli, y templates. Y por el uso de turbopack se utiliza filtros para hacer las distintas operaciones sobre los proyectos.

Como le cambiamos el nombre al proyecto de cli, tenemos que modificar el filtro de este proyecto en le `package.json` principal del proyecto.

La idea es cambiar estos comandos

```
"build:cli": "turbo --filter=rrf-shadcn-ui build",
"cli:dev": "turbo --filter=rrf-shadcn-ui dev",
"cli:start": "pnpm --filter=rrf-shadcn-ui start:dev",
```

## Github actions

**shadcn** usa github actions para crear los **release** del **cli**.  La configuración que tiene nos sirve, solo tenemos que modificar el fichero `.github/workflows/release.yml` y cambiar el código de la línea 12 que tiene esto

```
if: ${{ github.repository_owner == 'shadcn-ui' }}
```

y poner esto

```
if: ${{ github.repository_owner == 'aprezcuba24' }}
```

Con esto hacemos que esta **acción** se ejecute cuando sea nuestro repositorio, es decir, que se cree una nueva versión de nuestro cli.

En github tenemos que configurar una variable secreta con un **NPM_TOKEN** que se usa para crear el realease. Ver el fichero para entender dónde se usa.

# Crear una nueva versión

Después de haber hecho lo anterior tenemos que hacer un release del **cli**. Crear un nuevo release lleva un flujo determinado que trataré de simplificar al máximo y prometo hacer un artículo aparte para explicarlo porque de hecho fue lo que más me gustó de las nuevas cosas que aprendí.

1. Crear una nueva rama a partir de la rama **main**. En esta nueva rama es donde haremos todos los cambios ya descrito.
2. Cuando tengamos todo listo ejecutar el comando `yarn changeset`. Este comando nos pedirá una descripción de qué es lo que hemos hecho. Esta descripción se usará en el futuro para actualizar el fichero `CHANGELOG.md`
3. Crear una nueva rama llamada `changeset-release/main` y pasar todo el código que queremos para el nuevo release a esta rama.
4. Cuando tengamos todo el código listo ejecutamos el comando `yarn changeset version` que actualizará el fichero `CHANGELOG.md` y aumentará la versión del paquete cli.
Para esto nos hará falta un **GITHUB_TOKEN**
5. Hacer un **pull request** a la rama **main** y la github action creará una nueva versión del cli.

Después de esto ya deberíamos tener un nuevo comando en nuestro perfil de https://www.npmjs.com/ y en vercel la página web actualizada.

# Crear componentes

Para guiar la explicación haremos un componente con el nombre **BigBadge** que es una copia del **Badge** que ya tiene shadcn, solo que este tendrá más padding. El objetivo es solo probar.

## Crear el componentes

Shadcn mantiene dos versiones de los componentes **default** y **new-york** por lo tanto tenemos que crear una versión de nuestro componente para cada caso. Esto es algo que en el futuro quizás se pueda cambiar porque si el proyecto es para uso personal no tiene mucho sentido mantener nosotros mismo las dos versiones.

En estos ficheros puede ver el código fuente de las dos versiones

```
apps/www/registry/default/ui/bigBadge.tsx

apps/www/registry/new-york/ui/bigBadge.tsx
```

## Registrar el nuevo componente

Debemos registrar el componente para que shadcn lo tenga en cuenta en el proceso de compilación. Para esto modificamos el fichero `apps/www/registry/ui.ts` y añadimos una nueva entrada con el siguiente código.

```
{
    name: "bigBadge",
    type: "components:ui",
    files: ["ui/bigBadge.tsx"],
}
```

## Página de documentación

En la carpeta `apps/www/content/docs/components/` creamos un nuevo fichero con la documentación de nuestro nuevo componente.

Para el nuevo componente creé el fichero `apps/www/content/docs/components/bigBadge.mdx`. Básicamente es un markdown con códigos de ejemplo. Puede ver la documentación de los otros componentes para que entienda como se hace.

## Registrar la nueva página de documentación

En el fichero `apps/www/config/docs.ts` introducir una nueva entrada para la página creada. Ponemos una entrada con la siguiente

```
{
          title: "BigBadge",
          href: "/docs/components/bigBadge",
          items: [],
}
```

En la documentación se usa varios ejemplos y para cada uno hay que crear un fichero. Los que se hizo para este caso son los siguientes.

```
apps/www/registry/default/example/bigBadge-demo.tsx
apps/www/registry/default/example/bigBadge-destructive.tsx
apps/www/registry/default/example/bigBadge-outline.tsx
apps/www/registry/default/example/bigBadge-secondary.tsx
apps/www/registry/new-york/example/bigBadge-demo.tsx
apps/www/registry/new-york/example/bigBadge-destructive.tsx
apps/www/registry/new-york/example/bigBadge-outline.tsx
apps/www/registry/new-york/example/bigBadge-secondary.tsx
```

Cada fichero de ejemplo hay que registrarlo en `apps/www/registry/examples.ts`. Como puede ver hay que hacer ejemplos para cada versión del componente.

## Hacer el build con los nuevos cambios.

Cuando tengamos todo listo tenemos que ejecutar el comando

```
pnpm build:registry
```

Este comando compilará todo el código, tanto el componente como la documentación. Esto es necesario para poder probar la documentación local.

Este comando genera varios ficheros alguno de ellos son los siguientes.

```
apps/www/__registry__/index.tsx
apps/www/public/registry/index.json
apps/www/public/registry/styles/default/bigBadge.json
apps/www/public/registry/styles/new-york/bigBadge.json
```

## Pruebas locales.

Para correr la aplicación usar el comando `npm run dev`. Con esto podemos ver la documentación local  e incluso podemos usar esta instancia local para poder instalar los componentes en otras aplicaciones. Esto último es útil para hacer pruebas antes de crear una nueva versión de la aplicación.

## Probar el nuevo componente.

Una vez abierta la aplicación de la documentación localmente ya podemos hacer pruebas del componente pero también podemos instalarlo en un proyecto para ver qué tal lo hace, para esto hacemos lo siguiente.

1. Abrimos una terminal en el proyecto donde vamos a instarla el nuevo componente.
2. Creamos la siguiente variable de entorno.

```
export COMPONENTS_REGISTRY_URL=http://localhost:3003
```
esto lo hacemos para que no busque los nuevos componentes en la url por defecto, sino que lo haga en nuestro entorno local.
3. Instalamos el nuevo componente `npx rrf-shadcn-ui@latest add bigBadge` y verificamos si todo está ok.

## Publicar una nueva versión del proyectos

Cuando ya estamos listo procedemos a publicar una nueva versión de nuestro entorno de shadcn. El procedimiento es igual a lo que vimos anteriormente.

Después de esto ya podemos instalar componentes directamente desde internet.