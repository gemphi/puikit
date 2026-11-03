import { mountPhiApp } from '@phi-kit/mount';
import { APPS, currentAppKey } from '@phi-kit/data';

// The one running app: which app it is comes from the address (/phiora/, /phihub/), what it does from that app's config.
const key = currentAppKey();
if (APPS.some((a) => a.key === key && a.config)) mountPhiApp(key);
else window.location.replace('/' + (APPS.find((a) => a.config)?.key ?? '') + '/');
