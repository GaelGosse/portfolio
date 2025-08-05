import { Request, Response } from "express";

export const getHomeData = (req: Request, res: Response) => {
	res.json({ message: "Bienvenue sur mon portfolio." });
};
