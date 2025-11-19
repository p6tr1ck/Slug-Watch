## Install Node.js LTS

https://nodejs.org/en/download

## Install Dependencies

```
cd frontend
npm ci
```

## Create .env file

```
cd frontend
touch .env
```

Inside the .env file:

```
VITE_SUPABASE_URL=paste url from discord
VITE_SUPABASE_ANON_KEY=paste key from discord
```

## Start a local development server

```
cd frontend
npm run dev
```
