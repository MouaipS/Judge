import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import { error } from "node:console";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const header = req.headers.authorization;

	if(!header || !header.startsWith("Bearer ")) {
		return res.status(401).json({error: "token manquant"});
	}

	const token = header.slice(7); //To delete "Bearer"

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub : string};
		req.userId = payload.sub;
		next();
	} catch {
		return res.status(401).json({error: "token invalide ou expiré"});
	}
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
	const header = req.headers.authorization;

	// Pas de token → on continue en anonyme, sans erreur
	if (!header || !header.startsWith("Bearer ")) {
		return next();
	}

	const token = header.slice(7);

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
		req.userId = payload.sub;
	} catch {
		// Token présent mais invalide/expiré → on l'ignore, on reste anonyme
	}

	next();
}