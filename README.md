```
API Webserver
├─ package-lock.json
├─ package.json
├─ README.md
├─ src
│  ├─ app.ts
│  ├─ config
│  │  ├─ accessKey.ts
│  │  └─ url.ts
│  ├─ controllers
│  │  ├─ event.controller.ts
│  │  ├─ media.controller.ts
│  │  └─ mediaShown.controller.ts
│  ├─ middlewares
│  │  ├─ authenticateKey.ts
│  │  └─ errorHandler.ts
│  ├─ routes
│  │  ├─ event.routes.ts
│  │  └─ media.routes.ts
│  ├─ server.ts
│  ├─ services
│  │  ├─ event.services.ts
│  │  ├─ media.services.ts
│  │  └─ mediaShown.services.ts
│  ├─ static
│  │  └─ test.test
│  └─ uploads
│     ├─ community
│     │  ├─ images
│     │  └─ shown
│     └─ temp
└─ tsconfig.json

```
```
API Webserver
├─ package-lock.json
├─ package.json
├─ README.md
├─ src
│  ├─ app.ts
│  ├─ config
│  │  ├─ accessKey.ts
│  │  ├─ firebase.ts
│  │  └─ url.ts
│  ├─ controllers
│  │  ├─ event.controller.ts
│  │  ├─ media.controller.ts
│  │  └─ mediaShown.controller.ts
│  ├─ helpers
│  │  ├─ eventValidation.ts
│  │  └─ firebase.ts
│  ├─ middlewares
│  │  ├─ authenticateKey.ts
│  │  └─ errorHandler.ts
│  ├─ routes
│  │  ├─ event.routes.ts
│  │  └─ media.routes.ts
│  ├─ server.ts
│  ├─ services
│  │  ├─ event.services.ts
│  │  ├─ media.services.ts
│  │  └─ mediaShown.services.ts
│  └─ types
│     ├─ event.ts
│     └─ firebase.ts
├─ static
│  └─ test.test
├─ tsconfig.json
└─ uploads
   ├─ community
   │  ├─ images
   │  │  └─ images.json
   │  └─ shown
   └─ temp

```