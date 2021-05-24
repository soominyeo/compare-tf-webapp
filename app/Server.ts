import { Express, Request, Response, Router } from "express";
import express from "express";
import path from "path";
import fs from "fs";
import child_process, { spawn } from "child_process";

export class Server {
	private app: Express;

	constructor(app: Express) {
		this.app = app;
		const apiRouter = Router();
		const isProduction = !fs.existsSync(path.resolve('./build/frontend/index.html'))
		console.log('isproduction', isProduction);

		this.app.use(express.static(path.join(path.resolve("./"), (isProduction?"/frontend":"/build/frontend"))));
		this.app.use("/api", apiRouter);
		apiRouter.use(express.json());

		apiRouter
			.route("/:script/:target")
			.post((req: Request, res: Response): void => {
				if (!req.is("application/json")) {
					res.status(400).send(`invalid request`);
					return;
				}
				// resolve script path
				const scriptPath = resolveScript(req.params.script, req.params.target);

				if (!fs.existsSync(scriptPath)) {
					res.status(404).send(`unknown script '${req.params.target}'`);
				}

				runScript(req.params.target, scriptPath, req.body).then((result) => {
					console.log(result);
					res.json(result);
				});
			});

		// route to react page
		this.app.get("/*", (req: Request, res: Response): void => {
			const documentPath = path.resolve("./") + path.join((isProduction)?"/frontend":"/build/frontend" + "/index.html");
			console.log(documentPath, path.resolve("./"), (isProduction)?"/frontend":"/build/frontend");
			res.sendFile(documentPath);
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

function resolveScript(script: string, target: string) {
	const extension = {
		js: "js",
		python: "py",
	};

	return path.join(
		path.resolve("./app/scripts"),
		target,
		`/${script}.${extension[target]}`
	);
}

function runScript(target: string, scriptPath: string, data: object) {
	const command = {
		js: "node",
		python: "python",
	};

	console.log(target, scriptPath, JSON.stringify(data));

	return new Promise((resolve, reject) => {
		const child = spawn(command[target], [scriptPath]);
		const startTime = Date.now();
		let buffer = "";

		initiate(child, data);

		child.stdout.on("data", (data) => {
			buffer += data.toString();
			console.log("stdout>" + data.toString());
		});

		child.on("close", (code) => {
			const endTime = Date.now();
			console.log(code);
			resolve({
				...JSON.parse(buffer || "{}"),
				totalTime: endTime - startTime,
			});
		});
	});

	function initiate(child: child_process.ChildProcess, data: object) {
		child.stdin.write(JSON.stringify(data) + "\n");
	}
}
