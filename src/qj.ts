////////
// QJ //
////////

// Return instance of qj.qjObject through qj()
function qj(properties) {
	return (new qj.qjObject(properties));
}

// Library namespace
namespace qj {

	// CONSTANTS
	export const width:number = 800;
	export const height:number = 600;

	// UTILITY
	// define_setter(object context, string property, function func)
	// Define the setter of an object without affecting its getter
	function define_setter(context:any, property:string, func:Function) {
		let prefixed:string = '__' + property;
		context.__defineGetter__(property, function() {
			return this[prefixed];
		});
		context.__defineSetter__(property, function(v) {
			this[prefixed] = v;
			func.call(this, v);
		});
	}

	// define_setters(object instance)
	// Initializes the setters of a qjObject instance
	/* 
		// Basics
		x => this.element.style.left
		y => this.element.style.top
		w => this.element.style.width
		h => this.element.style.height
		html => this.element.innerHTML
		text => this.element.innerText
		content => this.element.innerText

		// Styles
		style.textAlign => this.style.justifyContent
		style.verticalAlign => this.style.alignItems
		style.textStyle => this.style.fontWeight /
						   this.style.textDecoration /
						   this.style.fontStyle

		// Pseudoclasses
		hover => :hover
		active => :active
	*/

	// list of qj object setter functions
	const setters:any = {
		// Basics
		'x': function(v) {
			let new_x:number = this.followOffset ? v + positionOffset.x : v;
			this.element.style.left = new_x + 'px'; 
			this.offsetX = new_x;
		},
		'y': function(v) { 
			let new_y:number = this.followOffset ? v + positionOffset.y : v;
			this.element.style.top = new_y + 'px';
			this.offsetY = new_y;
		},
		'w': function(v) { this.element.style.width = v + 'px'; },
		'h': function(v) { this.element.style.height = v + 'px'; },
		'html': function(v) { this.element.innerHTML = v; },
		'text': function(v) { this.element.innerText = v; },

		// Styles
		// Note: Each style setter function returns an array of the modified properties,
		//       for the convenience of the pseudoclass functions
		'style': {
			'textAlign': function(v) {
				if(v == 'left') this.justifyContent = 'flex-start';
				else if(v == 'center') this.justifyContent = 'center';
				else if(v == 'right') this.justifyContent = 'flex-end';
				return ['justifyContent'];
			},
			'verticalAlign': function(v) {
				if(v == 'top') this.alignItems = 'flex-start';
				else if(v == 'center') this.alignItems = 'center';
				else if(v == 'bottom') this.alignItems = 'flex-end';
				return ['alignItems'];
			},
			'textStyle': function(v) {
				let split:string[] = v.split(' ');
				this.fontWeight = (split.indexOf('bold') > -1) ? 'bold' : 'none';
				this.textDecoration = (split.indexOf('underline') > -1) ? 'underline' : 'none'; 
				this.fontStyle = (split.indexOf('italic') > -1) ? 'italic' : 'none';
				return ['fontWeight', 'textDecoration', 'fontStyle'];
			}
		},

		// Pseudoclasses
		'__pseudoclass__': function(obj, pseudoclass:string) {
			
			// generate css content for the pseudoclass
			let css_contents:string = `#${this.id}:${pseudoclass} {`;
			let keys:string[] = Object.keys(obj);
			let l:number = keys.length;
			let k:string, modified:string[];
			for(let i:number = 0; i < l; i++) {
				k = keys[i];

				// if this style has a setter, go through the setter function
				if(setters.style.hasOwnProperty(k)) {
					modified = setters.style[k].call(obj, obj[k]);

					// the keys that were modified by the setter function are stored and
					// added to the back of the 'keys' array, to be iterated through again
					if(modified) {
						keys = keys.concat(modified);
						l += modified.length;
					}
					continue;
				}

				// convert the camelCased style to dash-case, and add it to the css_contents
				// TODO: make this work for browser-prefixed-styles,
				//		 like mozTransform to "-moz-transform", not "moz-transform"
				css_contents += `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}:${obj[k]} !important;`;
			}

			css_contents += '}';
			qj.style.innerHTML += css_contents;
		},
		'hover': function(obj) { setters.__pseudoclass__.call(this, obj, 'hover'); },
		'active': function(obj) { setters.__pseudoclass__.call(this, obj, 'active'); }
	};
	function define_setters(instance:any) {
		// Basics
		define_setter(instance, 'x', setters['x']);
		define_setter(instance, 'y', setters['y']);
		define_setter(instance, 'w', setters['w']);
		define_setter(instance, 'h', setters['h']);
		define_setter(instance, 'html', setters['html']);
		define_setter(instance, 'text', setters['text']);

		// Styles
		define_setter(instance.style, 'textAlign', setters.style['textAlign']);
		define_setter(instance.style, 'verticalAlign', setters.style['verticalAlign']);
		define_setter(instance.style, 'textStyle', setters.style['textStyle']);

		// Pseudoclasses
		define_setter(instance, 'hover', setters['hover']);
		define_setter(instance, 'active', setters['active']);
	}


