#!/usr/bin/env node

const ph = require('pols-helper');
const fs = require('fs');

/* Acción a ejecutar */
if (typeof process.argv[2] === 'undefined') ph.showError("Debe especificar la tarea a realizar.");
var command = process.argv[2].toLowerCase();

/* Lista de comandos */
let commands = [
	['create', 'Crea los archivos code.js, style.scss y template.html con información básica para la definición del Custom Element.'],
	['compile', 'Compila los archivos code.js, style.scss y template.html en un único archivo de tipo JavaScript con la definición del Custom Element.'],
];

if (!ph.inCommands(command, commands)) {
	ph.showError(`Comando ${command} no reconocido.`, false);
	ph.showCommands('Comandos permitidos', );
}

const functions = require('../index.js');

switch (command) {
	case 'compile':
		var destination = process.argv[3];
		if (destination && !fs.existsSync(destination)) ph.showError("No existe el directorio de destino '" + destination + "'");
		functions.compile(destination);
		break;
	case 'create':
		/* Nombre del componente / Ruta de Salida */
		if (typeof process.argv[3] === 'undefined') ph.terminado('Debe especificarse el nombre del componente.');
		functions.create(process.argv[3].toLowerCase());
		break;
}