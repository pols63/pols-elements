#!/usr/bin/env node

const helper = require('../lib/helper.js');
const fs = require('fs');

/* Acción a aejecutar */
if (typeof process.argv[2] === 'undefined') helper.showError("Debe especificar la tarea a realizar.", true);
var action = process.argv[2].toLowerCase();
if (['compile', 'create'].indexOf(action) === -1) helper.showError("Comando no reconocido: " + action, true);

const tools = require('../lib/tools.js');

switch (action) {
	case 'compile':
		tools.polsIcons.compile();
		break;
	case 'create':
		/* Nombre del componente / Ruta de Salida */
		if (typeof process.argv[3] === 'undefined') helper.terminado('Debe especificarse el nombre de la fuente.');
		tools.polsIcons.create(process.argv[3].toLowerCase());
		break;
}