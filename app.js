
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

const config = {
  server: 'localhost',
  database: 'IAPP',
  user: 'sa',
  password: 'Test@123',
  options: {
    encrypt: false,
    requestTimeout: 100000,
  },
};

// Use the cors middleware

app.use(express.json());
app.use(cors({credentials: true}));

app.get('/emp', async (req, res) => {
  try {
    debugger;
    const pool = await sql.connect(config);
    const result = await pool.request().execute('GetCountsForAllAreas');

    const countsForAllAreas = result.recordset.reduce((acc, area) => {
      acc[area.AreaType] = area.Count;
      //  console.log(acc, area);
      return acc;
    }, {});

     // Emit the 'transDataInserted' event when data is inserted
    //  io.emit('transDataInserted', countsForAllAreas);

    res.json(countsForAllAreas);

  } catch (error) {
    console.error('Error retrieving count:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/emp/:pageName', async (req, res) => {
  try {
    const pageName = req.params.pageName;

    const pool = await sql.connect(config);

    // Call the stored procedure with the pageName and inOut parameters
    const result = await pool.request()
      .input('PageName', sql.NVarChar(50), pageName)
      .execute('GetInAndOutData');

    const inData = result.recordsets[0];
    const outData = result.recordsets[1];

    res.json({ inData, outData });

  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/totalheadcount/:pageName', async (req, res) => {
  try {
    const pageName = req.params.pageName;

    const pool = await sql.connect(config);

    // Call the modified stored procedure with the pageName parameter
    const result = await pool.request()
      .input('PageName', sql.NVarChar(50), pageName)
      .execute('GetTotalHeadCount');

      // console.log(result.recordset[0].TotalHeadcount);
      
    const totalHeadcount = result.recordset[0].TotalHeadcount;

    res.json({ totalHeadcount });
    

  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/functcount/:pageName', async (req, res) => {
  try {
    const pageName = req.params.pageName;
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('PageName', sql.NVarChar(50), pageName)
      .execute('GetFunctcount');

    const functTypecount = result.recordset.reduce((acc, funct) => {
      console.log(funct);
      acc[funct.FunctionType] = funct.Count; // Corrected the key here

      console.log(acc);
      return acc;
    }, {});

    res.json( functTypecount );
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/functlists/:pageName', async (req, res) => {
  try {
    const pageName = req.params.pageName;
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('PageName', sql.NVarChar(50), pageName)
      .execute('GetFunctlist');

    const functTypelist = result.recordset.map((res) => ({
      EmpCode: res.EmpCode, FunctionType: res.FunctionType, Name: res.Name, ContactNo:res.ContactNo,
    }));

    res.json( functTypelist );
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//WebSocket connection handling
// io.on('connection', (socket) => {
//   console.log('A user connected');

//   (async () => {
//     try {
//       // Call the '/emp' API endpoint to get data
//       const pool = await sql.connect(config);
//       const result = await pool.request().execute('GetCountsForAllAreas');

//       const countsForAllAreas = result.recordset.reduce((acc, area) => {
//         acc[area.AreaType] = area.Count;
//         console.log(acc, area);
//         return acc;
//       }, {});

//       // Emit the data to the connected client
//       // io.to(socket.id).emit('empData', countsForAllAreas);

//       setTimeout(() => {
//         io.emit('empData', countsForAllAreas);
//       }, 5000); // 5-second delay

//     } catch (error) {
//       console.error('Error retrieving count:', error);
//       io.to(socket.id).emit('empDataError', { error: 'Internal Server Error' });
//     }
//   })();

//   // Handle incoming messages
//   socket.on('message', (message) => {
//     console.log('Received message:', message);
//     // Broadcast the message to all connected clients
//     io.emit('message', message);
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });
// });


sql.connect(config)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
  });