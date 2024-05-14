---
layout: ../../layouts/MarkdownPostLayout.astro
title: "¿Cómo usar clases como server action en NextJs?"
pubDate: "Tue May 14 2024"
image: "https://live.staticflickr.com/65535/53721367415_c14de1da95_z.jpg"
username: "aprezcuba24"
categories: ["tutorial"]
description: "Empiezo con una mala noticia, no es puede 🤯. Un server action tiene que ser una función simple, que como parámetros solo puede recibir valores primarios u objetos planos."
---

Empiezo con una mala noticia, no es puede 🤯. Un server action tiene que ser una función simple, que como parámetros solo puede recibir valores primarios u objetos planos.

En el proceso de desarrollo existe varios paradigmas a la hora de programar. Y en el mundo de javascript se ha puesto muy de moda la programación funcional, dejando hasta cierto punto relegado a un segundo plano, la programación orientada a objetos POO.

La programación funcional tiene la ventaja que facilita mucho la composición. Siendo muy fácil concatenar funciones simples para lograr implementaciones más complejas, potenciando la reutilización de código.

Pero la POO tiene también muchas ventajas y una de ellas es que permite agrupar en un solo lugar funcionalidades relacionadas. Particularmente, en este artículo se utilizará para crear clases plantillas, es decir, crear una clase base que tenga un conjunto de funcionalidades comunes en una jerarquía de clases y que sean las clases hijas las que implementen las funcionalidades particulares en cada caso.

# BaseRepository

**BaseRepository** es una clase base que tiene los métodos comunes para poder manipular un modelo de la base de datos. No se entrará en detalles de la implementación concreta, solo se pondrá los métodos públicos que tiene.

```
import { prisma } from '@repo/model/prisma-client';
import { ZodType } from 'zod';

type TValidatorByAction = {
  [action: string]: ZodType
}

type PaginateOptions = {
  pageIndex?: number
  pageSize?: number
  where?: any
}

export abstract class BaseRepository<T> {
  constructor(protected validatorSchema: ZodType, protected model: any) {
  }

  protected addValidator(action: string, validator: ZodType) {
  }

  create(data: T) {
  }

  async paginate({ pageIndex = 1, pageSize = 2, where = {} }: PaginateOptions = {}) {
  }

  remove(id: any) {
  }

  update(id: any, data: any) {
  }
}
```

En el constructor recibe qué modelo debe manipular y el schema de validación.

# PostRepository

Para el ejemplo vamos a suponer que tenemos una entidad con el nombre **Post** que tendrá como campos: title y content. Y su clase repository sería lo siguiente.

```
import { prisma } from '@repo/model/prisma-client';
import { Post } from '@repo/model/prisma/generated/models';
import { PostModel } from "@repo/model/prisma/zod/post"
import { BaseRepository } from "@repo/model/base-repository";

export class PostRepository extends BaseRepository<Post> {
  constructor() {
    super(PostModel, prisma.post)
  }
}

export const postRepository = new PostRepository()
```

Como se puede ver usar la clase Base (Plantilla) nos facilita la reutilización de código y garantiza que todas las modelos tengan un comportamiento similar.

Además como última línea de código se crear una instancia de la clase y se devuelve. Con esto implementamos el patrón **singletón**, una única instancia de esta clase debería existir en la aplicación.

# Server actions

La cuestión sería cómo usar las clases repositorio en los server actions, en el ejemplo **PostRepository**.

Supongamos que tenemos un formulario para crear Posts que recibe como props la server action que debe utilizar.

Lo primero que se nos ocurriría es hacer algo como esto.

```
<Form action={postRepository.create.bind(postRepository)} defaultValues={defaultValues} />
```

Esto no funciona y es que debemos marcar la función como **use server**, pero a pesar de que lo hagamos, Nextjs no es capás de procesar esta directiva en un método de una clase.

## Crear la función server action

Por lo tanto lo que nos queda es crear una función simple para envolver la llamada al método de la clase y nos quedaría de la siguiente forma.

```
export default async function Page() {
  async function createAction(data: any) {
    'use server'
    postRepository.create(data)
    revalidatePath(‘/post’)
  }
  return <Form action={createAction} defaultValues={defaultValues} />
}
```

