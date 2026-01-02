'use client';

import { useEffect } from 'react';

const WIDGET_SCRIPT_ID = 'bmc-widget-script';
const WIDGET_STYLE_ID = 'bmc-widget-style';

const WIDGET_BUTTON_ID = 'bmc-wbtn';

const WIDGET_BOTTOM_PX = 86;
const WIDGET_Z_INDEX = 60;

export function BuyMeACoffeeWidget() {
	useEffect(() => {
		if (typeof document === 'undefined') return;
		if (typeof window === 'undefined') return;

		// Styl musi być obecny niezależnie od tego, czy skrypt już istnieje.
		const css = `
/* Keep BuyMeACoffee widget above the fullscreen button */
#bmc-wbtn,
.bmc-wbtn,
#bmc-wbtn-container,
.bmc-btn-container,
.bmc-widget {
	z-index: ${WIDGET_Z_INDEX} !important;
}

#bmc-wbtn,
.bmc-wbtn,
#bmc-wbtn-container {
	bottom: ${WIDGET_BOTTOM_PX}px !important;
}
`;

		let styleEl = document.getElementById(WIDGET_STYLE_ID) as HTMLStyleElement | null;
		if (!styleEl) {
			styleEl = document.createElement('style');
			styleEl.id = WIDGET_STYLE_ID;
			document.head.appendChild(styleEl);
		}
		if (styleEl.textContent !== css) styleEl.textContent = css;

		const ensureWidgetInitialized = () => {
			// Skrypt BMC tworzy element o id "bmc-wbtn".
			if (document.getElementById(WIDGET_BUTTON_ID)) return;
			// widget.prod.min.js rejestruje handler na window "DOMContentLoaded".
			// Ponieważ wstrzykujemy skrypt po mount (czyli często po DOMContentLoaded),
			// ręcznie wyzwalamy event, ale tylko jeśli widget jeszcze nie istnieje.
			window.dispatchEvent(new Event('DOMContentLoaded'));
		};

		// Jeśli skrypt już jest (HMR / ponowny mount), a widget nadal nie powstał, inicjalizujemy go.
		const existing = document.getElementById(WIDGET_SCRIPT_ID) as HTMLScriptElement | null;
		if (existing) {
			ensureWidgetInitialized();
			window.setTimeout(ensureWidgetInitialized, 50);
			return;
		}

		const script = document.createElement('script');
		script.id = WIDGET_SCRIPT_ID;
		script.type = 'text/javascript';
		script.async = true;
		script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';

		script.setAttribute('data-name', 'BMC-Widget');
		script.setAttribute('data-cfasync', 'false');
		script.setAttribute('data-id', 'fijalkowsks');
		script.setAttribute('data-description', 'Support me on Buy me a coffee!');
		script.setAttribute('data-message', 'Zrobione z miłości (i kofeiny) ❤️☕');
		script.setAttribute('data-color', '#BD5FFF');
		script.setAttribute('data-position', 'Right');
		script.setAttribute('data-x_margin', '18');
		script.setAttribute('data-y_margin', String(WIDGET_BOTTOM_PX));

		script.addEventListener('load', () => {
			ensureWidgetInitialized();
			window.setTimeout(ensureWidgetInitialized, 50);
		});

		document.body.appendChild(script);
	}, []);

	return null;
}
