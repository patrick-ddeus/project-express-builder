(async () => {
  const args = process.argv;
  const extension =
    args.includes("typescript") || args.includes("ts") ? "ts" : "js";
  const resource = args[args.length - 1] || "default";

  const structure = {
    controllers: `${resource}.controller.${extension}`,
    services: `${resource}.service.${extension}`,
    repositories: `${resource}.repository.${extension}`,
    routers: `${resource}.router.${extension}`,
    middlewares: `validation.middleware.${extension}`,
    errors: `invalidData.error.${extension}`,
    schemas: `params.schema.${extension}`,
    configs: `index.ts`,
  };

  const { execa } = await import("execa");
  const fs = await import("fs");
  const path = await import("path");
  const inquirer = await import("inquirer");
  const prompt = inquirer.createPromptModule();

  let projectName = "project";

  if (!args.includes("-i")) {
    const { project } = await prompt({
      type: "input",
      name: "project",
      message: "Nome do projeto:",
    });

    projectName = project;
  }

  const cliProgress = await import("cli-progress");
  const bar1 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );

  bar1.start(100, 0);
  const isLoading = loading(bar1);
  try {
    const sourcePath = path.resolve(projectName, "src");

    if (!fs.existsSync(sourcePath)) {
      fs.mkdirSync(sourcePath, { recursive: true });
    }

    fs.writeFileSync(
      path.resolve(projectName, "src", `app.${extension}`),
      `import express, { Express } from "express";
import cors from "cors";

import { loadEnv } from "./configs";
import IndexRouter from "./routers/index.router";

loadEnv();

const app = express();
app
  .use(cors())
  .use(express.json())
  .use(IndexRouter)
  .get("/health", (_req, res) => res.send("OK!"));

export function init(): Promise<Express> {
  return Promise.resolve(app);
}

export default app;      
      `
    );

    fs.writeFileSync(
      path.resolve(projectName, "src", `server.${extension}`),
      `import app, { init } from './app';

const port = +process.env.PORT || 4000;

init().then(() => {
  app.listen(port, () => {
    /* eslint-disable-next-line no-console */
    console.log(\`Server is listening on port \${port}.\`);
  });
});
      `
    );

    if (!fs.existsSync(`/node_modules`)) {
      await execa("npm", ["init", "-y"], { cwd: projectName });
      await execa(
        "npm",
        [
          "i",
          "express",
          "http-status",
          "joi",
          "dotenv",
          "cors",
          "dotenv-expand",
        ],
        {
          cwd: projectName,
        }
      );
      await execa("npm", ["i", "-D", "nodemon"], { cwd: projectName });

      if (extension === "ts") {
        await execa(
          "npm",
          [
            "i",
            "-D",
            "typescript",
            "typescript-transform-paths",
            "ts-node",
            "tsconfig-paths",
            "ttypescript",
            "typescript-transform-paths",
          ],
          { cwd: projectName }
        );
        await execa(
          "npm",
          [
            "i",
            "-D",
            "@types/express",
            "@types/node",
            "@types/cors",
            "@types/dotenv",
            "cross-env",
          ],
          { cwd: projectName }
        );
        await execa("npx", ["gitignore", "node"], { cwd: projectName });

        bar1.update(50);

        fs.writeFileSync(
          path.resolve(projectName, "tsconfig.json"),
          JSON.stringify(
            {
              compilerOptions: {
                target: "es2020",
                module: "commonjs",
                outDir: "dist",
                noImplicitAny: true,
                emitDecoratorMetadata: true,
                experimentalDecorators: true,
                esModuleInterop: true,
                rootDirs: ["src", "tests"],
                baseUrl: "src",
                paths: {
                  "@/*": ["*"],
                },
                plugins: [
                  {
                    transform: "typescript-transform-paths",
                  },
                ],
              },
              include: ["src", "tests"],
            },
            null,
            2
          )
        );
        fs.writeFileSync(
          path.resolve(projectName, "nodemon.json"),
          JSON.stringify(
            {
              execMap: {
                ts: "node --require ts-node/register",
              },
            },
            null,
            2
          )
        );

        fs.readFile(
          path.resolve(projectName, "package.json"),
          "utf8",
          (err, data) => {
            if (err) {
              console.error(err);
              return;
            }
            const newPackage = JSON.parse(data);
            newPackage.scripts.dev =
              "cross-env NODE_ENV=development nodemon ./src/server.ts'";
            newPackage.scripts.start = "node dist/server.js";
            newPackage.scripts.build = "tsc -p tsconfig.build.json";
            newPackage.scripts.lint = "eslint .";
            newPackage.scripts.prebuild = "rm -rf dist";
            delete newPackage.scripts.test;

            fs.writeFileSync(
              path.resolve(projectName, "package.json"),
              JSON.stringify(newPackage, null, 2)
            );
          }
        );

        fs.writeFileSync(
          path.resolve(projectName, "src", "protocols.ts"),
          `export type ApplicationError = {
  name: string;
  message: string;
};
          `
        );
      }
    }

    for (let [foulder, file] of Object.entries(structure)) {
      const fullPath = `${sourcePath}/${foulder}`;

      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(`${sourcePath}/${foulder}`);
      }

      fs.writeFileSync(
        `${sourcePath}/${foulder}/${file}`,
        constructorTemplate(replacePlurality(foulder), resource, extension)
      );

      if (foulder === "routers") {
        const indexRouterPath = `${sourcePath}/${foulder}/index.router.${extension}`;
        if (!fs.existsSync(indexRouterPath)) {
          fs.writeFileSync(
            indexRouterPath,
            `import { Router } from "express";
// You can add more routes but don't change this comment (import)

const IndexRouter = Router();

// You can add more routes but don't change this comment (index)

export default IndexRouter`
          );
        }

        fs.readFile(indexRouterPath, "utf8", (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          const newRouteCode = `IndexRouter.use(${resource}Router)`;

          const routeMarker =
            "// You can add more routes but don't change this comment (index)";

          const regex =
            /\/\/\s*You can add more routes but don't change this comment \(index\)/gm;

          if (regex.test(data) && !data.includes(newRouteCode)) {
            const updatedRouter = data.replace(
              regex,
              newRouteCode + "\n" + routeMarker
            );

            const regexForImports =
              /\/\/\s*You can add more routes but don't change this comment \(import\)/gm;

            const newImport = `import { ${resource}Router } from "./${resource}.router";`;
            if (regexForImports.test(data) && !data.includes(newImport)) {
              const importsMark =
                "// You can add more routes but don't change this comment (import)";
              const updatedImport = updatedRouter.replace(
                regexForImports,
                newImport + "\n" + importsMark
              );
              fs.writeFile(
                indexRouterPath,
                updatedImport,
                "utf-8",
                (writeErr) => {
                  if (writeErr) {
                    console.error(writeErr);
                    return;
                  }
                  console.log("New route added successfully.");
                }
              );
            }
          }
        });
      }
    }

    bar1.update(100);
    bar1.stop();
    clearInterval(isLoading);
    console.log("         ");
    console.log("All Done!");
    console.log("         ");
    console.log("Happy Hacking! ❤");
    console.log("         ");
    console.log("         ");
  } catch (error) {
    console.error(
      `ERROR: The command failed. stderr: ${error} (${error.exitCode})`
    );
    console.log(error);
    bar1.stop();
    process.exit(1);
  }
})();

