#!/usr/bin/env node

const helper = require('helper.js');
const Fs = require('fs');

/* Acción a ejecutar */
if (typeof process.argv[2] === 'undefined') helper.showError("Debe especificar la tarea a realizar.");
var command = process.argv[2].toLowerCase();

/* Lista de comandos */
let commands = [
	['create', 'Crea los archivos code.js, style.scss y template.html con información básica para la definición del Custom Element.'],
	['compile', 'Compila los archivos code.js, style.scss y template.html en un único archivo de tipo JavaScript con la definición del Custom Element.'],
];

if (!helper.inCommands(command, commands)) {
	helper.showError(`Comando ${command} no reconocido.`, false);
	helper.showCommands('Comandos permitidos', );
}

const process = require('../index.js');

switch (command) {
	case 'compile':
		var destination = process.argv[3];
		if (destination && !Fs.existsSync(destination)) helper.showError("No existe el directorio de destino '" + destination + "'");
		process.polsElements.compile(destination);
		break;
	case 'create':
		/* Nombre del componente / Ruta de Salida */
		if (typeof process.argv[3] === 'undefined') helper.terminado('Debe especificarse el nombre del componente.');
		process.polsElements.create(process.argv[3].toLowerCase());
		break;
}