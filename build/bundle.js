
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    class Controller {
      constructor(stackSize, name) {
        this.name = name;
        this._stack = [];
        this._serial;
        this._stackSize = stackSize || 0;
      }

      ready() {
        return this._stack != null;
      }

      attachSerial(s) {
        this._serial = s;
      }

      send(value) { // value is list of int
        this._serial.transmit(this, value);
      }

      receive(value) { // value is list of int
        console.log('receive', value, this.name);
        console.assert(value != null, 'Controller received a null value');
        console.assert(this._stack != null, 'Controller stack is not initialized');
        console.assert(this._stackSize > 0, 'Controller stack size is not greater than 0');
        console.assert(this._stack.length < this._stackSize, `Controller stack overflow, no room to recieve value: ${value}`);
        this._stack.push(value);
      }

      processNext(tick) {
        if (this._stack.length > 0) {
          var value = this._stack.shift(0);
          console.log('processNext', value, this.name);
        }
      }
    }

    /* src/Ram.svelte generated by Svelte v3.22.2 */

    const { console: console_1 } = globals;
    const file = "src/Ram.svelte";

    function create_fragment(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "RAM";
    			add_location(div0, file, 63, 2, 1392);
    			attr_dev(div1, "class", "ram svelte-7xlkf8");
    			add_location(div1, file, 62, 0, 1372);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { size } = $$props;
    	let { internalSize } = $$props;
    	internalSize = parseInt(internalSize);
    	console.assert(typeof size === "number");
    	console.assert(size > 0);
    	console.assert(typeof internalSize === "number", typeof internalSize);
    	console.assert(internalSize > 0);
    	let _memory; // array of int

    	// size = size; // int
    	// internalSize = internalSize;
    	_memory = new Array(size);

    	_memory.fill(new Array(internalSize).fill(0));

    	function peek(address) {
    		// address: int; return int
    		console.assert(typeof address === "number");

    		console.assert(address < _memory.length);
    		return _memory[address] || [];
    	}

    	function poke(address, value) {
    		console.assert(typeof address === "number");
    		console.assert(address != null);
    		console.assert(address < _memory.length);
    		console.assert(typeof value === "object", "wrong type", typeof value, value);
    		const previous = _memory[address];
    		_memory[address] = value;
    		return previous;
    	}

    	const writable_props = ["size", "internalSize"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Ram> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Ram", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("internalSize" in $$props) $$invalidate(0, internalSize = $$props.internalSize);
    	};

    	$$self.$capture_state = () => ({ size, internalSize, _memory, peek, poke });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("internalSize" in $$props) $$invalidate(0, internalSize = $$props.internalSize);
    		if ("_memory" in $$props) _memory = $$props._memory;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [internalSize, size, peek, poke];
    }

    class Ram extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			size: 1,
    			internalSize: 0,
    			peek: 2,
    			poke: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ram",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*size*/ ctx[1] === undefined && !("size" in props)) {
    			console_1.warn("<Ram> was created without expected prop 'size'");
    		}

    		if (/*internalSize*/ ctx[0] === undefined && !("internalSize" in props)) {
    			console_1.warn("<Ram> was created without expected prop 'internalSize'");
    		}
    	}

    	get size() {
    		throw new Error("<Ram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Ram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get internalSize() {
    		throw new Error("<Ram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set internalSize(value) {
    		throw new Error("<Ram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get peek() {
    		return this.$$.ctx[2];
    	}

    	set peek(value) {
    		throw new Error("<Ram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get poke() {
    		return this.$$.ctx[3];
    	}

    	set poke(value) {
    		throw new Error("<Ram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // http://www.pentacom.jp/pentacom/bitfontmaker2/gallery/glyphmap.php?id=5612
    // http://www.pentacom.jp/pentacom/bitfontmaker2/gallery/glyphmap.php?id=2951

    const chars = [
      0, 0, 0, 0, 0, 0, 0, 0, // Space
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // 0
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 1, 1, 1, 0,
      0, 1, 1, 1, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 1, 1, 0, 0, 0, // 1
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // 2
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 1, 1, 1, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // 3
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 1, 1, 0, 0, // 4
      0, 0, 0, 1, 1, 1, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 1, 0, 0, 1, 1, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 1, 1, 1, 1, 0, // 5
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // 6
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 1, 1, 1, 1, 0, // 7
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // 8
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // 9
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 1, 1, 0, 0, 0, // A
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 1, 1, 1, 0, 0, // B
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // C
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 1, 1, 0, 0, 0, // D
      0, 1, 1, 0, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 1, 1, 0, 0,
      0, 1, 1, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 1, 1, 1, 1, 0, // E
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 1, 1, 1, 1, 0, // F
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // G
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 0, 0, 1, 1, 0, // H
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // I
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 1, 1, 1, 1, 0, // J
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 1, 1, 0, 1, 1, 0, 0,
      0, 0, 1, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 0, 0, 1, 1, 0, // K
      0, 1, 1, 0, 1, 1, 0, 0,
      0, 1, 1, 1, 1, 0, 0, 0,
      0, 1, 1, 1, 1, 0, 0, 0,
      0, 1, 1, 1, 1, 0, 0, 0,
      0, 1, 1, 0, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 0, 0, 0, 0, 0, // L
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 0, 0, 0, 1, 1, // M
      0, 1, 1, 1, 0, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 1, 0, 1, 0, 1, 1,
      0, 1, 1, 0, 0, 0, 1, 1,
      0, 1, 1, 0, 0, 0, 1, 1,
      0, 1, 1, 0, 0, 0, 1, 1,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 0, 0, 1, 1, 0, // N
      0, 1, 1, 1, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 0, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // O
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 1, 1, 1, 0, 0, // P
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // Q
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 1, 1, 1, 0, 0, // R
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 1, 1, 0, 0, 0,
      0, 1, 1, 0, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // S
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 1, 1, 1, 1, 0, // T
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 0, 0, 1, 1, 0, // U
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 0, 0, 1, 1, 0, // V
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 0, 0, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 0, 0, 0, 1, 1, // W
      0, 1, 1, 0, 0, 0, 1, 1,
      0, 1, 1, 0, 0, 0, 1, 1,
      0, 1, 1, 0, 1, 0, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 1, 1, 0, 1, 1, 1,
      0, 1, 1, 0, 0, 0, 1, 1,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 0, 0, 1, 1, 0, // X
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 0, 0, 1, 1, 0, // Y
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 1, 1, 1, 1, 0, // Z
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // a
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // b
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // c
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 1, 1, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // d
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // e
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // f
      0, 0, 0, 0, 1, 1, 1, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // g
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // h
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // i
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // j
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // k
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 1, 1, 0, 0,
      0, 1, 1, 1, 1, 0, 0, 0,
      0, 1, 1, 0, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // l
      0, 0, 1, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // m
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 1, 1,
      0, 1, 1, 1, 0, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 1, 0, 1, 0, 1, 1,
      0, 1, 1, 0, 0, 0, 1, 1,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // n
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // o
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // p
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // q
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 1, 1, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // r
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // s
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // t
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // u
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // v
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // w
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 1, 1,
      0, 1, 1, 0, 0, 0, 1, 1,
      0, 1, 1, 0, 1, 0, 1, 1,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 0, 1, 1, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // x
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // y
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 1, 1, 1, 1, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // z
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // ? question mark
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 1, 1, 0, 0, 0, // ! exclamation
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // , comma
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // . period
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // ; semi-colon
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // : colon
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // # number sign
      0, 0, 1, 0, 0, 1, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 1, 0, 0, 1, 0, 0,
      0, 0, 1, 0, 0, 1, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 1, 0, 0, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 1, 1, 0, 0, 0, // $ dollar sign
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // % percent
      0, 0, 1, 1, 0, 0, 1, 0,
      0, 0, 1, 1, 0, 1, 1, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 0, 1, 1, 0,
      0, 0, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 1, 1, 0, 0, 0, // ^ caret
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // & ampersand
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 1, 1, 1, 0, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 1,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 1, 1,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 1, 1, 0, 0, // ( parenthesis left
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 0, 0, 0, 0, // ) parenthesis right
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // + plus
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // - hyphen (minus)
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // * asterisk
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // / Slash
      0, 0, 0, 0, 0, 0, 1, 1,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // = equals
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 1, 1, 0, // <
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 0, 0, 0, 0, 0, // >
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 0, 1, 1, 0, // " double quote
      0, 0, 1, 1, 0, 1, 1, 0,
      0, 0, 1, 1, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 1, 1, 0, 0, 0, // ' single quote
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // [
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // ]
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // \ backslash
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 1, 1,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 0, 0, 0, 0, // ` backtick
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // _ underscore
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 0,

      0, 0, 0, 1, 1, 1, 1, 0, // {
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 1, 1, 0, 0, 0, // }
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 1, 1, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 1, 1, 0, 0, 0, // | bar
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 0, 0, 0, // ~ tilda
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 1, 0,
      0, 1, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 1, 1, 1, 1, 0, 0, // @ at symbol
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 0, 1, 1, 1, 0,
      0, 1, 1, 0, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 0, 0, 0, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 0, 0, 0, 0, 1, 1, 0, // £ sterling
      0, 0, 0, 0, 1, 0, 0, 1,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 1,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,

      0, 1, 1, 1, 1, 1, 1, 1, // block (cursor)
      0, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1,
    ];

    /* src/MonitorPI100.svelte generated by Svelte v3.22.2 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/MonitorPI100.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (131:8) {#each section as pixel}
    function create_each_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "monitor-s100__pixel svelte-qfmyg7");
    			toggle_class(div, "monitor-s100__pixel_off", /*pixel*/ ctx[17] == 0);
    			add_location(div, file$1, 131, 10, 3345);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sections*/ 2) {
    				toggle_class(div, "monitor-s100__pixel_off", /*pixel*/ ctx[17] == 0);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(131:8) {#each section as pixel}",
    		ctx
    	});

    	return block;
    }

    // (129:4) {#each sections as section}
    function create_each_block(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*section*/ ctx[14];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "monitor-s100__section svelte-qfmyg7");
    			add_location(div, file$1, 129, 6, 3266);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sections*/ 2) {
    				each_value_1 = /*section*/ ctx[14];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(129:4) {#each sections as section}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let current;
    	let each_value = /*sections*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let ram_1_props = {
    		size: _screenCharWidth * _screenCharHeight,
    		internalSize: "64"
    	};

    	const ram_1 = new Ram({ props: ram_1_props, $$inline: true });
    	/*ram_1_binding*/ ctx[13](ram_1);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			create_component(ram_1.$$.fragment);
    			attr_dev(div0, "id", "monitor-s100");
    			attr_dev(div0, "class", "monitor-s100 svelte-qfmyg7");
    			set_style(div0, "width", _screenCharWidth * 8 * 3 + "px");
    			set_style(div0, "height", _screenCharHeight * 8 * 3 + "px");
    			add_location(div0, file$1, 126, 2, 3095);
    			set_style(div1, "display", "flex");
    			add_location(div1, file$1, 125, 0, 3064);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t);
    			mount_component(ram_1, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sections*/ 2) {
    				each_value = /*sections*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const ram_1_changes = {};
    			ram_1.$set(ram_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ram_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ram_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			/*ram_1_binding*/ ctx[13](null);
    			destroy_component(ram_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const _screenCharWidth = 11;
    const _screenCharHeight = 3;
    const _charPixels = 64;
    const _numChars = 96; // number if characters in library

    function randomNumber(min, max) {
    	return Math.floor(Math.random() * (max - min) + min);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const _ramSize = _screenCharWidth * _screenCharHeight; // one unit per "section" or character
    	let _power = false;
    	const name = "monitorPI100";
    	const controller = new Controller(1, name);

    	// const ram = new Ram(_screenCharWidth * _screenCharHeight, 64); // 240
    	let drawQueue = [];

    	let ram;
    	let sections = [];

    	for (let i = 0; i < _screenCharWidth * _screenCharHeight; i++) {
    		const section = [];

    		for (let i = 0; i < _charPixels; i++) {
    			section.push(0);
    		}

    		sections.push(section);
    	}

    	function displayRandomChars() {
    		let tt = 33;

    		let rc = function () {
    			tt -= 1;

    			if (tt < 0) {
    				return;
    			}

    			for (let j = 0; j < 1; j++) {
    				let c = randomNumber(0, _numChars + 1);
    				let s = randomNumber(0, sections.length);
    				_updateRam(s, _getChar(c));
    			}

    			window.requestAnimationFrame(rc);
    		};

    		window.requestAnimationFrame(rc);
    	}

    	displayRandomChars();

    	function screenStepFn() {
    		const charsPerStep = 1;

    		for (let i = 0; i < charsPerStep; i++) {
    			const s = drawQueue.shift();

    			if (s === undefined || s > _ramSize - 1) {
    				return;
    			}

    			_updateSection(s, ram.peek(s));
    		}

    		if (drawQueue.length > 0) {
    			window.requestAnimationFrame(screenStepFn);
    		}
    	}

    	function addToDrawQueue(address) {
    		if (drawQueue.indexOf(address) === -1) {
    			drawQueue.push(address);
    		}

    		if (drawQueue.length === 1) {
    			window.requestAnimationFrame(screenStepFn);
    		}
    	}

    	/**
     * @param {number} i
     * @return {number[]}
     */
    	function _getChar(i) {
    		try {
    			const start = i * _charPixels;
    			const end = start + _charPixels;
    			return chars.slice(start, end);
    		} catch(e) {
    			return Array(_charPixels).fill(0);
    		}
    	}

    	/**
     * @param {number} address
     * @param {number[]} input
     */
    	function _updateRam(address, input) {
    		console.assert(address != null);
    		console.assert(address < _screenCharWidth * _screenCharHeight, address, _screenCharWidth * _screenCharHeight - 1);
    		console.assert(input.length == _charPixels, input.length, _charPixels);
    		ram.poke(address, input);
    		addToDrawQueue(address);
    	}

    	/**
     * @param {number} section
     * @param {number[]} input
     */
    	function _updateSection(section, input) {
    		if (!input) {
    			return;
    		}

    		console.assert(section != null);
    		console.assert(section < _screenCharWidth * _screenCharHeight, section, _screenCharWidth * _screenCharHeight - 1);
    		console.assert(input.length === _charPixels, input.length, _charPixels);
    		$$invalidate(1, sections[section] = input, sections);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<MonitorPI100> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("MonitorPI100", $$slots, []);

    	function ram_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, ram = $$value);
    		});
    	}

    	$$self.$capture_state = () => ({
    		Controller,
    		Ram,
    		chars,
    		onMount,
    		_screenCharWidth,
    		_screenCharHeight,
    		_charPixels,
    		_ramSize,
    		_numChars,
    		_power,
    		name,
    		controller,
    		drawQueue,
    		ram,
    		sections,
    		displayRandomChars,
    		randomNumber,
    		screenStepFn,
    		addToDrawQueue,
    		_getChar,
    		_updateRam,
    		_updateSection
    	});

    	$$self.$inject_state = $$props => {
    		if ("_power" in $$props) _power = $$props._power;
    		if ("drawQueue" in $$props) drawQueue = $$props.drawQueue;
    		if ("ram" in $$props) $$invalidate(0, ram = $$props.ram);
    		if ("sections" in $$props) $$invalidate(1, sections = $$props.sections);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		ram,
    		sections,
    		name,
    		controller,
    		_ramSize,
    		_power,
    		drawQueue,
    		displayRandomChars,
    		screenStepFn,
    		addToDrawQueue,
    		_getChar,
    		_updateRam,
    		_updateSection,
    		ram_1_binding
    	];
    }

    class MonitorPI100 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 2, controller: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MonitorPI100",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get name() {
    		return this.$$.ctx[2];
    	}

    	set name(value) {
    		throw new Error("<MonitorPI100>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get controller() {
    		return this.$$.ctx[3];
    	}

    	set controller(value) {
    		throw new Error("<MonitorPI100>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Serial.svelte generated by Svelte v3.22.2 */

    const { console: console_1$2 } = globals;

    function create_fragment$2(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let attached = [];

    	function attach(a) {
    		console.assert(a !== null);
    		console.assert(a.controller !== null);
    		console.assert(a.controller.ready());
    		attached.push(a);
    		a.controller.attachSerial(this);
    	}

    	function transmit(origin, value) {
    		for (const part of attached) {
    			if (part.controller !== origin) {
    				console.log(`transmitting ${origin.name} -> ${part.name}`);
    				part.controller.receive(value);
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Serial> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Serial", $$slots, []);
    	$$self.$capture_state = () => ({ attached, attach, transmit });

    	$$self.$inject_state = $$props => {
    		if ("attached" in $$props) attached = $$props.attached;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [attach, transmit];
    }

    class Serial extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { attach: 0, transmit: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Serial",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get attach() {
    		return this.$$.ctx[0];
    	}

    	set attach(value) {
    		throw new Error("<Serial>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transmit() {
    		return this.$$.ctx[1];
    	}

    	set transmit(value) {
    		throw new Error("<Serial>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Keyboard.svelte generated by Svelte v3.22.2 */

    function create_fragment$3(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const name = "keyboard";
    	const controller = new Controller(1, name);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Keyboard> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Keyboard", $$slots, []);
    	$$self.$capture_state = () => ({ Controller, name, controller });
    	return [name, controller];
    }

    class Keyboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { name: 0, controller: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Keyboard",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get name() {
    		return this.$$.ctx[0];
    	}

    	set name(value) {
    		throw new Error("<Keyboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get controller() {
    		return this.$$.ctx[1];
    	}

    	set controller(value) {
    		throw new Error("<Keyboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Clock.svelte generated by Svelte v3.22.2 */

    const { console: console_1$3 } = globals;
    const file$2 = "src/Clock.svelte";

    // (78:4) {#if !_on}
    function create_if_block_2(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Start";
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "start-stop svelte-1m8oiwu");
    			add_location(button, file$2, 78, 4, 1245);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*start*/ ctx[3], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(78:4) {#if !_on}",
    		ctx
    	});

    	return block;
    }

    // (81:4) {#if _on}
    function create_if_block_1(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Stop";
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "start-stop svelte-1m8oiwu");
    			add_location(button, file$2, 81, 4, 1346);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*stop*/ ctx[4], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(81:4) {#if _on}",
    		ctx
    	});

    	return block;
    }

    // (85:4) {#if !_on}
    function create_if_block(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*_tick*/ ctx[0]);
    			attr_dev(div, "class", "tick-counter svelte-1m8oiwu");
    			add_location(div, file$2, 85, 4, 1522);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*_tick*/ 1) set_data_dev(t, /*_tick*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(85:4) {#if !_on}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let button;
    	let t2;
    	let t3;
    	let dispose;
    	let if_block0 = !/*_on*/ ctx[1] && create_if_block_2(ctx);
    	let if_block1 = /*_on*/ ctx[1] && create_if_block_1(ctx);
    	let if_block2 = !/*_on*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			button = element("button");
    			t2 = text("Step");
    			t3 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(button, "type", "button");
    			button.disabled = /*_on*/ ctx[1];
    			add_location(button, file$2, 83, 4, 1431);
    			attr_dev(div, "id", "clock");
    			attr_dev(div, "class", "clock svelte-1m8oiwu");
    			add_location(div, file$2, 76, 0, 1195);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			append_dev(div, button);
    			append_dev(button, t2);
    			append_dev(div, t3);
    			if (if_block2) if_block2.m(div, null);
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*clickStep*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*_on*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*_on*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*_on*/ 2) {
    				prop_dev(button, "disabled", /*_on*/ ctx[1]);
    			}

    			if (!/*_on*/ ctx[1]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let _tick = 0;
    	let _on = false;
    	let _parts = [];

    	function getTick() {
    		return _tick;
    	}

    	function clickStep() {
    		if (_on) {
    			return;
    		}

    		step();
    	}

    	function register(...parts) {
    		_parts.push(...parts);
    		console.log("registered", _parts);
    	}

    	function unregister(part) {
    		_parts = _parts.filter(p => p !== part);
    	}

    	function step() {
    		$$invalidate(0, _tick++, _tick);

    		_parts.forEach(part => {
    			part.controller.processNext(_tick);
    		});
    	}

    	function next() {
    		if (_on) {
    			step();
    			window.requestAnimationFrame(next);
    		}
    	}

    	function start() {
    		if (_on === true) {
    			return _tick;
    		}

    		$$invalidate(1, _on = true);
    		window.requestAnimationFrame(next);
    		return _tick;
    	}

    	function stop() {
    		$$invalidate(1, _on = false);
    		return _tick;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<Clock> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Clock", $$slots, []);

    	$$self.$capture_state = () => ({
    		_tick,
    		_on,
    		_parts,
    		getTick,
    		clickStep,
    		register,
    		unregister,
    		step,
    		next,
    		start,
    		stop
    	});

    	$$self.$inject_state = $$props => {
    		if ("_tick" in $$props) $$invalidate(0, _tick = $$props._tick);
    		if ("_on" in $$props) $$invalidate(1, _on = $$props._on);
    		if ("_parts" in $$props) _parts = $$props._parts;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [_tick, _on, clickStep, start, stop, register, unregister];
    }

    class Clock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { register: 5, unregister: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clock",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get register() {
    		return this.$$.ctx[5];
    	}

    	set register(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unregister() {
    		return this.$$.ctx[6];
    	}

    	set unregister(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.22.2 */
    const file$3 = "src/App.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	let clock_props = {};
    	const clock = new Clock({ props: clock_props, $$inline: true });
    	/*clock_binding*/ ctx[5](clock);
    	let monitorpi100_props = {};

    	const monitorpi100 = new MonitorPI100({
    			props: monitorpi100_props,
    			$$inline: true
    		});

    	/*monitorpi100_binding*/ ctx[6](monitorpi100);
    	let serial_props = {};
    	const serial = new Serial({ props: serial_props, $$inline: true });
    	/*serial_binding*/ ctx[7](serial);
    	let keyboard_props = {};
    	const keyboard = new Keyboard({ props: keyboard_props, $$inline: true });
    	/*keyboard_binding*/ ctx[8](keyboard);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(clock.$$.fragment);
    			t0 = space();
    			create_component(monitorpi100.$$.fragment);
    			t1 = space();
    			create_component(serial.$$.fragment);
    			t2 = space();
    			create_component(keyboard.$$.fragment);
    			add_location(main, file$3, 34, 0, 527);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(clock, main, null);
    			append_dev(main, t0);
    			mount_component(monitorpi100, main, null);
    			append_dev(main, t1);
    			mount_component(serial, main, null);
    			append_dev(main, t2);
    			mount_component(keyboard, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const clock_changes = {};
    			clock.$set(clock_changes);
    			const monitorpi100_changes = {};
    			monitorpi100.$set(monitorpi100_changes);
    			const serial_changes = {};
    			serial.$set(serial_changes);
    			const keyboard_changes = {};
    			keyboard.$set(keyboard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clock.$$.fragment, local);
    			transition_in(monitorpi100.$$.fragment, local);
    			transition_in(serial.$$.fragment, local);
    			transition_in(keyboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clock.$$.fragment, local);
    			transition_out(monitorpi100.$$.fragment, local);
    			transition_out(serial.$$.fragment, local);
    			transition_out(keyboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*clock_binding*/ ctx[5](null);
    			destroy_component(clock);
    			/*monitorpi100_binding*/ ctx[6](null);
    			destroy_component(monitorpi100);
    			/*serial_binding*/ ctx[7](null);
    			destroy_component(serial);
    			/*keyboard_binding*/ ctx[8](null);
    			destroy_component(keyboard);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let m; // monitor
    	let ms; // monitor serial
    	let c; // clock;
    	let k; // keyboard

    	onMount(() => {
    		start();
    	});

    	function start() {
    		ms.attach(m);
    		ms.attach(k);
    		c.register(m);
    		k.controller.send([1, 1]);
    	} // k.controller.send([2, 2]);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function clock_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, c = $$value);
    		});
    	}

    	function monitorpi100_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, m = $$value);
    		});
    	}

    	function serial_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, ms = $$value);
    		});
    	}

    	function keyboard_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, k = $$value);
    		});
    	}

    	$$self.$capture_state = () => ({
    		MonitorPI100,
    		Serial,
    		Keyboard,
    		Clock,
    		onMount,
    		m,
    		ms,
    		c,
    		k,
    		start
    	});

    	$$self.$inject_state = $$props => {
    		if ("m" in $$props) $$invalidate(0, m = $$props.m);
    		if ("ms" in $$props) $$invalidate(1, ms = $$props.ms);
    		if ("c" in $$props) $$invalidate(2, c = $$props.c);
    		if ("k" in $$props) $$invalidate(3, k = $$props.k);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		m,
    		ms,
    		c,
    		k,
    		start,
    		clock_binding,
    		monitorpi100_binding,
    		serial_binding,
    		keyboard_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.querySelector('#output'),
    	props: {

    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
