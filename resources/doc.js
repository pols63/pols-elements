module.exports = {
	template: '@template',
	principal: `
		This is a pols-element. The principal description is the property <code>principal</code>. Another properties can be descriptions for attributes, properties and/or methods of
		the element. One descrptions can be same for two or three categories, just put a property <code>attribute|property|method</code> with the name.
	`,
	descriptions: [
		{
			text: 'This is an attribute example.',
			attribute: 'attr-example',
			type: 'string'
		},
		{
			text: 'This is a property example.',
			property: 'example',
			type: 'int'
		},
		{
			text: 'This is a method example.',
			method: 'example',
			type: 'null'
		}
	],
	prevScriptFiles: [],
	postScriptFiles: [],
	styleFiles: []
}