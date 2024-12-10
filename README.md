# element-craft-backend

## Final Data Export

https://drive.google.com/drive/folders/1tLH5GmHPn7IwlLsxKTJMLSjGJ2c7uQB4?usp=sharing


 
https://partner.steamgames.com/doc/store/localization/languages

https://partner.steamgames.com/doc/features/auth#:~:text=of%20downloadable%20content.-,Backend%20Server,-Session%20Tickets%20and

```
type input.json | python -m json.tool > output.json
```

### Creating the data

```
pg_dump -Fc --no-acl --no-owner -h localhost -U postgres -d postgres -f data.dump
```

```
heroku pg:backups:restore '<SIGNED URL>' DATABASE_URL --app alchemy-unbound-prerelease
```

### Migrating (Running SQL Script)

```
heroku pg:psql --app alchemy-unbound-prerelease < C:\Users\KlutzyBubbles\Documents\GitHub\element-craft-backend\prisma\migrations\1_v2\migration.sql

heroku pg:psql --app alchemy-unbound-release < C:\Users\KlutzyBubbles\Documents\GitHub\element-craft-backend\migration.sql
```
