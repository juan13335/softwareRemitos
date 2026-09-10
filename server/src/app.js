import express from "express"; //FRAMEWORK WEB PARA NODEJS  
import cors from "cors"; //MIDDLEWARE DE SEGURIDAD PARA EXPRESS
import sociosRoutes from "./routes/socios.routes.js"; //IMPORTAMOS LAS RUTAS DE SOCIOS
import remitosRoutes from "./routes/remitos.routes.js"; //IMPORTAMOS LAS RUTAS DE REMITOS
const app = express();

app.use(cors());
app.use(express.json());


app.use('/api/socios', sociosRoutes);
app.use('/api/remitos', remitosRoutes);

export default app;