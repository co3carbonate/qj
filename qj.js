////////
// QJ //
////////
// Return instance of qj.qjObject through qj()
function qj(properties) {
    return (new qj.qjObject(properties));
}
// Library namespace
(function (qj) {
    // CONSTANTS
    qj.width = 800;
    qj.height = 600;
    // UTILITY
    // define_setter(object context, string property, function func)
    // Define the setter of an object without affecting its getter
    function define_setter(context, property, func) {
        var prefixed = '__' + property;
        context.__defineGetter__(property, function () {
            return this[prefixed];
        });
        context.__defineSetter__(property, function (v) {
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
    var setters = {
        // Basics
        'x': function (v) {
            var new_x = this.followOffset ? v + positionOffset.x : v;
            this.element.style.left = new_x + 'px';
            this.offsetX = new_x;
        },
        'y': function (v) {
            var new_y = this.followOffset ? v + positionOffset.y : v;
            this.element.style.top = new_y + 'px';
            this.offsetY = new_y;
        },
        'w': function (v) { this.element.style.width = v + 'px'; },
        'h': function (v) { this.element.style.height = v + 'px'; },
        'html': function (v) { this.element.innerHTML = v; },
        'text': function (v) { this.element.innerText = v; },
        // Styles
        // Note: Each style setter function returns an array of the modified properties,
        //       for the convenience of the pseudoclass functions
        'style': {
            'textAlign': function (v) {
                if (v == 'left')
                    this.justifyContent = 'flex-start';
                else if (v == 'center')
                    this.justifyContent = 'center';
                else if (v == 'right')
                    this.justifyContent = 'flex-end';
                return ['justifyContent'];
            },
            'verticalAlign': function (v) {
                if (v == 'top')
                    this.alignItems = 'flex-start';
                else if (v == 'center')
                    this.alignItems = 'center';
                else if (v == 'bottom')
                    this.alignItems = 'flex-end';
                return ['alignItems'];
            },
            'textStyle': function (v) {
                var split = v.split(' ');
                this.fontWeight = (split.indexOf('bold') > -1) ? 'bold' : 'none';
                this.textDecoration = (split.indexOf('underline') > -1) ? 'underline' : 'none';
                this.fontStyle = (split.indexOf('italic') > -1) ? 'italic' : 'none';
                return ['fontWeight', 'textDecoration', 'fontStyle'];
            }
        },
        // Pseudoclasses
        '__pseudoclass__': function (obj, pseudoclass) {
            // generate css content for the pseudoclass
            var css_contents = "#" + this.id + ":" + pseudoclass + " {";
            var keys = Object.keys(obj);
            var l = keys.length;
            var k, modified;
            for (var i_1 = 0; i_1 < l; i_1++) {
                k = keys[i_1];
                // if this style has a setter, go through the setter function
                if (setters.style.hasOwnProperty(k)) {
                    modified = setters.style[k].call(obj, obj[k]);
                    // the keys that were modified by the setter function are stored and
                    // added to the back of the 'keys' array, to be iterated through again
                    if (modified) {
                        keys = keys.concat(modified);
                        l += modified.length;
                    }
                    continue;
                }
                // convert the camelCased style to dash-case, and add it to the css_contents
                // TODO: make this work for browser-prefixed-styles,
                //       like mozTransform to "-moz-transform", not "moz-transform"
                css_contents += k.replace(/([A-Z])/g, "-$1").toLowerCase() + ":" + obj[k] + " !important;";
            }
            css_contents += '}';
            qj.style.innerHTML += css_contents;
        },
        'hover': function (obj) { setters.__pseudoclass__.call(this, obj, 'hover'); },
        'active': function (obj) { setters.__pseudoclass__.call(this, obj, 'active'); }
    };
    function define_setters(instance) {
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
    var qjObject = (function () {
        // Constructor
        function qjObject(properties) {
            this.followOffset = true;
            this.detached = false;
            // Properties
            // dimensions
            this.x = null;
            this.y = null;
            this.w = null;
            this.h = null;
            // content
            this.html = '';
            this.text = '';
            // Type-specifics
            // image
            this.src = undefined;
            // Setup element based on .type
            if (properties.type == 'image' ||
                (!properties.hasOwnProperty('type') &&
                    properties.hasOwnProperty('img'))) {
                properties.type = 'image';
                this.element = document.createElement('img');
                this.element.className = 'qj image';
            }
            else {
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
            if (properties.hasOwnProperty('style')) {
                for (var k in properties.style) {
                    this.style[k] = properties.style[k];
                }
            }
            // for other normal non-object properties
            for (var k in properties) {
                if (k == 'style')
                    continue;
                this[k] = properties[k];
            }
            // TODO: set default value of certain styles, eg center for verticalAlign
        }
        // .show() and .hide()
        // Show or hide the qjObject element, by setting 'display: none'
        qjObject.prototype.hide = function () {
            this.style.display = 'none';
        };
        qjObject.prototype.show = function () {
            this.style.display = '';
        };
        // .attach() and .detach()
        // Attach or detach the qjObject's element from DOM
        // [currently assumes that the element is a direct child of qj.container]
        // [currently assumes that order of elements do not matter]
        qjObject.prototype.detach = function () {
            if (this.detached)
                return;
            // according to the MDN documentation,
            // .removeChild() returns reference to the removed element,
            // which can still be appended afterwards
            this.element = qj.container.removeChild(this.element);
            this.detached = true;
        };
        qjObject.prototype.attach = function () {
            if (!this.detached)
                return;
            qj.container.appendChild(this.element);
            this.detached = false;
        };
        // .on(string event, function func)
        // Binds a specific event listener to the qjObject element
        qjObject.prototype.on = function (event, func) {
            this.element.addEventListener(event, func);
        };
        // .collide(qjObject obj)
        // Returns whether or not this qjObject is colliding with another
        qjObject.prototype.collide = function (obj) {
            return ((this.x > obj.x &&
                this.x < obj.x + obj.w) ||
                (this.x + this.w > obj.x &&
                    this.x + this.w < obj.x + obj.w)) &&
                ((this.y > obj.y &&
                    this.y < obj.y + obj.h) ||
                    (this.y + this.h > obj.y &&
                        this.y + this.h < obj.y + obj.h));
        };
        return qjObject;
    }());
    // Static
    qjObject.counter = 0;
    qj.qjObject = qjObject;
    ;
    qj.stages = {};
    // qj.stage
    // Gets or changes the qj stage
    define_setter(qj, 'stage', function (new_stage) {
        // cleanup the old stage
        if (qj.stages.hasOwnProperty(qj.stage_name)) {
            // detach all old qj objects
            for (var _i = 0, _a = qj.stages[qj.stage_name].objects; _i < _a.length; _i++) {
                var object = _a[_i];
                object.detach();
            }
            // stop the frame recursion
            if (qj.stages[qj.stage_name].stop_frame_func)
                qj.stages[qj.stage_name].stop_frame_func();
        }
        // new stage
        qj.stage_name = new_stage;
        if (!qj.stages[qj.stage_name].setup_run) {
            qj.stages[qj.stage_name].setup_func.call(qj.stages[qj.stage_name]);
            qj.stages[qj.stage_name].setup_run = true;
        }
        // attach the new qj objects
        for (var _b = 0, _c = qj.stages[qj.stage_name].objects; _b < _c.length; _b++) {
            var object = _c[_b];
            object.attach();
        }
        // use that stage's positionOffset
        positionOffset.x = qj.stages[qj.stage_name].positionOffset.x;
        positionOffset.y = qj.stages[qj.stage_name].positionOffset.y;
        // start running the frame recursion
        // also define the stop_frame function
        if (qj.stages[qj.stage_name].frame_func)
            qj.stages[qj.stage_name].stop_frame_func = qj.frame(qj.stages[qj.stage_name].frame_func);
    });
    // qj.frame(function func)
    // Executes a provided function every frame at about 60 FPS
    function frame(func) {
        // start a recursion to keep executing func every frame
        var recurseFunc;
        if (qj.stage_name && qj.stages.hasOwnProperty(qj.stage_name)) {
            recurseFunc = function () {
                func.call(qj.stages[qj.stage_name]);
                qj.stages[qj.stage_name].frame++;
                window.requestAnimationFrame(recurseFunc);
            };
        }
        else {
            recurseFunc = function () {
                func();
                window.requestAnimationFrame(recurseFunc);
            };
        }
        recurseFunc();
        // return a function that will stop the recursion if called
        return function () {
            recurseFunc = function () { };
        };
    }
    qj.frame = frame;
    // qj.keydown
    // An object with keys of the various keyCodes, and their values are true
    // or false depending if the key is currently being pressed down
    qj.keydown = {};
    window.addEventListener('keydown', function (e) {
        qj.keydown[e.keyCode] = true;
    });
    window.addEventListener('keyup', function (e) {
        qj.keydown[e.keyCode] = false;
    });
    for (var i = 0; i < 200; i++)
        qj.keydown[i] = false; // hax
    // positionOffset
    // Defines the global x or y coordinate offset of every object
    var positionOffset = { __x: 0, __y: 0 };
    define_setter(positionOffset, 'x', function (v) {
        for (var _i = 0, _a = qj.stages[qj.stage_name].objects; _i < _a.length; _i++) {
            var obj = _a[_i];
            // trigger the obj.x setter, so that positionOffset change
            // comes into immediate effect
            obj.x = obj.x;
        }
    });
    define_setter(positionOffset, 'y', function (v) {
        for (var _i = 0, _a = qj.stages[qj.stage_name].objects; _i < _a.length; _i++) {
            var obj = _a[_i];
            obj.y = obj.y;
        }
    });
    // qj.run(string stage_name, function setup_func, function frame_func)
    function run(stage, setup_func, frame_func) {
        qj.stages[stage] = {
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
        define_setter(qj.stages[stage].positionOffset, 'x', function (v) {
            if (stage == qj.stage_name)
                positionOffset.x = v;
        });
        define_setter(qj.stages[stage].positionOffset, 'y', function (v) {
            if (stage == qj.stage_name)
                positionOffset.y = v;
        });
    }
    qj.run = run;
    // DOM SETUP
    // Setup qj.container
    qj.container = document.createElement('div');
    qj.container.className = 'qj-container';
    document.getElementsByTagName('body')[0].appendChild(qj.container);
    // Setup qj.style
    qj.style = document.createElement('style');
    document.getElementsByTagName('head')[0].appendChild(qj.style);
    qj.style.innerHTML = "\n\n\n/* css styling for the qj library */\n\n/* all qj objects are wrapped in a .qj-container */\nbody {\n\t/* ensure that .qj-container is at the extreme top left */\n\tpadding: 0;\n\tmargin: 0;\n}\n.qj-container {\n\toverflow: hidden;\n\tposition: relative;\n\twidth: " + qj.width + "px;\n\theight: " + qj.height + "px;\n}\n\n/* each qj object has a .qj class */\n.qj {\n\tposition: absolute;\n\n\t/* make text vertically and horizontally align */\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: center;\n\n\t/* box-sizing properties to ensure padding/border does not affect width */\n\t-webkit-box-sizing: border-box; \n\t-moz-box-sizing: border-box;\n\tbox-sizing: border-box;\n}\n\n\n/* following styles are code-generated and minified */\n";
})(qj || (qj = {}));