	// GENERAL QJ OBJECT CLASS
	export class qjObject {

		// Static
		public static counter:number = 0;

		// Element
		public id:string;
		public type:'rect'|'image'|'text';
		public element:HTMLElement;
		public style:CSSStyleDeclaration;

		public followOffset:boolean = true;
		public detached:boolean = false;

		// Properties
		// dimensions
		public x:number = null;
		public y:number = null;
		public w:number = null;
		public h:number = null;

		// content
		public html:string = '';
		public text:string = '';

		// Type-specifics
		// image
		public src:string = undefined;

		// Constructor
		public constructor(properties:any) {

			// Setup element based on .type
			if(properties.type == 'image' ||
				(!properties.hasOwnProperty('type') &&
				  properties.hasOwnProperty('img'))
			) {
				properties.type = 'image';
				this.element = document.createElement('img');
				this.element.className = 'qj image';
			} else {
				properties.type = 'rect';
				this.element = document.createElement('div');
				this.element.className = 'qj ' + properties.type;
			}
			qj.container.appendChild(this.element);

			// Setup element ID (for CSS reference)
			qjObject.counter++;
			this.id = 'qj_' + String(qjObject.counter);
			this.element.id = this.id;

			// Setup element style
			this.style = this.element.style;

			// Setup the setters for this instance
			define_setters(this);

			// Assign class methods to respective properties
			// for the style property
			if(properties.hasOwnProperty('style')) {
				for(var k in properties.style) {
					this.style[k] = properties.style[k];
				}
			}

			// for other normal non-object properties
			for(var k in properties) {
				if(k == 'style') continue;
				this[k] = properties[k];
			}

			// TODO: set default value of certain styles, eg center for verticalAlign

		}

		// .show() and .hide()
		// Show or hide the qjObject element, by setting 'display: none'
		public hide():void {
			this.style.display = 'none';
		}
		public show():void {
			this.style.display = '';
		}

		// .attach() and .detach()
		// Attach or detach the qjObject's element from DOM
		// [currently assumes that the element is a direct child of qj.container]
		// [currently assumes that order of elements do not matter]
		public detach():void {
			if(this.detached) return;

			// according to the MDN documentation,
			// .removeChild() returns reference to the removed element,
			// which can still be appended afterwards
			this.element = qj.container.removeChild(this.element) as HTMLElement;
			this.detached = true;
		}
		public attach():void {
			if(!this.detached) return;

			qj.container.appendChild(this.element);
			this.detached = false;
		}

		// .on(string event, function func)
		// Binds a specific event listener to the qjObject element
		public on(event:string, func:Function):void {
			this.element.addEventListener(event, func as any);
		}

		// .collide(qjObject obj)
		// Returns whether or not this qjObject is colliding with another
		public collide(obj:qjObject):boolean {
			return ((this.x > obj.x &&
					 this.x < obj.x + obj.w) ||
					(this.x + this.w > obj.x &&
					 this.x + this.w < obj.x + obj.w)) &&
					((this.y > obj.y &&
					 this.y < obj.y + obj.h) ||
					(this.y + this.h > obj.y &&
					 this.y + this.h < obj.y + obj.h));
		}


	};

	// QJ NAMESPACE
	
	// Stage-related functions
	export let stage_name:string;
	export let stages:{
		[stage:string]:{
			frame:number; // this stage's current frame number
			objects:qjObject[]; // array of qj objects to render in this stage
			setup_func:Function; // this stage's setup function
			frame_func:Function; // this stage's per-frame function
			stop_frame_func:Function; // function to stop this stage's frame function
			setup_run:boolean; // if the setup function has been run before
			positionOffset:any; // positionOffset for qj objects in this stage
		}
	} = {};
	
