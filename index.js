const ph = require('pols-helper');
const fs = require('fs');
const path = require('path');
const minify = require('minify');

module.exports = {
	compile: function (destination) {
		/* Obtiene la ubicación de la carpeta donde se hizo el llamado del proceso. */
		var directorySrc = path.resolve(process.cwd());

		/* Nombre de los archivos */
		const fileCode = path.resolve(directorySrc, 'code.js');
		const fileTemplate = path.resolve(directorySrc, 'template.html');
		const fileStyles = path.resolve(directorySrc, 'styles.scss');
		const fileDoc = path.resolve(directorySrc, 'doc.js');
		const fileExport = path.resolve(__dirname, 'resources', 'element.txt');
		const fileDocumentation = path.resolve(__dirname, 'resources', 'documentation.html');

		/* Valida que exista el archivo code.js */
		if (!fs.existsSync(fileCode)) ph.showError("No existe el archivo de definición del componente '" + fileCode + "'.");

		//Carga el archivo de configuración. Require hace la transformación a un objeto JSON.
		var contentCode = require(fileCode);
		(contentCode.tagName) || ph.showError("No se ha definido el nombre de la etiqueta. Debe ser establecido en la propiedad 'tagName' en el archivo 'code.js'.");
		var componentName = contentCode.tagName;

		/* Valida el nombre de la etiqueta */
		(componentName.indexOf('-') > 0) || ph.showError("La propiedad 'tagName' debe llegar un guión luego de la primera letra.");

		/* Obtiene el nombre de la clase */
		var className = componentName.strongReplace('-', ' ').capitalize().strongReplace(' ', '');

		/* HTML */
		var contentTemplate = '';
		if (contentCode.template) {
			if (!fs.existsSync(fileTemplate)) ph.showError("No existe el archivo de plantilla '" + fileTemplate + "'");
			contentTemplate = fs.readFileSync(fileTemplate, { encoding: 'utf8' });
			/* Elimina los comentarios. */
			contentTemplate = contentTemplate.replace(/<!--.*-->/g, '');
		}

		/* CSS */
		var contentStyles = '';
		if (contentCode.styles) {
			if (!fs.existsSync(fileStyles)) ph.showError("Se ha indicado 'true' en la propiedad 'style' del archivo 'code.js' pero no existe el archivo de estilos '" + fileStyles + "'");
			var Sass = require('sass');
			contentStyles = '<style>' + Sass.renderSync({
				/* Se pasa el nombre del archivo para que funcione la sentencia import en el código */
				file: fileStyles,
				data: fs.readFileSync(fileStyles, { encoding: 'utf8' }).replace(/\/\*.*\*\//g, ''),
				//outputStyle: "compressed",
			}).css + '</style>';
		}

		//Se obtiene una cadena con la definición del arreglo de propiedades.
		var propertyEvents = '';
		if (typeof contentCode.properties !== 'undefined') {
			var propertyNames = Object.getOwnPropertyNames(contentCode.properties);
			var getString = '';
			var setString = '';
			propertyNames.forEach(function (value, index, array) {
				if (typeof contentCode.properties[value] === 'object') {
					//Convierte la función en una cadena que lo define.
					if (typeof contentCode.properties[value].get === 'function') {
						getString = `get ${value}() {\n\t\treturn (${contentCode.properties[value].get.toString().replace(/^\w+\s*\(/, 'function(').replace(/\t\t\t/g, "\t\t")}`
							+ `).call(this);\n\t}\n`;
					}
					if (typeof contentCode.properties[value].set === 'function') {
						setString = `set ${value}(value) {\n\t\t(${contentCode.properties[value].set.toString().replace(/^\w+\s*\(/, 'function(').replace(/\t\t\t/g, "\t\t")}`
							+ `).call(this, value);\n\t}\n`;
					}
					propertyEvents += "\n\t" + getString + "\n\t" + setString;
				}
			});
		}

		var temp = [];

		//Se obtiene la cadena de atributos.
		var attributesString = '';
		var attributeChangedCallbackString = '';
		if (typeof contentCode.attributes !== 'undefined') {
			var attributeNames = Object.getOwnPropertyNames(contentCode.attributes);
			attributesString = "'" + attributeNames.join("','") + "'";

			var functionString = '';
			temp = [];
			attributeNames.forEach(function (value, index, array) {
				if (typeof contentCode.attributes[value] === 'function') {
					functionString = contentCode.attributes[value].toString().replace(/^['"]?[a-zA-z\-]+['"]?\s*\(/, 'function(');
					temp.push(`case '` + value + `': (${functionString.replace(/\n/g, "\n\t")}.call(this, oldValue, newValue));\n\t\t\tbreak;`);
				}
			});
			attributeChangedCallbackString = temp.join("\n\t\t");
		}

		//Se obtiene una cadena con la definición de los métodos.
		var methodsString = '';
		if (typeof contentCode.methods !== 'undefined') {
			var methodNames = Object.getOwnPropertyNames(contentCode.methods);
			temp = [];
			methodNames.forEach(function (value, index, array) {
				if (typeof contentCode.methods[value] === 'function') {
					temp.push(contentCode.methods[value].toString().replace(/^\w+\s*\(/, value + '(').replace(/\n\t/g, "\n") + "\n");
				}
			});
			methodsString = temp.join("\n\t");
		}

		var fileContent2 = fs.readFileSync(fileExport, { encoding: 'utf8' });
		/* Nombre de la clase */
		fileContent2 = fileContent2.strongReplace('@CLASS_NAME', className);
		/* Estilos */
		fileContent2 = fileContent2.strongReplace('@CONTENT_STYLES', contentStyles !== '' ? ("\n\t\t\t" + contentStyles.replace(/\n/g, "\n\t\t\t")) : '');
		/* Template */
		fileContent2 = fileContent2.strongReplace('@CONTENT_TEMPLATE', contentTemplate !== '' ? ("\n\t\t\t" + contentTemplate.replace(/\n/g, "\n\t\t\t")) : '');
		/* Constructor */
		fileContent2 = fileContent2.strongReplace('@CONSTRUCTOR_CODE', (
			contentCode.constructor && typeof contentCode.constructor === 'function') ?
			"\n\t\t" + ('(' + contentCode.constructor.toString() + ').call(this);').replace(/\n/g, "\n\t") : ''
		);
		/* Connected callback */
		fileContent2 = fileContent2.strongReplace('@CONNECTED_CALLBACK_CODE',
			(contentCode.connectedCallback && typeof contentCode.connectedCallback === 'function') ?
				"\n\t\t(" + contentCode.connectedCallback.toString() + ").call(this);\n\t" : ''
		);
		/* Disconnected callback */
		fileContent2 = fileContent2.strongReplace('@DISCONNECTED_CALLBACK_CODE',
			(contentCode.disconnectedCallback && typeof contentCode.disconnectedCallback === 'function') ?
				"\n\t\t(" + contentCode.disconnectedCallback.toString() + ").call(this);\n\t" : ''
		);
		/* Property Events */
		fileContent2 = fileContent2.strongReplace('@PROPERTY_EVENTS', propertyEvents ? propertyEvents : '');
		/* Attribute change callback */
		fileContent2 = fileContent2.strongReplace('@OBSERVED', attributesString);
		fileContent2 = fileContent2.strongReplace('@ATTRIBUTE_CHANGE_CALLBACK', attributeChangedCallbackString ?
			`\n\t\tswitch (attribute) {\n\t\t\t${attributeChangedCallbackString.replace(/\n/g, "\n\t")}\n\t\t}\n\t` : ''
		);
		/* Métodos */
		fileContent2 = fileContent2.strongReplace('@METHODS', methodsString ? `\n\t${methodsString}` : '');
		/* Nombre del componente */
		fileContent2 = fileContent2.strongReplace('@COMPONENT_NAME', componentName);

		/* Crea la carpeta donde se alojarán los archivos compilados, esta carpeta estará dentro de la carpeta de código del elemento. */
		var distributionDir = path.resolve(directorySrc, 'dist');
		if (!fs.existsSync(distributionDir)) {
			fs.mkdirSync(distributionDir);
			ph.showMessage("Directorio '" + distributionDir + "' creado.");
		}

		/* Crea el archivo compilado. */
		var outputFile2 = path.resolve(distributionDir, componentName + '.js');
		fs.writeFileSync(outputFile2, fileContent2, { encoding: 'utf8' });
		ph.showMessage("Archivo '" + outputFile2 + "' creado.");
		if (destination) {
			outputFile2 = path.resolve(destination, componentName + '.js');
			fs.writeFileSync(outputFile2, fileContent2, { encoding: 'utf8' });
			ph.showMessage("Archivo '" + outputFile2 + "' creado.");
		}

		/* Crea el archivo compilado minificado. */
		minify(outputFile2).then(function (text) {
			outputFile2 = path.resolve(distributionDir, componentName + '.min.js');
			fs.writeFileSync(outputFile2, text, { encoding: 'utf8' });
			ph.showMessage("Archivo '" + outputFile2 + "' creado.");
			if (destination) {
				outputFile2 = path.resolve(destination, componentName + '.min.js');
				fs.writeFileSync(outputFile2, text, { encoding: 'utf8' });
				ph.showMessage("Archivo '" + outputFile2 + "' creado.");
			}
		});

		/* Crea el archivo de documentación */
		if (fs.existsSync(fileDoc)) {
			let info = require(fileDoc);
			outputFile2 = path.resolve(distributionDir, 'documentation.html');
			/* Lee el archivo de plantilla de documentación y coloca el nombre del componente. */
			let content = fs.readFileSync(fileDocumentation, { encoding: 'utf8' }).replace(/@COMPONENT_NAME/g, componentName);
			if (info.descriptions) {
				/* Zona de la etiqueta */
				content = content.replace(/@COMPONENT_TEMPLATE/g, info.template ? info.template : `<${componentName}></${componentName}>`);
				if (info.principal) content = content.replace(/@PRINCIPAL/g, info.principal.replace(/\n/g, '').replace(/\t/g, ''));
			}
			/* Cadena para colocar los atributos en la zona de la sintáxis. */
			let attributesSintax = [];
			let attributesDefinitions = [];
			for (let propertyName in contentCode.attributes) {
				attributesSintax.push(`<span class="text-blue">${propertyName}</span>="<span contenteditable=\"true\" data-attribute-name=\"${propertyName}\"></span>"`);
				let definition = '(Sin definición)';
				let type;
				for (let i in info.descriptions) {
					if (isNaN(Number(i))) continue;
					if (info.descriptions[i].attribute === propertyName) {
						definition = info.descriptions[i].text;
						type = info.descriptions[i].type;
						break;
					}
				}
				attributesDefinitions.push(`<h4>${propertyName}${type ? ` <code>${type}</code>` : ''}</h4><div class="definition">${definition}</div>`);
			}
			content = content.replace(/@ATTRIBUTES_SINTAX/g, attributesSintax.length > 0 ? (' ' + attributesSintax.join(' ')) : '');
			content = content.replace(/@ATTRIBUTES_DEFINITIONS/g, attributesDefinitions.length > 0 ? (' ' + attributesDefinitions.join(' ')) : 'No se han definido para este elemento.');
			/* Definición de las propiedades. */
			let propertiesDefinitions = [];
			if (typeof contentCode.properties === 'object') {
				for (let propertyName in contentCode.properties) {
					let definition = '(Sin definición)';
					let type;
					for (let i in info.descriptions) {
						if (isNaN(Number(i))) continue;
						if (info.descriptions[i].property === propertyName) {
							definition = info.descriptions[i].text;
							type = info.descriptions[i].type;
							break;
						}
					}
					propertiesDefinitions.push(`<h4>${propertyName}${type ? ` <code>${type}</code>` : ''}</h4><div class="definition">${definition}</div>`);
				}
			}
			content = content.replace(/@PROPERTIES_DEFINITIONS/g, propertiesDefinitions.length > 0 ? (' ' + propertiesDefinitions.join(' ')) : 'No se han definido para este elemento.');
			/* Definición de los métodos. */
			let methodsDefinitions = [];
			if (typeof contentCode.methods === 'object' && contentCode.methods) {
				for (let i0 in contentCode.methods) {
					let definition = '(Sin definición)';
					let type;
					for (let i in info.descriptions) {
						if (isNaN(Number(i))) continue;
						if (info.descriptions[i].method === i0) {
							definition = info.descriptions[i].text;
							type = info.descriptions[i].type;
							break;
						}
					}
					methodsDefinitions.push(`<h4>${i0}${type ? ` <code>${type}</code>` : ''}</h4><div class="definition">${definition}</div>`);
				}
			}
			content = content.replace(/@METHODS_DEFINITIONS/g, methodsDefinitions.length > 0 ? (' ' + methodsDefinitions.join(' ')) : 'No se han definido para este elemento.');
			// content = content.replace(/@EVENTS/g, (contentCode.events && contentCode.events.length) ? `'${contentCode.events.join("','")}'` : '');
			/* Definición de los eventos. */
			let eventsDefinitions = [];
			if (typeof contentCode.events === 'object' && contentCode.events.length) {
				for (let i0 = 0; i0 < contentCode.events.length; i0++) {
					let definition = '(Sin definición)';
					for (let i in info.descriptions) {
						if (isNaN(Number(i))) continue;
						if (info.descriptions[i].event === contentCode.events[i0]) {
							definition = info.descriptions[i].text;
							// eventsDefinitions.push(`<h4>${contentCode.events[i0]}</h4><div class="definition">${info.descriptions[i].text ? info.descriptions[i].text : '(Sin definición)'}</div>`);
							break;
						}
					}
					eventsDefinitions.push(`<h4>${contentCode.events[i0]}</h4><div class="definition">${definition}</div>`);
				}
			}
			content = content.replace(/@EVENTS_DEFINITIONS/g, eventsDefinitions.length > 0 ? (' ' + eventsDefinitions.join(' ')) : 'No se han definido para este elemento.');
			content = content.replace(/@EVENTS/g, (contentCode.events && contentCode.events.length) ? `'${contentCode.events.join("','")}'` : '');
			/* Agrega los archivos de scripts */
			if (typeof info.prevScriptFiles === 'object' && info.prevScriptFiles.constructor.name === 'Array' && info.prevScriptFiles.length > 0) {
				info.prevScriptFiles.forEach(function (element, index) {
					info.prevScriptFiles[index] = `<script src="${element}"></script>`;
				});
				content = content.replace(/@PREV_SCRIPTS/g, info.prevScriptFiles.join(''));
			} else {
				content = content.replace(/@PREV_SCRIPTS/g, '');
			}
			if (typeof info.postScriptFiles === 'object' && info.postScriptFiles.constructor.name === 'Array' && info.postScriptFiles.length > 0) {
				info.postScriptFiles.forEach(function (element, index) {
					info.postScriptFiles[index] = `<script src="${element}"></script>`;
				});
				content = content.replace(/@POST_SCRIPTS/g, info.postScriptFiles.join(''));
			} else {
				content = content.replace(/@POST_SCRIPTS/g, '');
			}
			/* Agrega los archivos de styles */
			if (typeof info.styleFiles === 'object' && info.styleFiles.constructor.name === 'Array' && info.styleFiles.length > 0) {
				info.styleFiles.forEach(function (element, index) {
					info.styleFiles[index] = `<link href="${element}" rel="stylesheet">`;
				});
				content = content.replace(/@STYLES/g, info.styleFiles.join(''));
			} else {
				content = content.replace(/@STYLES/g, '');
			}
			/* Escritura del archivo */
			fs.writeFileSync(outputFile2, content, { encoding: 'utf8' });
			ph.showMessage("Archivo '" + outputFile2 + "' creado.");
		}
	},
	create: function (componentName) {
		/* Directorio pricipal */
		var directory = path.resolve(process.cwd());
		/* Archivo de código */
		var fileCode = path.resolve(directory, 'code.js');
		if (!fs.existsSync(fileCode)) {
			fs.writeFileSync(fileCode, fs.readFileSync('./resources/code.js', { encoding: 'utf8' }).replace('@COMPONENT_NAME', componentName), { encoding: 'utf8' });
			ph.showMessage("Archivo '" + fileCode + "' creado.");
		} else {
			ph.showMessage("El archivo '" + fileCode + "' ya existe y no se ha creado uno nuevo.");
		}
		/* Archivo de plantilla */
		var fileTemplate = path.resolve(directory, 'template.html');
		if (!fs.existsSync(fileTemplate)) {
			fs.writeFileSync(fileTemplate, fs.readFileSync('./resources/template.html', { encoding: 'utf8' }), { encoding: 'utf8' });
			ph.showMessage("Archivo '" + fileTemplate + "' creado.");
		} else {
			ph.showMessage("El archivo '" + fileTemplate + "' ya existe y no se ha creado uno nuevo.");
		}
		/* Archivo de estilos */
		var fileStyles = path.resolve(directory, 'styles.scss');
		if (!fs.existsSync(fileStyles)) {
			fs.writeFileSync(fileStyles, fs.readFileSync('./resources/styles.scss', { encoding: 'utf8' }), { encoding: 'utf8' });
			ph.showMessage("Archivo '" + fileStyles + "' creado.");
		} else {
			ph.showMessage("El archivo '" + fileStyles + "' ya existe y no se ha creado uno nuevo.");
		}
		/* Archivo de documentación */
		var fileStyles = path.resolve(directory, 'doc.js');
		if (!fs.existsSync(fileStyles)) {
			fs.writeFileSync(fileStyles, fs.readFileSync('./resources/doc.js', { encoding: 'utf8' }).replace('@template', `<${componentName}></${componentName}>`),
				{ encoding: 'utf8' });
			ph.showMessage("Archivo '" + fileStyles + "' creado.");
		} else {
			ph.showMessage("El archivo '" + fileStyles + "' ya existe y no se ha creado uno nuevo.");
		}
	}
};