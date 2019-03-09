export default class DragAndDropTouch {
    //max ms between clicks in a double click
    static get _DBLCLICK() {
        return 500;
    }
    //pixels to move before drag starts
    static get _THRESHOLD() {
        return 5;
    }
    //drag image opacity
    static get _OPACITY() {
        return 0.5;
    }
    //ms to hold before raising contextmenu event
    static get _CTXMENU() {
        return 900;
    }
    //potentially troublesome attributes
    static get _rmvAttrs() {
        return ["id", "class", "style", "draggable"]; 
    }
    static get _kbdProps() {
        return ["altKey", "ctrlKey", "metaKey", "shiftKey"];
    }
    static get _ptProps() {
        return ["pageX", "pageY", "clientX", "clientY", "screenX", "screenY"];
    }


    /**
     * Creates handlers for touch events to imitate HTML5 DnD events.
     */
    static createHandlers() {
        if(DragAndDropTouch._instance) {
            return;
        }
        
        DragAndDropTouch._instance = new (class {
            constructor() {
                this._lastCLick = 0;
                if("ontouchstart" in document) {
                    document.addEventListener("touchstart", this.touchStart.bind(this), { passive: false });
                    document.addEventListener("touchmove", this.touchMove.bind(this), { passive: false });
                    document.addEventListener("touchend", this.touchEnd.bind(this), { passive: false });
                    document.addEventListener("touchcancel", this.touchEnd.bind(this), { passive: false });
                } 
            }
        
            touchStart(e) {
                if(!this._shouldHandle(e)) {
                    return;
                }
                if(Date.now() - this._lastClick < DragAndDropTouch._DBLCLICK) {
                    if(this._dispatchEvent(e, "dblclick", e.target)) {
                        e.preventDefault();
                        this._reset();
                        return;
                    }
                }
                this._reset();
                const src = this._closestDraggable(e.target);
                if(!src) {
                    return;
                }
                //give caller a chance to handle the hover/move events
                if(this._dispatchEvent(e, "mousemove", e.target) 
                    || this._dispatchEvent(e, "mousedown", e.target)) {
                    return;
                }
                //getting ready to start dragging
                this._dragSource = src;
                this._ptDown = this._getPoint(e);
                this._lastTouch = e;
                e.preventDefault();
                //show context menu if the user hasn't started dragging after a while
                setTimeout(() => {
                    if(this._dragSource === src && this._img === null) {
                        if(this._dispatchEvent(e, "contextmenu", src)) {
                            this._reset();
                        }
                    }
                }, DragAndDropTouch._CTXMENU);
            }

            touchMove(e) {
                if(!this._shouldHandle(e)) {
                    return;
                }
                const target = this._getTarget(e);
                //check if target wants to handle move
                if(this._dispatchEvent(e, "mousemove", target)) {
                    this._lastTouch = e;
                    e.preventDefault();
                    return;
                }
                //start dragging
                if(this._dragSource && !this._img) {
                    const delta = this._getDelta(e);
                    if(delta > DragAndDropTouch._THRESHOLD) {
                        this._dispatchEvent(e, "dragstart", this._dragSource);
                        this._createImage(e);
                        this._dispatchEvent(e, "dragenter", target);
                    }
                }
                //continue dragging
                if (this._img) {
                    this._lastTouch = e;
                    e.preventDefault(); // prevent scrolling
                    if (target !== this._lastTarget) {
                        this._dispatchEvent(this._lastTouch, "dragleave", this._lastTarget);
                        this._dispatchEvent(e, "dragenter", target);
                        this._lastTarget = target;
                    }
                    this._moveImage(e);
                    this._dispatchEvent(e, "dragover", target);
                }
            }

            touchEnd(e) {
                if(!this._shouldHandle(e)) {
                    return;
                }
                //check if target wants to handle up
                if (this._dispatchEvent(this._lastTouch, 'mouseup', e.target)) {
                    e.preventDefault();
                    return;
                }
                // user clicked the element but didn't drag, so clear the source and simulate a click
                if(!this._img) {
                    this._dragSource = null;
                    this._dispatchEvent(this._lastTouch, "click", e.target);
                    this._lastClick = Date.now();
                }
                // finish dragging
                this._destroyImage();
                if (this._dragSource) {
                    if (e.type.indexOf("cancel") < 0) {
                        this._dispatchEvent(this._lastTouch, "drop", this._lastTarget);
                    }
                    this._dispatchEvent(this._lastTouch, "dragend", this._dragSource);
                    this._reset();
                }
            }

            //ignore events that have been handled or that involve more than one touch
            _shouldHandle(e) {
                return e && !e.defaultPrevented
                    && e.touches && e.touches.length < 2;
            }

            //get closest draggable ancestor
            _closestDraggable(e) {
                for(; e; e = e.parentElement) {
                    if (e.hasAttribute('draggable')) {
                        return e;
                    }
                }
                return null;
            }

            // get the element at a given touch event
            _getTarget(e) {
                const pt = this._getPoint(e);
                let el = document.elementFromPoint(pt.x, pt.y);
                while (el && getComputedStyle(el).pointerEvents === "none") {
                    el = el.parentElement;
                }
                return el;
            }

            //create drag image from src element
            _createImage(e) {
                if(this._img) {
                    this._destroyImage();
                }
                const src = this._dragSource;
                this._img = src.cloneNode(true);
                this._copyStyle(src, this._img);
                //this._img.style.top = this._img.style.left = '-9999px';

                const rc = src.getBoundingClientRect();
                const pt = this._getPoint(e);
                this._imgOffset = { x: pt.x - rc.left, y: pt.y - rc.top };
                this._img.style.opacity = DragAndDropTouch._OPACITY.toString();
                // add image to document
                this._moveImage(e);
                document.body.appendChild(this._img);
            }

            // move the drag image element
            _moveImage(e) {
                requestAnimationFrame(() => {
                    const pt = this._getPoint(e, true);
                    const s = this._img.style;
                    s.position = 'absolute';
                    s.pointerEvents = 'none';
                    s.zIndex = '999999';
                    s.left = Math.round(pt.x - this._imgOffset.x) + 'px';
                    s.top = Math.round(pt.y - this._imgOffset.y) + 'px';
                });
            }

            _copyStyle(src, dist) {
                DragAndDropTouch._rmvAttrs.forEach(attr => {
                    dist.removeAttribute(attr);
                });
                const cs = getComputedStyle(src);
                for (let i = 0; i < cs.length; i++) {
                    let key = cs[i];
                    dist.style[key] = cs[key];
                }
                dist.style.pointerEvents = 'none';
                // and repeat for all children
                for (var i = 0; i < src.children.length; i++) {
                    this._copyStyle(src.children[i], dist.children[i]);
                }
            }

            //dispose of drag image element
            _destroyImage() {
                if(this._img && this._img.parentElement) {
                    this._img.parentElement.removeChild(this._img);
                }
                this._img = null;
            }

            //get distance between the current touch event and the first one
            _getDelta(e) {
                const p = this._getPoint(e);
                return Math.abs(p.x - this._ptDown.x) + Math.abs(p.y - this._ptDown.y);
            }

            //get point for a touch event
            _getPoint(e, page) {
                if(e && e.touches) {
                    e = e.touches[0];
                }
                return {
                    x: page ? e.pageX : e.clientX,
                    y: page ? e.pageY : e.clientY
                }
            }

            _reset() {
                this._destroyImage();
                this._dragSource = null;
                this._lastTouch = null;
                this._lastTarget = null;
                this._ptDown = null;
                this._dataTransfer = DragAndDropTouch._createDataTransfer();
            }

            _dispatchEvent(e, type, target) {
                if(!(e && target)) {
                    return false;
                }

                let evt = document.createEvent("Event");
                evt.initEvent(type, true, true);
                let t = e.touches ? e.touches[0] : e;
                evt.button = 0;
                evt.buttons = 1;
                this._copyProps(evt, e, DragAndDropTouch._kbdProps);
                this._copyProps(evt, t, DragAndDropTouch._ptProps);
                evt.dataTransfer = this._dataTransfer;
                target.dispatchEvent(evt);
                return evt.defaultPrevented;
            }

            _copyProps(dst, src, props) {
                props.forEach(prop => {
                    dst[prop] = src[prop];
                });
            }
        
        })();
    }

    static _createDataTransfer() {
        return new (class {
            constructor() {
                this._dropEffect = "move";
                this._effectAllowed = "move";
                this._data = {};
        
                this._dropEffectPossibleValues = ["copy", "move", "link", "none"];
                this._effectAllowedPossibleValues = ["none", "copy", "copyLink",
                    "copyMove", "link", "linkMove", "move", "all", "uninitialized"];
            }
        
            get dropEffect() {
                return this._dropEffect;
            }
        
            set dropEffect(value) {
                if(!this._dropEffectPossibleValues.includes(value)) {
                    throw new Error(`dropEffect value should be one of ${this._dropEffectPossibleValues}`);
                }
                this._dropEffect = value;
            }
        
            get effectAllowed() {
                return this._effectAllowed;
            }
        
            set effectAllowed(value) {
                if(!this._effectAllowedPossibleValues.includes(value)) {
                    throw new Error(`dropEffect value should be one of ${this._effectAllowedPossibleValues}`);
                }
                this._effectAllowed = value;
            }
        
            getData(type) {
                return this._data[type] || "";
            }
        
            setData(type, value) {
                this._data[type] = value;
            }
        
            clearData(type) {
                if(type != null) {
                    delete this._data[type];
                } else {
                    this._data = null;
                }
            }
        })();
    }
}