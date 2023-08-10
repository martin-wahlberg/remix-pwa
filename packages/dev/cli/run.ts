/* eslint-disable no-case-declarations */
import arg from 'arg';
import { bold, gray, green, magenta, red, underline, whiteBright } from 'colorette';
import { prompt } from 'enquirer';
import { pathExists } from 'fs-extra';
import { resolve } from 'path';

import * as commands from './commands.js';
import { detectPackageManager } from './detectPkgManager.js';

// Todo(ShafSpecs): Update this later
const helpText = `
${bold(
  magenta(`______               _       ______ _    _  ___
| ___ \\             (_)      | ___ \\ |  | |/ _ \\
| |_/ /___ _ __ ___  ___  __ | |_/ / |  | / /_\\ \\
|    // _ \\ '_ \` _ \\| \\ \\/ / |  __/| |/\\| |  _  |
| |\\ \\  __/ | | | | | |>  <  | |   \\  /\\  / | | |
\\_| \\_\\___|_| |_| |_|_/_/\\_\\ \\_|    \\/  \\/\\_| |_/
`)
)}

Usage:  npx remix-pwa@latest [OPTIONS]

A stand-alone package for integrating PWA solutions into Remix application.

${underline(whiteBright('Options:'))}
--typescript, --ts              Create project with typescript template
--no-typescript, --no-ts, --js  Create project with javascript template
--workbox                       Integrate workbox into your project
--no-workbox                    Skip integrating workbox into your project
--install                       Install dependencies after creating the project
--no-install                    Skip the installation process
--package-manager, --pm         Preferred package manager if your project is not using any
--precache                      Wether you would like to utilise the precache feature
--dir                           The location of your Remix \`app\` directory
--help, -h                      Print this help message and exit
--version, -v                   Print the CLI version and exit
--docs                          Print the link to the remix-pwa docs and exit`;

type PWAFeatures = 'sw' | 'manifest' | 'push' | 'utils' | 'icons';

