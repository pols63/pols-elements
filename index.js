const fs = require('fs')
const path = require('path')
const minify = require('minify')
const sass = require('sass')
require('colors')

const showError = (message, terminate = true) => {
	console.log(` ${message} `.bgRed)
	if (terminate) process.exit()
}

const showMessage = message => console.log(` ${message} `.yellow)

String.prototype.capitalize = function () {
	return this.replace(/(?:^|\s)\S/g, function (a) {
		return a.toUpperCase();
	});
};

module.exports = {
	compile: function (destination) {
		/* Obtiene la ubicación de la carpeta donde se hizo el llamado del proceso. */
		const directorySrc = path.resolve(process.cwd())

		/* Nombre de los archivos */
		const filesSrc = {
			code: path.resolve(directorySrc, 'code.js'),
			doc: path.resolve(directorySrc, 'doc.js'),
			export: path.resolve(__dirname, 'resources', 'element.txt'),
			documentation: path.resolve(__dirname, 'resources', 'documentation.html'),
		}

		/* Define el objeto que contendrá información a exportar */
		const contentExport = {}

		/* Valida que exista el archivo code.js */
		if (!fs.existsSync(filesSrc.code)) showError(`No existe el archivo de definición del componente '${filesSrc.code}'.`)

		/* Carga el archivo de configuración */
		const contentCode = require(filesSrc.code)
		if (typeof contentCode.tagName !== 'string') showError(`La propiedad 'tagName' en el archivo '${filesSrc.code}' debe ser de tipo 'string'.`)
		/* Valida el nombre de la etiqueta */
		const tagNameRegExp = /[a-z]+-[a-z]+/
		if (!contentCode.tagName.match(tagNameRegExp)) showError(`La propiedad 'tagName' debe cumplir con el patrón ${tagNameRegExp.toString()}.`)

		/* Obtiene el nombre de la clase */
		contentExport.className = contentCode.tagName.replace(/-/g, ' ').capitalize().replace(/\s/g, '')

		/* Obtiene el nombre de la plantilla */
		if (contentCode.template) {
			if (typeof contentCode.template !== 'string') showError(`La propiedad 'template' del archivo '${filesSrc.code}' debe ser de tipo 'string'.`)
			contentCode.template = contentCode.template.trim()
			if (!contentCode.template) showError(`La propiedad 'template' del archivo '${filesSrc.code}' no debe ser una cadena vacía.`)
			filesSrc.template = path.resolve(directorySrc, contentCode.template)
			if (!fs.existsSync(filesSrc.template)) showError(`No existe el archivo '${filesSrc.template}'.`)
		}

		/* Obtiene el nombre de la hoja de estilos */
		if (contentCode.styles) {
			if (typeof contentCode.styles !== 'string') showError(`La propiedad 'styles' del archivo '${filesSrc.code}' debe ser de tipo 'string'.`)
			contentCode.styles = contentCode.styles.trim()
			if (!contentCode.styles) showError(`La propiedad 'styles' del archivo '${filesSrc.code}' no debe ser una cadena vacía.`)
			filesSrc.styles = path.resolve(directorySrc, contentCode.styles)
			if (!fs.existsSync(filesSrc.styles)) showError(`No existe el archivo '${filesSrc.styles}'.`)
		}

		/* SHADOW */
		switch (contentCode.shadow) {
			case 'open':
			case 'close':
				contentExport.shadow = `\n\t\tconst shadowRoot = this.attachShadow({mode: '${contentCode.shadow}', delegatesFocus: @DELEGATES_FOCUS})\n\t\tshadowRoot.innerHTML = \`@CONTENT_STYLES@CONTENT_TEMPLATE\`;`
				break
		}

		/* HTML */
		if (filesSrc.template) contentExport.template = fs.readFileSync(filesSrc.template, { encoding: 'utf8' }).replace(/<!--.*-->/g, '')

		/* CSS */
		if (filesSrc.styles) {
			const css = {
				normal: sass.renderSync({
					file: filesSrc.styles,
					data: fs.readFileSync(filesSrc.styles, { encoding: 'utf8' }).replace(/\/\*.*\*\//g, ''),
					//outputStyle: "compressed",
				}).css,
				compressed: sass.renderSync({
					file: filesSrc.styles,
					data: fs.readFileSync(filesSrc.styles, { encoding: 'utf8' }).replace(/\/\*.*\*\//g, ''),
					//outputStyle: "compressed",
				}).css
			}
			contentExport.styles = `<style>${css.normal}</style>`
			contentExport.stylesCompressed = `<style>${css.compressed}</style>`
		}

		//Se obtiene una cadena con la definición del arreglo de propiedades.
		if (typeof contentCode.properties === 'object') {
			const propertyEvents = []
			for (const propertyName in contentCode.properties) {
				if (typeof contentCode.properties[propertyName] === 'object') {
					let getString = (typeof contentCode.properties[propertyName].get === 'function') ? `get ${propertyName}() {\n\t\treturn (${contentCode.properties[propertyName].get.toString().replace(/^\w+\s*\(/, 'function(').replace(/\t\t\t/g, "\t\t")}).call(this)\n\t}\n` : ''
					let setString = (typeof contentCode.properties[propertyName].set === 'function') ? `set ${propertyName}(value) {\n\t\t(${contentCode.properties[propertyName].set.toString().replace(/^\w+\s*\(/, 'function(').replace(/\t\t\t/g, "\t\t")}).call(this, value)\n\t}\n` : ''
					propertyEvents.push(`\n\t${getString}\n\t${setString}`)
				}
			}
			contentExport.propertyEvents = propertyEvents.join('')
		}

		/* Se obtiene la cadena de atributos. */
		if (typeof contentCode.attributes === 'object') {
			contentExport.attributes = `'${Object.getOwnPropertyNames(contentCode.attributes).join("','")}'`

			const tempArray = []
			for (const attributeName in contentCode.attributes) {
				if (typeof contentCode.attributes[attributeName] === 'function') {
					const functionString = contentCode.attributes[attributeName].toString().replace(/^['"]?[a-zA-z0-9\-]+['"]?\s*\(/, 'function(')
					tempArray.push(`case '${attributeName}': (${functionString.replace(/\n/g, "\n\t")}.call(this, oldValue, newValue))\n\t\t\tbreak;`)
				}
			}
			contentExport.attributesChangedCallbackString = tempArray.join("\n\t\t")
		}

		/* Se obtiene una cadena con la definición de los métodos. */
		if (typeof contentCode.methods === 'object') {
			var methodNames = Object.getOwnPropertyNames(contentCode.methods)

			const tempArray = []
			for (const methodName in contentCode.methods) {
				if (typeof contentCode.methods[methodName] === 'function') {
					tempArray.push(contentCode.methods[methodName].toString().replace(/^\w+\s*\(/, methodName + '(').replace(/\n\t/g, "\n") + "\n")
				}
			}
			contentExport.methods = tempArray.join("\n\t")
		}

		let contentFileExport = fs
			.readFileSync(filesSrc.export, { encoding: 'utf8' })
			.replace(/@CLASS_NAME/g, contentExport.className)
			.replace(/@SHADOW/g, contentExport.shadow)
			.replace(/@CONTENT_STYLES/, contentExport.styles ? ("\n\t\t\t" + contentExport.styles.replace(/\n/g, "\n\t\t\t")) : '')
			.replace(/@CONTENT_TEMPLATE/, contentExport.template ? ("\n\t\t\t" + contentExport.template.replace(/\n/g, "\n\t\t\t")) : '')
			.replace(/@DELEGATES_FOCUS/, contentCode.delegatesFocus ? 'true' : 'false')
			.replace(/@CONSTRUCTOR_CODE/, (typeof contentCode.constructor === 'function') ? "\n\t\t" + ('(' + contentCode.constructor.toString() + ').call(this)').replace(/\n/g, "\n\t") : '')
			.replace(/@CONNECTED_CALLBACK_CODE/, (typeof contentCode.connectedCallback === 'function') ? "\n\t\t(" + contentCode.connectedCallback.toString().replace(/\n/g, "\n\t") + ").call(this)\n\t" : '')
			.replace(/@DISCONNECTED_CALLBACK_CODE/, (typeof contentCode.disconnectedCallback === 'function') ? "\n\t\t(" + contentCode.disconnectedCallback.toString().replace(/\n/g, "\n\t") + ").call(this)\n\t" : '')
			.replace(/@PROPERTY_EVENTS/, contentExport.propertyEvents || '')
			.replace(/@OBSERVED/, contentExport.attributes)
			.replace(/@ATTRIBUTE_CHANGE_CALLBACK/, contentExport.attributesChangedCallbackString ? `\n\t\tswitch (attribute) {\n\t\t\t${contentExport.attributesChangedCallbackString.replace(/\n/g, "\n\t")}\n\t\t}\n\t` : '')
			.replace(/@METHODS/, contentExport.methods ? `\n\t${contentExport.methods}` : '')
			.replace(/@COMPONENT_NAME/, contentCode.tagName)

		const filesDist = {
			dist: path.resolve(directorySrc, 'dist'),
		}
		filesDist.js = path.resolve(filesDist.dist, `${contentCode.tagName}.js`)
		filesDist.jsMin = path.resolve(filesDist.dist, `${contentCode.tagName}.min.js`)

		/* Crea la carpeta donde se alojarán los archivos compilados, esta carpeta estará dentro de la carpeta de código del elemento. */
		if (!fs.existsSync(filesDist.dist)) {
			fs.mkdirSync(filesDist.dist)
			showMessage("Directorio '" + filesDist.dist + "' creado.")
		}

		/* Crea el archivo compilado. */
		fs.writeFileSync(filesDist.js, contentFileExport, { encoding: 'utf8' })
		showMessage("Archivo '" + filesDist.js + "' creado.")

		/* Crea el archivo compilado minificado. */
		minify(filesDist.js).then(function (text) {
			fs.writeFileSync(filesDist.jsMin, text, { encoding: 'utf8' })
			showMessage("Archivo '" + filesDist.jsMin + "' creado.")
		}).catch(err => showError(`Error al intentar minimalizar el archivo ${filesDist.js}. El error es: ${err}`))

		/* Crea el archivo de documentación */
		if (fs.existsSync(filesSrc.doc)) {
			let info = require(filesSrc.doc)
			let outputFile2 = path.resolve(filesDist.dist, 'documentation.html')
			/* Lee el archivo de plantilla de documentación y coloca el nombre del componente. */
			let content = fs.readFileSync(filesSrc.documentation, { encoding: 'utf8' }).replace(/@COMPONENT_NAME/g, contentCode.tagName)
			if (info.descriptions) {
				/* Zona de la etiqueta */
				content = content.replace(/@COMPONENT_TEMPLATE/g, info.template ? info.template : `<${contentCode.tagName}></${contentCode.tagName}>`)
				if (info.principal) content = content.replace(/@PRINCIPAL/g, info.principal.replace(/\n/g, '').replace(/\t/g, ''))
			}
			/* Cadena para colocar los atributos en la zona de la sintáxis. */
			let attributesSintax = []
			let attributesDefinitions = []
			for (let propertyName in contentCode.attributes) {
				attributesSintax.push(`<span class="text-blue">${propertyName}</span>="<span contenteditable=\"true\" data-attribute-name=\"${propertyName}\"></span>"`)
				let definition = '(Sin definición)'
				let type
				for (let i in info.descriptions) {
					if (isNaN(Number(i))) continue
					if (info.descriptions[i].attribute === propertyName) {
						definition = info.descriptions[i].text
						type = info.descriptions[i].type
						break
					}
				}
				attributesDefinitions.push(`<h4>${propertyName}${type ? ` <code>${type}</code>` : ''}</h4><div class="definition">${definition}</div>`)
			}
			content = content.replace(/@ATTRIBUTES_SINTAX/g, attributesSintax.length > 0 ? (' ' + attributesSintax.join(' ')) : '')
			content = content.replace(/@ATTRIBUTES_DEFINITIONS/g, attributesDefinitions.length > 0 ? (' ' + attributesDefinitions.join(' ')) : 'No se han definido para este elemento.')
			/* Definición de las propiedades. */
			let propertiesDefinitions = []
			if (typeof contentCode.properties === 'object') {
				for (let propertyName in contentCode.properties) {
					let definition = '(Sin definición)'
					let type
					for (let i in info.descriptions) {
						if (isNaN(Number(i))) continue
						if (info.descriptions[i].property === propertyName) {
							definition = info.descriptions[i].text
							type = info.descriptions[i].type
							break
						}
					}
					propertiesDefinitions.push(`<h4>${propertyName}${type ? ` <code>${type}</code>` : ''}</h4><div class="definition">${definition}</div>`)
				}
			}
			content = content.replace(/@PROPERTIES_DEFINITIONS/g, propertiesDefinitions.length > 0 ? (' ' + propertiesDefinitions.join(' ')) : 'No se han definido para este elemento.')
			/* Definición de los métodos. */
			let methodsDefinitions = []
			if (typeof contentCode.methods === 'object' && contentCode.methods) {
				for (let i0 in contentCode.methods) {
					let definition = '(Sin definición)'
					let type
					for (let i in info.descriptions) {
						if (isNaN(Number(i))) continue
						if (info.descriptions[i].method === i0) {
							definition = info.descriptions[i].text
							type = info.descriptions[i].type
							break
						}
					}
					methodsDefinitions.push(`<h4>${i0}${type ? ` <code>${type}</code>` : ''}</h4><div class="definition">${definition}</div>`)
				}
			}
			content = content.replace(/@METHODS_DEFINITIONS/g, methodsDefinitions.length > 0 ? (' ' + methodsDefinitions.join(' ')) : 'No se han definido para este elemento.')
			// content = content.replace(/@EVENTS/g, (contentCode.events && contentCode.events.length) ? `'${contentCode.events.join("','")}'` : '')
			/* Definición de los eventos. */
			let eventsDefinitions = []
			if (typeof contentCode.events === 'object' && contentCode.events.length) {
				for (let i0 = 0; i0 < contentCode.events.length; i0++) {
					let definition = '(Sin definición)'
					for (let i in info.descriptions) {
						if (isNaN(Number(i))) continue
						if (info.descriptions[i].event === contentCode.events[i0]) {
							definition = info.descriptions[i].text
							// eventsDefinitions.push(`<h4>${contentCode.events[i0]}</h4><div class="definition">${info.descriptions[i].text ? info.descriptions[i].text : '(Sin definición)'}</div>`)
							break
						}
					}
					eventsDefinitions.push(`<h4>${contentCode.events[i0]}</h4><div class="definition">${definition}</div>`)
				}
			}
			content = content.replace(/@EVENTS_DEFINITIONS/g, eventsDefinitions.length > 0 ? (' ' + eventsDefinitions.join(' ')) : 'No se han definido para este elemento.')
			content = content.replace(/@EVENTS/g, (contentCode.events && contentCode.events.length) ? `'${contentCode.events.join("','")}'` : '')
			/* Agrega los archivos de scripts */
			if (typeof info.prevScriptFiles === 'object' && info.prevScriptFiles.constructor.name === 'Array' && info.prevScriptFiles.length > 0) {
				info.prevScriptFiles.forEach(function (element, index) {
					info.prevScriptFiles[index] = `<script src="${element}"></script>`
				})
				content = content.replace(/@PREV_SCRIPTS/g, info.prevScriptFiles.join(''))
			} else {
				content = content.replace(/@PREV_SCRIPTS/g, '')
			}
			if (typeof info.postScriptFiles === 'object' && info.postScriptFiles.constructor.name === 'Array' && info.postScriptFiles.length > 0) {
				info.postScriptFiles.forEach(function (element, index) {
					info.postScriptFiles[index] = `<script src="${element}"></script>`
				})
				content = content.replace(/@POST_SCRIPTS/g, info.postScriptFiles.join(''))
			} else {
				content = content.replace(/@POST_SCRIPTS/g, '')
			}
			/* Agrega los archivos de styles */
			if (typeof info.styleFiles === 'object' && info.styleFiles.constructor.name === 'Array' && info.styleFiles.length > 0) {
				info.styleFiles.forEach(function (element, index) {
					info.styleFiles[index] = `<link href="${element}" rel="stylesheet">`
				})
				content = content.replace(/@STYLES/g, info.styleFiles.join(''))
			} else {
				content = content.replace(/@STYLES/g, '')
			}
			/* Escritura del archivo */
			fs.writeFileSync(outputFile2, content, { encoding: 'utf8' })
			showMessage("Archivo '" + outputFile2 + "' creado.")
		}
	},

	create: function (tagName) {
		/* Directorio pricipal */
		const directory = path.resolve(process.cwd())

		const files = {
			code: path.resolve(directory, 'code.js'),
			template: path.resolve(directory, 'template.html'),
			style: path.resolve(directory, 'styles.scss'),
			style: path.resolve(directory, 'doc.js'),
		}

		/* Archivo de código */
		if (!fs.existsSync(files.code)) {
			fs.writeFileSync(files.code, fs.readFileSync(path.resolve(__dirname, 'resources/code.js'), { encoding: 'utf8' }).replace('@COMPONENT_NAME', tagName), { encoding: 'utf8' })
			showMessage("Archivo '" + files.code + "' creado.")
		} else {
			showMessage("El archivo '" + files.code + "' ya existe y no se ha creado uno nuevo.")
		}

		/* Archivo de plantilla */
		if (!fs.existsSync(files.template)) {
			fs.writeFileSync(files.template, fs.readFileSync(path.resolve(__dirname, 'resources/template.html'), { encoding: 'utf8' }), { encoding: 'utf8' })
			showMessage("Archivo '" + files.template + "' creado.")
		} else {
			showMessage("El archivo '" + files.template + "' ya existe y no se ha creado uno nuevo.")
		}

		/* Archivo de estilos */
		if (!fs.existsSync(files.style)) {
			fs.writeFileSync(files.style, fs.readFileSync(path.resolve(__dirname, 'resources/styles.scss'), { encoding: 'utf8' }), { encoding: 'utf8' })
			showMessage("Archivo '" + files.style + "' creado.")
		} else {
			showMessage("El archivo '" + files.style + "' ya existe y no se ha creado uno nuevo.")
		}

		/* Archivo de documentación */
		if (!fs.existsSync(files.style)) {
			fs.writeFileSync(files.style, fs.readFileSync(path.resolve(__dirname, 'resources/doc.js'), { encoding: 'utf8' }).replace('@template', `<${tagName}></${tagName}>`),
				{ encoding: 'utf8' })
			showMessage("Archivo '" + files.style + "' creado.")
		} else {
			showMessage("El archivo '" + files.style + "' ya existe y no se ha creado uno nuevo.")
		}
	}
}