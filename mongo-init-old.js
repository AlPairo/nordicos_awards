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

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'hashed_password', 'full_name'],
      properties: {
        username: { bsonType: 'string' },
        email: { bsonType: 'string' },
        hashed_password: { bsonType: 'string' },
        full_name: { bsonType: 'string' },
        role: { enum: ['admin', 'user'] },
        is_active: { bsonType: 'bool' },
        created_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('categories', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'year'],
      properties: {
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        year: { bsonType: 'int' },
        is_active: { bsonType: 'bool' },
        voting_start: { bsonType: 'date' },
        voting_end: { bsonType: 'date' },
        created_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('nominees', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'category_id'],
      properties: {
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        category_id: { bsonType: 'objectId' },
        image_url: { bsonType: 'string' },
        is_active: { bsonType: 'bool' },
        created_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('votes', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'nominee_id'],
      properties: {
        user_id: { bsonType: 'objectId' },
        nominee_id: { bsonType: 'objectId' },
        created_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('media_uploads', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'filename', 'original_filename', 'file_path', 'media_type', 'file_size'],
      properties: {
        user_id: { bsonType: 'objectId' },
        filename: { bsonType: 'string' },
        original_filename: { bsonType: 'string' },
        file_path: { bsonType: 'string' },
        media_type: { enum: ['photo', 'video'] },
        file_size: { bsonType: 'int' },
        status: { enum: ['pending', 'approved', 'rejected'] },
        description: { bsonType: 'string' },
        admin_notes: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        reviewed_at: { bsonType: 'date' }
      }
    }
  }
});

db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

db.nominees.createIndex({ "category_id": 1 });

db.votes.createIndex({ "user_id": 1 });
db.votes.createIndex({ "nominee_id": 1 });
db.votes.createIndex({ "user_id": 1, "nominee_id": 1 }, { unique: true });

db.media_uploads.createIndex({ "user_id": 1 });
db.media_uploads.createIndex({ "status": 1 });

print('Database nordicos_awards initialized successfully!');