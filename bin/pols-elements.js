#!/usr/bin/env node

const Helper = require('../lib/helper.js');
const Fs = require('fs');

/* Acción a aejecutar */
if (typeof process.argv[2] === 'undefined') Helper.showError("Debe especificar la tarea a realizar.", true);
var action = process.argv[2].toLowerCase();
if (['compile', 'create'].indexOf(action) === -1) Helper.showError("Comando no reconocido: " + action, true);

const Tools = require('../lib/tools.js');

switch (action) {
	case 'compile':
		var destination = process.argv[3];
		if (destination && !Fs.existsSync(destination)) Helper.showError("No existe el directorio de destino '" + destination + "'");
		Tools.polsElements.compile(destination);
		break;
	case 'create':
		/* Nombre del componente / Ruta de Salida */
		if (typeof process.argv[3] === 'undefined') Helper.terminado('Debe especificarse el nombre del componente.');
		Tools.polsElements.create(process.argv[3].toLowerCase());
		break;
}