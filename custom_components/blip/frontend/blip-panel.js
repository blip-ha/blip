// node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: f, getOwnPropertySymbols: p, getPrototypeOf: m } = Object, h = globalThis, g = h.trustedTypes, _ = g ? g.emptyScript : "", ee = h.reactiveElementPolyfillSupport, v = (e, t) => e, y = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? _ : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, b = (e, t) => !l(e, t), x = {
	attribute: !0,
	type: String,
	converter: y,
	reflect: !1,
	useDefault: !1,
	hasChanged: b
};
Symbol.metadata ??= Symbol("metadata"), h.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var S = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = x) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? x;
	}
	static _$Ei() {
		if (this.hasOwnProperty(v("elementProperties"))) return;
		let e = m(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(v("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(v("properties"))) {
			let e = this.properties, t = [...f(e), ...p(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? y : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? y : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? b)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
S.elementStyles = [], S.shadowRootOptions = { mode: "open" }, S[v("elementProperties")] = /* @__PURE__ */ new Map(), S[v("finalized")] = /* @__PURE__ */ new Map(), ee?.({ ReactiveElement: S }), (h.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var C = globalThis, w = (e) => e, T = C.trustedTypes, te = T ? T.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, ne = "$lit$", E = `lit$${Math.random().toFixed(9).slice(2)}$`, re = "?" + E, ie = `<${re}>`, D = document, O = () => D.createComment(""), k = (e) => e === null || typeof e != "object" && typeof e != "function", A = Array.isArray, ae = (e) => A(e) || typeof e?.[Symbol.iterator] == "function", j = "[ 	\n\f\r]", M = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, oe = /-->/g, se = />/g, N = RegExp(`>|${j}(?:([^\\s"'>=/]+)(${j}*=${j}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), ce = /'/g, le = /"/g, ue = /^(?:script|style|textarea|title)$/i, de = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), P = de(1), F = de(2), I = Symbol.for("lit-noChange"), L = Symbol.for("lit-nothing"), fe = /* @__PURE__ */ new WeakMap(), R = D.createTreeWalker(D, 129);
function pe(e, t) {
	if (!A(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return te === void 0 ? t : te.createHTML(t);
}
var me = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = M;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === M ? c[1] === "!--" ? o = oe : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = N) : (ue.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = N) : o = se : o === N ? c[0] === ">" ? (o = i ?? M, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? N : c[3] === "\"" ? le : ce) : o === le || o === ce ? o = N : o === oe || o === se ? o = M : (o = N, i = void 0);
		let d = o === N && e[t + 1].startsWith("/>") ? " " : "";
		a += o === M ? n + ie : l >= 0 ? (r.push(s), n.slice(0, l) + ne + n.slice(l) + E + d) : n + E + (l === -2 ? t : d);
	}
	return [pe(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, z = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = me(t, n);
		if (this.el = e.createElement(l, r), R.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = R.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(ne)) {
					let t = u[o++], n = i.getAttribute(e).split(E), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? ge : r[1] === "?" ? _e : r[1] === "@" ? ve : H
					}), i.removeAttribute(e);
				} else e.startsWith(E) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (ue.test(i.tagName)) {
					let e = i.textContent.split(E), t = e.length - 1;
					if (t > 0) {
						i.textContent = T ? T.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], O()), R.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], O());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === re) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(E, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += E.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = D.createElement("template");
		return n.innerHTML = e, n;
	}
};
function B(e, t, n = e, r) {
	if (t === I) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = k(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = B(e, i._$AS(e, t.values), i, r)), t;
}
var he = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? D).importNode(t, !0);
		R.currentNode = r;
		let i = R.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new V(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new ye(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = R.nextNode(), a++);
		}
		return R.currentNode = D, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, V = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = L, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = B(this, e, t), k(e) ? e === L || e == null || e === "" ? (this._$AH !== L && this._$AR(), this._$AH = L) : e !== this._$AH && e !== I && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? ae(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== L && k(this._$AH) ? this._$AA.nextSibling.data = e : this.T(D.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = z.createElement(pe(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new he(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = fe.get(e.strings);
		return t === void 0 && fe.set(e.strings, t = new z(e)), t;
	}
	k(t) {
		A(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(O()), this.O(O()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = w(e).nextSibling;
			w(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, H = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = L, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = L;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = B(this, e, t, 0), a = !k(e) || e !== this._$AH && e !== I, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = B(this, r[n + o], t, o), s === I && (s = this._$AH[o]), a ||= !k(s) || s !== this._$AH[o], s === L ? e = L : e !== L && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === L ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, ge = class extends H {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === L ? void 0 : e;
	}
}, _e = class extends H {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== L);
	}
}, ve = class extends H {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = B(this, e, t, 0) ?? L) === I) return;
		let n = this._$AH, r = e === L && n !== L || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== L && (n === L || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, ye = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		B(this, e);
	}
}, be = C.litHtmlPolyfillSupport;
be?.(z, V), (C.litHtmlVersions ??= []).push("3.3.3");
var xe = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new V(t.insertBefore(O(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, U = globalThis, W = class extends S {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = xe(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return I;
	}
};
W._$litElement$ = !0, W.finalized = !0, U.litElementHydrateSupport?.({ LitElement: W });
var Se = U.litElementPolyfillSupport;
Se?.({ LitElement: W }), (U.litElementVersions ??= []).push("4.2.2");
// src/fan.ts
var G = 200, K = 222, Ce = 192, q = (e) => e * 3.28084, J = (e, t) => Array.from({ length: t }, (t, n) => (e >>> n & 1) == 1), Y = (e) => e.reduce((e, t, n) => t ? e | 1 << n : e, 0) >>> 0;
function we({ band: e, angleDeg: t, enabled: n, presence: r, active: i, lost: a, editing: o, selected: s }) {
	let c = t / 2, l = Ce / e.count, u = (e, t) => {
		let n = t * Math.PI / 180;
		return [G + e * Math.sin(n), K - e * Math.cos(n)];
	}, d = (e, t) => {
		let [n, r] = u(t, -c), [i, a] = u(t, c), [o, s] = u(e, c), [l, d] = u(e, -c);
		return `M${n} ${r}A${t} ${t} 0 0 1 ${i} ${a}L${o} ${s}A${e} ${e} 0 0 0 ${l} ${d}Z`;
	}, f = n.map((e, t) => {
		let n = d(t * l + .7, (t + 1) * l - .7);
		return o && t === s ? F`<path d=${n} class="sel-glow" /><path d=${n} class=${e ? "sel" : "sel sel-off"} />` : t === i && a ? F`<path d=${n} class="lost-glow" /><path d=${n} class=${e ? "lost" : "lost off-lost"} />` : e ? t === i ? F`<path d=${n} class="glow3" /><path d=${n} class="glow2" /><path d=${n} class="active" />` : F`<path d=${n} class=${r ? "on present" : "on"} />` : F`<path d=${n} class="off" />`;
	}), p = e.count * e.size_m, m = p > 8 ? 2 : 1, h = Array.from({ length: Math.floor(p / m) }, (e, t) => Math.round(q((t + 1) * m))).map((t) => {
		let n = t / 3.28084 / e.size_m * l, [r, i] = u(n, c + 4);
		return F`<text x=${r} y=${i + 4} class="lbl">${t} ft</text>`;
	});
	return F`<svg viewBox="0 0 400 244" role="img" aria-label=${`Sensor detection fan, ${e.count} bands`} class=${o ? "editing" : ""}>
    ${f}${h}
    <circle cx=${G} cy=${K} r="9" class="halo" />
    <circle cx=${G} cy=${K} r="5" class="dot" />
    <text x=${G} y="240" text-anchor="middle" class="lbl">sensor</text>
  </svg>`;
}
// src/brand.ts
var X = (e, t, n, r, i) => {
	let a = (e) => e * Math.PI / 180, o = e + n * Math.cos(a(r)), s = t + n * Math.sin(a(r)), c = e + n * Math.cos(a(i)), l = t + n * Math.sin(a(i)), u = +(((i - r) % 360 + 360) % 360 > 180);
	return `M${o.toFixed(2)} ${s.toFixed(2)}A${n} ${n} 0 ${u} 1 ${c.toFixed(2)} ${l.toFixed(2)}`;
}, Z = 38, Q = 64, Te = `M4 6L4 ${Q} ${X(Z, Q, 34, 180, 450)}`, Ee = [
	[12, 1],
	[17, .75],
	[22, .55],
	[27, .4]
], De = (e, t = "blip") => P`<svg
  width=${Math.round(e * 80 / 106)}
  height=${e}
  viewBox="-2 0 80 106"
  role=${t ? "img" : "presentation"}
  aria-label=${t || L}
  aria-hidden=${t ? L : "true"}
>
  <g fill="none" stroke-linecap="round">
    <path d=${Te} stroke="#c2410c" stroke-width="8" />
    ${Ee.map(([e, t]) => F`<path d=${X(Z, Q, e, 270, 360)} stroke="#c084fc" stroke-opacity=${t} stroke-width="3.2" />`)}
  </g>
  <circle cx=${Z} cy=${Q} r="6.5" fill="#f3e8ff" />
</svg>`, Oe = F`<svg viewBox="0 0 28 28" class="radar" aria-hidden="true">
  <g fill="none" stroke-linecap="round">
    ${[
	[8, 1],
	[12.5, .7],
	[17, .45]
].map(([e, t]) => F`<path d=${X(6, 22, e, -85, -5)} stroke="#c084fc" stroke-opacity=${t} stroke-width="2.4" />`)}
  </g>
  <circle cx="6" cy="22" r="4.6" fill="#a78bfa" />
</svg>`, ke = () => P`<span class="wordmark" role="img" aria-label="blip"
  ><span class="b">b</span><span>l</span><span class="i">ı<span class="dot">${Oe}</span></span
  ><span>p</span></span
>`, Ae = "\n  .wordmark { display: inline-flex; align-items: baseline; font-family: Inter, system-ui, sans-serif; font-weight: 700; line-height: 1; letter-spacing: -0.035em; color: #f4f0ff; }\n  .wordmark .b { color: #c2410c; }\n  .wordmark .i { position: relative; display: inline-block; margin-right: 0.03em; }\n  .wordmark .dot { position: absolute; left: 50%; margin-left: -0.075em; top: -0.075em; }\n  .wordmark .radar { height: 0.35em; width: auto; display: block; overflow: visible; }\n", je = {
	$schema: "./schema.json",
	id: "aqara_fp300",
	name: "Aqara FP300",
	manufacturer: "Aqara",
	integration: "zigbee2mqtt",
	mode: "band",
	match: { devices: [{
		manufacturer: "Aqara",
		model: "Presence sensor FP300"
	}, { model_id: "PS-S04D" }] },
	entities: {
		range: {
			domain: "number",
			suffix: "_detection_range",
			max: 16777215
		},
		presence: {
			domain: "binary_sensor",
			suffix: "_presence"
		},
		pir: {
			domain: "binary_sensor",
			suffix: "_pir_detection"
		},
		distance: {
			domain: "sensor",
			suffix: "_target_distance"
		},
		battery: {
			domain: "sensor",
			suffix: "_battery"
		},
		track: {
			domain: "button",
			suffix: "_track_target_distance"
		}
	},
	field_of_view: {
		angle_deg: 120,
		range_m: 6
	},
	band: {
		count: 24,
		size_m: .25,
		encoding: "bitmask_nearest_first"
	},
	behavior: {
		sleepy: !0,
		track_rearm_min: 10,
		lost_after_s: 3
	}
}, $ = { band: { required: ["range", "presence"] } }, Me = /* #__PURE__ */ Object.assign({ "../../profiles/aqara_fp300.json": je });
function Ne(e) {
	try {
		let t = e;
		if (!t || typeof t.id != "string" || typeof t.name != "string") return !1;
		let n = $[t.mode];
		if (!n || !t.entities || !t.match?.devices?.length || !t.match.devices.every((e) => e && (e.model || e.model_id)) || !n.required.every((e) => t.entities[e]?.domain && t.entities[e]?.suffix) || !(t.field_of_view?.angle_deg > 0 && t.field_of_view.angle_deg <= 180)) return !1;
		if (t.mode === "band") {
			let e = t.band;
			if (!e || !Number.isInteger(e.count) || e.count < 1 || e.count > 32 || !(e.size_m > 0) || e.encoding !== "bitmask_nearest_first") return !1;
		}
		return !0;
	} catch {
		return !1;
	}
}
var Pe = Object.values(Me).filter((e) => {
	let t = Ne(e);
	return t || console.warn("Blip: skipping an invalid sensor profile", e?.id), t;
}).sort((e, t) => e.name.localeCompare(t.name) || e.id.localeCompare(t.id)), Fe = (e, t) => !!e && !!t && e.trim().toLowerCase() === t.trim().toLowerCase();
function Ie(e, t) {
	return Object.keys(t).every((n) => Fe(e[n], t[n]));
}
function Le(e, t, n) {
	return !e.startsWith(n.domain + ".") || !e.endsWith(n.suffix) ? !1 : n.max === void 0 || Number(t?.attributes.max) === n.max;
}
function Re(e, t, n, r) {
	let i = {};
	for (let [a, o] of Object.entries(e.entities)) {
		let e = t.filter((e) => Le(e, n[e], o));
		i[a] = r && e.find((e) => e === `${o.domain}.${r}${o.suffix}`) || e[0];
	}
	return ($[e.mode]?.required ?? []).every((e) => i[e]) ? i : void 0;
}
function ze(e, t = Pe) {
	let { states: n } = e, r = e.entities ?? {}, i = e.devices ?? {}, a = /* @__PURE__ */ new Map();
	for (let e of Object.values(r)) {
		if (!e.device_id) continue;
		let t = a.get(e.device_id) ?? [];
		t.push(e.entity_id), a.set(e.device_id, t);
	}
	for (let [e, t] of a) a.set(e, t.filter((e) => n[e]));
	let o = [], s = /* @__PURE__ */ new Set(), c = (e) => i[e]?.name_by_user || i[e]?.name || "";
	for (let [e, r] of Object.entries(i)) {
		let i = t.find((e) => e.match.devices.some((e) => Ie(r, e)));
		if (!i) continue;
		let l = Re(i, a.get(e) ?? [], n);
		l && (o.push({
			key: e,
			name: c(e) || i.name,
			profile: i,
			entities: l,
			matchedBy: "model"
		}), s.add(e));
	}
	for (let e of t) {
		let t = $[e.mode].required[0], i = e.entities[t], l = Object.keys(n).filter((e) => Le(e, n[e], i)).sort(), u = l.map((e) => e.slice(i.domain.length + 1, -i.suffix.length));
		l.forEach((t, i) => {
			let l = r[t]?.device_id ?? null;
			if (l && s.has(l)) return;
			let d = u[i], f;
			if (l) f = a.get(l) ?? [];
			else {
				let e = u.filter((e) => e !== d && e.startsWith(d + "_"));
				f = Object.keys(n).filter((t) => {
					let n = t.split(".")[1] ?? "";
					return n.startsWith(d + "_") && !e.some((e) => n.startsWith(e + "_"));
				});
			}
			let p = Re(e, f, n, l ? void 0 : d);
			if (!p) return;
			let m = l ?? d;
			if (o.some((e) => e.key === m)) return;
			let h = String(n[t].attributes.friendly_name ?? "").replace(/\s*Detection range$/i, "");
			o.push({
				key: m,
				name: l && c(l) || h || d,
				profile: e,
				entities: p,
				matchedBy: "entities"
			}), l && s.add(l);
		});
	}
	return o.sort((e, t) => e.name.localeCompare(t.name) || e.key.localeCompare(t.key));
}
// src/aim.ts
function Be({ band: e, lostMs: t, aimOn: n, aimStart: r, now: i, presence: a, enabled: o, distance: s }) {
	let c = Math.max(0, Math.round((i - r) / 1e3)), l = n && !!s && s.seenAt >= r;
	if (!l) return {
		live: !1,
		waitedS: c
	};
	let u = s.meters, d = u > 0 ? Math.min(e.count - 1, Math.floor(u / e.size_m)) : void 0;
	return {
		live: l,
		active: d,
		lost: a ? d !== void 0 && !o[d] ? "off" : i - s.seenAt > t ? "quiet" : void 0 : "out",
		waitedS: c
	};
}
var Ve = (e) => q(e).toFixed(1);
function He({ band: e, editing: t, draftOn: n, pending: r, aimOn: i, known: a, onCount: o, maxFt: s, view: c }) {
	if (t) return `Editing · ${n} of ${e.count} bands on`;
	if (r) return "Saved · waiting for sensor to confirm";
	if (!i) return a ? `${o}/${e.count} bands · ${s.toFixed(1)} ft` : "Reading bands…";
	if (!c.live) return "Waiting for sensor…";
	if (c.lost === "out") return "Out of range · nobody detected";
	if (c.lost === "off") return `Band ${c.active + 1} is off · not detecting here`;
	if (c.lost === "quiet") return "Lost you · keep moving to confirm";
	if (c.active === void 0) return "No one in range";
	let l = c.active;
	return `Band ${l + 1} · ${Ve(l * e.size_m)}–${Ve((l + 1) * e.size_m)} ft`;
}
// src/hass.ts
var Ue = (e) => Math.max(new Date(e.last_updated).getTime(), e.last_reported ? new Date(e.last_reported).getTime() : 0), We = [a(Ae), o`
    :host {
      --bg: #160b29;
      --card: #22143d;
      --line: #534ab7;
      --line-2: #7f77dd;
      --text: #eeedfe;
      --muted: #afa9ec;
      --soft: #cecbf6;
      --accent: #a855f7;
      display: block;
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    main { max-width: 440px; margin: 0 auto; padding: 20px 16px calc(28px + env(safe-area-inset-bottom)); box-sizing: border-box; }
    .center { min-height: 70vh; display: grid; place-items: center; }
    .card { box-sizing: border-box; background: var(--card); border: 0.5px solid var(--line); border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; }
    h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.4px; }
    h2 { margin: 0; font-size: 17px; font-weight: 600; }
    p { margin: 0; }
    .muted { color: var(--muted); font-size: 13px; line-height: 1.5; }
    .err { color: #f7c1c1; font-size: 13px; margin-top: 8px; }

    .title { font-size: 44px; margin: 0; }
    .ver { text-align: center; font-size: 11px; color: var(--muted); opacity: 0.7; margin-top: 8px; }
    .pill-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 4px 0 8px; flex-wrap: nowrap; }
    .pill-row .pill { white-space: nowrap; padding: 7px 14px; }
    .pill-row .pill { margin: 0; }
    .editbtn { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; padding: 7px 14px; border-radius: 999px; min-height: 36px; }
    .editbtn svg { width: 16px; height: 16px; }
    .chips { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-top: 12px; }
    .chip { min-height: 52px; padding: 6px 2px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; font: inherit; }
    .chip strong { font-size: 17px; line-height: 1.1; }
    .chip span { font-size: 11px; opacity: 0.85; }
    .chip.on { background: #5b4a86; color: #fff; border: 1.5px solid var(--line-2); }
    .chip.off { background: transparent; color: var(--muted); border: 1.5px dashed var(--muted); }
    .chip.sel { outline: 2px solid #f5d0fe; outline-offset: 1px; }
    .chip-unit { text-align: right; font-size: 11px; color: var(--muted); margin: 4px 2px 0; }
    .pending { text-align: center; max-width: 320px; }
    .fan .sel { fill: #f5d0fe; stroke: #fff; stroke-width: 1; }
    .fan .sel-off { fill: transparent; stroke-dasharray: 3 2; stroke-width: 1.4; }
    .fan .sel-glow { fill: none; stroke: #f5d0fe; stroke-opacity: 0.35; stroke-width: 6; }
    .edit-actions { display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 8px; margin-top: 12px; }
    .edit-actions button { min-height: 46px; margin: 0; }
    .primary:disabled { opacity: 0.45; cursor: default; }
    .fan svg.editing .on { fill-opacity: 0.8; stroke-opacity: 0.8; }
    .footmark { display: flex; justify-content: center; margin-top: 28px; opacity: 0.9; }
    header { position: relative; display: flex; justify-content: center; align-items: center; margin: 4px 0 18px; min-height: 48px; }
    .menu { position: absolute; left: -4px; top: 50%; margin-top: -22px; width: 44px; height: 44px; padding: 0; display: grid; place-items: center; background: transparent; border: none; color: var(--soft); border-radius: 50%; }
    .menu svg { width: 24px; height: 24px; }
    .menu:focus-visible { outline: 2px solid var(--accent); }
    .sensor { display: block; margin-bottom: 14px; }
    .sensor-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin: 0 0 6px 2px; }
    .select-wrap { position: relative; display: block; }
    .picker { -webkit-appearance: none; appearance: none; box-sizing: border-box; width: 100%; min-height: 52px; background: var(--card); color: var(--text); border: 1.5px solid var(--line-2); border-radius: 14px; padding: 12px 48px 12px 16px; font: inherit; font-size: 17px; font-weight: 600; cursor: pointer; }
    .picker:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .picker.single { display: flex; align-items: center; cursor: default; }
    .chev { position: absolute; right: 16px; top: 50%; width: 22px; height: 22px; margin-top: -11px; color: var(--soft); pointer-events: none; }
    .batt { margin-top: 2px; }
    .supported { margin: 8px 0 0; padding-left: 20px; font-size: 14px; line-height: 1.6; }

    button { font: inherit; cursor: pointer; border-radius: 12px; padding: 12px 16px; }
    .primary { background: #7f77dd; color: #fff; border: none; font-weight: 600; margin-top: 8px; }
    .ghost { background: var(--card); color: var(--text); border: 0.5px solid var(--line-2); }

    .status { display: flex; align-items: center; gap: 12px; }
    .status .icon { width: 44px; height: 44px; border-radius: 12px; background: #3c3489; display: grid; place-items: center; color: var(--soft); font-size: 18px; flex-shrink: 0; }
    .status.present { border-color: var(--accent); }
    .status.present .icon { background: var(--accent); color: #fff; }

    .pill { width: fit-content; margin: 4px auto 8px; border: 0.5px solid var(--line-2); border-radius: 999px; padding: 7px 16px; font-size: 14px; font-weight: 600; color: var(--soft); background: var(--card); }

    .fan svg { width: 100%; display: block; }
    .fan .on { fill: #5b4a86; fill-opacity: 0.55; stroke: var(--line-2); stroke-opacity: 0.5; stroke-width: 0.5; }
    .fan .on.present { fill: #7c5cc4; fill-opacity: 0.75; }
    .fan .off { fill: var(--bg); stroke: var(--muted); stroke-opacity: 0.5; stroke-width: 0.6; stroke-dasharray: 3 2; }
    .fan .active { fill: var(--accent); stroke: #e9d5ff; stroke-width: 0.8; }
    .fan .glow2 { fill: none; stroke: var(--accent); stroke-opacity: 0.35; stroke-width: 5; }
    .fan .lost { fill: #c2410c; stroke: #fdba74; stroke-width: 0.8; }
    .fan .off-lost { fill-opacity: 0.55; stroke-dasharray: 3 2; }
    .fan .lost-glow { fill: none; stroke: #ea580c; stroke-opacity: 0.3; stroke-width: 7; }
    .fan .glow3 { fill: none; stroke: var(--accent); stroke-opacity: 0.18; stroke-width: 10; }
    .fan .lbl { font-size: 11px; fill: var(--soft); }
    .fan .dot { fill: var(--muted); }
    .fan .halo { fill: var(--line-2); opacity: 0.25; }

    .legend { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; font-size: 12px; color: var(--soft); margin: 8px 0 4px; }
    .sw { display: inline-block; width: 11px; height: 11px; border-radius: 3px; vertical-align: -1px; }
    .sw.present { background: #7c5cc4; }
    .sw.on { background: #5b4a86; }
    .sw.here { background: var(--accent); }
    .sw.lost { background: #c2410c; }
    .sw.off { border: 1px dashed var(--muted); }
    .note { text-align: center; font-size: 12px; color: var(--muted); margin-bottom: 14px; }
    .aim-row { display: flex; align-items: center; gap: 12px; justify-content: space-between; }
    .switch { width: 54px; height: 32px; border-radius: 16px; background: #3c3489; border: none; padding: 0; position: relative; flex-shrink: 0; }
    .switch i { position: absolute; top: 4px; left: 4px; width: 24px; height: 24px; border-radius: 50%; background: var(--text); transition: left 0.2s; }
    .switch.on { background: var(--accent); }
    .switch.on i { left: 26px; }
    .switch:disabled { opacity: 0.4; }
    .switch:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .aim-state { margin-top: 12px; padding: 10px 12px; border-radius: 12px; display: flex; flex-direction: column; gap: 2px; font-size: 13px; line-height: 1.45; }
    .aim-state strong { font-size: 15px; }
    .aim-state.wait { background: #3c3489; color: var(--soft); }
    .aim-state.live { background: #4c1d95; color: #ede9fe; }
    .aim-note { margin-top: 8px; }
    .pill.hot { border-color: var(--accent); color: #f3e8ff; }
    .pill.lost { border-color: #ea580c; color: #fed7aa; background: #3a1708; }

  `], Ge = "blip.sensor", Ke = {
	zigbee2mqtt: "Zigbee2MQTT",
	zha: "ZHA",
	matter: "Matter"
}, qe = {
	get: (e) => {
		try {
			return localStorage.getItem(e);
		} catch {
			return null;
		}
	},
	set: (e, t) => {
		try {
			localStorage.setItem(e, t);
		} catch {}
	}
}, Je = class extends W {
	static {
		this.properties = {
			hass: { attribute: !1 },
			narrow: { type: Boolean },
			selected: { state: !0 },
			aimOn: { state: !0 },
			draft: { state: !0 },
			sel: { state: !0 },
			pendingMask: { state: !0 },
			saveError: { state: !0 },
			aimStart: { state: !0 },
			now: { state: !0 }
		};
	}
	static {
		this.styles = We;
	}
	constructor() {
		super(), this.sensors = [], this.sensorsKey = "", this.narrow = !1, this.selected = "", this.aimOn = !1, this.draft = null, this.sel = 0, this.pendingMask = null, this.saveError = "", this.aimStart = 0, this.now = Date.now();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.stopAim();
	}
	willUpdate(e) {
		e.has("hass") && this.hass && (this.refreshSensors(), this.checkSaveConfirmed());
	}
	checkSaveConfirmed() {
		if (this.pendingMask === null) return;
		let e = this.current(), t = e?.entities.range ? this.hass.states[e.entities.range]?.state : void 0;
		t !== void 0 && t !== "" && Number(t) === this.pendingMask && (this.pendingMask = null, this.aimOn && this.rearmTrack());
	}
	refreshSensors() {
		let e = this.hass, t = Object.keys(e.states).length + "";
		if ((this.registries?.[0] !== e.entities || this.registries?.[1] !== e.devices || t !== this.sensorsKey) && (this.registries = [e.entities, e.devices], this.sensorsKey = t, this.sensors = ze(e), !this.sensors.some((e) => e.key === this.selected))) {
			let e = qe.get(Ge);
			this.selected = this.sensors.find((t) => t.key === e)?.key ?? this.sensors[0]?.key ?? "";
		}
	}
	current() {
		return this.sensors.find((e) => e.key === this.selected);
	}
	call(e, t, n) {
		return this.hass.callService(e, t, n);
	}
	pressTrack() {
		let e = this.current();
		this.hass && e?.entities.track && this.call("button", "press", { entity_id: e.entities.track }).catch(() => {});
	}
	rearmTrack() {
		window.clearInterval(this.rearm), this.pressTrack();
		let e = this.current()?.profile.behavior.track_rearm_min ?? 10;
		this.rearm = window.setInterval(() => this.pressTrack(), e * 60 * 1e3);
	}
	startAim() {
		this.aimOn = !0, this.aimStart = Date.now(), this.now = this.aimStart, this.rearmTrack(), this.clock = window.setInterval(() => this.now = Date.now(), 250);
	}
	stopAim() {
		this.aimOn = !1, window.clearInterval(this.rearm), window.clearInterval(this.clock);
	}
	toggleAim() {
		this.aimOn ? this.stopAim() : this.startAim();
	}
	startEdit(e) {
		this.draft = [...e], this.sel = 0, this.saveError = "";
	}
	cancelEdit() {
		this.draft = null, this.saveError = "";
	}
	onCancel() {
		this.cancelEdit(), this.aimOn && this.pressTrack();
	}
	toggleBand(e) {
		if (!this.draft) return;
		let t = [...this.draft];
		t[e] = !t[e], this.draft = t;
	}
	async saveBands() {
		let e = this.current();
		if (!this.hass || !e || !this.draft) return;
		if (!this.draft.some(Boolean)) {
			this.saveError = "Turn on at least one band.";
			return;
		}
		let t = Y(this.draft);
		try {
			await this.call("number", "set_value", {
				entity_id: e.entities.range,
				value: t
			}), this.pendingMask = t, this.draft = null, this.saveError = "";
		} catch {
			this.saveError = "Couldn't save. Check your connection and try again.";
		}
	}
	pick(e) {
		this.stopAim(), this.cancelEdit(), this.pendingMask = null, this.selected = e.target.value, qe.set(Ge, this.selected);
	}
	toggleMenu() {
		this.dispatchEvent(new Event("hass-toggle-menu", {
			bubbles: !0,
			composed: !0
		}));
	}
	renderHeader() {
		return P`<header>
      ${this.narrow ? P`<button class="menu" aria-label="Open sidebar" @click=${this.toggleMenu}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" fill="currentColor" /></svg>
          </button>` : L}
      <h1 class="title">${ke()}</h1>
    </header>`;
	}
	renderFooter() {
		return P`<div class="footmark">${De(44, "blip")}</div>
      <p class="ver">v${"0.3.1"}</p>`;
	}
	render() {
		if (!this.hass) return P`<main>${this.renderHeader()}<div class="card"><p class="muted">Connecting to Home Assistant…</p></div></main>`;
		let e = this.current();
		return e ? this.renderSensor(e) : P`<main>
        ${this.renderHeader()}
        <div class="card">
          <h2>No supported sensor found</h2>
          <p class="muted">Blip works with:</p>
          <ul class="supported">
            ${Pe.map((e) => P`<li>${e.name} <span class="muted">(${Ke[e.integration]})</span></li>`)}
          </ul>
        </div>
        ${this.renderFooter()}
      </main>`;
	}
	renderSensor(e) {
		let { profile: t } = e, n = t.band, r = e.entities, i = (e) => e ? this.hass.states[e] : void 0, a = i(r.range)?.state, o = Number(a), s = a !== void 0 && a !== "" && !Number.isNaN(o), c = s ? J(o, n.count) : Array(n.count).fill(!0), l = this.draft !== null, u = l ? this.draft : this.pendingMask === null ? c : J(this.pendingMask, n.count), d = l ? this.draft.filter(Boolean).length : 0, f = l && Y(this.draft) !== Y(c), p = c.filter(Boolean).length, m = i(r.presence)?.state === "on", h = i(r.pir)?.state === "on", g = i(r.battery)?.state, _ = i(r.presence)?.state === "unavailable", ee = q((c.lastIndexOf(!0) + 1) * n.size_m), v = i(r.distance), y = Number(v?.state), b = Be({
			band: n,
			lostMs: (t.behavior.lost_after_s ?? 3) * 1e3,
			aimOn: this.aimOn,
			aimStart: this.aimStart,
			now: this.now,
			presence: m,
			enabled: c,
			distance: v && !Number.isNaN(y) ? {
				meters: y,
				seenAt: Ue(v)
			} : void 0
		}), { live: x, active: S, lost: C, waitedS: w } = b, T = He({
			band: n,
			editing: l,
			draftOn: d,
			pending: this.pendingMask !== null,
			aimOn: this.aimOn,
			known: s,
			onCount: p,
			maxFt: ee,
			view: b
		});
		return P`<main>
      ${this.renderHeader()}

      <label class="sensor">
        <span class="sensor-label">Sensor</span>
        ${this.sensors.length > 1 ? P`<span class="select-wrap">
              <select class="picker" .value=${e.key} @change=${this.pick}>
                ${this.sensors.map((t) => P`<option value=${t.key} ?selected=${t.key === e.key}>${t.name}</option>`)}
              </select>
              <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </span>` : P`<span class="picker single">${e.name}</span>`}
      </label>

      <section class="card status ${_ ? "" : m ? "present" : ""}">
        <div class="icon" aria-hidden="true">${m ? "●" : "○"}</div>
        <div>
          <h2>${_ ? "Sensor offline" : m ? "Someone's here" : "No one detected"}</h2>
          <p class="muted">mmWave ${m ? "on" : "off"} · PIR ${h ? "on" : "off"}</p>
          ${g === void 0 ? L : P`<p class="muted batt">Battery ${g}%</p>`}
        </div>
      </section>

      <section class="card aim">
        <div class="aim-row">
          <div>
            <h2>Aim test</h2>
            <p class="muted">See which band responds as you walk the room.</p>
          </div>
          <button
            class="switch ${this.aimOn ? "on" : ""}"
            role="switch"
            aria-checked=${this.aimOn ? "true" : "false"}
            aria-label="Aim test"
            ?disabled=${!r.track || !r.distance}
            @click=${this.toggleAim}
          ><i></i></button>
        </div>
        ${!r.track || !r.distance ? P`<p class="muted aim-note">This sensor doesn't expose distance tracking.</p>` : this.aimOn ? x ? P`<div class="aim-state live"><strong>Coverage test active</strong><span>The band you're in lights up as you move.</span></div>` : t.behavior.sleepy ? P`<div class="aim-state wait"><strong>Tap your sensor's button once</strong><span>Quick tap, don't hold (holding can reset it). Waiting for sensor… ${w}s</span></div>` : P`<div class="aim-state wait"><strong>Waiting for sensor…</strong><span>${w}s</span></div>` : L}
      </section>

      <div class="pill-row">
        <div class="pill ${C ? "lost" : S === void 0 ? "" : "hot"}" role="status">${T}</div>
        ${l ? L : P`<button class="ghost editbtn" @click=${() => this.startEdit(this.pendingMask === null ? c : J(this.pendingMask, n.count))}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>
              Edit bands
            </button>`}
      </div>
      ${this.pendingMask !== null && !l ? P`<p class="muted pending">Saved. Tap your sensor's button once to apply it now, or it applies on the sensor's next check-in.</p>` : L}

      <div class="fan">${we({
			band: n,
			angleDeg: t.field_of_view.angle_deg,
			enabled: u,
			presence: !1,
			active: l ? void 0 : S,
			lost: !l && !!C,
			editing: l,
			selected: this.sel
		})}</div>

      <div class="legend">
        <span><i class="sw here"></i> you're here</span><span><i class="sw lost"></i> lost you</span>
        <span><i class="sw on"></i> band on</span>
        <span><i class="sw off"></i> band off</span>
      </div>
      <p class="note">Outline is the rated ${t.field_of_view.angle_deg}°. Edges may be shorter.</p>

      ${l ? P`<section class="card edit">
            <h2>Edit bands</h2>
            <p class="muted">Tap a band to switch it on or off. Band 1 is closest to the sensor.</p>
            <div class="chips">
              ${this.draft.map((e, t) => P`<button
                  class="chip ${e ? "on" : "off"} ${t === this.sel ? "sel" : ""}"
                  aria-pressed=${e ? "true" : "false"}
                  aria-label=${`Band ${t + 1}, ${q(t * n.size_m).toFixed(1)} to ${q((t + 1) * n.size_m).toFixed(1)} feet, ${e ? "on" : "off"}`}
                  @click=${() => {
			this.sel = t, this.toggleBand(t);
		}}
                >
                  <strong>${t + 1}</strong>
                  <span>${q(t * n.size_m).toFixed(1)}–${q((t + 1) * n.size_m).toFixed(1)}</span>
                </button>`)}
            </div>
            <p class="chip-unit">Distances in feet</p>
            <div class="edit-actions">
              <button class="ghost" @click=${() => this.draft = Array(n.count).fill(!0)}>All on</button>
              <button class="ghost" @click=${this.onCancel}>Cancel</button>
              <button class="primary" ?disabled=${!f} @click=${this.saveBands}>Save</button>
            </div>
            ${this.saveError ? P`<p class="err">${this.saveError}</p>` : L}
          </section>` : L}

      ${this.renderFooter()}
    </main>`;
	}
};
customElements.get("blip-panel") || customElements.define("blip-panel", Je);
export { Je as BlipPanel };
