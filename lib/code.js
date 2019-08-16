module.exports = {
	/* Nombre de la etiqueta HTML */
	tagName: '@COMPONENT_NAME',
	/* Indica si se utilizará archivo de plantilla: template.html */
	template: true,
	/* Indica si se utilizará archivo de estilos: styles.scss */
	styles: true,
	/* Constructor */
	constructor: function () {

	},
	/* Callback que es llamado luego de montado en elemento en el DOM. */
	connectedCallback: function () {

	},
	/* Callback que es llamado luego que el elemento es eliminado del DOM. */
	disconnectedCallback: function() {

	},
	/* Eventos para los cambios de los atributos de la etiqueta */
	attributes: {
		'attr-example'(oldValue, newValue) {

		}
	},
	/* Propiedades. Las funciones "get" deben devolver el valor de la propiedad y las funciones "set" asignar dicho valor. */
	properties: {
		example: {
			get() { },
			set(value) { }
		}
	},
	/* Eventos. Arreglo opcional útil sólo para la generación de la documentación. */
	events: ['example'],
	/* Métodos */
	methods: {
		example() {

		}
	}
};