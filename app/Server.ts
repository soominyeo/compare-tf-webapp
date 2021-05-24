import { Express, Request, Response, Router } from "express";
import express from "express";
import path from "path";
import { allowedNodeEnvironmentFlags } from "process";

export class Server {
	private app: Express;

	constructor(app: Express) {
		this.app = app;
		const apiRouter = express.Router();

		this.app.use(express.static(path.resolve("./") + "/build/frontend"));
		this.app.use("/api", apiRouter);

		apiRouter
			.route("/tensorflow/:target")
			.get((req: Request, res: Response): void => {
				if (req.params.target == "js") {
					// run javascript here
				} else if (req.params.target == "python") {
					// run python script here
				} else {
					res.status(404).send(`unknown script '${req.params.target}'`);
				}
			});

		// route to react page
		this.app.get("/*", (req: Request, res: Response): void => {
			res.sendFile(path.resolve("./") + "/build/frontend/index.html");
		});

		this.app.get("*", (req: Request, res: Response): void => {
			res.redirect("/");
		});
	}

	public start(port: number): void {
		this.app.listen(port, () =>
			console.log(`Server listening on port ${port}!`)
		);
	}
}
