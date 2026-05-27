import { ExpoConfig, ConfigContext } from 'expo/config';

import fs from 'fs';

import path from 'path';



/** Carga .env de frontend/ y, si hace falta, del monorepo (raíz del repo). */

function loadEnvFiles() {

  const candidates = [

    path.join(__dirname, '.env'),

    path.join(__dirname, '..', '.env'),

  ];

  for (const filePath of candidates) {

    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');

    for (const line of content.split('\n')) {

      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) continue;

      const eq = trimmed.indexOf('=');

      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();

      let value = trimmed.slice(eq + 1).trim();

      if (

        (value.startsWith('"') && value.endsWith('"')) ||

        (value.startsWith("'") && value.endsWith("'"))

      ) {

        value = value.slice(1, -1);

      }

      if (!process.env[key]) process.env[key] = value;

    }

  }

}



loadEnvFiles();



export default ({ config }: ConfigContext): ExpoConfig => ({

  ...config,

  name: 'Nosotros',

  slug: 'couple-app',

  scheme: 'coupleapp',

  extra: {

    ...config.extra,

    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,

    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

    eas: {

      projectId: process.env.EAS_PROJECT_ID ?? config.extra?.eas?.projectId,

    },

  },

  plugins: [...(config.plugins ?? [])],

});


