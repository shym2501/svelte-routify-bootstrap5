
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
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
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
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
    function tick() {
        schedule_update();
        return resolved_promise;
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
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
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
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
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
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

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const MATCH_PARAM = RegExp(/\:([^/()]+)/g);

    function handleScroll (element) {
      if (navigator.userAgent.includes('jsdom')) return false
      scrollAncestorsToTop(element);
      handleHash();
    }

    function handleHash () {
      if (navigator.userAgent.includes('jsdom')) return false
      const { hash } = window.location;
      if (hash) {
        const validElementIdRegex = /^[A-Za-z]+[\w\-\:\.]*$/;
        if (validElementIdRegex.test(hash.substring(1))) {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView();
        }
      }
    }

    function scrollAncestorsToTop (element) {
      if (
        element &&
        element.scrollTo &&
        element.dataset.routify !== 'scroll-lock' &&
        element.dataset['routify-scroll'] !== 'lock'
      ) {
        element.style['scroll-behavior'] = 'auto';
        element.scrollTo({ top: 0, behavior: 'auto' });
        element.style['scroll-behavior'] = '';
        scrollAncestorsToTop(element.parentElement);
      }
    }

    const pathToRegex = (str, recursive) => {
      const suffix = recursive ? '' : '/?$'; //fallbacks should match recursively
      str = str.replace(/\/_fallback?$/, '(/|$)');
      str = str.replace(/\/index$/, '(/index)?'); //index files should be matched even if not present in url
      str = str.replace(MATCH_PARAM, '([^/]+)') + suffix;
      return str
    };

    const pathToParamKeys = string => {
      const paramsKeys = [];
      let matches;
      while ((matches = MATCH_PARAM.exec(string))) paramsKeys.push(matches[1]);
      return paramsKeys
    };

    const pathToRank = ({ path }) => {
      return path
        .split('/')
        .filter(Boolean)
        .map(str => (str === '_fallback' ? 'A' : str.startsWith(':') ? 'B' : 'C'))
        .join('')
    };

    let warningSuppressed = false;

    /* eslint no-console: 0 */
    function suppressWarnings () {
      if (warningSuppressed) return
      const consoleWarn = console.warn;
      console.warn = function (msg, ...msgs) {
        const ignores = [
          "was created with unknown prop 'scoped'",
          "was created with unknown prop 'scopedSync'",
        ];
        if (!ignores.find(iMsg => msg.includes(iMsg)))
          return consoleWarn(msg, ...msgs)
      };
      warningSuppressed = true;
    }

    function currentLocation () {
      const pathMatch = window.location.search.match(/__routify_path=([^&]+)/);
      const prefetchMatch = window.location.search.match(/__routify_prefetch=\d+/);
      window.routify = window.routify || {};
      window.routify.prefetched = prefetchMatch ? true : false;
      const path = pathMatch && pathMatch[1].replace(/[#?].+/, ''); // strip any thing after ? and #
      return path || window.location.pathname
    }

    window.routify = window.routify || {};

    /** @type {import('svelte/store').Writable<RouteNode>} */
    const route = writable(null); // the actual route being rendered

    /** @type {import('svelte/store').Writable<RouteNode[]>} */
    const routes = writable([]); // all routes
    routes.subscribe(routes => (window.routify.routes = routes));

    let rootContext = writable({ component: { params: {} } });

    /** @type {import('svelte/store').Writable<RouteNode>} */
    const urlRoute = writable(null);  // the route matching the url

    /** @type {import('svelte/store').Writable<String>} */
    const basepath = (() => {
        const { set, subscribe } = writable("");

        return {
            subscribe,
            set(value) {
                if (value.match(/^[/(]/))
                    set(value);
                else console.warn('Basepaths must start with / or (');
            },
            update() { console.warn('Use assignment or set to update basepaths.'); }
        }
    })();

    const location$1 = derived( // the part of the url matching the basepath
        [basepath, urlRoute],
        ([$basepath, $route]) => {
            const [, base, path] = currentLocation().match(`^(${$basepath})(${$route.regex})`) || [];
            return { base, path }
        }
    );

    const prefetchPath = writable("");

    function onAppLoaded({ path, metatags }) {
        metatags.update();
        const prefetchMatch = window.location.search.match(/__routify_prefetch=(\d+)/);
        const prefetchId = prefetchMatch && prefetchMatch[1];

        dispatchEvent(new CustomEvent('app-loaded'));
        parent.postMessage({
            msg: 'app-loaded',
            prefetched: window.routify.prefetched,
            path,
            prefetchId
        }, "*");
        window['routify'].appLoaded = true;
    }

    var defaultConfig = {
        queryHandler: {
            parse: search => fromEntries(new URLSearchParams(search)),
            stringify: params => '?' + (new URLSearchParams(params)).toString()
        }
    };


    function fromEntries(iterable) {
        return [...iterable].reduce((obj, [key, val]) => {
            obj[key] = val;
            return obj
        }, {})
    }

    /**
     * @param {string} url 
     * @return {ClientNode}
     */
    function urlToRoute(url) {
        /** @type {RouteNode[]} */
        const routes$1 = get_store_value(routes);
        const basepath$1 = get_store_value(basepath);
        const route = routes$1.find(route => url.match(`^${basepath$1}${route.regex}`));
        if (!route)
            throw new Error(
                `Route could not be found for "${url}".`
            )

        const [, base] = url.match(`^(${basepath$1})${route.regex}`);
        const path = url.slice(base.length);

        if (defaultConfig.queryHandler)
            route.params = defaultConfig.queryHandler.parse(window.location.search);

        if (route.paramKeys) {
            const layouts = layoutByPos(route.layouts);
            const fragments = path.split('/').filter(Boolean);
            const routeProps = getRouteProps(route.path);

            routeProps.forEach((prop, i) => {
                if (prop) {
                    route.params[prop] = fragments[i];
                    if (layouts[i]) layouts[i].param = { [prop]: fragments[i] };
                    else route.param = { [prop]: fragments[i] };
                }
            });
        }

        route.leftover = url.replace(new RegExp(base + route.regex), '');

        return route
    }


    /**
     * @param {array} layouts
     */
    function layoutByPos(layouts) {
        const arr = [];
        layouts.forEach(layout => {
            arr[layout.path.split('/').filter(Boolean).length - 1] = layout;
        });
        return arr
    }


    /**
     * @param {string} url
     */
    function getRouteProps(url) {
        return url
            .split('/')
            .filter(Boolean)
            .map(f => f.match(/\:(.+)/))
            .map(f => f && f[1])
    }

    /* node_modules\@sveltech\routify\runtime\Prefetcher.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1 } = globals;
    const file = "node_modules\\@sveltech\\routify\\runtime\\Prefetcher.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (93:2) {#each $actives as prefetch (prefetch.options.prefetch)}
    function create_each_block(key_1, ctx) {
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = /*prefetch*/ ctx[1].url)) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "title", "routify prefetcher");
    			add_location(iframe, file, 93, 4, 2705);
    			this.first = iframe;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$actives*/ 1 && iframe.src !== (iframe_src_value = /*prefetch*/ ctx[1].url)) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(93:2) {#each $actives as prefetch (prefetch.options.prefetch)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*$actives*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*prefetch*/ ctx[1].options.prefetch;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "__routify_iframes");
    			set_style(div, "display", "none");
    			add_location(div, file, 91, 0, 2591);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$actives*/ 1) {
    				const each_value = /*$actives*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
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

    const iframeNum = 2;

    const defaults = {
    	validFor: 60,
    	timeout: 5000,
    	gracePeriod: 1000
    };

    /** stores and subscriptions */
    const queue = writable([]);

    const actives = derived(queue, q => q.slice(0, iframeNum));

    actives.subscribe(actives => actives.forEach(({ options }) => {
    	setTimeout(() => removeFromQueue(options.prefetch), options.timeout);
    }));

    function prefetch(path, options = {}) {
    	prefetch.id = prefetch.id || 1;

    	path = !path.href
    	? path
    	: path.href.replace(/^(?:\/\/|[^/]+)*\//, "/");

    	//replace first ? since were mixing user queries with routify queries
    	path = path.replace("?", "&");

    	options = { ...defaults, ...options, path };
    	options.prefetch = prefetch.id++;

    	//don't prefetch within prefetch or SSR
    	if (window.routify.prefetched || navigator.userAgent.match("jsdom")) return false;

    	// add to queue
    	queue.update(q => {
    		if (!q.some(e => e.options.path === path)) q.push({
    			url: `/__app.html?${optionsToQuery(options)}`,
    			options
    		});

    		return q;
    	});
    }

    /**
     * convert options to query string
     * {a:1,b:2} becomes __routify_a=1&routify_b=2
     * @param {defaults & {path: string, prefetch: number}} options
     */
    function optionsToQuery(options) {
    	return Object.entries(options).map(([key, val]) => `__routify_${key}=${val}`).join("&");
    }

    /**
     * @param {number|MessageEvent} idOrEvent
     */
    function removeFromQueue(idOrEvent) {
    	const id = idOrEvent.data ? idOrEvent.data.prefetchId : idOrEvent;
    	if (!id) return null;
    	const entry = get_store_value(queue).find(entry => entry && entry.options.prefetch == id);

    	// removeFromQueue is called by both eventListener and timeout,
    	// but we can only remove the item once
    	if (entry) {
    		const { gracePeriod } = entry.options;
    		const gracePromise = new Promise(resolve => setTimeout(resolve, gracePeriod));

    		const idlePromise = new Promise(resolve => {
    				window.requestIdleCallback
    				? window.requestIdleCallback(resolve)
    				: setTimeout(resolve, gracePeriod + 1000);
    			});

    		Promise.all([gracePromise, idlePromise]).then(() => {
    			queue.update(q => q.filter(q => q.options.prefetch != id));
    		});
    	}
    }

    // Listen to message from child window
    addEventListener("message", removeFromQueue, false);

    function instance($$self, $$props, $$invalidate) {
    	let $actives;
    	validate_store(actives, "actives");
    	component_subscribe($$self, actives, $$value => $$invalidate(0, $actives = $$value));
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Prefetcher> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Prefetcher", $$slots, []);

    	$$self.$capture_state = () => ({
    		writable,
    		derived,
    		get: get_store_value,
    		iframeNum,
    		defaults,
    		queue,
    		actives,
    		prefetch,
    		optionsToQuery,
    		removeFromQueue,
    		$actives
    	});

    	return [$actives];
    }

    class Prefetcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Prefetcher",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /// <reference path="../typedef.js" />

    /** @ts-check */
    /**
     * @typedef {Object} RoutifyContext
     * @prop {ClientNode} component
     * @prop {ClientNode} layout
     * @prop {any} componentFile 
     * 
     *  @returns {import('svelte/store').Readable<RoutifyContext>} */
    function getRoutifyContext() {
      return getContext('routify') || rootContext
    }

    /**
     * @callback AfterPageLoadHelper
     * @param {function} callback
     * 
     * @typedef {import('svelte/store').Readable<AfterPageLoadHelper> & {_hooks:Array<function>}} AfterPageLoadHelperStore
     * @type {AfterPageLoadHelperStore}
     */
    const afterPageLoad = {
      _hooks: [],
      subscribe: hookHandler
    };

    /** 
     * @callback BeforeUrlChangeHelper
     * @param {function} callback
     *
     * @typedef {import('svelte/store').Readable<BeforeUrlChangeHelper> & {_hooks:Array<function>}} BeforeUrlChangeHelperStore
     * @type {BeforeUrlChangeHelperStore}
     **/
    const beforeUrlChange = {
      _hooks: [],
      subscribe: hookHandler
    };

    function hookHandler(listener) {
      const hooks = this._hooks;
      const index = hooks.length;
      listener(callback => { hooks[index] = callback; });
      return () => delete hooks[index]
    }



    const _metatags = {
      props: {},
      templates: {},
      services: {
        plain: { propField: 'name', valueField: 'content' },
        twitter: { propField: 'name', valueField: 'content' },
        og: { propField: 'property', valueField: 'content' },
      },
      plugins: [
        {
          name: 'applyTemplate',
          condition: () => true,
          action: (prop, value) => {
            const template = _metatags.getLongest(_metatags.templates, prop) || (x => x);
            return [prop, template(value)]
          }
        },
        {
          name: 'createMeta',
          condition: () => true,
          action(prop, value) {
            _metatags.writeMeta(prop, value);
          }
        },
        {
          name: 'createOG',
          condition: prop => !prop.match(':'),
          action(prop, value) {
            _metatags.writeMeta(`og:${prop}`, value);
          }
        },
        {
          name: 'createTitle',
          condition: prop => prop === 'title',
          action(prop, value) {
            document.title = value;
          }
        }
      ],
      getLongest(repo, name) {
        const providers = repo[name];
        if (providers) {
          const currentPath = get_store_value(route).path;
          const allPaths = Object.keys(repo[name]);
          const matchingPaths = allPaths.filter(path => currentPath.includes(path));

          const longestKey = matchingPaths.sort((a, b) => b.length - a.length)[0];

          return providers[longestKey]
        }
      },
      writeMeta(prop, value) {
        const head = document.getElementsByTagName('head')[0];
        const match = prop.match(/(.+)\:/);
        const serviceName = match && match[1] || 'plain';
        const { propField, valueField } = metatags.services[serviceName] || metatags.services.plain;
        const oldElement = document.querySelector(`meta[${propField}='${prop}']`);
        if (oldElement) oldElement.remove();

        const newElement = document.createElement('meta');
        newElement.setAttribute(propField, prop);
        newElement.setAttribute(valueField, value);
        newElement.setAttribute('data-origin', 'routify');
        head.appendChild(newElement);
      },
      set(prop, value) {
        _metatags.plugins.forEach(plugin => {
          if (plugin.condition(prop, value))
            [prop, value] = plugin.action(prop, value) || [prop, value];
        });
      },
      clear() {
        const oldElement = document.querySelector(`meta`);
        if (oldElement) oldElement.remove();
      },
      template(name, fn) {
        const origin = _metatags.getOrigin();
        _metatags.templates[name] = _metatags.templates[name] || {};
        _metatags.templates[name][origin] = fn;
      },
      update() {
        Object.keys(_metatags.props).forEach((prop) => {
          let value = (_metatags.getLongest(_metatags.props, prop));
          _metatags.plugins.forEach(plugin => {
            if (plugin.condition(prop, value)) {
              [prop, value] = plugin.action(prop, value) || [prop, value];

            }
          });
        });
      },
      batchedUpdate() {
        if (!_metatags._pendingUpdate) {
          _metatags._pendingUpdate = true;
          setTimeout(() => {
            _metatags._pendingUpdate = false;
            this.update();
          });
        }
      },
      _updateQueued: false,
      getOrigin() {
        const routifyCtx = getRoutifyContext();
        return routifyCtx && get_store_value(routifyCtx).path || '/'
      },
      _pendingUpdate: false
    };


    /**
     * metatags
     * @prop {Object.<string, string>}
     */
    const metatags = new Proxy(_metatags, {
      set(target, name, value, receiver) {
        const { props, getOrigin } = target;

        if (Reflect.has(target, name))
          Reflect.set(target, name, value, receiver);
        else {
          props[name] = props[name] || {};
          props[name][getOrigin()] = value;
        }

        if (window['routify'].appLoaded)
          target.batchedUpdate();
        return true
      }
    });

    const isChangingPage = (function () {
      const store = writable(false);
      beforeUrlChange.subscribe(fn => fn(event => {
        store.set(true);
        return true
      }));
      
      afterPageLoad.subscribe(fn => fn(event => store.set(false)));

      return store
    })();

    /* node_modules\@sveltech\routify\runtime\Route.svelte generated by Svelte v3.24.1 */
    const file$1 = "node_modules\\@sveltech\\routify\\runtime\\Route.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i].component;
    	child_ctx[20] = list[i].componentFile;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i].component;
    	child_ctx[20] = list[i].componentFile;
    	return child_ctx;
    }

    // (120:0) {#if $context}
    function create_if_block_1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$context*/ ctx[6].component.isLayout === false) return 0;
    		if (/*remainingLayouts*/ ctx[5].length) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(120:0) {#if $context}",
    		ctx
    	});

    	return block;
    }

    // (132:36) 
    function create_if_block_3(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value_1 = [/*$context*/ ctx[6]];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*component*/ ctx[19].path;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < 1; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$context, scoped, scopedSync, layout, remainingLayouts, decorator, Decorator, scopeToChild*/ 100663415) {
    				const each_value_1 = [/*$context*/ ctx[6]];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1, each_1_anchor, get_each_context_1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < 1; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 1; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(132:36) ",
    		ctx
    	});

    	return block;
    }

    // (121:2) {#if $context.component.isLayout === false}
    function create_if_block_2(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = [/*$context*/ ctx[6]];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*component*/ ctx[19].path;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < 1; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$context, scoped, scopedSync, layout*/ 85) {
    				const each_value = [/*$context*/ ctx[6]];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < 1; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 1; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(121:2) {#if $context.component.isLayout === false}",
    		ctx
    	});

    	return block;
    }

    // (134:6) <svelte:component         this={componentFile}         let:scoped={scopeToChild}         let:decorator         {scoped}         {scopedSync}         {...layout.param || {}}>
    function create_default_slot(ctx) {
    	let route_1;
    	let t;
    	let current;

    	route_1 = new Route({
    			props: {
    				layouts: [.../*remainingLayouts*/ ctx[5]],
    				Decorator: typeof /*decorator*/ ctx[26] !== "undefined"
    				? /*decorator*/ ctx[26]
    				: /*Decorator*/ ctx[1],
    				childOfDecorator: /*layout*/ ctx[4].isDecorator,
    				scoped: {
    					.../*scoped*/ ctx[0],
    					.../*scopeToChild*/ ctx[25]
    				}
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route_1.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(route_1, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_1_changes = {};
    			if (dirty & /*remainingLayouts*/ 32) route_1_changes.layouts = [.../*remainingLayouts*/ ctx[5]];

    			if (dirty & /*decorator, Decorator*/ 67108866) route_1_changes.Decorator = typeof /*decorator*/ ctx[26] !== "undefined"
    			? /*decorator*/ ctx[26]
    			: /*Decorator*/ ctx[1];

    			if (dirty & /*layout*/ 16) route_1_changes.childOfDecorator = /*layout*/ ctx[4].isDecorator;

    			if (dirty & /*scoped, scopeToChild*/ 33554433) route_1_changes.scoped = {
    				.../*scoped*/ ctx[0],
    				.../*scopeToChild*/ ctx[25]
    			};

    			route_1.$set(route_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route_1, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(134:6) <svelte:component         this={componentFile}         let:scoped={scopeToChild}         let:decorator         {scoped}         {scopedSync}         {...layout.param || {}}>",
    		ctx
    	});

    	return block;
    }

    // (133:4) {#each [$context] as { component, componentFile }
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ scoped: /*scoped*/ ctx[0] },
    		{ scopedSync: /*scopedSync*/ ctx[2] },
    		/*layout*/ ctx[4].param || {}
    	];

    	var switch_value = /*componentFile*/ ctx[20];

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: {
    				default: [
    					create_default_slot,
    					({ scoped: scopeToChild, decorator }) => ({ 25: scopeToChild, 26: decorator }),
    					({ scoped: scopeToChild, decorator }) => (scopeToChild ? 33554432 : 0) | (decorator ? 67108864 : 0)
    				]
    			},
    			$$scope: { ctx }
    		};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*scoped, scopedSync, layout*/ 21)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*scoped*/ 1 && { scoped: /*scoped*/ ctx[0] },
    					dirty & /*scopedSync*/ 4 && { scopedSync: /*scopedSync*/ ctx[2] },
    					dirty & /*layout*/ 16 && get_spread_object(/*layout*/ ctx[4].param || {})
    				])
    			: {};

    			if (dirty & /*$$scope, remainingLayouts, decorator, Decorator, layout, scoped, scopeToChild*/ 234881075) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*componentFile*/ ctx[20])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(133:4) {#each [$context] as { component, componentFile }",
    		ctx
    	});

    	return block;
    }

    // (122:4) {#each [$context] as { component, componentFile }
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ scoped: /*scoped*/ ctx[0] },
    		{ scopedSync: /*scopedSync*/ ctx[2] },
    		/*layout*/ ctx[4].param || {}
    	];

    	var switch_value = /*componentFile*/ ctx[20];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*scoped, scopedSync, layout*/ 21)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*scoped*/ 1 && { scoped: /*scoped*/ ctx[0] },
    					dirty & /*scopedSync*/ 4 && { scopedSync: /*scopedSync*/ ctx[2] },
    					dirty & /*layout*/ 16 && get_spread_object(/*layout*/ ctx[4].param || {})
    				])
    			: {};

    			if (switch_value !== (switch_value = /*componentFile*/ ctx[20])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(122:4) {#each [$context] as { component, componentFile }",
    		ctx
    	});

    	return block;
    }

    // (152:0) {#if !parentElement}
    function create_if_block(ctx) {
    	let span;
    	let setParent_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			add_location(span, file$1, 152, 2, 4450);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(setParent_action = /*setParent*/ ctx[8].call(null, span));
    				mounted = true;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(152:0) {#if !parentElement}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*$context*/ ctx[6] && create_if_block_1(ctx);
    	let if_block1 = !/*parentElement*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$context*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$context*/ 64) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*parentElement*/ ctx[3]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let $route;
    	let $context;
    	validate_store(route, "route");
    	component_subscribe($$self, route, $$value => $$invalidate(14, $route = $$value));
    	let { layouts = [] } = $$props;
    	let { scoped = {} } = $$props;
    	let { Decorator = null } = $$props;
    	let { childOfDecorator = false } = $$props;
    	let { isRoot = false } = $$props;
    	let scopedSync = {};
    	let isDecorator = false;

    	/** @type {HTMLElement} */
    	let parentElement;

    	/** @type {LayoutOrDecorator} */
    	let layout = null;

    	/** @type {LayoutOrDecorator} */
    	let lastLayout = null;

    	/** @type {LayoutOrDecorator[]} */
    	let remainingLayouts = [];

    	const context = writable(null);
    	validate_store(context, "context");
    	component_subscribe($$self, context, value => $$invalidate(6, $context = value));

    	/** @type {import("svelte/store").Writable<Context>} */
    	const parentContextStore = getContext("routify");

    	isDecorator = Decorator && !childOfDecorator;
    	setContext("routify", context);

    	/** @param {HTMLElement} el */
    	function setParent(el) {
    		$$invalidate(3, parentElement = el.parentElement);
    	}

    	/** @param {SvelteComponent} componentFile */
    	function onComponentLoaded(componentFile) {
    		/** @type {Context} */
    		const parentContext = get_store_value(parentContextStore);

    		$$invalidate(2, scopedSync = { ...scoped });
    		lastLayout = layout;
    		if (remainingLayouts.length === 0) onLastComponentLoaded();

    		const ctx = {
    			layout: isDecorator ? parentContext.layout : layout,
    			component: layout,
    			route: $route,
    			componentFile,
    			child: isDecorator
    			? parentContext.child
    			: get_store_value(context) && get_store_value(context).child
    		};

    		context.set(ctx);
    		if (isRoot) rootContext.set(ctx);

    		if (parentContext && !isDecorator) parentContextStore.update(store => {
    			store.child = layout || store.child;
    			return store;
    		});
    	}

    	/**  @param {LayoutOrDecorator} layout */
    	function setComponent(layout) {
    		let PendingComponent = layout.component();
    		if (PendingComponent instanceof Promise) PendingComponent.then(onComponentLoaded); else onComponentLoaded(PendingComponent);
    	}

    	async function onLastComponentLoaded() {
    		afterPageLoad._hooks.forEach(hook => hook(layout.api));
    		await tick();
    		handleScroll(parentElement);

    		if (!window["routify"].appLoaded) {
    			const pagePath = $context.component.path;
    			const routePath = $route.path;
    			const isOnCurrentRoute = pagePath === routePath; //maybe we're getting redirected

    			// Let everyone know the last child has rendered
    			if (!window["routify"].stopAutoReady && isOnCurrentRoute) {
    				onAppLoaded({ path: pagePath, metatags });
    			}
    		}
    	}

    	const writable_props = ["layouts", "scoped", "Decorator", "childOfDecorator", "isRoot"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Route> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Route", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("layouts" in $$props) $$invalidate(9, layouts = $$props.layouts);
    		if ("scoped" in $$props) $$invalidate(0, scoped = $$props.scoped);
    		if ("Decorator" in $$props) $$invalidate(1, Decorator = $$props.Decorator);
    		if ("childOfDecorator" in $$props) $$invalidate(10, childOfDecorator = $$props.childOfDecorator);
    		if ("isRoot" in $$props) $$invalidate(11, isRoot = $$props.isRoot);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		onDestroy,
    		onMount,
    		tick,
    		writable,
    		get: get_store_value,
    		metatags,
    		afterPageLoad,
    		route,
    		routes,
    		rootContext,
    		handleScroll,
    		onAppLoaded,
    		layouts,
    		scoped,
    		Decorator,
    		childOfDecorator,
    		isRoot,
    		scopedSync,
    		isDecorator,
    		parentElement,
    		layout,
    		lastLayout,
    		remainingLayouts,
    		context,
    		parentContextStore,
    		setParent,
    		onComponentLoaded,
    		setComponent,
    		onLastComponentLoaded,
    		$route,
    		$context
    	});

    	$$self.$inject_state = $$props => {
    		if ("layouts" in $$props) $$invalidate(9, layouts = $$props.layouts);
    		if ("scoped" in $$props) $$invalidate(0, scoped = $$props.scoped);
    		if ("Decorator" in $$props) $$invalidate(1, Decorator = $$props.Decorator);
    		if ("childOfDecorator" in $$props) $$invalidate(10, childOfDecorator = $$props.childOfDecorator);
    		if ("isRoot" in $$props) $$invalidate(11, isRoot = $$props.isRoot);
    		if ("scopedSync" in $$props) $$invalidate(2, scopedSync = $$props.scopedSync);
    		if ("isDecorator" in $$props) $$invalidate(12, isDecorator = $$props.isDecorator);
    		if ("parentElement" in $$props) $$invalidate(3, parentElement = $$props.parentElement);
    		if ("layout" in $$props) $$invalidate(4, layout = $$props.layout);
    		if ("lastLayout" in $$props) lastLayout = $$props.lastLayout;
    		if ("remainingLayouts" in $$props) $$invalidate(5, remainingLayouts = $$props.remainingLayouts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isDecorator, Decorator, layouts*/ 4610) {
    			 if (isDecorator) {
    				const decoratorLayout = {
    					component: () => Decorator,
    					path: `${layouts[0].path}__decorator`,
    					isDecorator: true
    				};

    				$$invalidate(9, layouts = [decoratorLayout, ...layouts]);
    			}
    		}

    		if ($$self.$$.dirty & /*layouts*/ 512) {
    			 $$invalidate(4, [layout, ...remainingLayouts] = layouts, layout, ((($$invalidate(5, remainingLayouts), $$invalidate(9, layouts)), $$invalidate(12, isDecorator)), $$invalidate(1, Decorator)));
    		}

    		if ($$self.$$.dirty & /*layout*/ 16) {
    			 setComponent(layout);
    		}
    	};

    	return [
    		scoped,
    		Decorator,
    		scopedSync,
    		parentElement,
    		layout,
    		remainingLayouts,
    		$context,
    		context,
    		setParent,
    		layouts,
    		childOfDecorator,
    		isRoot
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			layouts: 9,
    			scoped: 0,
    			Decorator: 1,
    			childOfDecorator: 10,
    			isRoot: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get layouts() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layouts(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scoped() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scoped(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Decorator() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Decorator(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get childOfDecorator() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set childOfDecorator(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isRoot() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isRoot(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function init$1(routes, callback) {
      /** @type { ClientNode | false } */
      let lastRoute = false;

      function updatePage(proxyToUrl, shallow) {
        const url = proxyToUrl || currentLocation();
        const route$1 = urlToRoute(url);
        const currentRoute = shallow && urlToRoute(currentLocation());
        const contextRoute = currentRoute || route$1;
        const layouts = [...contextRoute.layouts, route$1];
        if (lastRoute) delete lastRoute.last; //todo is a page component the right place for the previous route?
        route$1.last = lastRoute;
        lastRoute = route$1;

        //set the route in the store
        if (!proxyToUrl)
          urlRoute.set(route$1);
        route.set(route$1);

        //run callback in Router.svelte
        callback(layouts);
      }

      const destroy = createEventListeners(updatePage);

      return { updatePage, destroy }
    }

    /**
     * svelte:window events doesn't work on refresh
     * @param {Function} updatePage
     */
    function createEventListeners(updatePage) {
    ['pushState', 'replaceState'].forEach(eventName => {
        const fn = history[eventName];
        history[eventName] = async function (state = {}, title, url) {
          const { id, path, params } = get_store_value(route);
          state = { id, path, params, ...state };
          const event = new Event(eventName.toLowerCase());
          Object.assign(event, { state, title, url });

          if (await runHooksBeforeUrlChange(event)) {
            fn.apply(this, [state, title, url]);
            return dispatchEvent(event)
          }
        };
      });

      let _ignoreNextPop = false;

      const listeners = {
        click: handleClick,
        pushstate: () => updatePage(),
        replacestate: () => updatePage(),
        popstate: async event => {
          if (_ignoreNextPop)
            _ignoreNextPop = false;
          else {
            if (await runHooksBeforeUrlChange(event)) {
              updatePage();
            } else {
              _ignoreNextPop = true;
              event.preventDefault();
              history.go(1);
            }
          }
        },
      };

      Object.entries(listeners).forEach(args => addEventListener(...args));

      const unregister = () => {
        Object.entries(listeners).forEach(args => removeEventListener(...args));
      };

      return unregister
    }

    function handleClick(event) {
      const el = event.target.closest('a');
      const href = el && el.getAttribute('href');

      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.button ||
        event.defaultPrevented
      )
        return
      if (!href || el.target || el.host !== location.host) return

      event.preventDefault();
      history.pushState({}, '', href);
    }

    async function runHooksBeforeUrlChange(event) {
      const route$1 = get_store_value(route);
      for (const hook of beforeUrlChange._hooks.filter(Boolean)) {
        // return false if the hook returns false
        const result = await hook(event, route$1); //todo remove route from hook. Its API Can be accessed as $page
        if (!result) return false
      }
      return true
    }

    /* node_modules\@sveltech\routify\runtime\Router.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1$1 } = globals;

    // (64:0) {#if layouts && $route !== null}
    function create_if_block$1(ctx) {
    	let route_1;
    	let current;

    	route_1 = new Route({
    			props: {
    				layouts: /*layouts*/ ctx[0],
    				isRoot: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_1_changes = {};
    			if (dirty & /*layouts*/ 1) route_1_changes.layouts = /*layouts*/ ctx[0];
    			route_1.$set(route_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(64:0) {#if layouts && $route !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t;
    	let prefetcher;
    	let current;
    	let if_block = /*layouts*/ ctx[0] && /*$route*/ ctx[1] !== null && create_if_block$1(ctx);
    	prefetcher = new Prefetcher({ $$inline: true });

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			create_component(prefetcher.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(prefetcher, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*layouts*/ ctx[0] && /*$route*/ ctx[1] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*layouts, $route*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(prefetcher.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(prefetcher.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(prefetcher, detaching);
    		}
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
    	let $route;
    	validate_store(route, "route");
    	component_subscribe($$self, route, $$value => $$invalidate(1, $route = $$value));
    	let { routes: routes$1 } = $$props;
    	let { config = {} } = $$props;
    	let layouts;
    	let navigator;
    	window.routify = window.routify || {};
    	window.routify.inBrowser = !window.navigator.userAgent.match("jsdom");

    	Object.entries(config).forEach(([key, value]) => {
    		defaultConfig[key] = value;
    	});

    	suppressWarnings();
    	const updatePage = (...args) => navigator && navigator.updatePage(...args);
    	setContext("routifyupdatepage", updatePage);
    	const callback = res => $$invalidate(0, layouts = res);

    	const cleanup = () => {
    		if (!navigator) return;
    		navigator.destroy();
    		navigator = null;
    	};

    	let initTimeout = null;

    	// init is async to prevent a horrible bug that completely disable reactivity
    	// in the host component -- something like the component's update function is
    	// called before its fragment is created, and since the component is then seen
    	// as already dirty, it is never scheduled for update again, and remains dirty
    	// forever... I failed to isolate the precise conditions for the bug, but the
    	// faulty update is triggered by a change in the route store, and so offseting
    	// store initialization by one tick gives the host component some time to
    	// create its fragment. The root cause it probably a bug in Svelte with deeply
    	// intertwinned store and reactivity.
    	const doInit = () => {
    		clearTimeout(initTimeout);

    		initTimeout = setTimeout(() => {
    			cleanup();
    			navigator = init$1(routes$1, callback);
    			routes.set(routes$1);
    			navigator.updatePage();
    		});
    	};

    	onDestroy(cleanup);
    	const writable_props = ["routes", "config"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes$1 = $$props.routes);
    		if ("config" in $$props) $$invalidate(3, config = $$props.config);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		onDestroy,
    		Route,
    		Prefetcher,
    		init: init$1,
    		route,
    		routesStore: routes,
    		prefetchPath,
    		suppressWarnings,
    		defaultConfig,
    		routes: routes$1,
    		config,
    		layouts,
    		navigator,
    		updatePage,
    		callback,
    		cleanup,
    		initTimeout,
    		doInit,
    		$route
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes$1 = $$props.routes);
    		if ("config" in $$props) $$invalidate(3, config = $$props.config);
    		if ("layouts" in $$props) $$invalidate(0, layouts = $$props.layouts);
    		if ("navigator" in $$props) navigator = $$props.navigator;
    		if ("initTimeout" in $$props) initTimeout = $$props.initTimeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*routes*/ 4) {
    			 if (routes$1) doInit();
    		}
    	};

    	return [layouts, $route, routes$1, config];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { routes: 2, config: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*routes*/ ctx[2] === undefined && !("routes" in props)) {
    			console.warn("<Router> was created without expected prop 'routes'");
    		}
    	}

    	get routes() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get config() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /** 
     * Node payload
     * @typedef {Object} NodePayload
     * @property {RouteNode=} file current node
     * @property {RouteNode=} parent parent of the current node
     * @property {StateObject=} state state shared by every node in the walker
     * @property {Object=} scope scope inherited by descendants in the scope
     *
     * State Object
     * @typedef {Object} StateObject
     * @prop {TreePayload=} treePayload payload from the tree
     * 
     * Node walker proxy
     * @callback NodeWalkerProxy
     * @param {NodePayload} NodePayload
     */


    /**
     * Node middleware
     * @description Walks through the nodes of a tree
     * @example middleware = createNodeMiddleware(payload => {payload.file.name = 'hello'})(treePayload))
     * @param {NodeWalkerProxy} fn 
     */
    function createNodeMiddleware(fn) {

        /**    
         * NodeMiddleware payload receiver
         * @param {TreePayload} payload
         */
        const inner = async function execute(payload) {
            return await nodeMiddleware(payload.tree, fn, { state: { treePayload: payload } })
        };

        /**    
         * NodeMiddleware sync payload receiver
         * @param {TreePayload} payload
         */
        inner.sync = function executeSync(payload) {
            return nodeMiddlewareSync(payload.tree, fn, { state: { treePayload: payload } })
        };

        return inner
    }

    /**
     * Node walker
     * @param {Object} file mutable file
     * @param {NodeWalkerProxy} fn function to be called for each file
     * @param {NodePayload=} payload 
     */
    async function nodeMiddleware(file, fn, payload) {
        const { state, scope, parent } = payload || {};
        payload = {
            file,
            parent,
            state: state || {},            //state is shared by all files in the walk
            scope: clone(scope || {}),     //scope is inherited by descendants
        };

        await fn(payload);

        if (file.children) {
            payload.parent = file;
            await Promise.all(file.children.map(_file => nodeMiddleware(_file, fn, payload)));
        }
        return payload
    }

    /**
     * Node walker (sync version)
     * @param {Object} file mutable file
     * @param {NodeWalkerProxy} fn function to be called for each file
     * @param {NodePayload=} payload 
     */
    function nodeMiddlewareSync(file, fn, payload) {
        const { state, scope, parent } = payload || {};
        payload = {
            file,
            parent,
            state: state || {},            //state is shared by all files in the walk
            scope: clone(scope || {}),     //scope is inherited by descendants
        };

        fn(payload);

        if (file.children) {
            payload.parent = file;
            file.children.map(_file => nodeMiddlewareSync(_file, fn, payload));
        }
        return payload
    }


    /**
     * Clone with JSON
     * @param {T} obj 
     * @returns {T} JSON cloned object
     * @template T
     */
    function clone(obj) { return JSON.parse(JSON.stringify(obj)) }

    const setRegex = createNodeMiddleware(({ file }) => {
        if (file.isPage || file.isFallback)
            file.regex = pathToRegex(file.path, file.isFallback);
    });
    const setParamKeys = createNodeMiddleware(({ file }) => {
        file.paramKeys = pathToParamKeys(file.path);
    });

    const setShortPath = createNodeMiddleware(({ file }) => {
        if (file.isFallback || file.isIndex)
            file.shortPath = file.path.replace(/\/[^/]+$/, '');
        else file.shortPath = file.path;
    });
    const setRank = createNodeMiddleware(({ file }) => {
        file.ranking = pathToRank(file);
    });


    // todo delete?
    const addMetaChildren = createNodeMiddleware(({ file }) => {
        const node = file;
        const metaChildren = file.meta && file.meta.children || [];
        if (metaChildren.length) {
            node.children = node.children || [];
            node.children.push(...metaChildren.map(meta => ({ isMeta: true, ...meta, meta })));
        }
    });

    const setIsIndexable = createNodeMiddleware(payload => {
        const { file } = payload;
        const { isLayout, isFallback, meta } = file;
        file.isIndexable = !isLayout && !isFallback && meta.index !== false;
        file.isNonIndexable = !file.isIndexable;
    });


    const assignRelations = createNodeMiddleware(({ file, parent }) => {
        Object.defineProperty(file, 'parent', { get: () => parent });
        Object.defineProperty(file, 'nextSibling', { get: () => _getSibling(file, 1) });
        Object.defineProperty(file, 'prevSibling', { get: () => _getSibling(file, -1) });
        Object.defineProperty(file, 'lineage', { get: () => _getLineage(parent) });
    });

    function _getLineage(node, lineage = []){
        if(node){
            lineage.unshift(node);
            _getLineage(node.parent, lineage);
        }
        return lineage
    }

    /**
     * 
     * @param {RouteNode} file 
     * @param {Number} direction 
     */
    function _getSibling(file, direction) {
        if (!file.root) {
            const siblings = file.parent.children.filter(c => c.isIndexable);
            const index = siblings.indexOf(file);
            return siblings[index + direction]
        }
    }

    const assignIndex = createNodeMiddleware(({ file, parent }) => {
        if (file.isIndex) Object.defineProperty(parent, 'index', { get: () => file });
        if (file.isLayout)
            Object.defineProperty(parent, 'layout', { get: () => file });
    });

    const assignLayout = createNodeMiddleware(({ file, scope }) => {
        Object.defineProperty(file, 'layouts', { get: () => getLayouts(file) });
        function getLayouts(file) {
            const { parent } = file;
            const layout = parent && parent.layout;
            const isReset = layout && layout.isReset;
            const layouts = (parent && !isReset && getLayouts(parent)) || [];
            if (layout) layouts.push(layout);
            return layouts
        }
    });


    const createFlatList = treePayload => {
        createNodeMiddleware(payload => {
            if (payload.file.isPage || payload.file.isFallback)
            payload.state.treePayload.routes.push(payload.file);
        }).sync(treePayload);    
        treePayload.routes.sort((c, p) => (c.ranking >= p.ranking ? -1 : 1));
    };

    const setPrototype = createNodeMiddleware(({ file }) => {
        const Prototype = file.root
            ? Root
            : file.children
                ? file.isFile ? PageDir : Dir
                : file.isReset
                    ? Reset
                    : file.isLayout
                        ? Layout
                        : file.isFallback
                            ? Fallback
                            : Page;
        Object.setPrototypeOf(file, Prototype.prototype);

        function Layout() { }
        function Dir() { }
        function Fallback() { }
        function Page() { }
        function PageDir() { }
        function Reset() { }
        function Root() { }
    });

    var miscPlugins = /*#__PURE__*/Object.freeze({
        __proto__: null,
        setRegex: setRegex,
        setParamKeys: setParamKeys,
        setShortPath: setShortPath,
        setRank: setRank,
        addMetaChildren: addMetaChildren,
        setIsIndexable: setIsIndexable,
        assignRelations: assignRelations,
        assignIndex: assignIndex,
        assignLayout: assignLayout,
        createFlatList: createFlatList,
        setPrototype: setPrototype
    });

    const assignAPI = createNodeMiddleware(({ file }) => {
        file.api = new ClientApi(file);
    });

    class ClientApi {
        constructor(file) {
            this.__file = file;
            Object.defineProperty(this, '__file', { enumerable: false });
            this.isMeta = !!file.isMeta;
            this.path = file.path;
            this.title = _prettyName(file);
            this.meta = file.meta;
        }

        get parent() { return !this.__file.root && this.__file.parent.api }
        get children() {
            return (this.__file.children || this.__file.isLayout && this.__file.parent.children || [])
                .filter(c => !c.isNonIndexable)
                .sort((a, b) => {
                    if(a.isMeta && b.isMeta) return 0
                    a = (a.meta.index || a.meta.title || a.path).toString();
                    b = (b.meta.index || b.meta.title || b.path).toString();
                    return a.localeCompare((b), undefined, { numeric: true, sensitivity: 'base' })
                })
                .map(({ api }) => api)
        }
        get next() { return _navigate(this, +1) }
        get prev() { return _navigate(this, -1) }
        preload() {
            this.__file.layouts.forEach(file => file.component());
            this.__file.component(); 
        }
    }

    function _navigate(node, direction) {
        if (!node.__file.root) {
            const siblings = node.parent.children;
            const index = siblings.indexOf(node);
            return node.parent.children[index + direction]
        }
    }


    function _prettyName(file) {
        if (typeof file.meta.title !== 'undefined') return file.meta.title
        else return (file.shortPath || file.path)
            .split('/')
            .pop()
            .replace(/-/g, ' ')
    }

    const plugins = {...miscPlugins, assignAPI};

    function buildClientTree(tree) {
      const order = [
        // pages
        "setParamKeys", //pages only
        "setRegex", //pages only
        "setShortPath", //pages only
        "setRank", //pages only
        "assignLayout", //pages only,
        // all
        "setPrototype",
        "addMetaChildren",
        "assignRelations", //all (except meta components?)
        "setIsIndexable", //all
        "assignIndex", //all
        "assignAPI", //all
        // routes
        "createFlatList"
      ];

      const payload = { tree, routes: [] };
      for (let name of order) {
        const syncFn = plugins[name].sync || plugins[name];
        syncFn(payload);
      }
      return payload
    }

    /* src\components\Header.svelte generated by Svelte v3.24.1 */

    const file$2 = "src\\components\\Header.svelte";

    function create_fragment$3(ctx) {
    	let nav;
    	let div1;
    	let a0;
    	let strong;
    	let t1;
    	let button0;
    	let span;
    	let t2;
    	let div0;
    	let ul1;
    	let li0;
    	let a1;
    	let t4;
    	let li1;
    	let a2;
    	let t6;
    	let li5;
    	let a3;
    	let t8;
    	let ul0;
    	let li2;
    	let a4;
    	let t10;
    	let li3;
    	let a5;
    	let t12;
    	let li4;
    	let a6;
    	let t14;
    	let form;
    	let input;
    	let t15;
    	let br;
    	let t16;
    	let button1;
    	let t18;
    	let button2;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div1 = element("div");
    			a0 = element("a");
    			strong = element("strong");
    			strong.textContent = "Navbar";
    			t1 = space();
    			button0 = element("button");
    			span = element("span");
    			t2 = space();
    			div0 = element("div");
    			ul1 = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Home";
    			t4 = space();
    			li1 = element("li");
    			a2 = element("a");
    			a2.textContent = "Features";
    			t6 = space();
    			li5 = element("li");
    			a3 = element("a");
    			a3.textContent = "Dropdown";
    			t8 = space();
    			ul0 = element("ul");
    			li2 = element("li");
    			a4 = element("a");
    			a4.textContent = "Action";
    			t10 = space();
    			li3 = element("li");
    			a5 = element("a");
    			a5.textContent = "Another action";
    			t12 = space();
    			li4 = element("li");
    			a6 = element("a");
    			a6.textContent = "Something else here";
    			t14 = space();
    			form = element("form");
    			input = element("input");
    			t15 = space();
    			br = element("br");
    			t16 = space();
    			button1 = element("button");
    			button1.textContent = "Daftar";
    			t18 = space();
    			button2 = element("button");
    			button2.textContent = "Masuk";
    			add_location(strong, file$2, 3, 46, 183);
    			attr_dev(a0, "class", "ml-3 navbar-brand");
    			attr_dev(a0, "href", "#");
    			add_location(a0, file$2, 3, 8, 145);
    			attr_dev(span, "class", "navbar-toggler-icon");
    			add_location(span, file$2, 7, 12, 456);
    			attr_dev(button0, "class", "navbar-toggler");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "data-toggle", "collapse");
    			attr_dev(button0, "data-target", "#navbarsExample03");
    			attr_dev(button0, "aria-controls", "navbarsExample03 p-0 border-0");
    			attr_dev(button0, "aria-expanded", "false");
    			attr_dev(button0, "aria-label", "Toggle navigation");
    			add_location(button0, file$2, 5, 8, 230);
    			attr_dev(a1, "class", "nav-link");
    			attr_dev(a1, "aria-current", "page");
    			attr_dev(a1, "href", "#");
    			add_location(a1, file$2, 13, 20, 719);
    			attr_dev(li0, "class", "nav-item active");
    			add_location(li0, file$2, 12, 16, 669);
    			attr_dev(a2, "class", "nav-link");
    			attr_dev(a2, "href", "#");
    			add_location(a2, file$2, 16, 20, 860);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$2, 15, 16, 817);
    			attr_dev(a3, "class", "nav-link dropdown-toggle");
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "id", "dropdown03");
    			attr_dev(a3, "data-toggle", "dropdown");
    			attr_dev(a3, "aria-expanded", "false");
    			add_location(a3, file$2, 20, 20, 1016);
    			attr_dev(a4, "class", "dropdown-item");
    			attr_dev(a4, "href", "#");
    			add_location(a4, file$2, 23, 28, 1266);
    			add_location(li2, file$2, 23, 24, 1262);
    			attr_dev(a5, "class", "dropdown-item");
    			attr_dev(a5, "href", "#");
    			add_location(a5, file$2, 24, 28, 1345);
    			add_location(li3, file$2, 24, 24, 1341);
    			attr_dev(a6, "class", "dropdown-item");
    			attr_dev(a6, "href", "#");
    			add_location(a6, file$2, 25, 28, 1432);
    			add_location(li4, file$2, 25, 24, 1428);
    			attr_dev(ul0, "class", "dropdown-menu");
    			attr_dev(ul0, "aria-labelledby", "dropdown03");
    			add_location(ul0, file$2, 22, 20, 1181);
    			attr_dev(li5, "class", "nav-item dropdown");
    			add_location(li5, file$2, 19, 16, 964);
    			attr_dev(ul1, "class", "navbar-nav mr-auto mb-2 mb-sm-0");
    			add_location(ul1, file$2, 11, 12, 607);
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Search");
    			attr_dev(input, "aria-label", "Search");
    			add_location(input, file$2, 30, 16, 1614);
    			attr_dev(form, "class", "mr-5");
    			add_location(form, file$2, 29, 12, 1577);
    			add_location(br, file$2, 32, 12, 1730);
    			attr_dev(button1, "class", "btn btn-outline-success mr-3");
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "data-toggle", "modal");
    			attr_dev(button1, "data-target", "#modalDaftar");
    			add_location(button1, file$2, 33, 12, 1748);
    			attr_dev(button2, "class", "btn btn-primary mr-3");
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "data-toggle", "modal");
    			attr_dev(button2, "data-target", "#modalMasuk");
    			add_location(button2, file$2, 35, 12, 1900);
    			attr_dev(div0, "class", "ml-3 collapse navbar-collapse");
    			attr_dev(div0, "id", "navbarsExample03");
    			add_location(div0, file$2, 10, 8, 528);
    			attr_dev(div1, "class", "container-fluid");
    			add_location(div1, file$2, 2, 4, 106);
    			attr_dev(nav, "class", "navbar navbar-expand-md navbar-dark bg-gradient-1 bg-dark shadow-md");
    			add_location(nav, file$2, 1, 0, 19);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div1);
    			append_dev(div1, a0);
    			append_dev(a0, strong);
    			append_dev(div1, t1);
    			append_dev(div1, button0);
    			append_dev(button0, span);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, ul1);
    			append_dev(ul1, li0);
    			append_dev(li0, a1);
    			append_dev(ul1, t4);
    			append_dev(ul1, li1);
    			append_dev(li1, a2);
    			append_dev(ul1, t6);
    			append_dev(ul1, li5);
    			append_dev(li5, a3);
    			append_dev(li5, t8);
    			append_dev(li5, ul0);
    			append_dev(ul0, li2);
    			append_dev(li2, a4);
    			append_dev(ul0, t10);
    			append_dev(ul0, li3);
    			append_dev(li3, a5);
    			append_dev(ul0, t12);
    			append_dev(ul0, li4);
    			append_dev(li4, a6);
    			append_dev(div0, t14);
    			append_dev(div0, form);
    			append_dev(form, input);
    			append_dev(div0, t15);
    			append_dev(div0, br);
    			append_dev(div0, t16);
    			append_dev(div0, button1);
    			append_dev(div0, t18);
    			append_dev(div0, button2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
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

    function instance$3($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\Footer.svelte generated by Svelte v3.24.1 */

    const file$3 = "src\\components\\Footer.svelte";

    function create_fragment$4(ctx) {
    	let footer;
    	let div4;
    	let br;
    	let t0;
    	let div3;
    	let div0;
    	let h50;
    	let t2;
    	let ul0;
    	let li0;
    	let a0;
    	let t4;
    	let li1;
    	let a1;
    	let t6;
    	let li2;
    	let a2;
    	let t8;
    	let li3;
    	let a3;
    	let t10;
    	let li4;
    	let a4;
    	let t12;
    	let li5;
    	let a5;
    	let t14;
    	let div1;
    	let h51;
    	let t16;
    	let ul1;
    	let li6;
    	let a6;
    	let t18;
    	let li7;
    	let a7;
    	let t20;
    	let li8;
    	let a8;
    	let t22;
    	let li9;
    	let a9;
    	let t24;
    	let div2;
    	let h52;
    	let t26;
    	let ul2;
    	let li10;
    	let a10;
    	let t28;
    	let li11;
    	let a11;
    	let t30;
    	let li12;
    	let a12;
    	let t32;
    	let li13;
    	let a13;
    	let t34;
    	let span;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div4 = element("div");
    			br = element("br");
    			t0 = space();
    			div3 = element("div");
    			div0 = element("div");
    			h50 = element("h5");
    			h50.textContent = "Features";
    			t2 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Cool stuff";
    			t4 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Random feature";
    			t6 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Team feature";
    			t8 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "Stuff for developers";
    			t10 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "Another one";
    			t12 = space();
    			li5 = element("li");
    			a5 = element("a");
    			a5.textContent = "Last time";
    			t14 = space();
    			div1 = element("div");
    			h51 = element("h5");
    			h51.textContent = "Resources";
    			t16 = space();
    			ul1 = element("ul");
    			li6 = element("li");
    			a6 = element("a");
    			a6.textContent = "Resource";
    			t18 = space();
    			li7 = element("li");
    			a7 = element("a");
    			a7.textContent = "Resource name";
    			t20 = space();
    			li8 = element("li");
    			a8 = element("a");
    			a8.textContent = "Another resource";
    			t22 = space();
    			li9 = element("li");
    			a9 = element("a");
    			a9.textContent = "Final resource";
    			t24 = space();
    			div2 = element("div");
    			h52 = element("h5");
    			h52.textContent = "About";
    			t26 = space();
    			ul2 = element("ul");
    			li10 = element("li");
    			a10 = element("a");
    			a10.textContent = "Team";
    			t28 = space();
    			li11 = element("li");
    			a11 = element("a");
    			a11.textContent = "Locations";
    			t30 = space();
    			li12 = element("li");
    			a12 = element("a");
    			a12.textContent = "Privacy";
    			t32 = space();
    			li13 = element("li");
    			a13 = element("a");
    			a13.textContent = "Terms";
    			t34 = space();
    			span = element("span");
    			span.textContent = "©Copyright 2020 | Nurya M";
    			add_location(br, file$3, 2, 8, 95);
    			add_location(h50, file$3, 5, 16, 195);
    			attr_dev(a0, "class", "link-secondary text-decoration-none");
    			attr_dev(a0, "href", "#");
    			add_location(a0, file$3, 7, 24, 293);
    			add_location(li0, file$3, 7, 20, 289);
    			attr_dev(a1, "class", "link-secondary text-decoration-none");
    			attr_dev(a1, "href", "#");
    			add_location(a1, file$3, 8, 24, 394);
    			add_location(li1, file$3, 8, 20, 390);
    			attr_dev(a2, "class", "link-secondary text-decoration-none");
    			attr_dev(a2, "href", "#");
    			add_location(a2, file$3, 9, 24, 499);
    			add_location(li2, file$3, 9, 20, 495);
    			attr_dev(a3, "class", "link-secondary text-decoration-none");
    			attr_dev(a3, "href", "#");
    			add_location(a3, file$3, 10, 24, 602);
    			add_location(li3, file$3, 10, 20, 598);
    			attr_dev(a4, "class", "link-secondary text-decoration-none");
    			attr_dev(a4, "href", "#");
    			add_location(a4, file$3, 11, 24, 713);
    			add_location(li4, file$3, 11, 20, 709);
    			attr_dev(a5, "class", "link-secondary text-decoration-none");
    			attr_dev(a5, "href", "#");
    			add_location(a5, file$3, 12, 24, 815);
    			add_location(li5, file$3, 12, 20, 811);
    			attr_dev(ul0, "class", "list-unstyled text-small");
    			add_location(ul0, file$3, 6, 16, 230);
    			attr_dev(div0, "class", "col-6 col-md");
    			add_location(div0, file$3, 4, 12, 151);
    			add_location(h51, file$3, 16, 16, 990);
    			attr_dev(a6, "class", "link-secondary text-decoration-none");
    			attr_dev(a6, "href", "#");
    			add_location(a6, file$3, 18, 24, 1089);
    			add_location(li6, file$3, 18, 20, 1085);
    			attr_dev(a7, "class", "link-secondary text-decoration-none");
    			attr_dev(a7, "href", "#");
    			add_location(a7, file$3, 19, 24, 1188);
    			add_location(li7, file$3, 19, 20, 1184);
    			attr_dev(a8, "class", "link-secondary text-decoration-none");
    			attr_dev(a8, "href", "#");
    			add_location(a8, file$3, 20, 24, 1292);
    			add_location(li8, file$3, 20, 20, 1288);
    			attr_dev(a9, "class", "link-secondary text-decoration-none");
    			attr_dev(a9, "href", "#");
    			add_location(a9, file$3, 21, 24, 1399);
    			add_location(li9, file$3, 21, 20, 1395);
    			attr_dev(ul1, "class", "list-unstyled text-small");
    			add_location(ul1, file$3, 17, 16, 1026);
    			attr_dev(div1, "class", "col-6 col-md");
    			add_location(div1, file$3, 15, 12, 946);
    			add_location(h52, file$3, 25, 16, 1579);
    			attr_dev(a10, "class", "link-secondary text-decoration-none");
    			attr_dev(a10, "href", "#");
    			add_location(a10, file$3, 27, 24, 1674);
    			add_location(li10, file$3, 27, 20, 1670);
    			attr_dev(a11, "class", "link-secondary text-decoration-none");
    			attr_dev(a11, "href", "#");
    			add_location(a11, file$3, 28, 24, 1769);
    			add_location(li11, file$3, 28, 20, 1765);
    			attr_dev(a12, "class", "link-secondary text-decoration-none");
    			attr_dev(a12, "href", "#");
    			add_location(a12, file$3, 29, 24, 1869);
    			add_location(li12, file$3, 29, 20, 1865);
    			attr_dev(a13, "class", "link-secondary text-decoration-none");
    			attr_dev(a13, "href", "#");
    			add_location(a13, file$3, 30, 24, 1967);
    			add_location(li13, file$3, 30, 20, 1963);
    			attr_dev(ul2, "class", "list-unstyled text-small");
    			add_location(ul2, file$3, 26, 16, 1611);
    			attr_dev(div2, "class", "col-6 col-md");
    			add_location(div2, file$3, 24, 12, 1535);
    			attr_dev(div3, "class", "row text-white");
    			add_location(div3, file$3, 3, 8, 109);
    			attr_dev(span, "class", "text-muted");
    			add_location(span, file$3, 35, 8, 2108);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$3, 1, 4, 62);
    			attr_dev(footer, "class", "footer text-center mt-auto py-3 bg-dark");
    			add_location(footer, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div4);
    			append_dev(div4, br);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h50);
    			append_dev(div0, t2);
    			append_dev(div0, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a0);
    			append_dev(ul0, t4);
    			append_dev(ul0, li1);
    			append_dev(li1, a1);
    			append_dev(ul0, t6);
    			append_dev(ul0, li2);
    			append_dev(li2, a2);
    			append_dev(ul0, t8);
    			append_dev(ul0, li3);
    			append_dev(li3, a3);
    			append_dev(ul0, t10);
    			append_dev(ul0, li4);
    			append_dev(li4, a4);
    			append_dev(ul0, t12);
    			append_dev(ul0, li5);
    			append_dev(li5, a5);
    			append_dev(div3, t14);
    			append_dev(div3, div1);
    			append_dev(div1, h51);
    			append_dev(div1, t16);
    			append_dev(div1, ul1);
    			append_dev(ul1, li6);
    			append_dev(li6, a6);
    			append_dev(ul1, t18);
    			append_dev(ul1, li7);
    			append_dev(li7, a7);
    			append_dev(ul1, t20);
    			append_dev(ul1, li8);
    			append_dev(li8, a8);
    			append_dev(ul1, t22);
    			append_dev(ul1, li9);
    			append_dev(li9, a9);
    			append_dev(div3, t24);
    			append_dev(div3, div2);
    			append_dev(div2, h52);
    			append_dev(div2, t26);
    			append_dev(div2, ul2);
    			append_dev(ul2, li10);
    			append_dev(li10, a10);
    			append_dev(ul2, t28);
    			append_dev(ul2, li11);
    			append_dev(li11, a11);
    			append_dev(ul2, t30);
    			append_dev(ul2, li12);
    			append_dev(li12, a12);
    			append_dev(ul2, t32);
    			append_dev(ul2, li13);
    			append_dev(li13, a13);
    			append_dev(div4, t34);
    			append_dev(div4, span);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
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

    function instance$4($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Footer", $$slots, []);
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\pages\_layout.svelte generated by Svelte v3.24.1 */
    const file$4 = "src\\pages\\_layout.svelte";

    function create_fragment$5(ctx) {
    	let header;
    	let t0;
    	let main;
    	let t1;
    	let footer;
    	let current;
    	header = new Header({ $$inline: true });
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			main = element("main");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			create_component(footer.$$.fragment);
    			add_location(main, file$4, 6, 0, 145);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);

    			if (default_slot) {
    				default_slot.m(main, null);
    			}

    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(default_slot, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(default_slot, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layout> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Layout", $$slots, ['default']);

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Header, Footer });
    	return [$$scope, $$slots];
    }

    class Layout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\pages\index.svelte generated by Svelte v3.24.1 */

    const file$5 = "src\\pages\\index.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let h10;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let a0;
    	let t5;
    	let div50;
    	let div49;
    	let div2;
    	let h11;
    	let t7;
    	let br0;
    	let t8;
    	let div48;
    	let div7;
    	let div6;
    	let svg0;
    	let title0;
    	let t9;
    	let rect0;
    	let text0;
    	let t10;
    	let t11;
    	let div5;
    	let p2;
    	let t13;
    	let div4;
    	let div3;
    	let button0;
    	let t15;
    	let button1;
    	let t17;
    	let small0;
    	let t19;
    	let div12;
    	let div11;
    	let svg1;
    	let title1;
    	let t20;
    	let rect1;
    	let text1;
    	let t21;
    	let t22;
    	let div10;
    	let p3;
    	let t24;
    	let div9;
    	let div8;
    	let button2;
    	let t26;
    	let button3;
    	let t28;
    	let small1;
    	let t30;
    	let div17;
    	let div16;
    	let svg2;
    	let title2;
    	let t31;
    	let rect2;
    	let text2;
    	let t32;
    	let t33;
    	let div15;
    	let p4;
    	let t35;
    	let div14;
    	let div13;
    	let button4;
    	let t37;
    	let button5;
    	let t39;
    	let small2;
    	let t41;
    	let div22;
    	let div21;
    	let svg3;
    	let title3;
    	let t42;
    	let rect3;
    	let text3;
    	let t43;
    	let t44;
    	let div20;
    	let p5;
    	let t46;
    	let div19;
    	let div18;
    	let button6;
    	let t48;
    	let button7;
    	let t50;
    	let small3;
    	let t52;
    	let div27;
    	let div26;
    	let svg4;
    	let title4;
    	let t53;
    	let rect4;
    	let text4;
    	let t54;
    	let t55;
    	let div25;
    	let p6;
    	let t57;
    	let div24;
    	let div23;
    	let button8;
    	let t59;
    	let button9;
    	let t61;
    	let small4;
    	let t63;
    	let div32;
    	let div31;
    	let svg5;
    	let title5;
    	let t64;
    	let rect5;
    	let text5;
    	let t65;
    	let t66;
    	let div30;
    	let p7;
    	let t68;
    	let div29;
    	let div28;
    	let button10;
    	let t70;
    	let button11;
    	let t72;
    	let small5;
    	let t74;
    	let div37;
    	let div36;
    	let svg6;
    	let title6;
    	let t75;
    	let rect6;
    	let text6;
    	let t76;
    	let t77;
    	let div35;
    	let p8;
    	let t79;
    	let div34;
    	let div33;
    	let button12;
    	let t81;
    	let button13;
    	let t83;
    	let small6;
    	let t85;
    	let div42;
    	let div41;
    	let svg7;
    	let title7;
    	let t86;
    	let rect7;
    	let text7;
    	let t87;
    	let t88;
    	let div40;
    	let p9;
    	let t90;
    	let div39;
    	let div38;
    	let button14;
    	let t92;
    	let button15;
    	let t94;
    	let small7;
    	let t96;
    	let div47;
    	let div46;
    	let svg8;
    	let title8;
    	let t97;
    	let rect8;
    	let text8;
    	let t98;
    	let t99;
    	let div45;
    	let p10;
    	let t101;
    	let div44;
    	let div43;
    	let button16;
    	let t103;
    	let button17;
    	let t105;
    	let small8;
    	let t107;
    	let br1;
    	let t108;
    	let nav;
    	let ul;
    	let li0;
    	let a1;
    	let t110;
    	let li1;
    	let span1;
    	let t111;
    	let span0;
    	let t113;
    	let li2;
    	let a2;
    	let t115;
    	let li3;
    	let a3;
    	let t117;
    	let li4;
    	let a4;
    	let t119;
    	let hr;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Title of a longer featured blog post";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Multiple lines of text that form the lede, informing new readers quickly and efficiently\r\n            about what’s most interesting in this post’s contents.";
    			t3 = space();
    			p1 = element("p");
    			a0 = element("a");
    			a0.textContent = "Continue reading...";
    			t5 = space();
    			div50 = element("div");
    			div49 = element("div");
    			div2 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Features";
    			t7 = space();
    			br0 = element("br");
    			t8 = space();
    			div48 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			svg0 = svg_element("svg");
    			title0 = svg_element("title");
    			t9 = text("Placeholder");
    			rect0 = svg_element("rect");
    			text0 = svg_element("text");
    			t10 = text("Thumbnail");
    			t11 = space();
    			div5 = element("div");
    			p2 = element("p");
    			p2.textContent = "This is a wider card with supporting text below as a natural lead-in to\r\n                            additional content. This content is a little bit longer.";
    			t13 = space();
    			div4 = element("div");
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "View";
    			t15 = space();
    			button1 = element("button");
    			button1.textContent = "Edit";
    			t17 = space();
    			small0 = element("small");
    			small0.textContent = "9 mins";
    			t19 = space();
    			div12 = element("div");
    			div11 = element("div");
    			svg1 = svg_element("svg");
    			title1 = svg_element("title");
    			t20 = text("Placeholder");
    			rect1 = svg_element("rect");
    			text1 = svg_element("text");
    			t21 = text("Thumbnail");
    			t22 = space();
    			div10 = element("div");
    			p3 = element("p");
    			p3.textContent = "This is a wider card with supporting text below as a natural lead-in to\r\n                            additional content. This content is a little bit longer.";
    			t24 = space();
    			div9 = element("div");
    			div8 = element("div");
    			button2 = element("button");
    			button2.textContent = "View";
    			t26 = space();
    			button3 = element("button");
    			button3.textContent = "Edit";
    			t28 = space();
    			small1 = element("small");
    			small1.textContent = "9 mins";
    			t30 = space();
    			div17 = element("div");
    			div16 = element("div");
    			svg2 = svg_element("svg");
    			title2 = svg_element("title");
    			t31 = text("Placeholder");
    			rect2 = svg_element("rect");
    			text2 = svg_element("text");
    			t32 = text("Thumbnail");
    			t33 = space();
    			div15 = element("div");
    			p4 = element("p");
    			p4.textContent = "This is a wider card with supporting text below as a natural lead-in to\r\n                            additional content. This content is a little bit longer.";
    			t35 = space();
    			div14 = element("div");
    			div13 = element("div");
    			button4 = element("button");
    			button4.textContent = "View";
    			t37 = space();
    			button5 = element("button");
    			button5.textContent = "Edit";
    			t39 = space();
    			small2 = element("small");
    			small2.textContent = "9 mins";
    			t41 = space();
    			div22 = element("div");
    			div21 = element("div");
    			svg3 = svg_element("svg");
    			title3 = svg_element("title");
    			t42 = text("Placeholder");
    			rect3 = svg_element("rect");
    			text3 = svg_element("text");
    			t43 = text("Thumbnail");
    			t44 = space();
    			div20 = element("div");
    			p5 = element("p");
    			p5.textContent = "This is a wider card with supporting text below as a natural lead-in to\r\n                            additional content. This content is a little bit longer.";
    			t46 = space();
    			div19 = element("div");
    			div18 = element("div");
    			button6 = element("button");
    			button6.textContent = "View";
    			t48 = space();
    			button7 = element("button");
    			button7.textContent = "Edit";
    			t50 = space();
    			small3 = element("small");
    			small3.textContent = "9 mins";
    			t52 = space();
    			div27 = element("div");
    			div26 = element("div");
    			svg4 = svg_element("svg");
    			title4 = svg_element("title");
    			t53 = text("Placeholder");
    			rect4 = svg_element("rect");
    			text4 = svg_element("text");
    			t54 = text("Thumbnail");
    			t55 = space();
    			div25 = element("div");
    			p6 = element("p");
    			p6.textContent = "This is a wider card with supporting text below as a natural lead-in to\r\n                            additional content. This content is a little bit longer.";
    			t57 = space();
    			div24 = element("div");
    			div23 = element("div");
    			button8 = element("button");
    			button8.textContent = "View";
    			t59 = space();
    			button9 = element("button");
    			button9.textContent = "Edit";
    			t61 = space();
    			small4 = element("small");
    			small4.textContent = "9 mins";
    			t63 = space();
    			div32 = element("div");
    			div31 = element("div");
    			svg5 = svg_element("svg");
    			title5 = svg_element("title");
    			t64 = text("Placeholder");
    			rect5 = svg_element("rect");
    			text5 = svg_element("text");
    			t65 = text("Thumbnail");
    			t66 = space();
    			div30 = element("div");
    			p7 = element("p");
    			p7.textContent = "This is a wider card with supporting text below as a natural lead-in to\r\n                            additional content. This content is a little bit longer.";
    			t68 = space();
    			div29 = element("div");
    			div28 = element("div");
    			button10 = element("button");
    			button10.textContent = "View";
    			t70 = space();
    			button11 = element("button");
    			button11.textContent = "Edit";
    			t72 = space();
    			small5 = element("small");
    			small5.textContent = "9 mins";
    			t74 = space();
    			div37 = element("div");
    			div36 = element("div");
    			svg6 = svg_element("svg");
    			title6 = svg_element("title");
    			t75 = text("Placeholder");
    			rect6 = svg_element("rect");
    			text6 = svg_element("text");
    			t76 = text("Thumbnail");
    			t77 = space();
    			div35 = element("div");
    			p8 = element("p");
    			p8.textContent = "This is a wider card with supporting text below as a natural lead-in to\r\n                            additional content. This content is a little bit longer.";
    			t79 = space();
    			div34 = element("div");
    			div33 = element("div");
    			button12 = element("button");
    			button12.textContent = "View";
    			t81 = space();
    			button13 = element("button");
    			button13.textContent = "Edit";
    			t83 = space();
    			small6 = element("small");
    			small6.textContent = "9 mins";
    			t85 = space();
    			div42 = element("div");
    			div41 = element("div");
    			svg7 = svg_element("svg");
    			title7 = svg_element("title");
    			t86 = text("Placeholder");
    			rect7 = svg_element("rect");
    			text7 = svg_element("text");
    			t87 = text("Thumbnail");
    			t88 = space();
    			div40 = element("div");
    			p9 = element("p");
    			p9.textContent = "This is a wider card with supporting text below as a natural lead-in to\r\n                            additional content. This content is a little bit longer.";
    			t90 = space();
    			div39 = element("div");
    			div38 = element("div");
    			button14 = element("button");
    			button14.textContent = "View";
    			t92 = space();
    			button15 = element("button");
    			button15.textContent = "Edit";
    			t94 = space();
    			small7 = element("small");
    			small7.textContent = "9 mins";
    			t96 = space();
    			div47 = element("div");
    			div46 = element("div");
    			svg8 = svg_element("svg");
    			title8 = svg_element("title");
    			t97 = text("Placeholder");
    			rect8 = svg_element("rect");
    			text8 = svg_element("text");
    			t98 = text("Thumbnail");
    			t99 = space();
    			div45 = element("div");
    			p10 = element("p");
    			p10.textContent = "This is a wider card with supporting text below as a natural lead-in to\r\n                            additional content. This content is a little bit longer.";
    			t101 = space();
    			div44 = element("div");
    			div43 = element("div");
    			button16 = element("button");
    			button16.textContent = "View";
    			t103 = space();
    			button17 = element("button");
    			button17.textContent = "Edit";
    			t105 = space();
    			small8 = element("small");
    			small8.textContent = "9 mins";
    			t107 = space();
    			br1 = element("br");
    			t108 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Previous";
    			t110 = space();
    			li1 = element("li");
    			span1 = element("span");
    			t111 = text("1\r\n                        ");
    			span0 = element("span");
    			span0.textContent = "(current)";
    			t113 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "2";
    			t115 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "3";
    			t117 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "Next";
    			t119 = space();
    			hr = element("hr");
    			attr_dev(h10, "class", "display-4 font-italic");
    			add_location(h10, file$5, 2, 8, 91);
    			attr_dev(p0, "class", "lead my-3");
    			add_location(p0, file$5, 3, 8, 176);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "text-white font-weight-bold");
    			add_location(a0, file$5, 5, 29, 388);
    			attr_dev(p1, "class", "lead mb-0");
    			add_location(p1, file$5, 5, 8, 367);
    			attr_dev(div0, "class", "col-md-6 px-0");
    			add_location(div0, file$5, 1, 4, 54);
    			attr_dev(div1, "class", "p-5 p-md-5 mb-5 text-white bg-dark");
    			add_location(div1, file$5, 0, 0, 0);
    			add_location(h11, file$5, 12, 12, 598);
    			attr_dev(div2, "class", "text-center");
    			add_location(div2, file$5, 11, 8, 559);
    			add_location(br0, file$5, 14, 8, 641);
    			add_location(title0, file$5, 21, 24, 1112);
    			attr_dev(rect0, "width", "100%");
    			attr_dev(rect0, "height", "100%");
    			attr_dev(rect0, "fill", "#55595c");
    			add_location(rect0, file$5, 22, 24, 1164);
    			attr_dev(text0, "x", "50%");
    			attr_dev(text0, "y", "50%");
    			attr_dev(text0, "fill", "#eceeef");
    			attr_dev(text0, "dy", ".3em");
    			add_location(text0, file$5, 22, 74, 1214);
    			attr_dev(svg0, "class", "bd-placeholder-img card-img-top svelte-1oi6kv6");
    			attr_dev(svg0, "width", "100%");
    			attr_dev(svg0, "height", "225");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "aria-label", "Placeholder: Thumbnail");
    			attr_dev(svg0, "preserveAspectRatio", "xMidYMid slice");
    			attr_dev(svg0, "role", "img");
    			attr_dev(svg0, "focusable", "false");
    			add_location(svg0, file$5, 18, 20, 828);
    			attr_dev(p2, "class", "card-text");
    			add_location(p2, file$5, 27, 24, 1407);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button0, file$5, 31, 32, 1765);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button1, file$5, 32, 32, 1875);
    			attr_dev(div3, "class", "btn-group");
    			add_location(div3, file$5, 30, 28, 1708);
    			attr_dev(small0, "class", "text-muted");
    			add_location(small0, file$5, 34, 28, 2017);
    			attr_dev(div4, "class", "d-flex justify-content-between align-items-center");
    			add_location(div4, file$5, 29, 24, 1615);
    			attr_dev(div5, "class", "card-body");
    			add_location(div5, file$5, 26, 20, 1358);
    			attr_dev(div6, "class", "card shadow-md");
    			add_location(div6, file$5, 17, 16, 778);
    			attr_dev(div7, "class", "col");
    			add_location(div7, file$5, 16, 12, 743);
    			add_location(title1, file$5, 44, 24, 2544);
    			attr_dev(rect1, "width", "100%");
    			attr_dev(rect1, "height", "100%");
    			attr_dev(rect1, "fill", "#55595c");
    			add_location(rect1, file$5, 45, 24, 2596);
    			attr_dev(text1, "x", "50%");
    			attr_dev(text1, "y", "50%");
    			attr_dev(text1, "fill", "#eceeef");
    			attr_dev(text1, "dy", ".3em");
    			add_location(text1, file$5, 45, 74, 2646);
    			attr_dev(svg1, "class", "bd-placeholder-img card-img-top svelte-1oi6kv6");
    			attr_dev(svg1, "width", "100%");
    			attr_dev(svg1, "height", "225");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "aria-label", "Placeholder: Thumbnail");
    			attr_dev(svg1, "preserveAspectRatio", "xMidYMid slice");
    			attr_dev(svg1, "role", "img");
    			attr_dev(svg1, "focusable", "false");
    			add_location(svg1, file$5, 41, 20, 2260);
    			attr_dev(p3, "class", "card-text");
    			add_location(p3, file$5, 50, 24, 2839);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button2, file$5, 54, 32, 3197);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button3, file$5, 55, 32, 3307);
    			attr_dev(div8, "class", "btn-group");
    			add_location(div8, file$5, 53, 28, 3140);
    			attr_dev(small1, "class", "text-muted");
    			add_location(small1, file$5, 57, 28, 3449);
    			attr_dev(div9, "class", "d-flex justify-content-between align-items-center");
    			add_location(div9, file$5, 52, 24, 3047);
    			attr_dev(div10, "class", "card-body");
    			add_location(div10, file$5, 49, 20, 2790);
    			attr_dev(div11, "class", "card shadow-md");
    			add_location(div11, file$5, 40, 16, 2210);
    			attr_dev(div12, "class", "col");
    			add_location(div12, file$5, 39, 12, 2175);
    			add_location(title2, file$5, 67, 24, 3976);
    			attr_dev(rect2, "width", "100%");
    			attr_dev(rect2, "height", "100%");
    			attr_dev(rect2, "fill", "#55595c");
    			add_location(rect2, file$5, 68, 24, 4028);
    			attr_dev(text2, "x", "50%");
    			attr_dev(text2, "y", "50%");
    			attr_dev(text2, "fill", "#eceeef");
    			attr_dev(text2, "dy", ".3em");
    			add_location(text2, file$5, 68, 74, 4078);
    			attr_dev(svg2, "class", "bd-placeholder-img card-img-top svelte-1oi6kv6");
    			attr_dev(svg2, "width", "100%");
    			attr_dev(svg2, "height", "225");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "aria-label", "Placeholder: Thumbnail");
    			attr_dev(svg2, "preserveAspectRatio", "xMidYMid slice");
    			attr_dev(svg2, "role", "img");
    			attr_dev(svg2, "focusable", "false");
    			add_location(svg2, file$5, 64, 20, 3692);
    			attr_dev(p4, "class", "card-text");
    			add_location(p4, file$5, 73, 24, 4271);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button4, file$5, 77, 32, 4629);
    			attr_dev(button5, "type", "button");
    			attr_dev(button5, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button5, file$5, 78, 32, 4739);
    			attr_dev(div13, "class", "btn-group");
    			add_location(div13, file$5, 76, 28, 4572);
    			attr_dev(small2, "class", "text-muted");
    			add_location(small2, file$5, 80, 28, 4881);
    			attr_dev(div14, "class", "d-flex justify-content-between align-items-center");
    			add_location(div14, file$5, 75, 24, 4479);
    			attr_dev(div15, "class", "card-body");
    			add_location(div15, file$5, 72, 20, 4222);
    			attr_dev(div16, "class", "card shadow-md");
    			add_location(div16, file$5, 63, 16, 3642);
    			attr_dev(div17, "class", "col");
    			add_location(div17, file$5, 62, 12, 3607);
    			add_location(title3, file$5, 91, 24, 5410);
    			attr_dev(rect3, "width", "100%");
    			attr_dev(rect3, "height", "100%");
    			attr_dev(rect3, "fill", "#55595c");
    			add_location(rect3, file$5, 92, 24, 5462);
    			attr_dev(text3, "x", "50%");
    			attr_dev(text3, "y", "50%");
    			attr_dev(text3, "fill", "#eceeef");
    			attr_dev(text3, "dy", ".3em");
    			add_location(text3, file$5, 92, 74, 5512);
    			attr_dev(svg3, "class", "bd-placeholder-img card-img-top svelte-1oi6kv6");
    			attr_dev(svg3, "width", "100%");
    			attr_dev(svg3, "height", "225");
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "aria-label", "Placeholder: Thumbnail");
    			attr_dev(svg3, "preserveAspectRatio", "xMidYMid slice");
    			attr_dev(svg3, "role", "img");
    			attr_dev(svg3, "focusable", "false");
    			add_location(svg3, file$5, 88, 20, 5126);
    			attr_dev(p5, "class", "card-text");
    			add_location(p5, file$5, 97, 24, 5705);
    			attr_dev(button6, "type", "button");
    			attr_dev(button6, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button6, file$5, 101, 32, 6063);
    			attr_dev(button7, "type", "button");
    			attr_dev(button7, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button7, file$5, 102, 32, 6173);
    			attr_dev(div18, "class", "btn-group");
    			add_location(div18, file$5, 100, 28, 6006);
    			attr_dev(small3, "class", "text-muted");
    			add_location(small3, file$5, 104, 28, 6315);
    			attr_dev(div19, "class", "d-flex justify-content-between align-items-center");
    			add_location(div19, file$5, 99, 24, 5913);
    			attr_dev(div20, "class", "card-body");
    			add_location(div20, file$5, 96, 20, 5656);
    			attr_dev(div21, "class", "card shadow-md");
    			add_location(div21, file$5, 87, 16, 5076);
    			attr_dev(div22, "class", "col");
    			add_location(div22, file$5, 86, 12, 5041);
    			add_location(title4, file$5, 114, 24, 6842);
    			attr_dev(rect4, "width", "100%");
    			attr_dev(rect4, "height", "100%");
    			attr_dev(rect4, "fill", "#55595c");
    			add_location(rect4, file$5, 115, 24, 6894);
    			attr_dev(text4, "x", "50%");
    			attr_dev(text4, "y", "50%");
    			attr_dev(text4, "fill", "#eceeef");
    			attr_dev(text4, "dy", ".3em");
    			add_location(text4, file$5, 115, 74, 6944);
    			attr_dev(svg4, "class", "bd-placeholder-img card-img-top svelte-1oi6kv6");
    			attr_dev(svg4, "width", "100%");
    			attr_dev(svg4, "height", "225");
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg4, "aria-label", "Placeholder: Thumbnail");
    			attr_dev(svg4, "preserveAspectRatio", "xMidYMid slice");
    			attr_dev(svg4, "role", "img");
    			attr_dev(svg4, "focusable", "false");
    			add_location(svg4, file$5, 111, 20, 6558);
    			attr_dev(p6, "class", "card-text");
    			add_location(p6, file$5, 120, 24, 7137);
    			attr_dev(button8, "type", "button");
    			attr_dev(button8, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button8, file$5, 124, 32, 7495);
    			attr_dev(button9, "type", "button");
    			attr_dev(button9, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button9, file$5, 125, 32, 7605);
    			attr_dev(div23, "class", "btn-group");
    			add_location(div23, file$5, 123, 28, 7438);
    			attr_dev(small4, "class", "text-muted");
    			add_location(small4, file$5, 127, 28, 7747);
    			attr_dev(div24, "class", "d-flex justify-content-between align-items-center");
    			add_location(div24, file$5, 122, 24, 7345);
    			attr_dev(div25, "class", "card-body");
    			add_location(div25, file$5, 119, 20, 7088);
    			attr_dev(div26, "class", "card shadow-md");
    			add_location(div26, file$5, 110, 16, 6508);
    			attr_dev(div27, "class", "col");
    			add_location(div27, file$5, 109, 12, 6473);
    			add_location(title5, file$5, 137, 24, 8274);
    			attr_dev(rect5, "width", "100%");
    			attr_dev(rect5, "height", "100%");
    			attr_dev(rect5, "fill", "#55595c");
    			add_location(rect5, file$5, 138, 24, 8326);
    			attr_dev(text5, "x", "50%");
    			attr_dev(text5, "y", "50%");
    			attr_dev(text5, "fill", "#eceeef");
    			attr_dev(text5, "dy", ".3em");
    			add_location(text5, file$5, 138, 74, 8376);
    			attr_dev(svg5, "class", "bd-placeholder-img card-img-top svelte-1oi6kv6");
    			attr_dev(svg5, "width", "100%");
    			attr_dev(svg5, "height", "225");
    			attr_dev(svg5, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg5, "aria-label", "Placeholder: Thumbnail");
    			attr_dev(svg5, "preserveAspectRatio", "xMidYMid slice");
    			attr_dev(svg5, "role", "img");
    			attr_dev(svg5, "focusable", "false");
    			add_location(svg5, file$5, 134, 20, 7990);
    			attr_dev(p7, "class", "card-text");
    			add_location(p7, file$5, 143, 24, 8569);
    			attr_dev(button10, "type", "button");
    			attr_dev(button10, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button10, file$5, 147, 32, 8927);
    			attr_dev(button11, "type", "button");
    			attr_dev(button11, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button11, file$5, 148, 32, 9037);
    			attr_dev(div28, "class", "btn-group");
    			add_location(div28, file$5, 146, 28, 8870);
    			attr_dev(small5, "class", "text-muted");
    			add_location(small5, file$5, 150, 28, 9179);
    			attr_dev(div29, "class", "d-flex justify-content-between align-items-center");
    			add_location(div29, file$5, 145, 24, 8777);
    			attr_dev(div30, "class", "card-body");
    			add_location(div30, file$5, 142, 20, 8520);
    			attr_dev(div31, "class", "card shadow-md");
    			add_location(div31, file$5, 133, 16, 7940);
    			attr_dev(div32, "class", "col");
    			add_location(div32, file$5, 132, 12, 7905);
    			add_location(title6, file$5, 161, 24, 9708);
    			attr_dev(rect6, "width", "100%");
    			attr_dev(rect6, "height", "100%");
    			attr_dev(rect6, "fill", "#55595c");
    			add_location(rect6, file$5, 162, 24, 9760);
    			attr_dev(text6, "x", "50%");
    			attr_dev(text6, "y", "50%");
    			attr_dev(text6, "fill", "#eceeef");
    			attr_dev(text6, "dy", ".3em");
    			add_location(text6, file$5, 162, 74, 9810);
    			attr_dev(svg6, "class", "bd-placeholder-img card-img-top svelte-1oi6kv6");
    			attr_dev(svg6, "width", "100%");
    			attr_dev(svg6, "height", "225");
    			attr_dev(svg6, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg6, "aria-label", "Placeholder: Thumbnail");
    			attr_dev(svg6, "preserveAspectRatio", "xMidYMid slice");
    			attr_dev(svg6, "role", "img");
    			attr_dev(svg6, "focusable", "false");
    			add_location(svg6, file$5, 158, 20, 9424);
    			attr_dev(p8, "class", "card-text");
    			add_location(p8, file$5, 167, 24, 10003);
    			attr_dev(button12, "type", "button");
    			attr_dev(button12, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button12, file$5, 171, 32, 10361);
    			attr_dev(button13, "type", "button");
    			attr_dev(button13, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button13, file$5, 172, 32, 10471);
    			attr_dev(div33, "class", "btn-group");
    			add_location(div33, file$5, 170, 28, 10304);
    			attr_dev(small6, "class", "text-muted");
    			add_location(small6, file$5, 174, 28, 10613);
    			attr_dev(div34, "class", "d-flex justify-content-between align-items-center");
    			add_location(div34, file$5, 169, 24, 10211);
    			attr_dev(div35, "class", "card-body");
    			add_location(div35, file$5, 166, 20, 9954);
    			attr_dev(div36, "class", "card shadow-md");
    			add_location(div36, file$5, 157, 16, 9374);
    			attr_dev(div37, "class", "col");
    			add_location(div37, file$5, 156, 12, 9339);
    			add_location(title7, file$5, 184, 24, 11140);
    			attr_dev(rect7, "width", "100%");
    			attr_dev(rect7, "height", "100%");
    			attr_dev(rect7, "fill", "#55595c");
    			add_location(rect7, file$5, 185, 24, 11192);
    			attr_dev(text7, "x", "50%");
    			attr_dev(text7, "y", "50%");
    			attr_dev(text7, "fill", "#eceeef");
    			attr_dev(text7, "dy", ".3em");
    			add_location(text7, file$5, 185, 74, 11242);
    			attr_dev(svg7, "class", "bd-placeholder-img card-img-top svelte-1oi6kv6");
    			attr_dev(svg7, "width", "100%");
    			attr_dev(svg7, "height", "225");
    			attr_dev(svg7, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg7, "aria-label", "Placeholder: Thumbnail");
    			attr_dev(svg7, "preserveAspectRatio", "xMidYMid slice");
    			attr_dev(svg7, "role", "img");
    			attr_dev(svg7, "focusable", "false");
    			add_location(svg7, file$5, 181, 20, 10856);
    			attr_dev(p9, "class", "card-text");
    			add_location(p9, file$5, 190, 24, 11435);
    			attr_dev(button14, "type", "button");
    			attr_dev(button14, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button14, file$5, 194, 32, 11793);
    			attr_dev(button15, "type", "button");
    			attr_dev(button15, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button15, file$5, 195, 32, 11903);
    			attr_dev(div38, "class", "btn-group");
    			add_location(div38, file$5, 193, 28, 11736);
    			attr_dev(small7, "class", "text-muted");
    			add_location(small7, file$5, 197, 28, 12045);
    			attr_dev(div39, "class", "d-flex justify-content-between align-items-center");
    			add_location(div39, file$5, 192, 24, 11643);
    			attr_dev(div40, "class", "card-body");
    			add_location(div40, file$5, 189, 20, 11386);
    			attr_dev(div41, "class", "card shadow-md");
    			add_location(div41, file$5, 180, 16, 10806);
    			attr_dev(div42, "class", "col");
    			add_location(div42, file$5, 179, 12, 10771);
    			add_location(title8, file$5, 207, 24, 12572);
    			attr_dev(rect8, "width", "100%");
    			attr_dev(rect8, "height", "100%");
    			attr_dev(rect8, "fill", "#55595c");
    			add_location(rect8, file$5, 208, 24, 12624);
    			attr_dev(text8, "x", "50%");
    			attr_dev(text8, "y", "50%");
    			attr_dev(text8, "fill", "#eceeef");
    			attr_dev(text8, "dy", ".3em");
    			add_location(text8, file$5, 208, 74, 12674);
    			attr_dev(svg8, "class", "bd-placeholder-img card-img-top svelte-1oi6kv6");
    			attr_dev(svg8, "width", "100%");
    			attr_dev(svg8, "height", "225");
    			attr_dev(svg8, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg8, "aria-label", "Placeholder: Thumbnail");
    			attr_dev(svg8, "preserveAspectRatio", "xMidYMid slice");
    			attr_dev(svg8, "role", "img");
    			attr_dev(svg8, "focusable", "false");
    			add_location(svg8, file$5, 204, 20, 12288);
    			attr_dev(p10, "class", "card-text");
    			add_location(p10, file$5, 213, 24, 12867);
    			attr_dev(button16, "type", "button");
    			attr_dev(button16, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button16, file$5, 217, 32, 13225);
    			attr_dev(button17, "type", "button");
    			attr_dev(button17, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button17, file$5, 218, 32, 13335);
    			attr_dev(div43, "class", "btn-group");
    			add_location(div43, file$5, 216, 28, 13168);
    			attr_dev(small8, "class", "text-muted");
    			add_location(small8, file$5, 220, 28, 13477);
    			attr_dev(div44, "class", "d-flex justify-content-between align-items-center");
    			add_location(div44, file$5, 215, 24, 13075);
    			attr_dev(div45, "class", "card-body");
    			add_location(div45, file$5, 212, 20, 12818);
    			attr_dev(div46, "class", "card shadow-md");
    			add_location(div46, file$5, 203, 16, 12238);
    			attr_dev(div47, "class", "col");
    			add_location(div47, file$5, 202, 12, 12203);
    			attr_dev(div48, "class", "row row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 g-5");
    			add_location(div48, file$5, 15, 8, 655);
    			add_location(br1, file$5, 226, 8, 13647);
    			attr_dev(a1, "class", "page-link");
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "tabindex", "-1");
    			attr_dev(a1, "aria-disabled", "true");
    			add_location(a1, file$5, 230, 20, 13834);
    			attr_dev(li0, "class", "page-item disabled");
    			add_location(li0, file$5, 229, 16, 13781);
    			attr_dev(span0, "class", "sr-only");
    			add_location(span0, file$5, 235, 24, 14100);
    			attr_dev(span1, "class", "page-link");
    			add_location(span1, file$5, 233, 20, 14023);
    			attr_dev(li1, "class", "page-item active");
    			attr_dev(li1, "aria-current", "page");
    			add_location(li1, file$5, 232, 16, 13952);
    			attr_dev(a2, "class", "page-link");
    			attr_dev(a2, "href", "#");
    			add_location(a2, file$5, 238, 38, 14230);
    			attr_dev(li2, "class", "page-item");
    			add_location(li2, file$5, 238, 16, 14208);
    			attr_dev(a3, "class", "page-link");
    			attr_dev(a3, "href", "#");
    			add_location(a3, file$5, 239, 38, 14310);
    			attr_dev(li3, "class", "page-item");
    			add_location(li3, file$5, 239, 16, 14288);
    			attr_dev(a4, "class", "page-link");
    			attr_dev(a4, "href", "#");
    			add_location(a4, file$5, 241, 20, 14412);
    			attr_dev(li4, "class", "page-item");
    			add_location(li4, file$5, 240, 16, 14368);
    			attr_dev(ul, "class", "pagination justify-content-center");
    			add_location(ul, file$5, 228, 12, 13717);
    			attr_dev(nav, "aria-label", "Page navigation example");
    			add_location(nav, file$5, 227, 8, 13661);
    			add_location(hr, file$5, 245, 8, 14518);
    			attr_dev(div49, "class", "container");
    			add_location(div49, file$5, 10, 4, 526);
    			attr_dev(div50, "class", "album py-0 bg-light");
    			add_location(div50, file$5, 9, 0, 487);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h10);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, p1);
    			append_dev(p1, a0);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div50, anchor);
    			append_dev(div50, div49);
    			append_dev(div49, div2);
    			append_dev(div2, h11);
    			append_dev(div49, t7);
    			append_dev(div49, br0);
    			append_dev(div49, t8);
    			append_dev(div49, div48);
    			append_dev(div48, div7);
    			append_dev(div7, div6);
    			append_dev(div6, svg0);
    			append_dev(svg0, title0);
    			append_dev(title0, t9);
    			append_dev(svg0, rect0);
    			append_dev(svg0, text0);
    			append_dev(text0, t10);
    			append_dev(div6, t11);
    			append_dev(div6, div5);
    			append_dev(div5, p2);
    			append_dev(div5, t13);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, button0);
    			append_dev(div3, t15);
    			append_dev(div3, button1);
    			append_dev(div4, t17);
    			append_dev(div4, small0);
    			append_dev(div48, t19);
    			append_dev(div48, div12);
    			append_dev(div12, div11);
    			append_dev(div11, svg1);
    			append_dev(svg1, title1);
    			append_dev(title1, t20);
    			append_dev(svg1, rect1);
    			append_dev(svg1, text1);
    			append_dev(text1, t21);
    			append_dev(div11, t22);
    			append_dev(div11, div10);
    			append_dev(div10, p3);
    			append_dev(div10, t24);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, button2);
    			append_dev(div8, t26);
    			append_dev(div8, button3);
    			append_dev(div9, t28);
    			append_dev(div9, small1);
    			append_dev(div48, t30);
    			append_dev(div48, div17);
    			append_dev(div17, div16);
    			append_dev(div16, svg2);
    			append_dev(svg2, title2);
    			append_dev(title2, t31);
    			append_dev(svg2, rect2);
    			append_dev(svg2, text2);
    			append_dev(text2, t32);
    			append_dev(div16, t33);
    			append_dev(div16, div15);
    			append_dev(div15, p4);
    			append_dev(div15, t35);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, button4);
    			append_dev(div13, t37);
    			append_dev(div13, button5);
    			append_dev(div14, t39);
    			append_dev(div14, small2);
    			append_dev(div48, t41);
    			append_dev(div48, div22);
    			append_dev(div22, div21);
    			append_dev(div21, svg3);
    			append_dev(svg3, title3);
    			append_dev(title3, t42);
    			append_dev(svg3, rect3);
    			append_dev(svg3, text3);
    			append_dev(text3, t43);
    			append_dev(div21, t44);
    			append_dev(div21, div20);
    			append_dev(div20, p5);
    			append_dev(div20, t46);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, button6);
    			append_dev(div18, t48);
    			append_dev(div18, button7);
    			append_dev(div19, t50);
    			append_dev(div19, small3);
    			append_dev(div48, t52);
    			append_dev(div48, div27);
    			append_dev(div27, div26);
    			append_dev(div26, svg4);
    			append_dev(svg4, title4);
    			append_dev(title4, t53);
    			append_dev(svg4, rect4);
    			append_dev(svg4, text4);
    			append_dev(text4, t54);
    			append_dev(div26, t55);
    			append_dev(div26, div25);
    			append_dev(div25, p6);
    			append_dev(div25, t57);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, button8);
    			append_dev(div23, t59);
    			append_dev(div23, button9);
    			append_dev(div24, t61);
    			append_dev(div24, small4);
    			append_dev(div48, t63);
    			append_dev(div48, div32);
    			append_dev(div32, div31);
    			append_dev(div31, svg5);
    			append_dev(svg5, title5);
    			append_dev(title5, t64);
    			append_dev(svg5, rect5);
    			append_dev(svg5, text5);
    			append_dev(text5, t65);
    			append_dev(div31, t66);
    			append_dev(div31, div30);
    			append_dev(div30, p7);
    			append_dev(div30, t68);
    			append_dev(div30, div29);
    			append_dev(div29, div28);
    			append_dev(div28, button10);
    			append_dev(div28, t70);
    			append_dev(div28, button11);
    			append_dev(div29, t72);
    			append_dev(div29, small5);
    			append_dev(div48, t74);
    			append_dev(div48, div37);
    			append_dev(div37, div36);
    			append_dev(div36, svg6);
    			append_dev(svg6, title6);
    			append_dev(title6, t75);
    			append_dev(svg6, rect6);
    			append_dev(svg6, text6);
    			append_dev(text6, t76);
    			append_dev(div36, t77);
    			append_dev(div36, div35);
    			append_dev(div35, p8);
    			append_dev(div35, t79);
    			append_dev(div35, div34);
    			append_dev(div34, div33);
    			append_dev(div33, button12);
    			append_dev(div33, t81);
    			append_dev(div33, button13);
    			append_dev(div34, t83);
    			append_dev(div34, small6);
    			append_dev(div48, t85);
    			append_dev(div48, div42);
    			append_dev(div42, div41);
    			append_dev(div41, svg7);
    			append_dev(svg7, title7);
    			append_dev(title7, t86);
    			append_dev(svg7, rect7);
    			append_dev(svg7, text7);
    			append_dev(text7, t87);
    			append_dev(div41, t88);
    			append_dev(div41, div40);
    			append_dev(div40, p9);
    			append_dev(div40, t90);
    			append_dev(div40, div39);
    			append_dev(div39, div38);
    			append_dev(div38, button14);
    			append_dev(div38, t92);
    			append_dev(div38, button15);
    			append_dev(div39, t94);
    			append_dev(div39, small7);
    			append_dev(div48, t96);
    			append_dev(div48, div47);
    			append_dev(div47, div46);
    			append_dev(div46, svg8);
    			append_dev(svg8, title8);
    			append_dev(title8, t97);
    			append_dev(svg8, rect8);
    			append_dev(svg8, text8);
    			append_dev(text8, t98);
    			append_dev(div46, t99);
    			append_dev(div46, div45);
    			append_dev(div45, p10);
    			append_dev(div45, t101);
    			append_dev(div45, div44);
    			append_dev(div44, div43);
    			append_dev(div43, button16);
    			append_dev(div43, t103);
    			append_dev(div43, button17);
    			append_dev(div44, t105);
    			append_dev(div44, small8);
    			append_dev(div49, t107);
    			append_dev(div49, br1);
    			append_dev(div49, t108);
    			append_dev(div49, nav);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(ul, t110);
    			append_dev(ul, li1);
    			append_dev(li1, span1);
    			append_dev(span1, t111);
    			append_dev(span1, span0);
    			append_dev(ul, t113);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t115);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(ul, t117);
    			append_dev(ul, li4);
    			append_dev(li4, a4);
    			append_dev(div49, t119);
    			append_dev(div49, hr);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div50);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pages> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Pages", $$slots, []);
    	return [];
    }

    class Pages extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pages",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    //tree
    const _tree = {
      "name": "root",
      "filepath": "/",
      "root": true,
      "ownMeta": {},
      "absolutePath": "src/pages",
      "children": [
        {
          "isFile": true,
          "isDir": false,
          "file": "_layout.svelte",
          "filepath": "/_layout.svelte",
          "name": "_layout",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "D:/Apps/svelte-routify-bootstrap5/src/pages/_layout.svelte",
          "importPath": "../../../../src/pages/_layout.svelte",
          "isLayout": true,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": false,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/",
          "id": "__layout",
          "component": () => Layout
        },
        {
          "isFile": true,
          "isDir": false,
          "file": "index.svelte",
          "filepath": "/index.svelte",
          "name": "index",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "D:/Apps/svelte-routify-bootstrap5/src/pages/index.svelte",
          "importPath": "../../../../src/pages/index.svelte",
          "isLayout": false,
          "isReset": false,
          "isIndex": true,
          "isFallback": false,
          "isPage": true,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/index",
          "id": "_index",
          "component": () => Pages
        }
      ],
      "isLayout": false,
      "isReset": false,
      "isIndex": false,
      "isFallback": false,
      "meta": {
        "preload": false,
        "prerender": true,
        "precache-order": false,
        "precache-proximity": true,
        "recursive": true
      },
      "path": "/"
    };


    const {tree, routes: routes$1} = buildClientTree(_tree);

    /* src\App.svelte generated by Svelte v3.24.1 */

    function create_fragment$7(ctx) {
    	let router;
    	let current;
    	router = new Router({ props: { routes: routes$1 }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Router, routes: routes$1 });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