	// qj.stage
	// Gets or changes the qj stage
	define_setter(qj, 'stage', function(new_stage:string) {
		
		// cleanup the old stage
		if(stages.hasOwnProperty(stage_name)) {

			// detach all old qj objects
			for(let object of stages[stage_name].objects) {
				object.detach();
			}

			// stop the frame recursion
			if(stages[stage_name].stop_frame_func)
				stages[stage_name].stop_frame_func();
		}

		// new stage
		stage_name = new_stage;
		if(!stages[stage_name].setup_run) {
			stages[stage_name].setup_func.call(qj.stages[stage_name]);
			stages[stage_name].setup_run = true;
		}

		// attach the new qj objects
		for(let object of stages[stage_name].objects) {
			object.attach();
		}

		// use that stage's positionOffset
        positionOffset.x = qj.stages[stage_name].positionOffset.x;
        positionOffset.y = qj.stages[stage_name].positionOffset.y;

		// start running the frame recursion
		// also define the stop_frame function
		if(stages[stage_name].frame_func)
			stages[stage_name].stop_frame_func = qj.frame(stages[stage_name].frame_func);
	});

	// qj.frame(function func)
	// Executes a provided function every frame at about 60 FPS
	export function frame(func:Function) {
		// start a recursion to keep executing func every frame
		let recurseFunc;
		if(stage_name && qj.stages.hasOwnProperty(stage_name)) {
			recurseFunc = function() {
				func.call(qj.stages[stage_name]);
				qj.stages[stage_name].frame++;
				window.requestAnimationFrame(recurseFunc);
			}
		} else {
			recurseFunc = function() {
				func();
				window.requestAnimationFrame(recurseFunc);
			}
		}
		recurseFunc();

		// return a function that will stop the recursion if called
		return function() {
			recurseFunc = function() {};
		};
	}

	// qj.keydown
	// An object with keys of the various keyCodes, and their values are true
	// or false depending if the key is currently being pressed down
	export let keydown:{[k:number]: boolean} = {};
	window.addEventListener('keydown', function (e) {
		qj.keydown[e.keyCode] = true;
	});
	window.addEventListener('keyup', function (e) {
		qj.keydown[e.keyCode] = false;
	});
	for (var i = 0; i < 200; i++) qj.keydown[i] = false; // hax

	// positionOffset
	// Defines the global x or y coordinate offset of every object
	let positionOffset:any = { __x: 0, __y: 0 };
	define_setter(positionOffset, 'x', function (v) {
		for(let obj of qj.stages[stage_name].objects) {
			// trigger the obj.x setter, so that positionOffset change
			// comes into immediate effect
			obj.x = obj.x;
		}
	});
	define_setter(positionOffset, 'y', function (v) {
		for(let obj of qj.stages[stage_name].objects) {
			obj.y = obj.y;
		}
	});

	// qj.run(string stage_name, function setup_func, function frame_func)
	export function run(
		stage:string,
		setup_func:Function,
		frame_func:Function
	) {
		stages[stage] = {
			frame: 0,
			objects: [],
			setup_func: setup_func,
			frame_func: frame_func,
			stop_frame_func: undefined,
			setup_run: false,
			positionOffset: { __x: 0, __y: 0 }
		};

		// setup this stage's positionOffset setters
		// to make a change in this stage's positionOffset also affect the 
		// global positionOffset
		define_setter(stages[stage].positionOffset, 'x', function (v) {
			if(stage == stage_name) positionOffset.x = v;
		});
		define_setter(stages[stage].positionOffset, 'y', function (v) {
			if(stage == stage_name) positionOffset.y = v;
		});
	}

	


	// DOM SETUP
	// Setup qj.container
	export let container:HTMLDivElement = document.createElement('div');
	container.className = 'qj-container';
	document.getElementsByTagName('body')[0].appendChild(container);

	// Setup qj.style
	export let style:HTMLStyleElement = document.createElement('style');
	document.getElementsByTagName('head')[0].appendChild(style);
	style.innerHTML = `


/* css styling for the qj library */

/* all qj objects are wrapped in a .qj-container */
body {
	/* ensure that .qj-container is at the extreme top left */
	padding: 0;
	margin: 0;
}
.qj-container {
	overflow: hidden;
	position: relative;
	width: ${width}px;
	height: ${height}px;
}

/* each qj object has a .qj class */
.qj {
	position: absolute;

	/* make text vertically and horizontally align */
	display: flex;
	align-items: center;
	justify-content: center;

	/* box-sizing properties to ensure padding/border does not affect width */
	-webkit-box-sizing: border-box; 
	-moz-box-sizing: border-box;
	box-sizing: border-box;
}


/* following styles are code-generated and minified */
`;

	
}