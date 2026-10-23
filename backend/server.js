const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuración de la Base de Datos MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Liverpool6',
    database: 'proyecto_estadistica'
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos MySQL:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL exitosamente.');
});

// Endpoint de prueba
app.get('/api/ping', (req, res) => {
    res.json({ mensaje: 'Servidor Backend de Estadística funcionando al 100%' });
});

// Endpoint principal: Procesar datos estadísticos y guardarlos en MySQL
app.post('/api/estadistica/procesar', (req, res) => {
    try {
        const { nombre, datos } = req.body;

        if (!datos || !Array.isArray(datos) || datos.length === 0) {
            return res.status(400).json({ error: 'Debe proporcionar datos válidos' });
        }

        const nombreFinal = nombre && nombre.trim() !== "" ? nombre : "Sin nombre";

        const datosString = datos.join(', ');
        const totalDatos = datos.length;
        const query = 'INSERT INTO historial_calculos (nombre, datos_ingresados, total_datos) VALUES (?, ?, ?)';

        db.query(query, [nombreFinal, datosString, totalDatos], (dbErr, resultado) => {
            if (dbErr) {
                console.error('Error al guardar en la base de datos:', dbErr);
                return res.status(500).json({ error: 'Error al guardar en la base de datos' });
            } else {
                console.log('Cálculo guardado en MySQL con ID:', resultado.insertId);
                res.json({ mensaje: 'Guardado con éxito', id: resultado.insertId });
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Endpoint de Inteligencia Artificial con OpenRouter
app.post('/api/estadistica/analizar-ia', async (req, res) => {
    try {
        // 1. Extraemos tanto los datos como la pregunta recibida del frontend
        const { resultadosEstadísticos, pregunta } = req.body;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-chat",
                messages: [
                    {
                        role: "user",
                        content: `Actúa como un asistente de estadística directo y profesional.`
                    }
                ]
            })
        });

        const data = await response.json();

        // 2. Verificación si OpenRouter devuelve un error
        if (data.error) {
            console.error("Error devuelto por OpenRouter:", data.error);
            return res.status(500).json({ error: data.error.message || "Error al comunicarse con la IA." });
        }

        const analisisIA = data.choices?.[0]?.message?.content || "No se pudo generar el análisis.";

        res.json({ success: true, analisis: analisisIA });
    } catch (error) {
        console.error("Error en servidor backend:", error);
        res.status(500).json({ error: "Error al generar el análisis con IA." });
    }
});

// Ruta para consultar el historial de la base de datos
app.get('/api/historial', (req, res) => {
    db.query('SELECT * FROM historial_calculos ORDER BY fecha DESC', (err, results) => {
        if (err) {
            console.error('Error al consultar historial:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        res.json(results);
    });
});

// Ruta para ELIMINAR un registro de la base de datos
app.delete('/api/historial/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM historial_calculos WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al eliminar en la base de datos' });
        }
        res.json({ mensaje: 'Registro eliminado con éxito' });
    });
});

// Ruta para ACTUALIZAR/EDITAR un registro en la base de datos
app.put('/api/historial/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, datos } = req.body;
    const total_datos = datos.length;
    const datos_ingresados = datos.join(', ');

    const query = 'UPDATE historial_calculos SET nombre = ?, datos_ingresados = ?, total_datos = ? WHERE id = ?';
    db.query(query, [nombre, datos_ingresados, total_datos, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al actualizar en la base de datos' });
        }
        res.json({ mensaje: 'Registro actualizado con éxito' });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`);
});