export async function run(argv: string[] = process.argv.slice(2), projectDir: string = process.cwd()) {
  // todo: Allow passing configs via CLI like minify build, worker path, etc.
  const args = arg(
    {
      // create - init
      '--help': Boolean,
      '--version': Boolean,
      '--typescript': Boolean,
      '--no-typescript': Boolean,
      '--workbox': Boolean,
      '--no-workbox': Boolean,
      '--install': Boolean,
      '--no-install': Boolean,
      '--docs': Boolean,
      '--precache': Boolean,
      // '--features': String,
      '--dir': String,
      '--package-manager': String,
      // Aliases for aboves
      '-h': '--help',
      '-v': '--version',
      '--ts': '--typescript',
      // '--feat': '--features',
      '--no-ts': '--no-typescript',
      '--js': '--no-typescript',
      '--pm': '--package-manager',

      // options for dev & build... (wip)
    },
    { argv }
  );

  const input = args._;
  let packageManager = (await detectPackageManager(projectDir)) ?? 'npm';

  const flags: any = Object.entries(args).reduce((acc, [key, value]) => {
    key = key.replace(/^--/, '');
    acc[key] = value;
    return acc;
  }, {} as any);

  if (flags.help) {
    console.log(helpText);
    return;
  }

  if (flags.version) {
    // Todo: Get the version from package.json - for remix-pwa
    return;
  }

  if (flags.docs) {
    console.log('https://remix-pwa-docs.vercel.app');
    return;
  }

  if (args['--ts']) {
    flags.typescript = true;
  }

  if (args['--no-typescript'] || args['--js'] || args['--no-ts']) {
    flags.typescript = false;
  }

  if (args['--no-workbox']) {
    flags.workbox = false;
  }

  if (args['--no-install']) {
    flags.install = false;
  }

  if (args['--pm']) {
    packageManager = args['--pm'];
  }

  if (args['--package-manager']) {
    // @ts-ignore
    packageManager = args['--package-manager'];
  }

  const cmd = input[0];

  switch (cmd) {
    case 'dev':
      break;
    case 'build':
      break;
    case 'push':
      break; // A delayed todo: More or less init push api and a test server route
    case 'init':
    case 'new':
    case 'create':
    default: // Todo: Add a better error message - Deprecating this. For now tho, it would be the same as create
      if (cmd !== 'create' && cmd !== 'init' && cmd !== 'new') {
        console.warn(red('This command is getting deprecated soon. Please use `create` instead.'));
      }

      // const featLookup: Record<PWAFeatures, string> = {
      //   sw: 'Service Workers',
      //   manifest: 'Web Manifest',
      //   push: 'Push Notifications',
      //   utils: 'PWA Client Utilities',
      //   icons: 'Development Icons',
      // };

      // const feat: PWAFeatures[] | null =
      //   (args['--features'] &&
      //     args['--features']
      //       .replace(/,\s/g, ',')
      //       .split(',')
      //       // @ts-ignore
      //       .filter((elem: string) => typeof featLookup[elem] !== 'undefined')
      //       // @ts-ignore
      //       .map((feat: string) => featLookup[feat])) ||
      //   null;

      const inquiry = await prompt<{
        lang: 'ts' | 'js';
        workbox: boolean;
        install: boolean;
        precache: boolean;
        features: PWAFeatures[];
        dir: string;
        packageManager: string;
      }>([
        {
          type: 'list',
          name: 'lang',
          message: 'Is this a TypeScript or JavaScript project? Pick the opposite for chaos!',
          skip: flags.typescript !== undefined,
          choices: [
            {
              name: 'TypeScript',
              value: 'ts',
            },
            {
              name: 'JavaScript',
              value: 'js',
            },
          ],
        },
        {
          type: 'confirm',
          name: 'workbox',
          message: 'Do you want to integrate workbox into your project?',
          initial: false,
          skip: flags.workbox !== undefined,
        },
        {
          type: 'confirm',
          name: 'precache',
          message: 'Do you want to utilise precaching in this project?',
          initial: false,
          skip: flags.precache !== undefined,
        },
        /**
         * Passing skip option to multiselect throws an error below is the workaround
         * until this get resolved https://github.com/enquirer/enquirer/issues/339
         *
         * But this syntax breaks the entire prompt. So, we are not using it for now.
         */
        // ...(feat === null
        //   ? [
        //       {
        //         name: 'feat',
        //         type: 'multiselect',
        //         // @ts-ignore
        //         hint: '(Use <space> to select, <return> to submit)',
        //         message: "What features of remix-pwa do you need? Don't be afraid to pick all!",
        //         indicator(state: any, choice: any) {
        //           return choice.enabled ? ' ' + chalk.green('✔') : ' ' + chalk.gray('o');
        //         },
        //         choices: [
        //           {
        //             name: 'Service Workers',
        //             value: 'sw',
        //           },
        //           {
        //             name: 'Web Manifest',
        //             value: 'manifest',
        //           },
        //           {
        //             name: 'Push Notifications',
        //             value: 'push',
        //           },
        //           {
        //             name: 'PWA Client Utilities',
        //             value: 'utils',
        //           },
        //           {
        //             name: 'Development Icons',
        //             value: 'icons',
        //           },
        //         ],
        //         initialChoices: ['sw', 'manifest'],
        //       },
        //     ]
        //   : []),
        {
          name: 'feat',
          type: 'multiselect',
          // @ts-ignore
          hint: '(Use <space> to select, <return> to submit)',
          message: "What features of remix-pwa do you need? Don't be afraid to pick all!",
          indicator(_: any, choice: any) {
            return choice.enabled ? ' ' + green('✔') : ' ' + gray('o');
          },
          choices: [
            {
              name: 'Service Workers',
              value: 'sw',
            },
            {
              name: 'Web Manifest',
              value: 'manifest',
            },
            {
              name: 'Push Notifications',
              value: 'push',
            },
            {
              name: 'PWA Client Utilities',
              value: 'utils',
            },
            {
              name: 'Development Icons',
              value: 'icons',
            },
          ],
          initialChoices: ['sw', 'manifest'],
        },
        {
          type: 'input',
          name: 'dir',
          message: 'Where is your Remix `app` directory located?',
          initial: 'app',
          skip: flags.dir !== undefined,
          validate(input: string) {
            if (input === '') {
              return 'Please enter a valid directory';
            }

            pathExists(resolve(projectDir, input)).then(exists => {
              if (!exists) {
                return 'Please enter a valid directory';
              }
            });

            return true;
          },
          format(value) {
            return value.replace(/^\/|\/$/g, '');
          },
        },
        {
          name: 'packageManager',
          type: 'list',
          message: 'What package manager do you use?',
          // @ts-ignore This package is broken af
          choices: [
            {
              name: 'Npm',
              value: 'npm',
            },
            {
              name: 'Yarn',
              value: 'yarn',
            },
            {
              name: 'Pnpm',
              value: 'pnpm',
            },
          ],
          initial: 'npm',
          skip: args['--package-manager'] !== undefined && (await detectPackageManager(projectDir)) !== undefined,
        },
        {
          type: 'confirm',
          name: 'install',
          message: `Do you want to run ${packageManager} install?`,
          initial: true,
          skip: flags.install !== undefined,
        },
      ]).catch(err => {
        if (err.isTtyError) {
          console.error(
            red(
              "💥 Your terminal doesn't support interactivity! Prompt couldn't be rendered in the current environment"
            )
          );

          return {
            lang: 'ts',
            workbox: false,
            install: true,
            precache: false,
            features: ['sw', 'manifest'],
            dir: 'app',
            packageManager,
          };
        }

        throw err;
      });

      const lang = flags.typescript === false ? 'js' : flags.typescript === true ? 'ts' : null;

      const workbox = flags.workbox === false ? false : flags.workbox === true ? true : null;

      const install = flags.install === false ? false : flags.install === true ? true : null;

      const precache = flags.precache === false ? false : flags.precache === true ? true : null;

      const dir: string | null = flags.dir || null;

      const initialChoices = {
        ...(lang ? { lang } : {}),
        ...(workbox ? { workbox } : {}),
        ...(install ? { install } : {}),
        ...(precache ? { precache } : {}),
        ...(dir ? { dir } : {}),
      };

      const answer = { ...inquiry, ...initialChoices };

      commands.init(answer);

    // Todo: Run the create command
  }
}