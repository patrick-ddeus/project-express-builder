/*!
 * accepts
 * Copyright(c) 2023 Patrick Fontes
 * MIT Licensed
 */

(async () => {
  /**
   * Command Line Inputs.
   * @default
   */

  const args = process.argv;
  const extension =
    args.includes("typescript") || args.includes("ts") ? "ts" : "js";
  const resource = args[args.length - 1] || "default";

  /**
   * Project Dependencies
   * @private
   */

  const { execa } = await import("execa");
  const fs = await import("fs");
  const path = await import("path");
  const inquirer = await import("inquirer");

  /**
   *  Project Name Inputs
   *  @default "project" {string}
   */

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

  /**
   * Project Folders and Files Structure
   * @name
   * @property {string|Array}  defaults.controller    -The default values for files in controllers foulder.
   * @property {String|Array}  defaults.services      - The default files in services foulder.
   * @property {String|Array}  defaults.repositories  - The default files in repositories foulder.
   * @property {String|Array}  defaults.routers       - The default files in routers foulder.
   * @property {String|Array}  defaults.middlewares   - The default files in middlewares foulder.
   * @property {String|Array}  defaults.errors        - The default files in errors foulder.
   * @property {String|Array}  defaults.schemas       - The default files in schemas foulder.
   * @property {String|Array}  defaults.configs       - The default files in configs foulder.
   *
   * if you want to add more foulders and files you must change
   * these functions
   * @see {@link replacePlurality}
   * @see {@link constructorTemplate}
   */

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

  /**
   * ProgressBar initializer
   * @summary only for design purposes
   *
   */

  const cliProgress = await import("cli-progress");
  const bar1 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );

  bar1.start(100, 0);
  const isLoading = loading(bar1);

  /**
   * @summary Starting point of the application, 
   * here goes all the logic for creating and packaging folders and files
   * @try make foulders and files
   */

  try {
    // Main project path

    const sourcePath = path.resolve(projectName, "src");

    // no path found, makes one
    if (!fs.existsSync(sourcePath)) {
      fs.mkdirSync(sourcePath, { recursive: true });
    }

    // write app.ts file in src foulder
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

    // write server.ts file in src foulder
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

    /**
     * no node_modules, use execa dependence to run npm commands.
     * Improves time of code running when project has already a 
     * node_modules
     * */
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


    /**
     * Iterate above structure object @see {@link structure} 
     * */ 
    for (let [foulder, file] of Object.entries(structure)) {

      // fullPath is foulder path example: project/src/controller
      const fullPath = `${sourcePath}/${foulder}`;

      // no path of foulder, makes one
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(`${sourcePath}/${foulder}`);
      }

      /**
       * @summary Write a file inside the @see @constant {fullPath}
       * using both @see {@link constructorTemplate} 
       * and @see {@link replacePlurality} for creating a file template based on
       * foulder name, resource and type of project (extension)
       */

      fs.writeFileSync(
        `${sourcePath}/${foulder}/${file}`,
        constructorTemplate(replacePlurality(foulder), resource, extension)
      );

      // filtering when foulder being iterate is routers
      if (foulder === "routers") {

        // path of index router used to 
        const indexRouterPath = `${sourcePath}/${foulder}/index.router.${extension}`;

        // no indexRouterPath, makes one
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

        /**
         * @summary the code below was made to handle the 
         * creation of dynamic routes when executing the command
         */
        fs.readFile(indexRouterPath, "utf8", (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          const newRouteCode = `IndexRouter.use(${resource}Router)`;

          const routeMarker =
            "// You can add more routes but don't change this comment (index)";

          // regex to find marker
          const regex =
            /\/\/\s*You can add more routes but don't change this comment \(index\)/gm;

          /**
           *  @summary check regex to find the marker and make sure the data 
           * don't have the same newRouteCode to avoid duplicates
           * */ 
          if (regex.test(data) && !data.includes(newRouteCode)) {

            // find the marker and update with new route and new marker
            const updatedRouter = data.replace(
              regex,
              newRouteCode + "\n" + routeMarker
            );
            
            const regexForImports =
              /\/\/\s*You can add more routes but don't change this comment \(import\)/gm;

            const newImport = `import { ${resource}Router } from "./${resource}.router";`;

            // check regex to find marker and make sure that data doesn't have duplicates
            if (regexForImports.test(data) && !data.includes(newImport)) {
              const importsMark =
                "// You can add more routes but don't change this comment (import)";

              // find the marker and update with new route and new marker
              const updatedImport = updatedRouter.replace(
                regexForImports,
                newImport + "\n" + importsMark
              );
              
              // write the file again with all modifications
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

/**
 * Returns a template of given @param foulder {string}
 *
 * @param foulder {string} - foulder name
 * @param resource {string} - resource name being created; @example ("posts" | "publications")
 * @param extension {string} - extension used to template based on typescript or javascript args;
 *
 * @public
 *
 * @returns {string}
 */

function constructorTemplate(foulder, resource = "default", extension = "js") {
  const template = {
    controller: `import ${resource}Service from '../services/${resource}.service';
${extension === "ts" ? 'import { Request, Response } from "express";' : ""}

async function create(req${extension === "ts" ? ": Request" : ""}, res${
      extension === "ts" ? ": Response" : ""
    }) {
  const body = req.body ${extension === "ts" ? "as BodyParams" : ""}
  try {
    const data = await ${resource}Service.create(body);
    res.status(201).json(data);
  } catch (error) {
    res.sendStatus(500);
  }
}

async function read(req${extension === "ts" ? ": Request" : ""}, res${
      extension === "ts" ? ": Response" : ""
    }) {
  try {
    const data = await ${resource}Service.read();
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
    const data = await ${resource}Service.readOne(+id);
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
    const data = await ${resource}Service.update(+id, update);
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
    const data = await ${resource}Service.remove(+id);
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
    service: `import ${resource}Repository from '../repositories/${resource}.repository';
import { BodyParams, UpdateBodyParams } from '../controllers/${resource}.controller';

async function create(body${extension === "ts" ? ": BodyParams" : ""}) {
  return ${resource}Repository.create();
}

async function read() {
  return ${resource}Repository.list();
}

async function readOne(id${extension === "ts" ? ": number" : ""}) {
  return ${resource}Repository.listOne();
}

async function update(id${extension === "ts" ? ": number" : ""}, body${
      extension === "ts" ? ": UpdateBodyParams" : ""
    }) {
  return ${resource}Repository.update();
}

async function remove(id${extension === "ts" ? ": number" : ""}) {
  return ${resource}Repository.remove();
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
import ${resource}Controller from "../controllers/${resource}.controller";
import { validateParams } from "../middlewares/validation.middleware";
import { signInSchema } from "../schemas/params.schema";

const ${resource}Router = Router();

${resource}Router.get("/${resource}", ${resource}Controller.read);
${resource}Router.get("/${resource}/:id", validateParams(signInSchema), ${resource}Controller.readOne);
${resource}Router.post("/${resource}", ${resource}Controller.create);
${resource}Router.patch("/${resource}/:id", validateParams(signInSchema), ${resource}Controller.update);
${resource}Router.delete("/${resource}/:id", validateParams(signInSchema), ${resource}Controller.remove);

export { ${resource}Router };    
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

/**
 * Returns file name extension based on word parameter
 *
 * replacePlurality("controllers")
 * @example
 *  // returns controller
 * @param {string}
 * @public
 * @returns {string}
 */

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

/**
 * utility function for loading
 * @param {*} bars 
 * @returns 
 */
function loading(bars) {
  const interval = setInterval(() => {
    bars.increment();
  }, 500);
  return interval;
}
