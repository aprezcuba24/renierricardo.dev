---
layout: ../../layouts/MarkdownPostLayout.astro
title: "Nestjs - Jest"
pubDate: "Sun Jun 15 2024"
image: "https://live.staticflickr.com/65535/53793198101_685bffdd23_z.jpg"
username: "aprezcuba24"
categories: ["tutorial"]
description: "Configuración y uso de la librería “@dfl-e/testing” que utilizo para las pruebas en la empresa donde trabajo. La librería está muy acoplada a las condiciones de la empresa pero podría servir como material de consulta."
---

Primero que todo aclarar que este artículo es para explicar cómo hago las pruebas automáticas con **Jest** en la empresa donde trabajo. Tiene lógica muy particular de la empresa que no podría ser extrapolada directamente a otros entornos. De todas maneras puede ser leída como material de referencia.

El artículo solo se enfoca en presentar la librería que se utiliza y cómo se configura. En otros artículos se debería explicar la filosofía para hacer pruebas automáticas y qué sería importante probar y qué no.

Los proyecto en la empresa se hacen con las siguientes tecnologías.

- Nestjs: como framework del backend.
- Mongodb: como gestor de base de datos.
- Jest: Como motor de pruebas automáticas.

# Caso de estudio

Para facilitar la explicación nos guiaremos por un caso de estudio, donde tendremos una entidad con el nombre **Category** y que tiene dos campos:

- name: Un campo de texto
- description: Un campo de texto

# Dependencias

Para que sea fácil la implementación de las pruebas se creó la librería `@dfl-e/testing`. Que exporta la función `createTestRunner`. Esta función internamente crea un objecto que tiene un conjunto de funciones, **helpers**, para facilitar el proceso de prueba. A este objeto se le llama **runner**.

Para configurar el `runner` se le debe pasar los siguientes parámetros.

## appModule
La clase `AppModule` global del proyecto. Generalmente está en el fichero `src/app.module.ts`. Con esta clase se crea la aplicación de pruebas usando la librería **@nestjs/testing**. Pasar el `AppModule` global nos permite ejecutar operaciones sobre todo el sistema y ver la integración de todas las partes.

## options
Es un diccionario de configuración con las siguientes opciones, todas son opcionales.

**configApp**: Es una función que va a recibir un objecto de tipo `INestApplication` y luego lo devuelve. El objetivo es que dentro de la función, se pueda configurar lo mismo que se hace en el fichero `main.ts`, de forma tal que las pruebas se comporten lo más parecido a la aplicación real. Por ahora lo único necesario es configurar la validación

**user**: Se pasa un diccionario con los valores para crear el usuario que se utilizará en las pruebas. Algo típico en este caso es configura los permisos que debe tener para poder acceder al sistema en cada caso.

**space**: Diccionario con los datos para crear el space. Por defecto se creará un space muy básico pero usando esta opción se le puede pasar opciones, por ejemplo si debe ser un space público o root space o queremos asignarle un id específico, etc.

# Helpers

 **clearModelsAndCloseApp**
 
 Esta función se debe llamar en el método **afterAll** al finalizar una batería de pruebas. El objetivo borrar todas entidades que se crearon durante el proceso y dejar la base de datos limpia para las próximas. Con esto logramos que cada prueba se ejecute sobre un entorno conocido, una base datos limpia.

Internamente también se borra la entidad **space** que se registró en la base de datos al crear el **runner**.

**getModel**

Es una función que se le pasa el nombre de una modelo y te devuelve la instancia de mongoose. Con esta instancia , por ejemplo, se podría hacer consultas a la base de datos.

**factory**

Este es uno de los métodos más útiles de la librería. Nos permite crear y registrar un entidades en nuestra base de datos.

En base nuestro ejemplo se podría hacer lo siguiente para registrar una entidad categoría en la base de datos.

```
const category = await runner.factory('Category', {
   name: 'name',
   description: ‘Description’,
});
```

El objeto devuelvo será una entidad registrada en la base de datos con su **id**.

**findOne**

Helper que nos permite obtener una entidad de la base de datos, dado el nombre de la clase y una consulta. Ejemplo, obtener la categoría que tiene como nombre `category 1`.

```
const category = await runner.findOne(
  Category.name,
  { name: ‘category 1’ }
)
```

## Helpers para request http.

Estos helpers devuelven un objeto de tipo **request** de la librería **supertest**. Buscar la documentación de la librería para saber todo lo que se puede hacer con ella.

**geRequest**

Devuelve un objecto request de tipo **supertest** para hacer peticiones a nuestro sistema. Normalmente no se usa. Se utiliza los helpers más directos que están a continuación.

**get**

Función que nos permite hacer peticiones tipo **GET**. Ejemplo obtener una categoría dado su id sería.

```
runner.get(‘/category/1’)
```

**del**

Permite hacer peticiones de tipo **DELETE**. Ejemplo, borrar una entidad categoría dado su id.

```
runner.del(‘/category/1’)
```

**post**

Permite hacer peticiones de tipo **POST**. Ejemplo, hacer una petición para crear una entidad. Además de la url hay que pasar los datos de la nueva entidad.

```
runner.post(‘/category’, {
  name: ‘category 1’,
  description: ‘description 1’
})
```

**patch**

Permite hacer una petición de tipo **PATCH**. Ejemplo, hacer una petición para modificar una categoría dado su id.

```
runner.patch(‘/category/1’, {
  name: ‘category 1’,
  description: ‘description 1’
})
```

## Propiedades

Además de los helpers anteriores, el **runner** también tiene dos propiedades importantes.

