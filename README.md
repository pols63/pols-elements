# pols-elements

Permite crear custom elements en función a plantillas HTML, JS y CSS. Las plantillas posteriormente se transpilan a un fichero de JavaScript.

## Instalación

```
npm i -g pols-elements
```

## Creación de plantillas

Ejecutar el comando

```
$ pols-elements create my-custom-element
```

Con ello se creará una carpeta con cuatro archivo en su interior:

- **template.html:** Estructura HTML del elemento. La etiqueta SLOT es la que contiene a los elementos hijos del elemento que se está desarrollando.
- **code.js:** Objeto exportable que define el comportamiento del elemento. En este archivo se programa el funcionamiento del componente, se definen los eventos de los elementos definidos en el archivo template.html. Se programan los atributos, propiedades y métodos del elemento.
- **styles.scss:** Se define el estilo visual del componente y de los elementos definidos en el template.html.
- **doc.js:** Utilizado para crear el archivo documentation.html. En este archivo se puede documentar todos los aspectos del componente en desarrollo.

## Compilación y distribución

Desde la ruta del componente creado, ejecutar:

```
$ pols-elements compile
```

Con ello, se creará la carpeta dist que contendrá:

* **my-custom-element.js:** Archivo JavaScript que debe ser importado en el HTML y que contiene toda la lógica del componente.
* **my-custom-element.min.js:** Archivo minificado.
* **documentacion.html:** Documentación del componente. Ahí se puede visualizar el componente creado y hacer pruebas sobre él. Utilice las herramientas de desarrollo, existe ya una variable de nombre polsElement que hace referencia al componente creado.