Un código similar deberíamos hacer para los demás métodos, create, update y paginate. Esto estaría bien pero tendríamos que repetir el mismo código en todos los CRUD que vayamos haciendo en el futuro. Por lo tanto para mi, la solución es hacer un **helper** que envuelva estas acciones.

## CRUD helper

El **helper crud** es una función que internamente va crear otras funciones y las devolverá listas para que sean usadas.

Para ir paso a paso en el razonamiento, primero vamos a crear un helper sin parametrizar y luego le iremos agregando los parámetros necesarios. Solo vamos a trabajar con el método **crear**, los demás serían similares.

```
export async function crud() {
  const createAction = async (data: any) => {
    'use server'
    postRepository.create(data)
    revalidatePath(‘/post’)
  }

  return {
    createAction,
  };
}
```

Para usar este helper en la página sería así.

```
export default async function Page() {
  const { createAction } = crud()
  return <Form action={createAction} defaultValues={defaultValues} />
}
```

Esto ya funcionaría pero evidentemente no vamos a crear un helper por cada crud. Deberíamos ser capaces de pasarle por parámetro qué repositorio debe usar y qué ruta debe revalidar.

## Primera versión del helper CRUD con parámetros

Un versión con parámetros podría ser como la siguiente.

```
export async function crud(repository: BaseRepository, path: string) {
  const createAction = async (data: any) => {
    'use server'
    repository.create(data)
    revalidatePath(path)
  }

  return {
    createAction,
  };
}
```

Luego usarlo en la página sería.

```
export default async function Page() {
  const { createAction } = crud(postRepository, '/post')
  return <Form action={createAction} defaultValues={defaultValues} />
}
```

Esta variante sería más adecuada porque con un único helper ya puedo implementar de forma sencilla el crud de cualquier entidad, siendo mínimo el código que tengo que poner en cada una de las páginas.

Pero les tengo una mala noticia **esto no funciona** 😏. El problema es que Nextjs en este caso nos da un error como el siguiente.

```
Error: Only plain objects, and a few built-ins, can be passed to Client Components from Server Components. Classes or null prototypes are not supported.
```

El problema está que el server action, que en este caso es **createAction**, está recibiendo parámetros que no son valores primarios ni objetos planos. 🤔 Pero eso es raro porque lo único que recibe es un parámetro llamado **data** y que se supone que será un objeto plano que viene del formulario. 

¿Dónde está el error exactamente?

El problema está en la llamada al método `repository.create(data)` que es una instancia de una clase compleja. Cuando Nextjs la compile, la debe recibir como parámetro pero esto no es posible y falla.

Next hace un wrapper de las funciones marcadas como **use server** y las saca de su contexto. Es por eso que todo lo que usemos, que esté declarado fuera de la función, lo debe recibir en tiempo de ejecución como parámetro.

## Solucionando el error

Debemos lograr que todos los parámetros que reciba la función sean valores primarios. Hay que buscar la forma de identificar este repositorio por un string y evitar pasar la instancia en cuestión.

Primero sería implementar un diccionario donde pueda identificar cada repositorio basado en un string. Para esto se creó un fichero de código como el siguiente.

```
import { Post } from "../prisma/generated/models";
import { postRepository } from "./post/repository";

export default {
  [Post.name]: postRepository
}
```

Se utiliza el nombre de la clase Post para obtener su repositorio. Quizás en un futuro esto amerite implementar un sistema de inyección de dependencias pero por ahora lo vamos a dejar lo más simple posible 🤓.

Segundo, en la página en vez de pasar el repositorio, pasaremos el identificador, quedando de la siguiente forma.

```
export default async function Page() {
  const { createAction } = crud(Post.name, '/post')
  return <Form action={createAction} defaultValues={defaultValues} />
}
```

Tercero modificamos el helper crud

```
import repositories from "@repo/model/entities/index"

export async function crud(repositoryName: string, path: string) {
  const createAction = async (data: any) => {
    'use server'
    const repository = repositories[repositoryName] as BaseRepository
    repository.create(data)
    revalidatePath(path)
  }

  return {
    createAction,
  };
}
```

Ya con esto solucionamos el problema, nuestra server action solo recibe objetos planos o variables de tipo primarios.

# Conclusión

En el desarrollo de software uno debe combinar todas las técnicas posible y que solucionen cada problema. Una clase repositorio es más adecuada que implementar funciones independientes, por lo tanto la POO es una técnica válida en este caso.