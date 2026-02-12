# Git Workflow Guide

## Branch Structure
```
main (production)
└── development (integration)
    ├── module1/feature-name
    ├── module2/feature-name
    ├── module3/feature-name
    └── module4/feature-name
```

## Daily Workflow

### 1. Start Your Day
```bash
git checkout development
git pull origin development
git checkout -b module1/your-feature-name
```

### 2. Make Changes
Work only in your module folders

### 3. Commit
```bash
git add .
git commit -m "Module 1: Add skill assessment feature"
git push origin module1/your-feature-name
```

### 4. Create Pull Request
On GitHub, create PR from your branch to `development`

## Commit Message Format
```
Module X: Brief description

- Detailed point 1
- Detailed point 2
```

Example:
```
Module 2: Implement quiz generation

- Add PDF text extraction
- Integrate Gemini API
- Create quiz display component
```