function constructorTemplate(foulder, theme = "default", extension = "js") {
  const template = {
    controller: `import ${theme}Service from '../services/${theme}.service';
${extension === "ts" ? 'import { Request, Response } from "express";' : ""}

async function create(req${extension === "ts" ? ": Request" : ""}, res${
      extension === "ts" ? ": Response" : ""
    }) {
  const body = req.body ${extension === "ts" ? "as BodyParams" : ""}
  try {
    const data = await ${theme}Service.create(body);
    res.status(201).json(data);
  } catch (error) {
    res.sendStatus(500);
  }
}

async function read(req${extension === "ts" ? ": Request" : ""}, res${
      extension === "ts" ? ": Response" : ""
    }) {
  try {
    const data = await ${theme}Service.read();
    res.status(200).json(data);
  } catch (error) {
    res.sendStatus(500);
  }
}

async function readOne(req${extension === "ts" ? ": Request" : ""}, res${
      extension === "ts" ? ": Response" : ""
    }) {
  const { id } = req.params;

  try {
    const data = await ${theme}Service.readOne(+id);
    res.status(200).json(data);
  } catch (error) {
    res.sendStatus(500);
  }
}

async function update(req${extension === "ts" ? ": Request" : ""}, res${
      extension === "ts" ? ": Response" : ""
    }) {
  const { id } = req.params;
  const update = req.body
  
  try {
    const data = await ${theme}Service.update(+id, update);
    res.status(200).json(data);
  } catch (error) {
    res.sendStatus(500);
  }
}

async function remove(req${extension === "ts" ? ": Request" : ""}, res${
      extension === "ts" ? ": Response" : ""
    }) {
  const { id } = req.params;

  try {
    const data = await ${theme}Service.remove(+id);
    res.status(200).json(data);
  } catch (error) {
    res.sendStatus(500);
  }
}
${
  extension === "ts"
    ? `export type BodyParams = {};
export type UpdateBodyParams = Partial<BodyParams>;`
    : ""
}

export default {
  create,
  readOne,
  read,
  update,
  remove,
};  
  `,
    service: `import ${theme}Repository from '../repositories/${theme}.repository';
import { BodyParams, UpdateBodyParams } from '../controllers/${theme}.controller';

async function create(body${extension === "ts" ? ": BodyParams" : ""}) {
  return ${theme}Repository.create();
}

async function read() {
  return ${theme}Repository.list();
}

async function readOne(id${extension === "ts" ? ": number" : ""}) {
  return ${theme}Repository.listOne();
}

async function update(id${extension === "ts" ? ": number" : ""}, body${
      extension === "ts" ? ": UpdateBodyParams" : ""
    }) {
  return ${theme}Repository.update();
}

async function remove(id${extension === "ts" ? ": number" : ""}) {
  return ${theme}Repository.remove();
}

export default {
  create,
  readOne,
  read,
  update,
  remove,
};
`,
    repository: `async function create() {
  return "Created!";
}

async function list() {
  return "Read data";
}

async function listOne() {
  return "Read data";
}

async function update() {
  return "Updated Data";
}

async function remove() {
  return "removed data";
}

export default {
  create,
  list,
  listOne,
  update,
  remove,
};
`,
    router: `import { Router } from "express";
import ${theme}Controller from "../controllers/${theme}.controller";
import { validateParams } from "../middlewares/validation.middleware";
import { signInSchema } from "../schemas/params.schema";

const ${theme}Router = Router();

${theme}Router.get("/${theme}", ${theme}Controller.read);
${theme}Router.get("/${theme}/:id", validateParams(signInSchema), ${theme}Controller.readOne);
${theme}Router.post("/${theme}", ${theme}Controller.create);
${theme}Router.patch("/${theme}/:id", validateParams(signInSchema), ${theme}Controller.update);
${theme}Router.delete("/${theme}/:id", validateParams(signInSchema), ${theme}Controller.remove);

export { ${theme}Router };    
`,
    middleware: `import httpStatus from 'http-status';
import { invalidDataError } from '../errors/invalidData.error';
${
  extension === "ts"
    ? `import { NextFunction, Request, Response } from 'express';
import { ObjectSchema } from 'joi';`
    : ""
}

export function validateBody${extension === "ts" ? "<T>" : ""}(schema${
      extension === "ts" ? ": ObjectSchema<T>" : ""
    })${extension === "ts" ? ": ValidationMiddleware" : ""} {
  return validate(schema, 'body');
}

export function validateParams${extension === "ts" ? "<T>" : ""}(schema${
      extension === "ts" ? ": ObjectSchema<T>" : ""
    })${extension === "ts" ? ": ValidationMiddleware" : ""} {
  return validate(schema, 'params');
}

function validate(schema${extension === "ts" ? ": ObjectSchema" : ""}, type${
      extension === "ts" ? ":'body' | 'params'" : ""
    }) {
  return (req${extension === "ts" ? ": Request" : ""}, res${
      extension === "ts" ? ": Response" : ""
    }, next${extension === "ts" ? ": NextFunction" : ""}) => {
    const { error } = schema.validate(req[type], {
      abortEarly: false,
    });

    if (!error) {
      next();
    } else {
      res.status(httpStatus.BAD_REQUEST).send(invalidDataError(error.details.map((d) => d.message)));
    }
  };
}

${
  extension === "ts"
    ? `type ValidationMiddleware = (req: Request, res: Response, next: NextFunction) => void;`
    : ""
}
    `,
    error: `${
      extension === "ts"
        ? `import { ApplicationError } from "../protocols";`
        : ""
    }

export function invalidDataError(
  details${extension === "ts" ? ": string[]" : ""}
)${extension === "ts" ? ": ApplicationInvalidateDataError" : ""} {
  return {
    name: "InvalidDataError",
    message: "Invalid data",
    details,
  };
}

${
  extension === "ts"
    ? `type ApplicationInvalidateDataError = ApplicationError & {
  details: string[];
};`
    : ""
}
    `,
    schema: `import Joi from "joi";

export const signInSchema = Joi.object${
      extension === "ts" ? "<GenericParam>" : ""
    }({
  id: Joi.number().required(),
});

${
  extension === "ts"
    ? `export type GenericParam = {
  id: number;
};`
    : ""
}
    `,
    config: `import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

export function loadEnv() {
  const path =
    process.env.NODE_ENV === 'test'
      ? '.env.test'
      : process.env.NODE_ENV === 'development'
      ? '.env.development'
      : '.env';

  const currentEnvs = dotenv.config({ path });
  dotenvExpand.expand(currentEnvs);
}
    `,
  };

  return template[foulder];
}

function replacePlurality(word) {
  switch (word) {
    case "controllers":
      return "controller";
    case "services":
      return "service";
    case "repositories":
      return "repository";
    case "routers":
      return "router";
    case "middlewares":
      return "middleware";
    case "errors":
      return "error";
    case "schemas":
      return "schema";
    case "configs":
      return "config";
    default:
      return "";
  }
}

function loading(bars) {
  const interval = setInterval(() => {
    bars.increment();
  }, 500);
  return interval;
}
