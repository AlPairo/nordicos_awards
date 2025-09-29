db = db.getSiblingDB('nordicos_awards');

db.createUser({
  user: 'nordicos_user',
  pwd: 'nordicos_password',
  roles: [
    {
      role: 'readWrite',
      db: 'nordicos_awards'
    }
  ]
});

db.createCollection('users');
db.createCollection('categories'); 
db.createCollection('nominees');
db.createCollection('votes');
db.createCollection('media_uploads');

print('Database and collections initialized successfully');