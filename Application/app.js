const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const mime = require('mime-types');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

app.use(bodyParser.json());
app.use(express.static('static'));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.get('/', (req, res) => res.sendFile(__dirname + "/static/html/index.html"));
app.get('/plant_type', (req, res) => res.sendFile(__dirname + "/static/html/plant_type.html"));
app.get('/image_gallery', (req, res) => res.sendFile(__dirname + "/static/html/image_gallery.html"));
app.get('/task_list', (req, res) => res.sendFile(__dirname + "/static/html/task_list.html"));
app.get('/type/:id', async (req, res) => {
    res.sendFile(__dirname + '/static/html/plant_type.html');
});


const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});

//Index
app.get('/allTypes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vrsta_biljke;');
        const types = result.rows;

        res.json({ success: true, types: types });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.get('/fetchLastAddedImage', async (req, res) => {
    try {
        const plantTypesQuery = 'SELECT * FROM vrsta_biljke';
        const plantTypes = await pool.query(plantTypesQuery);

        const imageForPlantType = await Promise.all(
            plantTypes.rows.map(async (type) => {
                const lastAddedImageQuery = `
                    SELECT slika
                    FROM slike_biljke sb
                    INNER JOIN biljka b ON sb.id_biljke = b.id
                    WHERE b.id_vrste = $1
                    ORDER BY sb.datum_pohrane DESC
                    LIMIT 1
                `;

                const lastImage = await pool.query(lastAddedImageQuery, [type.id]);
                const imageBase64 = lastImage.rows.length > 0 ? lastImage.rows[0].slika.toString('base64') : null;

                return {
                    id: type.id,
                    vrsta: type.naziv,
                    slika: imageBase64,
                };
            })
        );
        res.json(imageForPlantType);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/addPlantType', async (req, res) => {
    const { typeName } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO vrsta_biljke(naziv) VALUES ($1) RETURNING *',
            [typeName]
        );
        res.status(201).json({ success: true, novaVrsta: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/deletePlantType/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await pool.query('DELETE FROM vrsta_biljke WHERE id = $1 RETURNING *', [id]);
        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Plant_type
app.get('/plantType/:id', async (req, res) => {
    const typeId = req.params.id;

    try {
        const result = await pool.query(
            `SELECT biljka.id, biljka.naziv, biljka.datum_sadnje, biljka.id_vrste, biljka.datum_zadnjeg_zadatka, biljka.broj_slika,
            biljka.broj_zadataka, vrsta_biljke.naziv AS naziv_vrste
            FROM vrsta_biljke
            LEFT JOIN biljka ON vrsta_biljke.id = biljka.id_vrste
            WHERE vrsta_biljke.id = $1
            ORDER BY biljka.id;`,
            [typeId]
        );

        const plants = result.rows;

        res.json({ plants });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/plant/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const result = await pool.query('SELECT * FROM biljka WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).send('Biljka nije pronađena.');
        }

        const plant = result.rows[0];

        res.json({ plant });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/plant', async (req, res) => {
    const { naziv, datum_sadnje, id_vrste, datum_zadnjeg_zadatka, broj_slika } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO biljka(naziv, datum_sadnje, id_vrste, datum_zadnjeg_zadatka, broj_slika) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [naziv, datum_sadnje, id_vrste, datum_zadnjeg_zadatka, broj_slika]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/plant/:id', async (req, res) => {
    const id = req.params.id;
    const { naziv, datum_sadnje, id_vrste, datum_zadnjeg_zadatka, broj_slika } = req.body;
    try {
        const result = await pool.query(
            'UPDATE biljka SET naziv = $1, datum_sadnje = $2, id_vrste = $3, datum_zadnjeg_zadatka = $4, broj_slika = $5 WHERE id = $6 RETURNING *',
            [naziv, datum_sadnje, id_vrste, datum_zadnjeg_zadatka, broj_slika, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/biljke/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('DELETE FROM biljka WHERE id = $1 RETURNING *', [id]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Image gallery
app.post('/uploadImage', upload.single('image'), async (req, res) => {
    try {
        const { description } = req.body;
        const plantId = parseInt(req.body.plant_id); 
        const type = mime.extension(req.file.mimetype);
        const image = Buffer.from(req.file.buffer);
        const currentDate = new Date();

        await pool.query(
            'INSERT INTO slike_biljke (id_biljke, datum_pohrane, opis, tip, slika) VALUES ($1, $2, $3, $4, $5)',
            [plantId, currentDate, description, type, image]
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/plantImage/:id', async (req, res) => {
    try {
        const plantId = parseInt(req.params.id);
        const images = await pool.query('SELECT * FROM slike_biljke WHERE id_biljke = $1', [plantId]);

        const imageBase64 = images.rows.map(slika => {
            return {
                id: slika.id,
                opis: slika.opis,
                tip: slika.tip,
                slika: slika.slika.toString('base64')
            };
        });

        res.json({ images: imageBase64 });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


app.delete('/plantImage/:id', async (req, res) => {
    try {
        const plantId = parseInt(req.params.id);

        await pool.query('DELETE FROM slike_biljke WHERE id = $1', [plantId]);

        res.json({ message: 'Slika uspješno obrisana.' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

//Task list
app.get('/tasks', async (req, res) => {
    const month = parseInt(req.query.month) || new Date().getMonth();
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const plantId = req.query.plantId;

    try {
        const tasksQuery = `
            SELECT id, naziv, opis, datum, izvrsen
            FROM zadaci
            WHERE EXTRACT(MONTH FROM datum) = $1
            AND EXTRACT(YEAR FROM datum) = $2
            AND id_biljke = $3
            ORDER BY id;
        `;

        const tasks = await pool.query(tasksQuery, [month, year, plantId]);
        const data = { allTasks: tasks.rows };

        res.json(data);
    } catch (error) {
        console.error('Greška prilikom dohvaćanja podataka iz baze:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/listOfCompletedTasks', async (req, res) => {
    const day = parseInt(req.query.day) || new Date().getDay();
    const plantId = req.query.plantId;

    try {
        const tasksQuery = `
            SELECT id, naziv, opis
            FROM zadaci
            WHERE EXTRACT(DAY FROM datum) = $1            
            AND id_biljke = $2
            AND izvrsen = true
            ORDER BY id;
        `;

        const tasks = await pool.query(tasksQuery, [day, plantId]);
        const data = { tasks: tasks.rows };

        res.json(data);
    } catch (error) {
        console.error('Greška prilikom dohvaćanja podataka iz baze:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/task', async (req, res) => {
    try {
        const { plantId, name, description, date } = req.body;
        const taskQuery = 'INSERT INTO zadaci (id_biljke, naziv, opis, datum) VALUES ($1, $2, $3, $4) RETURNING *';

        const result = await pool.query(taskQuery, [plantId, name, description, date]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Greška prilikom dodavanja zadatka:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/makeTaskCompleted/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const taskQuery = 'UPDATE zadaci SET izvrsen = true WHERE id = $1 RETURNING *';

        const result = await pool.query(taskQuery, [id]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Greška prilikom označavanja zadatka izvršenim:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(process.env.APP_PORT, () => {
    console.log('Server listening on port ' + process.env.APP_PORT);
});