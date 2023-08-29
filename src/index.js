function constructorTemplate(e,t="default",r="js"){let s={controller:`import ${t}Service from '../services/${t}.service';
${"ts"===r?'import { Request, Response } from "express";':""}

async function create(req${"ts"===r?": Request":""}, res${"ts"===r?": Response":""}) {
  const body = req.body ${"ts"===r?"as BodyParams":""}
  try {
    const data = await ${t}Service.create(body);
    res.status(201).json(data);
  } catch (error) {
    res.sendStatus(500);
  }
}

async function read(req${"ts"===r?": Request":""}, res${"ts"===r?": Response":""}) {
  try {
    const data = await ${t}Service.read();
    res.status(200).json(data);
  } catch (error) {
    res.sendStatus(500);
  }
}

async function readOne(req${"ts"===r?": Request":""}, res${"ts"===r?": Response":""}) {
  const { id } = req.params;

  try {
    const data = await ${t}Service.readOne(+id);
    res.status(200).json(data);
  } catch (error) {
    res.sendStatus(500);
  }
}

async function update(req${"ts"===r?": Request":""}, res${"ts"===r?": Response":""}) {
  const { id } = req.params;
  const update = req.body
  
  try {
    const data = await ${t}Service.update(+id, update);
    res.status(200).json(data);
  } catch (error) {
    res.sendStatus(500);
  }
}

async function remove(req${"ts"===r?": Request":""}, res${"ts"===r?": Response":""}) {
  const { id } = req.params;

  try {
    const data = await ${t}Service.remove(+id);
    res.status(200).json(data);
  } catch (error) {
    res.sendStatus(500);
  }
}
${"ts"===r?`export type BodyParams = {};
export type UpdateBodyParams = Partial<BodyParams>;`:""}

export default {
  create,
  readOne,
  read,
  update,
  remove,
};  
  `,service:`import ${t}Repository from '../repositories/${t}.repository';
import { BodyParams, UpdateBodyParams } from '../controllers/${t}.controller';

async function create(body${"ts"===r?": BodyParams":""}) {
  return ${t}Repository.create();
}

async function read() {
  return ${t}Repository.list();
}

async function readOne(id${"ts"===r?": number":""}) {
  return ${t}Repository.listOne(id);
}

async function update(id${"ts"===r?": number":""}, body${"ts"===r?": UpdateBodyParams":""}) {
  return ${t}Repository.update();
}

async function remove(id${"ts"===r?": number":""}) {
  return ${t}Repository.remove();
}

export default {
  create,
  readOne,
  read,
  update,
  remove,
};
`,repository:`async function create() {
  return "Created!";
}

async function list() {
  return "Read data";
}

async function listOne(id: number) {
  return \`Read one data\${id}\`;
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
`,router:`import { Router } from "express";
import ${t}Controller from "../controllers/${t}.controller";
import { validateParams } from "../middlewares/validation.middleware";
import { signInSchema } from "../schemas/params.schema";

const ${t}Router = Router();

${t}Router.get("/${t}", ${t}Controller.read);
${t}Router.get("/${t}/:id", validateParams(signInSchema), ${t}Controller.readOne);
${t}Router.post("/${t}", ${t}Controller.create);
${t}Router.patch("/${t}/:id", validateParams(signInSchema), ${t}Controller.update);
${t}Router.delete("/${t}/:id", validateParams(signInSchema), ${t}Controller.remove);

export { ${t}Router };    
`,middleware:`import httpStatus from 'http-status';
import { invalidDataError } from '../errors/invalidData.error';
${"ts"===r?`import { NextFunction, Request, Response } from 'express';
import { ObjectSchema } from 'joi';`:""}

export function validateBody${"ts"===r?"<T>":""}(schema${"ts"===r?": ObjectSchema<T>":""})${"ts"===r?": ValidationMiddleware":""} {
  return validate(schema, 'body');
}

export function validateParams${"ts"===r?"<T>":""}(schema${"ts"===r?": ObjectSchema<T>":""})${"ts"===r?": ValidationMiddleware":""} {
  return validate(schema, 'params');
}

function validate(schema${"ts"===r?": ObjectSchema":""}, type${"ts"===r?":'body' | 'params'":""}) {
  return (req${"ts"===r?": Request":""}, res${"ts"===r?": Response":""}, next${"ts"===r?": NextFunction":""}) => {
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

${"ts"===r?"type ValidationMiddleware = (req: Request, res: Response, next: NextFunction) => void;":""}
    `,error:`${"ts"===r?'import { ApplicationError } from "../protocols";':""}

export function invalidDataError(
  details${"ts"===r?": string[]":""}
)${"ts"===r?": ApplicationInvalidateDataError":""} {
  return {
    name: "InvalidDataError",
    message: "Invalid data",
    details,
  };
}

${"ts"===r?`type ApplicationInvalidateDataError = ApplicationError & {
  details: string[];
};`:""}
    `,schema:`import Joi from "joi";

export const signInSchema = Joi.object${"ts"===r?"<GenericParam>":""}({
  id: Joi.number().required(),
});

${"ts"===r?`export type GenericParam = {
  id: number;
};`:""}
    `,config:`import dotenv from 'dotenv';
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
    `};return s[e]}function replacePlurality(e){switch(e){case"controllers":return"controller";case"services":return"service";case"repositories":return"repository";case"routers":return"router";case"middlewares":return"middleware";case"errors":return"error";case"schemas":return"schema";case"configs":return"config";default:return""}}function loading(e){let t=setInterval(()=>{e.increment()},500);return t}(async()=>{let e=process.argv,t=e.includes("typescript")||e.includes("ts")?"ts":"js",r=e[e.length-1]||"default",s={controllers:`${r}.controller.${t}`,services:`${r}.service.${t}`,repositories:`${r}.repository.${t}`,routers:`${r}.router.${t}`,middlewares:`validation.middleware.${t}`,errors:`invalidData.error.${t}`,schemas:`params.schema.${t}`,configs:"index.ts"},{execa:o}=await import("execa"),a=await import("fs"),n=await import("path"),i=await import("inquirer"),c=i.createPromptModule(),d="project";if(!e.includes("-i")){let{project:p}=await c({type:"input",name:"project",message:"Nome do projeto:"});d=p}let l=await import("cli-progress"),u=new l.SingleBar({},l.Presets.shades_classic);u.start(100,0);let m=loading(u);try{let y=n.resolve(d,"src");for(let[f,v]of(a.existsSync(y)||a.mkdirSync(y,{recursive:!0}),a.writeFileSync(n.resolve(d,"src",`app.${t}`),`import express, { Express } from "express";
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
      `),a.writeFileSync(n.resolve(d,"src",`server.${t}`),`import app, { init } from './app';

const port = +process.env.PORT || 4000;

init().then(() => {
  app.listen(port, () => {
    /* eslint-disable-next-line no-console */
    console.log(\`Server is listening on port \${port}.\`);
  });
});
      `),a.existsSync("/node_modules")||(await o("npm",["init","-y"],{cwd:d}),await o("npm",["i","express","http-status","joi","dotenv","cors","dotenv-expand",],{cwd:d}),await o("npm",["i","-D","nodemon"],{cwd:d}),"ts"===t&&(await o("npm",["i","-D","typescript","typescript-transform-paths","ts-node","tsconfig-paths","ttypescript","typescript-transform-paths",],{cwd:d}),await o("npm",["i","-D","@types/express","@types/node","@types/cors","@types/dotenv","cross-env",],{cwd:d}),await o("npx",["gitignore","node"],{cwd:d}),u.update(50),a.writeFileSync(n.resolve(d,"tsconfig.json"),JSON.stringify({compilerOptions:{target:"es2020",module:"commonjs",outDir:"dist",noImplicitAny:!0,emitDecoratorMetadata:!0,experimentalDecorators:!0,esModuleInterop:!0,rootDirs:["src","tests"],baseUrl:"src",paths:{"@/*":["*"]},plugins:[{transform:"typescript-transform-paths"},]},include:["src","tests"]},null,2)),a.writeFileSync(n.resolve(d,"nodemon.json"),JSON.stringify({execMap:{ts:"node --require ts-node/register"}},null,2)),a.readFile(n.resolve(d,"package.json"),"utf8",(e,t)=>{if(e){console.error(e);return}let r=JSON.parse(t);r.scripts.dev="cross-env NODE_ENV=development nodemon ./src/server.ts'",r.scripts.start="node dist/server.js",r.scripts.build="tsc -p tsconfig.build.json",r.scripts.lint="eslint .",r.scripts.prebuild="rm -rf dist",delete r.scripts.test,a.writeFileSync(n.resolve(d,"package.json"),JSON.stringify(r,null,2))}),a.writeFileSync(n.resolve(d,"src","protocols.ts"),`export type ApplicationError = {
  name: string;
  message: string;
};
          `))),Object.entries(s))){let x=`${y}/${f}`;if(a.existsSync(x)||a.mkdirSync(`${y}/${f}`),a.writeFileSync(`${y}/${f}/${v}`,constructorTemplate(replacePlurality(f),r,t)),"routers"===f){let g=`${y}/${f}/index.router.${t}`;a.existsSync(g)||a.writeFileSync(g,`import { Router } from "express";
// You can add more routes but don't change this comment (import)

const IndexRouter = Router();

// You can add more routes but don't change this comment (index)

export default IndexRouter`),a.readFile(g,"utf8",(e,t)=>{if(e){console.error(e);return}let s=`IndexRouter.use(${r}Router)`,o=/\/\/\s*You can add more routes but don't change this comment \(index\)/gm;if(o.test(t)&&!t.includes(s)){let n=t.replace(o,s+"\n// You can add more routes but don't change this comment (index)"),i=/\/\/\s*You can add more routes but don't change this comment \(import\)/gm,c=`import { ${r}Router } from "./${r}.router";`;if(i.test(t)&&!t.includes(c)){let d=n.replace(i,c+"\n// You can add more routes but don't change this comment (import)");a.writeFile(g,d,"utf-8",e=>{if(e){console.error(e);return}console.log("New route added successfully.")})}}})}}u.update(100),u.stop(),clearInterval(m),console.log("         "),console.log("All Done!"),console.log("         "),console.log("Happy Hacking! ❤"),console.log("         "),console.log("         ")}catch(h){console.error(`ERROR: The command failed. stderr: ${h} (${h.exitCode})`),console.log(h),u.stop(),process.exit(1)}})();