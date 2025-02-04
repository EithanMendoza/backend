const { dbConnect } = require('C:/Users/gabri/OneDrive/Desktop/TAREAS UTM TERCER/BACKEND_AIRTECSFLUTTER/backend/database');


const testConnection = async () => {
  try {
    const db = await dbConnect();
    const collections = await db.listCollections().toArray();
    console.log('✅ Colecciones en la BD:', collections.map(c => c.name));
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en la conexión:', err);
    process.exit(1);
  }
};

testConnection();
