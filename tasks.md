# Phient UI (`@pui/components`) Maintenance & Operational Tasks

> _Operational tasks, test execution, application development, and build pipelines._

---

## 1. Development Tasks

### Running the Documentation & Workbench App (`pui-book` / `puikit.com`)
```bash
cd apps/pui-book
npm install
npm run dev
```

### Running the Enterprise Operations Cockpit (`demo-app`)
```bash
cd apps/demo-app
npm install
npm run dev
```

### Running the Landing Page (`landing-app`)
```bash
cd apps/landing-app
npm install
npm run dev
```

---

## 2. Validation & Testing Tasks

### Run Component Tests
```bash
cd apps/pui-book
npm test
```

### Typecheck Core Library
```bash
cd pui
npm run typecheck
```