**app**

Objeto que representa la aplicación, la misma que fue configurada con la función **configApp**

**space**

Entidad del space con el que se está trabajando en la prueba.

# Configurar las pruebas en nuestras aplicaciones nestjs

1- Instalar la dependencia en nuestro proyecto

```
yarn add -D @dfl-e/testing
```

2- Crear el fichero `config-app.ts` con la función para configurar la aplicación de prueba y la aplicación normal. Utilizar este mismo código garantiza que en los dos entornos tengan la misma configuración.

```
import { CommonHttpExceptionFilter } from '@dfl-nest/common';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';

export const configApp = (app: INestApplication) => {
  // TODO: Add all global configuration here.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  const configService = app.get(ConfigService);
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new CommonHttpExceptionFilter(httpAdapter, configService),
  );
  return app;
};
```

3- Usar la función de configuración en `src/main.ts`.

Básicamente es no configurar dentro del fichero `main.ts` las validaciones, sino llamar a la función `configApp`. Y esto es tan simple como hacer lo siguiente.

```
configApp(app);
```

4- Crear el fichero `src/base-test.ts`, que nos permite crear el **runner** de nuestras pruebas. Le ponemos el siguiente código.

```
import {
  createTestRunner as baseCreateTestRunner,
  Options,
} from '@dfl-e/testing';
import { AppModule } from '../src/app.module';
import { configApp } from './config-app';

export const createTestRunner = (options?: Options) => {
  return baseCreateTestRunner(AppModule, {
    ...options,
    ...{
      configApp: (app) => configApp(app),
    },
  });
};
```

A partir de aquí cada vez que necesitemos un **runner** en nuestras pruebas utilizamos la función **createTestRunner**.

5- Configurar las variables de entorno para el entorno de prueba.

Creamos el fichero `.env.test` donde solo cambiamos la variable de conexión a la base de datos.

```
APP_MONGODB_URL="mongodb://localhost:27017/app-testing?authSource=admin&retryWrites=false"
```

En la configuración de **AppModule** se define qué variables usar en base al entorno.

```
ConfigModule.forRoot({
  load: [EnvConfiguration],
  envFilePath:
    process.env.NODE_ENV === 'test' ? ['.env.test', '.env'] : '.env',
  validationSchema: JoiValidationSchema,
  isGlobal: true,
}),
```

6- Finalmente configuramos el comando para correr las pruebas en nuestro `package.json`.

```
"test": "jest -i",
```

Lo que le decimos a **jest** es que las pruebas las debe correr de forma iterativa. Esto es necesario debido a que las pruebas hacen uso de las base de datos y si las pruebas fueran concurrentes tendríamos efectos no deseados.

# Pruebas del CRUD

```
import { CreateTestRunnerReturn } from '@dfl-e/testing';
import { Category } from './entities';
import { createTestRunner } from '../../../src/base-test';

describe('CategoryController', () => {
  let runner: CreateTestRunnerReturn;

  beforeAll(async () => {
    // Creo el runner con los permisos necesesarios
    // para poder ejecutar las acciones.
    runner = await createTestRunner({
      user: {
        permissions: ['CATEGORY:VIEW', 'CATEGORY:WRITE'],
      },
    });
  });

  afterAll(() => {
    // En el afterAll borro de la bd todas las categorías
    return runner.clearModelsAndCloseApp(Category.name);
  });

  it('/POST', () => {
    return runner
      .post('/categories', {
        name: 'first',
        description: 'description',
      })
      // Si la respuesta es 201 es que la entidad se registró en la bd
      .expect(201);
  });

  it('/Search', () => {
    // Verificar que el método search retorna la entidad ya registrada
    return runner
      .post('/categories/search')
      .expect(200)
      .then((res) => res.body)
      .then((res) => {
        expect(res.data[0].name).toBe('first');
      });
  });

  it('/GetOne', async () => {
    // Para probar el get me hace falta el id de la categoría registrada.
    // Hago un findOne para obtenerla dado su nombre.
    const entity = await runner.findOne(Category.name, { name: 'first' });
    return runner
      .get(`/categories/${entity._id.toString()}`)
      .expect(200)
      .then((res) => res.body)
      .then((res) => {
        expect(res.name).toBe('first');
      });
  });

  it('/update', async () => {
    const entity = await runner.findOne(Category.name, { name: 'first' });
    return runner
      .patch(`/categories/${entity._id.toString()}`, {
        name: 'fieldUpdated',
      })
      .expect(200)
      .then((res) => res.body)
      .then((res) => {
        expect(res.name).toBe('fieldUpdated');
      });
  });

  it('/remove', async () => {
    const entity = await runner.findOne(Category.name, {
      name: 'fieldUpdated',
    });
    return runner.del(`/categories/${entity._id.toString()}`).expect(200);
  });

  it('/Search Empty', () => {
    // Después de borrada la entidad el search debe devolver un array vacío.
    return runner
      .post('/categories/search')
      .expect(200)
      .then((res) => res.body)
      .then((res) => {
        expect(res.data.length).toBe(0);
      });
  });
});
```

# Conclusión

El artículo solo hace la presentación de la librería y no responde muchas preguntas que sería bueno aclarar, por ejemplo.

- No hace referencia al por qué se debería hacer pruebas en nuestros sistemas.
- Qué se debería probar y qué no.
- Qué metodología utilizo para hacer las pruebas.
- Por qué se mejor implementar pruebas automáticas que simplemente usar postman.

Espero que este sea solo el primer artículo de varios, donde iré aclarado algunos de estos temas.