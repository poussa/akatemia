# Development

## Databases

Members: Admin adds a user to the database when he/she is accepted as a member to the community. Only members can register and thus been able to join the users database.

Users: Firebase Authentication database. User is added when he/she registers to the system.

## Polymer

```bash
cd public
polymer serve
polymer build
```

## Firebase

```bash
firebase login
firebase projects:list
firebase use production|testing
firebase deploy
```

In public/src/app-shell.js toggle PRODUCTION variable to do your thing.

## Admin

Use the testing environment

```bash
export TARGET_ENV=testing
```

### Email change

```bash
./akatemia.js --del-member --email <old-email>
./akatemia.js --get-user --email <old-email>
./akatemia.js --del-user --uid <old-uid>
./akatemia.js --add-member --email <new-email> --firstname <name> --lastname <name>
```

### Add new member

```bash
./akatemia.js --add-member --email <email> --firstname <name> --lastname <name>
```

### Delete old member

### Delete user

```bash
./akatemia.js --get-user --email <email>
./akatemia.js --del-user --uid <uid>
```

### Update display name

```bash
./akatemia.js --update-user --uid <uid> --displayname <text>
```

## Versions

### 2020 Edition

```bash
firebase --version
8.0.2
polymer --version
1.9.11  
npm --version
6.12.0
node --version
v10.20.0
```

### 2019 Edition

```bash
firebase --version
6.4.0
polymer --version
1.9.11  
npm --version
6.12.0
node --version
v10.5.0
```
