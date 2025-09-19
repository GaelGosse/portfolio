import express from "express";
import path from "path";
import Library from "./library";
const lib = new Library();

const app = express();
const PORT = 3000;

// Middleware JSON
app.use(express.json());

// API
import homeRoutes from "./routes/home";
app.use("/api", homeRoutes);

// Fichiers React (compilés dans client/dist)
app.use(express.static(path.join(__dirname, "client", "dist")));
app.use('/models', express.static(path.join(__dirname, 'models')));

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

app.listen(PORT, () => {
	console.log(`${lib.now()} http://localhost:${PORT}`);
});
