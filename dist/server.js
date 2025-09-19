"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const library_1 = __importDefault(require("./library"));
const lib = new library_1.default();
const app = (0, express_1.default)();
const PORT = 3000;
// Middleware JSON
app.use(express_1.default.json());
// API
const home_1 = __importDefault(require("./routes/home"));
app.use("/api", home_1.default);
// Fichiers React (compilés dans client/dist)
app.use(express_1.default.static(path_1.default.join(__dirname, "client", "dist")));
app.use('/models', express_1.default.static(path_1.default.join(__dirname, 'models')));
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "client", "dist", "index.html"));
});
app.listen(PORT, () => {
    console.log(`${lib.now()} http://localhost:${PORT}`);
});
