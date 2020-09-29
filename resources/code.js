module.exports = {
	/* Nombre de la etiqueta HTML */
	tagName: '@COMPONENT_NAME',

	/* Indica si se utilizará archivo de plantilla: template.html */
	template: 'template.html',

	/* Indica si se utilizará archivo de estilos: styles.scss */
	styles: 'styles.scss',

	/* Indica si los hijos delegan en enfoque al host */
	delegatesFocus: true,

	/* Indica el modo del 'shadowRoot'. Especifique el valor booleano 'false' si no se quiere usar */
	shadow: 'open',

	/* Constructor */
	constructor: function () {

	},

	/* Callback que es llamado luego de montado en elemento en el DOM. */
	connectedCallback: function () { },

	/* Callback que es llamado luego que el elemento es eliminado del DOM. */
	disconnectedCallback: function () { },

	/* Eventos para los cambios de los atributos de la etiqueta */
	attributes: {
		'attr-example'(oldValue, newValue) { }
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