/*
 * Styled dropdowns: replaces the browser's native <select> popup with a menu that matches the rest of
 * the interface (same look as "Advanced Settings"). The real <select> stays in the DOM, hidden, so its
 * value, options and change events keep working for the rest of the app and for forms/assistive tech.
 */
(function () {
    'use strict';

    const SELECTOR = 'select.control-select';
    let openInstance = null;
    let uid = 0;

    function icon(name) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'ico ico-sm');
        svg.setAttribute('aria-hidden', 'true');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', '#i-' + name);
        svg.appendChild(use);
        return svg;
    }

    function enhance(select) {
        if (!select || select.dataset.selectMenu === 'on') return null;
        select.dataset.selectMenu = 'on';
        const id = 'cs' + (++uid);

        const wrapper = document.createElement('div');
        wrapper.className = 'cs';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'cs-button';
        button.setAttribute('aria-haspopup', 'listbox');
        button.setAttribute('aria-expanded', 'false');
        const label = select.getAttribute('aria-label');
        if (label) button.setAttribute('aria-label', label);
        const text = document.createElement('span');
        text.className = 'cs-value';
        button.appendChild(text);

        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);
        wrapper.appendChild(button);
        select.classList.add('cs-native');
        select.tabIndex = -1;
        select.setAttribute('aria-hidden', 'true');

        let menu = null;
        let items = [];
        let active = -1;
        let typed = '';
        let typedTimer = null;

        function options() {
            return Array.from(select.options);
        }

        function refresh() {
            const selected = select.options[select.selectedIndex];
            text.textContent = selected ? selected.textContent : '';
            text.classList.toggle('is-placeholder', !!selected && selected.value === '');
            button.disabled = select.disabled;
            if (menu) buildItems();
        }

        // Code in the app sets select.value directly; keep the label in sync without needing an event.
        const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
        if (proto && proto.set && proto.get) {
            Object.defineProperty(select, 'value', {
                configurable: true,
                get() { return proto.get.call(this); },
                set(v) { proto.set.call(this, v); refresh(); }
            });
        }
        select.addEventListener('change', refresh);
        new MutationObserver(refresh).observe(select, {
            childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'selected']
        });

        function setActive(index, scroll) {
            if (items.length === 0) return;
            active = Math.max(0, Math.min(items.length - 1, index));
            items.forEach((el, i) => el.classList.toggle('is-active', i === active));
            button.setAttribute('aria-activedescendant', items[active].id);
            if (scroll !== false && items[active].scrollIntoView) items[active].scrollIntoView({ block: 'nearest' });
        }

        function choose(index) {
            const option = options()[index];
            if (!option || option.disabled) return;
            const changed = select.selectedIndex !== index;
            select.selectedIndex = index;
            refresh();
            close(true);
            if (changed) select.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function buildItems() {
            menu.textContent = '';
            items = options().map((option, index) => {
                const el = document.createElement('div');
                el.className = 'cs-option';
                el.id = id + '-o' + index;
                el.setAttribute('role', 'option');
                const isSelected = index === select.selectedIndex;
                el.setAttribute('aria-selected', String(isSelected));
                if (isSelected) el.classList.add('is-selected');
                if (option.disabled) { el.classList.add('is-disabled'); el.setAttribute('aria-disabled', 'true'); }
                if (option.value === '') el.classList.add('is-placeholder');
                const span = document.createElement('span');
                span.textContent = option.textContent;
                el.appendChild(span);
                if (isSelected) el.appendChild(icon('check'));
                el.addEventListener('click', () => choose(index));
                el.addEventListener('mousemove', () => { if (active !== index) setActive(index, false); });
                menu.appendChild(el);
                return el;
            });
            if (active < 0 || active >= items.length) active = Math.max(0, select.selectedIndex);
            if (items.length) setActive(active, false);
        }

        function place() {
            const rect = button.getBoundingClientRect();
            const margin = 8;
            menu.style.minWidth = rect.width + 'px';
            menu.style.maxWidth = Math.min(380, window.innerWidth - margin * 2) + 'px';
            menu.style.left = '0px';
            menu.style.top = '0px';
            const mw = menu.offsetWidth;
            const mh = menu.offsetHeight;
            let left = rect.left;
            if (left + mw > window.innerWidth - margin) left = Math.max(margin, rect.right - mw);
            const below = window.innerHeight - rect.bottom - margin;
            const above = rect.top - margin;
            let top = rect.bottom + 6;
            menu.classList.remove('is-up');
            if (mh > below && above > below) {
                top = Math.max(margin, rect.top - 6 - Math.min(mh, above));
                menu.classList.add('is-up');
            }
            const room = (menu.classList.contains('is-up') ? above : below) - 6;
            menu.style.maxHeight = Math.max(120, Math.min(320, room)) + 'px';
            menu.style.left = left + 'px';
            menu.style.top = top + 'px';
        }

        function open() {
            if (select.disabled || menu) return;
            if (openInstance) openInstance.close(false);
            if (button.scrollIntoView) button.scrollIntoView({ block: 'nearest' });
            menu = document.createElement('div');
            menu.className = 'cs-menu';
            menu.id = id + '-menu';
            menu.setAttribute('role', 'listbox');
            if (label) menu.setAttribute('aria-label', label);
            document.body.appendChild(menu);
            active = Math.max(0, select.selectedIndex);
            buildItems();
            button.setAttribute('aria-expanded', 'true');
            button.setAttribute('aria-controls', menu.id);
            wrapper.classList.add('is-open');
            place();
            if (items[active] && items[active].scrollIntoView) items[active].scrollIntoView({ block: 'nearest' });
            openInstance = api;
            document.addEventListener('pointerdown', onOutside, true);
            window.addEventListener('resize', onViewportChange);
            document.addEventListener('scroll', onScroll, true);
        }

        function close(returnFocus) {
            if (!menu) return;
            menu.remove();
            menu = null;
            items = [];
            button.setAttribute('aria-expanded', 'false');
            button.removeAttribute('aria-activedescendant');
            button.removeAttribute('aria-controls');
            wrapper.classList.remove('is-open');
            document.removeEventListener('pointerdown', onOutside, true);
            window.removeEventListener('resize', onViewportChange);
            document.removeEventListener('scroll', onScroll, true);
            if (openInstance === api) openInstance = null;
            if (returnFocus) button.focus();
        }

        function onOutside(event) {
            if (menu && !menu.contains(event.target) && !wrapper.contains(event.target)) close(false);
        }
        function onViewportChange() { close(false); }
        function onScroll(event) {
            if (!menu || menu.contains(event.target)) return;
            // keep the menu attached to its button while something scrolls; close it if the button leaves the screen
            const rect = button.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) close(false);
            else place();
        }

        button.addEventListener('click', () => { if (menu) close(true); else open(); });

        button.addEventListener('keydown', event => {
            const key = event.key;
            if (!menu) {
                if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
                    event.preventDefault();
                    open();
                }
                return;
            }
            if (key === 'ArrowDown') { event.preventDefault(); setActive(active + 1); }
            else if (key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); }
            else if (key === 'Home') { event.preventDefault(); setActive(0); }
            else if (key === 'End') { event.preventDefault(); setActive(items.length - 1); }
            else if (key === 'Enter' || key === ' ') { event.preventDefault(); choose(active); }
            else if (key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
            else if (key === 'Tab') { close(false); }
            else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                typed += key.toLowerCase();
                window.clearTimeout(typedTimer);
                typedTimer = window.setTimeout(() => { typed = ''; }, 600);
                const list = options();
                const start = typed.length === 1 ? active + 1 : active;
                for (let i = 0; i < list.length; i++) {
                    const index = (start + i) % list.length;
                    if (list[index].textContent.trim().toLowerCase().startsWith(typed)) { setActive(index); break; }
                }
            }
        });

        const api = { close, refresh, open, select, button };
        refresh();
        return api;
    }

    function enhanceAll(root) {
        return Array.from((root || document).querySelectorAll(SELECTOR)).map(enhance).filter(Boolean);
    }

    window.CodeCompareSelect = { enhance, enhanceAll };
    enhanceAll(document);
})();
