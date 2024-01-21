# Application for plant monitoring

### Prerequisites

- Installed Node.js
- Installed PostgreSQL

### How to install Node.js

### Linux

#### 1. Update package information
```bash
sudo apt update
```

#### 2. Install Node.js
```bash
sudo apt install nodejs
```

#### 3. Install Node Package Manager
```bash
sudo apt install npm
```

### Windows

#### 1.Visit the [Node.js website](https://nodejs.org/en) and download LTS version for Windows

#### 2. Run the installer and follow the instructions

### How to install PostgreSQL

### Linux

#### 1. Install PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib
```

#### 2. Set a password for the "postgres" user
```bash
sudo passwd postgres
```
#### 3. Log in as the "postgres" user
```bash
su - postgres
```

#### 4. Start the PostgreSQL prompt
```bash
psql
```

### Windows

#### 1. Visit the PostgreSQL website and download the installer for Windows.

#### 2. Run the installer and follow the instructions. During installation, set a password for the superuser "postgres"

#### 3. After instalation, open SQL Shell and enter password



## Running the Web app (from terminal)

#### 0. Check .env file and change postgres: host, port, user or password to be like yours.
#### Also, change in package.json initDB and resetDB to be like yours. Example:
```bash
"initDB": "cd Database && psql -f Create.sql postgresql://postgres_user:password_for_postgres_user@host"
```
Next commands needs to be executed from the /Application folder:

#### 1. Create a database (with belonging tables, triggers, etc.)
```bash
npm run initDB
```

#### 2. Install the necessary dependencies
```bash
npm i
```

#### 3. Run the app 
```
npm start
```

#### 4. Delete tables, triggers, etc.
```bash
npm run resetDB
```


## Documentation
Documentation can be accessed via [Documentation](https://github.com/tonivelkovski/application_for_plant_monitoring/tree/main/Documentation) folder.
